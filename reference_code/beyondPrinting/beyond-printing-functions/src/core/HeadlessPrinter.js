const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');

/**
 * HeadlessPrinter - Converts the original Chrome extension Printer logic
 * to work with headless browser automation for serverless environments
 */
class HeadlessPrinter {
    constructor(options = {}, logger = console) {
        // Merge default config with user options
        this.config = {
            minPageDelay: 1000,
            maxPageDelay: 3000,
            strippedTables: true,
            includeCover: true,
            includeIntroduction: true,
            includeBacklinks: true,
            includeTitle: true,
            includeForDndInTitle: true,
            includeUsername: true,
            includePrintedWithHint: true,
            failOnError: true,
            downloadHtml: false,
            includePlayerVersionMaps: true,
            useBigMapImages: true,
            headingOnNewPage: true,
            waitForUserConfirmationAfterPrint: false,
            version: 1,
            ...options
        };
        
        this.browser = null;
        this.page = null;
        this.logger = logger;
        
        // Selectors from original extension
        this.SELECTORS = {
            TOC: '.compendium-toc-full-text',
            PAGE_CONTENT: '.page-content',
            MAIN_CONTENT: '.article-main .compendium-toc-full .compendium-toc-full-header',
            ACCESS_DENIED: '.access-denied, .purchase-required, .subscription-required'
        };
    }
    
    /**
     * Initialize the headless browser
     */
    async initialize() {
        if (this.browser) {
            return; // Already initialized
        }
        
        this.logger('Initializing headless browser...');
        
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--no-first-run',
                '--no-zygote',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent and viewport to mimic a real browser
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Set longer timeouts for slow D&D Beyond pages
        this.page.setDefaultTimeout(60000);
        this.page.setDefaultNavigationTimeout(60000);
        
        this.logger('Browser initialized successfully');
    }
    
    /**
     * Main entry point for processing a sourcebook
     */
    async processSourcebook(url, authToken) {
        await this.initialize();
        
        try {
            this.logger(`Starting to process sourcebook: ${url}`);
            
            // Set authentication cookies
            await this.setAuthenticationCookies(authToken);
            
            // Navigate to the page
            await this.page.goto(url, { 
                waitUntil: 'networkidle0', 
                timeout: 60000 
            });
            
            // Check if content is accessible
            const hasAccess = await this.checkPageAccess();
            if (!hasAccess) {
                throw new Error('Access denied to content - user may not own this sourcebook');
            }
            
            // Wait for main content to load
            await this.page.waitForSelector(this.SELECTORS.PAGE_CONTENT, { timeout: 30000 });
            
            // Determine if this is a single page or multi-page sourcebook
            const isSinglePage = await this.isSinglePage();
            this.logger(`Detected ${isSinglePage ? 'single' : 'multi'}-page sourcebook`);
            
            if (isSinglePage) {
                return await this.processSinglePage();
            } else {
                return await this.processMultiPage(url);
            }
            
        } catch (error) {
            this.logger(`Error processing sourcebook: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Set authentication cookies from the token
     */
    async setAuthenticationCookies(authToken) {
        try {
            // Parse the auth token - this could be cookies or session data
            const authData = JSON.parse(authToken);
            
            if (Array.isArray(authData)) {
                // If it's an array of cookies
                await this.page.setCookie(...authData);
            } else if (authData.cookies) {
                // If it's an object with a cookies property
                await this.page.setCookie(...authData.cookies);
            } else {
                // If it's a single cookie object
                await this.page.setCookie(authData);
            }
            
            this.logger('Authentication cookies set successfully');
        } catch (error) {
            this.logger(`Warning: Could not set authentication cookies: ${error.message}`);
            // Continue anyway - some content might be publicly accessible
        }
    }
    
    /**
     * Check if the page shows access denied
     */
    async checkPageAccess() {
        // Wait a moment for any access denied messages to appear
        await this.page.waitForTimeout(2000);
        
        const accessDenied = await this.page.$(this.SELECTORS.ACCESS_DENIED);
        return !accessDenied;
    }
    
    /**
     * Check if this is a single page sourcebook (no table of contents)
     */
    async isSinglePage() {
        const tocElement = await this.page.$(this.SELECTORS.TOC);
        return !tocElement;
    }
    
    /**
     * Process a single page sourcebook
     */
    async processSinglePage() {
        this.logger('Processing single page sourcebook...');
        
        // Wait for all images to load
        await this.waitForImages();
        
        // Apply any CSS modifications for better PDF output
        await this.applyPdfStyles();
        
        // Generate PDF
        const pdf = await this.page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { 
                top: '1cm', 
                bottom: '1cm', 
                left: '1.5cm', 
                right: '1.5cm' 
            },
            preferCSSPageSize: false
        });
        
        this.logger('Single page PDF generated successfully');
        return pdf;
    }
    
    /**
     * Process a multi-page sourcebook by collecting all subpages
     */
    async processMultiPage(baseUrl) {
        this.logger('Processing multi-page sourcebook...');
        
        // Get all subpage links from the table of contents
        const subpageLinks = await this.page.$$eval(this.SELECTORS.TOC + ' a', 
            links => links.map(link => link.href).filter(href => href && href.includes('/sources/'))
        );
        
        this.logger(`Found ${subpageLinks.length} subpages to process`);
        
        let allContent = '';
        const basePageContent = await this.extractPageContent();
        
        if (this.config.includeCover && basePageContent) {
            allContent += basePageContent;
        }
        
        // Process each subpage
        for (let i = 0; i < subpageLinks.length; i++) {
            const link = subpageLinks[i];
            this.logger(`Processing subpage ${i + 1}/${subpageLinks.length}: ${link}`);
            
            try {
                // Add delay between requests
                if (i > 0) {
                    await this.waitForDelay();
                }
                
                await this.page.goto(link, { waitUntil: 'networkidle0', timeout: 60000 });
                
                // Wait for content to load
                await this.page.waitForSelector(this.SELECTORS.PAGE_CONTENT, { timeout: 30000 });
                await this.waitForImages();
                
                const pageContent = await this.extractPageContent();
                if (pageContent) {
                    if (this.config.headingOnNewPage && i > 0) {
                        allContent += '<div style="page-break-before: always;"></div>';
                    }
                    allContent += pageContent;
                }
                
            } catch (error) {
                this.logger(`Warning: Failed to process subpage ${link}: ${error.message}`);
                if (this.config.failOnError) {
                    throw error;
                }
            }
        }
        
        // Create a new page with all compiled content
        const compiledPage = await this.browser.newPage();
        const fullHtml = this.wrapContentForPdf(allContent, baseUrl);
        
        await compiledPage.setContent(fullHtml, { waitUntil: 'networkidle0' });
        await compiledPage.waitForTimeout(2000); // Let content settle
        
        // Apply PDF styles
        await this.applyPdfStyles(compiledPage);
        
        const pdf = await compiledPage.pdf({
            format: 'A4',
            printBackground: true,
            margin: { 
                top: '1cm', 
                bottom: '1cm', 
                left: '1.5cm', 
                right: '1.5cm' 
            },
            preferCSSPageSize: false
        });
        
        await compiledPage.close();
        
        this.logger('Multi-page PDF generated successfully');
        return pdf;
    }
    
    /**
     * Extract content from the current page
     */
    async extractPageContent() {
        return await this.page.evaluate(() => {
            const content = document.querySelector('.page-content, .article-main');
            return content ? content.innerHTML : '';
        });
    }
    
    /**
     * Wrap extracted content in a complete HTML document
     */
    wrapContentForPdf(content, baseUrl) {
        const title = this.config.includeTitle ? 'D&D Beyond Content' : '';
        const userInfo = this.config.includeUsername ? '<!-- Generated by Beyond Printing -->' : '';
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${title}</title>
                <base href="https://www.dndbeyond.com/">
                <style>
                    body { 
                        font-family: "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
                        line-height: 1.5;
                        color: #333;
                        max-width: 100%;
                    }
                    .page-break { page-break-before: always; }
                    img { max-width: 100%; height: auto; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                    .compendium-toc-full { display: none; }
                    .page-header { display: none; }
                    .site-header { display: none; }
                    .site-footer { display: none; }
                </style>
            </head>
            <body>
                ${userInfo}
                ${content}
            </body>
            </html>
        `;
    }
    
    /**
     * Apply CSS styles optimized for PDF generation
     */
    async applyPdfStyles(page = this.page) {
        await page.addStyleTag({
            content: `
                .site-header, .site-footer, .page-header, .compendium-toc-full,
                .advertisement, .ads, .social-share { display: none !important; }
                
                body { font-size: 12px !important; }
                
                img { max-width: 100% !important; height: auto !important; }
                
                table { border-collapse: collapse !important; }
                
                .page-content { max-width: none !important; }
            `
        });
    }
    
    /**
     * Wait for all images on the page to load
     */
    async waitForImages() {
        await this.page.evaluate(() => {
            return Promise.all(Array.from(document.images, img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve; // Resolve even on error to prevent hanging
                });
            }));
        });
    }
    
    /**
     * Wait for a random delay between requests
     */
    async waitForDelay() {
        const delay = Math.random() * (this.config.maxPageDelay - this.config.minPageDelay) + this.config.minPageDelay;
        this.logger(`Waiting ${Math.round(delay)}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    /**
     * Clean up browser resources
     */
    async cleanup() {
        if (this.browser) {
            this.logger('Cleaning up browser resources...');
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

module.exports = { HeadlessPrinter };