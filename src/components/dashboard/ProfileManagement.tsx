'use client'

import { useUser } from '@/contexts/UserContext'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const profileFormSchema = z.object({
  first_name: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  last_name: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  phone: z.string().optional(),
  email: z.string().email(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileManagement() {
  const { user, profile, supabase, isLoading, refreshProfile } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (profile && user) {
      form.reset({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        phone: profile.phone ?? '',
        email: user.email ?? '',
      })
    }
  }, [profile, user, form])

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !supabase) return

    setIsSubmitting(true)
    setSubmitMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      })
      .eq('id', user.id)

    if (error) {
      setSubmitMessage({ type: 'error', text: `Error updating profile: ${error.message}` })
    } else {
      setSubmitMessage({ type: 'success', text: 'Profile updated successfully!' })
      await refreshProfile() // Refresh the user context with new data
    }

    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+254 712 345 678" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your phone number will be used for notifications and verification.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your@email.com" {...field} disabled />
                  </FormControl>
                   <FormDescription>
                    You cannot change your email address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Profile
            </Button>
          </form>
        </Form>
        {submitMessage && (
           <div className={`mt-4 text-sm font-medium ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {submitMessage.text}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
