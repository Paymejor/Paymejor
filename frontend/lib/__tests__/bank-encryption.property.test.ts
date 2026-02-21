/**
 * Bank Account Encryption Property-Based Tests
 * 
 * Property-based tests for bank account encryption utilities
 * Feature: mavapay-btc-ngn-ramp, Property 9: Encryption Round Trip
 * Requirements: 4.3, 10.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  encryptBankAccount,
  decryptBankAccount,
} from '../bank-encryption';
import type { BankAccount, StoredBankAccount } from '@/types/mavapay';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Setup global localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Setup Web Crypto API mock for Node.js environment
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = require('crypto');
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

// Custom arbitraries for bank account data
const bankAccountArbitrary = fc.record({
  bankName: fc.string({ minLength: 1, maxLength: 100 }),
  accountNumber: fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 20 }).map(
    (digits) => digits.join('')
  ),
  accountName: fc.string({ minLength: 1, maxLength: 100 }),
  nipBankCode: fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 3, maxLength: 3 }).map(
    (digits) => digits.join('')
  ),
  isVerified: fc.boolean(),
});

// Generate proper hex wallet addresses
const walletAddressArbitrary = fc.array(
  fc.integer({ min: 0, max: 15 }),
  { minLength: 40, maxLength: 40 }
).map((nums) => `0x${nums.map(n => n.toString(16)).join('')}`);

describe('Bank Account Encryption Property Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  /**
   * Feature: mavapay-btc-ngn-ramp, Property 9: Encryption Round Trip
   * Validates: Requirements 4.3, 10.3
   * 
   * For any valid bank account details, encrypting then decrypting should produce
   * the original account details.
   */
  it('Property 9: Encryption Round Trip - encrypting then decrypting preserves bank account data', async () => {
    await fc.assert(
      fc.asyncProperty(
        bankAccountArbitrary,
        walletAddressArbitrary,
        async (bankAccount, walletAddress) => {
          // Encrypt the bank account
          const encrypted = await encryptBankAccount(bankAccount, walletAddress);

          // Create a stored account for decryption
          const storedAccount: StoredBankAccount = {
            ...encrypted,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          };

          // Decrypt the bank account
          const decrypted = await decryptBankAccount(storedAccount, walletAddress);

          // Verify all fields match the original
          expect(decrypted.bankName).toBe(bankAccount.bankName);
          expect(decrypted.accountNumber).toBe(bankAccount.accountNumber);
          expect(decrypted.accountName).toBe(bankAccount.accountName);
          expect(decrypted.nipBankCode).toBe(bankAccount.nipBankCode);
          expect(decrypted.isVerified).toBe(bankAccount.isVerified);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  /**
   * Additional property: Encrypted data should be different from original
   * 
   * For any valid bank account, the encrypted account number should not match
   * the original account number.
   */
  it('Property: Encrypted account number differs from original', async () => {
    await fc.assert(
      fc.asyncProperty(
        bankAccountArbitrary,
        walletAddressArbitrary,
        async (bankAccount, walletAddress) => {
          const encrypted = await encryptBankAccount(bankAccount, walletAddress);

          // Encrypted account number should be different from original
          expect(encrypted.accountNumber).not.toBe(bankAccount.accountNumber);
          
          // Encrypted account number should be non-empty
          expect(encrypted.accountNumber.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  /**
   * Additional property: Different wallet addresses produce different encrypted values
   * 
   * For any bank account, encrypting with different wallet addresses should
   * produce different encrypted values.
   */
  it('Property: Different wallet addresses produce different encrypted values', async () => {
    await fc.assert(
      fc.asyncProperty(
        bankAccountArbitrary,
        walletAddressArbitrary,
        walletAddressArbitrary,
        async (bankAccount, wallet1, wallet2) => {
          // Skip if wallet addresses are the same
          if (wallet1 === wallet2) return;

          const encrypted1 = await encryptBankAccount(bankAccount, wallet1);
          const encrypted2 = await encryptBankAccount(bankAccount, wallet2);

          // Different wallet addresses should produce different encrypted values
          expect(encrypted1.accountNumber).not.toBe(encrypted2.accountNumber);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  /**
   * Additional property: Decryption with wrong wallet address fails
   * 
   * For any bank account encrypted with one wallet address, attempting to
   * decrypt with a different wallet address should fail.
   */
  it('Property: Decryption with wrong wallet address fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        bankAccountArbitrary,
        walletAddressArbitrary,
        walletAddressArbitrary,
        async (bankAccount, correctWallet, wrongWallet) => {
          // Skip if wallet addresses are the same
          if (correctWallet === wrongWallet) return;

          const encrypted = await encryptBankAccount(bankAccount, correctWallet);

          const storedAccount: StoredBankAccount = {
            ...encrypted,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          };

          // Attempting to decrypt with wrong wallet should throw
          await expect(
            decryptBankAccount(storedAccount, wrongWallet)
          ).rejects.toThrow('Wallet address mismatch');
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  /**
   * Additional property: Multiple encryptions produce different ciphertexts
   * 
   * For any bank account, encrypting the same data multiple times should
   * produce different encrypted values (due to random IV and salt).
   */
  it('Property: Multiple encryptions produce different ciphertexts', async () => {
    await fc.assert(
      fc.asyncProperty(
        bankAccountArbitrary,
        walletAddressArbitrary,
        async (bankAccount, walletAddress) => {
          const encrypted1 = await encryptBankAccount(bankAccount, walletAddress);
          const encrypted2 = await encryptBankAccount(bankAccount, walletAddress);

          // Due to random IV and salt, encrypted values should be different
          expect(encrypted1.accountNumber).not.toBe(encrypted2.accountNumber);

          // But both should decrypt to the same original value
          const storedAccount1: StoredBankAccount = {
            ...encrypted1,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          };

          const storedAccount2: StoredBankAccount = {
            ...encrypted2,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          };

          const decrypted1 = await decryptBankAccount(storedAccount1, walletAddress);
          const decrypted2 = await decryptBankAccount(storedAccount2, walletAddress);

          expect(decrypted1.accountNumber).toBe(bankAccount.accountNumber);
          expect(decrypted2.accountNumber).toBe(bankAccount.accountNumber);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);
});
