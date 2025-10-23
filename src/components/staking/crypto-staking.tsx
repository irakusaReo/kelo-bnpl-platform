
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";
import { useStaking } from "@/hooks/api/use-staking";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function CryptoStaking() {
  const { address, isConnected } = useAccount();
  const { deposit, withdraw, isLoading } = useStaking();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount to deposit.", variant: "destructive" });
      return;
    }
    await deposit(depositAmount, "USDC"); // Assuming USDC for now
    toast({ title: "Deposit Successful", description: `${depositAmount} USDC has been staked.` });
    setAmount('');
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount to withdraw.", variant: "destructive" });
      return;
    }
    await withdraw(withdrawAmount, "USDC");
    toast({ title: "Withdrawal Successful", description: `${withdrawAmount} USDC has been withdrawn.` });
    setAmount('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crypto Wallet Staking</CardTitle>
        <CardDescription>
          Connect your wallet to deposit or withdraw USDC/USDT from the liquidity pool.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <ConnectWallet>
            <Wallet />
          </ConnectWallet>
        </div>

        {isConnected && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="staking-amount">Amount (USDC)</Label>
              <Input
                id="staking-amount"
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
        )}
      </CardContent>
    </Card>
  );
}
