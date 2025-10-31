const { HeadlessPrinter } = require('../src/core/HeadlessPrinter');
const { StorageManager } = require('../src/core/StorageManager');
const { DnDBeyondAuth } = require('../src/core/DnDBeyondAuth');

describe('HeadlessPrinter', () => {
    let printer;
    
    beforeEach(() => {
        printer = new HeadlessPrinter();
    });
    
    afterEach(async () => {
        if (printer) {
            await printer.cleanup();
        }
    });
    
    test('should initialize with default config', () => {
        expect(printer.config.includeCover).toBe(true);
        expect(printer.config.minPageDelay).toBe(1000);
        expect(printer.config.maxPageDelay).toBe(3000);
    });
    
    test('should merge custom options with defaults', () => {
        const customPrinter = new HeadlessPrinter({ includeCover: false, minPageDelay: 500 });
        expect(customPrinter.config.includeCover).toBe(false);
        expect(customPrinter.config.minPageDelay).toBe(500);
        expect(customPrinter.config.maxPageDelay).toBe(3000); // Default preserved
    });
});

describe('DnDBeyondAuth', () => {
    let auth;
    
    beforeEach(() => {
        auth = new DnDBeyondAuth();
    });
    
    test('should validate session token format', async () => {
        const validToken = JSON.stringify([
            { name: 'session_token', value: 'abc123', domain: '.dndbeyond.com' }
        ]);
        
        const result = await auth.validateSession(validToken, 'user123');
        expect(result).toBe(true);
    });
    
    test('should reject invalid session token', async () => {
        const invalidToken = 'invalid-token';
        
        const result = await auth.validateSession(invalidToken, 'user123');
        expect(result).toBe(false);
    });
    
    test('should check content access', async () => {
        const token = JSON.stringify([
            { name: 'auth_token', value: 'valid_token', domain: '.dndbeyond.com' }
        ]);
        
        const result = await auth.checkContentAccess('https://www.dndbeyond.com/sources/basic-rules', token);
        expect(typeof result).toBe('boolean');
    });
});

describe('StorageManager', () => {
    let storage;
    
    beforeEach(() => {
        // Mock environment variable
        process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test;EndpointSuffix=core.windows.net';
        storage = new StorageManager();
    });
    
    afterEach(() => {
        delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    });
    
    test('should initialize with connection string', () => {
        expect(storage.connectionString).toBeDefined();
        expect(storage.containerName).toBe('dndbeyond-pdfs');
    });
    
    test('should throw error without connection string', () => {
        delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        expect(() => new StorageManager()).toThrow('AZURE_STORAGE_CONNECTION_STRING environment variable is required');
    });
    
    test('should format bytes correctly', () => {
        expect(storage.formatBytes(0)).toBe('0 Bytes');
        expect(storage.formatBytes(1024)).toBe('1 KB');
        expect(storage.formatBytes(1048576)).toBe('1 MB');
    });
});