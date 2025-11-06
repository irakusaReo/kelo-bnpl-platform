"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Liquidity() {
  const [network, setNetwork] = useState("ethereum");

  return (
    <div>
      <h3 className="text-lg font-medium">Provide Liquidity</h3>
      <p className="text-sm text-gray-500">
        Provide liquidity to earn rewards.
      </p>

      <div className="mt-4">
        <Select value={network} onValueChange={setNetwork}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ethereum">Ethereum</SelectItem>
            <SelectItem value="scroll">Scroll Testnet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {network === "ethereum" && (
          <div>
            {/* TODO: Implement Ethereum liquidity pool UI */}
            <p>Ethereum liquidity pool UI</p>
          </div>
        )}
        {network === "scroll" && (
          <div>
            {/* TODO: Implement Scroll Testnet liquidity pool UI */}
            <p>Scroll Testnet liquidity pool UI</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Button>Provide Liquidity</Button>
      </div>
    </div>
  );
}
