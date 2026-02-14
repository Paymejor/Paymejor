/**
 * Atomiq client configuration
 */
export interface AtomiqClientConfig {
  network: 'testnet' | 'mainnet';
  destinationChain: 'starknet-sepolia' | 'starknet-mainnet';
}

/**
 * Atomiq bridge parameters
 */
export interface AtomiqBridgeParams {
  fromAsset: 'BTC';
  toAsset: 'wBTC';
  amount: string;
  destinationAddress: string;
}

/**
 * Atomiq bridge transaction
 */
export interface AtomiqBridgeTransaction {
  id: string;
  fromAsset: string;
  toAsset: string;
  amount: string;
  destinationAddress: string;
  status: AtomiqTransactionStatus;
  createdAt: number;
  btcTxHash?: string;
  starknetTxHash?: string;
}

/**
 * Atomiq transaction status
 */
export type AtomiqTransactionStatus = 
  | 'pending'
  | 'btc_confirmed'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Atomiq transaction status response
 */
export interface AtomiqTransactionStatusResponse {
  id: string;
  status: AtomiqTransactionStatus;
  confirmations: number;
  requiredConfirmations: number;
  estimatedCompletionTime?: number;
  error?: string;
}

/**
 * Atomiq bridge quote
 */
export interface AtomiqBridgeQuote {
  fromAmount: string;
  toAmount: string;
  fee: string;
  estimatedTime: number;
  exchangeRate: string;
}

/**
 * Atomiq supported asset
 */
export interface AtomiqAsset {
  symbol: string;
  name: string;
  decimals: number;
  chain: string;
}
