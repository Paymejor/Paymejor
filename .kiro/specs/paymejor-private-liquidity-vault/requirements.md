# PayMejor - Private NGN Liquidity Vault Requirements

## 1. Overview

PayMejor is a production-ready private liquidity vault that enables Lagos BTC holders to unlock NGN liquidity without exposing their Bitcoin holdings on-chain. The system integrates with live protocols on Starknet: Atomiq for trustless BTC bridging, Tongo for privacy-preserving transactions, and Vesu for decentralized lending.

**Production Scope**: All features must work on Starknet Sepolia testnet with real protocol integrations. No mocks or simulations.

**Existing Frontend**: The application has a complete Next.js UI with 5 tabs (Dashboard, Deposit, Borrow, Positions, Exit). Implementation focuses on integrating real blockchain functionality into these existing components.

## 2. User Stories

### 2.1 Primary User Persona
**Lagos BTC Holder**: A Nigerian Bitcoin holder who needs local currency (NGN) liquidity but wants to maintain privacy about their BTC stack size and borrowing activity.

### 2.2 Core User Stories

**US-1: Connect Wallet**
As a BTC holder, I want to connect my Xverse wallet so that I can access both my Bitcoin and Starknet assets in one interface.

**US-2: Bridge BTC to Starknet**
As a BTC holder, I want to bridge my BTC to wBTC on Starknet using Atomiq SDK so that I can use it as collateral without custodial risk.

**US-3: Shield Collateral Privately**
As a privacy-conscious user, I want to deposit my wBTC collateral privately using Tongo so that my holdings remain hidden on-chain.

**US-4: Borrow USDC Privately**
As a borrower, I want to borrow USDC against my shielded wBTC collateral via Vesu so that I can access liquidity while maintaining privacy.

**US-5: Leverage Position**
As an advanced user, I want to loop my borrowed USDC back into more collateral so that I can increase my borrowing capacity.

**US-6: View Private Position**
As a user, I want to decrypt and view my private collateral and debt positions so that I can manage my vault.

**US-7: NGN Off-ramp Information**
As a Nigerian user, I want to see how I would convert my borrowed USDC to NGN so that I understand the complete flow to local currency.

## 3. Acceptance Criteria

### 3.1 Wallet Integration (US-1) - Dashboard Tab

**AC-1.1**: Navbar displays "Connect Wallet" button when no wallet is connected
**AC-1.2**: User can connect Xverse wallet using Xverse SDK/connector
**AC-1.3**: System retrieves and displays connected Xverse wallet address (Starknet) in navbar
**AC-1.4**: System displays network indicator showing "Starknet Sepolia" in navbar
**AC-1.5**: User can disconnect Xverse wallet and connection state clears properly
**AC-1.6**: Dashboard tab displays real wallet balance for wBTC and USDC from Starknet

### 3.2 BTC Bridge Integration (US-2) - Dashboard Tab

**AC-2.1**: System integrates Atomiq SDK (@atomiqlabs/sdk) for BTC → wBTC bridging
**AC-2.2**: Dashboard includes bridge widget with BTC amount input
**AC-2.3**: User can initiate bridge transaction through Atomiq SDK
**AC-2.4**: System displays bridge transaction status (pending, confirmed, completed)
**AC-2.5**: System verifies wBTC arrival on Starknet Sepolia testnet
**AC-2.6**: Bridge uses trustless escrow mechanism (no custodial intermediaries)

### 3.3 Privacy Layer Integration (US-3) - Deposit Tab

**AC-3.1**: System integrates Tongo SDK (@fatsolutions/tongo-sdk) for real private transactions
**AC-3.2**: Deposit tab displays user's actual wBTC balance from connected wallet
**AC-3.3**: User can input deposit amount and click "Max" to fill available balance
**AC-3.4**: System executes two-step process: (1) Approve wBTC for Tongo, (2) Fund shielded balance
**AC-3.5**: System displays real transaction status with Starknet transaction hashes
**AC-3.6**: Actual collateral amount is encrypted on-chain using Tongo's ElGamal encryption
**AC-3.7**: System shows success message with link to Voyager explorer after deposit

### 3.4 Lending Integration (US-4) - Borrow Tab

**AC-4.1**: System integrates with live Vesu protocol on Sepolia testnet
**AC-4.2**: Borrow tab displays real borrowing capacity calculated from user's shielded collateral
**AC-4.3**: System fetches and displays actual LTV ratios from Vesu protocol
**AC-4.4**: User can input borrow amount and system validates against real Vesu limits
**AC-4.5**: System executes borrow transaction through PayMejor vault contract
**AC-4.6**: Borrowed USDC is transferred as shielded balance via Tongo
**AC-4.7**: System displays real transaction hash and updates position after confirmation

### 3.5 Leverage Loop (US-5) - Borrow Tab

**AC-5.1**: Borrow tab includes "Enable Auto-Loop Leverage" checkbox
**AC-5.2**: When enabled, system executes: borrow USDC → swap to wBTC (Ekubo) → re-deposit
**AC-5.3**: System uses real Ekubo DEX for USDC → wBTC swaps on Sepolia
**AC-5.4**: Leverage slider (1x-3x) calculates real projected LTV and liquidation price
**AC-5.5**: All loop transactions maintain privacy via Tongo protocol
**AC-5.6**: System displays multi-step progress with real transaction hashes

### 3.6 Position Management (US-6) - Positions Tab

**AC-6.1**: Positions tab fetches real user positions from PayMejor vault contract
**AC-6.2**: System displays encrypted collateral/debt amounts (****) by default
**AC-6.3**: User can click "Reveal Position" to decrypt using Tongo SDK
**AC-6.4**: System displays real decrypted collateral balance (wBTC) and debt balance (USDC)
**AC-6.5**: System calculates and displays actual LTV ratio from on-chain data
**AC-6.6**: System displays real health factor with color-coded risk indicators
**AC-6.7**: Position data updates in real-time after transactions confirm on-chain

### 3.7 NGN Off-ramp Information (US-7) - Exit Tab

**AC-7.1**: Exit tab displays real USDC balance available for withdrawal
**AC-7.2**: System fetches live USDC/NGN exchange rate from API (e.g., CoinGecko)
**AC-7.3**: System calculates estimated NGN amount based on current rates
**AC-7.4**: System provides links to real P2P platforms (Binance P2P, Paxful, etc.)
**AC-7.5**: UI includes clear disclaimer that off-ramp is external to protocol

## 4. Technical Requirements

### 4.1 Blockchain & Network

**TR-4.1**: Deploy all contracts to Starknet Sepolia testnet (production-ready for mainnet)
**TR-4.2**: Use real testnet wBTC token (no mocks or test tokens)
**TR-4.3**: Integrate with live Vesu testnet deployment
**TR-4.4**: Use starknet.js v6+ for all contract interactions
**TR-4.5**: Use Xverse SDK/connector for wallet connections
**TR-4.6**: Use Atomiq SDK (@atomiqlabs/sdk) for BTC → wBTC bridging

### 4.2 Smart Contracts

**TR-4.7**: Deploy PayMejor Vault contract to Sepolia with verified source code
**TR-4.8**: Vault contract integrates with real Tongo protocol contracts
**TR-4.9**: Vault contract does NOT integrate with Vesu (custom vault with mock oracle)
**TR-4.10**: Contract handles Tongo encrypted balances (ElGamal ciphertexts)
**TR-4.11**: Contract emits events for all state changes (deposit, borrow, loop)
**TR-4.12**: Contract includes proper access control (only position owner can act)
**TR-4.13**: Contract includes mock USDC pool for borrowing (simple mint/faucet)
**TR-4.14**: Contract includes mock oracle for BTC price and LTV calculations

### 4.3 Frontend Integration

**TR-4.15**: Replace mock wallet context with real Xverse wallet integration
**TR-4.16**: Create custom hooks: useXverse, useAtomiq, useTongo, useVault
**TR-4.17**: All tabs fetch real data from Starknet (no hardcoded values)
**TR-4.18**: Display real transaction hashes with links to Voyager explorer
**TR-4.19**: Handle real transaction states (pending, confirmed, failed)
**TR-4.20**: Implement proper error handling for failed transactions
**TR-4.21**: Use environment variables for all contract addresses and RPC URLs

### 4.4 Security

**TR-4.22**: Never expose private keys in frontend code
**TR-4.23**: Validate all user inputs before submitting transactions
**TR-4.24**: Use secure RPC endpoints (Infura, Alchemy, or Blast API)
**TR-4.25**: Implement proper error messages without leaking sensitive info
**TR-4.26**: Add transaction confirmation dialogs before executing
**TR-4.27**: Implement rate limiting for API calls

## 5. Non-Functional Requirements

### 5.1 Performance

**NFR-5.1**: Wallet connection completes within 5 seconds
**NFR-5.2**: Transaction status updates within 10 seconds of on-chain confirmation
**NFR-5.3**: UI remains responsive during blockchain operations
**NFR-5.4**: Position data loads within 3 seconds from contract query

### 5.2 Usability

**NFR-5.5**: Clear step-by-step flow matches existing tab structure
**NFR-5.6**: Privacy benefits highlighted in UI (existing alerts maintained)
**NFR-5.7**: Real transaction costs (gas fees) displayed before confirmation
**NFR-5.8**: Error messages are user-friendly and actionable

### 5.3 Compatibility

**NFR-5.9**: Works with Xverse wallet on Sepolia
**NFR-5.10**: Compatible with Chrome, Firefox, Brave browsers
**NFR-5.11**: Mobile-responsive design (existing UI already responsive)
**NFR-5.12**: Works on both desktop and mobile wallet extensions

## 6. Out of Scope (For Initial Production Release)

- Mainnet deployment (Sepolia testnet first)
- Liquidation bot implementation
- Multiple collateral types (only wBTC for MVP)
- Actual NGN on/off-ramp integration (links to external platforms only)
- Governance features
- Advanced position management (partial withdrawals, repayments)
- Multi-language support
- Historical transaction views
- Full Vesu integration (using custom vault with mock oracle instead)
- Ekubo DEX integration for leverage loop (simplified loop for MVP)

## 7. Success Metrics

- User can complete full flow on Sepolia: Connect → Bridge → Shield → Borrow → View position
- All transactions confirmed on-chain with real transaction hashes
- Privacy maintained: collateral/debt amounts encrypted on-chain via Tongo
- Position decryption works correctly using Tongo SDK
- Demo video shows complete Lagos BTC holder use case with real testnet transactions
- Application deployed and accessible via public URL

## 8. Dependencies & Integration Points

### 8.1 External Protocols (All on Sepolia Testnet)

- **Atomiq Bridge**: BTC → wBTC bridging
  - SDK: @atomiqlabs/sdk
  - Docs: Check npm for Starknet chain support
  - Integration: In-app bridge widget using SDK

- **Tongo Protocol**: Privacy layer for shielded balances
  - SDK: @fatsolutions/tongo-sdk
  - Docs: https://docs.tongo.cash/sdk/quick-start.html
  
- **Custom Vault**: Lending and borrowing (NO Vesu)
  - Mock USDC pool for borrowing
  - Mock oracle for BTC price and LTV
  - Simple vault contract for MVP

### 8.2 Wallet Integration

- **Xverse Wallet**: Primary wallet for BTC + Starknet
  - SDK: Check xverse.app/dev or GitHub for Starknet integration
  - Supports: BTC bridging/swaps + Starknet connect
  - Network: Starknet Sepolia testnet

### 8.3 Infrastructure

- **RPC Provider**: Infura, Alchemy, or Blast API for Starknet
- **Block Explorer**: Voyager (sepolia.voyager.online)
- **Deployment**: Vercel for frontend hosting
- **Contract Verification**: Voyager contract verification

## 9. Implementation Notes

### 9.1 Existing Frontend Structure

The application already has:
- Complete UI with 5 tabs (Dashboard, Deposit, Borrow, Positions, Exit)
- Responsive design with mobile bottom navigation
- Theme support (dark/light mode)
- Component library (shadcn/ui)
- Mock wallet context (to be replaced)

### 9.2 Integration Approach

Implementation will:
1. Replace mock wallet context with real get-starknet integration
2. Create custom hooks for each protocol (Tongo, Vesu, Ekubo)
3. Integrate real blockchain calls into existing tab components
4. Add transaction state management and error handling
5. Deploy contracts and update environment variables
6. Test end-to-end on Sepolia testnet

### 9.3 No Mocks or Simulations

All functionality must work with real protocols:
- Real wallet connections (not mock addresses)
- Real wBTC token on Sepolia
- Real Tongo encryption/decryption
- Real Vesu borrowing capacity calculations
- Real Ekubo swaps for leverage
- Real transaction hashes and confirmations
