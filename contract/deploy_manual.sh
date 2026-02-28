#!/bin/bash

# Manual Deployment Helper Script
# This script provides step-by-step instructions for manual deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Manual Deployment Helper${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if contracts are compiled
if [ ! -f "target/dev/semaphore_organization_pooling_Organization.contract_class.json" ]; then
    echo -e "${RED}Error: Contracts not compiled${NC}"
    echo -e "${YELLOW}Run: scarb build${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contracts compiled${NC}"
echo ""

# Account info
ACCOUNT_ADDRESS="0x6d271cbdeb3e79d932309bdfbc5f7e3c890bc35703734572f14a9d6d210245e"

echo -e "${BLUE}Account Information:${NC}"
echo -e "Address: ${YELLOW}$ACCOUNT_ADDRESS${NC}"
echo -e "Network: ${YELLOW}Sepolia${NC}"
echo ""

echo -e "${BLUE}Step 1: Declare Organization Contract${NC}"
echo -e "${YELLOW}Run this command:${NC}"
echo ""
echo -e "starkli declare \\"
echo -e "  target/dev/semaphore_organization_pooling_Organization.contract_class.json \\"
echo -e "  --account ~/.starknet_accounts/starknet_open_zeppelin_accounts.json \\"
echo -e "  --keystore ./signer.json \\"
echo -e "  --rpc https://starknet-sepolia.public.blastapi.io"
echo ""
echo -e "${YELLOW}Save the class hash from the output!${NC}"
echo ""
read -p "Press Enter when you have the Organization class hash..."
echo ""
read -p "Enter Organization class hash: " ORG_CLASS_HASH
echo ""

echo -e "${BLUE}Step 2: Declare OrganizationFactory Contract${NC}"
echo -e "${YELLOW}Run this command:${NC}"
echo ""
echo -e "starkli declare \\"
echo -e "  target/dev/semaphore_organization_pooling_OrganizationFactory.contract_class.json \\"
echo -e "  --account ~/.starknet_accounts/starknet_open_zeppelin_accounts.json \\"
echo -e "  --keystore ./signer.json \\"
echo -e "  --rpc https://starknet-sepolia.public.blastapi.io"
echo ""
echo -e "${YELLOW}Save the class hash from the output!${NC}"
echo ""
read -p "Press Enter when you have the Factory class hash..."
echo ""
read -p "Enter Factory class hash: " FACTORY_CLASS_HASH
echo ""

echo -e "${BLUE}Step 3: Deploy OrganizationFactory${NC}"
echo -e "${YELLOW}Run this command:${NC}"
echo ""
echo -e "starkli deploy \\"
echo -e "  $FACTORY_CLASS_HASH \\"
echo -e "  $ORG_CLASS_HASH \\"
echo -e "  --account ~/.starknet_accounts/starknet_open_zeppelin_accounts.json \\"
echo -e "  --keystore ./signer.json \\"
echo -e "  --rpc https://starknet-sepolia.public.blastapi.io"
echo ""
echo -e "${YELLOW}Save the contract address from the output!${NC}"
echo ""
read -p "Press Enter when deployment is complete..."
echo ""
read -p "Enter Factory contract address: " FACTORY_ADDRESS
echo ""

# Save deployment info
mkdir -p deployments
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > "deployments/sepolia_deployment.json" << EOF
{
  "network": "sepolia",
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
  "account": "$ACCOUNT_ADDRESS"
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
echo -e "Deployment info saved to: ${YELLOW}deployments/sepolia_deployment.json${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Verify on Voyager: ${YELLOW}https://sepolia.voyager.online/contract/$FACTORY_ADDRESS${NC}"
echo -e "2. Update frontend/.env.local:"
echo -e "   ${YELLOW}NEXT_PUBLIC_SEPOLIA_ORGANIZATION_FACTORY_ADDRESS=$FACTORY_ADDRESS${NC}"
echo ""
