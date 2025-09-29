"use client";

import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    loans: number;
    customers: number;
  }>;
  title?: string;
  description?: string;
}

export function RevenueChart({ data, title = "Revenue Overview", description = "Monthly revenue and loan trends" }: RevenueChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      revenue: item.revenue / 1000, // Convert to thousands for better display
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    return `KES ${(value * 1000).toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `KES ${value}k`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === "revenue" ? formatCurrency(value) : value,
                name === "revenue" ? "Revenue" : name === "loans" ? "Loans" : "Customers"
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="loans" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}