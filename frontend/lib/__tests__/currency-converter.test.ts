/**
 * Currency Converter Tests
 * 
 * Tests for currency conversion utilities
 * Requirements: 6.1, 6.2
 */

import { describe, it, expect } from 'vitest';
import {
  ngnToKobo,
  koboToNgn,
  btcToSatoshis,
  satoshisToBtc,
  formatNGN,
  formatBTC,
  formatSatoshis,
  parseNGNToKobo,
  parseBTCToSatoshis,
  isValidKoboAmount,
  isValidSatoshisAmount,
  meetsMinimumNGN,
  getMinimumNGNKobo,
} from '../currency-converter';

describe('Currency Converter', () => {
  describe('NGN Conversions', () => {
    it('should convert NGN to Kobo', () => {
      expect(ngnToKobo(1)).toBe(100);
      expect(ngnToKobo(10)).toBe(1000);
      expect(ngnToKobo(1234.56)).toBe(123456);
    });

    it('should convert Kobo to NGN', () => {
      expect(koboToNgn(100)).toBe(1);
      expect(koboToNgn(1000)).toBe(10);
      expect(koboToNgn(123456)).toBe(1234.56);
    });

    it('should format NGN correctly', () => {
      expect(formatNGN(123456)).toBe('₦1,234.56');
      expect(formatNGN(100)).toBe('₦1.00');
    });

    it('should parse NGN string to Kobo', () => {
      expect(parseNGNToKobo('1234.56')).toBe(123456);
      expect(parseNGNToKobo('₦1,234.56')).toBe(123456);
      expect(parseNGNToKobo('1,234.56')).toBe(123456);
    });
  });

  describe('BTC Conversions', () => {
    it('should convert BTC to Satoshis', () => {
      expect(btcToSatoshis(1)).toBe(100_000_000);
      expect(btcToSatoshis(0.5)).toBe(50_000_000);
      expect(btcToSatoshis(0.00123456)).toBe(123456);
    });

    it('should convert Satoshis to BTC', () => {
      expect(satoshisToBtc(100_000_000)).toBe(1);
      expect(satoshisToBtc(50_000_000)).toBe(0.5);
      expect(satoshisToBtc(123456)).toBe(0.00123456);
    });

    it('should format BTC correctly', () => {
      expect(formatBTC(123456)).toBe('0.00123456 BTC');
      expect(formatBTC(100_000_000)).toBe('1.00000000 BTC');
    });

    it('should format Satoshis correctly', () => {
      expect(formatSatoshis(123456)).toBe('123,456 sats');
      expect(formatSatoshis(1000000)).toBe('1,000,000 sats');
    });

    it('should parse BTC string to Satoshis', () => {
      expect(parseBTCToSatoshis('0.00123456')).toBe(123456);
      expect(parseBTCToSatoshis('0.00123456 BTC')).toBe(123456);
      expect(parseBTCToSatoshis('1 BTC')).toBe(100_000_000);
    });
  });

  describe('Validation', () => {
    it('should validate Kobo amounts', () => {
      expect(isValidKoboAmount(100)).toBe(true);
      expect(isValidKoboAmount(0)).toBe(false);
      expect(isValidKoboAmount(-100)).toBe(false);
      expect(isValidKoboAmount(123.45)).toBe(false);
    });

    it('should validate Satoshis amounts', () => {
      expect(isValidSatoshisAmount(100)).toBe(true);
      expect(isValidSatoshisAmount(0)).toBe(false);
      expect(isValidSatoshisAmount(-100)).toBe(false);
      expect(isValidSatoshisAmount(123.45)).toBe(false);
    });

    it('should check minimum NGN requirement', () => {
      expect(meetsMinimumNGN(200_000)).toBe(true); // 2000 NGN
      expect(meetsMinimumNGN(199_999)).toBe(false);
      expect(meetsMinimumNGN(300_000)).toBe(true);
    });

    it('should return correct minimum NGN amount', () => {
      expect(getMinimumNGNKobo()).toBe(200_000);
    });
  });
});
