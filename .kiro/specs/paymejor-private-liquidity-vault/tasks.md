# PayMejor Implementation Tasks (Production-Ready)

## Overview

This implementation plan integrates real blockchain functionality into the existing Next.js frontend. All features will work with live protocols on Starknet Sepolia testnet - **no mocks or simulations**.

**Existing Frontend**: Complete UI with 5 tabs (Dashboard, Deposit, Borrow, Positions, Exit)  
**Implementation Focus**: Replace mock data with real blockchain integrations

---

## Phase 1: Environment Setup & Dependencies (Day 1)

- [ ] 1. [Frontend] Install Blockchain Dependencies
  - [ ] 1.1 [Frontend] Install starknet.js v6+ (`pnpm add starknet@next`)
  - [ ] 1.2 [Frontend] Install Xverse SDK/connector (check xverse.app/dev for package)
  - [ ] 1.3 [Frontend] Install Atomiq SDK (`pnpm add @atomiqlabs/sdk`)
  - [ ] 1.4 [Frontend] Install Tongo SDK (`pnpm add @fatsolutions/tongo-sdk`)
  - [ ] 1.5 [Frontend] Remove any unused dependencies (Vesu, Ekubo not needed for MVP)
  - _Requirements: TR-4.5, TR-4.6, TR-4.7_

- [ ] 2. [Frontend] Environment Configuration
  - [ ] 2.1 [Frontend] Create .env.local with Starknet Sepolia RPC URL
  - [ ] 2.2 [Frontend] Add environment variables for contract addresses
  - [ ] 2.3 [Frontend] Create lib/constants.ts with network config and addresses
  - [ ] 2.4 [Frontend] Add environment variable validation on app startup
  - [ ] 2.5 [Frontend] Document all required environment variables in README
  - _Requirements: TR-4.21, TR-4.24_

- [ ] 3. [Frontend] Create Type Definitions
  - [ ] 3.1 [Frontend] Create types/starknet.ts with Starknet types
  - [ ] 3.2 [Frontend] Create types/tongo.ts with Tongo SDK types
  - [ ] 3.3 [Frontend] Create types/atomiq.ts with Atomiq SDK types
  - [ ] 3.4 [Frontend] Create types/position.ts with position data types
  - [ ] 3.5 [Frontend] Update existing types to remove mock structures
  - _Requirements: TR-4.17_

---

## Phase 2: Real Wallet Integration (Days 1-2)

- [ ] 4. [Frontend] Replace Mock Wallet Context
  - [ ] 4.1 [Frontend] Update lib/wallet-context.tsx to use Xverse SDK
  - [ ] 4.2 [Frontend] Implement real connect() for Xverse wallet
  - [ ] 4.3 [Frontend] Implement real disconnect() with cleanup
  - [ ] 4.4 [Frontend] Store real Starknet AccountInterface in context
  - [ ] 4.5 [Frontend] Add network detection (ensure Sepolia)
  - _Requirements: AC-1.1, AC-1.2, AC-1.3, TR-4.15_

- [ ] 5. [Frontend] Update Navbar Component
  - [ ] 5.1 [Frontend] Update navbar.tsx to display real Xverse wallet address
  - [ ] 5.2 [Frontend] Add network indicator showing "Starknet Sepolia"
  - [ ] 5.3 [Frontend] Add wallet connection error handling
  - [ ] 5.4 [Frontend] Test with Xverse wallet on Sepolia
  - [ ] 5.5 [Frontend] Verify BTC + Starknet address display
  - _Requirements: AC-1.4, AC-1.5, NFR-5.9_

- [ ] 6. [Frontend] Create Starknet Hook
  - [ ] 6.1 [Frontend] Create hooks/useStarknet.ts for blockchain interactions
  - [ ] 6.2 [Frontend] Implement getBalance() to fetch real token balances
  - [ ] 6.3 [Frontend] Implement sendTransaction() wrapper with error handling
  - [ ] 6.4 [Frontend] Implement waitForTransaction() to poll tx status
  - [ ] 6.5 [Frontend] Add transaction state management
  - _Requirements: TR-4.17, TR-4.20_

---

## Phase 3: Dashboard Tab - Real Data & Bridge (Days 2-3)

- [ ] 7. [Frontend] Update Dashboard with Real Balances
  - [ ] 7.1 [Frontend] Update dashboard-tab.tsx to fetch real wBTC balance
  - [ ] 7.2 [Frontend] Fetch real USDC balance from connected wallet
  - [ ] 7.3 [Frontend] Replace hardcoded stats with real blockchain data
  - [ ] 7.4 [Frontend] Add loading states while fetching data
  - [ ] 7.5 [Frontend] Add error handling for failed fetches
  - _Requirements: AC-1.6, TR-4.17_

- [ ] 8. [Frontend] Implement Atomiq Bridge Widget
  - [ ] 8.1 [Frontend] Create hooks/useAtomiq.ts for Atomiq SDK integration
  - [ ] 8.2 [Frontend] Initialize AtomiqClient with Sepolia testnet config
  - [ ] 8.3 [Frontend] Create BridgeWidget component with BTC amount input
  - [ ] 8.4 [Frontend] Implement initiateBridge() function calling Atomiq SDK
  - [ ] 8.5 [Frontend] Implement getTransactionStatus() to poll bridge status
  - [ ] 8.6 [Frontend] Display bridge transaction status (pending/confirmed/completed)
  - [ ] 8.7 [Frontend] Add bridge widget to Dashboard tab
  - [ ] 8.8 [Frontend] Test bridge flow with real Xverse wallet on Sepolia
  - _Requirements: AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6_

---

## Phase 4: Tongo Privacy Integration (Days 3-4)

- [ ] 9. [Frontend] Create Tongo Hook
  - [ ] 9.1 [Frontend] Create hooks/useTongo.ts for Tongo SDK
  - [ ] 9.2 [Frontend] Initialize TongoProvider with Sepolia RPC
  - [ ] 9.3 [Frontend] Implement createTongoAccount() from Xverse Starknet signer
  - [ ] 9.4 [Frontend] Implement fundShielded() to deposit privately
  - [ ] 9.5 [Frontend] Implement getShieldedBalance() to fetch encrypted balance
  - [ ] 9.6 [Frontend] Implement decryptBalance() using user's key
  - [ ] 9.7 [Frontend] Add error handling for Tongo operations
  - _Requirements: AC-3.1, TR-4.16_

- [ ] 10. [Frontend] Update Deposit Tab with Tongo
  - [ ] 10.1 [Frontend] Update deposit-tab.tsx to fetch real wBTC balance
  - [ ] 10.2 [Frontend] Implement real approve tx for wBTC → Tongo
  - [ ] 10.3 [Frontend] Implement real fund tx to shield balance
  - [ ] 10.4 [Frontend] Display real tx hashes with Voyager links
  - [ ] 10.5 [Frontend] Update status based on real confirmations
  - [ ] 10.6 [Frontend] Show success with decrypted balance
  - [ ] 10.7 [Frontend] Add error handling for failed transactions
  - _Requirements: AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.6, AC-3.7_

- [ ] 11. [Frontend] Test Tongo on Sepolia
  - [ ] 11.1 [Frontend] Test wBTC approval on Sepolia testnet
  - [ ] 11.2 [Frontend] Test shielded deposit with real Tongo
  - [ ] 11.3 [Frontend] Verify balance encrypted on-chain (Voyager)
  - [ ] 11.4 [Frontend] Test balance decryption with user's key
  - [ ] 11.5 [Frontend] Verify privacy: amounts hidden on-chain
  - _Requirements: AC-3.6_

---

## Phase 5: Cairo Vault Contract (Days 4-6)

- [x] 12. [Contract] Set Up Cairo Project
  - [x] 12.1 [Contract] Initialize Scarb project for PayMejor Vault
  - [x] 12.2 [Contract] Add dependencies: Tongo interfaces, OpenZeppelin
  - [x] 12.3 [Contract] Define Position struct with encrypted fields
  - [x] 12.4 [Contract] Set up storage with LegacyMap for positions
  - [x] 12.5 [Contract] Add initialization with Tongo protocol address
  - _Requirements: TR-4.7, TR-4.8_

- [x] 13. [Contract] Implement Core Vault Functions
  - [x] 13.1 [Contract] Implement deposit() calling Tongo.fund()
  - [x] 13.2 [Contract] Implement mock USDC pool (simple mint/faucet)
  - [x] 13.3 [Contract] Implement mock oracle for BTC price
  - [x] 13.4 [Contract] Implement borrow() with mock LTV calculation
  - [x] 13.5 [Contract] Implement get_position() view function
  - [x] 13.6 [Contract] Implement get_borrowing_capacity() view
  - [x] 13.7 [Contract] Add events for state changes
  - [x] 13.8 [Contract] Add access control (owner only)
  - _Requirements: TR-4.9, TR-4.10, TR-4.11, TR-4.12, TR-4.13, TR-4.14_

- [x] 14. [Contract] Implement Simple Leverage Loop
  - [x] 14.1 [Contract] Implement leverage_loop() function
  - [-] 14.2 [Contract] Implement simple loop: borrow → re-deposit as collateral
  - [x] 14.3 [Contract] Add loop iteration limit (max 1 for MVP)
  - [x] 14.4 [Contract] Skip DEX integration (simplified for MVP)
  - [x] 14.5 [Contract] Add slippage protection (basic checks)
  - _Requirements: AC-5.2, AC-5.5_

- [ ] 15. [Contract] Deploy to Sepolia
  - [ ] 15.1 [Contract] Deploy PayMejor Vault to Sepolia
  - [ ] 15.2 [Contract] Verify source code on Voyager
  - [ ] 15.3 [Contract] Update .env.local with contract address
  - [ ] 15.4 [Contract] Test contract with Starknet.js
  - [ ] 15.5 [Contract] Document address and ABI in README
  - _Requirements: TR-4.7_

---

## Phase 6: Vault Frontend Integration (Days 6-7)

- [ ] 16. [Frontend] Create Vault Contract Hook
  - [ ] 16.1 [Frontend] Create hooks/useVault.ts for vault interactions
  - [ ] 16.2 [Frontend] Implement deposit() wrapper calling vault contract
  - [ ] 16.3 [Frontend] Implement borrow() wrapper calling vault contract
  - [ ] 16.4 [Frontend] Implement getPosition() from contract
  - [ ] 16.5 [Frontend] Implement getBorrowingCapacity() from contract
  - [ ] 16.6 [Frontend] Add tx status tracking with real hashes
  - [ ] 16.7 [Frontend] Add error handling for contract failures
  - _Requirements: TR-4.16, TR-4.18, TR-4.20_

- [ ] 17. [Frontend] Update Borrow Tab
  - [ ] 17.1 [Frontend] Update borrow-tab.tsx with real borrowing capacity
  - [ ] 17.2 [Frontend] Display real LTV from vault contract (mock oracle)
  - [ ] 17.3 [Frontend] Display real liquidation threshold
  - [ ] 17.4 [Frontend] Implement real borrow tx through vault
  - [ ] 17.5 [Frontend] Display real tx hash with Voyager link
  - [ ] 17.6 [Frontend] Update UI after on-chain confirmation
  - [ ] 17.7 [Frontend] Add validation against vault limits
  - _Requirements: AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-4.6, AC-4.7_

---

## Phase 7: Leverage Loop (Day 7)

- [ ] 18. [Frontend] Implement Simple Loop in Borrow Tab
  - [ ] 18.1 [Frontend] Update borrow-tab.tsx for auto-loop checkbox
  - [ ] 18.2 [Frontend] Implement simple loop: borrow → re-deposit (no DEX swap)
  - [ ] 18.3 [Frontend] Display multi-step progress with tx hashes
  - [ ] 18.4 [Frontend] Calculate projected LTV after loop
  - [ ] 18.5 [Frontend] Calculate liquidation price from mock oracle
  - [ ] 18.6 [Frontend] Add error handling for failed steps
  - [ ] 18.7 [Frontend] Test complete loop on Sepolia
  - _Requirements: AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6_

---

## Phase 8: Position Management (Days 7-8)

- [ ] 19. [Frontend] Update Positions Tab
  - [ ] 19.1 [Frontend] Update positions-tab.tsx with real positions
  - [ ] 19.2 [Frontend] Display encrypted amounts by default (****)
  - [ ] 19.3 [Frontend] Implement "Reveal" button to decrypt via Tongo
  - [ ] 19.4 [Frontend] Display real decrypted collateral (wBTC)
  - [ ] 19.5 [Frontend] Display real decrypted debt (USDC)
  - [ ] 19.6 [Frontend] Calculate real LTV from on-chain data
  - [ ] 19.7 [Frontend] Calculate real health factor
  - [ ] 19.8 [Frontend] Add color-coded risk indicators
  - _Requirements: AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6_

- [ ] 20. [Frontend] Real-Time Position Updates
  - [ ] 20.1 [Frontend] Add position polling (every 10s)
  - [ ] 20.2 [Frontend] Update UI when transactions confirm
  - [ ] 20.3 [Frontend] Add manual refresh button
  - [ ] 20.4 [Frontend] Show pending state during confirmation
  - [ ] 20.5 [Frontend] Add error handling for failed fetches
  - _Requirements: AC-6.7, NFR-5.2, NFR-5.4_

- [ ] 21. [Frontend] Position Decryption
  - [ ] 21.1 [Frontend] Implement decryptPosition() via Tongo
  - [ ] 21.2 [Frontend] Add loading state during decryption
  - [ ] 21.3 [Frontend] Cache decrypted values (invalidate on tx)
  - [ ] 21.4 [Frontend] Handle decryption errors gracefully
  - [ ] 21.5 [Frontend] Add privacy indicator for encrypted data
  - _Requirements: AC-6.2, AC-6.3_

---

## Phase 9: NGN Off-ramp & Exit (Day 8)

- [ ] 22. [Frontend] Update Exit Tab
  - [ ] 22.1 [Frontend] Update exit-tab.tsx with real USDC balance
  - [ ] 22.2 [Frontend] Integrate CoinGecko API for live USDC/NGN rate
  - [ ] 22.3 [Frontend] Calculate estimated NGN from real rate
  - [ ] 22.4 [Frontend] Add links to real P2P platforms
  - [ ] 22.5 [Frontend] Add disclaimer about external off-ramp
  - [ ] 22.6 [Frontend] Test exchange rate fetching
  - _Requirements: AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5_

---

## Phase 10: Testing & Polish (Days 9-10)

- [ ] 23. [Frontend] End-to-End Testing on Sepolia
  - [ ] 23.1 [Frontend] Test: Connect Xverse wallet → View dashboard
  - [ ] 23.2 [Frontend] Test: Bridge BTC via Atomiq SDK → Confirm wBTC
  - [ ] 23.3 [Frontend] Test: Approve → Shield → Confirm deposit
  - [ ] 23.4 [Frontend] Test: Check capacity → Borrow → Confirm
  - [ ] 23.5 [Frontend] Test: Enable auto-loop → Execute → Verify
  - [ ] 23.6 [Frontend] Test: Fetch → Decrypt → Display position
  - [ ] 23.7 [Frontend] Test error scenarios (insufficient balance, etc.)
  - [ ] 23.8 [Frontend] Test on Chrome, Firefox, Brave
  - _Requirements: NFR-5.10_

- [ ] 24. [Frontend] Transaction Error Handling
  - [ ] 24.1 [Frontend] Add user-friendly error messages
  - [ ] 24.2 [Frontend] Implement retry logic for failed transactions
  - [ ] 24.3 [Frontend] Add transaction timeout handling
  - [ ] 24.4 [Frontend] Display gas estimation errors clearly
  - [ ] 24.5 [Frontend] Add support links for issues
  - _Requirements: TR-4.20, TR-4.25, NFR-5.8_

- [ ] 25. [Frontend] Performance Optimization
  - [ ] 25.1 [Frontend] Implement caching for frequent data
  - [ ] 25.2 [Frontend] Add loading skeletons for blockchain fetches
  - [ ] 25.3 [Frontend] Optimize transaction polling intervals
  - [ ] 25.4 [Frontend] Add optimistic UI updates
  - [ ] 25.5 [Frontend] Test with slow network conditions
  - _Requirements: NFR-5.1, NFR-5.2, NFR-5.3, NFR-5.4_

---

## Phase 11: Documentation & Deployment (Day 10)

- [ ] 26. [Frontend] Documentation
  - [ ] 26.1 [Frontend] Write comprehensive README with setup
  - [ ] 26.2 [Frontend] Document all environment variables
  - [ ] 26.3 [Frontend] Add architecture diagram with real integrations
  - [ ] 26.4 [Contract] Document deployed addresses and ABIs
  - [ ] 26.5 [Frontend] Create user guide with screenshots
  - [ ] 26.6 [Frontend] Add troubleshooting section

- [ ] 27. [Frontend] Deployment to Vercel
  - [ ] 27.1 [Frontend] Configure Vercel with environment variables
  - [ ] 27.2 [Frontend] Deploy to Vercel production
  - [ ] 27.3 [Frontend] Test deployed app on Sepolia
  - [ ] 27.4 [Frontend] Verify all features work in production
  - [ ] 27.5 [Frontend] Set up error monitoring (Sentry)
  - [ ] 27.6 [Frontend] Configure custom domain (if available)

- [ ] 28. [Frontend] Final Production Checks
  - [ ] 28.1 [Frontend] Verify all contract addresses in production
  - [ ] 28.2 [Frontend] Test complete flow on production URL
  - [ ] 28.3 [Frontend] Verify all Voyager links work
  - [ ] 28.4 [Frontend] Check mobile responsiveness on devices
  - [ ] 28.5 [Frontend] Run security check (no exposed keys)
  - [ ] 28.6 [Frontend] Verify all external links work

---

## Implementation Notes

### Priorities

1. **Xverse Wallet** (Phase 2) - Foundation for BTC + Starknet
2. **Atomiq Bridge** (Phase 3) - Core BTC bridging feature
3. **Tongo Privacy** (Phase 4) - Core differentiator
4. **Vault Contract** (Phase 5) - Central smart contract with mock oracle
5. **Vault Integration** (Phase 6) - Connect frontend to contract
6. **Leverage Loop** (Phase 7) - Simplified loop (no DEX)
7. **Position Management** (Phase 8) - User experience
8. **Testing & Deployment** (Phases 10-11) - Production readiness

### Key Differences from Original PRD

**Using Xverse Wallet**:
- Primary wallet for BTC + Starknet support
- Replaces Argent/Braavos for BTC-native users

**Using Atomiq SDK**:
- In-app bridge widget (not redirect)
- Real BTC → wBTC bridging via SDK

**Custom Vault (No Vesu)**:
- Mock USDC pool for borrowing
- Mock oracle for BTC price/LTV
- Faster MVP implementation

**Simplified Leverage Loop**:
- No Ekubo DEX integration
- Simple: borrow → re-deposit
- Faster MVP implementation

### No Mocks or Simulations

Every feature uses real protocols:
- Real Xverse wallet connections
- Real Atomiq SDK for bridging
- Real wBTC token on Sepolia
- Real Tongo encryption/decryption
- Real vault contract (with mock oracle)
- Real transaction hashes and confirmations

### Testing Strategy

- Test each integration on Sepolia as implemented
- Use real testnet tokens (wBTC, USDC)
- Verify transactions on Voyager explorer
- Test with Xverse wallet
- Test error scenarios and edge cases
