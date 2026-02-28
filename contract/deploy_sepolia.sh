#!/bin/bash

# Deployment script for Semaphore Organization Pooling contracts to Sepolia
# This script will:
# 1. Declare the Organization contract
# 2. Declare the OrganizationFactory contract
# 3. Deploy the OrganizationFactory with the Organization class hash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK="sepolia"
ACCOUNT="limitlxx"
KEYSTORE_PATH="./signer.json"
RPC_URL="https://starknet-sepolia.g.alchemy.com/v2/b0ifhVAUx_eGAhR2jonGL"

# Contract paths
ORG_CONTRACT="target/dev/semaphore_organization_pooling_Organization.contract_class.json"
FACTORY_CONTRACT="target/dev/semaphore_organization_pooling_OrganizationFactory.contract_class.json"

# Output file
DEPLOYMENT_FILE="deployments/sepolia_deployment.json"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deploying to Sepolia Testnet${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Network: ${YELLOW}$NETWORK${NC}"
echo -e "Account: ${YELLOW}$ACCOUNT${NC}"
echo -e "RPC URL: ${YELLOW}$RPC_URL${NC}"
echo ""

# Create deployments directory
mkdir -p deployments

# Check if contracts are compiled
if [ ! -f "$ORG_CONTRACT" ] || [ ! -f "$FACTORY_CONTRACT" ]; then
    echo -e "${RED}Error: Contracts not compiled. Run 'scarb build' first.${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Declaring Organization contract...${NC}"
ORG_DECLARE_OUTPUT=$(sncast \
    --account "$ACCOUNT" \
    --keystore "$KEYSTORE_PATH" \
    declare \
    --contract-name Organization \
    --url "$RPC_URL" 2>&1)

echo "$ORG_DECLARE_OUTPUT"

# Extract class hash from output
ORG_CLASS_HASH=$(echo "$ORG_DECLARE_OUTPUT" | grep -oP 'class_hash: \K0x[0-9a-fA-F]+' | head -1)

if [ -z "$ORG_CLASS_HASH" ]; then
    # Try alternative extraction
    ORG_CLASS_HASH=$(echo "$ORG_DECLARE_OUTPUT" | grep -oP 'Class hash declared:\s*\K0x[0-9a-fA-F]+' | head -1)
fi

if [ -z "$ORG_CLASS_HASH" ]; then
    echo -e "${RED}Error: Failed to extract Organization class hash${NC}"
    echo -e "${YELLOW}Output was:${NC}"
    echo "$ORG_DECLARE_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ Organization class hash: $ORG_CLASS_HASH${NC}"
echo ""

echo -e "${BLUE}Step 2: Declaring OrganizationFactory contract...${NC}"
FACTORY_DECLARE_OUTPUT=$(sncast \
    --account "$ACCOUNT" \
    --keystore "$KEYSTORE_PATH" \
    declare \
    --contract-name OrganizationFactory \
    --url "$RPC_URL" 2>&1)

echo "$FACTORY_DECLARE_OUTPUT"

# Extract class hash from output
FACTORY_CLASS_HASH=$(echo "$FACTORY_DECLARE_OUTPUT" | grep -oP 'class_hash: \K0x[0-9a-fA-F]+' | head -1)

if [ -z "$FACTORY_CLASS_HASH" ]; then
    # Try alternative extraction
    FACTORY_CLASS_HASH=$(echo "$FACTORY_DECLARE_OUTPUT" | grep -oP 'Class hash declared:\s*\K0x[0-9a-fA-F]+' | head -1)
fi

if [ -z "$FACTORY_CLASS_HASH" ]; then
    echo -e "${RED}Error: Failed to extract Factory class hash${NC}"
    echo -e "${YELLOW}Output was:${NC}"
    echo "$FACTORY_DECLARE_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ OrganizationFactory class hash: $FACTORY_CLASS_HASH${NC}"
echo ""

echo -e "${BLUE}Step 3: Deploying OrganizationFactory...${NC}"
DEPLOY_OUTPUT=$(sncast \
    --account "$ACCOUNT" \
    --keystore "$KEYSTORE_PATH" \
    deploy \
    --class-hash "$FACTORY_CLASS_HASH" \
    --constructor-calldata "$ORG_CLASS_HASH" \
    --url "$RPC_URL" 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract contract address from output
FACTORY_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP 'contract_address: \K0x[0-9a-fA-F]+' | head -1)

if [ -z "$FACTORY_ADDRESS" ]; then
    # Try alternative extraction
    FACTORY_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP 'Contract deployed:\s*\K0x[0-9a-fA-F]+' | head -1)
fi

if [ -z "$FACTORY_ADDRESS" ]; then
    echo -e "${RED}Error: Failed to extract Factory address${NC}"
    echo -e "${YELLOW}Output was:${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ OrganizationFactory deployed at: $FACTORY_ADDRESS${NC}"
echo ""

# Save deployment info
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > "$DEPLOYMENT_FILE" << EOF
{
  "network": "$NETWORK",
  "timestamp": "$TIMESTAMP",
  "contracts": {
    "Organization": {
      "class_hash": "$ORG_CLASS_HASH"
    },
    "OrganizationFactory": {
      "class_hash": "$FACTORY_CLASS_HASH",
      "address": "$FACTORY_ADDRESS"
    }
  },
  "rpc_url": "$RPC_URL",
  "account": "$ACCOUNT"
}
EOF

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Organization Class Hash: ${YELLOW}$ORG_CLASS_HASH${NC}"
echo -e "Factory Class Hash: ${YELLOW}$FACTORY_CLASS_HASH${NC}"
echo -e "Factory Address: ${YELLOW}$FACTORY_ADDRESS${NC}"
echo ""
echo -e "Deployment info saved to: ${YELLOW}$DEPLOYMENT_FILE${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Verify contracts on Voyager:"
echo -e "   ${YELLOW}https://sepolia.voyager.online/contract/$FACTORY_ADDRESS${NC}"
echo ""
echo -e "2. Update frontend/.env.local with:"
echo -e "   ${YELLOW}NEXT_PUBLIC_SEPOLIA_ORGANIZATION_FACTORY_ADDRESS=$FACTORY_ADDRESS${NC}"
echo ""
echo -e "3. Create your first organization:"
echo -e "   ${YELLOW}./script/create_organization.sh sepolia $FACTORY_ADDRESS${NC}"
echo ""
