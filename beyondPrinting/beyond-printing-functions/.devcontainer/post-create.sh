#!/bin/bash

# Post-create script for Beyond Printing Functions development environment
echo "🚀 Setting up Beyond Printing Functions development environment..."

# Navigate to the workspace
cd /workspaces/beyond-printing-functions

# Install Azure Functions Core Tools globally
echo "📦 Installing Azure Functions Core Tools..."
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Install Puppeteer with additional dependencies for headless Chrome
echo "🌐 Installing Puppeteer dependencies..."
sudo apt-get update
sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    libgbm-dev

# Create local.settings.json if it doesn't exist
if [ ! -f "local.settings.json" ]; then
    echo "⚙️ Creating local.settings.json..."
    cp local.settings.json.example local.settings.json 2>/dev/null || echo '{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "",
    "DNDBEYOND_SESSION_SECRET": "your-session-secret-here",
    "CORS_ALLOWED_ORIGINS": "*"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*",
    "CORSCredentials": false
  }
}' > local.settings.json
fi

# Set up Git configuration if not already set
if [ -z "$(git config --global user.name)" ]; then
    echo "🔧 Setting up Git configuration..."
    git config --global user.name "Developer"
    git config --global user.email "developer@example.com"
    git config --global init.defaultBranch main
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOF
# Azure Functions
bin
obj
appsettings.json
local.settings.json

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
jspm_packages/

# TypeScript v1 declaration files
typings/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# Mac files
.DS_Store

# Azure Functions Core Tools
.vscode/

# Local HTTP debugging
.vscode/launch.json

# Azure
.azure/

# Logs
logs
*.log

# Test files
test-results/
playwright-report/
test-results.xml
EOF
fi

# Install ESLint configuration
echo "🔧 Setting up ESLint configuration..."
cat > .eslintrc.js << EOF
module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 12
    },
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-unused-vars': ['warn'],
        'no-console': 'off'
    }
};
EOF

# Set permissions
chmod +x .devcontainer/post-start.sh

echo "✅ Post-create setup completed!"
echo ""
echo "🎯 Next steps:"
echo "   1. Update local.settings.json with your Azure Storage connection string"
echo "   2. Add your D&D Beyond session credentials"
echo "   3. Run 'npm start' to start the Azure Functions runtime"
echo "   4. Run 'npm test' to execute the test suite"
echo ""
echo "🌐 The Functions runtime will be available at: http://localhost:7071"