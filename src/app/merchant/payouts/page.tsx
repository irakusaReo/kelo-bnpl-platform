"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { getPayoutHistory, requestPayout } from "@/services/merchant";
import { Payout } from "@/types/merchant";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayoutsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState(0);

  const { data: payouts = [], isLoading, isError } = useQuery<Payout[]>({
    queryKey: ["payouts"],
    queryFn: getPayoutHistory,
  });

  const queryClient = useQueryClient();
  const requestPayoutMutation = useMutation({
    mutationFn: (amount: number) => requestPayout(amount),
    onSuccess: () => {
      toast({ title: "Success", description: "Payout requested." });
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to request payout. " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestPayout = () => {
    requestPayoutMutation.mutate(amount);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError) {
    return <p className="text-destructive">Failed to load payouts.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payouts</h1>
      <div className="flex justify-end">
        <Button onClick={() => setIsDialogOpen(true)}>Request Payout</Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              placeholder="Amount"
            />
            <Button onClick={handleRequestPayout} disabled={requestPayoutMutation.isPending}>
              {requestPayoutMutation.isPending ? "Requesting..." : "Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>A list of your previous payouts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>{new Date(payout.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{payout.amount}</TableCell>
                  <TableCell>{payout.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
