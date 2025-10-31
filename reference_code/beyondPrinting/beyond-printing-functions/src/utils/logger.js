/**
 * Enhanced logging utilities for Azure Functions
 * Provides structured logging with different levels and context
 */
class Logger {
    constructor(context = null, prefix = '') {
        this.context = context;
        this.prefix = prefix;
        this.startTime = Date.now();
    }
    
    /**
     * Create a logger with a specific prefix
     */
    static withPrefix(prefix, context = null) {
        return new Logger(context, prefix);
    }
    
    /**
     * Log info message
     */
    info(message, data = null) {
        this._log('INFO', message, data);
    }
    
    /**
     * Log warning message
     */
    warn(message, data = null) {
        this._log('WARN', message, data);
    }
    
    /**
     * Log error message
     */
    error(message, error = null, data = null) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            ...data
        } : data;
        
        this._log('ERROR', message, errorData);
    }
    
    /**
     * Log debug message (only in development)
     */
    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            this._log('DEBUG', message, data);
        }
    }
    
    /**
     * Log performance timing
     */
    timing(operation, duration, data = null) {
        this._log('TIMING', `${operation} completed in ${duration}ms`, {
            operation,
            duration,
            ...data
        });
    }
    
    /**
     * Start a timer for an operation
     */
    startTimer(operation) {
        const startTime = Date.now();
        
        return {
            end: (data = null) => {
                const duration = Date.now() - startTime;
                this.timing(operation, duration, data);
                return duration;
            }
        };
    }
    
    /**
     * Log function execution start
     */
    functionStart(functionName, input = null) {
        this.info(`Function ${functionName} started`, {
            functionName,
            input: this._sanitizeInput(input),
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log function execution completion
     */
    functionEnd(functionName, result = null, duration = null) {
        const execDuration = duration || (Date.now() - this.startTime);
        
        this.info(`Function ${functionName} completed`, {
            functionName,
            duration: execDuration,
            success: true,
            result: this._sanitizeOutput(result),
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log function execution error
     */
    functionError(functionName, error, duration = null) {
        const execDuration = duration || (Date.now() - this.startTime);
        
        this.error(`Function ${functionName} failed`, error, {
            functionName,
            duration: execDuration,
            success: false,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log HTTP request
     */
    httpRequest(method, url, statusCode = null, duration = null) {
        this.info(`HTTP ${method} ${url}`, {
            method,
            url,
            statusCode,
            duration,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log processing progress
     */
    progress(operation, current, total, data = null) {
        const percentage = Math.round((current / total) * 100);
        
        this.info(`${operation} progress: ${current}/${total} (${percentage}%)`, {
            operation,
            current,
            total,
            percentage,
            ...data
        });
    }
    
    /**
     * Internal logging method
     */
    _log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const prefixedMessage = this.prefix ? `[${this.prefix}] ${message}` : message;
        
        const logEntry = {
            timestamp,
            level,
            message: prefixedMessage,
            ...(data && { data })
        };
        
        // Use Azure Functions context logger if available, otherwise console
        if (this.context && this.context.log) {
            if (level === 'ERROR') {
                this.context.log.error(prefixedMessage, data);
            } else if (level === 'WARN') {
                this.context.log.warn(prefixedMessage, data);
            } else {
                this.context.log(prefixedMessage, data);
            }
        } else {
            // Fallback to console
            const consoleMethod = level === 'ERROR' ? 'error' : 
                                 level === 'WARN' ? 'warn' : 'log';
            
            if (data) {
                console[consoleMethod](prefixedMessage, data);
            } else {
                console[consoleMethod](prefixedMessage);
            }
        }
    }
    
    /**
     * Sanitize input data for logging (remove sensitive information)
     */
    _sanitizeInput(input) {
        if (!input || typeof input !== 'object') {
            return input;
        }
        
        const sanitized = { ...input };
        
        // Remove sensitive fields
        const sensitiveFields = ['authToken', 'password', 'secret', 'key', 'token'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
    
    /**
     * Sanitize output data for logging
     */
    _sanitizeOutput(output) {
        if (!output || typeof output !== 'object') {
            return output;
        }
        
        const sanitized = { ...output };
        
        // Remove large binary data or sensitive information
        if (sanitized.downloadUrl) {
            // Keep the URL but remove query parameters that might contain tokens
            try {
                const url = new URL(sanitized.downloadUrl);
                sanitized.downloadUrl = `${url.origin}${url.pathname}[...params]`;
            } catch (e) {
                sanitized.downloadUrl = '[URL]';
            }
        }
        
        return sanitized;
    }
    
    /**
     * Create child logger with additional context
     */
    child(additionalPrefix) {
        const newPrefix = this.prefix ? 
            `${this.prefix}:${additionalPrefix}` : 
            additionalPrefix;
            
        return new Logger(this.context, newPrefix);
    }
}

/**
 * Create a request-scoped logger for Azure Functions
 */
function createFunctionLogger(context, functionName) {
    const logger = new Logger(context, functionName);
    
    // Add function-specific methods
    logger.requestStart = (input) => logger.functionStart(functionName, input);
    logger.requestEnd = (result, duration) => logger.functionEnd(functionName, result, duration);
    logger.requestError = (error, duration) => logger.functionError(functionName, error, duration);
    
    return logger;
}

/**
 * Performance monitoring utility
 */
class PerformanceMonitor {
    constructor(logger) {
        this.logger = logger;
        this.operations = new Map();
    }
    
    start(operationName) {
        this.operations.set(operationName, Date.now());
        this.logger.debug(`Started operation: ${operationName}`);
    }
    
    end(operationName, data = null) {
        const startTime = this.operations.get(operationName);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.operations.delete(operationName);
            this.logger.timing(operationName, duration, data);
            return duration;
        }
        return null;
    }
    
    checkpoint(operationName, checkpointName, data = null) {
        const startTime = this.operations.get(operationName);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.logger.debug(`Checkpoint ${checkpointName} for ${operationName}: ${duration}ms`, data);
        }
    }
}

module.exports = {
    Logger,
    createFunctionLogger,
    PerformanceMonitor
};