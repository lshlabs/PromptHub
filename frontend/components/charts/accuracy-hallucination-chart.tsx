"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "GPT-3.5", correct: 60.4, hallucination: 39.6 },
  { name: "GPT-4", correct: 71.4, hallucination: 28.6 },
  { name: "gemini-2.5-pro", correct: 96.8, hallucination: 3.2 },
  { name: "claude-3.5-sonnet", correct: 97.3, hallucination: 2.7 },
]

const chartConfig = {
  correct: {
    label: "정확응답",
    color: "#8dc6ff",
  },
  hallucination: {
    label: "할루시네이션",
    color: "#2a7eff",
  },
} satisfies ChartConfig

export function AccuracyHallucinationChart() {
  return (
    <div className="w-full h-64 overflow-visible">
      <ChartContainer config={chartConfig} className="h-full w-full overflow-visible">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
            top: 12,
            bottom: 12,
          }}
        >
          <CartesianGrid vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickFormatter={(value) => {
              if (value === "gemini-2.5-pro") return "gemini-2.5"
              if (value === "claude-3.5-sonnet") return "claude-3.5"
              return value
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                className="w-[180px] overflow-visible"
                formatter={(value, name) => (
                  <>
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: chartConfig[name as keyof typeof chartConfig]?.color,
                      }}
                    />
                    {chartConfig[name as keyof typeof chartConfig]?.label || name}
                    <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                      {value}
                      <span className="text-muted-foreground font-normal">%</span>
                    </div>
                  </>
                )}
              />
            }
            cursor={false}
          />
          <Bar dataKey="correct" stackId="a" fill={chartConfig.correct.color} radius={[0, 0, 4, 4]} />
          <Bar dataKey="hallucination" stackId="a" fill={chartConfig.hallucination.color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
