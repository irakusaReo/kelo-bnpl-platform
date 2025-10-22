"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email: loginEmail,
      password: loginPassword,
    });

    if (result?.error) {
      toast.error("Login failed: Invalid credentials");
    } else if (result?.ok) {
      toast.success("Login successful! Redirecting...");
      router.push('/dashboard');
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    // This will redirect the user to the Google login page
    // and then back to the callback URL configured in NextAuth.
    await signIn('google');
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsLoading(true);

    const result = await signIn('credentials', {
      redirect: false, // Do not redirect automatically, we'll handle it
      email: regEmail,
      password: regPassword,
      firstName: regFirstName,
      lastName: regLastName,
      phone: regPhone,
      isRegister: 'true',
    });

    if (result?.error) {
      // The error from the `authorize` function will be passed here.
      toast.error(`Registration failed: ${result.error}`);
    } else if (result?.ok) {
      // The user is created but might need email verification.
      // NextAuth.js handles the session, but we inform the user.
      toast.success("Registration successful! Please check your email for verification.");
      // You could redirect them to a "please verify" page or directly to login.
      // For this example, we'll just clear the form.
      setRegFirstName('');
      setRegLastName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
    }

    setIsLoading(false);
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
            Create an Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Join Kelo and start your BNPL journey
          </p>
        </div>

        <Card>
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={isLoading} />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" disabled={isLoading} />
                      <Label htmlFor="remember" className="text-sm">Remember me</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                    <div className="text-center">
                      <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                        Forgot your password?
                      </Link>
                    </div>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div></div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" type="button" onClick={handleGoogleLogin} disabled={isLoading}>Google</Button>
                      <Button variant="outline" type="button" disabled={isLoading}>M-Pesa</Button>
                    </div>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join Kelo and start your BNPL journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" placeholder="First name" required value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} disabled={isLoading} /></div>
                    <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" placeholder="Last name" required value={regLastName} onChange={(e) => setRegLastName(e.target.value)} disabled={isLoading} /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="regEmail">Email</Label><Input id="regEmail" type="email" placeholder="Enter your email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} disabled={isLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" placeholder="+254 XXX XXX XXX" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} disabled={isLoading} /></div>
                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password</Label>
                    <div className="relative">
                      <Input id="regPassword" type={showPassword ? "text" : "password"} placeholder="Create a password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} disabled={isLoading} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" required value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} disabled={isLoading} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" required disabled={isLoading}/>
                    <Label htmlFor="terms" className="text-sm">I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a></Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Account</Button>
                  <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div></div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" type="button" onClick={handleGoogleLogin} disabled={isLoading}>Google</Button>
                    <Button variant="outline" type="button" disabled={isLoading}>
                      <svg width="24" height="24" viewBox="0 0 249 249" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
                        <path d="M0 19.671C0 12.9332 0 9.56425 1.26956 6.97276C2.48511 4.49151 4.49151 2.48511 6.97276 1.26956C9.56425 0 12.9332 0 19.671 0H229.329C236.067 0 239.436 0 242.027 1.26956C244.508 2.48511 246.515 4.49151 247.73 6.97276C249 9.56425 249 12.9332 249 19.671V229.329C249 236.067 249 239.436 247.73 242.027C246.515 244.508 244.508 246.515 242.027 247.73C239.436 249 236.067 249 229.329 249H19.671C12.9332 249 9.56425 249 6.97276 247.73C4.49151 246.515 2.48511 244.508 1.26956 242.027C0 239.436 0 236.067 0 229.329V19.671Z" fill="#0000FF"/>
                      </svg>
                      Base
                    </Button>
                  </div>
                  <div className="text-center"><p className="text-sm text-gray-600 dark:text-gray-400">Already have an account? <Link href="/auth/login" className="text-blue-600 hover:underline">Sign in</Link></p></div>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center"><div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"><Shield className="h-4 w-4" /><span>Your data is secure and encrypted</span></div></div>
        <div className="mt-4 text-center"><p className="text-sm text-gray-600 dark:text-gray-400">Are you a merchant? <Link href="/auth/merchant-register" className="text-blue-600 hover:underline font-medium">Register here</Link></p></div>
      </div>
    </div>
    </>
  );
}