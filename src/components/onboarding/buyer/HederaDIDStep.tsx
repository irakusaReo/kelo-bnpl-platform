"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface HederaDIDStepProps {
  onNext: (data: { did: string }) => void;
}

export function HederaDIDStep({ onNext }: HederaDIDStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [did, setDid] = useState("");

  const handleCreateDID = async () => {
    setIsLoading(true);
    //
    // ⚠️ HEDERA DID CREATION LOGIC REQUIRED
    // TODO: Integrate with the Hedera SDK to create a new DID.
    // This will involve generating keys, creating a DID document,
    // and submitting it to the Hedera Consensus Service (HCS).
    // For now, we'll simulate the process.
    //
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay
    const simulatedDid = `did:hedera:testnet:${Date.now()}`;
    setDid(simulatedDid);
    toast.success("Hedera DID created successfully!");
    setIsLoading(false);
  };

  const handleNext = () => {
    if (!did) {
      toast.error("Please create your Hedera DID to proceed.");
      return;
    }
    onNext({ did });
  };

  return (
    <div className="space-y-4 text-center">
      <p>
        Your Hedera Decentralized Identity (DID) will be used to securely manage your
        credit profile and loan agreements on the blockchain.
      </p>

      {did ? (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg">
          <p className="font-semibold">Your Hedera DID:</p>
          <p className="text-sm break-all">{did}</p>
        </div>
      ) : (
        <Button onClick={handleCreateDID} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Hedera DID
        </Button>
      )}

      <Button onClick={handleNext} disabled={!did} className="w-full">
        Finish Onboarding
      </Button>
    </div>
  );
}
