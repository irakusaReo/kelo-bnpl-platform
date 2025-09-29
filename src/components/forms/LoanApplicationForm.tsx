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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const loanApplicationSchema = z.object({
  amount: z.string().min(1, 'Loan amount is required'),
  purpose: z.string().min(10, 'Please provide a detailed purpose'),
  duration: z.string().min(1, 'Loan duration is required'),
  income: z.string().min(1, 'Monthly income is required'),
  employmentStatus: z.string().min(1, 'Employment status is required'),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
})

type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>

interface LoanApplicationFormProps {
  onSuccess?: () => void
  isMerchant?: boolean
}

export default function LoanApplicationForm({ onSuccess, isMerchant = false }: LoanApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      amount: '',
      purpose: '',
      duration: '',
      income: '',
      employmentStatus: '',
      businessName: '',
      businessType: '',
    },
  })

  const onSubmit = async (data: LoanApplicationFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/loans/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          type: isMerchant ? 'merchant' : 'customer',
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Application Submitted',
          description: 'Your loan application has been submitted successfully. We will review it and get back to you soon.',
        })
        onSuccess?.()
      } else {
        toast({
          title: 'Application Failed',
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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {isMerchant ? 'Business Loan Application' : 'Personal Loan Application'}
        </CardTitle>
        <CardDescription>
          Fill out the form below to apply for a loan. All fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount (KES)*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Duration*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Purpose*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe the purpose of your loan..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Income (KES)*</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="employmentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Status*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self-employed">Self-employed</SelectItem>
                      <SelectItem value="business-owner">Business Owner</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isMerchant && (
              <>
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your business name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}