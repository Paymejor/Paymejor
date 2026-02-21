/**
 * Bank Account Encryption Tests
 * 
 * Tests for bank account encryption and storage utilities
 * Requirements: 4.3, 10.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  encryptBankAccount,
  decryptBankAccount,
  addBankAccount,
  getBankAccounts,
  getBankAccountById,
  deleteBankAccount,
  updateBankAccount,
  saveBankAccounts,
  loadBankAccounts,
  clearBankAccounts,
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

describe('Bank Account Encryption', () => {
  const testWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const testBankAccount: Omit<BankAccount, 'id' | 'createdAt'> = {
    bankName: 'ACCESS BANK',
    accountNumber: '1234567890',
    accountName: 'John Doe',
    nipBankCode: '044',
    isVerified: true,
  };

  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt bank account successfully', async () => {
      const encrypted = await encryptBankAccount(testBankAccount, testWalletAddress);
      
      // Verify encrypted account has encrypted account number
      expect(encrypted.accountNumber).not.toBe(testBankAccount.accountNumber);
      expect(encrypted.accountNumber.length).toBeGreaterThan(0);
      expect(encrypted.walletAddress).toBe(testWalletAddress);
      
      // Create a stored account for decryption
      const storedAccount: StoredBankAccount = {
        ...encrypted,
        id: 'test-id',
        createdAt: new Date().toISOString(),
      };

      const decrypted = await decryptBankAccount(storedAccount, testWalletAddress);
      
      // Verify decrypted account matches original
      expect(decrypted.accountNumber).toBe(testBankAccount.accountNumber);
      expect(decrypted.bankName).toBe(testBankAccount.bankName);
      expect(decrypted.accountName).toBe(testBankAccount.accountName);
      expect(decrypted.nipBankCode).toBe(testBankAccount.nipBankCode);
      expect(decrypted.isVerified).toBe(testBankAccount.isVerified);
    });

    it('should produce different encrypted values for same input', async () => {
      const encrypted1 = await encryptBankAccount(testBankAccount, testWalletAddress);
      const encrypted2 = await encryptBankAccount(testBankAccount, testWalletAddress);
      
      // Due to random IV and salt, encrypted values should be different
      expect(encrypted1.accountNumber).not.toBe(encrypted2.accountNumber);
    });

    it('should fail to decrypt with wrong wallet address', async () => {
      const encrypted = await encryptBankAccount(testBankAccount, testWalletAddress);
      
      const storedAccount: StoredBankAccount = {
        ...encrypted,
        id: 'test-id',
        createdAt: new Date().toISOString(),
      };

      const wrongWalletAddress = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      
      await expect(
        decryptBankAccount(storedAccount, wrongWalletAddress)
      ).rejects.toThrow('Wallet address mismatch');
    });

    it('should fail to decrypt corrupted data', async () => {
      const storedAccount: StoredBankAccount = {
        id: 'test-id',
        walletAddress: testWalletAddress,
        bankName: 'ACCESS BANK',
        accountNumber: 'corrupted-base64-data',
        accountName: 'John Doe',
        nipBankCode: '044',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      await expect(
        decryptBankAccount(storedAccount, testWalletAddress)
      ).rejects.toThrow('Failed to decrypt bank account data');
    });
  });

  describe('Storage Operations', () => {
    it('should add a bank account to storage', async () => {
      const storedAccount = await addBankAccount(testBankAccount, testWalletAddress);
      
      expect(storedAccount.id).toBeDefined();
      expect(storedAccount.createdAt).toBeDefined();
      expect(storedAccount.walletAddress).toBe(testWalletAddress);
      expect(storedAccount.accountNumber).not.toBe(testBankAccount.accountNumber);
      
      // Verify it's in localStorage
      const accounts = loadBankAccounts(testWalletAddress);
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe(storedAccount.id);
    });

    it('should retrieve all bank accounts', async () => {
      await addBankAccount(testBankAccount, testWalletAddress);
      await addBankAccount(
        { ...testBankAccount, accountNumber: '0987654321' },
        testWalletAddress
      );

      const accounts = await getBankAccounts(testWalletAddress);
      
      expect(accounts).toHaveLength(2);
      expect(accounts[0].accountNumber).toBe(testBankAccount.accountNumber);
      expect(accounts[1].accountNumber).toBe('0987654321');
    });

    it('should retrieve a bank account by ID', async () => {
      const stored = await addBankAccount(testBankAccount, testWalletAddress);
      
      const retrieved = await getBankAccountById(stored.id, testWalletAddress);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(stored.id);
      expect(retrieved?.accountNumber).toBe(testBankAccount.accountNumber);
    });

    it('should return null for non-existent account ID', async () => {
      const retrieved = await getBankAccountById('non-existent-id', testWalletAddress);
      
      expect(retrieved).toBeNull();
    });

    it('should delete a bank account', async () => {
      const stored = await addBankAccount(testBankAccount, testWalletAddress);
      
      const deleted = deleteBankAccount(stored.id, testWalletAddress);
      
      expect(deleted).toBe(true);
      
      const accounts = loadBankAccounts(testWalletAddress);
      expect(accounts).toHaveLength(0);
    });

    it('should return false when deleting non-existent account', () => {
      const deleted = deleteBankAccount('non-existent-id', testWalletAddress);
      
      expect(deleted).toBe(false);
    });

    it('should update a bank account', async () => {
      const stored = await addBankAccount(testBankAccount, testWalletAddress);
      
      const updated = await updateBankAccount(
        stored.id,
        { isVerified: false, accountName: 'Jane Doe' },
        testWalletAddress
      );
      
      expect(updated).not.toBeNull();
      expect(updated?.isVerified).toBe(false);
      
      const retrieved = await getBankAccountById(stored.id, testWalletAddress);
      expect(retrieved?.isVerified).toBe(false);
      expect(retrieved?.accountName).toBe('Jane Doe');
      expect(retrieved?.accountNumber).toBe(testBankAccount.accountNumber);
    });

    it('should return null when updating non-existent account', async () => {
      const updated = await updateBankAccount(
        'non-existent-id',
        { isVerified: false },
        testWalletAddress
      );
      
      expect(updated).toBeNull();
    });

    it('should clear all bank accounts', async () => {
      await addBankAccount(testBankAccount, testWalletAddress);
      await addBankAccount(
        { ...testBankAccount, accountNumber: '0987654321' },
        testWalletAddress
      );

      clearBankAccounts(testWalletAddress);
      
      const accounts = loadBankAccounts(testWalletAddress);
      expect(accounts).toHaveLength(0);
    });

    it('should isolate accounts by wallet address', async () => {
      const wallet1 = '0x1111111111111111111111111111111111111111';
      const wallet2 = '0x2222222222222222222222222222222222222222';

      await addBankAccount(testBankAccount, wallet1);
      await addBankAccount(
        { ...testBankAccount, accountNumber: '0987654321' },
        wallet2
      );

      const accounts1 = await getBankAccounts(wallet1);
      const accounts2 = await getBankAccounts(wallet2);

      expect(accounts1).toHaveLength(1);
      expect(accounts2).toHaveLength(1);
      expect(accounts1[0].accountNumber).toBe(testBankAccount.accountNumber);
      expect(accounts2[0].accountNumber).toBe('0987654321');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty localStorage', () => {
      const accounts = loadBankAccounts(testWalletAddress);
      expect(accounts).toHaveLength(0);
    });

    it('should handle corrupted localStorage data', () => {
      const key = `mavapay_bank_accounts_${testWalletAddress}`;
      localStorageMock.setItem(key, 'invalid-json-data');
      
      const accounts = loadBankAccounts(testWalletAddress);
      expect(accounts).toHaveLength(0);
    });

    it('should handle special characters in account data', async () => {
      const specialAccount: Omit<BankAccount, 'id' | 'createdAt'> = {
        bankName: 'BANK & CO.',
        accountNumber: '1234567890',
        accountName: "O'Brien-Smith",
        nipBankCode: '044',
        isVerified: true,
      };

      const encrypted = await encryptBankAccount(specialAccount, testWalletAddress);
      const storedAccount: StoredBankAccount = {
        ...encrypted,
        id: 'test-id',
        createdAt: new Date().toISOString(),
      };

      const decrypted = await decryptBankAccount(storedAccount, testWalletAddress);
      
      expect(decrypted.bankName).toBe(specialAccount.bankName);
      expect(decrypted.accountName).toBe(specialAccount.accountName);
    });

    it('should handle very long account numbers', async () => {
      const longAccount: Omit<BankAccount, 'id' | 'createdAt'> = {
        ...testBankAccount,
        accountNumber: '12345678901234567890',
      };

      const encrypted = await encryptBankAccount(longAccount, testWalletAddress);
      const storedAccount: StoredBankAccount = {
        ...encrypted,
        id: 'test-id',
        createdAt: new Date().toISOString(),
      };

      const decrypted = await decryptBankAccount(storedAccount, testWalletAddress);
      
      expect(decrypted.accountNumber).toBe(longAccount.accountNumber);
    });
  });

  describe('Security', () => {
    it('should not store plain text account numbers', async () => {
      // Use a unique account number that won't appear in wallet address
      const uniqueAccount = {
        ...testBankAccount,
        accountNumber: '9876543210',
      };
      const uniqueWallet = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      
      await addBankAccount(uniqueAccount, uniqueWallet);
      
      const key = `mavapay_bank_accounts_${uniqueWallet}`;
      const rawData = localStorageMock.getItem(key);
      
      expect(rawData).toBeDefined();
      expect(rawData).not.toContain(uniqueAccount.accountNumber);
    });

    it('should use different encryption for different wallet addresses', async () => {
      const wallet1 = '0x1111111111111111111111111111111111111111';
      const wallet2 = '0x2222222222222222222222222222222222222222';

      const encrypted1 = await encryptBankAccount(testBankAccount, wallet1);
      const encrypted2 = await encryptBankAccount(testBankAccount, wallet2);

      expect(encrypted1.accountNumber).not.toBe(encrypted2.accountNumber);
    });
  });
});
