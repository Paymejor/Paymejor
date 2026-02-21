# Bank Account Manager Component

## Overview

The Bank Account Manager component provides a complete UI for managing Nigerian bank accounts for MavaPay off-ramp transactions. It implements all requirements from 4.1-4.6 of the MavaPay BTC ↔ NGN On/Off-Ramp Integration specification.

## Features

### 1. Display Saved Bank Accounts (Requirement 4.4)
- Shows list of all saved bank accounts
- Displays account name, bank name, and account number
- Shows verification status with badge
- Empty state when no accounts exist
- Loading skeletons during data fetch

### 2. Add New Bank Account (Requirements 4.1, 4.2, 4.3)
- Form with bank selection dropdown
- Account number input with validation (10 digits)
- Real-time verification via MavaPay API
- Displays verified account name before saving
- Encrypts account details before storage (AES-256)
- Stores encrypted data in localStorage

### 3. Bank Account Verification (Requirement 4.2)
- Validates account number format (10 digits)
- Calls MavaPay verification API
- Shows verification status and account name
- Prevents saving unverified accounts

### 4. Delete Bank Accounts (Requirement 4.6)
- Delete button on each account card
- Confirmation dialog before deletion
- Removes account from encrypted storage
- Updates UI immediately

### 5. Account Selection (Requirement 4.5)
- Click to select account for transactions
- Visual indication of selected account
- Callback to parent component with selected account
- Supports controlled selection via props

## Component API

```typescript
interface BankAccountManagerProps {
  onSelect?: (account: BankAccount) => void
  selectedAccountId?: string
  showAddForm?: boolean
}
```

### Props

- `onSelect`: Optional callback when user selects an account
- `selectedAccountId`: ID of currently selected account (for visual indication)
- `showAddForm`: Whether to show the "Add Account" button (default: true)

## Usage Example

```tsx
import { BankAccountManager } from '@/components/bank-account-manager'
import { BankAccount } from '@/types/mavapay'

function RampTab() {
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)

  return (
    <BankAccountManager
      onSelect={setSelectedAccount}
      selectedAccountId={selectedAccount?.id}
      showAddForm={true}
    />
  )
}
```

## Dependencies

### Hooks
- `useBankAccounts`: Manages bank account CRUD operations with encryption
- `useMavaPay`: Provides bank list and verification functionality
- `useToast`: Shows success/error notifications

### UI Components
- Card, CardContent, CardDescription, CardHeader, CardTitle
- Button, Input, Label, Select
- Alert, Badge, Skeleton
- Icons from lucide-react

## Security Features

1. **Encryption at Rest**: All bank account numbers are encrypted using AES-256 before storage
2. **Wallet-Based Keys**: Encryption keys derived from user's wallet address
3. **No Plain Text Storage**: Account numbers never stored in plain text
4. **Verification Required**: Accounts must be verified before saving
5. **Isolated Storage**: Each wallet address has isolated encrypted storage

## Validation

1. **Account Number Format**: Must be exactly 10 digits (Nigerian standard)
2. **Bank Selection**: Must select a bank before verification
3. **Verification Status**: Must verify account before adding
4. **Input Sanitization**: Only numeric input allowed for account numbers

## Error Handling

- Displays error alerts for failed operations
- Shows specific error messages from API
- Graceful handling of network failures
- User-friendly error messages with suggestions

## Accessibility

- Proper label associations for form inputs
- Keyboard navigation support
- Screen reader friendly
- Focus management in forms
- ARIA attributes where appropriate

## Testing

Unit tests are provided in `frontend/components/__tests__/bank-account-manager.test.tsx`:
- Component rendering tests
- Form validation tests
- Account display tests
- Delete functionality tests
- Selection functionality tests
- Error state tests

## Files Created

1. `frontend/components/bank-account-manager.tsx` - Main component
2. `frontend/components/__tests__/bank-account-manager.test.tsx` - Unit tests
3. `frontend/components/bank-account-manager-example.tsx` - Usage example
4. `frontend/components/BANK_ACCOUNT_MANAGER_README.md` - This documentation

## Integration Points

The component integrates with:
- MavaPay API (via `/api/ramp/banks` and `/api/ramp/verify-bank`)
- Bank encryption utilities (`frontend/lib/bank-encryption.ts`)
- Wallet context for user authentication
- Transaction manager for off-ramp operations

## Next Steps

To use this component in the Ramp Tab:
1. Import the component
2. Add state for selected account
3. Pass the selected account to off-ramp initiation
4. Handle account selection callback
5. Display selected account in transaction form

## Requirements Coverage

✅ 4.1 - Account number validation (10 digits)
✅ 4.2 - Bank account verification via MavaPay API
✅ 4.3 - Encrypted storage of account details
✅ 4.4 - Display saved bank accounts
✅ 4.5 - Select bank account for transactions
✅ 4.6 - Delete saved bank accounts
