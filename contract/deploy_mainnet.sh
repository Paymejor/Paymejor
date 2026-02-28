#!/bin/bash

# Deployment script for Semaphore Organization Pooling contracts to Mainnet
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
NETWORK="mainnet"
ACCOUNT="corelimitlxx"
KEYSTORE_PATH="./signer.json"
RPC_URL="https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL"

# Contract paths
ORG_CONTRACT="target/dev/semaphore_organization_pooling_Organization.contract_class.json"
FACTORY_CONTRACT="target/dev/semaphore_organization_pooling_OrganizationFactory.contract_class.json"

# Output file
DEPLOYMENT_FILE="deployments/mainnet_deployment.json"

echo -e "${RED}========================================${NC}"
echo -e "${RED}⚠️  MAINNET DEPLOYMENT WARNING ⚠️${NC}"
echo -e "${RED}========================================${NC}"
echo -e "${YELLOW}You are about to deploy to Starknet Mainnet!${NC}"
echo -e "${YELLOW}This will use REAL funds and deploy LIVE contracts.${NC}"
echo ""
echo -e "Network: ${RED}$NETWORK${NC}"
echo -e "Account: ${YELLOW}$ACCOUNT${NC}"
echo -e "RPC URL: ${YELLOW}$RPC_URL${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Proceeding with mainnet deployment...${NC}"
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

# Extract transaction hashes
ORG_DECLARE_TX=$(echo "$ORG_DECLARE_OUTPUT" | grep -oP 'transaction_hash: \K0x[0-9a-fA-F]+' | head -1)
FACTORY_DECLARE_TX=$(echo "$FACTORY_DECLARE_OUTPUT" | grep -oP 'transaction_hash: \K0x[0-9a-fA-F]+' | head -1)
DEPLOY_TX=$(echo "$DEPLOY_OUTPUT" | grep -oP 'transaction_hash: \K0x[0-9a-fA-F]+' | head -1)

# Get account address
ACCOUNT_ADDRESS=$(sncast account list | grep -A 1 "$ACCOUNT" | grep "address:" | awk '{print $2}')

# Save deployment info
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > "$DEPLOYMENT_FILE" << EOF
{
  "network": "$NETWORK",
  "timestamp": "$TIMESTAMP",
  "contracts": {
    "Organization": {
      "class_hash": "$ORG_CLASS_HASH",
      "declaration_tx": "$ORG_DECLARE_TX",
      "voyager_class": "https://voyager.online/class/$ORG_CLASS_HASH"
    },
    "OrganizationFactory": {
      "class_hash": "$FACTORY_CLASS_HASH",
      "declaration_tx": "$FACTORY_DECLARE_TX",
      "address": "$FACTORY_ADDRESS",
      "deployment_tx": "$DEPLOY_TX",
      "voyager_contract": "https://voyager.online/contract/$FACTORY_ADDRESS",
      "voyager_tx": "https://voyager.online/tx/$DEPLOY_TX"
    }
  },
  "rpc_url": "$RPC_URL",
  "account": "$ACCOUNT",
  "account_address": "$ACCOUNT_ADDRESS"
}
EOF

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 MAINNET DEPLOYMENT COMPLETE! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Organization Class Hash: ${YELLOW}$ORG_CLASS_HASH${NC}"
echo -e "Factory Class Hash: ${YELLOW}$FACTORY_CLASS_HASH${NC}"
echo -e "Factory Address: ${YELLOW}$FACTORY_ADDRESS${NC}"
echo ""
echo -e "Deployment info saved to: ${YELLOW}$DEPLOYMENT_FILE${NC}"
echo ""
echo -e "${BLUE}Voyager Links:${NC}"
echo -e "Organization Class: ${YELLOW}https://voyager.online/class/$ORG_CLASS_HASH${NC}"
echo -e "Factory Contract: ${YELLOW}https://voyager.online/contract/$FACTORY_ADDRESS${NC}"
echo -e "Deployment Tx: ${YELLOW}https://voyager.online/tx/$DEPLOY_TX${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANT NEXT STEPS ⚠️${NC}"
echo ""
echo -e "1. ${YELLOW}Verify contracts on Voyager${NC}"
echo -e "   Visit: https://voyager.online/contract/$FACTORY_ADDRESS"
echo ""
echo -e "2. ${YELLOW}Update frontend/.env.local with:${NC}"
echo -e "   NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS=$FACTORY_ADDRESS"
echo ""
echo -e "3. ${YELLOW}Update contract/DEPLOYED_ADDRESSES.md${NC}"
echo -e "   Add mainnet section with factory address"
echo ""
echo -e "4. ${YELLOW}Test with small amounts first!${NC}"
echo -e "   Create a test organization with minimal collateral"
echo ""
echo -e "5. ${YELLOW}Monitor the first transactions closely${NC}"
echo -e "   Check Voyager for transaction status and events"
echo ""

