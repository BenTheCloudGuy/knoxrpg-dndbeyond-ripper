# D&D Beyond PDF and Image Ripper

An automated tool for logging into D&D Beyond and extracting content using Selenium WebDriver.

## Setup

1. Setup Environment

   ```bash
   ## Activate Virtual Environment for Python
   . .venv/bin/activate

   ## Install Python Requirements
   pip install -r scripts/requirements.txt
   ```

2. Packages and Version Info

   | Package           | Current Version | Release Date |
   | ----------------- | --------------- | ------------ |
   | Selenium          | 4.34.2          | 07/08/2025   |
   | webdriver-manager | 4.0.2           | 07/25/2025   |
   | requests          | 2.32.4          | 06/09/2025   |
   | playwright        | 1.54.0          | 07/22/2025   |
   | beautifulsoup4    | 4.13.4          | 04/15/2025   |

## Usage

### Basic Authentication

```python
from dndbeyond_auth import DNDBeyondAuth

# Create authentication instance
auth = DNDBeyondAuth(headless=False)  # Set to True for headless mode

# Authenticate
success = auth.authenticate()

if success:
    print("Successfully logged in!")
    # Continue with your automation...
    driver = auth.get_driver()
    # Your code here...

auth.close()  # Always close when done
```

### Example Usage

See `example_usage.py` for a complete example of how to use the authentication module.

## Features

- Automated login to D&D Beyond using "Sign in with Wizards"
- Edge WebDriver support with automatic driver management
- Robust element detection with multiple selector strategies
- Screenshot capture for debugging
- Error handling and timeout management

### NOTES

Under `sources` the following tag can be used to identify [IN LIBRARY] using `<class="owned-content">`

AuthenticationUrl = <https://www.dndbeyond.com/sign-in?returnUrl=https://www.dndbeyond.com/sources>

### REFERENCES

[Ainias/beyondPrinting](https://github.com/Ainias/beyondPrinting)
