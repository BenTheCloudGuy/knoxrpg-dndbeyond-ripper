const crypto = require('crypto');

/**
 * DnDBeyondAuth - Handles D&D Beyond authentication and authorization
 * Validates user sessions and checks content access permissions
 */
class DnDBeyondAuth {
    constructor() {
        this.encryptionKey = process.env.DNDBEYOND_SESSION_SECRET;
        
        if (!this.encryptionKey) {
            console.warn('DNDBEYOND_SESSION_SECRET not set - authentication features may be limited');
        }
    }
    
    /**
     * Validate a user session token
     * This is a placeholder implementation - in production you would
     * validate against D&D Beyond's actual authentication system
     */
    async validateSession(authToken, userId) {
        try {
            // Parse the auth token
            const authData = JSON.parse(authToken);
            
            // Basic validation checks
            if (!authData || typeof authData !== 'object') {
                return false;
            }
            
            // Check if it's an array of cookies or an object with cookies
            let cookies = [];
            if (Array.isArray(authData)) {
                cookies = authData;
            } else if (authData.cookies && Array.isArray(authData.cookies)) {
                cookies = authData.cookies;
            } else if (authData.name && authData.value) {
                // Single cookie object
                cookies = [authData];
            }
            
            // Look for essential D&D Beyond cookies
            const sessionCookie = cookies.find(cookie => 
                cookie.name && (
                    cookie.name.includes('session') || 
                    cookie.name.includes('auth') ||
                    cookie.name.includes('token')
                )
            );
            
            // Basic validation - in production, you'd validate the actual session
            if (!sessionCookie || !sessionCookie.value) {
                return false;
            }
            
            // Additional validation could include:
            // - Checking cookie expiration
            // - Validating against D&D Beyond's API
            // - Checking if the session belongs to the claimed userId
            
            return true;
            
        } catch (error) {
            console.error('Session validation error:', error.message);
            return false;
        }
    }
    
    /**
     * Check if user has access to specific content
     * This would typically involve checking with D&D Beyond's API
     */
    async checkContentAccess(url, authToken) {
        try {
            // Extract source identifier from URL
            const sourceMatch = url.match(/\/sources\/([^\/]+)/);
            if (!sourceMatch) {
                return false;
            }
            
            const sourceId = sourceMatch[1];
            
            // In a real implementation, you would:
            // 1. Parse the auth token to get session info
            // 2. Make an API call to D&D Beyond to check ownership
            // 3. Return true/false based on the response
            
            // For now, we'll do basic validation
            const authData = JSON.parse(authToken);
            
            // Check if auth data looks valid
            if (!authData || typeof authData !== 'object') {
                return false;
            }
            
            // Placeholder logic - in production, implement actual ownership check
            // This could involve:
            // - Making API calls to D&D Beyond's endpoints
            // - Checking user's purchased content
            // - Validating subscription status
            
            console.log(`Checking access for source: ${sourceId}`);
            
            // For development/testing purposes, return true
            // In production, replace with actual access check
            return true;
            
        } catch (error) {
            console.error('Content access check error:', error.message);
            return false;
        }
    }
    
    /**
     * Extract user information from auth token
     */
    async getUserInfo(authToken) {
        try {
            const authData = JSON.parse(authToken);
            
            // Extract user info from cookies or token data
            // This is implementation-specific to D&D Beyond's auth system
            
            let userId = null;
            let username = null;
            
            if (Array.isArray(authData)) {
                // Look for user info in cookies
                const userCookie = authData.find(cookie => 
                    cookie.name && cookie.name.includes('user')
                );
                
                if (userCookie && userCookie.value) {
                    // Parse user info from cookie value
                    // Implementation depends on D&D Beyond's cookie format
                    try {
                        const userInfo = JSON.parse(decodeURIComponent(userCookie.value));
                        userId = userInfo.id || userInfo.userId;
                        username = userInfo.username || userInfo.name;
                    } catch (parseError) {
                        // Cookie might not be JSON, try other parsing methods
                        console.warn('Could not parse user cookie as JSON');
                    }
                }
            } else if (authData.user) {
                // User info might be directly in the auth data
                userId = authData.user.id;
                username = authData.user.username;
            }
            
            return {
                userId,
                username,
                hasValidSession: userId !== null
            };
            
        } catch (error) {
            console.error('Error extracting user info:', error.message);
            return {
                userId: null,
                username: null,
                hasValidSession: false
            };
        }
    }
    
    /**
     * Encrypt sensitive data for storage
     */
    encrypt(text) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not configured');
        }
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }
    
    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedText) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not configured');
        }
        
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
    
    /**
     * Generate a secure session token hash for logging/tracking
     */
    generateSessionHash(authToken) {
        const hash = crypto.createHash('sha256');
        hash.update(authToken);
        return hash.digest('hex').substring(0, 16); // First 16 chars for logging
    }
    
    /**
     * Validate that required D&D Beyond cookies are present
     */
    validateRequiredCookies(cookies) {
        const requiredCookiePatterns = [
            /session/i,
            /auth/i,
            /token/i,
            /dndbeyond/i
        ];
        
        const cookieNames = cookies.map(cookie => cookie.name || '').join(' ');
        
        // Check if at least one required cookie pattern is present
        return requiredCookiePatterns.some(pattern => pattern.test(cookieNames));
    }
    
    /**
     * Check if authentication token is expired
     */
    isTokenExpired(authToken) {
        try {
            const authData = JSON.parse(authToken);
            
            if (authData.expiresAt) {
                return new Date() > new Date(authData.expiresAt);
            }
            
            // Check cookie expiration if available
            let cookies = [];
            if (Array.isArray(authData)) {
                cookies = authData;
            } else if (authData.cookies) {
                cookies = authData.cookies;
            }
            
            // If any critical cookie is expired, consider token expired
            for (const cookie of cookies) {
                if (cookie.expires && new Date() > new Date(cookie.expires)) {
                    if (this.validateRequiredCookies([cookie])) {
                        return true;
                    }
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('Error checking token expiration:', error.message);
            return true; // Assume expired if we can't parse
        }
    }
}

module.exports = { DnDBeyondAuth };