/**
 * Currency Conversion Utilities
 * 
 * Handles conversions between display units and smallest units for:
 * - Nigerian Naira (NGN) ↔ Kobo
 * - Bitcoin (BTC) ↔ Satoshis
 * 
 * Requirements: 6.1, 6.2
 */

// ============================================================================
// Conversion Constants
// ============================================================================

const KOBO_PER_NGN = 100;
const SATOSHIS_PER_BTC = 100_000_000;

// ============================================================================
// NGN Conversions
// ============================================================================

/**
 * Convert Nigerian Naira to Kobo (smallest unit)
 * 1 NGN = 100 kobo
 */
export function ngnToKobo(ngn: number): number {
  return Math.round(ngn * KOBO_PER_NGN);
}

/**
 * Convert Kobo to Nigerian Naira
 * 100 kobo = 1 NGN
 */
export function koboToNgn(kobo: number): number {
  return kobo / KOBO_PER_NGN;
}

// ============================================================================
// BTC Conversions
// ============================================================================

/**
 * Convert Bitcoin to Satoshis (smallest unit)
 * 1 BTC = 100,000,000 satoshis
 */
export function btcToSatoshis(btc: number): number {
  return Math.round(btc * SATOSHIS_PER_BTC);
}

/**
 * Convert Satoshis to Bitcoin
 * 100,000,000 satoshis = 1 BTC
 */
export function satoshisToBtc(satoshis: number): number {
  return satoshis / SATOSHIS_PER_BTC;
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format Kobo as Nigerian Naira with currency symbol
 * Example: 123456 kobo → "₦1,234.56"
 */
export function formatNGN(kobo: number): string {
  const ngn = koboToNgn(kobo);
  return `₦${ngn.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format Satoshis as Bitcoin with BTC suffix
 * Example: 12345678 satoshis → "0.12345678 BTC"
 */
export function formatBTC(satoshis: number): string {
  const btc = satoshisToBtc(satoshis);
  return `${btc.toFixed(8)} BTC`;
}

/**
 * Format Satoshis with comma separators and "sats" suffix
 * Example: 123456 satoshis → "123,456 sats"
 */
export function formatSatoshis(satoshis: number): string {
  return `${satoshis.toLocaleString('en-US')} sats`;
}

/**
 * Parse NGN string to Kobo
 * Handles various input formats: "1234.56", "₦1,234.56", "1,234.56"
 */
export function parseNGNToKobo(input: string): number {
  // Remove currency symbol and commas
  const cleaned = input.replace(/[₦,]/g, '').trim();
  const ngn = parseFloat(cleaned);
  
  if (isNaN(ngn)) {
    throw new Error('Invalid NGN amount');
  }
  
  return ngnToKobo(ngn);
}

/**
 * Parse BTC string to Satoshis
 * Handles various input formats: "0.12345678", "0.123 BTC"
 */
export function parseBTCToSatoshis(input: string): number {
  // Remove BTC suffix and whitespace
  const cleaned = input.replace(/BTC/i, '').trim();
  const btc = parseFloat(cleaned);
  
  if (isNaN(btc)) {
    throw new Error('Invalid BTC amount');
  }
  
  return btcToSatoshis(btc);
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate that an amount in Kobo is within valid range
 */
export function isValidKoboAmount(kobo: number): boolean {
  return Number.isInteger(kobo) && kobo > 0;
}

/**
 * Validate that an amount in Satoshis is within valid range
 */
export function isValidSatoshisAmount(satoshis: number): boolean {
  return Number.isInteger(satoshis) && satoshis > 0;
}

/**
 * Check if amount meets minimum NGN requirement (2000 NGN = 200,000 kobo)
 * Requirements: 7.1
 */
export function meetsMinimumNGN(kobo: number): boolean {
  const MIN_NGN_KOBO = 200_000; // 2000 NGN
  return kobo >= MIN_NGN_KOBO;
}

/**
 * Get minimum NGN amount in Kobo
 */
export function getMinimumNGNKobo(): number {
  return 200_000; // 2000 NGN
}

/**
 * Get minimum NGN amount formatted
 */
export function getMinimumNGNFormatted(): string {
  return formatNGN(getMinimumNGNKobo());
}
