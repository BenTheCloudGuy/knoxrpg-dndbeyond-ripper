# 🚀 Quick Start Guide

## Getting Started with Beyond Printing Functions

### 1. Open in Dev Container
1. Open this project in VS Code
2. When prompted, click "Reopen in Container" 
3. Or use Command Palette: `Remote-Containers: Reopen in Container`

### 2. First Time Setup
The devcontainer will automatically:
- ✅ Install Node.js 20 LTS
- ✅ Install Azure Functions Core Tools
- ✅ Install Azure CLI
- ✅ Install Puppeteer dependencies
- ✅ Install project dependencies (`npm install`)
- ✅ Start Azurite storage emulator
- ✅ Configure development environment

### 3. Configure Local Settings
Edit `local.settings.json`:
```json
{
  "Values": {
    "DNDBEYOND_SESSION_SECRET": "your-actual-session-secret",
    "AZURE_STORAGE_CONNECTION_STRING": "your-production-storage-string"
  }
}
```

### 4. Start Development
```bash
# Start Azure Functions (opens on http://localhost:7071)
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

### 5. Test the API
Use the provided REST client file `.devcontainer/api-tests.http` or:

```bash
# Test health endpoint
curl http://localhost:7071/api/health

# Test sourcebook processing (replace with real auth token)
curl -X POST http://localhost:7071/api/processSourcebook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.dndbeyond.com/sources/phb",
    "authToken": "your-session-token-here"
  }'
```

### 6. Debug in VS Code
1. Set breakpoints in your code
2. Press `F5` or use "Run and Debug" panel
3. Select "Attach to Azure Functions"

### 7. View Logs
- **Function Logs**: VS Code integrated terminal
- **Azurite Logs**: Docker logs
- **Application Logs**: Built-in logger utility

### 8. Common Commands
| Task | Command |
|------|---------|
| Start Functions | `npm start` or `func start` |
| Create New Function | `func new` |
| Deploy to Azure | `func azure functionapp publish <app-name>` |
| View Azure Storage | Use Azure Storage Explorer |
| Reset Environment | Delete `node_modules` and run `npm install` |

### 9. Troubleshooting
- **Port 7071 in use**: Kill existing Functions process or use `func start --port 7072`
- **Puppeteer issues**: Run `sudo apt-get update && sudo apt-get install -y libgbm-dev`
- **Storage issues**: Check if Azurite is running with `docker ps`
- **Auth issues**: Verify your D&D Beyond session token is valid

### 10. Production Deployment
1. Authenticate with Azure: `az login`
2. Create Function App in Azure portal
3. Configure production settings
4. Deploy: `func azure functionapp publish your-function-app`

---

**Happy coding!** 🎉

For detailed documentation, see `.devcontainer/README.md`