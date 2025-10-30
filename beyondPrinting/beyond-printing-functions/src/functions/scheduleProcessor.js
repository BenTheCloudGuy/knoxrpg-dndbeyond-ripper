const { app } = require('@azure/functions');
const { StorageManager } = require('../core/StorageManager');

/**
 * Timer trigger function for scheduled maintenance tasks
 * Runs daily at 2 AM to clean up old files and perform maintenance
 */
app.timer('scheduleProcessor', {
    schedule: '0 0 2 * * *', // Daily at 2:00 AM
    handler: async (myTimer, context) => {
        const startTime = Date.now();
        context.log('Starting scheduled maintenance tasks');
        
        try {
            const storage = new StorageManager();
            
            // Get cleanup settings from environment
            const cleanupDays = parseInt(process.env.PDF_CLEANUP_DAYS || '30');
            
            context.log(`Cleaning up files older than ${cleanupDays} days`);
            
            // Clean up old files
            const cleanupResult = await storage.cleanupOldFiles(cleanupDays);
            
            // Log storage statistics
            const storageStats = await storage.getStorageStatistics();
            
            context.log('Scheduled maintenance completed', {
                duration: Date.now() - startTime,
                filesDeleted: cleanupResult.deletedCount,
                bytesFreed: cleanupResult.bytesFreed,
                storageStats
            });
            
            // If this is running in Azure, you could also send notifications
            // about the maintenance results to Application Insights or other monitoring systems
            
        } catch (error) {
            context.log.error('Error during scheduled maintenance:', error);
            
            // In a production environment, you might want to send alerts
            // when maintenance tasks fail
        }
    }
});