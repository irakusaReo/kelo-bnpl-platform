
export interface Repayment {
  id: string;
  amount: number;
  date: Date;
}

export interface Loan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  term: number;
  status: 'pending' | 'active' | 'paid' | 'defaulted';
  applicationDate: Date;
  approvalDate: Date | null;
  dueDate: Date;
  repayments: Repayment[];
}
