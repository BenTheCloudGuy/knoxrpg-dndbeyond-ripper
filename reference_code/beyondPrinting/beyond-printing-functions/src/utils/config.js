/**
 * Configuration management for the Beyond Printing Azure Functions
 * Centralizes environment variable access and provides defaults
 */
class Config {
    constructor() {
        this.env = process.env.NODE_ENV || 'development';
        this.isDevelopment = this.env === 'development';
        this.isProduction = this.env === 'production';
    }
    
    // Azure Storage Configuration
    get storageConnectionString() {
        return process.env.AZURE_STORAGE_CONNECTION_STRING;
    }
    
    get containerName() {
        return process.env.CONTAINER_NAME || 'dndbeyond-pdfs';
    }
    
    // D&D Beyond Configuration
    get sessionSecret() {
        return process.env.DNDBEYOND_SESSION_SECRET;
    }
    
    // Application Insights
    get appInsightsConnectionString() {
        return process.env.APPLICATION_INSIGHTS_CONNECTION_STRING;
    }
    
    // Processing Configuration
    get maxConcurrentRequests() {
        return parseInt(process.env.MAX_CONCURRENT_REQUESTS || '3');
    }
    
    get requestDelayMin() {
        return parseInt(process.env.REQUEST_DELAY_MIN || '1000');
    }
    
    get requestDelayMax() {
        return parseInt(process.env.REQUEST_DELAY_MAX || '3000');
    }
    
    get pdfCleanupDays() {
        return parseInt(process.env.PDF_CLEANUP_DAYS || '30');
    }
    
    // Function Timeout Configuration
    get functionTimeoutMs() {
        return parseInt(process.env.FUNCTION_TIMEOUT_MS || '600000'); // 10 minutes default
    }
    
    // PDF Generation Settings
    get defaultPdfOptions() {
        return {
            format: 'A4',
            printBackground: true,
            margin: { 
                top: '1cm', 
                bottom: '1cm', 
                left: '1.5cm', 
                right: '1.5cm' 
            },
            preferCSSPageSize: false
        };
    }
    
    // Browser Configuration
    get puppeteerConfig() {
        return {
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
            ],
            timeout: 60000
        };
    }
    
    // D&D Beyond Selectors
    get selectors() {
        return {
            TOC: '.compendium-toc-full-text',
            PAGE_CONTENT: '.page-content',
            MAIN_CONTENT: '.article-main .compendium-toc-full .compendium-toc-full-header',
            ACCESS_DENIED: '.access-denied, .purchase-required, .subscription-required',
            SOURCES_LISTING: 'a.sources-listing--item'
        };
    }
    
    // Validation
    validateRequiredConfig() {
        const required = [
            { name: 'AZURE_STORAGE_CONNECTION_STRING', value: this.storageConnectionString }
        ];
        
        const missing = required.filter(config => !config.value);
        
        if (missing.length > 0) {
            const missingNames = missing.map(config => config.name).join(', ');
            throw new Error(`Missing required configuration: ${missingNames}`);
        }
    }
    
    // Get all configuration for logging/debugging
    getAllConfig() {
        return {
            environment: this.env,
            containerName: this.containerName,
            maxConcurrentRequests: this.maxConcurrentRequests,
            requestDelayMin: this.requestDelayMin,
            requestDelayMax: this.requestDelayMax,
            pdfCleanupDays: this.pdfCleanupDays,
            functionTimeoutMs: this.functionTimeoutMs,
            hasStorageConnection: !!this.storageConnectionString,
            hasSessionSecret: !!this.sessionSecret,
            hasAppInsights: !!this.appInsightsConnectionString
        };
    }
}

// Export singleton instance
module.exports = new Config();