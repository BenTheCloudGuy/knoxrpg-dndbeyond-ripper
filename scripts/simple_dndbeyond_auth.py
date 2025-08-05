"""
Simplified D&D Beyond Authentication without requests dependency
"""

import time
import urllib.request
import urllib.error
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException


class SimpleDNDBeyondAuth:
    def __init__(self, headless=False):
        """
        Initialize the D&D Beyond authentication handler
        
        Args:
            headless (bool): Whether to run browser in headless mode
        """
        self.username = 'BenMitchell1979@outlook.com'
        self.password = 'BMM@dmin1979'
        self.login_url = 'https://www.dndbeyond.com/sign-in?returnUrl=https://www.dndbeyond.com/sources'
        self.driver = None
        self.headless = headless
    
    def check_internet_connection(self):
        """Check if internet connection is available using urllib"""
        try:
            print("Checking internet connectivity...")
            with urllib.request.urlopen("https://www.google.com", timeout=10) as response:
                if response.getcode() == 200:
                    print("✓ Internet connection working")
                    return True
            return False
        except urllib.error.URLError as e:
            print(f"✗ Internet connection failed: {e}")
            return False
        except Exception as e:
            print(f"✗ Network check failed: {e}")
            return False
    
    def check_dndbeyond_accessibility(self):
        """Check if D&D Beyond is accessible using urllib"""
        try:
            print("Checking D&D Beyond accessibility...")
            with urllib.request.urlopen("https://www.dndbeyond.com", timeout=15) as response:
                if response.getcode() == 200:
                    print("✓ D&D Beyond is accessible")
                    return True
            return False
        except urllib.error.URLError as e:
            print(f"✗ Cannot reach D&D Beyond: {e}")
            return False
        except Exception as e:
            print(f"✗ D&D Beyond check failed: {e}")
            return False
    
    def setup_driver(self):
        """Set up the Edge WebDriver with appropriate options"""
        try:
            print("Setting up Edge WebDriver...")
            edge_options = Options()
            
            if self.headless:
                edge_options.add_argument('--headless')
            
            # Additional options for better stability
            edge_options.add_argument('--no-sandbox')
            edge_options.add_argument('--disable-dev-shm-usage')
            edge_options.add_argument('--disable-blink-features=AutomationControlled')
            edge_options.add_argument('--disable-web-security')
            edge_options.add_argument('--allow-running-insecure-content')
            edge_options.add_argument('--disable-extensions')
            edge_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            edge_options.add_experimental_option('useAutomationExtension', False)
            
            # Set up the service with EdgeChromiumDriverManager
            print("Downloading/updating Edge WebDriver...")
            service = Service(EdgeChromiumDriverManager().install())
            
            # Create the driver
            print("Starting Edge browser...")
            self.driver = webdriver.Edge(service=service, options=edge_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            # Set timeouts
            self.driver.implicitly_wait(10)
            self.driver.set_page_load_timeout(30)
            
            print("✓ Edge WebDriver setup complete")
            return True
            
        except WebDriverException as e:
            print(f"✗ WebDriver error: {e}")
            return False
        except Exception as e:
            print(f"✗ Error setting up driver: {e}")
            return False
    
    def wait_for_element(self, by, value, timeout=10):
        """
        Wait for an element to be present and clickable
        
        Args:
            by: The method to locate the element (By.ID, By.CLASS_NAME, etc.)
            value: The value to search for
            timeout: Maximum time to wait in seconds
            
        Returns:
            WebElement if found, None otherwise
        """
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable((by, value))
            )
            return element
        except TimeoutException:
            print(f"Timeout waiting for element: {value}")
            return None
    
    def click_sign_in_with_wizards(self):
        """Click the 'Sign in with Wizards' button"""
        try:
            # Look for various possible selectors for the Wizards login button
            possible_selectors = [
                "//button[contains(text(), 'Sign in with Wizards')]",
                "//a[contains(text(), 'Sign in with Wizards')]",
                "//button[contains(@class, 'wizards')]",
                "//a[contains(@class, 'wizards')]",
                "//button[contains(text(), 'Wizards')]",
                "//a[contains(text(), 'Wizards')]"
            ]
            
            for selector in possible_selectors:
                try:
                    element = self.wait_for_element(By.XPATH, selector, timeout=5)
                    if element:
                        print("Found 'Sign in with Wizards' button")
                        element.click()
                        return True
                except Exception as e:
                    continue
            
            print("Could not find 'Sign in with Wizards' button")
            return False
            
        except Exception as e:
            print(f"Error clicking Sign in with Wizards: {e}")
            return False
    
    def enter_credentials(self):
        """Enter username and password in the login form"""
        try:
            # Wait for username field
            username_selectors = [
                "input[name='username']",
                "input[name='email']",
                "input[type='email']",
                "input[id*='username']",
                "input[id*='email']"
            ]
            
            username_field = None
            for selector in username_selectors:
                username_field = self.wait_for_element(By.CSS_SELECTOR, selector, timeout=5)
                if username_field:
                    break
            
            if not username_field:
                print("Could not find username field")
                return False
            
            # Clear and enter username
            username_field.clear()
            username_field.send_keys(self.username)
            print("Entered username")
            
            # Wait for password field
            password_selectors = [
                "input[name='password']",
                "input[type='password']",
                "input[id*='password']"
            ]
            
            password_field = None
            for selector in password_selectors:
                password_field = self.wait_for_element(By.CSS_SELECTOR, selector, timeout=5)
                if password_field:
                    break
            
            if not password_field:
                print("Could not find password field")
                return False
            
            # Clear and enter password
            password_field.clear()
            password_field.send_keys(self.password)
            print("Entered password")
            
            return True
            
        except Exception as e:
            print(f"Error entering credentials: {e}")
            return False
    
    def submit_login(self):
        """Submit the login form"""
        try:
            # Look for submit button
            submit_selectors = [
                "button[type='submit']",
                "input[type='submit']",
                "//button[contains(text(), 'Sign In')]",
                "//button[contains(text(), 'Login')]",
                "//button[contains(text(), 'Log In')]",
                "//input[contains(@value, 'Sign In')]"
            ]
            
            for selector in submit_selectors:
                try:
                    if selector.startswith("//"):
                        submit_btn = self.wait_for_element(By.XPATH, selector, timeout=5)
                    else:
                        submit_btn = self.wait_for_element(By.CSS_SELECTOR, selector, timeout=5)
                    
                    if submit_btn:
                        print("Found submit button, clicking...")
                        submit_btn.click()
                        return True
                except Exception:
                    continue
            
            print("Could not find submit button")
            return False
            
        except Exception as e:
            print(f"Error submitting login: {e}")
            return False
    
    def check_login_success(self):
        """Check if login was successful by looking for indicators"""
        try:
            # Wait a bit for the page to load after login
            time.sleep(3)
            
            # Check current URL
            current_url = self.driver.current_url
            print(f"Current URL: {current_url}")
            
            # Look for success indicators
            success_indicators = [
                "sources",  # Should redirect to sources page
                "dashboard",
                "my-characters"
            ]
            
            for indicator in success_indicators:
                if indicator in current_url:
                    print(f"Login successful! Redirected to: {current_url}")
                    return True
            
            # Check for user-specific elements that indicate login
            user_elements = [
                "//a[contains(@class, 'user')]",
                "//button[contains(@class, 'user')]",
                "//div[contains(@class, 'user-menu')]",
                "//span[contains(@class, 'username')]"
            ]
            
            for selector in user_elements:
                try:
                    element = self.driver.find_element(By.XPATH, selector)
                    if element:
                        print("Found user element, login appears successful")
                        return True
                except NoSuchElementException:
                    continue
            
            # Check if we're still on login page (failed login)
            if "sign-in" in current_url or "login" in current_url:
                print("Still on login page, login may have failed")
                return False
            
            print("Login status unclear")
            return False
            
        except Exception as e:
            print(f"Error checking login success: {e}")
            return False
    
    def authenticate(self):
        """
        Main authentication method
        
        Returns:
            bool: True if authentication successful, False otherwise
        """
        try:
            print("Starting D&D Beyond authentication...")
            print("=" * 50)
            
            # Check internet connectivity first
            if not self.check_internet_connection():
                print("❌ No internet connection available")
                return False
            
            # Check if D&D Beyond is accessible
            if not self.check_dndbeyond_accessibility():
                print("❌ D&D Beyond is not accessible")
                return False
            
            # Set up the driver
            if not self.setup_driver():
                print("❌ Failed to setup WebDriver")
                return False
            
            # Navigate to login page
            print(f"\nNavigating to: {self.login_url}")
            try:
                self.driver.get(self.login_url)
                print("✓ Successfully loaded login page")
            except WebDriverException as e:
                print(f"✗ Failed to load login page: {e}")
                return False
            
            # Wait for page to load
            time.sleep(3)
            
            # Take a screenshot for debugging
            try:
                self.driver.save_screenshot("login_page.png")
                print("✓ Saved screenshot of login page")
            except Exception as e:
                print(f"⚠ Could not save screenshot: {e}")
            
            # Click on "Sign in with Wizards"
            if not self.click_sign_in_with_wizards():
                print("⚠ Failed to click 'Sign in with Wizards' button")
                print("Attempting to continue anyway...")
            
            # Wait for the login form to appear
            time.sleep(2)
            
            # Enter credentials
            if not self.enter_credentials():
                print("❌ Failed to enter credentials")
                return False
            
            # Submit the form
            if not self.submit_login():
                print("❌ Failed to submit login form")
                return False
            
            # Check if login was successful
            if self.check_login_success():
                print("✅ Authentication successful!")
                return True
            else:
                print("❌ Authentication failed!")
                return False
            
        except WebDriverException as e:
            print(f"❌ WebDriver error during authentication: {e}")
            return False
        except Exception as e:
            print(f"❌ Error during authentication: {e}")
            return False
    
    def close(self):
        """Close the browser"""
        if self.driver:
            self.driver.quit()
    
    def get_driver(self):
        """Get the current driver instance for further automation"""
        return self.driver


def main():
    """Main function to test the authentication"""
    auth = SimpleDNDBeyondAuth(headless=False)  # Set to True for headless mode
    
    try:
        success = auth.authenticate()
        
        if success:
            print("\n✅ Authentication successful!")
            print("You can now continue with your automation tasks...")
            
            # Keep the browser open for a bit to see the result
            input("Press Enter to close the browser...")
        else:
            print("\n❌ Authentication failed!")
            
    except KeyboardInterrupt:
        print("\nAuthentication interrupted by user")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
    finally:
        auth.close()


if __name__ == "__main__":
    main()
