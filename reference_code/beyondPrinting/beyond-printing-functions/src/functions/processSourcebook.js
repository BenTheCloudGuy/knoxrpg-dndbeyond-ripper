const { app } = require('@azure/functions');
const { HeadlessPrinter } = require('../core/HeadlessPrinter');
const { StorageManager } = require('../core/StorageManager');
const { DnDBeyondAuth } = require('../core/DnDBeyondAuth');
const { v4: uuidv4 } = require('uuid');

/**
 * HTTP trigger function for processing a single D&D Beyond sourcebook
 * Converts sourcebook content to PDF and stores in Azure Storage
 */
app.http('processSourcebook', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'process-sourcebook',
    handler: async (request, context) => {
        const startTime = Date.now();
        context.log('Starting sourcebook processing request');
        
        try {
            // Parse request body
            const requestBody = await request.json();
            const { url, userId, authToken, options = {} } = requestBody;
            
            // Validate required parameters
            if (!url || !userId || !authToken) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: 'Missing required parameters: url, userId, and authToken are required'
                    })
                };
            }
            
            context.log(`Processing sourcebook for user ${userId}: ${url}`);
            
            // Validate authentication
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
            
            // Check user access to content
            const hasAccess = await auth.checkContentAccess(url, authToken);
            if (!hasAccess) {
                context.log.warn(`Access denied to content for user ${userId}: ${url}`);
                return {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Access denied to content' })
                };
            }
            
            // Process the sourcebook
            const printer = new HeadlessPrinter(options, context.log);
            const pdfBuffer = await printer.processSourcebook(url, authToken);
            
            // Generate unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${userId}_${timestamp}_${uuidv4().substring(0, 8)}.pdf`;
            
            // Upload to Azure Storage
            const storage = new StorageManager();
            const uploadResult = await storage.uploadPdf(pdfBuffer, filename, {
                userId,
                sourceUrl: url,
                processedAt: new Date().toISOString(),
                processingTimeMs: Date.now() - startTime,
                options: JSON.stringify(options)
            });
            
            context.log(`Successfully processed sourcebook in ${Date.now() - startTime}ms`);
            
            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: true,
                    downloadUrl: uploadResult.url,
                    filename: uploadResult.filename,
                    size: pdfBuffer.length,
                    processingTimeMs: Date.now() - startTime
                })
            };
            
        } catch (error) {
            context.log.error('Error processing sourcebook:', error);
            
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