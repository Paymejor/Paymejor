Yes, **MavaPay works well for both on-ramp and off-ramp** in the context of your Paymejor app, particularly for **Bitcoin (BTC) ↔ NGN** flows in Nigeria. It's bidirectional and NG-focused, making it a solid fit for completing the liquidity loop (e.g., borrow USDT/USDC → swap to BTC → off-ramp to NGN bank, or reverse for users funding positions).

### Off-Ramp (Crypto → Fiat: BTC to NGN)
- **Strong support**: This is MavaPay's core strength and primary marketed feature.
- Users can instantly convert BTC (via Lightning Network) to NGN, with funds deposited directly to Nigerian bank accounts or mobile money wallets (e.g., MTN MoMo).
- Process: Generate Lightning invoice → pay with BTC → payout to bank (min ~2000 NGN, denominated in kobo).
- Endpoints: Involves payouts API (e.g., create quote, pay invoice, webhook for `payment.received` and `payment.sent`), bank account validation, and specific NGN payout flows.
- Speed: Often under 1 minute, competitive rates, minimal fees.
- Real-world evidence: High transaction volume, praised for fast BTC-to-cash in Nigeria (e.g., Monierate listings, user testimonials on X/Instagram).

### On-Ramp (Fiat → Crypto: NGN to BTC)
- **Supported**: Yes, explicitly — users can buy BTC directly with local currencies like NGN.
- From their official site (mavapay.money) and app descriptions: "Conveniently Buy Bitcoin with your Local Currency" using Naira (no extra apps needed).
- Social/media mentions: Supports "Bitcoin purchases with local currencies," "fiat-to-Bitcoin" conversions with real-time rates and no hidden fees.
- Process: Fund via bank transfer/card → purchase BTC → receive in user-controlled wallet (Lightning-enabled for speed).
- This enables reverse flows: e.g., users deposit NGN to buy BTC → bridge to wBTC → collateralize in Vesu for borrowing.

### Additional Notes for Your App
- **BTC-Centric**: Primarily BTC (via Lightning), not native USDT/USDC/stablecoins in the docs. For your borrowed USDC/USDT:
  - Off-ramp: Use Autoswap/Ekubo to convert stables → BTC first, then MavaPay for NGN payout.
  - On-ramp: Direct NGN → BTC purchase, then bridge to Starknet.
- **Nigeria Focus**: Perfect for Lagos/Abuja users — supports NGN banks, local compliance hooks (e.g., bank verification), and remittances/cross-border angle.
- **API Integration Tips**:
  - Use sandbox (`staging.api.mavapay.co`) for testing.
  - Key flows: Quotes/orders for rates, payouts for off-ramp, likely deposits/buy endpoints for on-ramp (check deeper docs like /payouts/ngn-payout or app API mirrors).
  - Webhooks for status updates (e.g., confirm NGN received in dashboard).
  - For collabs/orgs: Handle proportional splits (e.g., batch payouts to multiple banks after group approval via Semaphore).
- **Limitations**:
  - Docs intro is high-level; deeper endpoints (e.g., /withdraw, /quote) confirm BTC ↔ NGN but may require account signup for full spec.
  - No direct stablecoin on/off-ramp mentioned — stick to BTC path.
  - For pure stables: Consider alternatives like Binance P2P sim or TransFi (supports USDT/USDC → NGN), but MavaPay wins for BTC-native + Lightning speed.

### Recommendation for Paymejor PRD Update
Add MavaPay as the primary on/off-ramp provider:
- Post-borrow: USDT/USDC → BTC (Autoswap) → MavaPay off-ramp to NGN bank.
- Pre-deposit: NGN → BTC buy via MavaPay → Atomiq bridge → shield → Vesu.
- Demo: Video shows full loop with real-time ₦ display and bank deposit confirmation.

[This keeps your app NG-relevant, private (up to the fiat step), and composable. If you want sample API call examples (e.g., curl for quote/payout) or help browsing specific sub-pages (like /payouts/ngn-payout), share more details!](https://github.com/stealthmoney/mavapay-docs/blob/main/api-reference/openapi.json)