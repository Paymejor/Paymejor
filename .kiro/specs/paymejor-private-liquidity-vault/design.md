# PayMejor - Private NGN Liquidity Vault Design (Production-Ready)

## 1. System Architecture

### 1.1 Overview

This design document describes the production-ready implementation of PayMejor, integrating real blockchain functionality into the existing Next.js frontend. All components interact with live protocols on Starknet Sepolia testnet.

**Key Principle**: No mocks or simulations. Every feature uses real smart contracts, real tokens, and real protocol integrations.

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Existing Frontend (Next.js)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ get-starknet │  │    Tongo     │  │     Vesu     │      │
│  │   (Wallet)   │  │     SDK      │  │     SDK      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                │                 │               │
│           └────────────────┴─────────────────┘               │
│                            │                                 │
│                     Starknet.js v6+                          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Starknet Sepolia Testnet (Real)                 │
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  PayMejor Vault  │───▶│  Vesu Protocol   │              │
│  │   (Deployed)     │    │  (Live Testnet)  │              │
│  └──────────────────┘    └──────────────────┘              │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │ Tongo Protocol   │    │  wBTC Token      │              │
│  │ (Live Testnet)   │    │  (Real ERC20)    │              │
│  └──────────────────┘    └──────────────────┘              │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │  Ekubo DEX       │                                       │
│  │ (Live Testnet)   │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │
                    ┌────────┴────────┐
                    │  Atomiq Bridge  │
                    │  (External App) │
                    └─────────────────┘
```

### 1.3 Existing Frontend Structure

The application already has a complete UI with these tabs:
- **Dashboard Tab**: Overview, quick actions, stats
- **Deposit Tab**: Shield & deposit collateral
- **Borrow Tab**: Borrow USDC with leverage options
- **Positions Tab**: View and manage positions
- **Exit Tab**: NGN off-ramp information

**Implementation Strategy**: Integrate real blockchain functionality into these existing components without changing the UI structure.

## 2. Data Models

### 2.1 User Position (On-Chain - Encrypted via Tongo)

```cairo
struct Position {
    owner: ContractAddress,
    shielded_collateral: felt252,  // Encrypted wBTC amount (Tongo ciphertext)
    shielded_debt: felt252,         // Encrypted USDC amount (Tongo ciphertext)
    tongo_account: ContractAddress, // User's Tongo account address
    last_updated: u64,              // Timestamp of last update
}
```

### 2.2 Frontend State (Client-Side - Real Data)

```typescript
// Wallet State (from get-starknet)
interface WalletState {
  isConnected: boolean;
  address: string | null;
  account: AccountInterface | null;  // Real Starknet account
  network: 'sepolia' | 'mainnet';
}

// Position State (from blockchain)
interface PositionState {
  // Raw encrypted data from contract
  encryptedCollateral: string;
  encryptedDebt: string;
  
  // Decrypted data (after Tongo decryption)
  collateralBalance: string | null;  // wBTC amount
  debtBalance: string | null;        // USDC amount
  
  // Calculated from Vesu
  ltv: number;
  healthFactor: number;
  liquidationThreshold: number;
  borrowingCapacity: string;
}

// Transaction State (real blockchain transactions)
interface TransactionState {
  hash: string;                      // Real Starknet tx hash
  type: 'deposit' | 'borrow' | 'loop' | 'approve';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  explorerUrl: string;               // Link to Voyager
}

// Token Balances (from blockchain)
interface TokenBalances {
  wBTC: string;                      // Real balance from contract
  USDC: string;                      // Real balance from contract
  ETH: string;                       // For gas fees
}
```

## 3. Core Workflows

### 3.1 Complete User Flow

```
1. Connect Wallet (Xverse)
   ↓
2. Bridge BTC → wBTC (Atomiq SDK)
   ↓
3. Approve wBTC for Tongo
   ↓
4. Deposit wBTC (Shield via Tongo)
   ↓
5. Borrow USDC (via Vesu, shielded)
   ↓
6. [Optional] Leverage Loop
   ↓
7. View Decrypted Position
   ↓
8. [Simulated] NGN Off-ramp Info
```

### 3.2 Deposit Flow (Shielded)

```typescript
// Frontend orchestration
async function depositCollateral(amount: string) {
  // 1. Approve wBTC for Tongo contract
  await approveToken(wBTC_ADDRESS, TONGO_ADDRESS, amount);
  
  // 2. Create Tongo account if needed
  const tongoAccount = await getTongoAccount(userAddress);
  
  // 3. Fund shielded balance (Tongo SDK)
  const fundTx = await tongoAccount.fund({
    token: wBTC_ADDRESS,
    amount: amount,
  });
  
  // 4. Update vault position (Cairo contract)
  await vaultContract.deposit(tongoAccount.address, amount);
  
  // 5. Decrypt and display new balance
  const decryptedBalance = await tongoAccount.getBalance(wBTC_ADDRESS);
  return decryptedBalance;
}
```

### 3.3 Borrow Flow (via Vesu)

```typescript
async function borrowUSDC(amount: string) {
  // 1. Check borrowing capacity from Vesu
  const capacity = await vesuPool.getBorrowingCapacity(
    userPosition.collateral,
    wBTC_PRICE
  );
  
  if (amount > capacity) throw new Error('Insufficient collateral');
  
  // 2. Execute borrow via vault contract
  const borrowTx = await vaultContract.borrow({
    amount: amount,
    recipient: tongoAccount.address, // Shielded recipient
  });
  
  // 3. Vault interacts with Vesu to borrow
  // 4. Vault transfers borrowed USDC to Tongo (shielded)
  
  // 5. Decrypt and display new debt
  const decryptedDebt = await tongoAccount.getBalance(USDC_ADDRESS);
  return decryptedDebt;
}
```

### 3.4 Leverage Loop Flow

```typescript
async function leverageLoop() {
  // 1. Borrow USDC against current collateral
  const borrowedUSDC = await borrowUSDC(maxBorrowAmount);
  
  // 2. Swap USDC → wBTC (via DEX like Ekubo)
  const swappedWBTC = await swapUSDCToWBTC(borrowedUSDC);
  
  // 3. Re-deposit swapped wBTC as collateral
  await depositCollateral(swappedWBTC);
  
  // 4. New borrowing capacity increased
  return getUpdatedPosition();
}
```

## 4. Smart Contract Design

### 4.1 PayMejor Vault Contract (Cairo)

```cairo
#[starknet::contract]
mod PayMejorVault {
    use starknet::ContractAddress;
    use tongo::interface::ITongoProtocol;
    use vesu::interface::IVesuPool;
    
    #[storage]
    struct Storage {
        positions: LegacyMap<ContractAddress, Position>,
        tongo_protocol: ContractAddress,
        vesu_pool: ContractAddress,
        wbtc_token: ContractAddress,
        usdc_token: ContractAddress,
    }
    
    #[external(v0)]
    fn deposit(
        ref self: ContractState,
        tongo_account: ContractAddress,
        amount: u256
    ) {
        // 1. Transfer wBTC from user to vault
        // 2. Approve Tongo protocol
        // 3. Call Tongo.fund() to shield balance
        // 4. Update position storage
    }
    
    #[external(v0)]
    fn borrow(
        ref self: ContractState,
        amount: u256,
        recipient_tongo: ContractAddress
    ) {
        // 1. Get user position
        // 2. Check LTV via Vesu
        // 3. Borrow from Vesu pool
        // 4. Transfer borrowed USDC to Tongo (shielded)
        // 5. Update debt in position
    }
    
    #[external(v0)]
    fn leverage_loop(
        ref self: ContractState,
        borrow_amount: u256
    ) {
        // 1. Borrow USDC
        // 2. Swap USDC → wBTC (via Ekubo)
        // 3. Re-deposit wBTC
    }
    
    #[view]
    fn get_position(
        self: @ContractState,
        user: ContractAddress
    ) -> Position {
        // Returns encrypted position data
    }
}
```

### 4.2 Vesu Integration Interface

```cairo
#[starknet::interface]
trait IVesuPool<TContractState> {
    fn deposit(ref self: TContractState, asset: ContractAddress, amount: u256);
    fn borrow(ref self: TContractState, asset: ContractAddress, amount: u256);
    fn get_ltv(self: @TContractState, user: ContractAddress) -> u256;
    fn get_borrow_capacity(
        self: @TContractState,
        collateral: u256,
        price: u256
    ) -> u256;
}
```

## 5. Privacy Implementation

### 5.1 Tongo Integration

**Encryption Scheme**: ElGamal encryption on Starknet
**Key Management**: User's Starknet private key derives Tongo encryption keys

```typescript
// Initialize Tongo account
import { TongoAccount } from '@fatsolutions/tongo-sdk';

const tongoAccount = await TongoAccount.create({
  provider: starknetProvider,
  signer: xverseAccount,
});

// Fund shielded balance (deposit)
await tongoAccount.fund({
  token: wBTC_ADDRESS,
  amount: parseUnits(amount, 8), // wBTC decimals
});

// Decrypt balance (view)
const shieldedBalance = await tongoAccount.getBalance(wBTC_ADDRESS);
const decrypted = await tongoAccount.decrypt(shieldedBalance);
```

### 5.2 Privacy Guarantees

- **On-chain**: Only encrypted values visible (ElGamal ciphertexts)
- **Off-chain**: User decrypts with private key
- **Observer**: Cannot determine collateral or debt amounts
- **Limitation**: Transaction existence is public (not amounts)

## 6. Frontend Architecture

### 6.1 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context + hooks
- **Blockchain**: Starknet.js, Tongo SDK, Atomiq SDK

### 6.2 Page Structure

```
/
├── app/
│   ├── page.tsx              # Landing + wallet connect
│   ├── bridge/
│   │   └── page.tsx          # Atomiq bridge interface
│   ├── vault/
│   │   └── page.tsx          # Deposit/borrow/loop
│   ├── position/
│   │   └── page.tsx          # View decrypted position
│   └── offramp/
│       └── page.tsx          # NGN simulation
├── components/
│   ├── WalletConnect.tsx
│   ├── BridgeWidget.tsx
│   ├── DepositForm.tsx
│   ├── BorrowForm.tsx
│   ├── PositionDisplay.tsx
│   └── OffRampSimulator.tsx
├── hooks/
│   ├── useXverse.ts
│   ├── useAtomiq.ts
│   ├── useTongo.ts
│   ├── useVault.ts
│   └── useVesu.ts
├── lib/
│   ├── contracts/
│   │   ├── vault.ts
│   │   └── vesu.ts
│   └── utils/
│       ├── formatting.ts
│       └── constants.ts
```

### 6.3 Key Components

**WalletConnect.tsx**:
```typescript
export function WalletConnect() {
  const { connect, disconnect, address, isConnected } = useXverse();
  
  return (
    <button onClick={isConnected ? disconnect : connect}>
      {isConnected ? `${address.slice(0,6)}...` : 'Connect Xverse'}
    </button>
  );
}
```

**DepositForm.tsx**:
```typescript
export function DepositForm() {
  const { deposit, isLoading } = useVault();
  const [amount, setAmount] = useState('');
  
  const handleDeposit = async () => {
    await deposit(amount);
  };
  
  return (
    <form onSubmit={handleDeposit}>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button disabled={isLoading}>Deposit & Shield</button>
    </form>
  );
}
```

## 7. Integration Specifications

### 7.1 Xverse Wallet Integration

```typescript
// Install: npm install @xverse/wallet-sdk
import { XverseWallet } from '@xverse/wallet-sdk';

const xverse = new XverseWallet({
  network: 'testnet',
  chain: 'starknet',
});

// Connect
await xverse.connect();
const account = xverse.getStarknetAccount();
```

### 7.2 Atomiq SDK Integration

```typescript
// Install: npm install @atomiqlabs/sdk
import { AtomiqClient } from '@atomiqlabs/sdk';

const atomiq = new AtomiqClient({
  network: 'testnet',
  destinationChain: 'starknet-sepolia',
});

// Initiate bridge
const bridgeTx = await atomiq.bridge({
  fromAsset: 'BTC',
  toAsset: 'wBTC',
  amount: '0.01',
  destinationAddress: starknetAddress,
});

// Monitor status
const status = await atomiq.getTransactionStatus(bridgeTx.id);
```

### 7.3 Tongo SDK Integration

```typescript
// Install: npm install @fatsolutions/tongo-sdk
import { TongoAccount, TongoProvider } from '@fatsolutions/tongo-sdk';

const tongoProvider = new TongoProvider({
  rpcUrl: STARKNET_RPC_URL,
  network: 'sepolia',
});

const tongoAccount = await TongoAccount.create({
  provider: tongoProvider,
  signer: starknetAccount,
});

// Shield deposit
await tongoAccount.fund({
  token: wBTC_ADDRESS,
  amount: depositAmount,
});

// Decrypt balance
const balance = await tongoAccount.getBalance(wBTC_ADDRESS);
```

### 7.4 Vesu Integration

```typescript
// Use Vesu SDK or direct contract calls
import { VesuPool } from '@vesu/sdk'; // Check actual package

const vesuPool = new VesuPool({
  poolAddress: VESU_POOL_ADDRESS,
  provider: starknetProvider,
});

// Check borrow capacity
const capacity = await vesuPool.getBorrowCapacity({
  user: userAddress,
  collateralAsset: wBTC_ADDRESS,
  borrowAsset: USDC_ADDRESS,
});

// Borrow (called from vault contract)
await vaultContract.borrow(borrowAmount);
```

## 8. Deployment Strategy

### 8.1 Contract Deployment Order

1. Deploy PayMejor Vault contract to Sepolia
2. Configure Tongo protocol address
3. Configure Vesu pool address
4. Configure wBTC and USDC token addresses
5. Verify contract on Voyager

### 8.2 Frontend Deployment

- **Hosting**: Vercel (Next.js optimized)
- **Environment Variables**:
  - `NEXT_PUBLIC_STARKNET_RPC_URL`
  - `NEXT_PUBLIC_VAULT_ADDRESS`
  - `NEXT_PUBLIC_VESU_POOL_ADDRESS`
  - `NEXT_PUBLIC_TONGO_PROTOCOL_ADDRESS`
  - `NEXT_PUBLIC_WBTC_ADDRESS`
  - `NEXT_PUBLIC_USDC_ADDRESS`

### 8.3 Testing Strategy

**Unit Tests**:
- Cairo contract functions
- Frontend utility functions
- SDK integration wrappers

**Integration Tests**:
- Full deposit flow on testnet
- Full borrow flow on testnet
- Leverage loop on testnet

**E2E Tests**:
- Complete user journey from connect to position view
- Error handling scenarios

## 9. Security Considerations

### 9.1 Smart Contract Security

- **Reentrancy**: Use checks-effects-interactions pattern
- **Access Control**: Only position owner can borrow/withdraw
- **Oracle**: Use Vesu's price feeds (trusted for MVP)
- **Overflow**: Cairo's native u256 prevents overflows

### 9.2 Frontend Security

- **Private Keys**: Never log or expose
- **RPC**: Use rate-limited, authenticated endpoints
- **Input Validation**: Sanitize all user inputs
- **Error Messages**: Don't leak sensitive info

### 9.3 Privacy Considerations

- **Metadata Leakage**: Transaction timing/patterns may reveal info
- **IP Privacy**: Recommend VPN for users
- **Browser Fingerprinting**: Standard web privacy concerns

## 10. Performance Optimization

### 10.1 Transaction Batching

- Combine approve + deposit into single user action
- Use multicall for position queries

### 10.2 Caching

- Cache decrypted balances (invalidate on tx)
- Cache Vesu pool parameters
- Cache wBTC price feeds

### 10.3 Loading States

- Optimistic UI updates
- Skeleton loaders during blockchain calls
- Transaction progress indicators

## 11. Error Handling

### 11.1 Common Errors

| Error | Cause | User Message |
|-------|-------|--------------|
| `INSUFFICIENT_BALANCE` | Not enough wBTC | "Insufficient wBTC balance" |
| `INSUFFICIENT_COLLATERAL` | LTV too high | "Add more collateral to borrow" |
| `TRANSACTION_FAILED` | Blockchain error | "Transaction failed. Please try again" |
| `WALLET_NOT_CONNECTED` | No wallet | "Please connect your Xverse wallet" |
| `BRIDGE_PENDING` | Atomiq not confirmed | "Bridge transaction pending..." |

### 11.2 Error Recovery

- Retry failed transactions (with user confirmation)
- Clear pending state on timeout
- Provide support links for persistent issues

## 12. Monitoring & Analytics

### 12.1 Key Metrics

- Wallet connections
- Bridge transactions initiated/completed
- Deposits (count, volume)
- Borrows (count, volume)
- Leverage loops executed
- Average LTV ratio
- Transaction success rate

### 12.2 Logging

- Frontend: Console errors in dev, Sentry in prod
- Contracts: Emit events for all state changes
- Bridge: Track Atomiq transaction IDs

## 13. Future Enhancements (Post-MVP)

- Mainnet deployment
- Multiple collateral types (ETH, STRK)
- Liquidation bot
- Partial withdrawals/repayments
- Actual NGN on/off-ramp integration
- Mobile app (React Native)
- Advanced analytics dashboard
- Governance token
