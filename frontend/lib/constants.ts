/**
 * PayMejor - Network Configuration and Contract Addresses
 * 
 * This file centralizes all blockchain-related constants including:
 * - Network configuration (RPC URLs, Chain IDs)
 * - Contract addresses (Vault, Tongo, Vesu, Tokens)
 * - Token metadata (decimals, symbols)
 * 
 * Supports both Starknet Sepolia testnet and Mainnet
 */

// ============================================================================
// Network Types
// ============================================================================

export const SUPPORTED_NETWORKS = ['sepolia', 'mainnet'] as const;
export type SupportedNetwork = typeof SUPPORTED_NETWORKS[number];

// ============================================================================
// Network Configuration (Dual Network Support)
// ============================================================================

export interface NetworkConfig {
  rpcUrl: string;
  chainId: string;
  explorerUrl: string;
  contracts: {
    vesuPool: string;
    tongoProtocol: string;
    wBTC: string;
    USDC: string;
  };
}

export const NETWORK_CONFIGS: Record<SupportedNetwork, NetworkConfig> = {
  sepolia: {
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '',
    chainId: 'SN_SEPOLIA',
    explorerUrl: 'https://sepolia.voyager.online',
    contracts: {
      vesuPool: process.env.NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS || '',
      tongoProtocol: process.env.NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS || '',
      wBTC: process.env.NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS || '',
      USDC: process.env.NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS || '',
    },
  },
  mainnet: {
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || '',
    chainId: 'SN_MAIN',
    explorerUrl: 'https://voyager.online',
    contracts: {
      vesuPool: process.env.NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS || '',
      tongoProtocol: process.env.NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS || '',
      wBTC: process.env.NEXT_PUBLIC_MAINNET_WBTC_ADDRESS || '',
      USDC: process.env.NEXT_PUBLIC_MAINNET_USDC_ADDRESS || '',
    },
  },
};

/**
 * Get network configuration for a specific network
 */
export function getNetworkConfig(network: SupportedNetwork): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

/**
 * Get current default network from environment
 */
export function getDefaultNetwork(): SupportedNetwork {
  const envNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'sepolia';
  return SUPPORTED_NETWORKS.includes(envNetwork as SupportedNetwork) 
    ? (envNetwork as SupportedNetwork) 
    : 'sepolia';
}

/**
 * Verify that the wallet is on the correct network before transaction
 * Requirements: TR-4.34
 */
export async function verifyNetworkMatch(
  walletChainId: string,
  expectedNetwork: SupportedNetwork
): Promise<boolean> {
  const config = getNetworkConfig(expectedNetwork);
  return walletChainId === config.chainId;
}

/**
 * Get user-friendly network mismatch error message
 * Requirements: TR-4.34
 */
export function getNetworkMismatchError(
  expectedNetwork: SupportedNetwork
): string {
  const networkName = expectedNetwork === 'sepolia' ? 'Starknet Sepolia' : 'Starknet Mainnet';
  return `Please switch your wallet to ${networkName} to continue`;
}

// ============================================================================
// Legacy Support (Deprecated - use getNetworkConfig instead)
// ============================================================================

export const NETWORK_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '',
  network: 'sepolia' as const,
  chainId: 'SN_SEPOLIA',
};

export const CONTRACT_ADDRESSES = {
  vault: '', // No custom vault - using Vesu directly
  tongoProtocol: process.env.NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS || '',
  vesuPool: process.env.NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS || '',
  wBTC: process.env.NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS || '',
  USDC: process.env.NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS || '',
} as const;

// ============================================================================
// Token Metadata
// ============================================================================

export interface TokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
}

export const TOKEN_METADATA: Record<string, TokenMetadata> = {
  wBTC: {
    symbol: 'wBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
} as const;

/**
 * Get token address for a specific network
 */
export function getTokenAddress(
  token: 'wBTC' | 'USDC',
  network: SupportedNetwork
): string {
  return NETWORK_CONFIGS[network].contracts[token];
}

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
  txPollingTimeout: 300000, // 5 minutes timeout
  
  // Position refresh
  positionRefreshInterval: 10000, // 10 seconds
} as const;

// ============================================================================
// Explorer URLs
// ============================================================================

/**
 * Get explorer URL for a specific network
 */
export function getExplorerUrl(network: SupportedNetwork): string {
  return NETWORK_CONFIGS[network].explorerUrl;
}

/**
 * Get transaction URL for a specific network
 */
export function getTxUrl(txHash: string, network: SupportedNetwork): string {
  return `${getExplorerUrl(network)}/tx/${txHash}`;
}

/**
 * Get contract URL for a specific network
 */
export function getContractUrl(address: string, network: SupportedNetwork): string {
  return `${getExplorerUrl(network)}/contract/${address}`;
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function isValidAddress(address: string): boolean {
  return address.startsWith('0x') && address.length === 66;
}

/**
 * Check if a specific network is configured
 */
export function isNetworkConfigured(network: SupportedNetwork): boolean {
  const config = NETWORK_CONFIGS[network];
  return Boolean(config.rpcUrl);
}

/**
 * Check if contracts are configured for a specific network
 */
export function areContractsConfigured(network: SupportedNetwork): boolean {
  const config = NETWORK_CONFIGS[network];
  return Boolean(
    config.contracts.vesuPool &&
    config.contracts.tongoProtocol &&
    config.contracts.wBTC &&
    config.contracts.USDC
  );
}

// ============================================================================
// Required Environment Variables
// ============================================================================

export const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SEPOLIA_RPC_URL',
  'NEXT_PUBLIC_MAINNET_RPC_URL',
] as const;

export const OPTIONAL_ENV_VARS = [
  // Sepolia
  'NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS',
  'NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS',
  'NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS',
  'NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS',
  // Mainnet
  'NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS',
  'NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS',
  'NEXT_PUBLIC_MAINNET_WBTC_ADDRESS',
  'NEXT_PUBLIC_MAINNET_USDC_ADDRESS',
  // Default network
  'NEXT_PUBLIC_DEFAULT_NETWORK',
  // MavaPay
  'NEXT_PUBLIC_MAVAPAY_API_URL',
  'NEXT_PUBLIC_MAVAPAY_SANDBOX_URL',
  'MAVAPAY_API_KEY',
  'MAVAPAY_SANDBOX_API_KEY',
  'MAVAPAY_WEBHOOK_SECRET',
  'MAVAPAY_SANDBOX_WEBHOOK_SECRET',
  'NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP',
  'NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT',
] as const;

// ============================================================================
// MavaPay Configuration
// ============================================================================

export const MAVAPAY_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_MAVAPAY_API_URL || 'https://api.mavapay.co',
  sandboxUrl: process.env.NEXT_PUBLIC_MAVAPAY_SANDBOX_URL || 'https://staging.api.mavapay.co',
  enabled: process.env.NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP === 'true',
  minNGNAmount: parseInt(process.env.NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT || '200000', 10),
} as const;

/**
 * Determine if MavaPay should use sandbox environment
 * Requirements: 3.1, 3.2
 * 
 * Uses sandbox when:
 * - NODE_ENV is development
 * - Default network is sepolia
 * - Explicitly set via NEXT_PUBLIC_MAVAPAY_USE_SANDBOX
 */
export function useMavaPaySandbox(): boolean {
  // Check explicit sandbox flag
  const explicitSandbox = process.env.NEXT_PUBLIC_MAVAPAY_USE_SANDBOX;
  if (explicitSandbox !== undefined) {
    return explicitSandbox === 'true';
  }
  
  // Use sandbox in development or on sepolia
  const isDevelopment = process.env.NODE_ENV === 'development';
  const defaultNetwork = getDefaultNetwork();
  
  return isDevelopment || defaultNetwork === 'sepolia';
}

/**
 * Get MavaPay API URL based on environment
 * Requirements: 3.1, 3.2
 */
export function getMavaPayApiUrl(): string {
  return useMavaPaySandbox() ? MAVAPAY_CONFIG.sandboxUrl : MAVAPAY_CONFIG.apiUrl;
}

/**
 * Check if MavaPay ramp feature is enabled
 * Requirements: 3.1, 3.2
 */
export function isMavaPayEnabled(): boolean {
  return MAVAPAY_CONFIG.enabled;
}
