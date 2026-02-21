# Requirements Document

## Introduction

This feature integrates MavaPay as the primary on-ramp and off-ramp provider for Paymejor, enabling Nigerian users to convert between Bitcoin (BTC) and Nigerian Naira (NGN). MavaPay provides Lightning Network-based BTC transactions with direct bank account integration, completing the liquidity loop for users who want to borrow stablecoins and convert to local fiat, or fund their positions using local currency.

## Glossary

- **MavaPay**: A Nigerian-focused payment service provider enabling BTC ↔ NGN conversions via Lightning Network
- **Off-Ramp**: The process of converting cryptocurrency to fiat currency (BTC → NGN)
- **On-Ramp**: The process of converting fiat currency to cryptocurrency (NGN → BTC)
- **Lightning_Network**: A Layer 2 payment protocol on Bitcoin enabling fast, low-cost transactions
- **Lightning_Invoice**: A payment request on the Lightning Network containing amount and destination
- **NGN**: Nigerian Naira, the official currency of Nigeria
- **Kobo**: The smallest unit of NGN (1 NGN = 100 kobo)
- **Autoswap**: The existing Paymejor service for swapping stablecoins to BTC on Starknet
- **Atomiq**: The existing bridge service for moving BTC between Bitcoin and Starknet networks
- **Vesu**: The lending protocol where users collateralize assets and borrow stablecoins
- **Quote**: A real-time exchange rate offer with expiration time
- **Payout**: A transfer of NGN from MavaPay to a user's Nigerian bank account
- **Webhook**: An HTTP callback for asynchronous event notifications from MavaPay

## Requirements

### Requirement 1: Off-Ramp Flow (Crypto to Fiat)

**User Story:** As a Paymejor user, I want to convert my borrowed stablecoins to NGN in my Nigerian bank account, so that I can access local currency while keeping my collateral private.

#### Acceptance Criteria

1. WHEN a user initiates an off-ramp transaction, THE System SHALL validate the user has sufficient USDT or USDC balance
2. WHEN the user confirms the off-ramp, THE System SHALL swap USDT/USDC to BTC using AVNU
3. WHEN the BTC swap completes, THE System SHALL request a quote from MavaPay for BTC to NGN conversion
4. WHEN the MavaPay quote is received, THE System SHALL display the NGN amount, fees, and exchange rate to the user
5. WHEN the user accepts the quote, THE System SHALL generate a Lightning invoice via MavaPay API
6. WHEN the Lightning invoice is generated, THE System SHALL pay the invoice with the user's BTC
7. WHEN the Lightning payment is confirmed, THE System SHALL initiate a payout to the user's Nigerian bank account
8. WHEN the payout completes, THE System SHALL notify the user with transaction confirmation and bank deposit details

### Requirement 2: On-Ramp Flow (Fiat to Crypto)

**User Story:** As a Paymejor user, I want to purchase BTC with NGN from my Nigerian bank account, so that I can bridge it to Starknet and use it as collateral in Vesu.

#### Acceptance Criteria

1. WHEN a user initiates an on-ramp transaction, THE System SHALL request a quote from MavaPay for NGN to BTC conversion
2. WHEN the MavaPay quote is received, THE System SHALL display the BTC amount, fees, and exchange rate to the user
3. WHEN the user accepts the quote, THE System SHALL generate payment instructions for NGN bank transfer
4. WHEN the user completes the bank transfer, THE System SHALL monitor the MavaPay webhook for payment confirmation
5. WHEN MavaPay confirms NGN receipt, THE System SHALL release BTC to the user's Lightning wallet address
6. WHEN BTC is received, THE System SHALL provide the option to bridge to Starknet via Atomiq
7. WHEN the bridge completes, THE System SHALL display the user's updated Starknet BTC balance

### Requirement 3: MavaPay API Integration

**User Story:** As a developer, I want to integrate with MavaPay's API securely and reliably, so that users can execute on/off-ramp transactions without errors.

#### Acceptance Criteria

1. THE System SHALL authenticate with MavaPay API using secure API keys stored in environment variables
2. WHEN making API requests, THE System SHALL use the sandbox environment for testing and production environment for live transactions
3. WHEN requesting quotes, THE System SHALL include amount, source currency, and destination currency
4. WHEN creating payouts, THE System SHALL validate Nigerian bank account details before submission
5. WHEN processing webhooks, THE System SHALL verify webhook signatures to prevent spoofing
6. IF an API request fails, THEN THE System SHALL retry with exponential backoff up to 3 attempts
7. IF all retries fail, THEN THE System SHALL log the error and notify the user with a descriptive message

### Requirement 4: Bank Account Management

**User Story:** As a user, I want to securely save my Nigerian bank account details, so that I can quickly execute off-ramp transactions without re-entering information.

#### Acceptance Criteria

1. WHEN a user adds a bank account, THE System SHALL validate the account number format (10 digits for Nigerian banks)
2. WHEN a user adds a bank account, THE System SHALL verify the account exists via MavaPay's bank verification API
3. WHEN bank verification succeeds, THE System SHALL store the account details encrypted in the user's profile
4. WHEN a user initiates an off-ramp, THE System SHALL display saved bank accounts for selection
5. WHEN a user selects a saved bank account, THE System SHALL use it for the payout destination
6. WHEN a user requests to delete a bank account, THE System SHALL remove it from their profile immediately

### Requirement 5: Transaction History and Status Tracking

**User Story:** As a user, I want to view the status of my on-ramp and off-ramp transactions, so that I can track when funds will arrive and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a user initiates a ramp transaction, THE System SHALL create a transaction record with unique ID
2. WHEN transaction status changes, THE System SHALL update the record with new status and timestamp
3. WHEN a user views transaction history, THE System SHALL display all ramp transactions with status, amount, and date
4. WHEN a transaction is pending, THE System SHALL show estimated completion time
5. WHEN a transaction fails, THE System SHALL display the failure reason and suggested next steps
6. WHEN a transaction completes, THE System SHALL show confirmation details including transaction hash and bank reference

### Requirement 6: Exchange Rate Display and Transparency

**User Story:** As a user, I want to see real-time exchange rates and all fees before confirming a transaction, so that I can make informed decisions about conversions.

#### Acceptance Criteria

1. WHEN a user enters an amount for conversion, THE System SHALL fetch and display the current exchange rate from MavaPay
2. WHEN displaying rates, THE System SHALL show the breakdown of MavaPay fees, network fees, and total cost
3. WHEN a quote expires, THE System SHALL automatically refresh the rate and notify the user
4. WHEN rates change significantly (>2%), THE System SHALL require user re-confirmation before proceeding
5. THE System SHALL display rates in both directions (BTC/NGN and NGN/BTC) for transparency

### Requirement 7: Minimum and Maximum Transaction Limits

**User Story:** As a user, I want to know the transaction limits before initiating a conversion, so that I don't waste time on transactions that will fail.

#### Acceptance Criteria

1. THE System SHALL enforce MavaPay's minimum off-ramp amount of 2000 NGN
2. WHEN a user enters an amount below the minimum, THE System SHALL display an error message with the minimum required
3. WHEN a user enters an amount above the maximum, THE System SHALL display an error message with the maximum allowed
4. WHEN displaying the conversion form, THE System SHALL show current minimum and maximum limits
5. IF MavaPay limits change, THEN THE System SHALL fetch updated limits from the API dynamically

### Requirement 8: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when something goes wrong, so that I can understand what happened and how to fix it.

#### Acceptance Criteria

1. IF a Lightning payment fails, THEN THE System SHALL display the failure reason and offer to retry
2. IF a bank payout fails, THEN THE System SHALL notify the user and provide MavaPay support contact information
3. IF the user's bank account is invalid, THEN THE System SHALL display validation errors before attempting payout
4. IF the MavaPay API is unavailable, THEN THE System SHALL display a maintenance message and estimated restoration time
5. IF a webhook is not received within expected time, THEN THE System SHALL poll the MavaPay API for transaction status

### Requirement 9: Webhook Event Processing

**User Story:** As a developer, I want to process MavaPay webhook events reliably, so that transaction status updates are reflected in real-time.

#### Acceptance Criteria

1. WHEN a webhook is received, THE System SHALL verify the signature matches the expected value
2. WHEN a `payment.received` event is received, THE System SHALL update the on-ramp transaction status to "NGN Received"
3. WHEN a `payment.sent` event is received, THE System SHALL update the off-ramp transaction status to "BTC Sent"
4. WHEN a payout completion event is received, THE System SHALL update the transaction status to "Completed"
5. IF webhook processing fails, THEN THE System SHALL log the error and retry processing up to 3 times
6. THE System SHALL respond to webhooks with HTTP 200 status within 5 seconds to prevent retries

### Requirement 10: Security and Compliance

**User Story:** As a user, I want my financial data and transactions to be secure, so that my funds and personal information are protected.

#### Acceptance Criteria

1. THE System SHALL store MavaPay API keys in encrypted environment variables, never in code
2. THE System SHALL transmit all API requests over HTTPS with TLS 1.2 or higher
3. THE System SHALL encrypt bank account details at rest using AES-256 encryption
4. THE System SHALL validate all user inputs to prevent injection attacks
5. THE System SHALL implement rate limiting on API endpoints to prevent abuse
6. THE System SHALL log all transaction attempts with user ID, amount, and timestamp for audit purposes
7. THE System SHALL never log sensitive data such as API keys, bank account numbers, or Lightning invoices in plain text
