/**
 * User position state (from blockchain)
 */
export interface PositionState {
  // Raw encrypted data from contract
  encryptedCollateral: string;
  encryptedDebt: string;
  
  // Decrypted data (after Tongo decryption)
  collateralBalance: string | null;
  debtBalance: string | null;
  
  // Calculated from vault/oracle
  ltv: number;
  healthFactor: number;
  liquidationThreshold: number;
  borrowingCapacity: string;
  
  // Metadata
  lastUpdated: number;
  tongoAccount: string;
}

/**
 * On-chain position structure (matches Cairo contract)
 */
export interface OnChainPosition {
  owner: string;
  shielded_collateral: string;
  shielded_debt: string;
  tongo_account: string;
  last_updated: number;
}

/**
 * Position metrics for display
 */
export interface PositionMetrics {
  collateralValue: string;
  debtValue: string;
  availableToBorrow: string;
  ltv: number;
  healthFactor: number;
  liquidationPrice: string;
  isAtRisk: boolean;
}

/**
 * Position update parameters
 */
export interface PositionUpdateParams {
  collateralDelta?: string;
  debtDelta?: string;
  action: 'deposit' | 'withdraw' | 'borrow' | 'repay';
}

/**
 * Decrypted position data
 */
export interface DecryptedPosition {
  collateral: {
    token: 'wBTC';
    amount: string;
    valueUSD: string;
  };
  debt: {
    token: 'USDC';
    amount: string;
    valueUSD: string;
  };
  metrics: PositionMetrics;
}

/**
 * Position risk level
 */
export type PositionRiskLevel = 'safe' | 'moderate' | 'high' | 'critical';

/**
 * Position risk assessment
 */
export interface PositionRiskAssessment {
  level: PositionRiskLevel;
  healthFactor: number;
  distanceToLiquidation: string;
  recommendedAction?: string;
}
