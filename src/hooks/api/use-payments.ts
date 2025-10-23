
import { useQuery } from '@tanstack/react-query';
import { Payment } from '@/types';

const getPayments = async (): Promise<Payment[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    {
      id: 'pay-1',
      loanId: 'loan-123-abc',
      amount: 4666.67,
      paymentDate: new Date('2024-09-01'),
      method: 'M-Pesa',
      status: 'completed',
    },
    {
      id: 'pay-2',
      loanId: 'loan-456-def',
      amount: 27083.33,
      paymentDate: new Date('2024-07-15'),
      method: 'Bank Transfer',
      status: 'completed',
    },
    {
      id: 'pay-3',
      loanId: 'loan-789-ghi',
      amount: 5000,
      paymentDate: new Date('2024-09-22'),
      method: 'Crypto',
      status: 'pending',
    },
     {
      id: 'pay-4',
      loanId: 'loan-123-abc',
      amount: 4666.67,
      paymentDate: new Date('2024-08-01'),
      method: 'M-Pesa',
      status: 'completed',
    },
     {
      id: 'pay-5',
      loanId: 'loan-123-abc',
      amount: 4666.67,
      paymentDate: new Date('2024-07-01'),
      method: 'M-Pesa',
      status: 'failed',
    },
  ];
};

export const usePayments = () => {
  return useQuery<Payment[], Error>({
    queryKey: ['payments'],
    queryFn: getPayments,
  });
};
