"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";

interface CreditScoreDonutProps {
  score: number;
}

const MAX_SCORE = 850;
const COLORS = ["#16a34a", "#e2e8f0"]; // Green for score, Gray for the rest

export function CreditScoreDonut({ score }: CreditScoreDonutProps) {
  const data = [
    { name: "Score", value: score },
    { name: "Remaining", value: MAX_SCORE - score },
  ];

  return (
    <div style={{ width: "100%", height: 120 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={55}
            startAngle={90}
            endAngle={450}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            <Label
              value={score}
              position="center"
              fill="hsl(var(--foreground))"
              className="text-2xl font-bold"
              dy={-5}
            />
            <Label
              value="Credit Score"
              position="center"
              fill="hsl(var(--muted-foreground))"
              className="text-xs"
              dy={15}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
