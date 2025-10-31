# Beyond Printing - Azure Functions

This project converts D&D Beyond sourcebooks to PDF format using Azure Functions, headless browser automation, and Azure Storage.

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18.x or later
- Azure Functions Core Tools v4
- Azure Storage Account
- (Optional) Azure Container Registry for deployment

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure local settings:**
   Copy and update `local.settings.json` with your Azure Storage connection string:
   ```json
   {
     "Values": {
       "AZURE_STORAGE_CONNECTION_STRING": "your-connection-string",
       "DNDBEYOND_SESSION_SECRET": "your-encryption-key"
     }
   }
   ```

3. **Start the function app locally:**
   ```bash
   npm start
   ```

4. **Test the functions:**
   The functions will be available at:
   - Process Sourcebook: `POST http://localhost:7071/api/process-sourcebook`
   - Process Bulk: `POST http://localhost:7071/api/process-bulk`
   - Check Status: `GET http://localhost:7071/api/check-status`

## 📋 **API Documentation**

### Process Single Sourcebook
**Endpoint:** `POST /api/process-sourcebook`

**Request Body:**
```json
{
  "url": "https://www.dndbeyond.com/sources/basic-rules",
  "userId": "user123",
  "authToken": "[D&D Beyond session cookies as JSON]",
  "options": {
    "includeCover": true,
    "headingOnNewPage": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://storage.blob.core.windows.net/...",
  "filename": "user123_2025-10-29_basic-rules.pdf",
  "size": 1234567,
  "processingTimeMs": 30000
}
```

### Process Multiple Sourcebooks
**Endpoint:** `POST /api/process-bulk`

**Request Body:**
```json
{
  "urls": [
    "https://www.dndbeyond.com/sources/basic-rules",
    "https://www.dndbeyond.com/sources/players-handbook"
  ],
  "userId": "user123",
  "authToken": "[D&D Beyond session cookies as JSON]",
  "options": {}
}
```

### Check File Status
**Endpoint:** `GET /api/check-status?userId=user123&filename=file.pdf`

## 🔧 **Configuration**

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_STORAGE_CONNECTION_STRING` | Yes | - | Azure Storage connection string |
| `CONTAINER_NAME` | No | `dndbeyond-pdfs` | Storage container name |
| `DNDBEYOND_SESSION_SECRET` | No | - | Encryption key for session data |
| `REQUEST_DELAY_MIN` | No | `1000` | Minimum delay between requests (ms) |
| `REQUEST_DELAY_MAX` | No | `3000` | Maximum delay between requests (ms) |
| `PDF_CLEANUP_DAYS` | No | `30` | Days to keep PDFs before cleanup |

### Processing Options

The following options can be included in requests to customize PDF generation:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeCover` | boolean | `true` | Include cover page |
| `includeTitle` | boolean | `true` | Include title in PDF |
| `headingOnNewPage` | boolean | `true` | Start each section on new page |
| `minPageDelay` | number | `1000` | Minimum delay between pages (ms) |
| `maxPageDelay` | number | `3000` | Maximum delay between pages (ms) |

## 🏗️ **Architecture**

### Function Structure
```
src/
├── app.js                 # Main application entry
├── functions/             # Azure Function handlers
│   ├── processSourcebook.js
│   ├── processBulk.js
│   ├── checkStatus.js
│   └── scheduleProcessor.js
├── core/                  # Core business logic
│   ├── HeadlessPrinter.js # PDF generation
│   ├── StorageManager.js  # Azure Storage operations
│   └── DnDBeyondAuth.js   # Authentication handling
└── utils/                 # Utilities
    ├── config.js          # Configuration management
    ├── logger.js          # Logging utilities
    └── errorHandling.js   # Error handling
```

### Core Classes

- **HeadlessPrinter**: Converts D&D Beyond pages to PDF using Puppeteer
- **StorageManager**: Handles Azure Storage operations (upload, download, cleanup)
- **DnDBeyondAuth**: Manages authentication and authorization
- **Config**: Centralized configuration management
- **Logger**: Structured logging for Azure Functions

## 🚀 **Deployment**

### Deploy to Azure

1. **Create Azure resources:**
   ```bash
   # Create resource group
   az group create --name rg-beyond-printing --location eastus

   # Create storage account
   az storage account create --name stbeyondprinting --resource-group rg-beyond-printing

   # Create function app
   az functionapp create --name func-beyond-printing --resource-group rg-beyond-printing --consumption-plan-location eastus
   ```

2. **Deploy function app:**
   ```bash
   func azure functionapp publish func-beyond-printing
   ```

3. **Configure application settings:**
   ```bash
   az functionapp config appsettings set --name func-beyond-printing --resource-group rg-beyond-printing --settings AZURE_STORAGE_CONNECTION_STRING="your-connection-string"
   ```

## 🔒 **Security Considerations**

### Authentication
- D&D Beyond session tokens are encrypted before storage
- All API endpoints require function-level authentication
- Storage URLs use SAS tokens with limited time validity

### Data Protection
- PDF files are stored with private access in Azure Storage
- Session data is encrypted using AES-256-CBC
- Sensitive information is redacted from logs

### Rate Limiting
- Built-in delays between requests to respect D&D Beyond's servers
- Configurable concurrent request limits
- Automatic retry with exponential backoff for transient failures

## 📊 **Monitoring**

### Application Insights
The function app integrates with Azure Application Insights for:
- Performance monitoring
- Error tracking
- Custom telemetry
- Dependency tracking

### Logging
Structured logging includes:
- Request/response timing
- Processing progress
- Error details with stack traces
- Authentication events

## 🧪 **Testing**

### Local Testing
```bash
# Run tests
npm test

# Test specific function locally
func start --javascript
```

### Example Test Requests

**Process Sourcebook:**
```bash
curl -X POST http://localhost:7071/api/process-sourcebook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.dndbeyond.com/sources/basic-rules",
    "userId": "test-user",
    "authToken": "[your-session-cookies]"
  }'
```

## 🐛 **Troubleshooting**

### Common Issues

1. **Browser crashes**: Increase memory allocation or use Premium plan
2. **Authentication failures**: Verify D&D Beyond session cookies are valid
3. **Timeout errors**: Increase function timeout or optimize page processing
4. **Storage errors**: Check Azure Storage connection string and permissions

### Logs
Check Application Insights or Function App logs for detailed error information.

## 📝 **License**

This project is for educational purposes. Please respect D&D Beyond's Terms of Service and only process content you own.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 **Support**

For issues and questions:
- Check the troubleshooting section
- Review Azure Functions documentation
- Open an issue in the repository