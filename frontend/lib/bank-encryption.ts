/**
 * Bank Account Encryption Utilities
 * 
 * Provides AES-256-GCM encryption for bank account details stored in localStorage.
 * Uses wallet address to derive encryption key via PBKDF2.
 * 
 * Requirements: 4.3, 10.3
 */

import { StoredBankAccount, BankAccount } from '@/types/mavapay';

// Constants for encryption
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000;
const TAG_LENGTH = 128; // 128 bits for GCM authentication tag

/**
 * Derives an encryption key from a wallet address using PBKDF2
 * 
 * @param walletAddress - User's wallet address used as password
 * @param salt - Salt for key derivation
 * @returns CryptoKey for AES-GCM encryption
 */
async function deriveKey(walletAddress: string, salt: Uint8Array): Promise<CryptoKey> {
  // Import the wallet address as a key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(walletAddress),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts sensitive bank account data
 * 
 * @param data - Plain text data to encrypt
 * @param walletAddress - User's wallet address for key derivation
 * @returns Base64-encoded encrypted data with salt and IV prepended
 */
async function encryptData(data: string, walletAddress: string): Promise<string> {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive encryption key
  const key = await deriveKey(walletAddress, salt);

  // Encrypt the data
  const encodedData = new TextEncoder().encode(data);
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
      tagLength: TAG_LENGTH,
    },
    key,
    encodedData
  );

  // Combine salt + IV + encrypted data
  const combined = new Uint8Array(
    SALT_LENGTH + IV_LENGTH + encryptedData.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(encryptedData), SALT_LENGTH + IV_LENGTH);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts encrypted bank account data
 * 
 * @param encryptedData - Base64-encoded encrypted data with salt and IV
 * @param walletAddress - User's wallet address for key derivation
 * @returns Decrypted plain text data
 * @throws Error if decryption fails
 */
async function decryptData(encryptedData: string, walletAddress: string): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const data = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Derive decryption key
    const key = await deriveKey(walletAddress, salt);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      data
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    throw new Error('Failed to decrypt bank account data. Invalid key or corrupted data.');
  }
}

/**
 * Encrypts a bank account object for storage
 * 
 * @param account - Bank account to encrypt
 * @param walletAddress - User's wallet address
 * @returns Encrypted bank account ready for storage
 */
export async function encryptBankAccount(
  account: Omit<BankAccount, 'id' | 'createdAt'>,
  walletAddress: string
): Promise<Omit<StoredBankAccount, 'id' | 'createdAt'>> {
  const encryptedAccountNumber = await encryptData(account.accountNumber, walletAddress);

  return {
    walletAddress,
    bankName: account.bankName,
    accountNumber: encryptedAccountNumber,
    accountName: account.accountName,
    nipBankCode: account.nipBankCode,
    isVerified: account.isVerified,
  };
}

/**
 * Decrypts a stored bank account
 * 
 * @param storedAccount - Encrypted bank account from storage
 * @param walletAddress - User's wallet address
 * @returns Decrypted bank account
 */
export async function decryptBankAccount(
  storedAccount: StoredBankAccount,
  walletAddress: string
): Promise<BankAccount> {
  // Verify wallet address matches
  if (storedAccount.walletAddress !== walletAddress) {
    throw new Error('Wallet address mismatch. Cannot decrypt bank account.');
  }

  const decryptedAccountNumber = await decryptData(
    storedAccount.accountNumber,
    walletAddress
  );

  return {
    id: storedAccount.id,
    bankName: storedAccount.bankName,
    accountNumber: decryptedAccountNumber,
    accountName: storedAccount.accountName,
    nipBankCode: storedAccount.nipBankCode,
    isVerified: storedAccount.isVerified,
    createdAt: new Date(storedAccount.createdAt),
  };
}

/**
 * Stores encrypted bank accounts in localStorage
 * 
 * @param accounts - Array of encrypted bank accounts
 * @param walletAddress - User's wallet address
 */
export function saveBankAccounts(
  accounts: StoredBankAccount[],
  walletAddress: string
): void {
  const key = `mavapay_bank_accounts_${walletAddress}`;
  localStorage.setItem(key, JSON.stringify(accounts));
}

/**
 * Retrieves encrypted bank accounts from localStorage
 * 
 * @param walletAddress - User's wallet address
 * @returns Array of encrypted bank accounts
 */
export function loadBankAccounts(walletAddress: string): StoredBankAccount[] {
  const key = `mavapay_bank_accounts_${walletAddress}`;
  const data = localStorage.getItem(key);
  
  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse bank accounts from localStorage:', error);
    return [];
  }
}

/**
 * Adds a new bank account to storage
 * 
 * @param account - Bank account to add (unencrypted)
 * @param walletAddress - User's wallet address
 * @returns The stored bank account with ID
 */
export async function addBankAccount(
  account: Omit<BankAccount, 'id' | 'createdAt'>,
  walletAddress: string
): Promise<StoredBankAccount> {
  // Load existing accounts
  const accounts = loadBankAccounts(walletAddress);

  // Encrypt the new account
  const encryptedAccount = await encryptBankAccount(account, walletAddress);

  // Create stored account with ID and timestamp
  const storedAccount: StoredBankAccount = {
    ...encryptedAccount,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  // Add to accounts array
  accounts.push(storedAccount);

  // Save back to localStorage
  saveBankAccounts(accounts, walletAddress);

  return storedAccount;
}

/**
 * Retrieves all bank accounts for a wallet (decrypted)
 * 
 * @param walletAddress - User's wallet address
 * @returns Array of decrypted bank accounts
 */
export async function getBankAccounts(walletAddress: string): Promise<BankAccount[]> {
  const storedAccounts = loadBankAccounts(walletAddress);
  
  // Decrypt all accounts
  const decryptedAccounts = await Promise.all(
    storedAccounts.map(account => decryptBankAccount(account, walletAddress))
  );

  return decryptedAccounts;
}

/**
 * Retrieves a single bank account by ID (decrypted)
 * 
 * @param accountId - Bank account ID
 * @param walletAddress - User's wallet address
 * @returns Decrypted bank account or null if not found
 */
export async function getBankAccountById(
  accountId: string,
  walletAddress: string
): Promise<BankAccount | null> {
  const storedAccounts = loadBankAccounts(walletAddress);
  const storedAccount = storedAccounts.find(acc => acc.id === accountId);

  if (!storedAccount) {
    return null;
  }

  return decryptBankAccount(storedAccount, walletAddress);
}

/**
 * Deletes a bank account from storage
 * 
 * @param accountId - Bank account ID to delete
 * @param walletAddress - User's wallet address
 * @returns True if account was deleted, false if not found
 */
export function deleteBankAccount(accountId: string, walletAddress: string): boolean {
  const accounts = loadBankAccounts(walletAddress);
  const initialLength = accounts.length;
  
  const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
  
  if (filteredAccounts.length === initialLength) {
    return false; // Account not found
  }

  saveBankAccounts(filteredAccounts, walletAddress);
  return true;
}

/**
 * Updates a bank account in storage
 * 
 * @param accountId - Bank account ID to update
 * @param updates - Partial bank account updates (unencrypted)
 * @param walletAddress - User's wallet address
 * @returns Updated stored bank account or null if not found
 */
export async function updateBankAccount(
  accountId: string,
  updates: Partial<Omit<BankAccount, 'id' | 'createdAt'>>,
  walletAddress: string
): Promise<StoredBankAccount | null> {
  const accounts = loadBankAccounts(walletAddress);
  const accountIndex = accounts.findIndex(acc => acc.id === accountId);

  if (accountIndex === -1) {
    return null;
  }

  const existingAccount = accounts[accountIndex];
  
  // Decrypt existing account to merge with updates
  const decryptedAccount = await decryptBankAccount(existingAccount, walletAddress);
  
  // Merge updates
  const updatedAccount = {
    ...decryptedAccount,
    ...updates,
  };

  // Re-encrypt
  const encryptedAccount = await encryptBankAccount(updatedAccount, walletAddress);

  // Update in array
  accounts[accountIndex] = {
    ...encryptedAccount,
    id: accountId,
    createdAt: existingAccount.createdAt,
  };

  // Save back to localStorage
  saveBankAccounts(accounts, walletAddress);

  return accounts[accountIndex];
}

/**
 * Clears all bank accounts for a wallet
 * 
 * @param walletAddress - User's wallet address
 */
export function clearBankAccounts(walletAddress: string): void {
  const key = `mavapay_bank_accounts_${walletAddress}`;
  localStorage.removeItem(key);
}
