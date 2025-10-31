const { app } = require('@azure/functions');
const { StorageManager } = require('../core/StorageManager');

/**
 * HTTP trigger function for checking the status of processed files
 * Returns information about files in storage for a given user
 */
app.http('checkStatus', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    route: 'check-status',
    handler: async (request, context) => {
        context.log('Checking file status');
        
        try {
            let userId, filename;
            
            // Handle both GET and POST requests
            if (request.method === 'GET') {
                userId = request.query.get('userId');
                filename = request.query.get('filename');
            } else {
                const requestBody = await request.json();
                userId = requestBody.userId;
                filename = requestBody.filename;
            }
            
            if (!userId) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: 'userId parameter is required'
                    })
                };
            }
            
            const storage = new StorageManager();
            
            if (filename) {
                // Check specific file
                context.log(`Checking status for file: ${filename}`);
                const fileInfo = await storage.getFileInfo(filename);
                
                if (!fileInfo) {
                    return {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            error: 'File not found'
                        })
                    };
                }
                
                // Generate download URL if file exists
                const downloadUrl = await storage.generateDownloadUrl(filename, 24); // 24 hour expiry
                
                return {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        success: true,
                        file: {
                            ...fileInfo,
                            downloadUrl
                        }
                    })
                };
                
            } else {
                // List all files for user
                context.log(`Listing all files for user: ${userId}`);
                const userFiles = await storage.listUserFiles(userId);
                
                // Generate download URLs for all files
                const filesWithUrls = await Promise.all(
                    userFiles.map(async (file) => ({
                        ...file,
                        downloadUrl: await storage.generateDownloadUrl(file.filename, 24)
                    }))
                );
                
                return {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        success: true,
                        userId,
                        fileCount: filesWithUrls.length,
                        files: filesWithUrls
                    })
                };
            }
            
        } catch (error) {
            context.log.error('Error checking status:', error);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: error.message
                })
            };
        }
    }
});