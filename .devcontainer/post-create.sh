#!/bin/bash


echo "Setting up D&D Beyond Ripper Development Environment..."

# Set cobalt_token from Codespace secret COBALTTOKEN if available
if [ -n "$COBALTTOKEN" ]; then
    echo "Exporting cobalt_token from Codespace secret..."
    echo "export cobalt_token=\"$COBALTTOKEN\"" >> "$HOME/.bashrc"
    echo "export cobalt_token=\"$COBALTTOKEN\"" >> "$HOME/.zshrc"
    export cobalt_token="$COBALTTOKEN"
else
    echo "COBALTTOKEN secret not found. Skipping cobalt_token export."
fi

# Update system packages
sudo apt-get update

# Install Chrome/Chromium for web scraping (as backup to Edge)
sudo apt-get install -y chromium-browser

# Install wget and curl for downloading
sudo apt-get install -y wget curl unzip

# Download and install Chrome WebDriver
CHROME_DRIVER_VERSION=$(curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE)
wget -O /tmp/chromedriver.zip "https://chromedriver.storage.googleapis.com/${CHROME_DRIVER_VERSION}/chromedriver_linux64.zip"
sudo unzip /tmp/chromedriver.zip -d /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver

# Download and install Firefox WebDriver (GeckoDriver)
GECKO_DRIVER_VERSION=$(curl -s "https://api.github.com/repos/mozilla/geckodriver/releases/latest" | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')
wget -O /tmp/geckodriver.tar.gz "https://github.com/mozilla/geckodriver/releases/download/v${GECKO_DRIVER_VERSION}/geckodriver-v${GECKO_DRIVER_VERSION}-linux64.tar.gz"
sudo tar -xzf /tmp/geckodriver.tar.gz -C /usr/local/bin/
sudo chmod +x /usr/local/bin/geckodriver

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r /scripts/requirements.txt
fi


# Install Azure CLI
echo "Installing Azure CLI..."
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Azure CLI Login using environment variables
if [ -n "$AZURE_CLIENT_ID" ] && [ -n "$AZURE_CLIENT_SECRET" ] && [ -n "$AZURE_TENANT_ID" ]; then
    echo "Logging into Azure CLI using service principal..."
    az login --service-principal -u "$AZURE_CLIENT_ID" -p "$AZURE_CLIENT_SECRET" --tenant "$AZURE_TENANT_ID"
else
    echo "Azure login environment variables not set. Skipping Azure CLI login."
fi

# Install Playwright and its dependencies
echo "Installing Playwright and its dependencies..."   
playwright install
playwright install-deps