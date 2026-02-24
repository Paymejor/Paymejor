# Quote Expiration and Refresh Implementation

## Overview

This document describes the implementation of quote expiration and refresh functionality for the MavaPay BTC ↔ NGN ramp feature.

## Requirements

- **6.3**: Auto-refresh expired quotes
- **6.4**: Detect significant rate changes (>2%) and require re-confirmation

## Implementation Details

### 1. Quote Timer (5 Minutes)

The quote timer counts down from 5 minutes (300 seconds) and displays the remaining time to the user.

**Location**: `frontend/components/tabs/ramp-tab.tsx`

**State Variables**:
```typescript
const [quoteExpiry, setQuoteExpiry] = useState<Date | null>(null)
const [quoteTimer, setQuoteTimer] = useState<number>(0)
```

**Timer Logic**:
- When a quote is fetched, `quoteExpiry` is set to 5 minutes from the current time
- A `setInterval` runs every second to update `quoteTimer` with the remaining seconds
- The timer uses `Math.max(0, ...)` to ensure it never goes below 0
- The timer is displayed in MM:SS format (e.g., "4:59", "0:05")

### 2. Auto-Refresh on Expiration

When the quote timer reaches 0, the system automatically fetches a new quote.

**Implementation**:
```typescript
useEffect(() => {
  if (!quoteExpiry) return

  const interval = setInterval(() => {
    const now = Date.now()
    const expiry = quoteExpiry.getTime()
    const remaining = Math.max(0, Math.floor((expiry - now) / 1000))
    
    setQuoteTimer(remaining)
    
    // Auto-refresh if expired
    if (remaining === 0 && amount && parseFloat(amount) > 0) {
      const refreshQuote = async () => {
        // Fetch new quote...
        detectRateChange(newQuote)
        const newExpiry = new Date(Date.now() + 5 * 60 * 1000)
        setQuoteExpiry(newExpiry)
      }
      refreshQuote()
    }
  }, 1000)

  return () => clearInterval(interval)
}, [quoteExpiry, amount, mode, fetchQuote, detectRateChange])
```

### 3. Rate Change Detection (>2%)

The system detects when the exchange rate changes by more than 2% between quotes.

**State Variables**:
```typescript
const [previousQuote, setPreviousQuote] = useState<QuoteResponse | null>(null)
const [rateChangeDetected, setRateChangeDetected] = useState(false)
const [rateChangePercentage, setRateChangePercentage] = useState(0)
```

**Rate Change Calculation**:
```typescript
const calculateRateChange = useCallback((oldRate: number, newRate: number): number => {
  if (oldRate === 0) return 0
  return Math.abs((newRate - oldRate) / oldRate) * 100
}, [])
```

**Detection Logic**:
```typescript
const detectRateChange = useCallback((newQuote: QuoteResponse) => {
  if (!previousQuote) {
    setPreviousQuote(newQuote)
    setRateChangeDetected(false)
    setRateChangePercentage(0)
    return
  }

  const rateChange = calculateRateChange(previousQuote.exchangeRate, newQuote.exchangeRate)
  
  if (rateChange > 2) {
    setRateChangeDetected(true)
    setRateChangePercentage(rateChange)
  } else {
    setRateChangeDetected(false)
    setRateChangePercentage(0)
  }
  
  setPreviousQuote(newQuote)
}, [previousQuote, calculateRateChange])
```

### 4. Re-Confirmation Flow

When a significant rate change is detected, the user must acknowledge it before proceeding.

**UI Alert**:
```tsx
{rateChangeDetected && quote && (
  <Alert className="border-yellow-500/30 bg-yellow-500/10">
    <AlertCircle className="h-4 w-4 text-yellow-500" />
    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
      <div className="space-y-2">
        <p className="font-medium">
          Exchange rate changed by {rateChangePercentage.toFixed(2)}%
        </p>
        <p className="text-sm">
          The exchange rate has changed significantly since your last quote. 
          Please review the new rate and confirm to proceed.
        </p>
        <Button
          onClick={handleRateChangeConfirm}
          size="sm"
          className="mt-2 bg-yellow-600 hover:bg-yellow-700"
        >
          I Understand, Continue
        </Button>
      </div>
    </AlertDescription>
  </Alert>
)}
```

**Confirmation Handler**:
```typescript
const handleRateChangeConfirm = useCallback(() => {
  setRateChangeDetected(false)
  setRateChangePercentage(0)
}, [])
```

**Button Disabled State**:
The confirm button is disabled when a rate change is detected:
```typescript
disabled={
  // ... other conditions
  rateChangeDetected ||
  // ... other conditions
}
```

## User Experience

### Quote Display
- Shows remaining time in badge: "Expires in 4:59"
- Timer counts down every second
- When timer reaches 0, quote automatically refreshes

### Rate Change Warning
- Yellow alert appears when rate changes >2%
- Shows exact percentage change
- Explains what happened
- Requires user to click "I Understand, Continue" button
- Confirm button is disabled until user acknowledges

### Both Modes
- Works for both off-ramp (BTC → NGN) and on-ramp (NGN → BTC)
- Rate change detection applies to both directions
- Auto-refresh applies to both modes

## Testing

### Unit Tests
Location: `frontend/components/tabs/__tests__/ramp-tab-quote-expiration.test.tsx`

**Test Coverage**:
1. Quote Timer
   - Calculates remaining time correctly
   - Never goes below 0
   - Counts down correctly

2. Auto-refresh on Expiration
   - Triggers refresh when timer reaches 0
   - Does not trigger when timer is not 0

3. Rate Change Detection
   - Detects rate change >2%
   - Does not detect rate change ≤2%
   - Detects rate decrease >2%
   - Handles zero old rate
   - Calculates exact 2% change
   - Calculates 2.5% and 5% changes correctly

4. Rate Change Re-confirmation Flow
   - Requires confirmation when rate changes >2%
   - Does not require confirmation when rate changes ≤2%
   - Clears rate change after confirmation

5. Quote Expiry Format
   - Formats time remaining correctly (MM:SS)
   - Pads seconds with leading zero

6. Quote Expiration Time
   - Sets expiry to 5 minutes from now
   - Detects expired quote
   - Detects valid quote

**Test Results**: All 20 tests pass ✓

## Edge Cases Handled

1. **Zero old rate**: Returns 0% change to avoid division by zero
2. **Exact 2% change**: Not considered significant (must be >2%)
3. **Timer below 0**: Uses `Math.max(0, ...)` to prevent negative values
4. **No previous quote**: First quote doesn't trigger rate change detection
5. **Mode switching**: Clears all quote state when switching between on-ramp and off-ramp

## Future Enhancements

1. Add visual indicator when quote is about to expire (e.g., red badge at <30 seconds)
2. Add sound notification when rate changes significantly
3. Allow users to configure rate change threshold (currently hardcoded at 2%)
4. Add rate change history to show trend over time
5. Implement quote refresh button for manual refresh before expiration
