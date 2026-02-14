import { AccountInterface, ProviderInterface } from 'starknet';

/**
 * Wallet connection state
 */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  account: AccountInterface | null;
  network: 'sepolia' | 'mainnet';
}

/**
 * Transaction state for tracking blockchain transactions
 */
export interface TransactionState {
  hash: string;
  type: 'deposit' | 'borrow' | 'loop' | 'approve' | 'bridge';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  explorerUrl: string;
}

/**
 * Token balance information
 */
export interface TokenBalances {
  wBTC: string;
  USDC: string;
  ETH: string;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
}

/**
 * Contract call parameters
 */
export interface ContractCallParams {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  transactionHash: string;
  status: 'ACCEPTED_ON_L2' | 'ACCEPTED_ON_L1' | 'REJECTED' | 'PENDING';
  blockNumber?: number;
  blockHash?: string;
}

/**
 * Starknet provider interface wrapper
 */
export interface StarknetProvider {
  provider: ProviderInterface;
  account: AccountInterface | null;
  network: 'sepolia' | 'mainnet';
}
