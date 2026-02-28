#!/bin/bash

# Script to create a new organization
# Usage: ./create_organization.sh [network] [factory_address]

set -e

# Configuration
NETWORK=${1:-sepolia}
FACTORY_ADDRESS=${2}
ACCOUNT_FILE="$HOME/.starkli-wallets/account.json"
KEYSTORE_FILE="$HOME/.starkli-wallets/deployer.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Create New Organization${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if factory address is provided
if [ -z "$FACTORY_ADDRESS" ]; then
    echo -e "${RED}Error: Factory address not provided${NC}"
    echo -e "Usage: ./create_organization.sh [network] [factory_address]"
    exit 1
fi

# Prompt for organization details
echo -e "\n${YELLOW}Please provide organization details:${NC}"

read -p "Organization Name (e.g., MyOrg): " ORG_NAME_TEXT
read -p "Admin Address: " ADMIN_ADDRESS
read -p "Semaphore Verifier Address: " SEMAPHORE_VERIFIER
read -p "Vesu Pool Address: " VESU_POOL
read -p "wBTC Token Address: " WBTC_TOKEN
read -p "USDC Token Address: " USDC_TOKEN

# Convert organization name to felt252 (hex)
# This is a simple conversion - for production, use proper felt252 encoding
ORG_NAME_HEX=$(echo -n "$ORG_NAME_TEXT" | xxd -p | sed 's/^/0x/')

echo -e "\n${BLUE}Organization Details:${NC}"
echo -e "Name: ${GREEN}$ORG_NAME_TEXT${NC}"
echo -e "Name (hex): ${GREEN}$ORG_NAME_HEX${NC}"
echo -e "Admin: ${GREEN}$ADMIN_ADDRESS${NC}"
echo -e "Semaphore Verifier: ${GREEN}$SEMAPHORE_VERIFIER${NC}"
echo -e "Vesu Pool: ${GREEN}$VESU_POOL${NC}"
echo -e "wBTC Token: ${GREEN}$WBTC_TOKEN${NC}"
echo -e "USDC Token: ${GREEN}$USDC_TOKEN${NC}"

read -p "$(echo -e ${YELLOW}Proceed with creation? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cancelled${NC}"
    exit 1
fi

# Create organization
echo -e "\n${YELLOW}Creating organization...${NC}"

TX_HASH=$(starkli invoke \
    --account "$ACCOUNT_FILE" \
    --keystore "$KEYSTORE_FILE" \
    --network "$NETWORK" \
    "$FACTORY_ADDRESS" \
    create_organization \
    "$ORG_NAME_HEX" \
    "$ADMIN_ADDRESS" \
    "$SEMAPHORE_VERIFIER" \
    "$VESU_POOL" \
    "$WBTC_TOKEN" \
    "$USDC_TOKEN" \
    2>&1 | grep "Transaction hash:" | awk '{print $3}')

if [ -z "$TX_HASH" ]; then
    echo -e "${RED}Error: Failed to create organization${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Transaction submitted: $TX_HASH${NC}"
echo -e "${YELLOW}Waiting for transaction confirmation...${NC}"

# Wait for transaction
sleep 5

# Get organization count
ORG_COUNT=$(starkli call \
    --network "$NETWORK" \
    "$FACTORY_ADDRESS" \
    get_organization_count \
    2>&1 | tail -1)

echo -e "${GREEN}✓ Total organizations: $ORG_COUNT${NC}"

# Get the newly created organization address
ORG_INDEX=$((ORG_COUNT - 1))
ORG_ADDRESS=$(starkli call \
    --network "$NETWORK" \
    "$FACTORY_ADDRESS" \
    get_organization_by_index \
    "$ORG_INDEX" \
    2>&1 | tail -1)

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Organization Created Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nOrganization Address: ${GREEN}$ORG_ADDRESS${NC}"
echo -e "Transaction Hash: ${GREEN}$TX_HASH${NC}"

# Save organization info
ORG_FILE="organizations/${NETWORK}_${ORG_NAME_TEXT// /_}.json"
mkdir -p organizations

cat > "$ORG_FILE" << EOF
{
  "network": "$NETWORK",
  "name": "$ORG_NAME_TEXT",
  "address": "$ORG_ADDRESS",
  "admin": "$ADMIN_ADDRESS",
  "semaphore_verifier": "$SEMAPHORE_VERIFIER",
  "vesu_pool": "$VESU_POOL",
  "wbtc_token": "$WBTC_TOKEN",
  "usdc_token": "$USDC_TOKEN",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "transaction_hash": "$TX_HASH"
}
EOF

echo -e "\nOrganization details saved to: ${YELLOW}$ORG_FILE${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Add members to the organization using add_member"
echo -e "2. Members can deposit wBTC collateral"
echo -e "3. Members can create proposals for borrowing"
echo -e "4. Members can vote on proposals"
echo -e "5. Execute approved proposals to borrow USDC"

echo -e "\n${YELLOW}Example: Add a member${NC}"
echo -e "starkli invoke \\"
echo -e "  --account $ACCOUNT_FILE \\"
echo -e "  --keystore $KEYSTORE_FILE \\"
echo -e "  --network $NETWORK \\"
echo -e "  $ORG_ADDRESS \\"
echo -e "  add_member \\"
echo -e "  <IDENTITY_COMMITMENT>"
