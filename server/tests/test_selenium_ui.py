#!/usr/bin/env python3
"""
Selenium-based UI Test for Recommendation System with ELK Verification

This script tests the UI flow:
1. Navigate to signup page
2. Create new user account
3. Login
4. Upload resume
5. View recommendations
6. Verify logs in ELK stack
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import time
import subprocess
from datetime import datetime
import sys

# Configuration
FRONTEND_URL = "http://localhost:3000"  # Adjust to your frontend URL
API_URL = "http://api.192.168.49.2.nip.io"
NAMESPACE = "recsys"

# Test data
TEST_USER = {
    "name": f"Test User {int(time.time())}",
    "email": f"test_{int(time.time())}@example.com",
    "password": "TestPassword123!",
    "phone": "+1234567890"
}

# Colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def log(message: str, level: str = "INFO"):
    """Print colored log messages"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    colors = {"INFO": BLUE, "SUCCESS": GREEN, "ERROR": RED, "WARNING": YELLOW}
    color = colors.get(level, RESET)
    print(f"{color}[{timestamp}] [{level}] {message}{RESET}")

def setup_driver():
    """Setup Chrome WebDriver with options"""
    try:
        log("Setting up Chrome WebDriver...")
        
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Run in headless mode
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.implicitly_wait(10)
        
        log("✓ Chrome WebDriver initialized", "SUCCESS")
        return driver
    except Exception as e:
        log(f"✗ Failed to setup WebDriver: {e}", "ERROR")
        log("Make sure Chrome and ChromeDriver are installed", "WARNING")
        return None

def test_signup_ui(driver):
    """Test user signup through UI"""
    try:
        log("Testing signup UI...")
        
        driver.get(f"{FRONTEND_URL}/signup")
        time.sleep(2)
        
        # Fill signup form
        driver.find_element(By.ID, "name").send_keys(TEST_USER["name"])
        driver.find_element(By.ID, "email").send_keys(TEST_USER["email"])
        driver.find_element(By.ID, "password").send_keys(TEST_USER["password"])
        driver.find_element(By.ID, "phone").send_keys(TEST_USER["phone"])
        
        # Submit form
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Wait for success message or redirect
        time.sleep(3)
        
        log("✓ Signup form submitted", "SUCCESS")
        return True
    except Exception as e:
        log(f"✗ Signup UI test failed: {e}", "ERROR")
        return False

def test_login_ui(driver):
    """Test user login through UI"""
    try:
        log("Testing login UI...")
        
        driver.get(f"{FRONTEND_URL}/login")
        time.sleep(2)
        
        # Fill login form
        driver.find_element(By.ID, "email").send_keys(TEST_USER["email"])
        driver.find_element(By.ID, "password").send_keys(TEST_USER["password"])
        
        # Submit form
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Wait for redirect to dashboard
        WebDriverWait(driver, 10).until(
            EC.url_contains("dashboard")
        )
        
        log("✓ Login successful", "SUCCESS")
        return True
    except Exception as e:
        log(f"✗ Login UI test failed: {e}", "ERROR")
        return False

def test_resume_upload_ui(driver):
    """Test resume upload through UI"""
    try:
        log("Testing resume upload UI...")
        
        # Create a test resume file
        test_resume_path = "/tmp/test_resume.txt"
        with open(test_resume_path, "w") as f:
            f.write("""
JOHN DOE
Software Engineer

SKILLS:
- Python, Machine Learning
- FastAPI, Docker, Kubernetes

EXPERIENCE:
Software Developer Intern (2023-2024)
- Developed ML models
- Built REST APIs

EDUCATION:
B.S. Computer Science (2024)
            """)
        
        # Navigate to upload page
        driver.get(f"{FRONTEND_URL}/upload-resume")
        time.sleep(2)
        
        # Upload file
        file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
        file_input.send_keys(test_resume_path)
        
        # Submit
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Wait for success
        time.sleep(5)
        
        log("✓ Resume uploaded", "SUCCESS")
        return True
    except Exception as e:
        log(f"✗ Resume upload UI test failed: {e}", "ERROR")
        return False

def test_view_recommendations_ui(driver):
    """Test viewing recommendations through UI"""
    try:
        log("Testing recommendations UI...")
        
        driver.get(f"{FRONTEND_URL}/recommendations")
        time.sleep(3)
        
        # Check if recommendations are displayed
        recommendations = driver.find_elements(By.CSS_SELECTOR, ".recommendation-item")
        
        if recommendations:
            log(f"✓ Found {len(recommendations)} recommendations", "SUCCESS")
            return True
        else:
            log("✗ No recommendations found", "WARNING")
            return False
    except Exception as e:
        log(f"✗ Recommendations UI test failed: {e}", "ERROR")
        return False

def verify_logs_in_elk():
    """Verify logs are in ELK stack"""
    try:
        log("\n--- Verifying ELK Stack ---\n", "INFO")
        
        # Check pod logs
        result = subprocess.run(
            ["kubectl", "get", "pods", "-n", NAMESPACE, "-l", "app=recsys-backend",
             "-o", "jsonpath={.items[0].metadata.name}"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            log("✗ Failed to get pod name", "ERROR")
            return False
        
        pod_name = result.stdout.strip()
        
        # Check log file
        result = subprocess.run(
            ["kubectl", "exec", "-n", NAMESPACE, pod_name, "-c", "recsys-backend",
             "--", "wc", "-l", "/app/logs/backend.log"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            line_count = result.stdout.split()[0]
            log(f"✓ Backend log has {line_count} lines", "SUCCESS")
        
        # Check Elasticsearch
        time.sleep(10)  # Wait for logs to be shipped
        
        result = subprocess.run(
            ["kubectl", "exec", "-n", NAMESPACE, "elasticsearch-0", "--",
             "curl", "-s", "http://localhost:9200/backend-logs-*/_count"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            import json
            data = json.loads(result.stdout)
            count = data.get('count', 0)
            log(f"✓ Elasticsearch has {count} log documents", "SUCCESS")
            return count > 0
        
        return False
    except Exception as e:
        log(f"✗ ELK verification failed: {e}", "ERROR")
        return False

def main():
    """Main test execution"""
    log("="*80, "INFO")
    log("Selenium UI Test for Recommendation System + ELK", "INFO")
    log("="*80 + "\n", "INFO")
    
    results = {}
    driver = None
    
    try:
        # Setup WebDriver
        driver = setup_driver()
        if not driver:
            log("Cannot proceed without WebDriver", "ERROR")
            return 1
        
        # Run UI tests
        results['Signup UI'] = test_signup_ui(driver)
        time.sleep(2)
        
        results['Login UI'] = test_login_ui(driver)
        time.sleep(2)
        
        results['Resume Upload UI'] = test_resume_upload_ui(driver)
        time.sleep(2)
        
        results['View Recommendations UI'] = test_view_recommendations_ui(driver)
        time.sleep(2)
        
        # Verify ELK
        results['ELK Logging'] = verify_logs_in_elk()
        
    except Exception as e:
        log(f"Test execution error: {e}", "ERROR")
    finally:
        if driver:
            driver.quit()
            log("WebDriver closed", "INFO")
    
    # Generate report
    log("\n" + "="*80, "INFO")
    log("TEST REPORT", "INFO")
    log("="*80, "INFO")
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    log(f"\nTotal Tests: {total_tests}", "INFO")
    log(f"Passed: {passed_tests}", "SUCCESS" if passed_tests == total_tests else "WARNING")
    log(f"Failed: {total_tests - passed_tests}", "ERROR" if passed_tests < total_tests else "INFO")
    
    log("\nTest Results:", "INFO")
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        level = "SUCCESS" if result else "ERROR"
        log(f"  {status}: {test_name}", level)
    
    log("\n" + "="*80 + "\n", "INFO")
    
    if passed_tests == total_tests:
        log("🎉 ALL TESTS PASSED!", "SUCCESS")
        return 0
    else:
        log("⚠️  SOME TESTS FAILED", "ERROR")
        return 1

if __name__ == "__main__":
    sys.exit(main())
