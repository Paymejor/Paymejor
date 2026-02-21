'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { useMavaPay } from '@/hooks/useMavaPay'
import { BankAccount } from '@/types/mavapay'
import { useToast } from '@/hooks/use-toast'

/**
 * BankAccountManager Component
 * 
 * Manages user's saved Nigerian bank accounts with encryption:
 * - Display list of saved bank accounts
 * - Add new bank account with verification
 * - Delete saved bank accounts
 * - Select bank account for transactions
 * 
 * Requirements: 4.1-4.6
 */

interface BankAccountManagerProps {
  onSelect?: (account: BankAccount) => void
  selectedAccountId?: string
  showAddForm?: boolean
}

export function BankAccountManager({
  onSelect,
  selectedAccountId,
  showAddForm = true,
}: BankAccountManagerProps) {
  const { toast } = useToast()
  
  // Hooks
  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
    addAccount,
    deleteAccount,
    verifyAccount,
  } = useBankAccounts()
  
  const {
    banks,
    fetchBanks,
  } = useMavaPay()
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  })
  const [isVerifying, setIsVerifying] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [verifiedAccountName, setVerifiedAccountName] = useState<string | null>(null)
  
  // Load banks on mount
  useEffect(() => {
    if (banks.length === 0) {
      fetchBanks().catch(err => {
        console.error('Error fetching banks:', err)
      })
    }
  }, [banks.length, fetchBanks])
  
  /**
   * Handle bank selection
   * Requirements: 4.4
   */
  const handleBankSelect = (value: string) => {
    const selectedBank = banks.find(b => b.code === value)
    if (selectedBank) {
      setFormData(prev => ({
        ...prev,
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
      }))
      setFormError(null)
      setVerifiedAccountName(null)
    }
  }
  
  /**
   * Handle account number input
   * Requirements: 4.1
   */
  const handleAccountNumberChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limited = digitsOnly.slice(0, 10)
    
    setFormData(prev => ({
      ...prev,
      accountNumber: limited,
    }))
    
    setFormError(null)
    setVerifiedAccountName(null)
  }
  
  /**
   * Verify bank account
   * Requirements: 4.2
   */
  const handleVerifyAccount = async () => {
    // Validate inputs
    if (!formData.bankCode) {
      setFormError('Please select a bank')
      return
    }
    
    if (formData.accountNumber.length !== 10) {
      setFormError('Account number must be exactly 10 digits')
      return
    }
    
    try {
      setIsVerifying(true)
      setFormError(null)
      
      const result = await verifyAccount(formData.accountNumber, formData.bankCode)
      
      if (result.isValid && result.accountName) {
        setVerifiedAccountName(result.accountName)
        setFormData(prev => ({
          ...prev,
          accountName: result.accountName || '',
        }))
        
        toast({
          title: 'Account Verified',
          description: `Account belongs to ${result.accountName}`,
        })
      } else {
        setFormError(result.errorMessage || 'Failed to verify account')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify account'
      setFormError(errorMessage)
    } finally {
      setIsVerifying(false)
    }
  }
  
  /**
   * Add bank account
   * Requirements: 4.1, 4.2, 4.3
   */
  const handleAddAccount = async () => {
    // Validate all fields
    if (!formData.bankName || !formData.bankCode) {
      setFormError('Please select a bank')
      return
    }
    
    if (formData.accountNumber.length !== 10) {
      setFormError('Account number must be exactly 10 digits')
      return
    }
    
    if (!verifiedAccountName) {
      setFormError('Please verify the account first')
      return
    }
    
    try {
      setIsAdding(true)
      setFormError(null)
      
      // Find the bank's NIP code
      const bank = banks.find(b => b.code === formData.bankCode)
      if (!bank) {
        setFormError('Selected bank not found')
        return
      }
      
      await addAccount({
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: verifiedAccountName,
        nipBankCode: bank.nipBankCode,
        isVerified: true,
      })
      
      toast({
        title: 'Account Added',
        description: 'Bank account has been saved securely',
      })
      
      // Reset form
      setFormData({
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
      })
      setVerifiedAccountName(null)
      setShowForm(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add account'
      setFormError(errorMessage)
    } finally {
      setIsAdding(false)
    }
  }
  
  /**
   * Delete bank account
   * Requirements: 4.6
   */
  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) {
      return
    }
    
    try {
      await deleteAccount(accountId)
      
      toast({
        title: 'Account Deleted',
        description: 'Bank account has been removed',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }
  
  /**
   * Handle account selection for transactions
   * Requirements: 4.5
   */
  const handleSelectAccount = (account: BankAccount) => {
    if (onSelect) {
      onSelect(account)
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bank Accounts</h3>
          <p className="text-sm text-muted-foreground">
            Manage your Nigerian bank accounts for off-ramp transactions
          </p>
        </div>
        
        {showAddForm && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        )}
      </div>
      
      {/* Error Alert */}
      {accountsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {accountsError.message}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Add Account Form */}
      {showForm && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Add Bank Account</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    bankName: '',
                    bankCode: '',
                    accountNumber: '',
                    accountName: '',
                  })
                  setVerifiedAccountName(null)
                  setFormError(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Add a Nigerian bank account for receiving NGN payouts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form Error */}
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            {/* Bank Selection */}
            <div className="space-y-2">
              <Label htmlFor="bank">Bank</Label>
              <Select
                value={formData.bankCode}
                onValueChange={handleBankSelect}
                disabled={isVerifying || isAdding}
              >
                <SelectTrigger id="bank">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map(bank => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <div className="flex gap-2">
                <Input
                  id="accountNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="0123456789"
                  value={formData.accountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  disabled={isVerifying || isAdding}
                  maxLength={10}
                />
                <Button
                  onClick={handleVerifyAccount}
                  disabled={
                    !formData.bankCode ||
                    formData.accountNumber.length !== 10 ||
                    isVerifying ||
                    isAdding
                  }
                  className="gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your 10-digit account number
              </p>
            </div>
            
            {/* Verified Account Name */}
            {verifiedAccountName && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Account verified: {verifiedAccountName}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Add Button */}
            <Button
              onClick={handleAddAccount}
              disabled={!verifiedAccountName || isAdding}
              className="w-full gap-2"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding Account...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Saved Accounts List */}
      <div className="space-y-3">
        {accountsLoading ? (
          // Loading skeletons
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : accounts.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                No bank accounts saved
              </p>
              <p className="text-xs text-muted-foreground">
                Add a bank account to receive NGN payouts
              </p>
            </CardContent>
          </Card>
        ) : (
          // Account cards
          accounts.map(account => (
            <Card
              key={account.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                selectedAccountId === account.id
                  ? 'border-2 border-primary bg-primary/5'
                  : ''
              }`}
              onClick={() => handleSelectAccount(account)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{account.accountName}</p>
                      {account.isVerified && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {account.bankName}
                    </p>
                    <p className="text-sm font-mono text-muted-foreground">
                      {account.accountNumber}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAccount(account.id)
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
