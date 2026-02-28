# Quick Start - Deploy to Sepolia

## TL;DR

```bash
# Option 1: Auto-setup with version manager (keeps both versions)
cd contract
./setup-scarb-versions.sh
source ~/.bashrc  # or source ~/.zshrc
scarb clean && scarb build
./deploy.sh

# Option 2: Simple downgrade (replaces current version)
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh -s -- -v 2.8.4
cd contract
scarb clean && scarb build
./deploy.sh
```

## What's the Issue?

You have Scarb 2.11.4, but Sepolia needs Cairo 2.8.4.

## Two Solutions

### 🎯 Option 1: Version Manager (Recommended)

**Pros:**
- Keep both Scarb 2.8.4 and 2.11.4
- Auto-switch per directory
- Use 2.8.4 for this project, 2.11.4 for others

**Setup:**
```bash
cd contract
./setup-scarb-versions.sh
source ~/.bashrc
```

**Deploy:**
```bash
cd contract  # Auto-switches to 2.8.4
scarb clean && scarb build
./deploy.sh
```

### 🔧 Option 2: Simple Downgrade

**Pros:**
- Quick and simple
- No additional tools

**Cons:**
- Replaces your current Scarb 2.11.4

**Setup:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh -s -- -v 2.8.4
```

**Deploy:**
```bash
cd contract
scarb clean && scarb build
./deploy.sh
```

## After Deployment

The script will output:
- Organization class hash
- Factory class hash
- Factory contract address

Update `frontend/.env.local`:
```bash
NEXT_PUBLIC_SEPOLIA_ORGANIZATION_FACTORY_ADDRESS=0x...
```

## Troubleshooting

**"Command not found: asdf"**
- Reload shell: `source ~/.bashrc` or `source ~/.zshrc`
- Or restart terminal

**"Still getting class hash mismatch"**
- Verify version: `scarb --version` (must show 2.8.4)
- Clean build: `scarb clean && scarb build`
- Check you're in contract directory

**"Account has insufficient funds"**
- Get Sepolia ETH from faucet
- Check balance on Voyager

## Files Reference

- `SCARB_VERSION_MANAGEMENT.md` - Detailed version management guide
- `DEPLOYMENT_STATUS.md` - Current deployment status
- `SCARB_DOWNGRADE_INSTRUCTIONS.md` - Step-by-step downgrade guide
- `deploy.sh` - Automated deployment script
- `.tool-versions` - asdf version configuration

## Manual Deployment

If you prefer manual steps:

```bash
# 1. Declare Organization
sncast --account limitlxx declare \
    --url https://starknet-sepolia.g.alchemy.com/v2/b0ifhVAUx_eGAhR2jonGL \
    --contract-name Organization

# 2. Declare OrganizationFactory
sncast --account limitlxx declare \
    --url https://starknet-sepolia.g.alchemy.com/v2/b0ifhVAUx_eGAhR2jonGL \
    --contract-name OrganizationFactory

# 3. Deploy Factory (use class hashes from above)
sncast deploy \
    --url https://starknet-sepolia.g.alchemy.com/v2/b0ifhVAUx_eGAhR2jonGL \
    --class-hash <FACTORY_CLASS_HASH> \
    --constructor-calldata <ORGANIZATION_CLASS_HASH>
```
