# MavaPay On/Off-Ramp User Guide

## Overview

The MavaPay integration enables Nigerian users to seamlessly convert between Bitcoin (BTC) and Nigerian Naira (NGN) directly within PayMejor. This guide covers how to use the on-ramp and off-ramp features.

## Table of Contents

- [Getting Started](#getting-started)
- [Off-Ramp: Converting Crypto to Naira](#off-ramp-converting-crypto-to-naira)
- [On-Ramp: Converting Naira to Crypto](#on-ramp-converting-naira-to-crypto)
- [Managing Bank Accounts](#managing-bank-accounts)
- [Transaction History](#transaction-history)
- [Understanding Fees and Rates](#understanding-fees-and-rates)
- [Transaction Limits](#transaction-limits)
- [Common Questions](#common-questions)

---

## Getting Started

### Prerequisites

Before using the MavaPay ramp features, ensure you have:

1. **Connected Wallet**: A Starknet wallet connected to PayMejor
2. **Nigerian Bank Account**: A valid Nigerian bank account for receiving/sending NGN
3. **Minimum Balance**: 
   - For off-ramp: Sufficient USDT or USDC balance
   - For on-ramp: At least ₦2,000 NGN in your bank account

### Accessing the Ramp Feature

1. Navigate to the PayMejor application
2. Click on the **"Ramp"** tab in the main navigation
3. Choose between **"Off-Ramp"** (Crypto → Naira) or **"On-Ramp"** (Naira → Crypto)

---

## Off-Ramp: Converting Crypto to Naira

The off-ramp flow allows you to convert your stablecoins (USDT/USDC) to Nigerian Naira and receive funds directly in your bank account.

### Step-by-Step Process

#### Step 1: Select Off-Ramp Mode

1. Click on the **"Ramp"** tab
2. Ensure **"Off-Ramp"** is selected (Crypto → Naira)

#### Step 2: Enter Amount

1. Enter the amount you want to convert
2. Select the source currency (USDT or USDC)
3. The system will automatically:
   - Validate your balance
   - Show the equivalent BTC amount after swap
   - Display the NGN amount you'll receive

#### Step 3: Review Quote

The quote display shows:
- **Exchange Rate**: Current BTC/NGN rate
- **MavaPay Fee**: Service fee charged by MavaPay
- **Network Fee**: Lightning Network transaction fee
- **Total NGN**: Final amount you'll receive in your bank account
- **Expiration Time**: Quote is valid for 5 minutes

**Important**: If the rate changes by more than 2%, you'll need to re-confirm the transaction.

#### Step 4: Select Bank Account

1. Choose a saved bank account from the dropdown
2. Or click **"Add New Bank Account"** to add one
3. Verify the account details are correct

#### Step 5: Confirm Transaction

1. Review all details carefully:
   - Amount to convert
   - Bank account receiving funds
   - Exchange rate and fees
   - Total NGN to receive
2. Click **"Confirm Off-Ramp"**
3. Approve the transaction in your wallet

#### Step 6: Transaction Processing

The system will:
1. **Swap USDT/USDC to BTC** using AVNU (automatic)
2. **Generate Lightning Invoice** via MavaPay
3. **Pay Lightning Invoice** with your BTC
4. **Initiate Bank Payout** to your Nigerian bank account

You can track the progress in real-time on the transaction screen.

#### Step 7: Receive Funds

- **Typical Time**: 5-30 minutes
- **Bank Transfer**: Funds arrive via bank transfer
- **Confirmation**: You'll receive a notification when complete

### What Happens Behind the Scenes

```
Your USDT/USDC → Swap to BTC → Lightning Payment → NGN Bank Transfer
     (AVNU)         (MavaPay)      (Your Bank)
```

---

## On-Ramp: Converting Naira to Crypto

The on-ramp flow allows you to purchase BTC with Nigerian Naira from your bank account and optionally bridge it to Starknet.

### Step-by-Step Process

#### Step 1: Select On-Ramp Mode

1. Click on the **"Ramp"** tab
2. Select **"On-Ramp"** (Naira → Crypto)

#### Step 2: Enter Amount

1. Enter the NGN amount you want to convert
2. The system will display:
   - BTC amount you'll receive
   - Current exchange rate
   - All applicable fees

#### Step 3: Review Quote

The quote display shows:
- **Exchange Rate**: Current NGN/BTC rate
- **MavaPay Fee**: Service fee charged by MavaPay
- **Network Fee**: Lightning Network transaction fee
- **Total BTC**: Final BTC amount you'll receive
- **Expiration Time**: Quote is valid for 5 minutes

#### Step 4: Enter Lightning Address

1. Enter your Lightning wallet address
2. This is where you'll receive the BTC
3. Double-check the address is correct

**Note**: If you want to bridge to Starknet, you can use the Atomiq integration after receiving BTC.

#### Step 5: Confirm Transaction

1. Review all details carefully
2. Click **"Confirm On-Ramp"**
3. You'll receive payment instructions

#### Step 6: Make Bank Transfer

You'll see payment instructions with:
- **Bank Name**: MavaPay's receiving bank
- **Account Number**: Unique account for your transaction
- **Account Name**: MavaPay account name
- **Amount**: Exact NGN amount to send
- **Reference**: Unique reference code (important!)

**Important Steps**:
1. Open your banking app or visit your bank
2. Make a transfer to the provided account
3. Use the EXACT amount shown
4. Include the reference code in the transfer description
5. Complete the transfer within the quote expiration time (5 minutes)

#### Step 7: Wait for Confirmation

- MavaPay monitors for your bank transfer
- Once confirmed, BTC is released to your Lightning address
- **Typical Time**: 5-30 minutes after bank transfer

#### Step 8: Bridge to Starknet (Optional)

After receiving BTC:
1. Click **"Bridge to Starknet"** button
2. This uses Atomiq to bridge BTC to Starknet
3. Your Starknet BTC balance will update
4. You can now use it as collateral in Vesu

### What Happens Behind the Scenes

```
Your Bank Transfer → MavaPay Confirms → BTC Released → Bridge to Starknet
    (Your Bank)        (Lightning)       (Atomiq)      (Optional)
```

---

## Managing Bank Accounts

### Adding a Bank Account

1. Navigate to **"Ramp"** tab
2. Click **"Manage Bank Accounts"**
3. Click **"Add New Account"**
4. Fill in the details:
   - **Bank Name**: Select from dropdown
   - **Account Number**: 10-digit account number
   - **Account Name**: Your name as registered with the bank
5. Click **"Verify Account"**
6. The system will verify your account with MavaPay
7. Once verified, the account is saved securely

### Security Features

- **Encryption**: All bank account details are encrypted using AES-256
- **Wallet-Specific**: Accounts are tied to your wallet address
- **Local Storage**: Data is stored locally in your browser
- **No Server Storage**: Bank details are never sent to PayMejor servers

### Viewing Saved Accounts

1. Navigate to **"Ramp"** tab
2. Click **"Manage Bank Accounts"**
3. View all your saved accounts with:
   - Bank name
   - Masked account number (e.g., ****5678)
   - Verification status

### Deleting a Bank Account

1. Navigate to **"Manage Bank Accounts"**
2. Find the account you want to remove
3. Click the **"Delete"** button
4. Confirm deletion
5. The account is permanently removed from storage

---

## Transaction History

### Viewing Transaction History

1. Navigate to **"Ramp"** tab
2. Scroll down to **"Transaction History"** section
3. View all your on-ramp and off-ramp transactions

### Transaction Information

Each transaction shows:
- **Type**: On-Ramp or Off-Ramp
- **Status**: Pending, Processing, Completed, or Failed
- **Amount**: Source and target amounts
- **Exchange Rate**: Rate at time of transaction
- **Fees**: Total fees paid
- **Date**: Transaction timestamp
- **Reference**: MavaPay order ID

### Transaction Statuses

| Status | Description | Typical Duration |
|--------|-------------|------------------|
| **Pending** | Waiting for payment confirmation | 1-5 minutes |
| **Processing** | Payment confirmed, processing payout | 5-15 minutes |
| **Completed** | Transaction successful, funds delivered | - |
| **Failed** | Transaction failed, see error message | - |

### Tracking a Transaction

1. Click on any transaction in the history
2. View detailed information:
   - Current status
   - Progress indicators
   - Estimated completion time
   - Transaction hash (when available)
   - Bank reference (for off-ramp)

### Failed Transactions

If a transaction fails:
1. View the error message in transaction details
2. Check the suggested next steps
3. Contact support if needed (support information provided)
4. Retry the transaction if applicable

---

## Understanding Fees and Rates

### Fee Structure

#### MavaPay Service Fee
- Charged by MavaPay for the conversion service
- Typically 1-2% of transaction amount
- Displayed clearly before confirmation

#### Lightning Network Fee
- Small fee for Lightning Network transactions
- Usually less than 0.1% of transaction amount
- Varies based on network conditions

#### Swap Fee (Off-Ramp Only)
- Fee for swapping USDT/USDC to BTC via AVNU
- Typically 0.3-0.5% of swap amount
- Included in the total fee display

### Exchange Rates

- **Real-Time Rates**: Fetched from MavaPay in real-time
- **Market-Based**: Based on current BTC/NGN market rates
- **Quote Expiration**: Rates are valid for 5 minutes
- **Auto-Refresh**: Expired quotes are automatically refreshed
- **Rate Change Alert**: You'll be notified if rate changes >2%

### Total Cost Breakdown

Before confirming any transaction, you'll see:
```
Source Amount:        1000 USDT
Swap Fee:            5 USDT
BTC Amount:          0.0123 BTC
MavaPay Fee:         ₦500
Network Fee:         ₦50
─────────────────────────────
Total NGN Received:  ₦45,450
```

---

## Transaction Limits

### Minimum Amounts

- **Off-Ramp**: ₦2,000 NGN minimum
- **On-Ramp**: ₦2,000 NGN minimum

If you enter an amount below the minimum, you'll see an error message with the required minimum.

### Maximum Amounts

- **Daily Limit**: Varies based on MavaPay account tier
- **Per Transaction**: Displayed in the UI when entering amounts
- **KYC Requirements**: Higher limits may require additional verification

### Checking Your Limits

1. Navigate to **"Ramp"** tab
2. Current limits are displayed below the amount input
3. Limits are fetched dynamically from MavaPay

---

## Common Questions

### How long does an off-ramp take?

**Typical Time**: 15-30 minutes total
- Swap (USDT/USDC → BTC): 2-5 minutes
- Lightning Payment: 1-2 minutes
- Bank Payout: 10-20 minutes

### How long does an on-ramp take?

**Typical Time**: 15-30 minutes after bank transfer
- Bank Transfer Confirmation: 5-15 minutes
- BTC Release: 1-2 minutes
- Bridge to Starknet (optional): 10-15 minutes

### What if my quote expires?

- Quotes expire after 5 minutes
- The system automatically fetches a new quote
- You'll need to re-confirm if the rate changed significantly (>2%)
- No action needed if rate is similar

### What if the exchange rate changes?

- If rate changes <2%: Transaction proceeds automatically
- If rate changes >2%: You must re-confirm the transaction
- You can always cancel and wait for a better rate

### Is my bank account information secure?

Yes, your bank account information is:
- Encrypted using AES-256 encryption
- Stored only in your browser (localStorage)
- Never sent to PayMejor servers
- Tied to your wallet address
- Deleted when you remove the account

### What if my transaction fails?

1. Check the error message in transaction details
2. Common reasons:
   - Insufficient balance
   - Invalid bank account
   - Quote expired
   - Network issues
3. Follow suggested next steps
4. Retry the transaction
5. Contact support if issue persists

### Can I cancel a transaction?

- **Before Confirmation**: Yes, simply close the dialog
- **After Confirmation**: No, transactions cannot be cancelled
- **Failed Transactions**: Automatically reversed, no action needed

### What banks are supported?

All major Nigerian banks are supported, including:
- Access Bank
- GTBank
- First Bank
- Zenith Bank
- UBA
- And many more

View the complete list when adding a bank account.

### Do I need KYC verification?

- **Basic Transactions**: No KYC required for amounts under daily limit
- **Higher Limits**: May require KYC verification with MavaPay
- **Verification Process**: Handled directly by MavaPay

### What if I enter the wrong bank account?

- **Before Confirmation**: Edit the account details
- **After Confirmation**: Contact MavaPay support immediately
- **Prevention**: Always double-check account details before confirming

### Can I use this feature outside Nigeria?

- **Off-Ramp**: Only Nigerian bank accounts are supported
- **On-Ramp**: Only Nigerian bank transfers are accepted
- **Future**: Additional countries may be added

### What happens if MavaPay is down?

- You'll see a maintenance message
- The ramp feature will be temporarily disabled
- Your funds remain safe
- Try again when service is restored

### How do I contact support?

If you need help:
1. Check this user guide
2. Review the troubleshooting guide
3. Check transaction error messages for specific guidance
4. Contact MavaPay support: support@mavapay.co
5. Contact PayMejor support: [support contact]

---

## Tips for Best Experience

### For Off-Ramp

1. **Check Balance**: Ensure sufficient USDT/USDC before starting
2. **Verify Bank Account**: Add and verify bank account in advance
3. **Monitor Rates**: Watch exchange rates for favorable timing
4. **Act Quickly**: Confirm within 5 minutes to avoid quote expiration
5. **Save Accounts**: Save frequently-used bank accounts for faster transactions

### For On-Ramp

1. **Prepare Funds**: Have NGN ready in your bank account
2. **Use Correct Reference**: Always include the reference code in bank transfer
3. **Exact Amount**: Send the exact NGN amount shown
4. **Fast Transfer**: Complete bank transfer quickly (within 5 minutes)
5. **Bridge Option**: Consider bridging to Starknet to use as collateral

### General Tips

1. **Test Small Amounts**: Start with small amounts to familiarize yourself
2. **Save Bank Accounts**: Securely save accounts for faster future transactions
3. **Monitor Transactions**: Check transaction history regularly
4. **Understand Fees**: Review fee breakdown before confirming
5. **Timing**: Avoid peak hours for faster processing

---

## Security Best Practices

1. **Verify URLs**: Always ensure you're on the official PayMejor site
2. **Check Addresses**: Double-check all addresses and account numbers
3. **Secure Wallet**: Keep your wallet secure and never share private keys
4. **Monitor Transactions**: Regularly review transaction history
5. **Report Issues**: Report suspicious activity immediately

---

## Next Steps

Now that you understand how to use the MavaPay ramp features:

1. **Add a Bank Account**: Set up your Nigerian bank account
2. **Try a Small Transaction**: Start with a small amount to test
3. **Explore Features**: Try both on-ramp and off-ramp
4. **Use with Vesu**: Bridge BTC to Starknet and use as collateral
5. **Provide Feedback**: Help us improve by sharing your experience

---

## Additional Resources

- **API Documentation**: [MAVAPAY_API_REFERENCE.md](./MAVAPAY_API_REFERENCE.md)
- **Troubleshooting Guide**: [MAVAPAY_TROUBLESHOOTING.md](./MAVAPAY_TROUBLESHOOTING.md)
- **Setup Guide**: [MAVAPAY_SETUP.md](./MAVAPAY_SETUP.md)
- **Security Documentation**: [RAMP_SECURITY.md](./RAMP_SECURITY.md)

---

**Last Updated**: February 2024

**Need Help?** Contact support@mavapay.co or check the troubleshooting guide.
