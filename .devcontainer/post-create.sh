#!/bin/bash

echo "Setting up D&D Beyond Ripper Development Environment..."

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

# Create drivers directory in workspace
mkdir -p /workspaces/knoxrpg-dndbeyond-ripper/drivers

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install additional development tools
pip install pytest pytest-cov black flake8 isort mypy

# Install Jupyter for data analysis
pip install jupyter notebook ipykernel

# Install additional web scraping tools
pip install beautifulsoup4 lxml requests-html scrapy

# Set up git configuration (if not already set)
if [ -z "$(git config --global user.name)" ]; then
    echo "⚙️ Setting up Git configuration..."
    git config --global user.name "Ben Mitchell"
    git config --global user.email "BenMitchell1979@outlook.com"
fi

# Create useful aliases
cat >> ~/.bashrc << 'EOF'

# D&D Beyond Ripper aliases
alias activate='source .venv/bin/activate'
alias dndbeyond='python simple_dndbeyond_auth.py'
alias test-network='python simple_test.py'
alias setup-driver='python scripts/setup_edgedriver.py'

# Python development aliases
alias py='python'
alias pip-list='pip list'
alias pip-freeze='pip freeze > requirements.txt'

# Git aliases
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline'
EOF

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "🏗️ Creating virtual environment..."
    python -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
fi

# Create a test script to verify everything works
cat > test_setup.py << 'EOF'
"""
Test script to verify the development environment setup
"""

def test_imports():
    """Test that all required packages can be imported"""
    try:
        import selenium
        print("✅ Selenium imported successfully")
        
        import requests
        print("✅ Requests imported successfully")
        
        from webdriver_manager.chrome import ChromeDriverManager
        print("✅ WebDriver Manager imported successfully")
        
        import urllib.request
        print("✅ urllib imported successfully")
        
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_webdrivers():
    """Test that WebDrivers are available"""
    import os
    
    drivers = [
        ("/usr/local/bin/chromedriver", "Chrome WebDriver"),
        ("/usr/local/bin/geckodriver", "Firefox WebDriver")
    ]
    
    for driver_path, name in drivers:
        if os.path.exists(driver_path):
            print(f"✅ {name} found at {driver_path}")
        else:
            print(f"⚠️ {name} not found at {driver_path}")

def main():
    print("🧪 Testing Development Environment Setup")
    print("=" * 40)
    
    print("\n📦 Testing Package Imports:")
    imports_ok = test_imports()
    
    print("\n🔧 Testing WebDrivers:")
    test_webdrivers()
    
    if imports_ok:
        print("\n✅ Development environment setup complete!")
        print("You can now run: python simple_dndbeyond_auth.py")
    else:
        print("\n❌ Some issues found. Check the output above.")

if __name__ == "__main__":
    main()
EOF

# Make the test script executable
chmod +x test_setup.py

# Run the test script
python test_setup.py

echo ""
echo "🎉 D&D Beyond Ripper Development Environment Ready!"
echo ""
echo "📋 Available commands:"
echo "  • python simple_dndbeyond_auth.py  - Run authentication script"
echo "  • python simple_test.py           - Test network connectivity"
echo "  • python test_setup.py            - Test environment setup"
echo "  • activate                        - Activate virtual environment"
echo ""
echo "🌐 Available browsers:"
echo "  • Chromium (with ChromeDriver)"
echo ""
echo "🚀 Ready to start scraping D&D Beyond!"
