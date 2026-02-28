# Post-Deployment Checklist

Use this checklist after successfully deploying to mainnet.

## Immediate Actions (Within 5 minutes)

### 1. Verify Deployment on Voyager

- [ ] Visit factory contract on Voyager
- [ ] Confirm contract is deployed and visible
- [ ] Check deployment transaction status (should be "Accepted on L2")
- [ ] Verify organization class hash is declared

**Factory URL**: https://voyager.online/contract/[FACTORY_ADDRESS]  
**Class URL**: https://voyager.online/class/[ORG_CLASS_HASH]

### 2. Save Deployment Information

The deployment script automatically saves to `deployments/mainnet_deployment.json`.

Verify this file contains:
- [ ] Factory address
- [ ] Organization class hash
- [ ] Transaction hashes
- [ ] Timestamp
- [ ] Voyager links

## Configuration Updates (Within 15 minutes)

### 3. Update Frontend Environment Variables

Edit `frontend/.env.local`:

```bash
# Find this line:
NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS=

# Replace with:
NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS=[FACTORY_ADDRESS_FROM_DEPLOYMENT]
```

**Command to update**:
```bash
# Replace [ADDRESS] with actual address
sed -i 's/NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS=.*/NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS=[ADDRESS]/' frontend/.env.local
```

### 4. Update Deployed Addresses Documentation

Edit `contract/DEPLOYED_ADDRESSES.md` and add:

```markdown
## Mainnet

### OrganizationFactory
```
[FACTORY_ADDRESS]
```

**Voyager:** https://voyager.online/contract/[FACTORY_ADDRESS]

### Organization (Class Hash)
```
[ORG_CLASS_HASH]
```

**Voyager:** https://voyager.online/class/[ORG_CLASS_HASH]

---

**Deployed:** [DATE]  
**Network:** Starknet Mainnet  
**Status:** ✅ Verified and Working
```

### 5. Update Deployment Summary

Edit `contract/MAINNET_DEPLOYMENT_SUMMARY.md`:

- [ ] Fill in contract addresses
- [ ] Fill in transaction hashes
- [ ] Update status to "Deployed"
- [ ] Add deployment timestamp
- [ ] Check all verification boxes

## Testing (Within 30 minutes)

### 6. Create Test Organization

**IMPORTANT**: Use minimal amounts for first test!

```bash
# Example with sncast
sncast invoke \
  --contract-address [FACTORY_ADDRESS] \
  --function create_organization \
  --calldata [NAME_FELT] [ADMIN_ADDRESS] [SEMAPHORE_ADDRESS] \
  --url https://rpc.starknet.lava.build \
  --account limitlxx \
  --keystore ./signer.json
```

**Or use the frontend**:
1. Switch to mainnet in wallet
2. Navigate to Organizations tab
3. Click "Create Organization"
4. Enter name and create

### 7. Test Core Functions

With the test organization:

- [ ] Add a test member (your own identity commitment)
- [ ] Deposit minimal wBTC (e.g., 0.0001 wBTC = ~$10)
- [ ] Create a small proposal (e.g., borrow $5 USDC)
- [ ] Vote on the proposal
- [ ] Execute the proposal (if quorum reached)
- [ ] Verify USDC received
- [ ] Repay the debt
- [ ] Withdraw collateral

### 8. Verify Events

Check Voyager for emitted events:
- [ ] OrganizationCreated
- [ ] MemberAdded
- [ ] CollateralDeposited
- [ ] ProposalCreated
- [ ] VoteCast
- [ ] ProposalExecuted
- [ ] DebtRepaid
- [ ] CollateralWithdrawn

## Documentation (Within 1 hour)

### 9. Update README Files

Update main `README.md`:
- [ ] Add mainnet deployment section
- [ ] Include factory address
- [ ] Add "Live on Mainnet" badge
- [ ] Update quick start guide

### 10. Create Deployment Announcement

Create `contract/MAINNET_DEPLOYMENT_ANNOUNCEMENT.md`:

```markdown
# 🎉 Mainnet Deployment Announcement

We're excited to announce that Semaphore Organization Pooling is now live on Starknet Mainnet!

## Contract Addresses

- **OrganizationFactory**: [ADDRESS]
- **Voyager**: [LINK]

## What This Means

Users can now:
- Create privacy-preserving organizations
- Pool wBTC collateral collectively
- Vote anonymously on borrowing proposals
- Borrow USDC from Vesu using pooled collateral

## Getting Started

1. Connect your wallet to Starknet Mainnet
2. Navigate to the Organizations tab
3. Create or join an organization
4. Start pooling collateral!

## Important Notes

- Start with small amounts
- Test all features thoroughly
- Report any issues immediately

## Support

- Documentation: [LINK]
- Discord: [LINK]
- GitHub Issues: [LINK]

---

**Deployed**: [DATE]  
**Network**: Starknet Mainnet  
**Status**: ✅ Live
```

### 11. Update Task List

Edit `.kiro/specs/semaphore-org-pooling/tasks.md`:

- [ ] Mark task 8 as complete
- [ ] Add deployment date
- [ ] Add deployed addresses

## Monitoring (Ongoing)

### 12. Set Up Monitoring

- [ ] Monitor factory contract for new organizations
- [ ] Track total value locked (TVL)
- [ ] Monitor for unusual activity
- [ ] Set up alerts for large transactions

### 13. User Communication

- [ ] Announce on social media
- [ ] Update website
- [ ] Notify beta users
- [ ] Create tutorial video

## Rollback Plan (If Issues Found)

If critical issues are discovered:

1. **Immediate**:
   - [ ] Update frontend to disable mainnet organizations
   - [ ] Post warning on website/social media
   - [ ] Document the issue

2. **Short-term**:
   - [ ] Fix the issue in contracts
   - [ ] Test fix thoroughly on Sepolia
   - [ ] Deploy new contracts

3. **Long-term**:
   - [ ] Migrate users to new contracts (if possible)
   - [ ] Update all documentation
   - [ ] Post-mortem analysis

## Success Criteria

Deployment is considered successful when:

- [x] Contracts deployed and verified
- [ ] Configuration updated
- [ ] Test organization created
- [ ] All core functions tested
- [ ] Documentation updated
- [ ] No critical issues found
- [ ] Users can interact with contracts

## Sign-Off

- [ ] Technical Lead: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______

---

**Created**: February 28, 2025  
**Last Updated**: [DATE]  
**Status**: Ready for Use
