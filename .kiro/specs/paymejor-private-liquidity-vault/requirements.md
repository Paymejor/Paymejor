# PayMejor - Private NGN Liquidity Vault Requirements

## 1. Overview

PayMejor is a private liquidity vault that enables Lagos BTC holders to unlock NGN liquidity without exposing their Bitcoin holdings on-chain. The system uses trustless BTC bridging (Atomiq), privacy-preserving transactions (Tongo), and decentralized lending (Vesu) on Starknet.

## 2. User Stories

### 2.1 Primary User Persona
**Lagos BTC Holder**: A Nigerian Bitcoin holder who needs local currency (NGN) liquidity but wants to maintain privacy about their BTC stack size and borrowing activity.

### 2.2 Core User Stories

**US-1: Connect Wallet**
As a BTC holder, I want to connect my Xverse wallet so that I can access both my Bitcoin and Starknet assets in one interface.

**US-2: Bridge BTC to Starknet**
As a BTC holder, I want to bridge my BTC to wBTC on Starknet using Atomiq so that I can use it as collateral without custodial risk.

**US-3: Shield Collateral Privately**
As a privacy-conscious user, I want to deposit my wBTC collateral privately using Tongo so that my holdings remain hidden on-chain.

**US-4: Borrow USDC Privately**
As a borrower, I want to borrow USDC against my shielded wBTC collateral via Vesu so that I can access liquidity while maintaining privacy.

**US-5: Leverage Position**
As an advanced user, I want to loop my borrowed USDC back into more collateral so that I can increase my borrowing capacity.

**US-6: View Private Position**
As a user, I want to decrypt and view my private collateral and debt positions so that I can manage my vault.

**US-7: Simulate NGN Off-ramp**
As a Nigerian user, I want to see how I would convert my borrowed USDC to NGN so that I understand the complete flow to local currency.

## 3. Acceptance Criteria

### 3.1 Wallet Integration (US-1)

**AC-1.1**: System displays Xverse wallet connect button on landing page
**AC-1.2**: User can connect Xverse wallet and system retrieves Starknet address
**AC-1.3**: System displays connected wallet address and network (Sepolia testnet)
**AC-1.4**: User can disconnect wallet and connection state persists across page refreshes

### 3.2 BTC Bridge Integration (US-2)

**AC-2.1**: System integrates Atomiq SDK (@atomiqlabs/sdk) for BTC → wBTC bridging
**AC-2.2**: User can initiate bridge transaction with BTC amount input
**AC-2.3**: System displays bridge transaction status (pending, confirmed, completed)
**AC-2.4**: System verifies wBTC arrival on Starknet Sepolia testnet
**AC-2.5**: Bridge uses trustless escrow mechanism (no custodial intermediaries)

### 3.3 Privacy Layer Integration (US-3)

**AC-3.1**: System integrates Tongo SDK (@fatsolutions/tongo-sdk) for private transactions
**AC-3.2**: User can approve wBTC for Tongo contract
**AC-3.3**: User can deposit wBTC into shielded balance (Tongo fund operation)
**AC-3.4**: System hides actual collateral amount on-chain using ElGamal encryption
**AC-3.5**: Only user with private key can decrypt shielded balance

### 3.4 Lending Integration (US-4)

**AC-4.1**: System integrates with Vesu protocol for borrowing operations
**AC-4.2**: Cairo vault contract interacts with Vesu lending pools
**AC-4.3**: User can borrow USDC against shielded wBTC collateral
**AC-4.4**: System enforces LTV (Loan-to-Value) ratios from Vesu
**AC-4.5**: Borrowed amount is transferred as shielded USDC via Tongo
**AC-4.6**: System displays available borrowing capacity based on collateral

### 3.5 Leverage Loop (US-5)

**AC-5.1**: User can re-deposit borrowed USDC as additional shielded collateral
**AC-5.2**: System supports at least one leverage iteration for MVP
**AC-5.3**: System recalculates borrowing capacity after loop
**AC-5.4**: All loop transactions maintain privacy via Tongo

### 3.6 Position Management (US-6)

**AC-6.1**: User can decrypt and view shielded collateral balance
**AC-6.2**: User can decrypt and view shielded debt balance
**AC-6.3**: System displays current LTV ratio
**AC-6.4**: System displays liquidation threshold
**AC-6.5**: UI updates in real-time after transactions

### 3.7 NGN Off-ramp Simulation (US-7)

**AC-7.1**: UI displays simulated NGN conversion rate for borrowed USDC
**AC-7.2**: System shows instructions for P2P off-ramp (Binance, local exchanges)
**AC-7.3**: UI includes disclaimer that off-ramp is external to protocol
**AC-7.4**: System calculates estimated NGN amount based on current rates

## 4. Technical Requirements

### 4.1 Blockchain & Network

**TR-4.1**: Deploy all contracts to Starknet Sepolia testnet
**TR-4.2**: Use real testnet wBTC (no mocks or simulations)
**TR-4.3**: Integrate with live Vesu testnet deployment
**TR-4.4**: Support Starknet.js for contract interactions

### 4.2 Smart Contracts

**TR-4.5**: Implement Cairo vault contract with:
- Deposit function (integrates Tongo shielding)
- Borrow function (integrates Vesu lending)
- Leverage loop function
- Position query functions
**TR-4.6**: Contract must handle Tongo encrypted balances
**TR-4.7**: Contract must interact with Vesu lending pools via proper interfaces

### 4.3 Frontend

**TR-4.8**: Build with Next.js 14+ and React
**TR-4.9**: Implement responsive UI for mobile and desktop
**TR-4.10**: Use TypeScript for type safety
**TR-4.11**: Display transaction states and loading indicators
**TR-4.12**: Handle errors gracefully with user-friendly messages

### 4.4 Security

**TR-4.13**: Never expose private keys in frontend code
**TR-4.14**: Validate all user inputs before transactions
**TR-4.15**: Use secure RPC endpoints for Starknet
**TR-4.16**: Implement proper error handling for failed transactions

## 5. Non-Functional Requirements

### 5.1 Performance

**NFR-5.1**: Wallet connection completes within 5 seconds
**NFR-5.2**: Transaction status updates within 10 seconds of confirmation
**NFR-5.3**: UI remains responsive during blockchain operations

### 5.2 Usability

**NFR-5.4**: Clear step-by-step flow for first-time users
**NFR-5.5**: Privacy benefits highlighted in UI
**NFR-5.6**: Transaction costs (gas fees) displayed before confirmation

### 5.3 Compatibility

**NFR-5.7**: Works with Xverse wallet browser extension
**NFR-5.8**: Compatible with Chrome, Firefox, Brave browsers
**NFR-5.9**: Mobile-responsive design

## 6. Out of Scope (MVP)

- Mainnet deployment
- Liquidation bot implementation
- Multiple collateral types (only wBTC)
- Actual NGN on/off-ramp integration
- Governance features
- Advanced position management (partial withdrawals, repayments)
- Multi-language support
- Historical transaction views

## 7. Success Metrics

- User can complete full flow: Connect → Bridge → Shield → Borrow → View position
- All transactions confirmed on Sepolia testnet
- Privacy maintained: collateral/debt amounts hidden on-chain
- Demo video shows complete Lagos BTC holder use case
- Hackathon submission includes working testnet deployment

## 8. Dependencies

- Xverse wallet with Starknet support
- Atomiq SDK availability and Sepolia support
- Tongo SDK compatibility with Starknet.js
- Vesu testnet deployment and documentation
- Sepolia testnet wBTC availability
- Starknet Sepolia RPC access
