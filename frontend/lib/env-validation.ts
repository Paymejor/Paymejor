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

  // Validate MavaPay configuration (Requirements 3.1, 3.2)
  const mavaPayEnabled = process.env.NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP === 'true';
  
  if (mavaPayEnabled) {
    // Check MavaPay API URLs
    const mavaPayApiUrl = process.env.NEXT_PUBLIC_MAVAPAY_API_URL;
    const mavaPaySandboxUrl = process.env.NEXT_PUBLIC_MAVAPAY_SANDBOX_URL;
    
    if (!mavaPayApiUrl) {
      warnings.push('NEXT_PUBLIC_MAVAPAY_API_URL not configured. Using default: https://api.mavapay.co');
    }
    
    if (!mavaPaySandboxUrl) {
      warnings.push('NEXT_PUBLIC_MAVAPAY_SANDBOX_URL not configured. Using default: https://staging.api.mavapay.co');
    }
    
    // Validate URL formats
    if (mavaPayApiUrl) {
      try {
        new URL(mavaPayApiUrl);
      } catch {
        errors.push(`Invalid MavaPay API URL format: ${mavaPayApiUrl}`);
      }
    }
    
    if (mavaPaySandboxUrl) {
      try {
        new URL(mavaPaySandboxUrl);
      } catch {
        errors.push(`Invalid MavaPay Sandbox URL format: ${mavaPaySandboxUrl}`);
      }
    }
    
    // Check server-side API keys (only in Node.js environment)
    if (typeof window === 'undefined') {
      const mavaPayApiKey = process.env.MAVAPAY_API_KEY;
      const mavaPaySandboxApiKey = process.env.MAVAPAY_SANDBOX_API_KEY;
      const mavaPayWebhookSecret = process.env.MAVAPAY_WEBHOOK_SECRET;
      const mavaPaySandboxWebhookSecret = process.env.MAVAPAY_SANDBOX_WEBHOOK_SECRET;
      
      if (!mavaPayApiKey) {
        warnings.push('MAVAPAY_API_KEY not configured. Production on/off-ramp will not work.');
      }
      
      if (!mavaPaySandboxApiKey) {
        warnings.push('MAVAPAY_SANDBOX_API_KEY not configured. Sandbox testing will not work.');
      }
      
      if (!mavaPayWebhookSecret) {
        warnings.push('MAVAPAY_WEBHOOK_SECRET not configured. Production webhook verification will fail.');
      }
      
      if (!mavaPaySandboxWebhookSecret) {
        warnings.push('MAVAPAY_SANDBOX_WEBHOOK_SECRET not configured. Sandbox webhook verification will fail.');
      }
    }
    
    // Validate minimum NGN amount
    const minNGNAmount = process.env.NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT;
    if (minNGNAmount) {
      const amount = parseInt(minNGNAmount, 10);
      if (isNaN(amount) || amount < 0) {
        errors.push(`Invalid NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT: ${minNGNAmount}. Must be a positive number.`);
      }
      if (amount < 200000) {
        warnings.push(`NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT is ${amount} kobo (${amount / 100} NGN). MavaPay minimum is 2000 NGN (200000 kobo).`);
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
