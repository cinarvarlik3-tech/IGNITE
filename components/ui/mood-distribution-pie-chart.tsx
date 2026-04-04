"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { MoodKey } from "@/types"

type MoodSlice = {
  mood: MoodKey
  /** Share of time, 0–100 (mock) */
  value: number
}

/**
 * Illustrative distribution only — sums to 100. Not tied to journal data.
 * Colors align with `globals.css` mood tokens.
 */
const MOCK_SLICES: MoodSlice[] = [
  { mood: "calm", value: 26 },
  { mood: "hopeful", value: 21 },
  { mood: "reflective", value: 18 },
  { mood: "anxious", value: 12 },
  { mood: "determined", value: 11 },
  { mood: "low", value: 12 },
]

const MOOD_LABEL: Record<MoodKey, string> = {
  calm: "Calm",
  hopeful: "Hopeful",
  reflective: "Reflective",
  anxious: "Anxious",
  determined: "Determined",
  low: "Low",
}

const chartConfig = {
  calm: { label: MOOD_LABEL.calm, color: "#81C784" },
  hopeful: { label: MOOD_LABEL.hopeful, color: "#F06292" },
  reflective: { label: MOOD_LABEL.reflective, color: "#4FC3F7" },
  anxious: { label: MOOD_LABEL.anxious, color: "#FFB74D" },
  determined: { label: MOOD_LABEL.determined, color: "#7E57C2" },
  low: { label: MOOD_LABEL.low, color: "#90A4AE" },
} satisfies ChartConfig

const RADIAN = Math.PI / 180

function renderSliceLabel(props: {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props
  if (percent < 0.07) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="var(--color-card)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="pointer-events-none text-[11px] font-semibold tabular-nums"
      style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.28)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function MoodDistributionPieChart({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col gap-0 border-border bg-card p-5 shadow-none",
        className,
      )}
      {...props}
    >
      <CardHeader className="space-y-0 p-0">
        <CardTitle className="text-base font-medium text-text-muted">
          How you felt and how much
        </CardTitle>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-0 pt-4">
        <div className="flex min-h-0 flex-1 flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-5">
          {/* Largest square that fits: stays clear of legend (sm+) and card bottom via cqmin */}
          <div className="relative flex min-h-[200px] min-w-0 flex-1 [container-type:size] items-center justify-center px-2 pb-1 pt-2 sm:min-h-0 sm:justify-end sm:px-3 sm:pb-0 sm:pt-0">
            <div
              className="relative aspect-square w-full max-w-full"
              style={{ width: "min(100%, 100cqmin)" }}
            >
              <ChartContainer
                id="mood-distribution"
                config={chartConfig}
                className="absolute inset-0 h-full w-full [&>div]:aspect-auto [&>div]:h-full [&>div]:w-full"
              >
                <PieChart margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, _name, item) => {
                        const row = item.payload as MoodSlice
                        const label = MOOD_LABEL[row.mood]
                        return (
                          <div className="flex w-full items-center justify-between gap-6">
                            <span className="font-medium text-foreground">{label}</span>
                            <span className="font-mono tabular-nums text-foreground">
                              {typeof value === "number"
                                ? `${value}%`
                                : String(value)}
                            </span>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Pie
                  data={MOCK_SLICES}
                  dataKey="value"
                  nameKey="mood"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius="88%"
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="var(--color-card)"
                  label={renderSliceLabel}
                  labelLine={false}
                >
                  {MOCK_SLICES.map((entry) => (
                    <Cell
                      key={entry.mood}
                      fill={`var(--color-${entry.mood})`}
                      className="outline-none transition-opacity hover:opacity-90"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            </div>
          </div>

          <ul
            className="grid w-full shrink-0 grid-cols-2 gap-x-4 gap-y-2.5 pl-1 text-sm sm:w-auto sm:min-w-[188px] sm:pl-4"
            aria-label="Mood percentages"
          >
            {MOCK_SLICES.map((row) => (
              <li
                key={row.mood}
                className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-0 sm:border-0 sm:pb-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm ring-1 ring-border/80"
                    style={{
                      backgroundColor: `var(--color-${row.mood})`,
                    }}
                    aria-hidden
                  />
                  <span className="truncate font-medium text-foreground">
                    {MOOD_LABEL[row.mood]}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.value}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[11px] text-text-muted">
          Sample data for layout only — not connected to your journal.
        </p>
      </CardContent>
    </Card>
  )
}
