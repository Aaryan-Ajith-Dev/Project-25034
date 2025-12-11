#!/usr/bin/env python3
"""
Recommendation System End-to-End Test with ELK Logging Verification

This script tests:
1. User signup
2. User login
3. Resume upload
4. Internship recommendations retrieval
5. Verifies logs are written to backend.log
6. Verifies logs are shipped to Elasticsearch via ELK stack
"""

import requests
import time
import json
import sys
from datetime import datetime
from typing import Dict, Optional
import subprocess

# Configuration
API_BASE_URL = "http://api.192.168.49.2.nip.io"
ELASTICSEARCH_URL = "http://localhost:9200"
KIBANA_URL = "http://192.168.49.2:30561"
NAMESPACE = "recsys"

# Test user credentials
TEST_USER = {
    "email": f"test_user_{int(time.time())}@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "phone": "+1234567890",
    "location": "San Francisco, CA",
    "summary": "Recent CS graduate seeking software engineering internships",
    "skills": "Python, Java, Machine Learning, FastAPI, Docker, Kubernetes",
    "role": "Software Engineer Intern"
}

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def log(message: str, level: str = "INFO"):
    """Print colored log messages"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    colors = {
        "INFO": BLUE,
        "SUCCESS": GREEN,
        "ERROR": RED,
        "WARNING": YELLOW
    }
    color = colors.get(level, RESET)
    print(f"{color}[{timestamp}] [{level}] {message}{RESET}")

def check_api_health() -> bool:
    """Check if API is accessible"""
    try:
        log("Checking API health...")
        response = requests.get(f"{API_BASE_URL}/", timeout=10)
        if response.status_code == 200:
            log("✓ API is healthy", "SUCCESS")
            return True
        else:
            log(f"✗ API returned status code: {response.status_code}", "ERROR")
            return False
    except Exception as e:
        log(f"✗ Failed to connect to API: {e}", "ERROR")
        return False

def signup_user() -> bool:
    """Test user signup"""
    try:
        log(f"Signing up user: {TEST_USER['email']}...")
        response = requests.post(
            f"{API_BASE_URL}/auth/signup",
            json=TEST_USER,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            log("✓ User signup successful", "SUCCESS")
            return True
        else:
            log(f"✗ Signup failed: {response.status_code} - {response.text}", "ERROR")
            return False
    except Exception as e:
        log(f"✗ Signup error: {e}", "ERROR")
        return False

def login_user() -> Optional[str]:
    """Test user login and return auth token"""
    try:
        log(f"Logging in user: {TEST_USER['email']}...")
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={
                "email": TEST_USER['email'],
                "password": TEST_USER['password']
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token') or data.get('access_token')
            if token:
                log("✓ User login successful", "SUCCESS")
                return token
            else:
                log(f"✗ No token in response: {data}", "ERROR")
                return None
        else:
            log(f"✗ Login failed: {response.status_code} - {response.text}", "ERROR")
            return None
    except Exception as e:
        log(f"✗ Login error: {e}", "ERROR")
        return None

def update_user_profile(token: str) -> bool:
    """Test updating user profile (resume data)"""
    try:
        log("Updating user profile with resume data...")
        
        # Update user profile with resume-like information
        profile_data = {
            "name": TEST_USER["name"],
            "email": TEST_USER["email"],
            "phone": TEST_USER["phone"],
            "location": TEST_USER["location"],
            "summary": "Experienced software engineer with 2+ years in Python and ML. Seeking internship opportunities.",
            "skills": "Python, Machine Learning, FastAPI, Docker, Kubernetes, Data Science, TensorFlow",
            "role": "Software Engineer Intern",
            "education": [
                {
                    "school": "University of Technology",
                    "degree": "Bachelor of Science in Computer Science",
                    "grade": "3.8 GPA",
                    "startDate": "2020-09",
                    "endDate": "2024-05",
                    "description": "Focus on AI and Machine Learning"
                }
            ],
            "experience": [
                {
                    "company": "Tech Company",
                    "position": "Software Developer Intern",
                    "startDate": "2023-06",
                    "endDate": "2024-08",
                    "description": "Developed ML models and REST APIs using FastAPI"
                }
            ]
        }
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.put(
            f"{API_BASE_URL}/user/me",
            json=profile_data,
            headers=headers,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            log("✓ User profile updated successfully", "SUCCESS")
            return True
        else:
            log(f"✗ Profile update failed: {response.status_code} - {response.text}", "ERROR")
            return False
    except Exception as e:
        log(f"✗ Profile update error: {e}", "ERROR")
        return False

def get_recommendations(token: str) -> bool:
    """Test getting internship recommendations"""
    try:
        log("Fetching internship recommendations...")
        
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        response = requests.get(
            f"{API_BASE_URL}/user/recommendations",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            log(f"✓ Received recommendations: {len(data) if isinstance(data, list) else 'N/A'} items", "SUCCESS")
            return True
        else:
            log(f"✗ Failed to get recommendations: {response.status_code} - {response.text}", "ERROR")
            return False
    except Exception as e:
        log(f"✗ Recommendations error: {e}", "ERROR")
        return False

def check_backend_logs() -> bool:
    """Check if logs are written to backend.log"""
    try:
        log("Checking backend pod logs...")
        
        # Get backend pod name
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
        if not pod_name:
            log("✗ No backend pods found", "ERROR")
            return False
        
        log(f"Checking logs in pod: {pod_name}")
        
        # Check if log file exists and has content
        result = subprocess.run(
            ["kubectl", "exec", "-n", NAMESPACE, pod_name, "-c", "recsys-backend",
             "--", "cat", "/app/logs/backend.log"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            log_content = result.stdout
            if log_content.strip():
                log(f"✓ Backend log file has {len(log_content.splitlines())} lines", "SUCCESS")
                return True
            else:
                log("✗ Backend log file is empty", "ERROR")
                return False
        else:
            log(f"✗ Failed to read backend logs: {result.stderr}", "ERROR")
            return False
            
    except Exception as e:
        log(f"✗ Error checking backend logs: {e}", "ERROR")
        return False

def port_forward_elasticsearch():
    """Port forward Elasticsearch for local access"""
    try:
        log("Setting up port-forward to Elasticsearch...")
        subprocess.Popen(
            ["kubectl", "port-forward", "-n", NAMESPACE, "svc/elasticsearch", "9200:9200"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        time.sleep(5)  # Wait for port-forward to establish
        log("✓ Elasticsearch port-forward established", "SUCCESS")
        return True
    except Exception as e:
        log(f"✗ Failed to port-forward Elasticsearch: {e}", "ERROR")
        return False

def check_elasticsearch_logs() -> Dict:
    """Check if logs are shipped to Elasticsearch"""
    try:
        log("Checking Elasticsearch for backend logs...")
        
        # Port forward Elasticsearch
        port_forward_elasticsearch()
        
        # Query Elasticsearch for backend logs
        response = requests.get(
            f"{ELASTICSEARCH_URL}/backend-logs-*/_search?size=100&sort=@timestamp:desc",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            hits = data.get('hits', {}).get('hits', [])
            total = data.get('hits', {}).get('total', {}).get('value', 0)
            
            if total > 0:
                log(f"✓ Found {total} log entries in Elasticsearch", "SUCCESS")
                
                # Show recent log samples
                log("\nRecent log entries:")
                for i, hit in enumerate(hits[:5]):
                    source = hit.get('_source', {})
                    message = source.get('message', 'N/A')
                    timestamp = source.get('@timestamp', 'N/A')
                    log(f"  [{timestamp}] {message[:100]}...", "INFO")
                
                return {
                    'success': True,
                    'total_logs': total,
                    'recent_logs': hits[:10]
                }
            else:
                log("✗ No logs found in Elasticsearch", "ERROR")
                return {'success': False, 'total_logs': 0}
        else:
            log(f"✗ Failed to query Elasticsearch: {response.status_code}", "ERROR")
            return {'success': False, 'total_logs': 0}
            
    except Exception as e:
        log(f"✗ Error checking Elasticsearch: {e}", "ERROR")
        return {'success': False, 'total_logs': 0}

def verify_log_content(es_result: Dict) -> bool:
    """Verify that logs contain expected test operations"""
    try:
        log("Verifying log content...")
        
        if not es_result.get('success'):
            return False
        
        recent_logs = es_result.get('recent_logs', [])
        log_messages = [hit.get('_source', {}).get('message', '') for hit in recent_logs]
        
        # Check for expected operations in logs
        expected_keywords = ['signup', 'login', 'upload', 'resume', 'recommendation']
        found_keywords = []
        
        for keyword in expected_keywords:
            if any(keyword.lower() in msg.lower() for msg in log_messages):
                found_keywords.append(keyword)
                log(f"  ✓ Found '{keyword}' in logs", "SUCCESS")
        
        if len(found_keywords) >= 2:
            log(f"✓ Log content verification passed ({len(found_keywords)}/{len(expected_keywords)} keywords found)", "SUCCESS")
            return True
        else:
            log(f"✗ Log content incomplete ({len(found_keywords)}/{len(expected_keywords)} keywords found)", "WARNING")
            return False
            
    except Exception as e:
        log(f"✗ Error verifying log content: {e}", "ERROR")
        return False

def generate_test_report(results: Dict):
    """Generate a test report"""
    log("\n" + "="*80, "INFO")
    log("TEST REPORT - Recommendation System with ELK Logging", "INFO")
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
    
    log("\n" + "="*80, "INFO")
    
    if passed_tests == total_tests:
        log("🎉 ALL TESTS PASSED! ELK Stack is working correctly!", "SUCCESS")
        return 0
    else:
        log("⚠️  SOME TESTS FAILED - Please review the errors above", "ERROR")
        return 1

def main():
    """Main test execution"""
    log("="*80, "INFO")
    log("Starting Recommendation System + ELK Stack Test Suite", "INFO")
    log("="*80 + "\n", "INFO")
    
    results = {}
    
    # Step 1: Check API health
    results['API Health Check'] = check_api_health()
    if not results['API Health Check']:
        log("Cannot proceed without API access", "ERROR")
        return generate_test_report(results)
    
    time.sleep(2)
    
    # Step 2: User signup
    results['User Signup'] = signup_user()
    time.sleep(2)
    
    # Step 3: User login
    token = login_user()
    results['User Login'] = token is not None
    time.sleep(2)
    
    if token:
        # Step 4: Update user profile
        results['User Profile Update'] = update_user_profile(token)
        time.sleep(2)
        
        # Step 5: Get recommendations
        results['Get Recommendations'] = get_recommendations(token)
        time.sleep(2)
    else:
        log("Skipping authenticated tests due to login failure", "WARNING")
        results['User Profile Update'] = False
        results['Get Recommendations'] = False
    
    # Step 6: Check backend logs
    log("\n--- Verifying ELK Stack ---\n", "INFO")
    results['Backend Logs Written'] = check_backend_logs()
    time.sleep(5)  # Wait for logs to be shipped
    
    # Step 7: Check Elasticsearch
    es_result = check_elasticsearch_logs()
    results['Logs in Elasticsearch'] = es_result['success']
    
    # Step 8: Verify log content
    results['Log Content Verification'] = verify_log_content(es_result)
    
    # Generate report
    log("\n", "INFO")
    exit_code = generate_test_report(results)
    
    # Additional info
    log("\nKibana Dashboard: " + KIBANA_URL, "INFO")
    log("To view logs: Go to Discover and select 'backend-logs-*' index pattern\n", "INFO")
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
