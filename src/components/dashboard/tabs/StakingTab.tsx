"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StakingTab() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Kelo Staking Pool</CardTitle>
                    <CardDescription>Stake KELO tokens to earn rewards.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Staked</p>
                            <p className="text-2xl font-bold">1,250,000 KELO</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Your Stake</p>
                            <p className="text-2xl font-bold">5,000 KELO</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Annual Percentage Rate (APR)</p>
                            <p className="text-2xl font-bold">12.5%</p>
                        </div>
                        <div className="flex space-x-4">
                            <Button>Stake</Button>
                            <Button variant="outline">Unstake</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
