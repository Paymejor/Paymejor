# Semaphore Anonymous Collaboration Module Requirements

## 1. Overview

The Semaphore Anonymous Collaboration Module extends Paymejor's private liquidity engine with privacy-preserving group coordination capabilities. Using Semaphore V4 zero-knowledge proofs verified on Starknet via Garaga, this module enables Nigerian BTC holders to form organizations where members can anonymously deposit collateral, propose and approve borrows, and manage shared positions without revealing individual identities or actions.

**Core Value Proposition**: Enable friends/family groups in Abuja/Lagos to pool BTC collateral and collectively manage borrowing decisions while maintaining complete anonymity within the group and preventing Sybil attacks.

**Integration Point**: This module wraps the existing Paymejor vault system (Tongo + Vesu) with anonymous group coordination powered by Semaphore.

## 2. Glossary

- **Semaphore_Protocol**: Zero-knowledge protocol for anonymous signaling and group membership proofs
- **Organization**: A group of users who pool collateral and collectively approve borrow decisions
- **Identity_Commitment**: A cryptographic commitment to a user's Semaphore identity (public, added to Merkle tree)
- **Merkle_Tree**: Tree structure storing all member identity commitments (depth 7 for ~100 members)
- **Nullifier**: Unique hash preventing double-signaling (derived from identity + signal)
- **Signal**: Anonymous action (deposit, approve borrow, request exit) with ZK proof of membership
- **Garaga_Verifier**: Cairo contract that verifies Groth16 Semaphore proofs on Starknet
- **Admin**: Organization creator with final execution authority after threshold reached
- **Threshold**: Minimum number of anonymous approvals required (fixed at 4 for MVP)
- **Shielded_Vault**: Existing Tongo-wrapped Vesu position (shared by organization)

## 3. User Stories

### 3.1 Primary User Persona
**Abuja Friend Group**: 5-7 friends who want to pool their BTC holdings for better borrowing capacity while keeping individual contributions and voting private from each other.

### 3.2 Core User Stories

**US-1: Create Organization**
As a group organizer, I want to create an anonymous organization so that my friends and I can pool collateral privately.

**US-2: Generate Anonymous Identity**
As a potential member, I want to generate a Semaphore identity so that I can join organizations anonymously.

**US-3: Join Organization Anonymously**
As a user with an invite code, I want to join an organization anonymously so that nobody knows I'm a member.

**US-4: View Organization Stats**
As anyone, I want to see public organization stats (member count, total approvals) so that I can verify activity without seeing individual identities.

**US-5: Anonymous Deposit Signal**
As an organization member, I want to anonymously signal my deposit to the shared vault so that my contribution remains private.

**US-6: Propose Borrow**
As an organization member, I want to propose a borrow amount so that the group can vote on it.

**US-7: Anonymous Approval Vote**
As an organization member, I want to anonymously vote YES on a borrow proposal so that my vote is counted without revealing my identity.

**US-8: View Approval Progress**
As anyone, I want to see the current approval count for proposals so that I know when threshold is reached.

**US-9: Execute Approved Borrow**
As the organization admin, I want to execute a borrow after threshold is reached so that the group can access liquidity.

**US-10: Anonymous Exit Signal**
As an organization member, I want to anonymously signal my intent to leave so that I can exit without revealing my identity.

## 4. Acceptance Criteria

### 4.1 Organization Creation (US-1)

**AC-1.1**: WHEN a user clicks "Create Organization", THE System SHALL create a new Semaphore group with depth 7
**AC-1.2**: WHEN an organization is created, THE System SHALL add the creator's identity commitment as the first member
**AC-1.3**: WHEN an organization is created, THE System SHALL generate a unique invite code (groupId)
**AC-1.4**: WHEN an organization is created, THE System SHALL deploy a Cairo contract to track the group's Merkle root
**AC-1.5**: WHEN an organization is created, THE System SHALL set the creator as admin with execution privileges
**AC-1.6**: WHEN an organization is created, THE System SHALL initialize approval threshold to 4

### 4.2 Identity Generation (US-2)

**AC-2.1**: WHEN a user first accesses the collaboration module, THE System SHALL check for existing Semaphore identity
**AC-2.2**: IF no identity exists, THE System SHALL generate a new Semaphore identity using @semaphore-protocol/identity
**AC-2.3**: WHEN an identity is generated, THE System SHALL store it securely in browser local storage
**AC-2.4**: WHEN an identity is generated, THE System SHALL derive the identity commitment for on-chain use
**AC-2.5**: WHEN an identity exists, THE System SHALL display the commitment hash in the UI

### 4.3 Anonymous Join (US-3)

**AC-3.1**: WHEN a user pastes an invite code, THE System SHALL validate the groupId exists on-chain
**AC-3.2**: WHEN joining, THE System SHALL add the user's identity commitment to the group's Merkle tree
**AC-3.3**: WHEN joining, THE System SHALL submit a transaction to update the on-chain Merkle root
**AC-3.4**: WHEN joining, THE System SHALL NOT require admin approval (open join)
**AC-3.5**: WHEN joining completes, THE System SHALL increment the public member count
**AC-3.6**: WHEN joining completes, THE System SHALL enable the user to generate membership proofs

### 4.4 Organization Stats (US-4)

**AC-4.1**: THE System SHALL display current member count for any organization
**AC-4.2**: THE System SHALL display current Merkle root hash for verification
**AC-4.3**: THE System SHALL display total collateral in shared vault (encrypted via Tongo)
**AC-4.4**: THE System SHALL display active proposal count
**AC-4.5**: THE System SHALL NOT display individual member identities or commitments

### 4.5 Anonymous Deposit (US-5)

**AC-5.1**: WHEN a member wants to deposit, THE System SHALL generate a Semaphore proof of membership
**AC-5.2**: WHEN depositing, THE System SHALL include deposit amount in the signal hash
**AC-5.3**: WHEN depositing, THE System SHALL submit proof + nullifier to Cairo verifier contract
**AC-5.4**: WHEN proof is valid, THE System SHALL execute deposit to shared Tongo-shielded Vesu vault
**AC-5.5**: WHEN deposit completes, THE System SHALL record the nullifier to prevent double-deposit
**AC-5.6**: WHEN deposit completes, THE System SHALL update the shared vault balance (encrypted)

### 4.6 Borrow Proposal (US-6)

**AC-6.1**: WHEN a member creates a proposal, THE System SHALL generate a unique proposalId
**AC-6.2**: WHEN creating a proposal, THE System SHALL require: borrow amount, reason (optional)
**AC-6.3**: WHEN creating a proposal, THE System SHALL validate amount against shared vault capacity
**AC-6.4**: WHEN proposal is created, THE System SHALL store it on-chain with proposalId
**AC-6.5**: WHEN proposal is created, THE System SHALL initialize approval counter to 0

### 4.7 Anonymous Approval (US-7)

**AC-7.1**: WHEN a member approves, THE System SHALL generate a Semaphore proof with signal = hash(proposalId + "YES")
**AC-7.2**: WHEN approving, THE System SHALL submit proof + nullifier to Cairo verifier
**AC-7.3**: WHEN proof is valid, THE System SHALL increment the proposal's approval counter
**AC-7.4**: WHEN proof is valid, THE System SHALL record the nullifier to prevent double-voting
**AC-7.5**: WHEN approval is recorded, THE System SHALL emit an event with proposalId and new count
**AC-7.6**: WHEN a member has already approved, THE System SHALL reject duplicate approval attempts

### 4.8 Approval Progress (US-8)

**AC-8.1**: THE System SHALL display current approval count for each proposal
**AC-8.2**: THE System SHALL display threshold requirement (4 approvals)
**AC-8.3**: THE System SHALL display progress bar showing approvals/threshold
**AC-8.4**: WHEN threshold is reached, THE System SHALL display "Ready to Execute" status
**AC-8.5**: THE System SHALL NOT display which members approved

### 4.9 Execute Borrow (US-9)

**AC-9.1**: WHEN admin clicks "Execute", THE System SHALL verify approval count >= 4
**AC-9.2**: WHEN executing, THE System SHALL verify caller is organization admin
**AC-9.3**: WHEN executing, THE System SHALL call Vesu borrow on the shared shielded vault
**AC-9.4**: WHEN borrow completes, THE System SHALL mark proposal as executed
**AC-9.5**: WHEN borrow completes, THE System SHALL prevent re-execution of same proposal
**AC-9.6**: WHEN borrow fails, THE System SHALL display error and allow retry

### 4.10 Anonymous Exit (US-10)

**AC-10.1**: WHEN a member signals exit, THE System SHALL generate a Semaphore proof with signal = "EXIT"
**AC-10.2**: WHEN exit is signaled, THE System SHALL record the nullifier
**AC-10.3**: WHEN exit is signaled, THE System SHALL notify admin to remove member's commitment
**AC-10.4**: WHEN admin removes member, THE System SHALL update the Merkle tree
**AC-10.5**: WHEN member is removed, THE System SHALL decrement public member count

## 5. Technical Requirements

### 5.1 Semaphore Integration

**TR-5.1**: Use Semaphore V4 (latest as of 2026) for all ZK proof generation
**TR-5.2**: Use @semaphore-protocol/identity for identity management
**TR-5.3**: Use @semaphore-protocol/group for Merkle tree operations
**TR-5.4**: Use @semaphore-protocol/proof for proof generation in browser
**TR-5.5**: Configure Merkle tree depth to 7 (supports up to 128 members)
**TR-5.6**: Generate proofs client-side in browser (< 5 seconds)

### 5.2 Garaga Verifier Integration

**TR-5.7**: Deploy Garaga Cairo contract to verify Groth16 Semaphore proofs on Starknet
**TR-5.8**: Use Garaga SDK to generate Cairo verifier from Semaphore circuit
**TR-5.9**: Deploy verifier on both Sepolia and Mainnet
**TR-5.10**: Verify proofs on-chain before executing any privileged actions
**TR-5.11**: Store verification results in Cairo contract state

### 5.3 Cairo Contract Requirements

**TR-5.12**: Deploy SemaphoreOrganization Cairo contract per organization
**TR-5.13**: Store current Merkle root in contract state
**TR-5.14**: Store nullifier mapping to prevent double-signaling
**TR-5.15**: Store approval counters per proposalId
**TR-5.16**: Store admin address with execution privileges
**TR-5.17**: Store approval threshold (fixed at 4 for MVP)
**TR-5.18**: Emit events for: member added, approval recorded, proposal executed

### 5.4 Integration with Existing Vault

**TR-5.19**: Organizations create shared Tongo-shielded Vesu positions
**TR-5.20**: Anonymous deposits add to shared vault collateral
**TR-5.21**: Approved borrows execute on shared vault via Vesu SDK
**TR-5.22**: Vault ownership controlled by organization contract
**TR-5.23**: Only admin can execute final borrow after threshold

### 5.5 Frontend Requirements

**TR-5.24**: Add "Organizations" tab to existing UI
**TR-5.25**: Create useOrganization hook for group operations
**TR-5.26**: Create useSemaphore hook for identity and proof generation
**TR-5.27**: Display organization list with member counts
**TR-5.28**: Display proposal list with approval progress
**TR-5.29**: Show real-time approval count updates
**TR-5.30**: Support network switching (Sepolia/Mainnet) for organizations

### 5.6 Security Requirements

**TR-5.31**: Never expose Semaphore identity secret (trapdoor, nullifier)
**TR-5.32**: Store identity encrypted in browser local storage
**TR-5.33**: Validate all proofs on-chain before state changes
**TR-5.34**: Prevent nullifier reuse across all signal types
**TR-5.35**: Require admin signature for final execution
**TR-5.36**: Validate proposal amounts against vault capacity

## 6. Non-Functional Requirements

### 6.1 Performance

**NFR-6.1**: Proof generation completes within 5 seconds in browser
**NFR-6.2**: On-chain proof verification completes within 1 block
**NFR-6.3**: Organization stats load within 2 seconds
**NFR-6.4**: Approval count updates within 10 seconds of on-chain confirmation

### 6.2 Usability

**NFR-6.5**: Invite code is shareable via copy-paste
**NFR-6.6**: UI clearly indicates anonymous vs public actions
**NFR-6.7**: Approval progress is visually intuitive (progress bar)
**NFR-6.8**: Error messages explain proof failures clearly

### 6.3 Privacy

**NFR-6.9**: No member identities revealed on-chain
**NFR-6.10**: No correlation between deposits and approvals
**NFR-6.11**: Nullifiers are unlinkable to identity commitments
**NFR-6.12**: Transaction metadata does not leak member info

### 6.4 Scalability

**NFR-6.13**: Support up to 100 members per organization (depth 7)
**NFR-6.14**: Support up to 50 active proposals per organization
**NFR-6.15**: Proof generation scales linearly with tree depth

## 7. Out of Scope (For MVP)

- Configurable approval thresholds (fixed at 4)
- Percentage-based thresholds (e.g., 60% of members)
- Automatic execution without admin confirmation
- Member removal by vote (admin only for MVP)
- Multiple admin roles
- Proposal cancellation
- Time-locked proposals
- Weighted voting based on contribution
- Cross-organization coordination
- Mobile app support (web only)
- Advanced analytics dashboard

## 8. Success Metrics

- User can create organization and generate invite code
- 5+ users can join same organization anonymously
- Members can anonymously deposit to shared vault
- Members can anonymously approve borrow proposals
- Approval count reaches threshold (4) with distinct nullifiers
- Admin can execute borrow after threshold
- All proofs verify successfully on-chain via Garaga
- Zero identity leakage in on-chain data
- Demo video shows complete anonymous collaboration flow

## 9. Dependencies & Integration Points

### 9.1 External Libraries

- **@semaphore-protocol/identity**: Identity generation and management
- **@semaphore-protocol/group**: Merkle tree operations
- **@semaphore-protocol/proof**: ZK proof generation
- **Garaga SDK**: Cairo verifier generation for Starknet

### 9.2 Existing Paymejor Components

- **Tongo SDK**: Privacy layer for shared vault
- **Vesu SDK**: Lending operations on shared position
- **useNetwork hook**: Network selection (Sepolia/Mainnet)
- **Wallet context**: Xverse wallet integration
- **Transaction manager**: Transaction state handling

### 9.3 New Cairo Contracts

- **SemaphoreOrganization.cairo**: Group management and approval tracking
- **GaragaVerifier.cairo**: Semaphore proof verification (auto-generated)

## 10. Implementation Notes

### 10.1 Configuration Decisions (Locked In)

1. **Join Mechanism**: Open join (anyone with invite code can join)
2. **Max Group Size**: ~100 members (Merkle tree depth 7)
3. **Execution Model**: Admin final confirmation after threshold
4. **Approval Threshold**: Fixed at 4 YES votes minimum

### 10.2 Integration Strategy

1. Add "Organizations" tab to existing UI
2. Create organization management components
3. Integrate Semaphore proof generation in frontend
4. Deploy Garaga verifier contracts (Sepolia + Mainnet)
5. Deploy organization contracts per group
6. Connect anonymous signals to existing vault operations
7. Test with 5-7 simulated members on Sepolia

### 10.3 Privacy Architecture

```
Member Identity (secret)
    ↓
Identity Commitment (public, on-chain)
    ↓
Merkle Tree (public root, on-chain)
    ↓
ZK Proof (proves membership without revealing identity)
    ↓
Signal (deposit/approve/exit) + Nullifier
    ↓
On-chain Verification (Garaga)
    ↓
Action Executed (anonymous)
```

### 10.4 Hackathon Alignment

This feature directly addresses:
- **Semaphore on Starknet**: Using Semaphore V4 for anonymous coordination
- **Garaga Integration**: Verifying Groth16 proofs in Cairo
- **Privacy-Preserving DeFi**: Anonymous group lending decisions
- **Real-World Use Case**: Nigerian BTC holders pooling collateral
