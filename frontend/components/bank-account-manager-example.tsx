/**
 * Bank Account Manager Example Usage
 * 
 * Example demonstrating how to use the BankAccountManager component
 * in a parent component (e.g., Ramp Tab)
 */

'use client'

import { useState } from 'react'
import { BankAccountManager } from './bank-account-manager'
import { BankAccount } from '@/types/mavapay'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function BankAccountManagerExample() {
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)

  const handleAccountSelect = (account: BankAccount) => {
    setSelectedAccount(account)
    console.log('Selected account:', account)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bank Account Manager Example</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This example shows how to integrate the BankAccountManager component
            into your application.
          </p>
          
          {/* Bank Account Manager Component */}
          <BankAccountManager
            onSelect={handleAccountSelect}
            selectedAccountId={selectedAccount?.id}
            showAddForm={true}
          />
          
          {/* Display Selected Account */}
          {selectedAccount && (
            <div className="mt-6 p-4 border rounded-lg bg-primary/5">
              <h4 className="font-semibold mb-2">Selected Account:</h4>
              <p className="text-sm">
                <span className="font-medium">Name:</span> {selectedAccount.accountName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Bank:</span> {selectedAccount.bankName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Account Number:</span> {selectedAccount.accountNumber}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
