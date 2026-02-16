/**
 * Vesu Protocol Types
 * 
 * Type definitions for Vesu lending protocol integration
 * Based on Vesu SDK and protocol documentation
 */

/**
 * Vesu pool configuration
 */
export interface VesuPoolConfig {
  poolAddress: string;
  collateralAsset: string;
  borrowAsset: string;
  network: 'sepolia' | 'mainnet';
}

/**
 * User position in Vesu pool
 */
export interface VesuPosition {
  collateral: bigint;        // Supplied wBTC amount
  debt: bigint;              // Borrowed USDC amount
  ltv: number;               // Loan-to-value ratio (percentage)
  healthFactor: number;      // Health factor (>1 is safe)
  liquidationThreshold: bigint; // Liquidation threshold
}

/**
 * Supply (deposit collateral) parameters
 */
export interface VesuSupplyParams {
  asset: string;             // Token address (wBTC)
  amount: string;            // Amount to supply (in token units)
  onBehalfOf: string;        // User address
}

/**
 * Borrow parameters
 */
export interface VesuBorrowParams {
  asset: string;             // Token address (USDC)
  amount: string;            // Amount to borrow (in token units)
  onBehalfOf: string;        // User address
}

/**
 * Withdraw parameters
 */
export interface VesuWithdrawParams {
  asset: string;             // Token address (wBTC)
  amount: string;            // Amount to withdraw (in token units)
  to: string;                // Recipient address
}

/**
 * Repay parameters
 */
export interface VesuRepayParams {
  asset: string;             // Token address (USDC)
  amount: string;            // Amount to repay (in token units)
  onBehalfOf: string;        // User address
}

/**
 * Borrowing capacity query parameters
 */
export interface VesuBorrowingCapacityParams {
  user: string;              // User address
  collateralAsset: string;   // Collateral token (wBTC)
  borrowAsset: string;       // Borrow token (USDC)
}

/**
 * Vesu pool parameters (from contract)
 */
export interface VesuPoolParameters {
  maxLTV: number;            // Maximum loan-to-value ratio
  liquidationThreshold: number; // Liquidation threshold
  liquidationBonus: number;  // Liquidation bonus percentage
  interestRate: number;      // Current interest rate
  utilizationRate: number;   // Pool utilization rate
}

/**
 * Vesu transaction result
 */
export interface VesuTransactionResult {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Vesu pool state
 */
export interface VesuPoolState {
  totalCollateral: bigint;
  totalDebt: bigint;
  availableLiquidity: bigint;
  utilizationRate: number;
  interestRate: number;
}

/**
 * Leverage loop parameters
 */
export interface LeverageLoopParams {
  initialCollateral: string;  // Initial wBTC collateral amount
  leverageMultiplier: number; // Leverage multiplier (1x-3x)
  slippage: number;           // Slippage tolerance for swaps (e.g., 0.5 for 0.5%)
}

/**
 * Leverage loop step status
 */
export interface LeverageLoopStep {
  step: number;
  description: string;
  transactionHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  amount?: string;
}

/**
 * Projected position after leverage loop
 */
export interface ProjectedPosition {
  totalCollateral: string;    // Total wBTC after loop
  totalDebt: string;          // Total USDC debt after loop
  projectedLTV: number;       // Projected LTV percentage
  liquidationPrice: number;   // BTC price at which liquidation occurs
  healthFactor: number;       // Projected health factor
}

/**
 * Leverage loop result
 */
export interface LeverageLoopResult {
  steps: LeverageLoopStep[];
  finalPosition: ProjectedPosition;
  success: boolean;
}
