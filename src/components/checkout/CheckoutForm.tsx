"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function CheckoutForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose your payment plan</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup defaultValue="pay-in-4" className="space-y-4">
          <Label
            htmlFor="pay-in-30"
            className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary"
          >
            <RadioGroupItem value="pay-in-30" id="pay-in-30" className="mr-4" />
            <div className="flex-grow">
              <span className="font-semibold">Pay in 30 Days</span>
              <p className="text-sm text-muted-foreground">
                Pay the full amount in 30 days. Interest-free.
              </p>
            </div>
          </Label>
          <Label
            htmlFor="pay-in-4"
            className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary"
          >
            <RadioGroupItem value="pay-in-4" id="pay-in-4" className="mr-4" />
            <div className="flex-grow">
              <span className="font-semibold">Pay in 4</span>
              <p className="text-sm text-muted-foreground">
                4 interest-free installments.
              </p>
            </div>
          </Label>
          <Label
            htmlFor="pay-monthly"
            className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary"
          >
            <RadioGroupItem
              value="pay-monthly"
              id="pay-monthly"
              className="mr-4"
            />
            <div className="flex-grow">
              <span className="font-semibold">Pay Monthly</span>
              <p className="text-sm text-muted-foreground">
                Longer-term plan for larger purchases. Interest applies.
              </p>
            </div>
          </Label>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
