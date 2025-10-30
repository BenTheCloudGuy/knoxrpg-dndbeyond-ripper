const { app } = require('@azure/functions');
const { HeadlessPrinter } = require('../core/HeadlessPrinter');
const { StorageManager } = require('../core/StorageManager');
const { DnDBeyondAuth } = require('../core/DnDBeyondAuth');
const { v4: uuidv4 } = require('uuid');

/**
 * HTTP trigger function for processing multiple D&D Beyond sourcebooks in bulk
 * Creates individual PDFs for each sourcebook and stores them in Azure Storage
 */
app.http('processBulk', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'process-bulk',
    handler: async (request, context) => {
        const startTime = Date.now();
        context.log('Starting bulk processing request');
        
        try {
            // Parse request body
            const requestBody = await request.json();
            const { urls, userId, authToken, options = {} } = requestBody;
            
            // Validate required parameters
            if (!urls || !Array.isArray(urls) || urls.length === 0) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: 'urls parameter is required and must be a non-empty array'
                    })
                };
            }
            
            if (!userId || !authToken) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: 'Missing required parameters: userId and authToken are required'
                    })
                };
            }
            
            context.log(`Processing ${urls.length} sourcebooks for user ${userId}`);
            
            // Validate authentication once
            const auth = new DnDBeyondAuth();
            const isValidAuth = await auth.validateSession(authToken, userId);
            if (!isValidAuth) {
                context.log.warn(`Invalid authentication for user ${userId}`);
                return {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Invalid authentication' })
                };
            }
            
            const results = [];
            const printer = new HeadlessPrinter(options, context.log);
            const storage = new StorageManager();
            
            // Get delay settings from environment or use defaults
            const minDelay = parseInt(process.env.REQUEST_DELAY_MIN || '1000');
            const maxDelay = parseInt(process.env.REQUEST_DELAY_MAX || '3000');
            
            // Process each URL sequentially to avoid overwhelming D&D Beyond
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                const urlStartTime = Date.now();
                
                try {
                    context.log(`Processing ${i + 1}/${urls.length}: ${url}`);
                    
                    // Check access to this specific content
                    const hasAccess = await auth.checkContentAccess(url, authToken);
                    if (!hasAccess) {
                        context.log.warn(`Access denied to content: ${url}`);
                        results.push({
                            url,
                            success: false,
                            error: 'Access denied to content',
                            index: i + 1
                        });
                        continue;
                    }
                    
                    // Add delay between requests (except for the first one)
                    if (i > 0) {
                        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
                        context.log(`Waiting ${delay}ms before next request...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                    
                    // Process the sourcebook
                    const pdfBuffer = await printer.processSourcebook(url, authToken);
                    
                    // Generate unique filename
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const urlSlug = url.split('/').pop() || 'sourcebook';
                    const filename = `${userId}_${timestamp}_${urlSlug}_${uuidv4().substring(0, 8)}.pdf`;
                    
                    // Upload to storage
                    const uploadResult = await storage.uploadPdf(pdfBuffer, filename, {
                        userId,
                        sourceUrl: url,
                        processedAt: new Date().toISOString(),
                        processingTimeMs: Date.now() - urlStartTime,
                        bulkProcessingIndex: i + 1,
                        bulkProcessingTotal: urls.length,
                        options: JSON.stringify(options)
                    });
                    
                    results.push({
                        url,
                        success: true,
                        downloadUrl: uploadResult.url,
                        filename: uploadResult.filename,
                        size: pdfBuffer.length,
                        processingTimeMs: Date.now() - urlStartTime,
                        index: i + 1
                    });
                    
                    context.log(`Successfully processed ${i + 1}/${urls.length} in ${Date.now() - urlStartTime}ms`);
                    
                } catch (error) {
                    context.log.error(`Error processing ${url}:`, error);
                    results.push({
                        url,
                        success: false,
                        error: error.message,
                        processingTimeMs: Date.now() - urlStartTime,
                        index: i + 1
                    });
                }
            }
            
            // Clean up printer resources
            await printer.cleanup();
            
            const successCount = results.filter(r => r.success).length;
            const failureCount = results.length - successCount;
            
            context.log(`Bulk processing completed: ${successCount} success, ${failureCount} failures, total time: ${Date.now() - startTime}ms`);
            
            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: true,
                    summary: {
                        total: urls.length,
                        successful: successCount,
                        failed: failureCount,
                        totalProcessingTimeMs: Date.now() - startTime
                    },
                    results
                })
            };
            
        } catch (error) {
            context.log.error('Bulk processing error:', error);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: error.message,
                    processingTimeMs: Date.now() - startTime
                })
            };
        }
    }
});