
import { useQuery } from '@tanstack/react-query';
import { Loan } from '@/types';

// This is a placeholder. In a real app, you would fetch this from your API.
const getLoans = async (): Promise<Loan[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock data that matches the Loan type structure
  return [
    {
      id: 'loan-123-abc',
      userId: 'user-456',
      amount: 50000,
      interestRate: 12,
      term: 12, // months
      status: 'active',
      applicationDate: new Date('2024-08-01'),
      approvalDate: new Date('2024-08-03'),
      dueDate: new Date('2024-09-03'),
      repayments: [
        { id: 'repay-1', amount: 4666.67, date: new Date('2024-09-01') },
      ],
    },
    {
      id: 'loan-456-def',
      userId: 'user-456',
      amount: 25000,
      interestRate: 10,
      term: 6,
      status: 'paid',
      applicationDate: new Date('2024-01-15'),
      approvalDate: new Date('2024-01-16'),
      dueDate: new Date('2024-07-16'),
      repayments: [
        { id: 'repay-2', amount: 27083.33, date: new Date('2024-07-15') },
      ],
    },
     {
      id: 'loan-789-ghi',
      userId: 'user-456',
      amount: 10000,
      interestRate: 15,
      term: 3,
      status: 'pending',
      applicationDate: new Date('2024-09-20'),
      approvalDate: null,
      dueDate: new Date('2024-10-20'),
      repayments: [],
    },
  ];
};

export const useLoans = () => {
  return useQuery<Loan[], Error>({
    queryKey: ['loans'],
    queryFn: getLoans,
  });
};
