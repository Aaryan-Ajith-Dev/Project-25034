# Quick Start Guide: Testing Recommendation System with ELK

## 📋 Prerequisites

1. **Application Running**
   ```bash
   cd /home/shreyas-s/Documents/7th_Sem/SPE_Project/Project-25034/server/k8s
   ./start-application.sh
   ```

2. **Wait for Pods to be Ready** (1-2 minutes)
   ```bash
   kubectl get pods -n recsys
   # All pods should show READY status
   ```

## 🚀 Run Tests

### Quick Test (API Only)
```bash
cd /home/shreyas-s/Documents/7th_Sem/SPE_Project/Project-25034/server/tests
./run_all_tests.sh
```

### Manual Steps

1. **Install Dependencies**
   ```bash
   cd tests
   pip3 install -r requirements.txt
   ```

2. **Run API Tests**
   ```bash
   python3 test_recsys_elk.py
   ```

3. **Run UI Tests** (optional, requires frontend)
   ```bash
   python3 test_selenium_ui.py
   ```

## 📊 Expected Output

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

Kibana Dashboard: http://192.168.49.2:30561
To view logs: Go to Discover and select 'backend-logs-*' index pattern
```

## 🔍 View Logs in Kibana

1. Open: http://192.168.49.2:30561
2. Create index pattern: `backend-logs-*`
3. Navigate to **Discover**
4. Filter by test user email to see complete operation trace

## ⚠️ Troubleshooting

### Test Fails Immediately
```bash
# Check if pods are running
kubectl get pods -n recsys

# If not running, start them
cd ../k8s
./start-application.sh
```

### API Health Check Fails
```bash
# Wait for pods to be fully ready (especially backend)
kubectl wait --for=condition=ready pod -l app=recsys-backend -n recsys --timeout=120s

# Test API manually
curl http://api.192.168.49.2.nip.io/
```

### No Logs in Elasticsearch
```bash
# Check Filebeat logs
kubectl logs -n recsys -l app=recsys-backend -c filebeat --tail=20

# Check Logstash logs  
kubectl logs -n recsys -l app=logstash --tail=20

# Manually verify Elasticsearch
kubectl exec -n recsys elasticsearch-0 -- curl http://localhost:9200/backend-logs-*/_count
```

## 📝 What Gets Tested

1. **User Flow**
   - Signup → Login → Upload Resume → Get Recommendations

2. **ELK Pipeline**
   - Backend writes logs to `/app/logs/backend.log`
   - Filebeat harvests logs
   - Logstash processes logs
   - Elasticsearch indexes logs
   - Kibana displays logs

3. **Verification**
   - Log file exists and has content
   - Logs appear in Elasticsearch
   - Log content matches operations performed

## 🎯 Next Steps

After successful tests:
1. View logs in Kibana Dashboard
2. Create custom dashboards for your metrics
3. Set up alerting for errors
4. Monitor application performance

## 📚 Full Documentation

See `README.md` in the tests directory for complete documentation.
