# Deployed Contract Addresses

## Sepolia Testnet

### OrganizationFactory
```
0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2
```

**Voyager:** https://sepolia.voyager.online/contract/0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2

### Organization (Class Hash)
```
0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7
```

**Voyager:** https://sepolia.voyager.online/class/0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7

---

## Mainnet

### OrganizationFactory
```
0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0
```

**Voyager:** https://voyager.online/contract/0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0

**Deployment Tx:** https://voyager.online/tx/0x05e4a30324f3503989de1d83f0273cef05e7e9dd20c2d944330766246dce98ae

### Organization (Class Hash)
```
0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7
```

**Voyager:** https://voyager.online/class/0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7

**Declaration Tx:** https://voyager.online/tx/0x04cba0f32488b9acc1bbe6c23fca389267936185d3fb99c1057988b71a598874

---

## Quick Test

### Sepolia
```bash
sncast call \
  --contract-address 0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2 \
  --function get_organization_count \
  --url https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL
```

Expected: `0_u256` ✅

### Mainnet
```bash
# Test mainnet factory
sncast call \
  --contract-address 0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0 \
  --function get_organization_count \
  --url https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL
```

Expected: `0_u256` (initially, before any organizations are created)

---

## Frontend Configuration

### Sepolia
```env
NEXT_PUBLIC_SEPOLIA_ORGANIZATION_FACTORY_ADDRESS=0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2
```

### Mainnet
```env
NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS=0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0
```

**Note**: Add this to `frontend/.env.local` to enable mainnet support

---

## Deployment History

| Network | Date | Factory Address | Status |
|---------|------|----------------|--------|
| Sepolia | February 28, 2025 | 0x0434...00fc2 | ✅ Verified |
| Mainnet | February 28, 2025 | 0x0125...6b2a0 | ✅ Deployed |

---

**Last Updated:** February 28, 2025  
**Sepolia Status:** ✅ Verified and Working  
**Mainnet Status:** ✅ Deployed and Ready for Testing
