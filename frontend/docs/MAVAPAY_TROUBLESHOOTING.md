# MavaPay Troubleshooting Guide

## Overview

This guide helps you diagnose and resolve common issues with the MavaPay BTC ↔ NGN on/off-ramp integration.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Off-Ramp Issues](#off-ramp-issues)
- [On-Ramp Issues](#on-ramp-issues)
- [Bank Account Issues](#bank-account-issues)
- [Transaction Issues](#transaction-issues)
- [Quote and Rate Issues](#quote-and-rate-issues)
- [API and Network Issues](#api-and-network-issues)
- [Security Issues](#security-issues)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

### Is the Feature Working?

Run through this quick checklist:

1. **Can you see the Ramp tab?**
   - ✅ Yes → Feature is enabled
   - ❌ No → Check feature flag: `NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=true`

2. **Can you fetch a quote?**
   - ✅ Yes → MavaPay API is accessible
   - ❌ No → Check API connectivity

3. **Can you add a bank account?**
   - ✅ Yes → Bank verification is working
   - ❌ No → Check bank verification endpoint

4. **Can you see transaction history?**
   - ✅ Yes → Local storage is working
   - ❌ No → Check browser storage permissions

### Common Quick Fixes

Try these first:

1. **Refresh the page** - Clears temporary state issues
2. **Clear browser cache** - Removes stale data
3. **Check wallet connection** - Ensure wallet is connected
4. **Verify balance** - Ensure sufficient funds
5. **Check network** - Ensure stable internet connection

---

## Off-Ramp Issues

### Issue: "Insufficient Balance" Error

**Symptoms**: Error message when trying to off-ramp, transaction fails at validation step

**Causes**:
- Actual insufficient USDT/USDC balance
- Balance not updated after recent transaction
- Amount includes fees that exceed balance

**Solutions**:

1. **Check Your Balance**: Navigate to Dashboard tab, verify USDT/USDC balance, ensure balance > amount + fees

2. **Refresh Balance**: Disconnect and reconnect wallet, refresh the page, wait for balance to update

3. **Reduce Amount**: Try a smaller amount, account for swap fees (~0.5%), leave buffer for gas fees

### Issue: Quote Expires Before Confirmation

**Symptoms**: "Quote expired" error when confirming, need to request new quote repeatedly

**Causes**: Taking too long to confirm (>5 minutes), slow wallet confirmation, network delays

**Solutions**:

1. **Act Quickly**: Review details before requesting quote, have bank account selected in advance, confirm within 5 minutes

2. **Prepare Wallet**: Unlock wallet before starting, ensure wallet extension is responsive, close unnecessary browser tabs

3. **Check Timer**: Watch the countdown timer, request new quote if needed, system auto-refreshes expired quotes

### Issue: Lightning Payment Fails

**Symptoms**: Payment fails after quote acceptance, "Lightning payment failed" error

**Causes**: Insufficient BTC after swap, Lightning network issues, invoice expired, routing problems

**Solutions**:

1. **Verify BTC Amount**: Check BTC balance after swap, ensure amount matches invoice, account for network fees

2. **Retry Payment**: Click "Retry" button, system will generate new invoice, try again with fresh quote

3. **Check Lightning Network**: Visit https://1ml.com/statistics, check network status, wait if network is congested

4. **Contact Support**: If retries fail after 3 attempts, provide transaction ID, email support@mavapay.co

### Issue: Bank Payout Delayed

**Symptoms**: Transaction shows "processing" for >30 minutes, NGN not received in bank account

**Causes**: Bank processing delays, weekend/holiday delays, bank account issues, MavaPay processing queue

**Solutions**:

1. **Check Status**: View transaction in history, check estimated completion time, look for status updates

2. **Wait for Processing**: Normal time is 10-30 minutes, peak times up to 1 hour, weekends may take longer

3. **Verify Bank Account**: Ensure account is active, check account not frozen, verify account details correct

4. **Check with Bank**: Contact your bank, ask about incoming transfers, provide MavaPay reference

5. **Contact MavaPay**: After 2 hours with no update, provide transaction ID and MavaPay order ID

---

## On-Ramp Issues

### Issue: Payment Instructions Not Showing

**Symptoms**: After confirming on-ramp, no payment details, blank screen or loading indefinitely

**Causes**: API request failed, network timeout, invalid Lightning address, amount validation failed

**Solutions**:

1. **Verify Lightning Address**: Check address format is correct, ensure address is active, test with small amount first

2. **Check Amount**: Minimum ₦2,000 (200,000 kobo), maximum check displayed limit, use valid amount within range

3. **Retry Request**: Refresh the page, re-enter details, try again

4. **Check Console**: Open browser developer tools (F12), check Console tab for errors, look for API error messages

### Issue: Bank Transfer Not Detected

**Symptoms**: Completed bank transfer, transaction still shows "pending", BTC not received

**Causes**: Wrong reference code used, wrong amount sent, transfer to wrong account, bank processing delay, webhook not received

**Solutions**:

1. **Verify Transfer Details**: Check you used EXACT amount, verify reference code included, confirm account number correct, check transfer was successful

2. **Wait for Confirmation**: Bank transfers take 5-15 minutes, peak times up to 30 minutes, check transaction status regularly

3. **Check Bank Statement**: Verify transfer was debited, check transfer status in banking app, ensure transfer completed successfully

4. **Contact MavaPay**: After 30 minutes with no update, provide transaction ID, bank transfer receipt, reference code used, and amount sent

### Issue: BTC Not Received After Confirmation

**Symptoms**: MavaPay confirmed NGN receipt, transaction shows "processing", BTC not in Lightning wallet

**Causes**: Lightning address incorrect, Lightning wallet offline, routing issues, MavaPay processing delay

**Solutions**:

1. **Verify Lightning Address**: Check address in transaction details, ensure it's your correct address, verify wallet is online

2. **Check Lightning Wallet**: Open your Lightning wallet, refresh balance, check incoming transactions, ensure wallet is synced

3. **Wait for Processing**: Normal time is 1-5 minutes after NGN confirmation, check transaction status, look for updates

4. **Contact MavaPay**: After 15 minutes with no BTC, provide transaction ID, Lightning address, request status update

---

## Bank Account Issues

### Issue: Bank Account Verification Fails

**Symptoms**: "Account not found" error, "Invalid account" message, verification fails repeatedly

**Causes**: Incorrect account number, wrong bank selected, account not active, bank API issues

**Solutions**:

1. **Verify Account Details**: Double-check account number (10 digits), ensure correct bank selected, verify account is active, check account not frozen

2. **Try Different Bank**: If using joint account try primary account, try different account if available, ensure account supports transfers

3. **Contact Bank**: Verify account is active, ask if account supports third-party verification, ensure no restrictions on account

4. **Try Again Later**: Bank API may be temporarily down, wait 30 minutes and retry, try during business hours

### Issue: Cannot Delete Bank Account

**Symptoms**: Delete button not working, error when trying to delete, account still appears after deletion

**Causes**: Active transaction using account, browser storage issue, JavaScript error

**Solutions**:

1. **Check Active Transactions**: Cannot delete account with pending transactions, wait for transactions to complete, then try deleting again

2. **Clear Browser Cache**: Clear site data, refresh page, try deleting again

3. **Manual Removal**: Open browser developer tools (F12), go to Application > Local Storage, find and delete bank account entry, refresh page

---

## Transaction Issues

### Issue: Transaction Stuck in "Pending"

**Symptoms**: Transaction shows "pending" for extended time, no status updates, no error message

**Causes**: Waiting for payment confirmation, webhook not received, processing delay, network issues

**Solutions**:

1. **Check Transaction Type**:
   - Off-Ramp: Pending means waiting for Lightning payment, check if invoice was paid, verify payment in Lightning wallet
   - On-Ramp: Pending means waiting for bank transfer, verify transfer was completed, check bank statement

2. **Wait for Processing**: Normal pending time is 5-15 minutes, peak times up to 30 minutes, check estimated completion time

3. **Refresh Status**: Refresh the page, check transaction history, look for status updates

4. **Manual Status Check**: After 30 minutes contact support, provide transaction ID, request manual status check

### Issue: Transaction Failed

**Symptoms**: Transaction shows "failed" status, error message displayed, funds not transferred

**Solutions**:

1. **Read Error Message**: Check transaction details, read failure reason, follow suggested next steps

2. **Common Failures**:
   - "Insufficient Balance": Add funds to wallet, try smaller amount, account for fees
   - "Quote Expired": Request new quote, confirm more quickly, check network connection
   - "Invalid Bank Account": Verify account details, re-verify account, try different account
   - "Payment Failed": Check Lightning wallet, ensure sufficient BTC, retry transaction

3. **Retry Transaction**: Click "Retry" button if available, or start new transaction, ensure issue is resolved first

---

## Quote and Rate Issues

### Issue: Quote Not Loading

**Symptoms**: Spinning loader indefinitely, "Failed to fetch quote" error, no exchange rate displayed

**Causes**: API connectivity issues, invalid parameters, MavaPay API down, network timeout

**Solutions**:

1. **Check Network Connection**: Verify internet connection, try loading other websites, check if behind firewall/VPN

2. **Verify Input Parameters**: Check amount is valid number, ensure amount within limits, verify currency selected

3. **Check API Status**: Visit MavaPay status page if available, check for maintenance notices, try again in a few minutes

4. **Check Browser Console**: Open developer tools (F12), check Console for errors, look for API error messages

### Issue: Exchange Rate Seems Wrong

**Symptoms**: Rate significantly different from market, unexpected fees, total amount doesn't match expectation

**Solutions**:

1. **Understand Fee Structure**: MavaPay fee ~1-2%, Network fee ~0.1%, Swap fee (off-ramp) ~0.5%, Total fees ~2-3%

2. **Check Rate Breakdown**: View detailed quote, check exchange rate, review all fees, calculate total cost

3. **Compare with Market**: Check current BTC/NGN rate, account for fees and spread, rates update every 30 seconds

4. **Wait for Better Rate**: Rates fluctuate constantly, wait for favorable rate, set price alerts if needed

---

## API and Network Issues

### Issue: "API Unavailable" Error

**Symptoms**: "MavaPay API unavailable" message, maintenance message displayed, all API calls failing

**Causes**: MavaPay API maintenance, network connectivity issues, API rate limiting, server errors

**Solutions**:

1. **Check API Status**: Visit MavaPay status page, check for maintenance announcements, look for estimated restoration time

2. **Wait and Retry**: Wait 5-10 minutes, refresh the page, try again

3. **Check Network**: Verify internet connection, try different network, disable VPN if using one

4. **Contact Support**: If issue persists >1 hour, report to PayMejor support, check for updates

### Issue: Webhook Not Received

**Symptoms**: Transaction status not updating, manual refresh needed, delayed notifications

**Solutions**:

1. **Wait for Polling**: System polls API every 30 seconds, status will update automatically, no action needed

2. **Manual Refresh**: Refresh the page, check transaction history, status should update

3. **Contact Support**: If status not updating after 5 minutes, provide transaction ID, request manual status check

---

## Security Issues

### Issue: "Invalid Signature" Error (Webhooks)

**Symptoms**: Webhook processing fails, "Invalid signature" in logs, transaction status not updating

**Solutions**:

1. **Verify Webhook Secret**: Check MAVAPAY_WEBHOOK_SECRET in environment, ensure matches MavaPay dashboard, verify no extra spaces

2. **Check Environment**: Sandbox vs Production, ensure using correct secret for environment, verify environment variables loaded

3. **Contact Support**: If signature consistently fails, request webhook secret verification, check MavaPay dashboard settings

### Issue: Bank Account Decryption Fails

**Symptoms**: Cannot load saved bank accounts, "Decryption failed" error, corrupted account data

**Solutions**:

1. **Verify Wallet Address**: Accounts encrypted with wallet address, ensure same wallet connected, check wallet address matches

2. **Clear and Re-add**: Delete corrupted accounts, clear browser storage, re-add bank accounts

3. **Manual Storage Cleanup**: Open developer tools (F12), go to Application > Local Storage, delete corrupted entries, refresh page

---

## Getting Help

### Before Contacting Support

Gather this information:

1. **Transaction Details**: Transaction ID, MavaPay order ID, transaction type, amount and currency, timestamp

2. **Error Information**: Error message (exact text), screenshot of error, browser console errors, steps to reproduce

3. **Environment Details**: Browser and version, operating system, wallet type and version, network (Sepolia/Mainnet)

### Contact Channels

**MavaPay Support**:
- Email: support@mavapay.co
- Response time: 24-48 hours
- For: API issues, transaction status, payouts

**PayMejor Support**:
- GitHub Issues: [repository URL]
- For: UI issues, bugs, feature requests

### Emergency Issues

For urgent issues (funds at risk):

1. Contact MavaPay immediately: support@mavapay.co, mark as "URGENT", include all transaction details

2. Document everything: Take screenshots, save transaction IDs, record timestamps, keep bank receipts

3. Do not retry: Don't retry failed transactions, don't send duplicate payments, wait for support response

---

## Additional Resources

- **User Guide**: [MAVAPAY_USER_GUIDE.md](./MAVAPAY_USER_GUIDE.md)
- **API Reference**: [MAVAPAY_API_REFERENCE.md](./MAVAPAY_API_REFERENCE.md)
- **Setup Guide**: [MAVAPAY_SETUP.md](./MAVAPAY_SETUP.md)
- **Security Guide**: [RAMP_SECURITY.md](./RAMP_SECURITY.md)

---

**Last Updated**: February 2024

**Need Help?** Contact support@mavapay.co
