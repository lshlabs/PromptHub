"use client"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const formatToKoreanUnit = (value: number): string => {
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}억`
  if (value >= 1e4) return `${(value / 1e4).toFixed(1)}만`
  return value.toLocaleString()
}

const chartData = [
  { date: "2022", users: 1000000 },
  { date: "2023", users: 100000000 },
  { date: "2024", users: 300000000 },
  { date: "2025", users: 800000000 },
]

const chartConfig = {
  users: {
    label: "가입자수",
    color: "#8dc6ff",
  },
} satisfies ChartConfig

export function UserGrowthChart() {
  return (
    <div className="w-full h-64 overflow-visible">
      <ChartContainer config={chartConfig} className="h-full w-full overflow-visible">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
            top: 12,
            bottom: 12,
          }}
        >
          <CartesianGrid vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickFormatter={(value) => `${(value / 1e8).toFixed(1)} 억`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
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
                      {formatToKoreanUnit(Number(value))}
                      <span className="text-muted-foreground font-normal">명</span>
                    </div>
                  </>
                )}
              />
            }
          />
          <Area
            dataKey="users"
            type="natural"
            fill={chartConfig.users.color}
            fillOpacity={0.4}
            stroke={chartConfig.users.color}
            strokeWidth={3}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
