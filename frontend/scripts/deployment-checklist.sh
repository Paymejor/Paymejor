#!/bin/bash

# PayMejor Deployment Verification Script
# Usage: ./scripts/deployment-checklist.sh <deployment-url>

set -e

DEPLOYMENT_URL=$1
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$DEPLOYMENT_URL" ]; then
    echo -e "${RED}❌ Error: Deployment URL is required${NC}"
    echo "Usage: ./scripts/deployment-checklist.sh <deployment-url>"
    exit 1
fi

echo "=================================================="
echo "PayMejor Deployment Verification"
echo "=================================================="
echo "Deployment URL: $DEPLOYMENT_URL"
echo "Timestamp: $(date)"
echo "=================================================="
echo ""

# Function to check if command succeeded
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# Function to check if string exists in response
check_content() {
    local url=$1
    local search_string=$2
    local description=$3
    
    if curl -s "$url" | grep -q "$search_string"; then
        echo -e "${GREEN}✅ $description${NC}"
        return 0
    else
        echo -e "${RED}❌ $description${NC}"
        return 1
    fi
}

echo "🔍 Running Automated Checks..."
echo ""

# 1. Check if site is accessible
echo "1. Checking site accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Site is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Site returned HTTP $HTTP_CODE${NC}"
fi
echo ""

# 2. Check if app loads
echo "2. Checking if app loads..."
check_content "$DEPLOYMENT_URL" "PayMejor" "App title found"
check_content "$DEPLOYMENT_URL" "Starknet" "Starknet reference found"
echo ""

# 3. Check for JavaScript errors (basic check)
echo "3. Checking for obvious errors..."
RESPONSE=$(curl -s "$DEPLOYMENT_URL")
if echo "$RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo -e "${YELLOW}⚠️  Warning: Found 'error' in response (may be false positive)${NC}"
else
    echo -e "${GREEN}✅ No obvious errors in HTML${NC}"
fi
echo ""

# 4. Check if Next.js is running
echo "4. Checking Next.js..."
if echo "$RESPONSE" | grep -q "__NEXT_DATA__"; then
    echo -e "${GREEN}✅ Next.js is running${NC}"
else
    echo -e "${RED}❌ Next.js data not found${NC}"
fi
echo ""

# 5. Check SSL certificate
echo "5. Checking SSL certificate..."
if curl -s --head "$DEPLOYMENT_URL" | grep -q "HTTP/2 200"; then
    echo -e "${GREEN}✅ HTTPS is enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: HTTPS may not be properly configured${NC}"
fi
echo ""

# 6. Check response time
echo "6. Checking response time..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$DEPLOYMENT_URL")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
if (( $(echo "$RESPONSE_TIME < 3" | bc -l) )); then
    echo -e "${GREEN}✅ Response time: ${RESPONSE_TIME_MS}ms (Good)${NC}"
elif (( $(echo "$RESPONSE_TIME < 5" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Response time: ${RESPONSE_TIME_MS}ms (Acceptable)${NC}"
else
    echo -e "${RED}❌ Response time: ${RESPONSE_TIME_MS}ms (Slow)${NC}"
fi
echo ""

# 7. Check security headers
echo "7. Checking security headers..."
HEADERS=$(curl -s -I "$DEPLOYMENT_URL")

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✅ X-Content-Type-Options header present${NC}"
else
    echo -e "${YELLOW}⚠️  X-Content-Type-Options header missing${NC}"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✅ X-Frame-Options header present${NC}"
else
    echo -e "${YELLOW}⚠️  X-Frame-Options header missing${NC}"
fi

if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
    echo -e "${GREEN}✅ HSTS header present${NC}"
else
    echo -e "${YELLOW}⚠️  HSTS header missing (may be added by Vercel)${NC}"
fi
echo ""

echo "=================================================="
echo "Manual Verification Required"
echo "=================================================="
echo ""
echo "Please manually verify the following:"
echo ""
echo "✓ Wallet Connection:"
echo "  - Connect Xverse wallet"
echo "  - Verify wallet address displays"
echo "  - Check network indicator"
echo ""
echo "✓ Network Switching:"
echo "  - Switch between Sepolia and Mainnet"
echo "  - Verify contract addresses update"
echo "  - Check RPC endpoints change"
echo ""
echo "✓ Contract Interactions:"
echo "  - Fetch wallet balances"
echo "  - Query Vesu pool data"
echo "  - Test transaction simulation"
echo "  - Verify gas estimates"
echo ""
echo "✓ UI Components:"
echo "  - Dashboard tab loads"
echo "  - Deposit tab loads"
echo "  - Borrow tab loads"
echo "  - Positions tab loads"
echo "  - Exit tab loads"
echo ""
echo "✓ Error Handling:"
echo "  - Disconnect wallet"
echo "  - Wrong network warning"
echo "  - Invalid input validation"
echo "  - Failed transaction handling"
echo ""
echo "=================================================="
echo "Deployment Verification Complete"
echo "=================================================="
echo ""
echo "Next Steps:"
echo "1. Complete manual verification checklist above"
echo "2. Test with small amounts on Mainnet"
echo "3. Monitor deployment logs for errors"
echo "4. Set up monitoring and alerts"
echo ""
echo "For detailed deployment guide, see:"
echo "  frontend/DEPLOYMENT.md"
echo ""
