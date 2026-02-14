# PayMejor Implementation Tasks

## Phase 1: Project Setup & Infrastructure (Days 1-2)

- [ ] 1. [Frontend] Initialize Project Structure
  - [ ] 1.1 [Frontend] Create Next.js 14 project with TypeScript and Tailwind CSS
  - [ ] 1.2 [Frontend] Set up project folder structure (app/, components/, hooks/, lib/)
  - [ ] 1.3 [Frontend] Configure TypeScript with strict mode
  - [ ] 1.4 [Frontend] Set up ESLint and Prettier
  - [ ] 1.5 [Frontend] Initialize Git repository and create .gitignore

- [ ] 2. [Frontend] Install Core Dependencies
  - [ ] 2.1 [Frontend] Install Starknet.js (`npm install starknet`)
  - [ ] 2.2 [Frontend] Install Tongo SDK (`npm install @fatsolutions/tongo-sdk`)
  - [ ] 2.3 [Frontend] Install Atomiq SDK (`npm install @atomiqlabs/sdk`)
  - [ ] 2.4 [Frontend] Install Xverse wallet SDK (check npm/docs for package name)
  - [ ] 2.5 [Frontend] Install UI dependencies (tailwindcss, clsx, lucide-react)

- [ ] 3. [Frontend] Environment Configuration
  - [ ] 3.1 [Frontend] Create .env.local with Starknet Sepolia RPC URL
  - [ ] 3.2 [Frontend] Add placeholder contract addresses (to be filled after deployment)
  - [ ] 3.3 [Frontend] Create lib/constants.ts with network config and addresses
  - [ ] 3.4 [Frontend] Set up environment variable validation

## Phase 2: Wallet Integration (Days 2-3)

- [ ] 4. [Frontend] Xverse Wallet Connection
  - [ ] 4.1 [Frontend] Create useXverse hook for wallet connection logic
  - [ ] 4.2 [Frontend] Implement connect() function to trigger Xverse wallet
  - [ ] 4.3 [Frontend] Implement disconnect() function and state cleanup
  - [ ] 4.4 [Frontend] Store wallet address and connection state in React context
  - [ ] 4.5 [Frontend] Handle wallet connection errors and edge cases

- [ ] 5. [Frontend] Wallet UI Components
  - [ ] 5.1 [Frontend] Create WalletConnect component with connect/disconnect button
  - [ ] 5.2 [Frontend] Display connected wallet address (truncated)
  - [ ] 5.3 [Frontend] Show network indicator (Sepolia testnet)
  - [ ] 5.4 [Frontend] Add wallet connection status indicator
  - [ ] 5.5 [Frontend] Persist connection state across page refreshes

## Phase 3: BTC Bridge Integration (Days 3-4)

- [ ] 6. [Frontend] Atomiq SDK Integration
  - [ ] 6.1 [Frontend] Create useAtomiq hook for bridge operations
  - [ ] 6.2 [Frontend] Initialize AtomiqClient with Sepolia testnet config
  - [ ] 6.3 [Frontend] Implement initiateBridge() function with BTC amount input
  - [ ] 6.4 [Frontend] Implement getTransactionStatus() to poll bridge status
  - [ ] 6.5 [Frontend] Handle bridge transaction errors and timeouts

- [ ] 7. [Frontend] Bridge UI Components
  - [ ] 7.1 [Frontend] Create BridgeWidget component with amount input
  - [ ] 7.2 [Frontend] Add bridge button with loading state
  - [ ] 7.3 [Frontend] Display bridge transaction status (pending/confirmed/completed)
  - [ ] 7.4 [Frontend] Show estimated time and fees
  - [ ] 7.5 [Frontend] Add link to Atomiq explorer for transaction tracking

- [ ] 8. [Frontend] Bridge Testing
  - [ ] 8.1 [Frontend] Test bridge initiation with testnet BTC
  - [ ] 8.2 [Frontend] Verify wBTC arrival on Sepolia
  - [ ] 8.3 [Frontend] Test error handling for insufficient balance
  - [ ] 8.4 [Frontend] Test status polling and UI updates

## Phase 4: Privacy Layer Integration (Days 4-6)

- [ ] 9. [Frontend] Tongo SDK Setup
  - [ ] 9.1 [Frontend] Create useTongo hook for privacy operations
  - [ ] 9.2 [Frontend] Initialize TongoProvider with Sepolia RPC
  - [ ] 9.3 [Frontend] Implement createTongoAccount() from Xverse signer
  - [ ] 9.4 [Frontend] Store Tongo account in state management
  - [ ] 9.5 [Frontend] Handle Tongo account creation errors

- [ ] 10. [Frontend] Shielded Deposit Implementation
  - [ ] 10.1 [Frontend] Implement approveToken() for wBTC → Tongo
  - [ ] 10.2 [Frontend] Implement fundShielded() to deposit wBTC privately
  - [ ] 10.3 [Frontend] Add transaction confirmation waiting logic
  - [ ] 10.4 [Frontend] Implement getShieldedBalance() to decrypt balance
  - [ ] 10.5 [Frontend] Handle deposit errors and insufficient balance

- [ ] 11. [Frontend] Deposit UI Components
  - [ ] 11.1 [Frontend] Create DepositForm component with amount input
  - [ ] 11.2 [Frontend] Show wBTC balance and max button
  - [ ] 11.3 [Frontend] Display approve and deposit as two-step process
  - [ ] 11.4 [Frontend] Add loading states for approve and deposit
  - [ ] 11.5 [Frontend] Show success message with decrypted balance

- [ ] 12. [Frontend] Privacy Testing
  - [ ] 12.1 [Frontend] Test wBTC approval transaction
  - [ ] 12.2 [Frontend] Test shielded deposit with Tongo
  - [ ] 12.3 [Frontend] Verify balance is encrypted on-chain
  - [ ] 12.4 [Frontend] Test balance decryption with user key
  - [ ] 12.5 [Frontend] Verify privacy: check on-chain data is hidden

## Phase 5: Cairo Vault Contract (Days 6-8)

- [ ] 13. [Contract] Cairo Contract Development
  - [ ] 13.1 [Contract] Set up Scarb project for Cairo contract
  - [ ] 13.2 [Contract] Define Position struct with encrypted fields
  - [ ] 13.3 [Contract] Implement deposit() function with Tongo integration
  - [ ] 13.4 [Contract] Implement borrow() function with Vesu integration
  - [ ] 13.5 [Contract] Implement leverage_loop() function
  - [ ] 13.6 [Contract] Implement get_position() view function
  - [ ] 13.7 [Contract] Add events for all state changes

- [ ] 14. [Contract] Vesu Protocol Integration
  - [ ] 14.1 [Contract] Research Vesu testnet deployment addresses
  - [ ] 14.2 [Contract] Define IVesuPool interface in Cairo
  - [ ] 14.3 [Contract] Implement borrow logic calling Vesu pool
  - [ ] 14.4 [Contract] Implement LTV checking via Vesu
  - [ ] 14.5 [Contract] Handle Vesu errors (insufficient liquidity, etc.)

- [ ] 15. [Contract] Contract Testing
  - [ ] 15.1 [Contract] Write unit tests for deposit function
  - [ ] 15.2 [Contract] Write unit tests for borrow function
  - [ ] 15.3 [Contract] Write unit tests for leverage loop
  - [ ] 15.4 [Contract] Test Tongo integration (mock or testnet)
  - [ ] 15.5 [Contract] Test Vesu integration (mock or testnet)

- [ ] 16. [Contract] Contract Deployment
  - [ ] 16.1 [Contract] Deploy PayMejor Vault to Sepolia testnet
  - [ ] 16.2 [Contract] Verify contract on Voyager explorer
  - [ ] 16.3 [Contract] Update .env.local with deployed contract address
  - [ ] 16.4 [Contract] Test deployed contract with Starknet.js
  - [ ] 16.5 [Contract] Document contract address in README

## Phase 6: Lending Integration (Days 8-10)

- [ ] 17. [Frontend] Vesu Frontend Integration
  - [ ] 17.1 [Frontend] Create useVesu hook for lending operations
  - [ ] 17.2 [Frontend] Implement getBorrowCapacity() to check available credit
  - [ ] 17.3 [Frontend] Implement getCurrentLTV() to display health factor
  - [ ] 17.4 [Frontend] Implement getLiquidationThreshold()
  - [ ] 17.5 [Frontend] Handle Vesu API errors

- [ ] 18. [Frontend] Vault Contract Interaction
  - [ ] 18.1 [Frontend] Create useVault hook for contract calls
  - [ ] 18.2 [Frontend] Implement deposit() wrapper calling vault contract
  - [ ] 18.3 [Frontend] Implement borrow() wrapper calling vault contract
  - [ ] 18.4 [Frontend] Implement getPosition() to fetch user position
  - [ ] 18.5 [Frontend] Add transaction status tracking

- [ ] 19. [Frontend] Borrow UI Components
  - [ ] 19.1 [Frontend] Create BorrowForm component with amount input
  - [ ] 19.2 [Frontend] Display available borrowing capacity
  - [ ] 19.3 [Frontend] Show current LTV and liquidation threshold
  - [ ] 19.4 [Frontend] Add borrow button with validation
  - [ ] 19.5 [Frontend] Display borrowed amount (decrypted)

- [ ] 20. [Frontend] Borrow Testing
  - [ ] 20.1 [Frontend] Test borrow with sufficient collateral
  - [ ] 20.2 [Frontend] Test borrow rejection with insufficient collateral
  - [ ] 20.3 [Frontend] Verify borrowed USDC is shielded via Tongo
  - [ ] 20.4 [Frontend] Test LTV calculation accuracy
  - [ ] 20.5 [Frontend] Test liquidation threshold warnings

## Phase 7: Leverage Loop (Days 10-11)

- [ ] 21. [Frontend] DEX Integration for Swaps
  - [ ] 21.1 [Frontend] Research Ekubo DEX on Sepolia testnet
  - [ ] 21.2 [Frontend] Create useSwap hook for USDC → wBTC swaps
  - [ ] 21.3 [Frontend] Implement getSwapQuote() for price estimation
  - [ ] 21.4 [Frontend] Implement executeSwap() for USDC → wBTC
  - [ ] 21.5 [Frontend] Handle swap errors and slippage

- [ ] 22. [Contract] Leverage Loop Implementation
  - [ ] 22.1 [Contract] Implement leverageLoop() in vault contract (if not done)
  - [ ] 22.2 [Frontend] Create useLeverage hook in frontend
  - [ ] 22.3 [Frontend] Implement loop logic: borrow → swap → deposit
  - [ ] 22.4 [Frontend] Calculate new LTV after loop
  - [ ] 22.5 [Frontend] Add loop iteration limit (1x for MVP)

- [ ] 23. [Frontend] Leverage UI Components
  - [ ] 23.1 [Frontend] Create LeverageForm component
  - [ ] 23.2 [Frontend] Show leverage multiplier slider/input
  - [ ] 23.3 [Frontend] Display projected LTV after leverage
  - [ ] 23.4 [Frontend] Add execute leverage button
  - [ ] 23.5 [Frontend] Show multi-step progress (borrow → swap → deposit)

- [ ] 24. [Frontend] Leverage Testing
  - [ ] 24.1 [Frontend] Test single leverage loop execution
  - [ ] 24.2 [Frontend] Verify collateral increase after loop
  - [ ] 24.3 [Frontend] Verify borrowing capacity increase
  - [ ] 24.4 [Frontend] Test loop with maximum safe LTV
  - [ ] 24.5 [Frontend] Test error handling for failed swaps

## Phase 8: Position Management (Days 11-12)

- [ ] 25. [Frontend] Position Display Components
  - [ ] 25.1 [Frontend] Create PositionDisplay component
  - [ ] 25.2 [Frontend] Show decrypted collateral balance (wBTC)
  - [ ] 25.3 [Frontend] Show decrypted debt balance (USDC)
  - [ ] 25.4 [Frontend] Display current LTV with visual indicator
  - [ ] 25.5 [Frontend] Display liquidation threshold with warning colors
  - [ ] 25.6 [Frontend] Add refresh button to update position

- [ ] 26. [Frontend] Position Decryption
  - [ ] 26.1 [Frontend] Implement decryptPosition() using Tongo SDK
  - [ ] 26.2 [Frontend] Handle decryption errors gracefully
  - [ ] 26.3 [Frontend] Cache decrypted values (invalidate on tx)
  - [ ] 26.4 [Frontend] Add loading state during decryption
  - [ ] 26.5 [Frontend] Show privacy indicator (encrypted on-chain)

- [ ] 27. [Frontend] Real-time Updates
  - [ ] 27.1 [Frontend] Implement position polling (every 10s)
  - [ ] 27.2 [Frontend] Update UI on transaction confirmation
  - [ ] 27.3 [Frontend] Show transaction pending state
  - [ ] 27.4 [Frontend] Add manual refresh button
  - [ ] 27.5 [Frontend] Handle WebSocket updates (if available)

## Phase 9: NGN Off-ramp Simulation (Days 12-13)

- [ ] 28. [Frontend] Off-ramp Simulator
  - [ ] 28.1 [Frontend] Create OffRampSimulator component
  - [ ] 28.2 [Frontend] Fetch USDC/NGN exchange rate (API or mock)
  - [ ] 28.3 [Frontend] Calculate estimated NGN amount from borrowed USDC
  - [ ] 28.4 [Frontend] Display P2P off-ramp instructions (Binance, local)
  - [ ] 28.5 [Frontend] Add disclaimer about external off-ramp

- [ ] 29. [Frontend] Off-ramp UI
  - [ ] 29.1 [Frontend] Show USDC balance available for off-ramp
  - [ ] 29.2 [Frontend] Display NGN conversion calculator
  - [ ] 29.3 [Frontend] List recommended P2P platforms
  - [ ] 29.4 [Frontend] Add links to exchange tutorials
  - [ ] 29.5 [Frontend] Show estimated fees and time

## Phase 10: UI Polish & UX (Days 13-14)

- [ ] 30. [Frontend] Landing Page
  - [ ] 30.1 [Frontend] Create hero section with value proposition
  - [ ] 30.2 [Frontend] Add "How it Works" section with steps
  - [ ] 30.3 [Frontend] Highlight privacy benefits
  - [ ] 30.4 [Frontend] Add "Connect Wallet" CTA button
  - [ ] 30.5 [Frontend] Make responsive for mobile

- [ ] 31. [Frontend] Navigation & Layout
  - [ ] 31.1 [Frontend] Create navigation bar with wallet status
  - [ ] 31.2 [Frontend] Add step indicator for user flow
  - [ ] 31.3 [Frontend] Implement breadcrumb navigation
  - [ ] 31.4 [Frontend] Add footer with links and social
  - [ ] 31.5 [Frontend] Ensure consistent spacing and typography

- [ ] 32. [Frontend] Error Handling & Feedback
  - [ ] 32.1 [Frontend] Create Toast notification system
  - [ ] 32.2 [Frontend] Add error messages for all failure cases
  - [ ] 32.3 [Frontend] Add success messages for completed actions
  - [ ] 32.4 [Frontend] Implement loading skeletons
  - [ ] 32.5 [Frontend] Add transaction pending indicators

- [ ] 33. [Frontend] Accessibility & Performance
  - [ ] 33.1 [Frontend] Add ARIA labels to interactive elements
  - [ ] 33.2 [Frontend] Ensure keyboard navigation works
  - [ ] 33.3 [Frontend] Test with screen reader
  - [ ] 33.4 [Frontend] Optimize images and assets
  - [ ] 33.5 [Frontend] Add meta tags for SEO

## Phase 11: Testing & Documentation (Day 14)

- [ ] 34. [Frontend] End-to-End Testing
  - [ ] 34.1 [Frontend] Test complete flow: connect → bridge → deposit → borrow
  - [ ] 34.2 [Frontend] Test leverage loop end-to-end
  - [ ] 34.3 [Frontend] Test position viewing and decryption
  - [ ] 34.4 [Frontend] Test error scenarios (insufficient balance, etc.)
  - [ ] 34.5 [Frontend] Test on different browsers (Chrome, Firefox, Brave)

- [ ] 35. [Frontend] Documentation
  - [ ] 35.1 [Frontend] Write comprehensive README with setup instructions
  - [ ] 35.2 [Frontend] Document all environment variables
  - [ ] 35.3 [Frontend] Add architecture diagram
  - [ ] 35.4 [Contract] Document contract addresses and ABIs
  - [ ] 35.5 [Frontend] Create user guide with screenshots

- [ ] 36. [Frontend] Demo Preparation
  - [ ] 36.1 [Frontend] Record demo video showing complete flow
  - [ ] 36.2 [Frontend] Prepare demo script with Lagos BTC holder story
  - [ ] 36.3 [Frontend] Create slide deck highlighting key features
  - [ ] 36.4 [Frontend] Test demo on fresh browser (no cached state)
  - [ ] 36.5 [Frontend] Prepare backup plan for live demo issues

## Phase 12: Deployment & Submission (Day 14)

- [ ] 37. [Frontend] Frontend Deployment
  - [ ] 37.1 [Frontend] Deploy to Vercel with production environment variables
  - [ ] 37.2 [Frontend] Configure custom domain (if available)
  - [ ] 37.3 [Frontend] Test deployed app on Sepolia testnet
  - [ ] 37.4 [Frontend] Set up error monitoring (Sentry or similar)
  - [ ] 37.5 [Frontend] Verify all features work in production

- [ ] 38. [Frontend] Final Checks
  - [ ] 38.1 [Contract] Verify all contracts deployed and verified on Voyager
  - [ ] 38.2 [Frontend] Test complete user flow on production URL
  - [ ] 38.3 [Frontend] Check mobile responsiveness
  - [ ] 38.4 [Frontend] Verify all links and resources work
  - [ ] 38.5 [Frontend] Run final security check (no exposed keys)

- [ ] 39. [Frontend] Hackathon Submission
  - [ ] 39.1 [Frontend] Prepare submission form with all required info
  - [ ] 39.2 [Frontend] Upload demo video to YouTube/Loom
  - [ ] 39.3 [Frontend] Submit GitHub repository link
  - [ ] 39.4 [Frontend] Submit live demo URL
  - [ ] 39.5 [Frontend] Emphasize: Atomiq bridge + Xverse + Tongo privacy + Vesu + NGN use case

## Optional Enhancements (If Time Permits)

- [ ]* 40. [Frontend] Advanced Features
  - [ ]* 40.1 [Frontend] Add transaction history view
  - [ ]* 40.2 [Contract] Implement partial withdrawal
  - [ ]* 40.3 [Contract] Add repayment functionality
  - [ ]* 40.4 [Frontend] Create analytics dashboard
  - [ ]* 40.5 [Frontend] Add multi-language support (English + Yoruba/Igbo)

- [ ]* 41. [Frontend] Additional Testing
  - [ ]* 41.1 [Frontend] Write comprehensive unit tests
  - [ ]* 41.2 [Frontend] Add integration tests with Playwright
  - [ ]* 41.3 [Contract] Perform security audit
  - [ ]* 41.4 [Frontend] Load testing for concurrent users
  - [ ]* 41.5 [Contract] Gas optimization analysis
