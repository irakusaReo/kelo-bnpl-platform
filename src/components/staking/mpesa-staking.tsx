
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStaking } from "@/hooks/api/use-staking";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function MpesaStaking() {
  const { deposit, withdraw, isLoading } = useStaking();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount to deposit.", variant: "destructive" });
      return;
    }
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid phone number", description: "Please enter a valid M-Pesa phone number.", variant: "destructive" });
      return;
    }
    await deposit(depositAmount, "M-Pesa");
    toast({ title: "Deposit Initiated", description: `A request for KSH ${depositAmount} has been sent to ${phone}.` });
    setAmount('');
    setPhone('');
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount to withdraw.", variant: "destructive" });
      return;
    }
    if (!phone || phone.length < 10) {
        toast({ title: "Invalid phone number", description: "Please enter a valid M-Pesa phone number.", variant: "destructive" });
        return;
    }
    await withdraw(withdrawAmount, "M-Pesa");
    toast({ title: "Withdrawal Initiated", description: `KSH ${withdrawAmount} will be sent to ${phone}.` });
    setAmount('');
    setPhone('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>M-Pesa On/Off-Ramp</CardTitle>
        <CardDescription>
          Deposit or withdraw funds from your Kelo account using M-Pesa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
            <Input
              id="mpesa-phone"
              type="tel"
              placeholder="+254 7..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mpesa-amount">Amount (KSH)</Label>
            <Input
              id="mpesa-amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleDeposit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deposit
            </Button>
            <Button onClick={handleWithdraw} variant="outline" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
