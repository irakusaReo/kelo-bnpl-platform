
import PageHeader from "@/components/layout/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { CryptoStaking } from "@/components/staking/crypto-staking";
import { MpesaStaking } from "@/components/staking/mpesa-staking";

export default function StakingPage() {
  return (
    <>
      <PageHeader
        title="Staking & On-ramp"
        description="Stake your assets or use M-Pesa to on-ramp."
      />
      <Tabs defaultValue="crypto" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="crypto">Crypto Wallet</TabsTrigger>
          <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
        </TabsList>
        <TabsContent value="crypto">
          <CryptoStaking />
        </TabsContent>
        <TabsContent value="mpesa">
          <MpesaStaking />
        </TabsContent>
      </Tabs>
    </>
  );
}
