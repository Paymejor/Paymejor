# Implementation Plan: PayMejor Private Liquidity Engine

## Overview

This implementation plan transforms the existing Next.js frontend into a production-ready application with real blockchain integrations. The application already has complete UI components; implementation focuses on integrating live protocols (Tongo, Vesu, Autoswap, Atomiq) on both Starknet Sepolia and Mainnet.

**Key Principle**: No mocks or simulations. All features use real smart contracts, real tokens, and real protocol SDKs.

## Tasks

- [x] 1. Network Configuration & Environment Setup
  - Create network-specific configuration system for Sepolia and Mainnet
  - Add environment variables for both networks (RPC URLs, contract addresses)
  - Implement network selector component in navbar
  - Create `useNetwork` hook for network switching
  - Update constants.ts to support dual network configuration
  - _Requirements: TR-4.1, TR-4.9, TR-4.10, TR-4.26, TR-4.27, AC-1.4_

- [x] 2. Wallet Integration Enhancement
  - [x] 2.1 Enhance wallet connection for multi-wallet support
    - Test and verify Xverse wallet compatibility
    - Add wallet detection and connection error handling
    - Implement wallet reconnection on page reload
    - _Requirements: AC-1.1, AC-1.2, AC-1.3, AC-1.5, TR-4.7_

  - [ ]* 2.2 Write unit tests for wallet connection
    - Test wallet connect/disconnect flows
    - Test network detection and validation
    - Test error handling for wrong networks
    - _Requirements: AC-1.1, AC-1.2, AC-1.5_

- [x] 3. Atomiq Bridge Integration
  - [x] 3.1 Implement Atomiq SDK integration
    - Complete useAtomiq hook with real SDK calls
    - Implement bridge transaction initiation
    - Add transaction status polling
    - _Requirements: AC-2.1, AC-2.2, AC-2.3, AC-2.4, TR-4.8_

  - [x] 3.2 Create BridgeWidget component
    - Build bridge UI with amount input and network selector
    - Display bridge transaction status and confirmations
    - Show estimated completion time
    - Add link to Voyager explorer for bridge transactions
    - _Requirements: AC-2.2, AC-2.4, AC-2.7_

  - [x] 3.3 Integrate bridge widget into Dashboard tab
    - Add bridge widget to dashboard quick actions
    - Connect to real Atomiq SDK
    - Display wBTC arrival confirmation
    - _Requirements: AC-2.5, AC-2.7_

  - [ ]* 3.4 Write unit tests for Atomiq integration
    - Test bridge initiation with valid parameters
    - Test status polling and updates
    - Test error handling for failed bridges
    - _Requirements: AC-2.1, AC-2.3, AC-2.4_

- [x] 4. Tongo Privacy Layer Integration
  - [x] 4.1 Implement Tongo SDK integration
    - Create `useTongo` hook with real Tongo SDK
    - Implement Tongo account creation
    - Add fund (shield) functionality
    - Implement balance decryption
    - _Requirements: AC-3.1, AC-3.6, TR-4.14_

  - [x] 4.2 Update Deposit tab with real Tongo integration
    - Fetch real wBTC balance from wallet
    - Implement approve + fund two-step process
    - Display real transaction hashes with Voyager links
    - Show transaction status (pending, confirmed, failed)
    - _Requirements: AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.7_

  - [ ]* 4.3 Write property test for Tongo encryption
    - **Property 1: Encryption round trip**
    - *For any* valid balance amount, encrypting then decrypting should produce the original value
    - **Validates: Requirements AC-3.6**

  - [ ]* 4.4 Write unit tests for Tongo integration
    - Test account creation
    - Test fund operation with valid amounts
    - Test balance decryption
    - Test error handling for invalid operations
    - _Requirements: AC-3.1, AC-3.4, AC-3.6_

- [ ] 5. Vesu Lending Protocol Integration
  - [ ] 5.1 Implement Vesu SDK integration
    - Create `useVesu` hook with real Vesu SDK
    - Implement supply (deposit collateral) function
    - Implement borrow function
    - Add position query functionality
    - Implement borrowing capacity calculation
    - _Requirements: AC-4.1, AC-4.2, AC-4.6, AC-4.7, TR-4.12, TR-4.16, TR-4.17_

  - [ ] 5.2 Update Borrow tab with real Vesu integration
    - Fetch real borrowing capacity from Vesu pool
    - Display actual LTV ratios from Vesu
    - Validate borrow amounts against pool limits
    - Execute supply and borrow via Vesu SDK
    - Show real transaction hashes and status
    - _Requirements: AC-4.3, AC-4.4, AC-4.5, AC-4.8, AC-4.9_

  - [ ] 5.3 Integrate Vesu with Tongo for private borrows
    - Wrap Vesu borrow operations with Tongo shielding
    - Transfer borrowed USDC as shielded balance
    - Maintain privacy for debt amounts
    - _Requirements: AC-4.8, TR-4.18_

  - [ ]* 5.4 Write property test for Vesu supply operations
    - **Property 2: Supply increases collateral**
    - *For any* valid wBTC amount, supplying to Vesu should increase user's collateral balance by that amount
    - **Validates: Requirements AC-4.6**

  - [ ]* 5.5 Write property test for Vesu borrow operations
    - **Property 3: Borrow within capacity**
    - *For any* borrow amount within capacity, borrowing should succeed and increase debt by that amount
    - **Validates: Requirements AC-4.7, AC-4.5**

  - [ ]* 5.6 Write unit tests for Vesu integration
    - Test supply operation with valid amounts
    - Test borrow operation within limits
    - Test borrowing capacity calculation
    - Test error handling for exceeding limits
    - _Requirements: AC-4.3, AC-4.4, AC-4.5, AC-4.6, AC-4.7_

- [ ] 6. Autoswap DEX Aggregator Integration
  - [ ] 6.1 Implement Autoswap SDK integration
    - Create `useAutoswap` hook with real Autoswap SDK
    - Implement swap quote fetching
    - Implement swap execution (USDC → wBTC)
    - Add slippage tolerance configuration
    - _Requirements: AC-5.2, AC-5.4, TR-4.5_

  - [ ]* 6.2 Write property test for swap operations
    - **Property 4: Swap output within slippage**
    - *For any* valid swap amount, the output should be within the specified slippage tolerance of the quote
    - **Validates: Requirements AC-5.2**

  - [ ]* 6.3 Write unit tests for Autoswap integration
    - Test quote fetching for valid pairs
    - Test swap execution with valid parameters
    - Test slippage tolerance handling
    - Test error handling for failed swaps
    - _Requirements: AC-5.2, AC-5.4_

- [ ] 7. Leverage Loop Implementation
  - [ ] 7.1 Implement leverage loop orchestration
    - Create leverage loop function in useVesu hook
    - Implement: borrow USDC → swap to wBTC → re-supply to Vesu
    - Calculate projected LTV and liquidation price
    - Display multi-step progress with transaction hashes
    - _Requirements: AC-5.1, AC-5.2, AC-5.5, AC-5.7_

  - [ ] 7.2 Update Borrow tab with leverage controls
    - Add leverage slider (1x-3x) with real calculations
    - Implement "Enable Auto-Loop Leverage" checkbox
    - Show projected LTV and liquidation price from Vesu
    - Execute leverage loop with privacy via Tongo
    - _Requirements: AC-5.1, AC-5.5, AC-5.6, AC-5.8_

  - [ ]* 7.3 Write property test for leverage loop
    - **Property 5: Leverage increases collateral**
    - *For any* leverage multiplier between 1x and 3x, executing the loop should increase total collateral proportionally
    - **Validates: Requirements AC-5.2, AC-5.8**

  - [ ]* 7.4 Write unit tests for leverage loop
    - Test leverage calculation for different multipliers
    - Test multi-step execution (borrow → swap → supply)
    - Test error handling for failed steps
    - Test transaction state management
    - _Requirements: AC-5.1, AC-5.2, AC-5.5, AC-5.7_

- [ ] 8. Position Management & Decryption
  - [ ] 8.1 Implement real position fetching from Vesu
    - Query Vesu pool for user's supplied collateral
    - Query Vesu pool for user's borrowed amounts
    - Fetch LTV ratio and health factor from Vesu
    - Calculate liquidation threshold
    - _Requirements: AC-6.1, AC-6.2, AC-6.6, AC-6.7_

  - [ ] 8.2 Integrate Tongo decryption in Positions tab
    - Display encrypted amounts by default (****)
    - Implement "Reveal Position" button with Tongo decryption
    - Show decrypted collateral and debt balances
    - Display real-time health factor with color coding
    - Update position data after transactions
    - _Requirements: AC-6.3, AC-6.4, AC-6.5, AC-6.8_

  - [ ] 8.3 Add network-aware position display
    - Filter positions by selected network
    - Display correct explorer links per network
    - Handle network switching gracefully
    - _Requirements: AC-6.9, TR-4.27_

  - [ ]* 8.4 Write property test for position calculations
    - **Property 6: LTV calculation accuracy**
    - *For any* position with collateral and debt, the calculated LTV should match (debt / collateral) * 100
    - **Validates: Requirements AC-6.6**

  - [ ]* 8.5 Write unit tests for position management
    - Test position fetching from Vesu
    - Test Tongo decryption of balances
    - Test health factor calculation
    - Test position updates after transactions
    - _Requirements: AC-6.1, AC-6.2, AC-6.4, AC-6.5, AC-6.6, AC-6.7_

- [ ] 9. NGN Off-ramp Information Display
  - [ ] 9.1 Implement off-ramp information in Exit tab
    - Fetch real USDC balance available for withdrawal
    - Integrate live USDC/NGN exchange rate API (CoinGecko)
    - Calculate estimated NGN amount based on current rates
    - Display links to P2P platforms (Binance P2P, Paxful, etc.)
    - Add clear disclaimer about external off-ramp
    - _Requirements: AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5_

  - [ ]* 9.2 Write unit tests for off-ramp calculations
    - Test exchange rate fetching
    - Test NGN amount calculation
    - Test error handling for API failures
    - _Requirements: AC-7.2, AC-7.3_

- [ ] 10. Transaction Management & Error Handling
  - [ ] 10.1 Enhance transaction state management
    - Implement transaction history tracking
    - Add transaction status polling with timeouts
    - Display transaction progress indicators
    - Show network-aware Voyager explorer links
    - _Requirements: TR-4.23, TR-4.24, NFR-5.2_

  - [ ] 10.2 Implement comprehensive error handling
    - Add user-friendly error messages for common failures
    - Implement transaction retry logic
    - Add transaction confirmation dialogs
    - Display gas fee estimates before transactions
    - _Requirements: TR-4.25, TR-4.31, TR-4.32, NFR-5.7, NFR-5.8_

  - [ ]* 10.3 Write unit tests for error handling
    - Test error message formatting
    - Test retry logic for failed transactions
    - Test timeout handling
    - _Requirements: TR-4.25, TR-4.31_

- [ ] 11. Network Switching & Configuration
  - [ ] 11.1 Implement network switching functionality
    - Create network selector dropdown in navbar
    - Update all contract addresses on network change
    - Update RPC provider on network change
    - Refresh balances and positions after switch
    - Verify network matches user selection before transactions
    - _Requirements: TR-4.1, TR-4.9, TR-4.27, TR-4.34_

  - [ ]* 11.2 Write unit tests for network switching
    - Test network configuration updates
    - Test contract address updates per network
    - Test RPC provider updates
    - Test transaction blocking on wrong network
    - _Requirements: TR-4.1, TR-4.27, TR-4.34_

- [ ] 12. Performance Optimization & Caching
  - [ ] 12.1 Implement data caching and refresh
    - Cache decrypted balances with invalidation on transactions
    - Cache Vesu pool parameters
    - Implement position refresh interval
    - Add loading states and skeleton loaders
    - _Requirements: NFR-5.1, NFR-5.3, NFR-5.4_

  - [ ]* 12.2 Write unit tests for caching logic
    - Test cache invalidation on transactions
    - Test cache expiration
    - Test refresh intervals
    - _Requirements: NFR-5.4_

- [ ] 13. Security Enhancements
  - [ ] 13.1 Implement security best practices
    - Add input validation for all user inputs
    - Implement rate limiting for API calls
    - Add transaction amount validation
    - Verify contract addresses before transactions
    - _Requirements: TR-4.29, TR-4.33, TR-4.35_

  - [ ]* 13.2 Write security tests
    - Test input validation for edge cases
    - Test contract address validation
    - Test amount validation (min/max)
    - _Requirements: TR-4.29_

- [ ] 14. Integration Testing & E2E Flows
  - [ ]* 14.1 Write integration tests for complete flows
    - Test full deposit flow on Sepolia
    - Test full borrow flow on Sepolia
    - Test leverage loop on Sepolia
    - Test position decryption flow
    - _Requirements: All AC requirements_

  - [ ]* 14.2 Write E2E tests for user journeys
    - Test complete user journey: connect → bridge → deposit → borrow → view position
    - Test network switching during operations
    - Test error recovery scenarios
    - _Requirements: All AC requirements, Success Metrics_

- [ ] 15. Documentation & Deployment Preparation
  - [ ] 15.1 Update environment configuration documentation
    - Document all required environment variables for both networks
    - Create .env.example with all variables
    - Add setup instructions for Sepolia and Mainnet
    - Document contract addresses and RPC endpoints
    - _Requirements: TR-4.10, TR-4.26_

  - [ ] 15.2 Prepare deployment configuration
    - Configure Vercel environment variables for both networks
    - Set up production RPC endpoints
    - Verify all contract addresses are correct
    - Test deployment on Vercel
    - _Requirements: Success Metrics_

- [ ] 16. Final Checkpoint - Production Readiness
  - Verify all tests pass on both Sepolia and Mainnet
  - Test complete user flow end-to-end on both networks
  - Verify all transaction hashes link to correct explorer
  - Confirm privacy features work correctly (Tongo encryption/decryption)
  - Validate gas fee estimates are accurate
  - Test error handling and recovery
  - Ensure network switching works seamlessly
  - Ask user if any issues or questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation uses real SDKs: @atomiqlabs/sdk, @fatsolutions/tongo-sdk, Vesu SDK, Autoswap SDK
- All features must work on both Starknet Sepolia testnet AND Mainnet
- No custom vault contract needed - use Vesu SDK directly from frontend
- Privacy layer added via Tongo SDK wrapping Vesu operations
- Network selector allows switching between Sepolia and Mainnet with different contract addresses
