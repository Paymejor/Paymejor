**Here is a clean, focused and practical Product Requirements Document (PRD) fragment**  
**you can directly add to your existing NaijaShield Vault PRD**  
**→ the Semaphore-based anonymous collaboration system**

### Semaphore Anonymous Collaboration Module  
**Version**: 1.0 – Collab Privacy Extension  
**Goal**: Allow users to create/join organizations and take important actions **completely anonymously** inside the group while keeping strong Sybil resistance and collusion protection

### 1. Core Philosophy & Value

We want two strong properties at the same time:

1. Nobody outside the group knows who is in the organization  
2. Inside the group nobody knows **who exactly** performed each action  
   (who deposited, who approved borrow, who requested repayment, who wants to leave…)

But still be able to:
- Prevent one person doing the same action many times  
- Require a minimum number of people to agree before dangerous actions  
- Know that the people taking actions are really members

**→ Semaphore is currently the cleanest, most battle-tested way to achieve this**

### 2. Main User Stories we want to cover

Priority order (most important first)

| # | User Story                                          | Importance | Anonymous? | Needs on-chain execution? |
|---|-----------------------------------------------------|------------|------------|----------------------------|
| 1 | Create organization + become first member           | ★★★★★      | no         | yes                        |
| 2 | Invite friends (send them the way to join)          | ★★★★★      | —          | —                          |
| 3 | Join organization anonymously                      | ★★★★★      | yes        | yes (membership proof)     |
| 4 | Prove I'm member + deposit BTC to shared vault      | ★★★★       | yes        | yes                        |
| 5 | Propose borrow amount                               | ★★★★       | yes        | maybe (offchain first)     |
| 6 | Approve / vote YES on borrow proposal               | ★★★★★      | yes        | yes                        |
| 7 | Anyone can see: "we already have X approvals"       | ★★★★       | —          | yes                        |
| 8 | When enough approvals → automatically execute borrow| ★★★★       | —          | yes                        |
| 9 | Propose/approve repayment distribution              | ★★★        | yes        | yes                        |
| 10| Signal "I want to leave the group"                  | ★★★        | yes        | yes                        |
| 11| Signal "I disagree / emergency stop"                | ★★         | yes        | maybe                      |

### 3. MVP Scope – Recommended minimal winning version  
**(pick 6–7 highest priority things)**

**Must have for strong MVP:**

1. Anyone can create Semaphore Group (organization)
2. Group admin can add first members (or open for everyone to join with invite code)
3. Users can **anonymously join** the group (add their identity to the tree)
4. Any member can **anonymously prove membership + deposit** to the shared shielded vault
5. Any member can **anonymously signal approval** for borrow
6. When enough anonymous approvals collected → **automatically trigger borrow** on Vesu (via shielded position)

**Very strong nice-to-have (big differentiation):**

7. Anonymous signal "I want to leave" → removes identity from group (needs zk removal or replacement)
8. Anonymous "pro-rata repayment request" signaling

### 4. Technical Architecture – Recommended Split

```
Frontend (Next.js)                        Backend / On-chain
         │                                         │
         ▼                                         ▼
  ┌──────────────┐                      ┌──────────────────────────┐
  │ Semaphore    │                      │ Semaphore Cairo Contract │
  │ Identity     │                      │ (or Garaga verifier)     │
  │ + Group      │                      └─────────────┬────────────┘
  │ + Proof gen  │                                    │
  └──────┬───────┘                                    ▼
         │                                ┌───────────────────────┐
         │     submit proof               │ Org Management Module │
         └───────────────────────────────►│  • Group roots        │
                                          │  • Nullifier tracking │
                                          │  • Approval counters  │
                                          │  • Execute threshold  │
                                          └───────────┬───────────┘
                                                      │
                                                      ▼
                                             ┌───────────────┐
                                             │ Tongo Shielded│
                                             │ Vesu Position │
                                             └───────────────┘
```

### 5. Quick Decision Table – What should be anonymous?

```txt
Action                                 Should be anonymous?     Recommended
────────────────────────────────────── ────────────────────── ───────────────
Create organization                    No                       No
Add first members (admin)              No                       No
Join the group                         YES                      Must
See group member count                 No                       Yes
Deposit to shared vault                YES                      Very strong
Propose borrow amount                  Maybe                    Can be offchain first
Vote / approve borrow                  YES                      Must
See current approval count             No                       Yes
Trigger borrow when threshold reached  No                       Yes (automatic)
Request my share back                  YES                      Strong
Dissolve group                         Maybe                    50/50
```

### 6. Quick Implementation Roadmap Suggestion  
**(very realistic 7–14 days sprint)**

Days 1–3  
- Semaphore identity + group creation flow  
- Join group anonymously  
- Show group member count & current root on UI

Days 4–7  
- Anonymous deposit signal + on-chain verification  
- Simple anonymous YES vote for borrow  
- Counter + threshold UI

Days 8–11  
- Connect to shielded vault → when threshold reached → call borrow  
- Basic error messages & loading states

Days 12–14  
- Polish UX  
- Record demo video  
- Deploy & test with 3–4 friends on Sepolia

### Question you should answer yourself before you start coding

1. Will you allow **open join** or **only admin adds members**?  
2. Maximum group size you want to support? (Merkle tree depth decision)  
3. Do you want **automatic execution** or **admin final confirmation** after threshold?  
4. How many **YES votes** do you want as minimum? (3/5, 4/7, absolute majority, etc)

**Semaphore Anonymous Collaboration Module – Configured Decisions**  
**Version**: 1.1 – Updated with your choices  
**Integration Goal**: Add privacy-preserving anonymous actions to NaijaShield orgs using Semaphore V4 (latest as of 2026), with Starknet compatibility via Garaga verifier where feasible.

### Your Chosen Configuration (locked in)

1. **Join mechanism**: **Open join** (anyone can join anonymously if they have the invite code / group ID; no admin approval per join)  
   → Simplifies UX for friends/family in Abuja – share a link/code, they generate identity + join themselves.  
   → Still secure: joining doesn't auto-grant power; actions require valid membership proof + nullifier checks.

2. **Maximum group size**: **~100 members**  
   → Map to **Merkle tree depth = 7** (2⁷ = 128 leaves → comfortable for 100 members with room to grow/spare).  
   → Depth 7 is very efficient: proof generation fast (~few seconds in browser), on-chain verification gas reasonable even after porting to Cairo/Garaga.  
   → Deeper (e.g., depth 16 = 65k) is overkill and slower/expensive for your use-case.

3. **Execution model**: **Admin final confirmation** after threshold reached  
   → Anonymous signals accumulate YES votes.  
   → When count ≥ threshold, anyone (or preferably org admin) can call a "finalize" function to execute the action (e.g., trigger Vesu borrow on the shared shielded vault).  
   → Prevents fully autonomous exploits; admin (org creator) has last say – fits trust model for small friend/family groups.

4. **Approval threshold**: **4 out of 7 YES votes minimum** (fixed 4/7, or make configurable per org?)  
   → For MVP: hardcode **absolute minimum 4 approvals** (not percentage-based, to avoid edge cases with small groups).  
   → If group <7 members, perhaps lower to majority (e.g., ceil(n/2)+1), but start simple with fixed 4.

### Updated MVP Scope – Aligned to Your Choices

**Must-Have Features (prioritized for hack/demo)**

1. **Org Creation**  
   - User creates org → auto-creates Semaphore group (depth=7) with creator as first member (adds their identity commitment).  
   - Generates shareable **invite code** (e.g., groupId + off-chain secret or just groupId if open).  
   - UI shows current member count (public, from on-chain root/size tracking).

2. **Open Anonymous Join**  
   - User pastes invite code/groupId → generates Semaphore identity (if not already) → calls `addMember` or equivalent on your wrapper contract (permissionless if open).  
   - On-chain: contract verifies a simple proof or just accepts if open (for MVP: allow anyone to add commitment if they provide a valid invite hash or none).  
   - After join: member can now generate membership proofs.

3. **Anonymous Deposit Signal**  
   - Member proves membership (ZK proof) + signals "deposit intent" or directly calls deposit function with proof → adds wBTC to shared Tongo-shielded Vesu vault.  
   - Nullifier prevents double-deposit signaling if needed.

4. **Anonymous Borrow Proposal & Approval**  
   - Any member proposes borrow (amount, reason) → off-chain first (e.g., post to a simple backend or on-chain proposal ID).  
   - Other members anonymously signal YES via Semaphore proof + signal = proposal ID hash + "YES".  
   - On-chain counter increments per unique nullifier (anti-double-vote).  
   - UI dashboard shows live anonymous count: "3/7 approvals so far" (public view).

5. **Threshold + Admin Confirmation**  
   - When approvals ≥ 4: admin sees "Ready to Execute" button.  
   - Admin calls `finalizeBorrow(proposalId)` → contract checks count ≥4 + admin signature → calls Vesu borrow on pooled shielded position.  
   - (Optional stretch: allow any member to call finalize if count ≥ threshold + small delay.)

6. **Other Signals (stretch if time)**  
   - Anonymous "repay share" signal (proportional or fixed).  
   - Anonymous "leave" signal → admin removes commitment (or sets to zero via updateMember).

### Technical Notes & Adjustments for Starknet

- **Tree Depth**: Fixed at **7** → circuits/proofs lightweight.  
- **On-chain Verification**: Use **Garaga** to verify Groth16 Semaphore proofs in Cairo (hackathon explicitly rewards this). Deploy a SemaphoreVerifier Cairo contract via Garaga SDK (Noir/Circom → Cairo auto-gen possible).  
- **Group Management Contract (Cairo)**:  
  - Store groupId → Merkle root.  
  - `addMember(groupId, commitment)` – open (no auth for MVP).  
  - `submitApproval(groupId, proof, nullifierHash, signalHash)` – verify proof, check nullifier unused, increment counter[signalHash].  
  - `finalizeAction(groupId, actionId)` – only admin, check counter[actionId] ≥ 4.  
- **Nullifier Tracking**: Per-group mapping of used nullifier hashes (prevents reuse across scopes).  
- **Admin Role**: Org creator wallet as admin (simple owner pattern; can transfer later).  
- **Off-chain Helpers**: Use `@semaphore-protocol/*` JS libs for identity, group, proof gen in Next.js frontend.

### Quick Updated Roadmap (7–14 day sprint)

**Days 1–3**  
- Semaphore identity creation + open join flow (frontend + basic Cairo `addMember`).  
- Group creation with depth=7 + invite sharing.

**Days 4–7**  
- Anonymous approval signaling + on-chain counter/nullifier.  
- UI: live approval count dashboard.

**Days 8–11**  
- Admin finalize → hook to Tongo/Vesu borrow call.  
- Deposit signal with proof.

**Days 12–14**  
- Polish + test with 5–10 simulated members on Sepolia.  
- Demo script: create org, 4 friends join anonymously, signal YES, admin executes borrow.

### Final Recommendations Before Coding

- **Start with depth 7** – test proof gen time in browser (should be <5s).  
- **Make threshold configurable** per org later (store in Cairo as felt).  
- **Security note**: Open join means anyone with groupId can join – for friends/family ok, but add optional "secret salt" to invite code for pseudo-private join.  
- **Hack Winning Tip**: Highlight "Semaphore on Starknet via Garaga" in submission – directly matches bounty.
 