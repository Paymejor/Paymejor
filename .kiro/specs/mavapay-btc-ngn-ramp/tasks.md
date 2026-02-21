# Implementation Plan: MavaPay BTC ↔ NGN On/Off-Ramp Integration

## Overview

This implementation plan breaks down the MavaPay integration into discrete, incremental tasks. Each task builds on previous work and includes validation through tests. The plan follows the architecture defined in the design document and ensures all requirements are met.

## Tasks

- [x] 1. Set up MavaPay API client and configuration
  - Create MavaPay client class with authentication
  - Add environment variables for API keys and URLs
  - Implement request/response types based on MavaPay API
  - Add retry logic with exponential backoff
  - _Requirements: 3.1, 3.2, 3.6, 3.7_

- [ ]* 1.1 Write property test for retry logic
  - **Property 13: Retry with Exponential Backoff**
  - **Validates: Requirements 3.6**

- [x] 2. Implement currency conversion utilities
  - Create CurrencyConverter class for NGN/BTC conversions
  - Add functions for kobo ↔ NGN and satoshis ↔ BTC
  - Add formatting functions for display
  - _Requirements: 6.1, 6.2_

- [ ]* 2.1 Write property tests for currency conversions
  - Test round-trip conversions (NGN → kobo → NGN)
  - Test round-trip conversions (BTC → satoshis → BTC)
  - _Requirements: 6.1_

- [x] 3. Create data models and TypeScript types
  - Define MavaPay API request/response types
  - Define RampTransaction type
  - Define BankAccount type
  - Define Quote and Payout types
  - _Requirements: 1.1-1.8, 2.1-2.7_

- [x] 4. Implement bank account encryption and storage
  - Create encryption utilities using AES-256
  - Implement bank account storage in localStorage
  - Add encryption key derivation from wallet address
  - _Requirements: 4.3, 10.3_

- [x]* 4.1 Write property test for encryption round trip
  - **Property 9: Encryption Round Trip**
  - **Validates: Requirements 4.3, 10.3**

- [x] 5. Create MavaPay API routes - Quote endpoint
  - Implement `/api/ramp/quote` POST endpoint
  - Add request validation
  - Call MavaPay quote API
  - Handle errors and return formatted response
  - _Requirements: 1.3, 1.4, 2.1, 2.2, 3.3_

- [ ]* 5.1 Write property test for quote request structure
  - **Property 7: API Request Structure**
  - **Validates: Requirements 3.3**

- [ ]* 5.2 Write unit tests for quote endpoint
  - Test successful quote request
  - Test expired quote handling
  - Test API error handling
  - _Requirements: 1.3, 1.4_

- [x] 6. Create MavaPay API routes - Bank operations
  - Implement `/api/ramp/banks` GET endpoint
  - Implement `/api/ramp/verify-bank` POST endpoint
  - Add bank account format validation
  - _Requirements: 4.1, 4.2_

- [ ]* 6.1 Write property test for bank account validation
  - **Property 8: Bank Account Format Validation**
  - **Validates: Requirements 4.1**

- [x] 7. Create MavaPay API routes - Payout endpoint
  - Implement `/api/ramp/payout` POST endpoint
  - Validate bank account details before submission
  - Generate Lightning invoice
  - Create transaction record
  - _Requirements: 1.5, 1.6, 1.7, 3.4_

- [ ]* 7.1 Write unit tests for payout endpoint
  - Test successful payout initiation
  - Test bank account validation
  - Test Lightning invoice generation
  - _Requirements: 1.5, 1.7_

- [x] 8. Create MavaPay API routes - On-ramp endpoint
  - Implement `/api/ramp/on-ramp` POST endpoint
  - Generate payment instructions
  - Create transaction record
  - _Requirements: 2.1, 2.3_

- [ ]* 8.1 Write unit tests for on-ramp endpoint
  - Test successful on-ramp initiation
  - Test payment instruction generation
  - _Requirements: 2.1, 2.3_

- [ ] 9. Implement webhook endpoint and signature verification
  - Create `/api/ramp/webhook` POST endpoint
  - Implement HMAC-SHA256 signature verification
  - Add webhook event routing logic
  - Implement transaction status updates
  - _Requirements: 2.4, 2.5, 3.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ]* 9.1 Write property test for webhook signature verification
  - **Property 6: Webhook Signature Verification**
  - **Validates: Requirements 3.5, 9.1**

- [ ]* 9.2 Write property test for webhook event routing
  - **Property 14: Webhook Event Routing**
  - **Validates: Requirements 9.2**

- [ ]* 9.3 Write unit tests for webhook processing
  - Test payment.received event handling
  - Test payment.sent event handling
  - Test payout completion event handling
  - Test webhook retry logic
  - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [ ] 10. Checkpoint - Ensure all API routes pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Create useMavaPay custom hook
  - Implement quote fetching with caching
  - Implement off-ramp initiation
  - Implement on-ramp initiation
  - Add error handling and loading states
  - _Requirements: 1.1-1.8, 2.1-2.7_

- [ ]* 11.1 Write property test for balance validation
  - **Property 1: Balance Validation**
  - **Validates: Requirements 1.1**

- [ ]* 11.2 Write unit tests for useMavaPay hook
  - Test quote fetching
  - Test off-ramp flow
  - Test on-ramp flow
  - Test error handling
  - _Requirements: 1.1-1.8_

- [ ] 12. Create useBankAccounts custom hook
  - Implement bank account CRUD operations
  - Add encryption/decryption for storage
  - Implement bank verification
  - _Requirements: 4.1-4.6_

- [ ]* 12.1 Write property test for bank account deletion
  - Test that deleted accounts are removed from storage
  - **Validates: Requirements 4.6**

- [ ]* 12.2 Write unit tests for useBankAccounts hook
  - Test adding bank account
  - Test verifying bank account
  - Test deleting bank account
  - _Requirements: 4.1-4.6_

- [ ] 13. Create transaction management utilities
  - Implement transaction storage in localStorage
  - Add transaction status update functions
  - Implement transaction history retrieval
  - _Requirements: 5.1-5.6_

- [ ]* 13.1 Write property test for transaction uniqueness
  - **Property 10: Transaction Record Uniqueness**
  - **Validates: Requirements 5.1**

- [ ]* 13.2 Write property test for status update timestamps
  - **Property 11: Status Update Timestamp**
  - **Validates: Requirements 5.2**

- [ ] 14. Build Bank Account Manager component
  - Create UI for displaying saved bank accounts
  - Add form for adding new bank account
  - Implement bank account verification flow
  - Add delete functionality
  - _Requirements: 4.1-4.6_

- [ ]* 14.1 Write unit tests for Bank Account Manager
  - Test rendering saved accounts
  - Test adding new account
  - Test account verification
  - Test deletion
  - _Requirements: 4.1-4.6_

- [ ] 15. Build Ramp Tab component - Off-ramp UI
  - Create off-ramp form with amount input
  - Add currency selector (USDT/USDC)
  - Display real-time quote with fees
  - Add bank account selector
  - Implement confirmation flow
  - _Requirements: 1.1-1.8, 6.1-6.5, 7.1-7.5_

- [ ]* 15.1 Write property test for minimum amount enforcement
  - **Property 12: Minimum Amount Enforcement**
  - **Validates: Requirements 7.1, 7.2**

- [ ]* 15.2 Write unit tests for off-ramp UI
  - Test amount validation
  - Test quote display
  - Test bank account selection
  - Test confirmation flow
  - _Requirements: 1.1-1.8_

- [ ] 16. Build Ramp Tab component - On-ramp UI
  - Create on-ramp form with NGN amount input
  - Display real-time quote with fees
  - Show payment instructions after confirmation
  - Add Lightning address input
  - _Requirements: 2.1-2.7, 6.1-6.5_

- [ ]* 16.1 Write unit tests for on-ramp UI
  - Test amount validation
  - Test quote display
  - Test payment instructions display
  - _Requirements: 2.1-2.7_

- [ ] 17. Build Ramp Transaction History component
  - Display list of all ramp transactions
  - Show transaction status with progress indicators
  - Display transaction details (amounts, fees, rates)
  - Add filtering and sorting
  - _Requirements: 5.1-5.6_

- [ ]* 17.1 Write unit tests for transaction history
  - Test rendering transactions
  - Test status display
  - Test filtering
  - _Requirements: 5.1-5.6_

- [ ] 18. Implement error handling and user feedback
  - Add error display components
  - Implement retry logic for failed transactions
  - Add support contact information for failures
  - Display maintenance messages for API unavailability
  - _Requirements: 8.1-8.5_

- [ ]* 18.1 Write property test for input sanitization
  - **Property 15: Input Sanitization**
  - **Validates: Requirements 10.4**

- [ ]* 18.2 Write unit tests for error handling
  - Test Lightning payment failure
  - Test bank payout failure
  - Test invalid bank account
  - Test API unavailability
  - _Requirements: 8.1-8.5_

- [ ] 19. Implement quote expiration and refresh
  - Add timer for quote expiration (5 minutes)
  - Auto-refresh expired quotes
  - Detect significant rate changes (>2%)
  - Require re-confirmation for rate changes
  - _Requirements: 6.3, 6.4_

- [ ]* 19.1 Write unit tests for quote expiration
  - Test auto-refresh on expiration
  - Test rate change detection
  - Test re-confirmation flow
  - _Requirements: 6.3, 6.4_

- [ ] 20. Add integration with existing Autoswap hook
  - Connect off-ramp flow to Autoswap for USDT/USDC → BTC
  - Handle swap completion and trigger MavaPay quote
  - _Requirements: 1.2, 1.3_

- [ ]* 20.1 Write property test for quote request after swap
  - **Property 2: Quote Request After Swap**
  - **Validates: Requirements 1.3**

- [ ] 21. Add integration with existing Atomiq hook
  - Connect on-ramp flow to Atomiq for BTC bridging
  - Display bridge option after BTC receipt
  - Update Starknet balance after bridge
  - _Requirements: 2.6, 2.7_

- [ ]* 21.1 Write unit tests for Atomiq integration
  - Test bridge option display
  - Test balance update after bridge
  - _Requirements: 2.6, 2.7_

- [ ] 22. Implement security features
  - Add rate limiting to API endpoints
  - Implement audit logging for transactions
  - Add log sanitization to exclude sensitive data
  - _Requirements: 10.5, 10.6, 10.7_

- [ ]* 22.1 Write property test for sensitive data exclusion
  - **Property 16: Sensitive Data Exclusion from Logs**
  - **Validates: Requirements 10.7**

- [ ] 23. Add environment configuration and feature flags
  - Set up environment variables for MavaPay
  - Add feature flag for enabling/disabling ramp
  - Configure sandbox vs production environments
  - _Requirements: 3.1, 3.2_

- [ ] 24. Checkpoint - Integration testing
  - Test complete off-ramp flow end-to-end
  - Test complete on-ramp flow end-to-end
  - Test webhook processing with mock events
  - Test error recovery flows
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Add monitoring and analytics
  - Implement transaction success rate tracking
  - Add API response time monitoring
  - Track error rates by type
  - Set up alerts for anomalies
  - _Requirements: All_

- [ ] 26. Create documentation
  - Write user guide for on/off-ramp features
  - Document API endpoints
  - Create troubleshooting guide
  - Add inline code comments
  - _Requirements: All_

- [ ] 27. Final checkpoint - Manual testing
  - Test with MavaPay sandbox environment
  - Verify all user flows work correctly
  - Test on mobile devices
  - Test accessibility features
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- The implementation follows the architecture defined in the design document
