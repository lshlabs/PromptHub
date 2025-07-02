"use client"

import { Pie, PieChart, Sector } from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { name: "expensive", value: 52.3, fill: "#8dc6ff" },
  { name: "moderate", value: 34.5, fill: "#2a7eff" },
  { name: "cheap", value: 13.2, fill: "#155dfb" },
]

const chartConfig = {
  expensive: {
    label: "비싸다",
    color: "#8dc6ff",
  },
  moderate: {
    label: "적당하다",
    color: "#2a7eff",
  },
  cheap: {
    label: "저렴하다",
    color: "#155dfb",
  },
} satisfies ChartConfig

export function PriceSatisfactionChart() {
  return (
    <div className="w-full h-64 overflow-visible">
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px] overflow-visible">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                className="w-[150px] overflow-visible"
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
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            strokeWidth={5}
            startAngle={90}
            endAngle={-270}
            activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
              <Sector {...props} outerRadius={outerRadius + 10} />
            )}
          />
        </PieChart>
      </ChartContainer>
    </div>
  )
}
