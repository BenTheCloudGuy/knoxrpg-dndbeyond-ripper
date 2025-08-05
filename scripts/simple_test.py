"""
Simple connectivity test without external dependencies
"""

import socket
import urllib.request
import urllib.error


def simple_connectivity_test():
    """Basic connectivity test using built-in libraries"""
    print("Simple Connectivity Test")
    print("=" * 25)
    
    # Test 1: DNS Resolution
    print("\n1. Testing DNS resolution...")
    try:
        ip = socket.gethostbyname("www.google.com")
        print(f"✓ DNS working - Google resolves to: {ip}")
    except socket.gaierror as e:
        print(f"✗ DNS failed: {e}")
        return False
    
    # Test 2: HTTP Connection
    print("\n2. Testing HTTP connection...")
    try:
        with urllib.request.urlopen("http://www.google.com", timeout=10) as response:
            status = response.getcode()
            print(f"✓ HTTP working - Status: {status}")
    except urllib.error.URLError as e:
        print(f"✗ HTTP failed: {e}")
        return False
    except Exception as e:
        print(f"✗ HTTP failed: {e}")
        return False
    
    # Test 3: HTTPS Connection
    print("\n3. Testing HTTPS connection...")
    try:
        with urllib.request.urlopen("https://www.google.com", timeout=10) as response:
            status = response.getcode()
            print(f"✓ HTTPS working - Status: {status}")
    except urllib.error.URLError as e:
        print(f"✗ HTTPS failed: {e}")
        return False
    except Exception as e:
        print(f"✗ HTTPS failed: {e}")
        return False
    
    # Test 4: D&D Beyond
    print("\n4. Testing D&D Beyond...")
    try:
        with urllib.request.urlopen("https://www.dndbeyond.com", timeout=15) as response:
            status = response.getcode()
            print(f"✓ D&D Beyond accessible - Status: {status}")
    except urllib.error.URLError as e:
        print(f"✗ D&D Beyond failed: {e}")
        return False
    except Exception as e:
        print(f"✗ D&D Beyond failed: {e}")
        return False
    
    print("\n✅ All connectivity tests passed!")
    return True


if __name__ == "__main__":
    simple_connectivity_test()
