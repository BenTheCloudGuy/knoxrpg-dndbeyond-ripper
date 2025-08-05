"""
Manual Edge WebDriver Setup Script
Downloads Edge WebDriver manually if webdriver-manager fails
"""

import os
import sys
import urllib.request
import zipfile
import json
import shutil


def get_edge_version():
    """Get the installed Edge version"""
    try:
        import winreg
        # Try to get Edge version from registry
        key_path = r"SOFTWARE\Microsoft\Edge\BLBeacon"
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path)
        version, _ = winreg.QueryValueEx(key, "version")
        winreg.CloseKey(key)
        return version
    except Exception:
        try:
            # Alternative method using file version
            edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
            if not os.path.exists(edge_path):
                edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
            
            if os.path.exists(edge_path):
                import subprocess
                result = subprocess.run(['powershell', '-Command', 
                                       f"(Get-ItemProperty '{edge_path}').VersionInfo.FileVersion"],
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    return result.stdout.strip()
        except Exception:
            pass
    
    return None


def download_edge_driver(version=None):
    """Download Edge WebDriver manually"""
    print("Manual Edge WebDriver Download")
    print("=" * 35)
    
    try:
        # Get Edge version if not provided
        if not version:
            print("Detecting Edge version...")
            version = get_edge_version()
            if version:
                print(f"✓ Detected Edge version: {version}")
            else:
                print("⚠ Could not detect Edge version automatically")
                version = input("Please enter your Edge version (e.g., 120.0.2210.91): ")
        
        # Extract major version
        major_version = version.split('.')[0]
        print(f"Using major version: {major_version}")
        
        # Download URL
        base_url = "https://msedgedriver.azureedge.net"
        driver_url = f"{base_url}/{version}/edgedriver_win64.zip"
        
        print(f"Downloading from: {driver_url}")
        
        # Create drivers directory
        drivers_dir = "drivers"
        if not os.path.exists(drivers_dir):
            os.makedirs(drivers_dir)
        
        # Download the driver
        zip_path = os.path.join(drivers_dir, "edgedriver.zip")
        print("Downloading Edge WebDriver...")
        
        urllib.request.urlretrieve(driver_url, zip_path)
        print("✓ Download completed")
        
        # Extract the driver
        print("Extracting Edge WebDriver...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(drivers_dir)
        
        # Clean up zip file
        os.remove(zip_path)
        
        # Find the extracted driver
        driver_path = os.path.join(drivers_dir, "msedgedriver.exe")
        if os.path.exists(driver_path):
            print(f"✓ Edge WebDriver extracted to: {driver_path}")
            print(f"✓ Driver file size: {os.path.getsize(driver_path)} bytes")
            return driver_path
        else:
            print("❌ Could not find extracted driver")
            return None
            
    except Exception as e:
        print(f"❌ Error downloading Edge WebDriver: {e}")
        return None


def test_edge_driver(driver_path):
    """Test the downloaded Edge WebDriver"""
    try:
        print(f"\nTesting Edge WebDriver at: {driver_path}")
        
        from selenium import webdriver
        from selenium.webdriver.edge.service import Service
        from selenium.webdriver.edge.options import Options
        
        # Set up options
        edge_options = Options()
        edge_options.add_argument('--headless')  # Run in headless mode for testing
        
        # Create service
        service = Service(driver_path)
        
        # Create driver
        driver = webdriver.Edge(service=service, options=edge_options)
        
        # Test navigation
        driver.get("https://www.google.com")
        title = driver.title
        driver.quit()
        
        print(f"✓ Edge WebDriver test successful! Page title: {title}")
        return True
        
    except Exception as e:
        print(f"❌ Edge WebDriver test failed: {e}")
        return False


def main():
    """Main function"""
    print("Edge WebDriver Manual Setup")
    print("=" * 30)
    
    # Check if Edge is installed
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]
    
    edge_found = False
    for path in edge_paths:
        if os.path.exists(path):
            print(f"✓ Found Edge at: {path}")
            edge_found = True
            break
    
    if not edge_found:
        print("❌ Microsoft Edge not found. Please install Edge first.")
        return
    
    # Try to download the driver
    driver_path = download_edge_driver()
    
    if driver_path:
        # Test the driver
        test_result = test_edge_driver(driver_path)
        
        if test_result:
            print(f"\n✅ Success! Edge WebDriver is ready at: {driver_path}")
            print("You can now use this driver path in your automation scripts.")
            
            # Create a config file with the driver path
            config = {"edge_driver_path": os.path.abspath(driver_path)}
            with open("driver_config.json", "w") as f:
                json.dump(config, f, indent=2)
            print("✓ Created driver_config.json with driver path")
        else:
            print("❌ Driver download succeeded but testing failed")
    else:
        print("❌ Failed to download Edge WebDriver")
        print("\n💡 Manual steps:")
        print("1. Go to https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/")
        print("2. Download the WebDriver for your Edge version")
        print("3. Extract msedgedriver.exe to the 'drivers' folder")


if __name__ == "__main__":
    main()
