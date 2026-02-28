# Requirements Document

## Introduction

This feature enables users to create privacy-preserving organizations (DAOs) where members can pool wBTC collateral together to borrow larger amounts of USDC from Vesu. Using Semaphore Protocol, members maintain anonymity while proving membership and voting on borrowing decisions. This extends the existing individual lending platform to support collaborative borrowing.

## Glossary

- **Organization**: A Semaphore group where members pool wBTC collateral to borrow USDC collectively
- **Org_Contract**: Starknet smart contract managing organization state, collateral, and borrowing
- **Semaphore_Group**: Privacy-preserving group using zero-knowledge proofs for anonymous membership verification
- **Identity_Commitment**: User's Semaphore identity hash used for anonymous group membership
- **Pool_Collateral**: Combined wBTC from all organization members
- **Borrow_Proposal**: Request to borrow USDC against pooled collateral, requiring member votes
- **Anonymous_Vote**: Vote cast using Semaphore proof without revealing voter identity
- **Vesu_Integration**: Connection to existing Vesu lending pools for actual borrowing
- **Member**: User who has joined an organization and contributed collateral

## Requirements

### Requirement 1: Organization Creation

**User Story:** As a user, I want to create an organization, so that I can invite others to pool collateral together for larger borrowing capacity.

#### Acceptance Criteria

1. WHEN a user creates an organization, THE Org_Contract SHALL deploy a new organization instance with a unique Semaphore group
2. WHEN creating an organization, THE System SHALL generate a Semaphore group ID and store it on-chain
3. WHEN an organization is created, THE System SHALL set the creator as the initial admin
4. WHEN an organization is created, THE System SHALL initialize empty collateral balances
5. THE Org_Contract SHALL emit an OrganizationCreated event with group ID and admin address

### Requirement 2: Member Management

**User Story:** As an organization admin, I want to add members to my organization, so that they can contribute collateral and participate in borrowing decisions.

#### Acceptance Criteria

1. WHEN an admin adds a member, THE Org_Contract SHALL verify the admin's permission
2. WHEN adding a member, THE System SHALL add their identity commitment to the Semaphore group
3. WHEN a member is added, THE Org_Contract SHALL emit a MemberAdded event
4. WHEN a member joins, THE System SHALL allow them to deposit wBTC collateral
5. THE Org_Contract SHALL maintain a mapping of identity commitments to member status

### Requirement 3: Collateral Pooling

**User Story:** As an organization member, I want to deposit wBTC into the organization pool, so that we can increase our collective borrowing capacity.

#### Acceptance Criteria

1. WHEN a member deposits wBTC, THE Org_Contract SHALL transfer tokens from member to contract
2. WHEN collateral is deposited, THE System SHALL update the member's contribution balance
3. WHEN collateral is deposited, THE System SHALL update the total pool collateral
4. WHEN a deposit occurs, THE Org_Contract SHALL emit a CollateralDeposited event
5. THE Org_Contract SHALL track individual member contributions for withdrawal rights

### Requirement 4: Anonymous Borrow Proposals

**User Story:** As an organization member, I want to propose borrowing USDC anonymously, so that I can request funds without revealing my identity.

#### Acceptance Criteria

1. WHEN a member creates a proposal, THE System SHALL verify Semaphore membership proof
2. WHEN creating a proposal, THE Org_Contract SHALL store proposal details (amount, purpose, duration)
3. WHEN a proposal is created, THE System SHALL initialize vote counts to zero
4. WHEN a proposal is created, THE Org_Contract SHALL emit a ProposalCreated event with nullifier hash
5. THE System SHALL prevent duplicate proposals using Semaphore nullifiers

### Requirement 5: Anonymous Voting

**User Story:** As an organization member, I want to vote on borrow proposals anonymously, so that I can participate in governance without revealing my identity.

#### Acceptance Criteria

1. WHEN a member votes, THE System SHALL verify Semaphore membership proof
2. WHEN voting, THE System SHALL verify the nullifier hasn't been used for this proposal
3. WHEN a vote is cast, THE Org_Contract SHALL increment the appropriate vote count (yes/no)
4. WHEN a vote is cast, THE System SHALL store the nullifier to prevent double-voting
5. THE Org_Contract SHALL emit a VoteCast event without revealing voter identity

### Requirement 6: Proposal Execution

**User Story:** As an organization, I want approved proposals to execute automatically, so that we can borrow USDC from Vesu using our pooled collateral.

#### Acceptance Criteria

1. WHEN a proposal reaches quorum, THE System SHALL mark it as executable
2. WHEN executing a proposal, THE Org_Contract SHALL supply pooled wBTC to Vesu as collateral
3. WHEN executing a proposal, THE Org_Contract SHALL borrow requested USDC amount from Vesu
4. WHEN borrowing succeeds, THE System SHALL distribute USDC to the proposal creator's address
5. THE Org_Contract SHALL update organization debt and LTV metrics

### Requirement 7: Collateral Withdrawal

**User Story:** As an organization member, I want to withdraw my contributed collateral, so that I can exit the organization when needed.

#### Acceptance Criteria

1. WHEN a member requests withdrawal, THE System SHALL verify they have contributed collateral
2. WHEN withdrawing, THE Org_Contract SHALL check that withdrawal doesn't violate LTV requirements
3. WHEN withdrawal is safe, THE System SHALL transfer wBTC back to the member
4. WHEN collateral is withdrawn, THE System SHALL update member and total pool balances
5. IF withdrawal would cause liquidation risk, THEN THE System SHALL reject the withdrawal

### Requirement 8: Debt Repayment

**User Story:** As an organization member, I want to repay borrowed USDC, so that we can reduce our collective debt and improve our health factor.

#### Acceptance Criteria

1. WHEN a member repays debt, THE Org_Contract SHALL accept USDC tokens
2. WHEN repaying, THE System SHALL repay debt to Vesu on behalf of the organization
3. WHEN debt is repaid, THE System SHALL update organization debt balance
4. WHEN debt is repaid, THE Org_Contract SHALL emit a DebtRepaid event
5. THE System SHALL allow partial or full repayment

### Requirement 9: Organization Metrics

**User Story:** As an organization member, I want to view organization metrics, so that I can monitor our collective position health.

#### Acceptance Criteria

1. THE System SHALL display total pooled collateral (wBTC)
2. THE System SHALL display total borrowed amount (USDC)
3. THE System SHALL display organization LTV percentage
4. THE System SHALL display organization health factor
5. THE System SHALL display number of active members

### Requirement 10: Integration with Existing Platform

**User Story:** As a user, I want to access both individual and organization borrowing, so that I can choose the best option for my needs.

#### Acceptance Criteria

1. THE System SHALL maintain existing individual borrowing functionality unchanged
2. THE System SHALL add an "Organizations" tab to the main interface
3. WHEN switching between tabs, THE System SHALL preserve wallet connection state
4. THE System SHALL use the same Vesu pools for both individual and organization borrowing
5. THE System SHALL display both individual and organization positions in the dashboard
