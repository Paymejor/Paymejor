# PayMejor - Private BTC Liquidity Platform

A privacy-first decentralized platform enabling anonymous group lending and borrowing on Starknet, combining Semaphore Protocol's zero-knowledge proofs with Vesu's lending infrastructure.

## Overview

PayMejor allows organizations to pool Bitcoin collateral and access liquidity through anonymous proposals and voting, all while maintaining privacy through zero-knowledge proofs. Built for the Re{define} Hackathon Bitcoin track, it addresses the privacy gap in BTCFi for Nigerian users and global privacy-focused traders.

### Key Features

#### Core Privacy Features
- **Anonymous Organizations**: Create privacy-preserving lending pools using Semaphore Protocol
- **Zero-Knowledge Proposals**: Submit and vote on borrowing proposals without revealing identity
- **Shielded Balances**: Tongo SDK integration for encrypted on-chain balances with ElGamal encryption
- **Selective Disclosure**: Share proof of solvency without revealing exact amounts

#### DeFi Integration
- **BTC Collateral**: Bridge BTC via Atomiq and use as collateral through Vesu lending pools
- **Vesu Lending**: Access decentralized lending pools with wBTC collateral and USDC borrowing
- **DEX Aggregation**: AVNU integration for optimal swap routing across all Starknet DEXs
- **Gasless Swaps**: Optional gas-free transactions via AVNU Paymaster

#### Fiat On/Off-Ramp (MavaPay)
- **BTC → NGN Off-Ramp**: Convert crypto to Nigerian Naira via Lightning Network
  - Automatic USDC → wBTC → BTC conversion flow
  - Direct bank account deposits
  - 10-minute settlement time
  - Real-time exchange rates
  
- **NGN → BTC On-Ramp**: Purchase Bitcoin with Nigerian Naira
  - Bank transfer payment instructions
  - Lightning address delivery
  - Optional bridge to Starknet (BTC → wBTC)
  - Minimum ₦2,000 (~$1.30 USD)

#### Multi-Network Support
- **Dual Network**: Deployed on both Sepolia testnet and Starknet mainnet
- **Network Switching**: Seamless switching between testnet and mainnet
- **Environment Detection**: Automatic sandbox/production mode for MavaPay

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  - Xverse Wallet Integration                                 │
│  - Organization Management UI                                │
│  - Proposal Creation & Voting                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Starknet Smart Contracts                   │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ OrganizationFactory  │  │   Organization       │        │
│  │  - Deploy orgs       │  │  - Member management │        │
│  │  - Track instances   │  │  - Collateral pools  │        │
│  └──────────────────────┘  │  - Proposals/Voting  │        │
│                             │  - Vesu integration  │        │
│                             └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Integrations                     │
│  - Semaphore Protocol (ZK Proofs)                           │
│  - Vesu Protocol (Lending Pools)                            │
│  - Atomiq Bridge (BTC → wBTC)                               │
│  - Tongo SDK (Privacy Layer)                                │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
PayMejor/
├── contract/              # Cairo smart contracts
│   ├── src/
│   │   ├── organization_factory.cairo
│   │   ├── organization.cairo
│   │   └── lib.cairo
│   ├── deployments/       # Deployment artifacts
│   ├── deploy_sepolia.sh  # Sepolia deployment script
│   └── deploy_mainnet.sh  # Mainnet deployment script
│
├── frontend/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities & constants
│   └── types/            # TypeScript types
│
└── docs/                 # Documentation
    ├── Prd.md           # Product requirements
    └── *.md             # Additional docs
```

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Scarb (Cairo package manager)
- Starknet Foundry (for testing)
- Xverse wallet (for BTC + Starknet)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PayMejor
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

### Smart Contract Development

1. **Install Scarb**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
   ```

2. **Install Starknet Foundry**
   ```bash
   curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
   ```

3. **Build contracts**
   ```bash
   cd contract
   scarb build
   ```

4. **Run tests**
   ```bash
   snforge test
   ```

## Deployment

### Deployed Addresses

#### Sepolia Testnet
- **OrganizationFactory**: `0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2`
- **Organization Class Hash**: `0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7`
- **Explorer**: [View on Voyager](https://sepolia.voyager.online/contract/0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2)

#### Starknet Mainnet
- **OrganizationFactory**: `0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0`
- **Organization Class Hash**: `0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7`
- **Explorer**: [View on Voyager](https://voyager.online/contract/0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0)

### Deploy Your Own

#### Sepolia Testnet
```bash
cd contract
./deploy_sepolia.sh
```

#### Mainnet (⚠️ Uses Real Funds)
```bash
cd contract
./deploy_mainnet.sh
```

See [contract/README.md](contract/README.md) for detailed deployment instructions.

## Core Functionality

### 1. Create Organization

Organizations are privacy-preserving lending pools where members can collectively manage collateral and proposals.

```typescript
// Frontend example
const createOrg = async () => {
  const tx = await factory.create_organization(
    name,
    adminAddress,
    semaphoreAddress,
    vesuPoolAddress,
    wbtcAddress,
    usdcAddress
  );
};
```

### 2. Add Members

Only admins can add members by registering their Semaphore identity commitments.

```typescript
const addMember = async (identityCommitment: string) => {
  await organization.add_member(identityCommitment);
};
```

### 3. Deposit Collateral

Members deposit wBTC as collateral to the organization's pool.

```typescript
const deposit = async (amount: bigint) => {
  await organization.deposit_collateral(amount);
};
```

### 4. Create Anonymous Proposal

Members create borrowing proposals with zero-knowledge proofs to maintain anonymity.

```typescript
const createProposal = async (
  proof: SemaphoreProof,
  amount: bigint,
  purpose: string,
  duration: number
) => {
  await organization.create_proposal(proof, amount, purpose, duration);
};
```

### 5. Vote Anonymously

Members vote on proposals using ZK proofs, preventing double-voting while maintaining privacy.

```typescript
const vote = async (
  proposalId: number,
  proof: SemaphoreProof,
  voteYes: boolean
) => {
  await organization.vote(proposalId, proof, voteYes);
};
```

### 6. Execute Proposal

Approved proposals are executed, borrowing USDC from Vesu against the pooled collateral.

```typescript
const execute = async (proposalId: number) => {
  await organization.execute_proposal(proposalId);
};
```

### 7. Token Swaps (AVNU Integration)

Swap between tokens using AVNU's DEX aggregator for best rates.

```typescript
const swap = async () => {
  // Get quote from all DEXs
  const quote = await getQuote({
    fromToken: USDC_ADDRESS,
    toToken: WBTC_ADDRESS,
    amount: '1000000', // 1 USDC
  });
  
  // Execute swap (optionally gasless)
  const result = await executeSwap({
    fromToken: USDC_ADDRESS,
    toToken: WBTC_ADDRESS,
    amount: '1000000',
    slippage: 0.5, // 0.5%
    gasless: true, // Use AVNU Paymaster
  });
};
```

### 8. Bridge BTC to Starknet (Atomiq)

Bridge Bitcoin to wBTC on Starknet using Atomiq's trustless bridge.

```typescript
const bridge = async () => {
  // Initiate bridge transaction
  const bridgeTx = await initiateBridge({
    fromAsset: 'BTC',
    toAsset: 'wBTC',
    amount: '50000000', // 0.5 BTC in satoshis
  });
  
  // Poll for status updates
  await pollTransactionStatus(bridgeTx.id, (status) => {
    console.log(`Status: ${status.status}`);
    console.log(`Confirmations: ${status.confirmations}/${status.requiredConfirmations}`);
  });
};
```

### 9. Off-Ramp to NGN (MavaPay)

Convert crypto to Nigerian Naira and receive in your bank account.

```typescript
const offRamp = async () => {
  // Step 1: Swap USDC to wBTC (via AVNU)
  const swapResult = await executeSwap({
    fromToken: USDC_ADDRESS,
    toToken: WBTC_ADDRESS,
    amount: usdcAmount,
    slippage: 0.5,
  });
  
  // Step 2: Get MavaPay quote for BTC → NGN
  const quote = await fetchQuote({
    direction: 'btc-to-ngn',
    amount: btcAmount,
    sourceCurrency: 'BTCSAT',
    targetCurrency: 'NGNKOBO',
  });
  
  // Step 3: Initiate off-ramp
  const result = await initiateOffRamp({
    quoteId: quote.id,
    bankAccountId: selectedBank.id,
    walletAddress: address,
  });
  
  // Funds arrive in bank account within 10 minutes
};
```

### 10. On-Ramp from NGN (MavaPay)

Purchase Bitcoin with Nigerian Naira via bank transfer.

```typescript
const onRamp = async () => {
  // Step 1: Get quote for NGN → BTC
  const quote = await fetchQuote({
    direction: 'ngn-to-btc',
    amount: ngnAmount, // in kobo (smallest unit)
    sourceCurrency: 'NGNKOBO',
    targetCurrency: 'BTCSAT',
  });
  
  // Step 2: Initiate on-ramp
  const result = await initiateOnRamp({
    amount: ngnAmount,
    lightningAddress: 'user@lightning.address',
  });
  
  // Step 3: Complete bank transfer using provided instructions
  // BTC will be sent to Lightning address after confirmation
  
  // Step 4 (Optional): Bridge BTC to Starknet
  const bridgeTx = await initiateBridge({
    fromAsset: 'BTC',
    toAsset: 'wBTC',
    amount: receivedBtcAmount,
  });
};
```

### 11. Privacy Layer (Tongo)

Shield balances and transactions using Tongo's privacy protocol.

```typescript
const usePrivacy = async () => {
  // Create Tongo account
  const tongoAccount = await createAccount();
  
  // Shield deposit (encrypt amount)
  const txHash = await fund({
    token: WBTC_ADDRESS,
    amount: '100000000', // 1 wBTC
  });
  
  // Get encrypted balance
  const shieldedBalance = await getBalance(WBTC_ADDRESS);
  
  // Decrypt balance (only owner can do this)
  const decrypted = await decrypt(shieldedBalance);
  console.log(`Actual balance: ${decrypted.amount}`);
};
```

## Technology Stack

### Smart Contracts
- **Language**: Cairo 2.11.4
- **Framework**: Scarb + Starknet Foundry
- **Network**: Starknet (Sepolia & Mainnet)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Blockchain**: starknet.js v9.4.0
- **UI Components**: Radix UI + shadcn/ui

### Core Integrations

#### Privacy & Identity
- **Semaphore Protocol** (v4.14.2): Zero-knowledge identity commitments and anonymous voting
  - Group membership proofs without revealing identity
  - Nullifier tracking to prevent double-voting
  - Used for anonymous proposals and voting in organizations

- **Tongo SDK** (v1.3.1): Privacy-preserving transactions on Starknet
  - ElGamal encryption for shielded balances
  - Client-side decryption with viewing keys
  - Selective disclosure for compliance

#### DeFi Protocols
- **Vesu Protocol**: Decentralized lending pools on Starknet
  - wBTC collateral support
  - USDC borrowing
  - Isolated lending pools (ERC-4626 standard)
  - Real-time LTV and health factor monitoring

- **AVNU SDK** (v4.0.1): DEX aggregator for optimal token swaps
  - Multi-DEX routing (Ekubo, JediSwap, 10KSwap, etc.)
  - Gasless transactions via AVNU Paymaster
  - Real-time quotes with slippage protection
  - Used for USDC → wBTC conversions in off-ramp flow

#### Bridge & On/Off-Ramp
- **Atomiq SDK** (v8.1.8): Trustless BTC ↔ wBTC bridging
  - SPV-based Bitcoin verification
  - Cross-chain atomic swaps
  - Real-time transaction status tracking
  - Supports both mainnet and testnet

- **MavaPay Integration**: BTC ↔ NGN fiat on/off-ramp
  - Real-time exchange rate quotes
  - Lightning Network integration
  - Nigerian bank account support
  - Sandbox and production environments
  - 10-minute settlement for off-ramps
  - Minimum: ₦2,000 (~$1.30 USD)

#### Additional Tools
- **Autoswap SDK** (v1.0.6): Automated swap routing and optimization
- **Sats Connect** (v4.2.1): Bitcoin wallet connectivity (Xverse integration)
- **Get Starknet** (v4.0.8): Starknet wallet connection (Argent, Braavos)

## Security Features

- **Zero-Knowledge Proofs**: Semaphore Protocol ensures anonymous proposals and voting
- **Nullifier Tracking**: Prevents duplicate proposals and double-voting
- **LTV Safety Checks**: Prevents withdrawals that would violate liquidation thresholds
- **Admin Controls**: Restricted member management
- **Proof Verification**: All anonymous actions require valid ZK proofs
- **Audited Protocols**: Leverages battle-tested Vesu and Semaphore contracts

## Use Cases

### Nigerian BTC Holders
- Hold BTC for remittances and inflation protection (~₦95M per BTC)
- Access NGN liquidity without selling or exposing holdings
- Maintain privacy from public blockchain surveillance
- Convert crypto to NGN via MavaPay with 10-minute settlement
- Minimum ₦2,000 on-ramp for accessibility

### Privacy-Focused Traders
- Leverage BTC collateral without revealing positions
- Participate in anonymous governance
- Protect trading strategies from front-running
- Shield balances using Tongo's ElGamal encryption
- Selective disclosure for compliance when needed

### Decentralized Organizations
- Pool resources for collective borrowing
- Make decisions through anonymous voting
- Maintain member privacy while ensuring accountability
- Access Vesu lending pools with shared collateral
- Transparent governance without identity exposure

### Cross-Border Payments
- Bridge BTC to Starknet via Atomiq (trustless)
- Swap to stablecoins using AVNU aggregator
- Off-ramp to Nigerian bank accounts via MavaPay
- Avoid high remittance fees and delays
- Privacy-preserving international transfers

## Development

### Frontend Development
```bash
cd frontend
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm lint         # Run linter
pnpm test         # Run tests
```

### Contract Development
```bash
cd contract
scarb build       # Compile contracts
snforge test      # Run tests
snforge test --coverage  # Run with coverage
```

### Environment Variables

See [frontend/README.md](frontend/README.md) for complete environment configuration guide.

#### Required Variables
- `NEXT_PUBLIC_SEPOLIA_RPC_URL` - Starknet Sepolia RPC endpoint
- `NEXT_PUBLIC_MAINNET_RPC_URL` - Starknet Mainnet RPC endpoint
- `NEXT_PUBLIC_DEFAULT_NETWORK` - Default network (sepolia or mainnet)

#### Contract Addresses (Sepolia)
- `NEXT_PUBLIC_SEPOLIA_ORGANIZATION_FACTORY_ADDRESS`
- `NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS`
- `NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS`
- `NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS`
- `NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS`
- `NEXT_PUBLIC_SEPOLIA_SEMAPHORE_ADDRESS`

#### Contract Addresses (Mainnet)
- `NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS`
- `NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS`
- `NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS`
- `NEXT_PUBLIC_MAINNET_WBTC_ADDRESS`
- `NEXT_PUBLIC_MAINNET_USDC_ADDRESS`
- `NEXT_PUBLIC_MAINNET_SEMAPHORE_ADDRESS`

#### MavaPay Configuration
- `NEXT_PUBLIC_MAVAPAY_API_URL` - Production API URL (default: https://api.mavapay.co)
- `NEXT_PUBLIC_MAVAPAY_SANDBOX_URL` - Sandbox API URL (default: https://staging.api.mavapay.co)
- `NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP` - Enable/disable MavaPay features (true/false)
- `NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT` - Minimum NGN amount (default: 200000 kobo = ₦2,000)
- `NEXT_PUBLIC_MAVAPAY_USE_SANDBOX` - Force sandbox mode (optional, auto-detected)
- `MAVAPAY_API_KEY` - Production API key (server-side)
- `MAVAPAY_SANDBOX_API_KEY` - Sandbox API key (server-side)
- `MAVAPAY_WEBHOOK_SECRET` - Production webhook secret
- `MAVAPAY_SANDBOX_WEBHOOK_SECRET` - Sandbox webhook secret

#### AVNU Paymaster (Optional - for gasless swaps)
- `NEXT_PUBLIC_PAYMASTER_API` - AVNU Paymaster API key
- `NEXT_PUBLIC_PAYMASTER_URL` - Sepolia Paymaster URL (default: https://sepolia.paymaster.avnu.fi)
- `NEXT_PUBLIC_PAYMASTER_URL_MAINNET` - Mainnet Paymaster URL (default: https://starknet.paymaster.avnu.fi)

## Documentation

- [Product Requirements](Prd.md) - Detailed product specification
- [Contract README](contract/README.md) - Smart contract documentation
- [Frontend README](frontend/README.md) - Frontend setup and deployment
- [Deployment Guide](contract/MAINNET_DEPLOYMENT_SUMMARY.md) - Mainnet deployment details
- [Deployed Addresses](contract/DEPLOYED_ADDRESSES.md) - Contract addresses on all networks

## Testing

### Smart Contracts
```bash
cd contract
snforge test
```

### Frontend
```bash
cd frontend
pnpm test
```

## Roadmap

### Phase 1: MVP ✅ (Current)
- ✅ Organization factory and management
- ✅ Anonymous proposals and voting with Semaphore
- ✅ Vesu lending integration
- ✅ AVNU DEX aggregator integration
- ✅ Atomiq BTC bridge integration
- ✅ MavaPay on/off-ramp (BTC ↔ NGN)
- ✅ Tongo privacy layer foundation
- ✅ Sepolia testnet deployment
- ✅ Mainnet deployment

### Phase 2: Enhanced Privacy 🚧
- [ ] Full Garaga ZK verifier integration
- [ ] Proof of solvency without revealing amounts
- [ ] Enhanced Tongo integration for shielded balances
- [ ] Anonymous liquidation protection
- [ ] Privacy-preserving credit scores

### Phase 3: Advanced Features 📋
- [ ] Leverage loops with Autoswap optimization
- [ ] Multi-collateral support (ETH, STRK, etc.)
- [ ] Automated liquidation protection
- [ ] Mobile app support (React Native)
- [ ] Advanced analytics dashboard
- [ ] Gasless transactions by default (AVNU Paymaster)

### Phase 4: Production Scaling 🎯
- [ ] Security audit by reputable firm
- [ ] Gas optimization for all contracts
- [ ] Integration with more DeFi protocols
- [ ] Support for additional fiat currencies
- [ ] Institutional features (multi-sig, compliance)
- [ ] Cross-chain expansion (other L2s)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Resources

### Protocol Documentation
- **Starknet Docs**: https://docs.starknet.io
- **Cairo Book**: https://book.cairo-lang.org
- **Semaphore Protocol**: https://semaphore.pse.dev
- **Vesu Protocol**: https://docs.vesu.xyz
- **Tongo Docs**: https://docs.tongo.cash
- **Atomiq Bridge**: https://app.atomiq.exchange
- **AVNU DEX Aggregator**: https://docs.avnu.fi
- **MavaPay API**: https://docs.mavapay.co

### SDK References
- **starknet.js**: https://www.starknetjs.com
- **Semaphore JS**: https://github.com/semaphore-protocol/semaphore.js
- **Atomiq SDK**: https://github.com/atomiqlabs/atomiq-sdk
- **AVNU SDK**: https://github.com/avnu-labs/avnu-sdk
- **Tongo SDK**: https://github.com/fatsolutions/tongo-sdk

### Tools & Infrastructure
- **Scarb**: https://docs.swmansion.com/scarb
- **Starknet Foundry**: https://foundry-rs.github.io/starknet-foundry
- **Voyager Explorer**: https://voyager.online
- **Argent Wallet**: https://www.argent.xyz
- **Xverse Wallet**: https://www.xverse.app

## License

[Add your license here]

## Support

For issues or questions:
- Open an issue on GitHub
- Check the documentation in `/docs`
- Review the troubleshooting sections in component READMEs

## Acknowledgments

Built for the Re{define} Hackathon Bitcoin track, leveraging:
- **Semaphore Protocol** for zero-knowledge identity and anonymous voting
- **Vesu Protocol** for decentralized lending with BTC collateral
- **Atomiq** for trustless BTC bridging to Starknet
- **AVNU** for optimal DEX aggregation and gasless swaps
- **Tongo** for privacy-preserving transactions and shielded balances
- **MavaPay** for seamless BTC ↔ NGN fiat on/off-ramp
- **Starknet** for scalable and secure smart contracts
- **Autoswap SDK** for automated swap routing optimization

Special thanks to the Starknet ecosystem and all protocol teams for their excellent documentation and developer support.

---

**Status**: ✅ Deployed on Mainnet  
**Network**: Starknet (Sepolia & Mainnet)  
**Version**: 1.0.0  
**Last Updated**: February 28, 2026

## Quick Links

- [Live App](https://paymejor.vercel.app) (if deployed)
- [Sepolia Factory](https://sepolia.voyager.online/contract/0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2)
- [Mainnet Factory](https://voyager.online/contract/0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0)
- [GitHub Repository](https://github.com/yourusername/PayMejor)
- [Documentation](./docs)

## Integration Summary

| Feature | Provider | Status | Network Support |
|---------|----------|--------|-----------------|
| Smart Contracts | Cairo/Starknet | ✅ Deployed | Sepolia + Mainnet |
| Anonymous Voting | Semaphore | ✅ Integrated | Both |
| Lending Pools | Vesu | ✅ Integrated | Both |
| DEX Aggregation | AVNU | ✅ Integrated | Both |
| BTC Bridge | Atomiq | ✅ Integrated | Both |
| Privacy Layer | Tongo | 🚧 Foundation | Both |
| Fiat On/Off-Ramp | MavaPay | ✅ Integrated | Both |
| Gasless Swaps | AVNU Paymaster | ✅ Optional | Both |
