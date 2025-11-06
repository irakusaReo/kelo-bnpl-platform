"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import { zkService } from "@/services/zk";
import { useToast } from "@/hooks/use-toast";

export default function CreditVerificationPage() {
  const { profile } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  const handleVerification = async () => {
    if (!profile) {
      toast({
        title: "Error",
        description: "You must be logged in to verify your creditworthiness.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVerificationStatus("Generating ZK inputs...");

    try {
      const inputs = await zkService.generateInputs(profile.id);
      setVerificationStatus("Generating ZK proof...");

      // In a real implementation, we would use a client-side ZK proof generation
      // library like snarkjs to generate the proof.
      const dummyProof = new TextEncoder().encode("dummy-proof");
      const dummyPublicInputs = [
        new TextEncoder().encode("dummy-public-input-1"),
        new TextEncoder().encode("dummy-public-input-2"),
      ];

      setVerificationStatus("Submitting ZK proof...");
      const { tx_hash } = await zkService.submitProof(profile.id, dummyProof, dummyPublicInputs);

      setVerificationStatus(`Verification successful! Tx hash: ${tx_hash}`);
    } catch (error) {
      console.error("Failed to verify creditworthiness:", error);
      setVerificationStatus("Verification failed.");
      toast({
        title: "Error",
        description: "Failed to verify creditworthiness.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Verify Creditworthiness</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Verify your creditworthiness to unlock better loan terms and higher
            credit limits.
          </p>
          <Button onClick={handleVerification} disabled={isLoading}>
            {isLoading ? "Verifying..." : "Start Verification"}
          </Button>
          {verificationStatus && (
            <p className="mt-4 text-sm text-gray-500">{verificationStatus}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
