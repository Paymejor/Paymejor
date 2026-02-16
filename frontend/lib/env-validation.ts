/**
 * Environment Variable Validation
 * 
 * Validates required environment variables on app startup.
 * Provides helpful error messages for missing or invalid configuration.
 * Supports dual network configuration (Sepolia + Mainnet).
 */

import { 
  REQUIRED_ENV_VARS, 
  OPTIONAL_ENV_VARS, 
  NETWORK_CONFIGS,
  SupportedNetwork,
  getDefaultNetwork,
} from './constants';

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

  // Check required environment variables (RPC URLs)
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate RPC URL formats for both networks
  const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  const mainnetRpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;

  if (sepoliaRpcUrl) {
    try {
      new URL(sepoliaRpcUrl);
    } catch {
      errors.push(`Invalid Sepolia RPC URL format: ${sepoliaRpcUrl}`);
    }
  }

  if (mainnetRpcUrl) {
    try {
      new URL(mainnetRpcUrl);
    } catch {
      errors.push(`Invalid Mainnet RPC URL format: ${mainnetRpcUrl}`);
    }
  }

  // Validate default network value
  const defaultNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK;
  if (defaultNetwork && defaultNetwork !== 'sepolia' && defaultNetwork !== 'mainnet') {
    errors.push(
      `Invalid default network: ${defaultNetwork}. Must be 'sepolia' or 'mainnet'`
    );
  }

  // Check contract addresses for each network (warnings only)
  const networks: SupportedNetwork[] = ['sepolia', 'mainnet'];
  
  for (const network of networks) {
    const config = NETWORK_CONFIGS[network];
    const missingContracts: string[] = [];
    
    if (!config.contracts.vesuPool) {
      missingContracts.push(`NEXT_PUBLIC_${network.toUpperCase()}_VESU_POOL_ADDRESS`);
    }
    if (!config.contracts.tongoProtocol) {
      missingContracts.push(`NEXT_PUBLIC_${network.toUpperCase()}_TONGO_PROTOCOL_ADDRESS`);
    }
    if (!config.contracts.wBTC) {
      missingContracts.push(`NEXT_PUBLIC_${network.toUpperCase()}_WBTC_ADDRESS`);
    }
    if (!config.contracts.USDC) {
      missingContracts.push(`NEXT_PUBLIC_${network.toUpperCase()}_USDC_ADDRESS`);
    }

    if (missingContracts.length > 0) {
      warnings.push(
        `${network.charAt(0).toUpperCase() + network.slice(1)} contract addresses not configured: ${missingContracts.join(', ')}. ` +
        `Some features may not work on ${network} until addresses are added.`
      );
    }

    // Validate contract address format (if provided)
    const contractEntries = Object.entries(config.contracts);
    for (const [name, address] of contractEntries) {
      if (address && !isValidStarknetAddress(address)) {
        errors.push(
          `Invalid Starknet address format for ${network} ${name}: ${address}`
        );
      }
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
