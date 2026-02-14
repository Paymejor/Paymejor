**Updated MVP for Private NGN Liquidity Vault (PayMejor)** incorporating **Atomiq** for the BTC bridge and **Xverse wallet** integration.

This upgrade makes your MVP more competitive for the Re{define} Hackathon Bitcoin track: Atomiq provides a **trustless, zero-slippage BTC → wBTC swap** directly to Starknet (using on-chain escrows + Bitcoin PoW light client verification — no custodians, aligns perfectly with "trust-minimized" narrative). Xverse is the leading Bitcoin wallet with native Starknet support, in-app bridging/swaps, and seamless BTC/Starknet asset management — ideal for your Lagos/BTC holder persona.

**Why these fit (no redundancy)**:
- Atomiq replaces simulated/generic bridge: It's live, trustless, supports native BTC → wBTC on Starknet (confirmed via Starknet blog, Braavos/Atomiq integration, and ecosystem mentions).
- Xverse replaces Argent/Braavos as primary wallet: BTC-native users (your target) already use it; it supports Starknet connect, BTC → Starknet swaps/bridging (via StarkGate or partners like Atomiq), and holds bridged assets.
- No overlap: Use Atomiq for the BTC inbound step → Xverse for user wallet/connect → Tongo for privacy on Starknet side.
- Still MVP-focused: Simulate full Atomiq swap if SDK integration is too heavy (many hacks demo via app.atomiq.exchange UI in video); aim for wallet connect + manual bridge step.

**Revised Core MVP Scope**
- **User Flow (End-to-End Demo)**:
  1. Connect Xverse wallet (Starknet address + BTC support).
  2. Bridge BTC → wBTC on Starknet via Atomiq (in-app or redirect to app.atomiq.exchange; demo connect BTC wallet in Xverse → swap to wBTC).
  3. Deposit wBTC as collateral → shield privately via Tongo (hidden balance).
  4. Privately borrow USDC (shielded amount) + basic leverage loop (re-deposit shielded).
  5. View decrypted private position in UI.
  6. Simulate NGN exit (USDC withdraw → P2P off-ramp note in video, e.g., "Convert to NGN via Binance/Local ramps").
- **Privacy Win**: Collateral value + borrow amount hidden on-chain (Tongo ElGamal/ZK); only owner decrypts.
- **NG Pitch**: "Lagos BTC holders bridge privately via Atomiq/Xverse → unlock hidden NGN liquidity without exposing stack."

**Updated Tech Stack (Prioritized, No Redundancy)**
- **Wallet**: Xverse (primary connect; supports Starknet + BTC bridging/swaps).
- **BTC Bridge**: Atomiq (trustless BTC → wBTC; app.atomiq.exchange or @atomiqlabs/sdk if you integrate TS SDK for seamless flow — check npm for Starknet chain support).
- **Privacy**: Tongo SDK (@fatsolutions/tongo-sdk) — shield wBTC deposit + USDC borrow.
- **Starknet Lib**: starknet.js (latest compatible with Tongo/Xverse).
- **Frontend**: Next.js/React + Xverse connect (use their SDK/docs for integration; similar to Argent but BTC-focused).
- **Lending Vault**: Custom minimal Cairo contract (deposit wBTC → shield via Tongo call → borrow USDC shielded; mock oracle for LTV/BTC price).
- **Skip**: LayerSwap/Garden (redundant with Atomiq), Garaga (time sink), full Vesu (custom vault faster for MVP).

**Updated Build Plan (Tight Timeline – ~2 Weeks Left)**
1. **Days 1-2: Setup & Wallet/Bridge Basics**
   - Repo + Next.js init.
   - Install: `@fatsolutions/tongo-sdk`, `starknet`, Xverse SDK/connect lib (check xverse.app/dev or GitHub for Starknet integration).
   - Implement Xverse connect button (get Starknet account).
   - Bridge step: Button → redirect/open Atomiq app (https://app.atomiq.exchange/) with Starknet destination pre-selected → user swaps BTC → wBTC (demo in video: "Connect Xverse BTC wallet → swap to wBTC on Starknet").
   - Test: Mint/test wBTC on Sepolia if faucet available (or assume bridged).

2. **Days 3-6: Tongo + Shielded Deposit**
   - Follow Tongo quick-start: Create TongoAccount (from Xverse Starknet signer if possible; fallback private key for test).
   - Fund shielded: Deposit wBTC (ERC20 approve + Tongo fund op) → hide balance.
   - UI: Show tx → decrypt/display private collateral value.

3. **Days 7-10: Cairo Vault + Borrow/Loop**
   - Cairo: Simple vault contract — deposit (call Tongo fund), borrow (shielded transfer USDC from vault pool), loop (borrow → fund more shielded collateral).
   - Mock USDC pool (faucet or simple mint).
   - Interact via starknet.js + Tongo wrapper.
   - Test end-to-end: Deposit shielded → borrow shielded → loop 1x.

4. **Days 11-13: Polish & NGN Demo**
   - UI: Clean steps, privacy highlights ("Hidden on-chain"), position decrypt button.
   - Video: Lagos story — "Use Xverse + Atomiq to bridge BTC privately → shield in vault → borrow USDC → get NGN liquidity without exposure."
   - README: Include Atomiq bridge link, Xverse download, testnet addresses.

5. **Day 14: Submit**
   - DoraHacks: Emphasize Atomiq trustless bridge + Xverse BTC integration + Tongo privacy + NG remittances angle.

**Hard Reality Check**
- Atomiq SDK integration might take time (npm @atomiqlabs/sdk supports Starknet); fallback to UI redirect/demo for MVP — judges accept simulated bridges if story clear.
- Xverse connect should be straightforward (similar to other wallets); test on testnet.
- If bridge step fails: Use testnet wBTC faucet + note "In production: Atomiq via Xverse."
- This nails BTCFi + privacy + local utility — stronger than generic wrappers.

If you hit snags (e.g., Atomiq SDK code example needed or Xverse connect snippet), share what you're stuck on. Build the bridge/wallet part first — that's your differentiator. Time is critical — ship the demo. 🚀