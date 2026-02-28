# Implementation Plan: Semaphore Organization Pooling

## Overview

This implementation adds privacy-preserving organization pooling to the existing PayMeJor platform. The approach prioritizes speed for the 2-day hackathon deadline: deploy contracts to Sepolia first, implement core UI flows, then add testing. The implementation integrates with existing Vesu hooks and wallet context without breaking current functionality.

## Tasks

- [x] 1. Setup and Dependencies
  - Install Semaphore Protocol packages (@semaphore-protocol/identity, @semaphore-protocol/group, @semaphore-protocol/proof)
  - Install Cairo development tools (Scarb, Starknet Foundry)
  - Add organization contract addresses to constants.ts for Sepolia and Mainnet
  - _Requirements: 10.1, 10.2_

- [x] 2. Smart Contract Development
  - [x] 2.1 Implement OrganizationFactory.cairo
    - Write factory contract with create_organization function
    - Add storage for organization registry
    - Emit OrganizationCreated events
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 2.2 Implement Organization.cairo core structure
    - Define storage struct with admin, group_id, collateral tracking
    - Implement constructor with Semaphore integration
    - Add member management functions (add_member)
    - _Requirements: 1.4, 2.1, 2.2, 2.3_
  
  - [x] 2.3 Implement collateral management in Organization.cairo
    - Write deposit_collateral function with wBTC transfer
    - Write withdraw_collateral function with LTV safety checks
    - Add getter functions for balances
    - Emit CollateralDeposited and CollateralWithdrawn events
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4_
  
  - [x] 2.4 Implement proposal system in Organization.cairo
    - Write create_proposal function with Semaphore proof verification
    - Add nullifier tracking to prevent duplicate proposals
    - Write vote function with proof verification and double-vote prevention
    - Implement quorum calculation logic
    - Emit ProposalCreated and VoteCast events
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 2.5 Implement Vesu integration in Organization.cairo
    - Write execute_proposal function with quorum checks
    - Add Vesu supply call for collateral deposit
    - Add Vesu borrow call for USDC borrowing
    - Transfer borrowed USDC to proposal creator
    - Update debt tracking
    - Emit ProposalExecuted event
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 2.6 Implement debt repayment in Organization.cairo
    - Write repay_debt function accepting USDC
    - Call Vesu repay on behalf of organization
    - Update debt balance
    - Emit DebtRepaid event
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 2.7 Implement metrics functions in Organization.cairo
    - Write get_ltv function calculating loan-to-value ratio
    - Write get_health_factor function
    - Add getters for total collateral, debt, member count
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3. Deploy Contracts to Sepolia
  - Compile contracts with Scarb
  - Deploy OrganizationFactory to Sepolia testnet
  - Verify contracts on Voyager explorer
  - Update frontend/.env.local with deployed addresses
  - _Requirements: 10.1_

- [x] 4. Frontend Hooks Implementation
  - [x] 4.1 Create useSemaphore.ts hook
    - Implement identity creation and local storage
    - Write generateVoteProof function
    - Write generateProposalProof function
    - Export identity commitment for member registration
    - _Requirements: 4.1, 5.1_
  
  - [x] 4.2 Create useOrganization.ts hook
    - Implement createOrganization function calling factory
    - Write depositCollateral function with wBTC approval
    - Write withdrawCollateral function
    - Write createProposal function with Semaphore proof
    - Write vote function with Semaphore proof
    - Write executeProposal function
    - Write repayDebt function
    - _Requirements: 1.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_
  
  - [x] 4.3 Create useOrganizationData.ts hook
    - Implement organization state fetching from contract
    - Write proposal list fetching
    - Add auto-refresh on block updates
    - Cache organization data similar to useVesuCache pattern
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. Frontend Components Implementation
  - [x] 5.1 Create OrganizationsTab.tsx
    - Implement tab component with list/create/detail views
    - Add view state management
    - Integrate with existing tab system in app/page.tsx
    - _Requirements: 10.2, 10.3_
  
  - [x] 5.2 Create CreateOrganization.tsx
    - Build form for organization name input
    - Add create button with loading state
    - Call useOrganization().createOrganization
    - Show success toast with organization address
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 5.3 Create OrganizationList.tsx
    - Fetch and display user's organizations
    - Show organization metrics (collateral, debt, members)
    - Add "Create Organization" button
    - Handle organization selection
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 5.4 Create OrganizationDetail.tsx
    - Implement tabbed interface (Overview, Proposals, Members)
    - Show organization header with address and name
    - Add back navigation button
    - _Requirements: 10.2_
  
  - [x] 5.5 Create OrganizationOverview.tsx
    - Display total collateral, debt, LTV, health factor
    - Add deposit collateral form
    - Add withdraw collateral form with safety warnings
    - Add repay debt form
    - Show member count
    - _Requirements: 3.1, 7.1, 8.1, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 5.6 Create ProposalList.tsx
    - Display active and past proposals
    - Show proposal details (amount, purpose, votes, status)
    - Add "Create Proposal" button
    - Add vote buttons for active proposals
    - Add execute button for approved proposals
    - _Requirements: 4.1, 5.1, 6.1_
  
  - [x] 5.7 Create CreateProposal.tsx
    - Build form for amount, purpose, duration
    - Generate Semaphore proof on submission
    - Call useOrganization().createProposal
    - Show success toast
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.8 Create MemberManagement.tsx
    - Display list of members (identity commitments)
    - Add "Add Member" form (admin only)
    - Show member collateral contributions
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Integration with Existing Platform
  - Add "Organizations" tab to main app interface
  - Update constants.ts with organization factory addresses
  - Ensure wallet context is shared across tabs
  - Test navigation between individual and organization features
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 7. Checkpoint - Core Functionality Complete
  - Ensure all contracts deployed and verified on Sepolia
  - Test full flow: create org → add member → deposit → propose → vote → execute
  - Verify Vesu integration works (actual borrow from pool)
  - Ask user if any issues or adjustments needed

- [x] 8. Mainnet Deployment
  - Deploy contracts to Starknet Mainnet
  - Update constants.ts with mainnet addresses
  - Test with small real amounts
  - Update documentation with mainnet addresses
  - _Requirements: 10.1_

- [ ]* 9. Testing Implementation
  - [ ]* 9.1 Write unit tests for Organization.cairo
    - Test organization creation
    - Test member addition by admin
    - Test unauthorized member addition (should fail)
    - Test collateral deposit and withdrawal
    - Test proposal creation and voting
    - Test double-voting prevention
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_
  
  - [ ]* 9.2 Write property test for member addition
    - **Property 1: Member Addition Preserves Group Integrity**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ]* 9.3 Write property test for collateral round trip
    - **Property 2: Collateral Deposit Round Trip**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ]* 9.4 Write property test for proposal nullifier uniqueness
    - **Property 3: Nullifier Uniqueness for Proposals**
    - **Validates: Requirements 4.5**
  
  - [ ]* 9.5 Write property test for vote nullifier uniqueness
    - **Property 4: Nullifier Uniqueness for Votes**
    - **Validates: Requirements 5.2, 5.4**
  
  - [ ]* 9.6 Write property test for vote count accuracy
    - **Property 5: Vote Count Accuracy**
    - **Validates: Requirements 5.3**
  
  - [ ]* 9.7 Write property test for quorum calculation
    - **Property 6: Quorum Calculation**
    - **Validates: Requirements 6.1**
  
  - [ ]* 9.8 Write property test for withdrawal safety
    - **Property 7: Collateral Withdrawal Safety**
    - **Validates: Requirements 7.2**
  
  - [ ]* 9.9 Write property test for debt repayment
    - **Property 8: Debt Repayment Reduces Total Debt**
    - **Validates: Requirements 8.3**
  
  - [ ]* 9.10 Write property test for LTV calculation
    - **Property 9: LTV Calculation Consistency**
    - **Validates: Requirements 9.3**
  
  - [ ]* 9.11 Write property test for Vesu integration
    - **Property 10: Vesu Integration Preserves Balances**
    - **Validates: Requirements 6.3, 6.4**
  
  - [ ]* 9.12 Write frontend unit tests
    - Test Semaphore identity creation
    - Test proof generation
    - Test UI component rendering
    - Test error handling

- [ ]* 10. Documentation and Polish
  - Write README for organization feature
  - Add inline code comments
  - Create demo video showing full flow
  - Update main README with organization feature description

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery given the 2-day deadline
- Priority is: contracts → deployment → core UI → testing
- Each task references specific requirements for traceability
- Contracts should be deployed to Sepolia first for testing, then Mainnet if time permits
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The implementation integrates with existing Vesu hooks and maintains backward compatibility
