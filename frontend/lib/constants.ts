/**
 * PayMejor - Network Configuration and Contract Addresses
 * 
 * This file centralizes all blockchain-related constants including:
 * - Network configuration (RPC URLs, Chain IDs)
 * - Contract addresses (Vault, Tongo, Vesu, Tokens)
 * - Token metadata (decimals, symbols)
 */

// ============================================================================
// Network Configuration
// ============================================================================

export const NETWORK_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || '',
  network: process.env.NEXT_PUBLIC_NETWORK || 'sepolia',
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || 'SN_SEPOLIA',
} as const;

export const SUPPORTED_NETWORKS = ['sepolia', 'mainnet'] as const;
export type SupportedNetwork = typeof SUPPORTED_NETWORKS[number];

// ============================================================================
// Contract Addresses (Sepolia Testnet)
// ============================================================================

export const CONTRACT_ADDRESSES = {
  // PayMejor Vault Contract
  vault: process.env.NEXT_PUBLIC_VAULT_ADDRESS || '',
  
  // Tongo Protocol (Privacy Layer)
  tongoProtocol: process.env.NEXT_PUBLIC_TONGO_PROTOCOL_ADDRESS || '',
  
  // Vesu Lending Pool
  vesuPool: process.env.NEXT_PUBLIC_VESU_POOL_ADDRESS || '',
  
  // Token Addresses
  wBTC: process.env.NEXT_PUBLIC_WBTC_ADDRESS || '',
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
} as const;

// ============================================================================
// Token Metadata
// ============================================================================

export const TOKEN_METADATA = {
  wBTC: {
    symbol: 'wBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    address: CONTRACT_ADDRESSES.wBTC,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: CONTRACT_ADDRESSES.USDC,
  },
} as const;

// ============================================================================
// Protocol Parameters
// ============================================================================

export const PROTOCOL_PARAMS = {
  // Leverage limits
  minLeverage: 1,
  maxLeverage: 3,
  
  // LTV thresholds
  maxLTV: 75, // 75%
  liquidationThreshold: 80, // 80%
  
  // Transaction polling
  txPollingInterval: 10000, // 10 seconds
  maxPollingAttempts: 60, // 10 minutes max
  
  // Position refresh
  positionRefreshInterval: 10000, // 10 seconds
} as const;

// ============================================================================
// Explorer URLs
// ============================================================================

export const EXPLORER_URLS = {
  sepolia: 'https://sepolia.voyager.online',
  mainnet: 'https://voyager.online',
} as const;

export function getExplorerUrl(network: SupportedNetwork = 'sepolia'): string {
  return EXPLORER_URLS[network];
}

export function getTxUrl(txHash: string, network: SupportedNetwork = 'sepolia'): string {
  return `${getExplorerUrl(network)}/tx/${txHash}`;
}

export function getContractUrl(address: string, network: SupportedNetwork = 'sepolia'): string {
  return `${getExplorerUrl(network)}/contract/${address}`;
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function isValidAddress(address: string): boolean {
  return address.startsWith('0x') && address.length === 66;
}

export function isNetworkConfigured(): boolean {
  return Boolean(NETWORK_CONFIG.rpcUrl);
}

export function areContractsConfigured(): boolean {
  return Boolean(
    CONTRACT_ADDRESSES.vault &&
    CONTRACT_ADDRESSES.tongoProtocol &&
    CONTRACT_ADDRESSES.vesuPool &&
    CONTRACT_ADDRESSES.wBTC &&
    CONTRACT_ADDRESSES.USDC
  );
}

// ============================================================================
// Required Environment Variables
// ============================================================================

export const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_STARKNET_RPC_URL',
  'NEXT_PUBLIC_NETWORK',
  'NEXT_PUBLIC_CHAIN_ID',
] as const;

export const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_VAULT_ADDRESS',
  'NEXT_PUBLIC_TONGO_PROTOCOL_ADDRESS',
  'NEXT_PUBLIC_VESU_POOL_ADDRESS',
  'NEXT_PUBLIC_WBTC_ADDRESS',
  'NEXT_PUBLIC_USDC_ADDRESS',
] as const;
