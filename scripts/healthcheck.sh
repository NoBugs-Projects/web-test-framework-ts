#!/bin/bash

# TeamCity Health Check Script
# This script verifies that the TeamCity server is accessible and the superuser token is working

set -e

# Default values
HOST=${HOST:-"192.168.0.19"}
PORT=${PORT:-"8111"}
SUPERUSER_TOKEN=${SUPERUSER_TOKEN:-"4411235800968493682"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 TeamCity Health Check"
echo "=========================="
echo "Host: $HOST:$PORT"
echo "Token: ${SUPERUSER_TOKEN:0:8}..."
echo ""

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    else
        echo -e "${RED}❌ $message${NC}"
    fi
}

# Check 1: Basic connectivity
echo "1. Testing basic connectivity..."
if curl -s --connect-timeout 10 "http://$HOST:$PORT" > /dev/null; then
    print_status "SUCCESS" "Server is reachable"
else
    print_status "ERROR" "Cannot connect to server at http://$HOST:$PORT"
    exit 1
fi

# Check 2: TeamCity API endpoint
echo "2. Testing TeamCity API endpoint..."
if curl -s --connect-timeout 10 "http://$HOST:$PORT/app/rest/server" > /dev/null; then
    print_status "SUCCESS" "TeamCity API is accessible"
else
    print_status "ERROR" "TeamCity API is not accessible"
    exit 1
fi

# Check 3: Superuser token authentication
echo "3. Testing superuser token authentication..."
AUTH_RESPONSE=$(curl -s --connect-timeout 10 -w "%{http_code}" "http://:$SUPERUSER_TOKEN@$HOST:$PORT/app/rest/server" -o /tmp/auth_response.json)

if [ "$AUTH_RESPONSE" = "200" ]; then
    print_status "SUCCESS" "Superuser token authentication successful"
    
    # Parse the response to get server info
    if command -v jq > /dev/null 2>&1; then
        SERVER_VERSION=$(cat /tmp/auth_response.json | jq -r '.version' 2>/dev/null || echo "unknown")
        print_status "SUCCESS" "TeamCity version: $SERVER_VERSION"
    fi
else
    print_status "ERROR" "Superuser token authentication failed (HTTP $AUTH_RESPONSE)"
    if [ -f /tmp/auth_response.json ]; then
        echo "Response: $(cat /tmp/auth_response.json)"
    fi
    exit 1
fi

# Check 4: Test a specific API endpoint that requires authentication
echo "4. Testing authenticated API endpoint..."
PROJECTS_RESPONSE=$(curl -s --connect-timeout 10 -w "%{http_code}" "http://:$SUPERUSER_TOKEN@$HOST:$PORT/app/rest/projects" -o /tmp/projects_response.json)

if [ "$PROJECTS_RESPONSE" = "200" ]; then
    print_status "SUCCESS" "Authenticated API endpoint working"
    
    # Parse the response to get project count
    if command -v jq > /dev/null 2>&1; then
        PROJECT_COUNT=$(cat /tmp/projects_response.json | jq -r '.project | length' 2>/dev/null || echo "unknown")
        print_status "SUCCESS" "Found $PROJECT_COUNT projects"
    fi
else
    print_status "ERROR" "Authenticated API endpoint failed (HTTP $PROJECTS_RESPONSE)"
    if [ -f /tmp/projects_response.json ]; then
        echo "Response: $(cat /tmp/projects_response.json)"
    fi
    exit 1
fi

# Cleanup
rm -f /tmp/auth_response.json /tmp/projects_response.json

echo ""
print_status "SUCCESS" "All health checks passed! TeamCity is ready for testing."
echo ""
echo "🚀 Ready to run tests!" 