export interface DashboardStats {
  availableCredit: number
  activeLoans: number
  totalLoanAmount: number
  dueThisMonth: number
  creditScore: number
  monthlyChange: number
}

export interface Loan {
  id: string
  amount: number
  purpose: string
  duration: number
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted'
  createdAt: string
  updatedAt: string
  userId: string
  userType: 'customer' | 'merchant'
  interestRate: number
  monthlyPayment: number
  remainingAmount: number
  nextPaymentDate?: string
  merchant?: string
}

export interface PaymentSchedule {
  id: string
  loanId: string
  amount: number
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  paymentMethod?: string
  paidDate?: string
}

export interface StakingPool {
  id: string
  name: string
  chain: 'ethereum' | 'polygon' | 'hedera' | 'binance'
  token: string
  apy: number
  totalStaked: number
  tvl: number
  minStake: number
  maxStake: number
  lockPeriod: number
  riskLevel: 'low' | 'medium' | 'high'
  contractAddress: string
  tokenAddress: string
}

export interface UserStake {
  id: string
  poolId: string
  amount: number
  stakedAt: string
  unstakedAt?: string
  rewards: number
  isActive: boolean
  estimatedApy: number
}

export interface Transaction {
  id: string
  type: 'loan_disbursement' | 'loan_repayment' | 'staking_reward' | 'unstake' | 'deposit' | 'withdrawal'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  description: string
  txHash?: string
}