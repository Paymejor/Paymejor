# Implementation Plan: Semaphore Anonymous Collaboration

## Overview

This implementation plan breaks down the Semaphore Anonymous Collaboration module into discrete coding tasks. The module adds privacy-preserving group coordination to Paymejor using Semaphore V4 proofs verified on Starknet via Garaga.

**Implementation Strategy**: Build incrementally from identity management → organization creation → anonymous signaling → proposal system → execution.

## Tasks

- [ ] 1. Set up Semaphore dependencies and types
  - Install @semaphore-protocol/identity, @semaphore-protocol/group, @semaphore-protocol/proof
  - Install fast-check for property-based testing
  - Create TypeScript types for Semaphore identities, proofs, and organizations
  - Create types for proposals and approval tracking
  - _Requirements: TR-5.1, TR-5.2, TR-5.3, TR-5.4_

- [ ]* 1.1 Write property test for identity generation
  - **Property 7: Identity Derivation**
  - **Validates: Requirements 2.4**
  - Test that commitment is correctly derived from trapdoor and nullifier for all identities

- [ ] 2. Implement Semaphore identity management
  - [ ] 2.1 Create identity storage module (lib/semaphore/storage.ts)
    - Implement encrypted storage in browser local storage
    - Add functions: saveIdentity, loadIdentity, deleteIdentity
    - Handle encryption/decryption of identity secrets
    - _Requirements: AC-2.3, TR-5.31, TR-5.32_

  - [ ]* 2.2 Write property test for identity persistence
    - **Property 8: Identity Persistence**
    - **Validates: Requirements 2.3**
    - Test that any generated identity can be stored and retrieved correctly

  - [ ] 2.3 Create useSemaphore hook (hooks/useSemaphore.ts)
    - Implement identity creation with @semaphore-protocol/identity
    - Add identity loading from storage on mount
    - Implement proof generation wrapper
    - Export: identity, hasIdentity, createIdentity, generateProof
    - _Requirements: AC-2.1, AC-2.2, AC-2.4, AC-2.5_

  - [ ]* 2.4 Write unit tests for useSemaphore hook
    - Test identity creation flow
    - Test identity loading from storage
    - Test error handling for missing identity

- [ ] 3. Implement Garaga verifier integration
  - [ ] 3.1 Create Garaga verifier client (lib/garaga/verifier-client.ts)
    - Add function to call Garaga verifier contract
    - Implement proof formatting for Cairo contract
    - Add network-specific verifier addresses
    - _Requirements: TR-5.7, TR-5.8, TR-5.9_

  - [ ] 3.2 Add Garaga verifier addresses to environment config
    - Add NEXT_PUBLIC_SEPOLIA_GARAGA_VERIFIER
    - Add NEXT_PUBLIC_MAINNET_GARAGA_VERIFIER
    - Update network configuration helper
    - _Requirements: TR-5.9_

- [ ] 4. Deploy Cairo contracts
  - [ ] 4.1 Generate Garaga verifier contract
    - Use Garaga SDK to generate Cairo verifier from Semaphore circuit
    - Compile verifier contract
    - _Requirements: TR-5.7, TR-5.8_

  - [ ] 4.2 Implement SemaphoreOrganization Cairo contract
    - Create contract with storage: groupId, merkleRoot, depth, memberCount, admin, threshold
    - Implement constructor with initialization logic
    - Implement addMember function (open join)
    - Implement verifyAndDeposit function with Garaga verification
    - Implement createProposal function
    - Implement submitApproval function with proof verification
    - Implement executeProposal function with admin check
    - Add nullifier tracking to prevent double-signaling
    - Emit events for all state changes
    - _Requirements: TR-5.12, TR-5.13, TR-5.14, TR-5.15, TR-5.16, TR-5.17, TR-5.18_

  - [ ]* 4.3 Write Cairo contract tests
    - Test addMember increments count
    - Test nullifier prevents double-voting
    - Test threshold enforcement
    - Test admin authorization

  - [ ] 4.4 Deploy contracts to Sepolia
    - Deploy Garaga verifier
    - Deploy organization factory contract
    - Verify contracts on Voyager
    - _Requirements: TR-5.9_

  - [ ] 4.5 Deploy contracts to Mainnet
    - Deploy Garaga verifier
    - Deploy organization factory contract
    - Verify contracts on Voyager
    - _Requirements: TR-5.9_

- [ ] 5. Checkpoint - Verify contract deployments
  - Ensure all contracts deployed successfully on both networks
  - Verify contract addresses added to environment config
  - Test basic contract interactions (read functions)

- [ ] 6. Implement organization creation
  - [ ] 6.1 Create organization management module (lib/semaphore/organization.ts)
    - Implement createOrganization function
    - Generate groupId and invite code
    - Deploy organization contract instance
    - Initialize Semaphore group with creator's commitment
    - Link to shared Tongo-Vesu vault
    - _Requirements: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6_

  - [ ]* 6.2 Write property tests for organization creation
    - **Property 1: Consistent Tree Depth**
    - **Validates: Requirements 1.1**
    - **Property 2: Creator as First Member**
    - **Validates: Requirements 1.2**
    - **Property 3: Unique Invite Codes**
    - **Validates: Requirements 1.3**
    - **Property 6: Threshold Initialization**
    - **Validates: Requirements 1.6**

  - [ ] 6.3 Create useOrganization hook (hooks/useOrganization.ts)
    - Implement createOrganization wrapper
    - Add organization list fetching
    - Add current organization state management
    - Export: organizations, currentOrg, createOrganization
    - _Requirements: TR-5.24_

  - [ ]* 6.4 Write unit tests for useOrganization hook
    - Test organization creation flow
    - Test organization list fetching
    - Test error handling

- [ ] 7. Implement anonymous join functionality
  - [ ] 7.1 Add join logic to organization module
    - Implement decodeInviteCode function
    - Implement joinOrganization function
    - Fetch current group state from contract
    - Add member to local Semaphore group
    - Submit transaction to update on-chain root
    - _Requirements: AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.6_

  - [ ]* 7.2 Write property tests for anonymous join
    - **Property 9: Invite Code Validation**
    - **Validates: Requirements 3.1**
    - **Property 10: Merkle Tree Update**
    - **Validates: Requirements 3.2**
    - **Property 11: Member Count Increment**
    - **Validates: Requirements 3.5**
    - **Property 12: Open Join**
    - **Validates: Requirements 3.4**

  - [ ] 7.2 Add joinOrganization to useOrganization hook
    - Implement join wrapper with error handling
    - Update organizations list after join
    - _Requirements: TR-5.24_

- [ ] 8. Implement organization UI components
  - [ ] 8.1 Create OrganizationList component
    - Display list of organizations user is part of
    - Show member count, admin, and invite code
    - Add "Create Organization" button
    - Add "Join Organization" button
    - _Requirements: AC-4.1, AC-4.2, AC-4.3, AC-4.4_

  - [ ] 8.2 Create CreateOrganizationDialog component
    - Form for organization creation
    - Display generated invite code
    - Copy-to-clipboard functionality
    - _Requirements: AC-1.3_

  - [ ] 8.3 Create JoinOrganizationDialog component
    - Input for invite code
    - Validation and error display
    - Join confirmation
    - _Requirements: AC-3.1_

  - [ ] 8.4 Create IdentityManager component
    - Display identity commitment hash
    - Show "Create Identity" button if none exists
    - Display identity status
    - _Requirements: AC-2.5_

  - [ ] 8.5 Create OrganizationDashboard component
    - Display current organization stats
    - Show member count, vault balance (encrypted)
    - Display admin address
    - _Requirements: AC-4.1, AC-4.2, AC-4.3, AC-4.4_

  - [ ]* 8.6 Write unit tests for organization UI components
    - Test component rendering
    - Test user interactions
    - Test error states

- [ ] 9. Implement anonymous deposit functionality
  - [ ] 9.1 Add anonymous deposit logic to organization module
    - Implement anonymousDeposit function
    - Generate Semaphore proof with deposit signal
    - Call verifyAndDeposit on organization contract
    - Integrate with existing Tongo-Vesu vault deposit
    - _Requirements: AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6_

  - [ ]* 9.2 Write property tests for anonymous deposit
    - **Property 15: Proof Generation for Deposits**
    - **Validates: Requirements 5.1**
    - **Property 16: Signal Construction**
    - **Validates: Requirements 5.2**
    - **Property 17: Nullifier Recording**
    - **Validates: Requirements 5.5**
    - **Property 18: Vault Balance Update**
    - **Validates: Requirements 5.6**

  - [ ] 9.3 Add anonymousDeposit to useOrganization hook
    - Implement deposit wrapper with proof generation
    - Handle transaction states
    - Update vault balance after deposit
    - _Requirements: TR-5.24_

- [ ] 10. Checkpoint - Test organization and deposit flows
  - Create organization on Sepolia
  - Generate and share invite code
  - Join organization with second account
  - Perform anonymous deposit
  - Verify vault balance updated

- [ ] 11. Implement proposal system
  - [ ] 11.1 Create proposal management module (lib/semaphore/proposal.ts)
    - Implement createProposal function
    - Generate unique proposalId
    - Validate borrow amount against vault capacity
    - Submit proposal to organization contract
    - _Requirements: AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5_

  - [ ]* 11.2 Write property tests for proposal creation
    - **Property 19: Unique Proposal IDs**
    - **Validates: Requirements 6.1**
    - **Property 20: Proposal Validation**
    - **Validates: Requirements 6.3**
    - **Property 21: Initial Approval Count**
    - **Validates: Requirements 6.5**

  - [ ] 11.3 Create useProposal hook (hooks/useProposal.ts)
    - Implement createProposal wrapper
    - Add proposal list fetching
    - Add approval tracking
    - Export: proposals, createProposal, anonymousApprove, executeProposal
    - _Requirements: TR-5.28_

  - [ ]* 11.4 Write unit tests for useProposal hook
    - Test proposal creation
    - Test proposal fetching
    - Test error handling

- [ ] 12. Implement anonymous approval functionality
  - [ ] 12.1 Add anonymous approval logic to proposal module
    - Implement anonymousApprove function
    - Generate Semaphore proof with approval signal
    - Call submitApproval on organization contract
    - Track user's approvals locally
    - _Requirements: AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5, AC-7.6_

  - [ ]* 12.2 Write property tests for anonymous approval
    - **Property 22: Approval Counter Increment**
    - **Validates: Requirements 7.3**
    - **Property 23: Double-Vote Prevention**
    - **Validates: Requirements 7.6**
    - **Property 24: Nullifier Uniqueness**
    - **Validates: Requirements 7.4**

  - [ ] 12.3 Add anonymousApprove to useProposal hook
    - Implement approval wrapper with proof generation
    - Update approval count after submission
    - Disable approval button after user approves
    - _Requirements: TR-5.29_

- [ ] 13. Implement proposal UI components
  - [ ] 13.1 Create ProposalList component
    - Display list of active proposals
    - Show proposal details (amount, reason, created date)
    - Show approval progress for each proposal
    - Add "Create Proposal" button
    - _Requirements: AC-8.1, AC-8.2, AC-8.3_

  - [ ] 13.2 Create CreateProposalDialog component
    - Form for borrow amount and reason
    - Validate amount against vault capacity
    - Submit proposal
    - _Requirements: AC-6.2, AC-6.3_

  - [ ] 13.3 Create ApprovalProgress component
    - Display current approval count
    - Display threshold (4 approvals)
    - Show progress bar
    - Display "Ready to Execute" when threshold reached
    - Add "Approve" button for members
    - Add "Execute" button for admin (when ready)
    - _Requirements: AC-8.1, AC-8.2, AC-8.3, AC-8.4_

  - [ ]* 13.4 Write unit tests for proposal UI components
    - Test component rendering
    - Test approval interactions
    - Test progress display

- [ ] 14. Implement proposal execution
  - [ ] 14.1 Add execution logic to proposal module
    - Implement executeProposal function
    - Verify caller is admin
    - Verify threshold reached
    - Call executeProposal on organization contract
    - Integrate with Vesu borrow on shared vault
    - _Requirements: AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6_

  - [ ]* 14.2 Write property tests for execution
    - **Property 25: Threshold Verification**
    - **Validates: Requirements 9.1**
    - **Property 26: Admin Authorization**
    - **Validates: Requirements 9.2**
    - **Property 27: Execution Idempotence**
    - **Validates: Requirements 9.5**
    - **Property 28: Proposal State Update**
    - **Validates: Requirements 9.4**

  - [ ] 14.3 Add executeProposal to useProposal hook
    - Implement execution wrapper with admin check
    - Update proposal status after execution
    - Handle execution errors
    - _Requirements: TR-5.29_

- [ ] 15. Implement anonymous exit functionality
  - [ ] 15.1 Add exit signaling to organization module
    - Implement anonymousExit function
    - Generate Semaphore proof with EXIT signal
    - Submit exit signal to contract
    - Notify admin for member removal
    - _Requirements: AC-10.1, AC-10.2, AC-10.3_

  - [ ]* 15.2 Write property tests for exit
    - **Property 29: Exit Signal Construction**
    - **Validates: Requirements 10.1**
    - **Property 30: Member Count Decrement**
    - **Validates: Requirements 10.5**

  - [ ] 15.3 Add admin member removal function
    - Implement removeMember function (admin only)
    - Update Merkle tree
    - Decrement member count
    - _Requirements: AC-10.4, AC-10.5_

- [ ] 16. Add Organizations tab to main UI
  - [ ] 16.1 Create organizations-tab.tsx component
    - Integrate OrganizationList
    - Integrate OrganizationDashboard
    - Integrate ProposalList
    - Add tab navigation
    - _Requirements: TR-5.24_

  - [ ] 16.2 Add Organizations tab to main navigation
    - Update navbar/sidebar with Organizations link
    - Add route for /organizations
    - Ensure network selector works with organizations
    - _Requirements: TR-5.30_

- [ ] 17. Implement privacy safeguards
  - [ ] 17.1 Add privacy checks to UI
    - Ensure member identities never displayed
    - Ensure approver identities never displayed
    - Add privacy indicators in UI
    - _Requirements: AC-4.5, AC-8.5_

  - [ ]* 17.2 Write property tests for privacy
    - **Property 13: Identity Privacy**
    - **Validates: Requirements 4.5**
    - **Property 14: Approver Anonymity**
    - **Validates: Requirements 8.5**

- [ ] 18. Implement error handling and recovery
  - [ ] 18.1 Add error handling to all async operations
    - Wrap proof generation with try-catch
    - Wrap contract calls with error handling
    - Display user-friendly error messages
    - _Requirements: NFR-6.8_

  - [ ] 18.2 Add error recovery flows
    - Retry failed transactions
    - Clear pending states on timeout
    - Provide support links
    - _Requirements: AC-9.6_

  - [ ]* 18.3 Write unit tests for error handling
    - Test proof generation errors
    - Test contract call errors
    - Test error message display

- [ ] 19. Optimize performance
  - [ ] 19.1 Add web workers for proof generation
    - Move proof generation to web worker
    - Prevent UI blocking during proof gen
    - _Requirements: NFR-6.1_

  - [ ] 19.2 Implement caching for organization data
    - Cache organization stats with TTL
    - Cache group state for proof generation
    - Implement optimistic UI updates
    - _Requirements: NFR-6.3_

  - [ ]* 19.3 Test proof generation performance
    - Measure proof generation time
    - Ensure < 5 seconds for depth 7
    - _Requirements: NFR-6.1_

- [ ] 20. Final checkpoint - End-to-end testing
  - Test complete flow on Sepolia: Create → Join → Deposit → Propose → Approve → Execute
  - Test with 5+ members in same organization
  - Verify all proofs verify successfully on-chain
  - Verify zero identity leakage in on-chain data
  - Test network switching between Sepolia and Mainnet
  - Ensure all 30 correctness properties pass
  - Record demo video showing anonymous collaboration

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- All proofs must verify on-chain via Garaga before state changes
- Identity secrets must never be exposed or logged
