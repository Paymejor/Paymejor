/**
 * Tongo account interface for privacy-preserving transactions
 */
export interface TongoAccount {
  address: string;
  owner: string;
}

/**
 * Tongo fund parameters for shielding deposits
 */
export interface TongoFundParams {
  token: string;
  amount: string;
}

/**
 * Tongo shielded balance (encrypted)
 */
export interface TongoShieldedBalance {
  token: string;
  encryptedAmount: string;
  ciphertext: string;
}

/**
 * Tongo decrypted balance
 */
export interface TongoDecryptedBalance {
  token: string;
  amount: string;
  decimals: number;
}

/**
 * Tongo provider configuration
 */
export interface TongoProviderConfig {
  rpcUrl: string;
  network: 'sepolia' | 'mainnet';
  protocolAddress: string;
}

/**
 * Tongo transaction parameters
 */
export interface TongoTransactionParams {
  from: string;
  to: string;
  token: string;
  amount: string;
  isShielded: boolean;
}

/**
 * Tongo encryption key
 */
export interface TongoEncryptionKey {
  publicKey: string;
  privateKey?: string;
}

/**
 * Tongo account creation parameters
 */
export interface TongoAccountCreateParams {
  provider: any;
  signer: any;
}
