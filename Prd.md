# Product Requirements Document (PRD): NaijaShield Vault – Private BTC-to-NGN Liquidity Engine

**Version**: 1.0 (Optimized for Starknet Sepolia Testnet & Mainnet Deployment)  
**Date**: February 15, 2026  
**Author**: Grok (Tailored for Abuja-based development, emphasizing NG remittances/inflation hedge utility)  
**Project Goal**: Build a hackathon-winning prototype for Re{define} Hackathon Bitcoin track – trustless BTC collateral lending with Tongo privacy, Vesu integration for real lending pools, Autoswap SDK for post-borrow optimizations (e.g., swap USDC to STRK or other if needed), deployable to both Sepolia (testnet) and mainnet. Focus on privacy gap in BTCFi for NG users: Shield BTC holdings while borrowing NGN-equivalent liquidity.

**Track Alignment**: Bitcoin (trust-minimized Atomiq bridge + Vesu BTC collateral pools) with Privacy crossover (Tongo shielded positions + selective disclosure).  
**Winning Edge**: Mainnet-ready with real Vesu pools (wrapped BTC like WBTC/LBTC as collateral, USDC borrow); ZK proofs for hidden LTV; NG-specific ₦ rate display + compliance hooks. Differentiates from basic submissions by leveraging Vesu/Autoswap for production-like composability without redundancy.

## 1. Problem & Opportunity
- NG BTC holders (e.g., Abuja/Lagos users) use BTC for remittances/inflation protection (~1 BTC ≈ ₦95M as of Feb 15, 2026) but lack private liquidity options. Public on-chain loans expose holdings to risks.
- Starknet BTCFi (Vesu supports wrapped BTC collateral) is growing, but no privacy layer for hidden positions.
- Hack gap: Combine Atomiq trustless bridge + Vesu lending + Tongo privacy + Autoswap for efficient post-borrow (e.g., USDC → optimal stable if needed) + NG off-ramp demo.
- Opportunity: Judges reward ecosystem integrations (Vesu/Autoswap are Starknet-native); mainnet deploy shows readiness; NG angle boosts relevance.

## 2. Target User
- Primary: NG BTC holders (e.g., freelancers in Abuja holding 0.01–0.1 BTC, needing ₦1M–₦5M liquidity without selling/exposing).
- Secondary: Global privacy-focused BTCFi traders.
- Assumptions: Users have Xverse wallet for BTC/Starknet; familiar with bridging.

## 3. Core Value Proposition
Privately bridge BTC → shield wBTC collateral via Tongo → borrow USDC via Vesu pools (hidden amounts) → optional leverage loop + Autoswap optimization → simulate NGN exit. Dual-net support: Sepolia for dev/testing, mainnet for real demo txns.

## 4. Key Features & Scope (Hack-Winning MVP)
Prioritize composability: Vesu for lending (no custom vault redundancy), Autoswap for any swaps (e.g., borrow USDC → swap to STRK for yield if extended). Mainnet deploy for polish (use small real amounts; fallback Sepolia if gas/issues).

**Must-Have (Core Loop – 80% Effort)**:
1. **Wallet & Bridge Integration**:
   - Xverse connect (Starknet + BTC support).
   - Atomiq bridge: BTC → wBTC (SDK integration; fallback UI redirect to app.atomiq.exchange).
   - Net selector: Toggle Sepolia/mainnet (config via env vars; default Sepolia).

2. **Private Collateral Deposit**:
   - Shield wBTC via Tongo SDK (hidden balance; ElGamal + ZK proofs).
   - Deposit to Vesu pool: Use Vesu isolated lending pool (ERC-4626 vault standard; supports wBTC collateral per docs).

3. **Private Borrow & Leverage**:
   - Borrow USDC from Vesu pool against shielded collateral (hide borrow amount via Tongo wrapper).
   - Basic leverage loop: Borrow → Autoswap SDK to convert portion back to wBTC (if needed for re-collateral) → re-deposit shielded (1-2x limit).
   - LTV/Health checks: Use Vesu hooks; hide exact values with Tongo.

4. **Position Management**:
   - Decrypt/view private position (collateral, borrow, ₦ equivalent via mock oracle ~₦95M/BTC).
   - Selective disclosure: Tongo viewing keys for compliance (e.g., share "collateral > threshold" proof without full reveal).

5. **NGN Exit Demo**:
   - Withdraw shielded USDC via Tongo/Vesu.
   - Simulate off-ramp: UI note + video demo "Swap USDC → NGN via Binance P2P/Local ramps" (no on-chain cNGN; Autoswap for any pre-off-ramp optimization).

**Nice-to-Have (If Time – 20% Effort)**:
- Garaga ZK verifier: Proof of solvency (collateral sufficient) without revealing amounts – integrates with Vesu oracles.
- Autoswap extension: Post-borrow auto-swap USDC → STRK for yield (demo composability).

**Out-of-Scope**:
- Full native BTC bridge (Atomiq suffices; no LayerSwap redundancy).
- Direct cNGN on-chain (off-ramp sim only).
- Advanced OP_CAT (narrative mention only).

## 5. Tech Stack (Optimized, No Redundancy)
- **Frontend**: Next.js/React + shadcn/ui + Xverse connect (from v0.dev skeleton).
- **Starknet Lib**: starknet.js (latest; handle Sepolia/mainnet via providers: e.g., Infura Sepolia, mainnet RPC).
- **Bridge**: Atomiq SDK (trustless BTC → wBTC; mainnet live).
- **Lending**: Vesu SDK/docs (isolated pools; query pools via API, deposit/borrow calls; supports mainnet/Sepolia).
- **Swaps/Optimization**: Autoswap SDK (GitHub lib; aggregator for DEX swaps like Ekubo/JediSwap; use for leverage re-collateral or post-borrow; no Ekubo redundancy – Autoswap wraps them).
- **Privacy**: Tongo SDK (@fatsolutions/tongo-sdk; wrap Vesu deposits/borrows for shielding).
- **Oracle**: Vesu built-in (prices); mock ₦ rate (hardcode or CoinGecko proxy if needed, but no tool call here).
- **Deployment**: Scarb for Cairo contracts (if any Vesu wrappers needed); deploy to Sepolia first, then mainnet (use STRK faucet for Sepolia; small real STRK for mainnet demo).
- **Config**: Env vars for nets (e.g., `process.env.STARKNET_NETWORK = 'mainnet' | 'sepolia'`; Vesu pool addresses differ per net).

## 6. Non-Functional Requirements
- **Networks**: Dual support – Sepolia for testing (faucets for wBTC/USDC); mainnet for demo (real pools, small txns to show live privacy).
- **Security**: Leverage Vesu audits; Tongo ZK for privacy; no custom crypto.
- **UX**: Responsive dashboard (from v0 prompt); ₦ displays for NG users (e.g., "Borrow ~₦2M equivalent").
- **Performance**: Testnet for quick iterations; mainnet tx confirmations in video.
- **Demo Video**: 3 min – Abuja user flow: Bridge via Atomiq/Xverse → shield/deposit Vesu → private borrow/loop via Autoswap → NGN sim.
- **Repo**: Clean structure; README with Sepolia/mainnet setup, deploy scripts.

## 7. Success Metrics for Hack
- **Winning Criteria**: Deployed mainnet Vesu integration (real shielded borrow tx); Autoswap for composability edge; privacy demo with hidden explorer views; strong NG pitch (remittances for Abuja/Lagos).
- **Submission**: DoraHacks – repo, video, mainnet links (e.g., explorer tx for shielded deposit).
- **Risks**: Vesu pool availability (check mainnet BTC pools); Autoswap SDK stability (test on Sepolia first).
- **Odds**: With mainnet + Vesu/Autoswap + Tongo, ~15–25% for top Bitcoin if polished (better than basic; still needs flawless execution in 13 days).

This PRD maximizes winning potential by leaning on Vesu for battle-tested lending (no custom redundancy) and Autoswap for DEX efficiency – build Sepolia prototype first, mirror to mainnet. If issues with Autoswap, fallback to direct Ekubo but avoid. Ship fast.