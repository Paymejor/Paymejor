# Paymejor - Private NGN Liquidity Engine Design (Production-Ready)

## 1. System Architecture

### 1.1 Overview

This design document describes the production-ready implementation of Paymejor, integrating real blockchain functionality into the existing Next.js frontend. All components interact with live protocols on both Starknet Sepolia testnet AND Mainnet.

**Key Principle**: No mocks or simulations. Every feature uses real smart contracts, real tokens, and real protocol integrations on both networks.

**Dual Network Support**: Application supports network switching between Sepolia (testing) and Mainnet (production) with different contract addresses and RPC endpoints per network.

### 1.2 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + TypeScript)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Xverse     │  │    Tongo     │  │     Vesu     │           │
│  │     SDK      │  │     SDK      │  │     SDK      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Atomiq     │  │  Autoswap    │  │   Network    │           │
│  │     SDK      │  │     SDK      │  │   Selector   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                            │                                      │
│                     Starknet.js v6+                               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│  Starknet Sepolia Testnet │  │   Starknet Mainnet        │
│                           │  │                           │
│  ┌─────────────────────┐ │  │  ┌─────────────────────┐ │
│  │  Vesu Protocol      │ │  │  │  Vesu Protocol      │ │
│  │  (Isolated Pools)   │ │  │  │  (Isolated Pools)   │ │
│  └─────────────────────┘ │  │  └─────────────────────┘ │
│           │               │  │           │               │
│           ▼               │  │           ▼               │
│  ┌─────────────────────┐ │  │  ┌─────────────────────┐ │
│  │ Tongo Protocol      │ │  │  │ Tongo Protocol      │ │
│  │ (Privacy Layer)     │ │  │  │ (Privacy Layer)     │ │
│  └─────────────────────┘ │  │  └─────────────────────┘ │
│           │               │  │           │               │
│           ▼               │  │           ▼               │
│  ┌─────────────────────┐ │  │  ┌─────────────────────┐ │
│  │ Autoswap SDK        │ │  │  │ Autoswap SDK        │ │
│  │ (DEX Aggregator)    │ │  │  │ (DEX Aggregator)    │ │
│  └─────────────────────┘ │  │  └─────────────────────┘ │
│           │               │  │           │               │
│           ▼               │  │           ▼               │
│  ┌─────────────────────┐ │  │  ┌─────────────────────┐ │
│  │ wBTC/USDC Tokens    │ │  │  │ wBTC/USDC Tokens    │ │
│  │ (Real ERC20)        │ │  │  │ (Real ERC20)        │ │
│  └─────────────────────┘ │  │  └─────────────────────┘ │
└───────────────────────────┘  └───────────────────────────┘
                ▲
                │
       ┌────────┴────────┐
       │  Atomiq Bridge  │
       │  (BTC → wBTC)   │
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

### 2.1 User Position (From Vesu Protocol - Encrypted via Tongo)

**Note**: No custom vault contract. Positions are stored in Vesu's isolated lending pools (ERC-4626 vaults). Privacy layer is added via Tongo SDK wrapping Vesu operations.

```typescript
// Vesu Position (queried from Vesu pool)
interface VesuPosition {
  collateral: bigint;        // Supplied wBTC amount (from Vesu pool)
  debt: bigint;              // Borrowed USDC amount (from Vesu pool)
  ltv: number;               // Loan-to-value ratio (from Vesu)
  healthFactor: number;      // Health factor (from Vesu)
  liquidationThreshold: bigint; // From Vesu pool config
}

// Tongo Encrypted Position (privacy layer)
interface TongoEncryptedPosition {
  encryptedCollateral: string;  // ElGamal ciphertext
  encryptedDebt: string;        // ElGamal ciphertext
  tongoAccount: string;         // User's Tongo account address
}
```

### 2.2 Frontend State (Client-Side - Real Data)

```typescript
// Wallet State (from Xverse SDK)
interface WalletState {
  isConnected: boolean;
  address: string | null;
  account: AccountInterface | null;  // Real Starknet account
  network: 'sepolia' | 'mainnet';    // User-selected network
  btcAddress: string | null;         // BTC address from Xverse
}

// Network Configuration
interface NetworkConfig {
  network: 'sepolia' | 'mainnet';
  rpcUrl: string;
  vesuPoolAddress: string;           // Different per network
  tongoProtocolAddress: string;      // Different per network
  wbtcAddress: string;               // Different per network
  usdcAddress: string;               // Different per network
  explorerUrl: string;               // voyager.online or sepolia.voyager.online
}

// Position State (from Vesu + Tongo)
interface PositionState {
  // Raw encrypted data from Tongo
  encryptedCollateral: string;
  encryptedDebt: string;
  
  // Decrypted data (after Tongo decryption)
  collateralBalance: string | null;  // wBTC amount
  debtBalance: string | null;        // USDC amount
  
  // Calculated from Vesu SDK
  ltv: number;                       // From Vesu pool
  healthFactor: number;              // From Vesu pool
  liquidationThreshold: number;      // From Vesu pool config
  borrowingCapacity: string;         // From Vesu pool
  
  // Network context
  network: 'sepolia' | 'mainnet';
}

// Transaction State (real blockchain transactions)
interface TransactionState {
  hash: string;                      // Real Starknet tx hash
  type: 'supply' | 'borrow' | 'withdraw' | 'repay' | 'swap' | 'approve';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  explorerUrl: string;               // Network-aware Voyager link
  network: 'sepolia' | 'mainnet';
}

// Token Balances (from blockchain)
interface TokenBalances {
  wBTC: string;                      // Real balance from contract
  USDC: string;                      // Real balance from contract
  ETH: string;                       // For gas fees
  network: 'sepolia' | 'mainnet';
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

### 3.2 Deposit Flow (Shielded via Tongo + Vesu Supply)

```typescript
// Frontend orchestration - NO custom vault contract
async function depositCollateral(amount: string, network: 'sepolia' | 'mainnet') {
  const config = getNetworkConfig(network);
  
  // 1. Approve wBTC for Vesu pool
  await approveToken(config.wbtcAddress, config.vesuPoolAddress, amount);
  
  // 2. Create Tongo account if needed
  const tongoAccount = await getTongoAccount(userAddress, network);
  
  // 3. Supply to Vesu pool (via Vesu SDK)
  const supplyTx = await vesuPool.supply({
    asset: config.wbtcAddress,
    amount: amount,
    onBehalfOf: userAddress,
  });
  
  // 4. Shield the supplied amount via Tongo
  await tongoAccount.fund({
    token: config.wbtcAddress,
    amount: amount,
  });
  
  // 5. Decrypt and display new balance
  const decryptedBalance = await tongoAccount.getBalance(config.wbtcAddress);
  return decryptedBalance;
}
```

### 3.3 Borrow Flow (via Vesu SDK)

```typescript
async function borrowUSDC(amount: string, network: 'sepolia' | 'mainnet') {
  const config = getNetworkConfig(network);
  
  // 1. Check borrowing capacity from Vesu pool
  const capacity = await vesuPool.getBorrowingCapacity({
    user: userAddress,
    collateralAsset: config.wbtcAddress,
    borrowAsset: config.usdcAddress,
  });
  
  if (amount > capacity) throw new Error('Insufficient collateral');
  
  // 2. Execute borrow via Vesu SDK
  const borrowTx = await vesuPool.borrow({
    asset: config.usdcAddress,
    amount: amount,
    onBehalfOf: userAddress,
  });
  
  // 3. Shield borrowed USDC via Tongo
  const tongoAccount = await getTongoAccount(userAddress, network);
  await tongoAccount.fund({
    token: config.usdcAddress,
    amount: amount,
  });
  
  // 4. Decrypt and display new debt
  const decryptedDebt = await tongoAccount.getBalance(config.usdcAddress);
  return decryptedDebt;
}
```

### 3.4 Leverage Loop Flow (with Autoswap SDK)

```typescript
async function leverageLoop(network: 'sepolia' | 'mainnet') {
  const config = getNetworkConfig(network);
  
  // 1. Borrow USDC against current collateral (via Vesu)
  const borrowedUSDC = await borrowUSDC(maxBorrowAmount, network);
  
  // 2. Swap USDC → wBTC via Autoswap SDK (aggregates Ekubo/JediSwap)
  const autoswap = new AutoswapClient({ network });
  const swappedWBTC = await autoswap.swap({
    fromToken: config.usdcAddress,
    toToken: config.wbtcAddress,
    amount: borrowedUSDC,
    slippage: 0.5, // 0.5%
  });
  
  // 3. Re-supply swapped wBTC to Vesu pool
  await depositCollateral(swappedWBTC, network);
  
  // 4. New borrowing capacity increased
  return getUpdatedPosition(network);
}
```

## 4. Protocol Integration Design

### 4.1 Vesu SDK Integration (NO Custom Vault Contract)

**Architecture**: Direct frontend integration with Vesu isolated lending pools via SDK. No intermediary vault contract needed.

```typescript
// Vesu Pool Interface (from Vesu SDK)
interface VesuPool {
  // Supply collateral
  supply(params: {
    asset: string;
    amount: bigint;
    onBehalfOf: string;
  }): Promise<TransactionReceipt>;
  
  // Withdraw collateral
  withdraw(params: {
    asset: string;
    amount: bigint;
    to: string;
  }): Promise<TransactionReceipt>;
  
  // Borrow assets
  borrow(params: {
    asset: string;
    amount: bigint;
    onBehalfOf: string;
  }): Promise<TransactionReceipt>;
  
  // Repay debt
  repay(params: {
    asset: string;
    amount: bigint;
    onBehalfOf: string;
  }): Promise<TransactionReceipt>;
  
  // Query user position
  getUserPosition(user: string): Promise<{
    collateral: bigint;
    debt: bigint;
    ltv: number;
    healthFactor: number;
  }>;
  
  // Get borrowing capacity
  getBorrowingCapacity(params: {
    user: string;
    collateralAsset: string;
    borrowAsset: string;
  }): Promise<bigint>;
}
```

**Network Configuration**:
```typescript
const VESU_POOLS = {
  sepolia: {
    poolAddress: '0x...', // From Vesu docs
    wbtcAddress: '0x...',
    usdcAddress: '0x...',
  },
  mainnet: {
    poolAddress: '0x...', // From Vesu docs
    wbtcAddress: '0x...',
    usdcAddress: '0x...',
  },
};
```

### 4.2 Autoswap SDK Integration

**Purpose**: Aggregate DEX liquidity for USDC → wBTC swaps in leverage loop

```typescript
// Autoswap Client (from SDK)
import { AutoswapClient } from 'autoswap-sdk';

const autoswap = new AutoswapClient({
  network: 'sepolia', // or 'mainnet'
  provider: starknetProvider,
});

// Execute swap
const swapResult = await autoswap.swap({
  fromToken: USDC_ADDRESS,
  toToken: WBTC_ADDRESS,
  amount: parseUnits('1000', 6), // 1000 USDC
  slippage: 0.5, // 0.5% slippage tolerance
  recipient: userAddress,
});

// Get quote before swap
const quote = await autoswap.getQuote({
  fromToken: USDC_ADDRESS,
  toToken: WBTC_ADDRESS,
  amount: parseUnits('1000', 6),
});
```

**Network Configuration**:
```typescript
const AUTOSWAP_CONFIG = {
  sepolia: {
    // Autoswap aggregates Ekubo, JediSwap on Sepolia
  },
  mainnet: {
    // Autoswap aggregates Ekubo, JediSwap, others on Mainnet
  },
};
```

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
│   ├── useVesu.ts
│   ├── useAutoswap.ts
│   └── useNetwork.ts
├── lib/
│   ├── vesu/
│   │   └── client.ts
│   ├── autoswap/
│   │   └── client.ts
│   └── utils/
│       ├── formatting.ts
│       ├── constants.ts
│       └── network-config.ts
```

### 6.2 Key Components

**NetworkSelector.tsx**:
```typescript
export function NetworkSelector() {
  const { network, switchNetwork } = useNetwork();
  
  return (
    <select value={network} onChange={(e) => switchNetwork(e.target.value)}>
      <option value="sepolia">Starknet Sepolia</option>
      <option value="mainnet">Starknet Mainnet</option>
    </select>
  );
}
```

**WalletConnect.tsx**:
```typescript
export function WalletConnect() {
  const { connect, disconnect, address, isConnected } = useXverse();
  const { network } = useNetwork();
  
  return (
    <div>
      <NetworkSelector />
      <button onClick={isConnected ? disconnect : connect}>
        {isConnected ? `${address.slice(0,6)}...` : 'Connect Xverse'}
      </button>
      <span>{network === 'sepolia' ? 'Testnet' : 'Mainnet'}</span>
    </div>
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

### 7.4 Vesu SDK Integration

```typescript
// Use Vesu SDK or direct contract calls
import { VesuPool } from '@vesu/sdk'; // Check actual package name

const vesuPool = new VesuPool({
  poolAddress: getNetworkConfig(network).vesuPoolAddress,
  provider: starknetProvider,
  network: network, // 'sepolia' or 'mainnet'
});

// Supply collateral
await vesuPool.supply({
  asset: wBTC_ADDRESS,
  amount: depositAmount,
  onBehalfOf: userAddress,
});

// Check borrow capacity
const capacity = await vesuPool.getBorrowingCapacity({
  user: userAddress,
  collateralAsset: wBTC_ADDRESS,
  borrowAsset: USDC_ADDRESS,
});

// Borrow
await vesuPool.borrow({
  asset: USDC_ADDRESS,
  amount: borrowAmount,
  onBehalfOf: userAddress,
});

// Get user position
const position = await vesuPool.getUserPosition(userAddress);
```

### 7.5 Autoswap SDK Integration

```typescript
// Use Autoswap SDK for token swaps
import { AutoswapClient } from 'autoswap-sdk';

const autoswap = new AutoswapClient({
  network: network, // 'sepolia' or 'mainnet'
  provider: starknetProvider,
});

// Get quote
const quote = await autoswap.getQuote({
  fromToken: USDC_ADDRESS,
  toToken: WBTC_ADDRESS,
  amount: swapAmount,
});

// Execute swap
const swapTx = await autoswap.swap({
  fromToken: USDC_ADDRESS,
  toToken: WBTC_ADDRESS,
  amount: swapAmount,
  slippage: 0.5, // 0.5%
  recipient: userAddress,
});
```

## 8. Deployment Strategy

### 8.1 No Contract Deployment Needed

**Key Change**: No custom vault contract. All lending operations go directly through Vesu SDK.

**Configuration Only**:
1. Set up environment variables for both networks
2. Configure Vesu pool addresses (Sepolia + Mainnet)
3. Configure Tongo protocol addresses (Sepolia + Mainnet)
4. Configure token addresses (wBTC, USDC per network)
5. Configure RPC endpoints per network

### 8.2 Frontend Deployment

- **Hosting**: Vercel (Next.js optimized)
- **Environment Variables** (per network):
  
  **Sepolia**:
  - `NEXT_PUBLIC_SEPOLIA_RPC_URL`
  - `NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS`
  - `NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS`
  - `NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS`
  - `NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS`
  
  **Mainnet**:
  - `NEXT_PUBLIC_MAINNET_RPC_URL`
  - `NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS`
  - `NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS`
  - `NEXT_PUBLIC_MAINNET_WBTC_ADDRESS`
  - `NEXT_PUBLIC_MAINNET_USDC_ADDRESS`

### 8.3 Testing Strategy

**Unit Tests**:
- Frontend utility functions
- SDK integration wrappers
- Network configuration logic

**Integration Tests**:
- Full deposit flow on Sepolia
- Full borrow flow on Sepolia
- Leverage loop on Sepolia
- Network switching

**E2E Tests**:
- Complete user journey on Sepolia
- Complete user journey on Mainnet (with small amounts)
- Error handling scenarios
- Network switching during operations

## 9. Security Considerations

### 9.1 Smart Contract Security

- **No Custom Contracts**: Using Vesu's audited lending pools
- **Vesu Security**: Leverage Vesu's existing audits and battle-tested code
- **Tongo Security**: Use Tongo's audited privacy protocol
- **No Oracle Risk**: Use Vesu's built-in price feeds
- **No Reentrancy**: No custom contract logic to exploit

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

- Advanced position management (partial withdrawals/repayments)
- Multiple collateral types (ETH, STRK)
- Liquidation monitoring and alerts
- Actual NGN on/off-ramp integration
- Mobile app (React Native)
- Advanced analytics dashboard
- Governance token
- Garaga ZK verifier for proof of solvency
- Cross-chain bridging (other L2s)
