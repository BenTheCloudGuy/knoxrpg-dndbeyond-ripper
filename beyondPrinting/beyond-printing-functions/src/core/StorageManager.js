const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

/**
 * StorageManager - Handles all Azure Storage operations for PDF files
 * Including upload, download URL generation, file listing, and cleanup
 */
class StorageManager {
    constructor() {
        this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        this.containerName = process.env.CONTAINER_NAME || 'dndbeyond-pdfs';
        
        if (!this.connectionString) {
            throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is required');
        }
        
        this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
        this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    }
    
    /**
     * Initialize storage container
     */
    async initialize() {
        // Ensure container exists with private access
        await this.containerClient.createIfNotExists({
            access: 'private'
        });
    }
    
    /**
     * Upload a PDF buffer to Azure Storage
     */
    async uploadPdf(pdfBuffer, filename, metadata = {}) {
        await this.initialize();
        
        const blobClient = this.containerClient.getBlockBlobClient(filename);
        
        // Prepare metadata
        const blobMetadata = {
            contentType: 'application/pdf',
            uploadedAt: new Date().toISOString(),
            fileSize: pdfBuffer.length.toString(),
            ...metadata
        };
        
        // Upload the PDF
        const uploadResponse = await blobClient.upload(pdfBuffer, pdfBuffer.length, {
            blobHTTPHeaders: {
                blobContentType: 'application/pdf',
                blobContentDisposition: `attachment; filename="${filename}"`,
                blobCacheControl: 'private, max-age=3600'
            },
            metadata: blobMetadata
        });
        
        return {
            url: blobClient.url,
            filename,
            size: pdfBuffer.length,
            uploadedAt: new Date().toISOString(),
            etag: uploadResponse.etag,
            requestId: uploadResponse.requestId
        };
    }
    
    /**
     * Generate a secure download URL with SAS token
     */
    async generateDownloadUrl(filename, expirationHours = 24) {
        const blobClient = this.containerClient.getBlockBlobClient(filename);
        
        // Check if blob exists
        const exists = await blobClient.exists();
        if (!exists) {
            throw new Error(`File ${filename} not found`);
        }
        
        // Generate SAS URL for secure download
        const sasUrl = await blobClient.generateSasUrl({
            permissions: BlobSASPermissions.parse('r'), // Read only
            expiresOn: new Date(Date.now() + expirationHours * 60 * 60 * 1000)
        });
        
        return sasUrl;
    }
    
    /**
     * Get file information
     */
    async getFileInfo(filename) {
        const blobClient = this.containerClient.getBlockBlobClient(filename);
        
        try {
            const properties = await blobClient.getProperties();
            
            return {
                filename,
                size: properties.contentLength,
                lastModified: properties.lastModified,
                contentType: properties.contentType,
                metadata: properties.metadata,
                etag: properties.etag
            };
        } catch (error) {
            if (error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }
    
    /**
     * List all files for a specific user
     */
    async listUserFiles(userId, maxResults = 100) {
        const files = [];
        
        // List blobs with the user prefix
        const listOptions = {
            prefix: `${userId}_`,
            maxPageSize: maxResults
        };
        
        for await (const blob of this.containerClient.listBlobsFlat(listOptions)) {
            files.push({
                filename: blob.name,
                size: blob.properties.contentLength,
                lastModified: blob.properties.lastModified,
                contentType: blob.properties.contentType,
                metadata: blob.metadata
            });
        }
        
        // Sort by last modified date (newest first)
        files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        
        return files;
    }
    
    /**
     * Clean up old files
     */
    async cleanupOldFiles(daysOld = 30) {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        
        let deletedCount = 0;
        let bytesFreed = 0;
        
        for await (const blob of this.containerClient.listBlobsFlat()) {
            if (blob.properties.lastModified < cutoffDate) {
                const blobClient = this.containerClient.getBlockBlobClient(blob.name);
                
                try {
                    await blobClient.delete();
                    deletedCount++;
                    bytesFreed += blob.properties.contentLength || 0;
                    
                    console.log(`Deleted old file: ${blob.name} (${this.formatBytes(blob.properties.contentLength)})`);
                } catch (error) {
                    console.error(`Failed to delete ${blob.name}:`, error.message);
                }
            }
        }
        
        return {
            deletedCount,
            bytesFreed,
            formattedBytesFreed: this.formatBytes(bytesFreed)
        };
    }
    
    /**
     * Get storage statistics
     */
    async getStorageStatistics() {
        let totalFiles = 0;
        let totalSize = 0;
        const userStats = {};
        
        for await (const blob of this.containerClient.listBlobsFlat()) {
            totalFiles++;
            totalSize += blob.properties.contentLength || 0;
            
            // Extract user ID from filename (assuming format: userId_timestamp_...)
            const userIdMatch = blob.name.match(/^([^_]+)_/);
            if (userIdMatch) {
                const userId = userIdMatch[1];
                if (!userStats[userId]) {
                    userStats[userId] = { files: 0, size: 0 };
                }
                userStats[userId].files++;
                userStats[userId].size += blob.properties.contentLength || 0;
            }
        }
        
        return {
            totalFiles,
            totalSize,
            formattedTotalSize: this.formatBytes(totalSize),
            userStats,
            containerName: this.containerName
        };
    }
    
    /**
     * Delete a specific file
     */
    async deleteFile(filename) {
        const blobClient = this.containerClient.getBlockBlobClient(filename);
        
        const deleteResponse = await blobClient.delete();
        
        return {
            filename,
            deleted: true,
            requestId: deleteResponse.requestId
        };
    }
    
    /**
     * Check if a file exists
     */
    async fileExists(filename) {
        const blobClient = this.containerClient.getBlockBlobClient(filename);
        return await blobClient.exists();
    }
    
    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    /**
     * Get container URL
     */
    getContainerUrl() {
        return this.containerClient.url;
    }
    
    /**
     * Validate storage connection
     */
    async validateConnection() {
        try {
            await this.containerClient.exists();
            return true;
        } catch (error) {
            console.error('Storage connection validation failed:', error.message);
            return false;
        }
    }
}

module.exports = { StorageManager };