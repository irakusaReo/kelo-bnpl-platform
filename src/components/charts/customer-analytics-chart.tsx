"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerAnalyticsChartProps {
  data: Array<{
    period: string;
    newCustomers: number;
    activeCustomers: number;
    totalLoans: number;
  }>;
  title?: string;
  description?: string;
}

export function CustomerAnalyticsChart({ 
  data, 
  title = "Customer Analytics", 
  description = "Customer growth and engagement metrics" 
}: CustomerAnalyticsChartProps) {
  const chartData = useMemo(() => {
    return data;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                value,
                name === "newCustomers" ? "New Customers" : 
                name === "activeCustomers" ? "Active Customers" : "Total Loans"
              ]}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey="newCustomers" 
              fill="#3b82f6" 
              name="New Customers"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="activeCustomers" 
              fill="#10b981" 
              name="Active Customers"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}