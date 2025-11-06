
import PageHeader from "@/components/layout/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { CryptoStaking } from "@/components/staking/crypto-staking";
import { MpesaStaking } from "@/components/staking/mpesa-staking";
import { Liquidity } from "@/components/staking/liquidity";

export default function StakingPage() {
  return (
    <>
      <PageHeader
        title="Staking, On-ramp & Liquidity"
        description="Stake your assets, use M-Pesa to on-ramp, or provide liquidity."
      />
      <Tabs defaultValue="crypto" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crypto">Crypto Wallet</TabsTrigger>
          <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
        </TabsList>
        <TabsContent value="crypto">
          <CryptoStaking />
        </TabsContent>
        <TabsContent value="mpesa">
          <MpesaStaking />
        </TabsContent>
        <TabsContent value="liquidity">
          <Liquidity />
        </TabsContent>
      </Tabs>
    </>
  );
}
