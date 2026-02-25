# PayMejor Documentation Index

This document provides an overview of all documentation available for the PayMejor project.

## 📚 Documentation Overview

### Getting Started

1. **[README.md](./README.md)** - Main project documentation
   - Quick start guide
   - Architecture overview
   - Development instructions
   - Basic troubleshooting

### Environment Configuration

2. **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Comprehensive environment guide
   - Environment variables reference
   - Network-specific configuration (Sepolia + Mainnet)
   - RPC endpoints setup
   - Contract addresses guide
   - Troubleshooting environment issues

3. **[ENVIRONMENT_CONFIGURATION.md](./ENVIRONMENT_CONFIGURATION.md)** - MavaPay environment configuration
   - MavaPay environment variables
   - Sandbox vs production configuration
   - Feature flag usage
   - Automatic environment detection
   - Security considerations
   - Deployment configurations

4. **[.env.example](./.env.example)** - Environment variables template
   - All required and optional variables
   - Inline documentation
   - Example values

5. **[CONTRACT_ADDRESSES.md](./CONTRACT_ADDRESSES.md)** - Contract addresses reference
   - How to find contract addresses
   - Sepolia testnet addresses
   - Mainnet addresses
   - Verification instructions
   - Address update procedures

### Deployment

6. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
   - Prerequisites and preparation
   - Vercel configuration
   - Environment variables setup
   - Deployment steps (Dashboard + CLI)
   - Post-deployment verification
   - Rollback procedures
   - Monitoring and maintenance

6. **[DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md)** - Quick deployment reference
   - Condensed deployment steps
   - Quick reference for common tasks
   - Essential commands

7. **[vercel.json](./vercel.json)** - Vercel configuration file
   - Build settings
   - Security headers
   - Routing configuration

8. **[vercel-env-template.txt](./vercel-env-template.txt)** - Vercel environment template
   - Ready-to-import environment variables
   - Verification checklist
   - Import instructions

### Feature Documentation

9. **[NETWORK_CONFIGURATION.md](./NETWORK_CONFIGURATION.md)** - Network switching guide
   - Dual network support (Sepolia + Mainnet)
   - Network selector implementation
   - Network-aware components

10. **[NETWORK_SWITCHING.md](./NETWORK_SWITCHING.md)** - Network switching details
    - How network switching works
    - State management
    - Contract address updates

11. **[TRANSACTION_MANAGEMENT.md](./TRANSACTION_MANAGEMENT.md)** - Transaction handling
    - Transaction state management
    - Error handling
    - Retry logic
    - Transaction history

12. **[CACHING.md](./CACHING.md)** - Caching strategy
    - Data caching implementation
    - Cache invalidation
    - Performance optimization

13. **[SECURITY.md](./SECURITY.md)** - Security implementation
    - Input validation
    - Security best practices
    - Error handling
    - Rate limiting

14. **[SECURITY_IMPLEMENTATION_SUMMARY.md](./SECURITY_IMPLEMENTATION_SUMMARY.md)** - Security summary
    - Implemented security features
    - Security checklist
    - Validation examples

15. **[SWAP_INTEGRATION.md](./SWAP_INTEGRATION.md)** - AVNU swap integration (CURRENT)
    - Real-time quotes from all DEXs
    - Gasless transactions via Paymaster
    - Security validations
    - Usage examples
    - Complete implementation guide

16. **[AUTOSWAP_INTEGRATION.md](./AUTOSWAP_INTEGRATION.md)** - AutoSwappr DEX integration (DEPRECATED)
    - Direct user swap architecture
    - Implementation guide
    - Security model
    - Leverage loop integration
    - Error handling
    - Testing strategy
    - **Note**: Replaced by SWAP_ROUTER_INTEGRATION.md

16. **[AUTOSWAP_QUICK_REFERENCE.md](./AUTOSWAP_QUICK_REFERENCE.md)** - AutoSwappr quick reference (DEPRECATED)
    - Basic usage examples
    - Common patterns
    - Troubleshooting guide
    - Quick lookup table
    - **Note**: Replaced by SWAP_INTEGRATION.md

17. **[SWAP_ROUTER_INTEGRATION.md](./SWAP_ROUTER_INTEGRATION.md)** - Multi-provider swap routing (DEPRECATED)
    - AVNU + AutoSwappr integration
    - Paymaster (gasless transactions)
    - Automatic fallback
    - Provider comparison
    - Migration guide
    - **Note**: Replaced by SWAP_INTEGRATION.md (AVNU only)

18. **[SWAP_ROUTER_IMPLEMENTATION_SUMMARY.md](./SWAP_ROUTER_IMPLEMENTATION_SUMMARY.md)** - Swap router summary (DEPRECATED)
    - Implementation overview
    - Key improvements
    - Migration guide
    - Deployment checklist
    - **Note**: Replaced by SWAP_INTEGRATION.md

### MavaPay Integration (BTC ↔ NGN On/Off-Ramp)

19. **[MAVAPAY_DOCUMENTATION_SUMMARY.md](./MAVAPAY_DOCUMENTATION_SUMMARY.md)** - Documentation overview
    - Complete documentation structure
    - Quick start guides for users and developers
    - Documentation maintenance guidelines
    - Code documentation standards
    - Contributing guidelines

20. **[MAVAPAY_USER_GUIDE.md](./MAVAPAY_USER_GUIDE.md)** - Complete user guide
    - Getting started with on/off-ramp
    - Step-by-step instructions for off-ramp (Crypto → Naira)
    - Step-by-step instructions for on-ramp (Naira → Crypto)
    - Managing bank accounts
    - Transaction history and tracking
    - Understanding fees and rates
    - Transaction limits
    - Common questions and answers
    - Tips for best experience

21. **[MAVAPAY_API_REFERENCE.md](./MAVAPAY_API_REFERENCE.md)** - API endpoint documentation
    - Complete API endpoint reference
    - Request/response formats
    - Data models and types
    - Error handling and codes
    - Rate limiting information
    - Security and authentication
    - Testing with sandbox environment

22. **[MAVAPAY_TROUBLESHOOTING.md](./MAVAPAY_TROUBLESHOOTING.md)** - Troubleshooting guide
    - Quick diagnostics
    - Off-ramp issue resolution
    - On-ramp issue resolution
    - Bank account problems
    - Transaction issues
    - Quote and rate problems
    - API and network issues
    - Security issues
    - Getting help and support

23. **[MAVAPAY_SETUP.md](./MAVAPAY_SETUP.md)** - MavaPay integration guide
    - MavaPay API setup
    - Environment configuration
    - Feature implementation
    - Testing guide

24. **[ENVIRONMENT_CONFIGURATION.md](./ENVIRONMENT_CONFIGURATION.md)** - Environment configuration
    - MavaPay environment variables
    - Sandbox vs production
    - Feature flags
    - Security considerations

25. **[RAMP_ERROR_HANDLING.md](./RAMP_ERROR_HANDLING.md)** - Error handling
    - Error types and handling
    - User feedback
    - Retry logic
    - Maintenance messages

26. **[RAMP_SECURITY.md](./RAMP_SECURITY.md)** - Security implementation
    - Input validation
    - Rate limiting
    - Audit logging
    - Sensitive data protection

27. **[QUOTE_EXPIRATION_IMPLEMENTATION.md](./QUOTE_EXPIRATION_IMPLEMENTATION.md)** - Quote expiration
    - Auto-refresh logic
    - Rate change detection
    - User re-confirmation

28. **[ATOMIQ_INTEGRATION_SUMMARY.md](./ATOMIQ_INTEGRATION_SUMMARY.md)** - Atomiq bridge integration
    - BTC bridging to Starknet
    - Integration with on-ramp flow
    - Testing guide

29. **[TASK_18_IMPLEMENTATION_SUMMARY.md](./TASK_18_IMPLEMENTATION_SUMMARY.md)** - Error handling summary
    - Implementation overview
    - Components created
    - Testing results

30. **[TASK_22_SECURITY_IMPLEMENTATION.md](./TASK_22_SECURITY_IMPLEMENTATION.md)** - Security implementation summary
    - Security features
    - Implementation details
    - Testing results

31. **[TASK_23_IMPLEMENTATION_SUMMARY.md](./TASK_23_IMPLEMENTATION_SUMMARY.md)** - Environment configuration summary
    - Environment setup
    - Feature flags
    - Helper functions
    - Verification results

### Scripts

31. **[scripts/pre-deployment-check.sh](./scripts/pre-deployment-check.sh)** - Pre-deployment verification
    - Automated checks before deployment
    - Dependency verification
    - Build validation
    - Environment validation

32. **[scripts/deployment-checklist.sh](./scripts/deployment-checklist.sh)** - Post-deployment verification
    - Automated deployment verification
    - Site accessibility checks
    - Performance checks
    - Security header validation

---

## 📖 Documentation by Use Case

### I want to set up the project locally

1. Read [README.md](./README.md) - Quick Start section
2. Follow [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - Setup Instructions for Sepolia
3. Copy `.env.example` to `.env.local` and configure
4. Run `pnpm install && pnpm dev`

### I want to deploy to production

1. Read [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) for overview
2. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps
3. Use [vercel-env-template.txt](./vercel-env-template.txt) for environment variables
4. Run `./scripts/pre-deployment-check.sh` before deploying
5. Deploy via Vercel Dashboard or CLI
6. Run `./scripts/deployment-checklist.sh` after deployment

### I need to find contract addresses

1. Read [CONTRACT_ADDRESSES.md](./CONTRACT_ADDRESSES.md)
2. Follow "How to Find Addresses" section
3. Verify addresses on Voyager explorer
4. Update `.env.local` or Vercel environment variables

### I want to understand network switching

1. Read [NETWORK_CONFIGURATION.md](./NETWORK_CONFIGURATION.md)
2. Review [NETWORK_SWITCHING.md](./NETWORK_SWITCHING.md)
3. Check implementation in `hooks/useNetwork.ts`

### I need to troubleshoot issues

1. Check [README.md](./README.md) - Troubleshooting section
2. Review [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - Troubleshooting section
3. Check [DEPLOYMENT.md](./DEPLOYMENT.md) - Troubleshooting Deployment Issues
4. Review specific feature documentation (Transaction Management, Security, etc.)

### I want to understand security implementation

1. Read [SECURITY.md](./SECURITY.md)
2. Review [SECURITY_IMPLEMENTATION_SUMMARY.md](./SECURITY_IMPLEMENTATION_SUMMARY.md)
3. Check implementation in `lib/security-validation.ts`

### I want to integrate token swaps

1. Read [SWAP_INTEGRATION.md](./SWAP_INTEGRATION.md) for complete guide
2. Check implementation in `hooks/useSwapRouter.ts`
3. Learn about AVNU Paymaster for gasless transactions
4. Review security validations

### I want to integrate AutoSwappr for token swaps (DEPRECATED)

**DEPRECATED**: Use SWAP_INTEGRATION instead

1. Read [SWAP_INTEGRATION.md](./SWAP_INTEGRATION.md) for current implementation
2. Uses AVNU SDK v4 with better quotes and gasless support
3. Check implementation in `hooks/useSwapRouter.ts`

### I want to integrate swap routing (AVNU + AutoSwappr) (DEPRECATED)

**DEPRECATED**: Now using AVNU only

1. Read [SWAP_INTEGRATION.md](./SWAP_INTEGRATION.md) for current implementation
2. AVNU provides better quotes and gasless transactions
3. No need for fallback providers

### I want to configure MavaPay on/off-ramp

1. **Start Here**: Read [MAVAPAY_DOCUMENTATION_SUMMARY.md](./MAVAPAY_DOCUMENTATION_SUMMARY.md) for complete overview
2. **User Guide**: Read [MAVAPAY_USER_GUIDE.md](./MAVAPAY_USER_GUIDE.md) for end-user instructions
3. **Setup**: Follow [MAVAPAY_SETUP.md](./MAVAPAY_SETUP.md) for integration setup
4. **API Reference**: Check [MAVAPAY_API_REFERENCE.md](./MAVAPAY_API_REFERENCE.md) for API details
5. **Troubleshooting**: Review [MAVAPAY_TROUBLESHOOTING.md](./MAVAPAY_TROUBLESHOOTING.md) for common issues
6. **Environment**: Review [ENVIRONMENT_CONFIGURATION.md](./ENVIRONMENT_CONFIGURATION.md) for environment setup
7. **Security**: Check [RAMP_SECURITY.md](./RAMP_SECURITY.md) for security implementation
8. **Error Handling**: Review [RAMP_ERROR_HANDLING.md](./RAMP_ERROR_HANDLING.md) for error handling
9. **Testing**: Test with sandbox environment first

---

## 🔍 Quick Reference

### Essential Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run pre-deployment checks
./scripts/pre-deployment-check.sh

# Deploy to Vercel
vercel --prod

# Verify deployment
./scripts/deployment-checklist.sh https://your-app.vercel.app
```

### Essential Files

- **Environment**: `.env.local` (copy from `.env.example`)
- **Configuration**: `vercel.json`
- **Network Config**: `lib/constants.ts`
- **Wallet Context**: `lib/wallet-context.tsx`

### Essential Links

- **Voyager Sepolia**: https://sepolia.voyager.online
- **Voyager Mainnet**: https://voyager.online
- **Vesu Docs**: https://docs.vesu.xyz
- **Tongo Docs**: https://docs.tongo.cash
- **Starknet Docs**: https://docs.starknet.io

---

## 📝 Documentation Standards

### When to Update Documentation

Update documentation when:
- Adding new features
- Changing configuration
- Updating contract addresses
- Modifying deployment process
- Fixing bugs that affect setup/deployment
- Adding new environment variables

### How to Update Documentation

1. Identify affected documentation files
2. Update relevant sections
3. Add changelog entry if applicable
4. Update this index if adding new docs
5. Test instructions to ensure accuracy
6. Commit with descriptive message

### Documentation Checklist

When creating new documentation:
- [ ] Clear title and purpose
- [ ] Table of contents for long docs
- [ ] Step-by-step instructions
- [ ] Code examples where applicable
- [ ] Troubleshooting section
- [ ] Links to related documentation
- [ ] Changelog section
- [ ] Last updated date

---

## 🤝 Contributing to Documentation

### Reporting Issues

If you find issues in documentation:
1. Check if issue is already reported
2. Create detailed issue report
3. Suggest improvements if possible

### Improving Documentation

To improve documentation:
1. Fork repository
2. Make changes to relevant docs
3. Test instructions
4. Submit pull request
5. Describe changes in PR

---

## 📅 Documentation Maintenance

### Regular Reviews

Documentation should be reviewed:
- **Weekly**: Check for outdated information
- **Monthly**: Update contract addresses if changed
- **Quarterly**: Comprehensive review and updates
- **After major changes**: Update all affected docs

### Version History

| Date | Changes | Updated By |
|------|---------|------------|
| 2024-02-16 | Initial documentation created | Development Team |
| 2024-02-16 | Added deployment guides | Development Team |
| 2024-02-16 | Added environment setup guide | Development Team |
| 2024-02-16 | Added contract addresses reference | Development Team |

---

## 📧 Support

For documentation questions:
- Check this index for relevant documentation
- Review troubleshooting sections
- Check GitHub issues
- Contact development team

---

## 🔗 External Resources

### Starknet
- [Starknet Documentation](https://docs.starknet.io)
- [Starknet Discord](https://discord.gg/starknet)
- [Starknet Forum](https://community.starknet.io)

### Protocols
- [Vesu Documentation](https://docs.vesu.xyz)
- [Tongo Documentation](https://docs.tongo.cash)
- [AutoSwap SDK](https://github.com/BlockheaderWeb3-Community/autoswap-sdk)

### Deployment
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

**Last Updated**: February 16, 2024

**Maintained By**: PayMejor Development Team

