/**
 * Error handling utilities for Azure Functions
 * Provides standardized error responses and error types
 */

/**
 * Custom error classes for different types of failures
 */
class BeyondPrintingError extends Error {
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.timestamp = new Date().toISOString();
    }
}

class AuthenticationError extends BeyondPrintingError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTH_FAILED');
    }
}

class AuthorizationError extends BeyondPrintingError {
    constructor(message = 'Access denied') {
        super(message, 403, 'ACCESS_DENIED');
    }
}

class ValidationError extends BeyondPrintingError {
    constructor(message = 'Invalid input') {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

class ProcessingError extends BeyondPrintingError {
    constructor(message = 'Processing failed') {
        super(message, 500, 'PROCESSING_ERROR');
    }
}

class StorageError extends BeyondPrintingError {
    constructor(message = 'Storage operation failed') {
        super(message, 500, 'STORAGE_ERROR');
    }
}

class TimeoutError extends BeyondPrintingError {
    constructor(message = 'Operation timed out') {
        super(message, 408, 'TIMEOUT_ERROR');
    }
}

/**
 * Error handler for Azure Functions
 */
class ErrorHandler {
    static handle(error, context, operation = 'unknown') {
        const logger = context?.log || console;
        
        // Log the error
        logger.error(`Error in ${operation}:`, {
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode,
            errorCode: error.errorCode,
            operation
        });
        
        // Return appropriate HTTP response
        return {
            status: error.statusCode || 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: {
                    message: error.message,
                    code: error.errorCode || 'INTERNAL_ERROR',
                    timestamp: error.timestamp || new Date().toISOString(),
                    operation
                }
            })
        };
    }
    
    static handleValidation(validationResult, context) {
        if (!validationResult.isValid) {
            const error = new ValidationError(validationResult.message);
            return this.handle(error, context, 'validation');
        }
        return null;
    }
    
    static wrapAsync(asyncFunction, operation = 'async_operation') {
        return async (...args) => {
            try {
                return await asyncFunction(...args);
            } catch (error) {
                const context = args.find(arg => arg && arg.log);
                throw this.enhanceError(error, operation);
            }
        };
    }
    
    static enhanceError(error, operation) {
        if (error instanceof BeyondPrintingError) {
            return error;
        }
        
        // Convert common error types
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            return new TimeoutError(`Operation timed out: ${error.message}`);
        }
        
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
            return new AuthenticationError(error.message);
        }
        
        if (error.message.includes('access denied') || error.message.includes('forbidden')) {
            return new AuthorizationError(error.message);
        }
        
        if (error.message.includes('storage') || error.message.includes('blob')) {
            return new StorageError(error.message);
        }
        
        // Default to processing error
        return new ProcessingError(`${operation}: ${error.message}`);
    }
}

/**
 * Input validation utilities
 */
class Validator {
    static validateRequired(value, fieldName) {
        if (value === undefined || value === null || value === '') {
            return {
                isValid: false,
                message: `${fieldName} is required`
            };
        }
        return { isValid: true };
    }
    
    static validateUrl(url, fieldName = 'url') {
        try {
            new URL(url);
            return { isValid: true };
        } catch (error) {
            return {
                isValid: false,
                message: `${fieldName} must be a valid URL`
            };
        }
    }
    
    static validateDnDBeyondUrl(url) {
        const urlValidation = this.validateUrl(url);
        if (!urlValidation.isValid) {
            return urlValidation;
        }
        
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.includes('dndbeyond.com')) {
            return {
                isValid: false,
                message: 'URL must be from dndbeyond.com'
            };
        }
        
        if (!parsedUrl.pathname.includes('/sources/')) {
            return {
                isValid: false,
                message: 'URL must be a D&D Beyond sources page'
            };
        }
        
        return { isValid: true };
    }
    
    static validateArray(array, fieldName, minLength = 1, maxLength = 100) {
        if (!Array.isArray(array)) {
            return {
                isValid: false,
                message: `${fieldName} must be an array`
            };
        }
        
        if (array.length < minLength) {
            return {
                isValid: false,
                message: `${fieldName} must contain at least ${minLength} item(s)`
            };
        }
        
        if (array.length > maxLength) {
            return {
                isValid: false,
                message: `${fieldName} cannot contain more than ${maxLength} items`
            };
        }
        
        return { isValid: true };
    }
    
    static validateString(value, fieldName, minLength = 1, maxLength = 1000) {
        if (typeof value !== 'string') {
            return {
                isValid: false,
                message: `${fieldName} must be a string`
            };
        }
        
        if (value.length < minLength) {
            return {
                isValid: false,
                message: `${fieldName} must be at least ${minLength} characters`
            };
        }
        
        if (value.length > maxLength) {
            return {
                isValid: false,
                message: `${fieldName} cannot exceed ${maxLength} characters`
            };
        }
        
        return { isValid: true };
    }
    
    static validateProcessSourcebookRequest(requestBody) {
        const { url, userId, authToken } = requestBody;
        
        // Validate required fields
        let validation = this.validateRequired(url, 'url');
        if (!validation.isValid) return validation;
        
        validation = this.validateRequired(userId, 'userId');
        if (!validation.isValid) return validation;
        
        validation = this.validateRequired(authToken, 'authToken');
        if (!validation.isValid) return validation;
        
        // Validate URL format
        validation = this.validateDnDBeyondUrl(url);
        if (!validation.isValid) return validation;
        
        // Validate userId format
        validation = this.validateString(userId, 'userId', 1, 50);
        if (!validation.isValid) return validation;
        
        // Validate authToken format
        validation = this.validateString(authToken, 'authToken', 10, 10000);
        if (!validation.isValid) return validation;
        
        return { isValid: true };
    }
    
    static validateProcessBulkRequest(requestBody) {
        const { urls, userId, authToken } = requestBody;
        
        // Validate required fields
        let validation = this.validateRequired(urls, 'urls');
        if (!validation.isValid) return validation;
        
        validation = this.validateRequired(userId, 'userId');
        if (!validation.isValid) return validation;
        
        validation = this.validateRequired(authToken, 'authToken');
        if (!validation.isValid) return validation;
        
        // Validate URLs array
        validation = this.validateArray(urls, 'urls', 1, 20); // Max 20 URLs per bulk request
        if (!validation.isValid) return validation;
        
        // Validate each URL
        for (let i = 0; i < urls.length; i++) {
            validation = this.validateDnDBeyondUrl(urls[i]);
            if (!validation.isValid) {
                return {
                    isValid: false,
                    message: `URL at index ${i}: ${validation.message}`
                };
            }
        }
        
        // Validate userId format
        validation = this.validateString(userId, 'userId', 1, 50);
        if (!validation.isValid) return validation;
        
        // Validate authToken format
        validation = this.validateString(authToken, 'authToken', 10, 10000);
        if (!validation.isValid) return validation;
        
        return { isValid: true };
    }
}

/**
 * Retry utilities for handling transient failures
 */
class RetryHelper {
    static async withRetry(operation, maxRetries = 3, delayMs = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Don't retry certain types of errors
                if (error instanceof ValidationError || 
                    error instanceof AuthenticationError || 
                    error instanceof AuthorizationError) {
                    throw error;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
    }
    
    static async withExponentialBackoff(operation, maxRetries = 3, baseDelayMs = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Don't retry certain types of errors
                if (error instanceof ValidationError || 
                    error instanceof AuthenticationError || 
                    error instanceof AuthorizationError) {
                    throw error;
                }
                
                // Exponential backoff
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

module.exports = {
    // Error classes
    BeyondPrintingError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    ProcessingError,
    StorageError,
    TimeoutError,
    
    // Utilities
    ErrorHandler,
    Validator,
    RetryHelper
};