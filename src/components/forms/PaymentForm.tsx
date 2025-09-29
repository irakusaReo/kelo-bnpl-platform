'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const paymentSchema = z.object({
  amount: z.string().min(1, 'Payment amount is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  loanId: z.string().min(1, 'Loan ID is required'),
  phoneNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  walletAddress: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  loanId?: string
  outstandingAmount?: number
  onSuccess?: () => void
}

export default function PaymentForm({ loanId, outstandingAmount = 0, onSuccess }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('')
  const { toast } = useToast()

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      paymentMethod: '',
      loanId: loanId || '',
      phoneNumber: '',
      accountNumber: '',
      bankName: '',
      walletAddress: '',
    },
  })

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true)
    try {
      let endpoint = '/api/payments/'
      
      switch (data.paymentMethod) {
        case 'mpesa':
          endpoint += 'mpesa'
          break
        case 'bank-transfer':
          endpoint += 'bank-transfer'
          break
        case 'crypto':
          endpoint += 'crypto'
          break
        case 'wallet':
          endpoint += 'wallet'
          break
        default:
          throw new Error('Invalid payment method')
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Payment Initiated',
          description: 'Your payment has been initiated successfully.',
        })
        onSuccess?.()
      } else {
        toast({
          title: 'Payment Failed',
          description: result.message || 'Please check your information and try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Make Payment</CardTitle>
        <CardDescription>
          {outstandingAmount > 0 && (
            <p>Outstanding Amount: KES {outstandingAmount.toLocaleString()}</p>
          )}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="loanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter loan ID"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (KES)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedMethod(value)
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="wallet">Kelo Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedMethod === 'mpesa' && (
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M-Pesa Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="07XX XXX XXX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {selectedMethod === 'bank-transfer' && (
              <>
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Equity Bank"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234567890"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {selectedMethod === 'crypto' && (
              <FormField
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0x..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing Payment...' : 'Make Payment'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}