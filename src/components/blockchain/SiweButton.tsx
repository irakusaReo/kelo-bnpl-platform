"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { getCsrfToken, signIn } from "next-auth/react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SiweButtonProps {
  callbackUrl?: string;
}

export function SiweButton({ callbackUrl = "/dashboard" }: SiweButtonProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal } = useConnectModal();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    setIsLoading(true);
    try {
      const nonce = await getCsrfToken();
      if (!nonce) {
        throw new Error("Failed to get CSRF token.");
      }

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the Kelo app.",
        uri: window.location.origin,
        version: "1",
        chainId: 1, //TODO: make this dynamic
        nonce,
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      const result = await signIn("siwe", {
        message: JSON.stringify(message),
        redirect: false,
        signature,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        window.location.href = callbackUrl;
      }

    } catch (error) {
      console.error("SIWE Error:", error);
      toast({
        title: "Sign-In Failed",
        description: "An error occurred during the sign-in process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleSignIn} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg width="24" height="24" viewBox="0 0 249 249" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
             <path d="M0 19.671C0 12.9332 0 9.56425 1.26956 6.97276C2.48511 4.49151 4.49151 2.48511 6.97276 1.26956C9.56425 0 12.9332 0 19.671 0H229.329C236.067 0 239.436 0 242.027 1.26956C244.508 2.48511 246.515 4.49151 247.73 6.97276C249 9.56425 249 12.9332 249 19.671V229.329C249 236.067 249 239.436 247.73 242.027C246.515 244.508 244.508 246.515 242.027 247.73C239.436 249 236.067 249 229.329 249H19.671C12.9332 249 9.56425 249 6.97276 247.73C4.49151 246.515 2.48511 244.508 1.26956 242.027C0 239.436 0 236.067 0 229.329V19.671Z" fill="#0000FF"/>
        </svg>
      )}
      Sign in with Base
    </Button>
  );
}
