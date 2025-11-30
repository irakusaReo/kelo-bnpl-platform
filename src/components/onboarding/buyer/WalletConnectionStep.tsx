"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/blockchain/useWallet";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface WalletConnectionStepProps {
  onNext: (data: { evmWallet: string; hederaWallet: string }) => void;
}

export function WalletConnectionStep({ onNext }: WalletConnectionStepProps) {
  const { connectWallet, connection, currentProvider } = useWallet();
  const [evmConnected, setEvmConnected] = useState(false);
  const [hederaConnected, setHederaConnected] = useState(false);

  useEffect(() => {
    if (connection && (currentProvider === 'metamask' || currentProvider === 'coinbase')) {
      setEvmConnected(true);
    }
    if (connection && currentProvider === 'hashpack') {
      setHederaConnected(true);
    }
  }, [connection, currentProvider]);

  const handleNext = () => {
    if (!evmConnected || !hederaConnected) {
      toast.error("Please connect both your EVM and Hedera wallets to proceed.");
      return;
    }
    onNext({
      evmWallet: connection?.provider === 'metamask' || connection?.provider === 'coinbase' ? connection.address : '',
      hederaWallet: connection?.provider === 'hashpack' ? connection.address : '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">EVM Wallet (Base, Ethereum, etc.)</h3>
          <p className="text-sm text-gray-500">Connect MetaMask or Coinbase Wallet.</p>
        </div>
        {evmConnected ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="mr-2 h-5 w-5" />
            <span>Connected</span>
          </div>
        ) : (
          <Button onClick={() => connectWallet('metamask')}>Connect EVM Wallet</Button>
        )}
      </div>

      <div className="p-4 border rounded-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Hedera Wallet</h3>
          <p className="text-sm text-gray-500">Connect your HashPack wallet.</p>
        </div>
        {hederaConnected ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="mr-2 h-5 w-5" />
            <span>Connected</span>
          </div>
        ) : (
          <Button onClick={() => connectWallet('hashpack')}>Connect HashPack</Button>
        )}
      </div>

      <Button onClick={handleNext} className="w-full">Next</Button>
    </div>
  );
}
