# Beyond Printing Functions - Development Container

This devcontainer provides a complete development environment for the Beyond Printing Functions Azure Functions project.

## Features

### 🛠️ Pre-installed Tools
- **Node.js 20 LTS** - JavaScript runtime
- **Azure Functions Core Tools v4** - Local function development and testing
- **Azure CLI** - Azure resource management
- **Puppeteer Dependencies** - Headless Chrome for PDF generation
- **Git** - Version control
- **ESLint** - Code linting
- **Jest** - Testing framework

### 🔌 VS Code Extensions
- Azure Functions extension pack
- Node.js development tools
- ESLint and Prettier for code formatting
- Azure account and resource management
- Testing and debugging tools

### 🌐 Port Forwarding
- **7071** - Azure Functions runtime
- **8080** - Development server (if needed)
- **3000** - Additional development port
- **10000-10002** - Azurite storage emulator (blob, queue, table)
- **6379** - Redis cache (optional)

## Quick Start

1. **Open in Dev Container**
   ```bash
   # From VS Code Command Palette
   Remote-Containers: Reopen in Container
   ```

2. **Install Dependencies** (automatic)
   ```bash
   npm install
   ```

3. **Configure Local Settings**
   ```bash
   # Edit local.settings.json with your Azure Storage connection
   # Add D&D Beyond session credentials
   ```

4. **Start Development**
   ```bash
   npm start  # Starts Azure Functions runtime
   npm test   # Run tests
   ```

## Environment Configuration

### Required Environment Variables
Create or update `local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "your-production-storage-connection-string",
    "DNDBEYOND_SESSION_SECRET": "your-session-secret-here",
    "CORS_ALLOWED_ORIGINS": "*"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

### Development Services

The devcontainer includes Docker Compose services:

- **Azurite** - Azure Storage emulator for local development
- **Redis** - Optional caching layer

Start services:
```bash
docker-compose -f .devcontainer/docker-compose.yml up -d
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Azure Functions runtime |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `func new` | Create a new function |
| `func start` | Alternative way to start functions |

## Azure Functions

### Available Endpoints

When running locally (`npm start`):

- **Process Sourcebook**: `POST http://localhost:7071/api/processSourcebook`
- **Process Bulk**: `POST http://localhost:7071/api/processBulk`
- **Check Status**: `GET http://localhost:7071/api/checkStatus/{requestId}`
- **Admin API**: `http://localhost:7071/admin`

### Testing Endpoints

Use the included REST client files or tools like Postman:

```http
### Process a single sourcebook
POST http://localhost:7071/api/processSourcebook
Content-Type: application/json

{
  "url": "https://www.dndbeyond.com/sources/phb",
  "authToken": "your-auth-token-here",
  "options": {
    "includeCover": true,
    "includeBacklinks": true
  }
}
```

## Development Workflow

1. **Make Changes** - Edit source files in `src/`
2. **Test Locally** - Functions auto-reload on file changes
3. **Run Tests** - `npm test` for unit tests
4. **Debug** - Use VS Code debugger with breakpoints
5. **Deploy** - Use Azure Functions extension or CLI

## Debugging

### VS Code Debugging
1. Set breakpoints in your code
2. Press F5 or use "Run and Debug" panel
3. The debugger will attach to the Functions runtime

### Logging
- Use the provided logger: `const { logger } = require('./utils/logger');`
- View logs in VS Code terminal or Azure portal

## Troubleshooting

### Common Issues

**Puppeteer fails to launch Chrome**
```bash
# Install missing dependencies
sudo apt-get update && sudo apt-get install -y libgbm-dev
```

**Azure Functions runtime not starting**
```bash
# Check if port 7071 is available
func start --port 7072
```

**Storage connection issues**
```bash
# Start Azurite for local storage
docker-compose -f .devcontainer/docker-compose.yml up azurite -d
```

### Environment Reset
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Reset local settings
cp local.settings.json.example local.settings.json
```

## Azure Deployment

### Prerequisites
1. Azure CLI authenticated: `az login`
2. Function App created in Azure
3. Storage account configured

### Deploy
```bash
# Deploy to Azure
func azure functionapp publish your-function-app-name

# Or use VS Code Azure Functions extension
```

## Security Notes

- Never commit `local.settings.json` with real credentials
- Use Azure Key Vault for production secrets
- Implement proper authentication for D&D Beyond integration
- Enable CORS appropriately for your use case

## Resources

- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Puppeteer Documentation](https://pptr.dev/)
- [D&D Beyond API Guidelines](https://www.dndbeyond.com/developer)
- [Azure Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/)

---

Happy coding! 🚀