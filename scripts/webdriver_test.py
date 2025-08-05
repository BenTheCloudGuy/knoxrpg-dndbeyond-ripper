"""
Simplified D&D Beyond authentication test to isolate WebDriver issues
"""

import time
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.common.exceptions import WebDriverException


def test_webdriver_setup():
    """Test basic WebDriver setup"""
    print("Testing WebDriver Setup")
    print("=" * 25)
    
    driver = None
    try:
        print("\n1. Setting up Edge options...")
        edge_options = Options()
        edge_options.add_argument('--no-sandbox')
        edge_options.add_argument('--disable-dev-shm-usage')
        edge_options.add_argument('--disable-web-security')
        edge_options.add_argument('--allow-running-insecure-content')
        print("✓ Edge options configured")
        
        print("\n2. Installing/updating EdgeDriver...")
        service = Service(EdgeChromiumDriverManager().install())
        print("✓ EdgeDriver ready")
        
        print("\n3. Starting Edge browser...")
        driver = webdriver.Edge(service=service, options=edge_options)
        print("✓ Edge browser started successfully")
        
        print("\n4. Testing navigation to Google...")
        driver.get("https://www.google.com")
        print(f"✓ Successfully navigated to: {driver.current_url}")
        
        print("\n5. Testing navigation to D&D Beyond...")
        driver.get("https://www.dndbeyond.com")
        time.sleep(3)
        print(f"✓ Successfully navigated to: {driver.current_url}")
        
        print("\n6. Testing login page...")
        login_url = "https://www.dndbeyond.com/sign-in?returnUrl=https://www.dndbeyond.com/sources"
        driver.get(login_url)
        time.sleep(3)
        print(f"✓ Successfully navigated to: {driver.current_url}")
        
        # Take a screenshot
        driver.save_screenshot("webdriver_test.png")
        print("✓ Screenshot saved as webdriver_test.png")
        
        print("\n✅ All WebDriver tests passed!")
        print("Press Enter to close the browser...")
        input()
        
        return True
        
    except WebDriverException as e:
        print(f"\n✗ WebDriver error: {e}")
        return False
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        return False
    finally:
        if driver:
            try:
                driver.quit()
                print("✓ Browser closed")
            except:
                pass


if __name__ == "__main__":
    test_webdriver_setup()
