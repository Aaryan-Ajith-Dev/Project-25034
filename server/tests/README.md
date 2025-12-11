# Recommendation System Test Suite with ELK Verification

This directory contains comprehensive tests for the Recommendation System application and verifies that logs are properly sent to the ELK stack.

## Test Coverage

### 1. API Tests (`test_recsys_elk.py`)
Tests the complete API flow and ELK logging:
- ✅ User signup
- ✅ User login and authentication
- ✅ Resume upload
- ✅ Internship recommendations retrieval
- ✅ Backend log file verification
- ✅ Elasticsearch log ingestion
- ✅ Log content verification

### 2. UI Tests (`test_selenium_ui.py`) 
Selenium-based end-to-end UI testing:
- ✅ Signup form interaction
- ✅ Login flow
- ✅ Resume upload through UI
- ✅ View recommendations page
- ✅ ELK logging verification

## Prerequisites

### Required Tools
```bash
# Python 3.7+
python3 --version

# kubectl configured with recsys namespace
kubectl get pods -n recsys

# For UI tests: Chrome browser and ChromeDriver
google-chrome --version
chromedriver --version
```

### Application Must Be Running
```bash
# Start the application if not running
cd ../k8s
./start-application.sh

# Verify pods are running
kubectl get pods -n recsys
```

## Installation

Install test dependencies:
```bash
cd tests
pip3 install -r requirements.txt
```

## Running Tests

### Option 1: Run All Tests (Recommended)
```bash
./run_all_tests.sh
```

### Option 2: Run Individual Tests

#### API Tests Only
```bash
python3 test_recsys_elk.py
```

#### UI Tests Only (requires frontend)
```bash
python3 test_selenium_ui.py
```

## Test Output

### Success Output
```
================================================================================
  TEST REPORT - Recommendation System with ELK Logging
================================================================================

Total Tests: 8
Passed: 8
Failed: 0

Test Results:
  ✓ PASS: API Health Check
  ✓ PASS: User Signup
  ✓ PASS: User Login
  ✓ PASS: Resume Upload
  ✓ PASS: Get Recommendations
  ✓ PASS: Backend Logs Written
  ✓ PASS: Logs in Elasticsearch
  ✓ PASS: Log Content Verification

================================================================================
🎉 ALL TESTS PASSED! ELK Stack is working correctly!
================================================================================
```

## What Each Test Verifies

### 1. API Health Check
- Verifies the backend API is accessible
- Tests: `GET http://api.192.168.49.2.nip.io/`

### 2. User Signup
- Creates a new test user account
- Tests: `POST /auth/signup`
- Verifies: User creation is successful

### 3. User Login
- Authenticates with test credentials
- Tests: `POST /auth/login`
- Verifies: JWT token is returned

### 4. Resume Upload
- Uploads a test resume file
- Tests: `POST /user/upload-resume`
- Verifies: Resume parsing and storage

### 5. Get Recommendations
- Fetches internship recommendations
- Tests: `GET /jobs/recommendations`
- Verifies: Recommendations are returned based on resume

### 6. Backend Logs Written
- Checks `/app/logs/backend.log` in pod
- Verifies: Log file exists and has content
- Uses: `kubectl exec` to read log file

### 7. Logs in Elasticsearch
- Queries Elasticsearch for backend logs
- Tests: `GET localhost:9200/backend-logs-*/_search`
- Verifies: Logs are indexed and searchable

### 8. Log Content Verification
- Analyzes log content for expected operations
- Verifies: signup, login, upload, resume, recommendation keywords present
- Ensures: Complete operation trace in logs

## ELK Stack Verification

The tests verify the complete ELK pipeline:

```
Backend App → /app/logs/backend.log → Filebeat → Logstash → Elasticsearch → Kibana
```

### Verification Points:
1. **Log Writing**: Backend writes to `/app/logs/backend.log`
2. **Log Harvesting**: Filebeat reads from shared volume
3. **Log Shipping**: Filebeat sends to Logstash (port 5044)
4. **Log Processing**: Logstash processes and forwards
5. **Log Indexing**: Elasticsearch stores in `backend-logs-*` index
6. **Log Visualization**: Kibana can query and display logs

## Viewing Logs in Kibana

After tests run successfully:

1. **Access Kibana**: http://192.168.49.2:30561

2. **Create Index Pattern** (if not exists):
   - Go to Management → Index Patterns
   - Create pattern: `backend-logs-*`
   - Select time field: `@timestamp`

3. **View Logs**:
   - Navigate to Discover
   - Filter by test user email
   - See complete operation trace

## Troubleshooting

### "No backend pods are running"
```bash
cd ../k8s
./start-application.sh
```

### "Failed to connect to API"
```bash
# Check if ingress is working
curl http://api.192.168.49.2.nip.io/

# Or use port-forward
kubectl port-forward -n recsys svc/recsys-service 8001:80
# Update API_BASE_URL in test script to http://localhost:8001
```

### "No logs found in Elasticsearch"
```bash
# Check Filebeat is running
kubectl logs -n recsys -l app=recsys-backend -c filebeat --tail=20

# Check Logstash is receiving
kubectl logs -n recsys -l app=logstash --tail=20

# Check Elasticsearch health
kubectl exec -n recsys elasticsearch-0 -- curl -s http://localhost:9200/_cluster/health
```

### "Selenium tests fail"
```bash
# Install Chrome and ChromeDriver
sudo apt-get install chromium-browser chromium-chromedriver

# Or use webdriver-manager
pip install webdriver-manager

# Update FRONTEND_URL in test_selenium_ui.py
```

## Configuration

Edit configuration in test files:

### API Tests (`test_recsys_elk.py`)
```python
API_BASE_URL = "http://api.192.168.49.2.nip.io"
ELASTICSEARCH_URL = "http://localhost:9200"
NAMESPACE = "recsys"
```

### UI Tests (`test_selenium_ui.py`)
```python
FRONTEND_URL = "http://localhost:3000"
API_URL = "http://api.192.168.49.2.nip.io"
```

## Test Data

Tests use dynamically generated data:
- **Email**: `test_user_{timestamp}@example.com`
- **Password**: `TestPassword123!`
- **Resume**: Automatically generated with relevant keywords

## Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed

## CI/CD Integration

Use in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    cd server/tests
    ./run_all_tests.sh
```

## Support

For issues or questions:
1. Check test output for specific error messages
2. Verify all pods are running: `kubectl get pods -n recsys`
3. Check pod logs: `kubectl logs -n recsys <pod-name>`
4. Review ELK stack status in Kibana
