/**
 * Environment Variable Validation
 * 
 * Validates required environment variables on app startup.
 * Provides helpful error messages for missing or invalid configuration.
 */

import { REQUIRED_ENV_VARS, OPTIONAL_ENV_VARS, NETWORK_CONFIG, CONTRACT_ADDRESSES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates all required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate RPC URL format
  if (NETWORK_CONFIG.rpcUrl) {
    try {
      new URL(NETWORK_CONFIG.rpcUrl);
    } catch {
      errors.push(`Invalid RPC URL format: ${NETWORK_CONFIG.rpcUrl}`);
    }
  }

  // Validate network value
  const validNetworks = ['sepolia', 'mainnet'];
  if (NETWORK_CONFIG.network && !validNetworks.includes(NETWORK_CONFIG.network)) {
    errors.push(`Invalid network: ${NETWORK_CONFIG.network}. Must be one of: ${validNetworks.join(', ')}`);
  }

  // Check optional contract addresses (warnings only)
  const missingContracts: string[] = [];
  
  if (!CONTRACT_ADDRESSES.vault) missingContracts.push('NEXT_PUBLIC_VAULT_ADDRESS');
  if (!CONTRACT_ADDRESSES.tongoProtocol) missingContracts.push('NEXT_PUBLIC_TONGO_PROTOCOL_ADDRESS');
  if (!CONTRACT_ADDRESSES.vesuPool) missingContracts.push('NEXT_PUBLIC_VESU_POOL_ADDRESS');
  if (!CONTRACT_ADDRESSES.wBTC) missingContracts.push('NEXT_PUBLIC_WBTC_ADDRESS');
  if (!CONTRACT_ADDRESSES.USDC) missingContracts.push('NEXT_PUBLIC_USDC_ADDRESS');

  if (missingContracts.length > 0) {
    warnings.push(
      `Contract addresses not configured: ${missingContracts.join(', ')}. ` +
      `Some features may not work until contracts are deployed and addresses are added.`
    );
  }

  // Validate contract address format (if provided)
  const contractEntries = Object.entries(CONTRACT_ADDRESSES);
  for (const [name, address] of contractEntries) {
    if (address && !isValidStarknetAddress(address)) {
      errors.push(`Invalid Starknet address format for ${name}: ${address}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates Starknet address format
 */
function isValidStarknetAddress(address: string): boolean {
  // Starknet addresses should start with 0x and be 66 characters long (including 0x)
  // or can be shorter if leading zeros are omitted
  return /^0x[0-9a-fA-F]{1,64}$/.test(address);
}

/**
 * Logs validation results to console
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }
}

/**
 * Throws an error if validation fails (for server-side validation)
 */
export function assertValidEnvironment(): void {
  const result = validateEnvironment();
  
  if (!result.isValid) {
    const errorMessage = [
      'Environment validation failed:',
      ...result.errors,
      '',
      'Please check your .env.local file and ensure all required variables are set.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }
}

/**
 * Returns a user-friendly error message for missing configuration
 */
export function getConfigurationErrorMessage(): string {
  const result = validateEnvironment();
  
  if (result.isValid) {
    return '';
  }

  return [
    'Application configuration is incomplete.',
    '',
    'Missing or invalid environment variables:',
    ...result.errors.map(e => `  • ${e}`),
    '',
    'Please contact the administrator or check the deployment configuration.',
  ].join('\n');
}
