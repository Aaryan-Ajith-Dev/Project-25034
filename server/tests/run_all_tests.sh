#!/bin/bash

# Master Test Runner for Recommendation System + ELK Stack
# This script runs all tests and generates a comprehensive report

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Recommendation System Test Suite${NC}"
echo -e "${BLUE}  with ELK Stack Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if pods are running
echo -e "${BLUE}Checking if application is running...${NC}"
POD_COUNT=$(kubectl get pods -n recsys -l app=recsys-backend --field-selector=status.phase=Running 2>/dev/null | grep -c recsys-backend || echo "0")

if [ "$POD_COUNT" -eq "0" ]; then
    echo -e "${RED}Error: No backend pods are running in namespace 'recsys'${NC}"
    echo -e "${YELLOW}Please start the application first using: ./start-application.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found $POD_COUNT running backend pod(s)${NC}"
echo ""

# Install test dependencies
echo -e "${BLUE}Installing test dependencies...${NC}"
pip3 install -q -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Run API tests
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Running API Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

python3 test_recsys_elk.py
API_TEST_RESULT=$?

echo ""

# Optional: Run Selenium tests (commented out by default as it requires frontend)
# echo -e "${BLUE}========================================${NC}"
# echo -e "${BLUE}  Running Selenium UI Tests${NC}"
# echo -e "${BLUE}========================================${NC}"
# echo ""
# python3 test_selenium_ui.py
# UI_TEST_RESULT=$?

# Generate final report
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  FINAL TEST REPORT${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $API_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ API Tests: PASSED${NC}"
else
    echo -e "${RED}✗ API Tests: FAILED${NC}"
fi

# if [ $UI_TEST_RESULT -eq 0 ]; then
#     echo -e "${GREEN}✓ UI Tests: PASSED${NC}"
# else
#     echo -e "${RED}✗ UI Tests: FAILED${NC}"
# fi

echo ""
echo -e "${BLUE}Test artifacts saved in: $(pwd)${NC}"
echo -e "${BLUE}Kibana Dashboard: http://192.168.49.2:30561${NC}"
echo ""

# Exit with overall status
if [ $API_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
