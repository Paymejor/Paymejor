#!/bin/bash

# Deployment script for Semaphore Organization Pooling contracts
# Usage: ./deploy.sh [network]
# Example: ./deploy.sh sepolia

set -e

# Configuration
NETWORK=${1:-sepolia}
ACCOUNT_FILE="$HOME/.starkli-wallets/limitlxx/account.json"
KEYSTORE_FILE="$HOME/.starkli-wallets/limitlxx/keystore.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Semaphore Organization Pooling Deployment${NC}"
echo -e "${GREEN}Network: $NETWORK${NC}"
echo -e "${GREEN}========================================${NC}"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v starkli &> /dev/null; then
    echo -e "${RED}Error: starkli not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v scarb &> /dev/null; then
    echo -e "${RED}Error: scarb not found. Please install it first.${NC}"
    exit 1
fi

if [ ! -f "$ACCOUNT_FILE" ]; then
    echo -e "${RED}Error: Account file not found at $ACCOUNT_FILE${NC}"
    exit 1
fi

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo -e "${RED}Error: Keystore file not found at $KEYSTORE_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Step 1: Compile contracts
echo -e "\n${YELLOW}Step 1: Compiling contracts...${NC}"
scarb build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Compilation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contracts compiled successfully${NC}"

# Step 2: Declare Organization contract
echo -e "\n${YELLOW}Step 2: Declaring Organization contract...${NC}"
ORG_CLASS_HASH=$(starkli declare \
    --account "$ACCOUNT_FILE" \
    --keystore "$KEYSTORE_FILE" \
    --network "$NETWORK" \
    target/dev/semaphore_organization_pooling_Organization.contract_class.json \
    2>&1 | grep "Class hash declared:" | awk '{print $4}')

if [ -z "$ORG_CLASS_HASH" ]; then
    echo -e "${RED}Error: Failed to declare Organization contract${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Organization class hash: $ORG_CLASS_HASH${NC}"

# Step 3: Declare OrganizationFactory contract
echo -e "\n${YELLOW}Step 3: Declaring OrganizationFactory contract...${NC}"
FACTORY_CLASS_HASH=$(starkli declare \
    --account "$ACCOUNT_FILE" \
    --keystore "$KEYSTORE_FILE" \
    --network "$NETWORK" \
    target/dev/semaphore_organization_pooling_OrganizationFactory.contract_class.json \
    2>&1 | grep "Class hash declared:" | awk '{print $4}')

if [ -z "$FACTORY_CLASS_HASH" ]; then
    echo -e "${RED}Error: Failed to declare OrganizationFactory contract${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Factory class hash: $FACTORY_CLASS_HASH${NC}"

# Step 4: Deploy OrganizationFactory
echo -e "\n${YELLOW}Step 4: Deploying OrganizationFactory...${NC}"
FACTORY_ADDRESS=$(starkli deploy \
    --account "$ACCOUNT_FILE" \
    --keystore "$KEYSTORE_FILE" \
    --network "$NETWORK" \
    "$FACTORY_CLASS_HASH" \
    "$ORG_CLASS_HASH" \
    2>&1 | grep "Contract deployed:" | awk '{print $3}')

if [ -z "$FACTORY_ADDRESS" ]; then
    echo -e "${RED}Error: Failed to deploy OrganizationFactory${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Factory deployed at: $FACTORY_ADDRESS${NC}"

# Save deployment info
DEPLOYMENT_FILE="deployments/${NETWORK}_deployment.json"
mkdir -p deployments

cat > "$DEPLOYMENT_FILE" << EOF
{
  "network": "$NETWORK",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "organization_class_hash": "$ORG_CLASS_HASH",
    "factory_class_hash": "$FACTORY_CLASS_HASH",
    "factory_address": "$FACTORY_ADDRESS"
  }
}
EOF

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nDeployment details saved to: ${YELLOW}$DEPLOYMENT_FILE${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Update your frontend with the factory address: ${GREEN}$FACTORY_ADDRESS${NC}"
echo -e "2. Create your first organization using the create_organization function"
echo -e "3. Provide the following addresses when creating an organization:"
echo -e "   - Semaphore Verifier Address"
echo -e "   - Vesu Pool Address"
echo -e "   - wBTC Token Address"
echo -e "   - USDC Token Address"
echo -e "\n${YELLOW}Example command to create organization:${NC}"
echo -e "starkli invoke \\"
echo -e "  --account $ACCOUNT_FILE \\"
echo -e "  --keystore $KEYSTORE_FILE \\"
echo -e "  --network $NETWORK \\"
echo -e "  $FACTORY_ADDRESS \\"
echo -e "  create_organization \\"
echo -e "  <ORG_NAME> \\"
echo -e "  <ADMIN_ADDRESS> \\"
echo -e "  <SEMAPHORE_VERIFIER> \\"
echo -e "  <VESU_POOL> \\"
echo -e "  <WBTC_TOKEN> \\"
echo -e "  <USDC_TOKEN>"
