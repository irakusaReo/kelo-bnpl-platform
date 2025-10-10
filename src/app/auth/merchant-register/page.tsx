"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";

export default function MerchantRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessRegNumber, setBusinessRegNumber] = useState('');


  const [isLoading, setIsLoading] = useState(false);
  const { supabase } = useUser();
  const router = useRouter();

  const handleMerchantRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Sign up the user with the 'merchant' role
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: 'merchant',
            first_name: firstName,
            last_name: lastName,
            phone: phone,
          },
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        throw signUpError;
      }

      const user = signUpData.user;
      if (!user) {
        toast.error("Registration failed: no user created.");
        throw new Error("Registration failed: no user created.");
      }

      // The handle_new_user trigger has already created an entry in the profiles table.
      // Now, create the corresponding entry in the merchants table
      const { error: merchantError } = await supabase
        .from('merchants')
        .insert({
          id: user.id, // Link to the user's profile ID
          business_name: businessName,
          business_registration_number: businessRegNumber,
        });

      if (merchantError) {
        toast.error(`Account created, but failed to save business info: ${merchantError.message}`);
        // This is a critical failure. The user is a merchant in name but has no merchant record.
        // A robust solution might involve a transaction or cleanup function.
        throw merchantError;
      }

      toast.success("Merchant registration successful! Please check your email to verify your account.");

    } catch (error) {
      console.error("Merchant registration failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Toaster richColors />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
            <span className="text-3xl font-bold">Kelo</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Merchant Registration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Join Kelo as a merchant and grow your business
          </p>
        </div>

        <Card>
          <form onSubmit={handleMerchantRegister}>
            <CardHeader>
              <CardTitle>Create Merchant Account</CardTitle>
              <CardDescription>
                Fill in the details to register your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Your first name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Your last name" required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Business contact email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" placeholder="Your registered business name" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessRegNumber">Business Registration No. (Optional)</Label>
                <Input id="businessRegNumber" placeholder="e.g., BN-XXXXXXXX" value={businessRegNumber} onChange={(e) => setBusinessRegNumber(e.target.value)} disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+254 XXX XXX XXX" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" required disabled={isLoading}/>
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Merchant Terms of Service
                  </a>
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Merchant Account
              </Button>
            </CardContent>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Not a merchant?{" "}
            <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
              Register as a user
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}