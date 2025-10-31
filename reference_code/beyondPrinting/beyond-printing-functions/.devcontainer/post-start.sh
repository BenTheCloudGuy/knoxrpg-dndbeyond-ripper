#!/bin/bash

# Post-start script for Beyond Printing Functions development environment
echo "🔄 Post-start setup for Beyond Printing Functions..."

# Navigate to workspace
cd /workspaces/beyond-printing-functions

# Ensure Azure Functions Core Tools is in PATH
if ! command -v func &> /dev/null; then
    echo "⚠️ Azure Functions Core Tools not found in PATH, adding..."
    export PATH="$PATH:/home/vscode/.npm-global/bin"
    echo 'export PATH="$PATH:/home/vscode/.npm-global/bin"' >> ~/.bashrc
    echo 'export PATH="$PATH:/home/vscode/.npm-global/bin"' >> ~/.zshrc
fi

# Check Azure CLI authentication status
echo "🔐 Checking Azure CLI authentication..."
if ! az account show &> /dev/null; then
    echo "ℹ️ Azure CLI not authenticated. Run 'az login' when ready to deploy."
else
    echo "✅ Azure CLI authenticated successfully"
    az account show --output table
fi

# Display helpful information
echo ""
echo "🎉 Beyond Printing Functions development environment is ready!"
echo ""
echo "📋 Available commands:"
echo "   npm start          - Start Azure Functions runtime (localhost:7071)"
echo "   npm test           - Run Jest tests"
echo "   npm run test:watch - Run tests in watch mode"
echo "   npm run lint       - Run ESLint"
echo "   func new           - Create a new function"
echo "   az login           - Authenticate with Azure"
echo ""
echo "🔗 Useful endpoints:"
echo "   Functions Runtime: http://localhost:7071"
echo "   Admin API:        http://localhost:7071/admin"
echo ""
echo "📁 Key files to configure:"
echo "   local.settings.json - Local development settings"
echo "   host.json          - Azure Functions host configuration"
echo ""

# Show current directory structure
echo "📂 Project structure:"
tree -L 2 -I node_modules || ls -la