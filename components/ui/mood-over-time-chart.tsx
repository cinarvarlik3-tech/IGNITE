"use client"

import * as React from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

/** 1–5 scale for the line; labels are illustrative mock data only. */
export type MoodTimeRange = "day" | "week" | "month" | "year" | "all"

type MoodPoint = {
  /** Short x-axis label */
  bucket: string
  /** Numeric mood (mock) */
  score: number
  /** Human-readable mood for tooltip */
  moodName: string
}

const chartConfig = {
  score: {
    label: "Mood",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

const MOCK_BY_RANGE: Record<MoodTimeRange, MoodPoint[]> = {
  day: [
    { bucket: "6a", score: 3.2, moodName: "Reflective" },
    { bucket: "9a", score: 2.4, moodName: "Anxious" },
    { bucket: "12p", score: 3.8, moodName: "Calm" },
    { bucket: "3p", score: 4.1, moodName: "Hopeful" },
    { bucket: "6p", score: 3.5, moodName: "Determined" },
    { bucket: "9p", score: 4.4, moodName: "Hopeful" },
  ],
  week: [
    { bucket: "Mon", score: 3.0, moodName: "Reflective" },
    { bucket: "Tue", score: 2.6, moodName: "Low" },
    { bucket: "Wed", score: 3.4, moodName: "Calm" },
    { bucket: "Thu", score: 2.9, moodName: "Anxious" },
    { bucket: "Fri", score: 4.0, moodName: "Hopeful" },
    { bucket: "Sat", score: 4.3, moodName: "Calm" },
    { bucket: "Sun", score: 3.7, moodName: "Reflective" },
  ],
  month: [
    { bucket: "W1", score: 3.1, moodName: "Calm" },
    { bucket: "W2", score: 2.8, moodName: "Anxious" },
    { bucket: "W3", score: 3.6, moodName: "Determined" },
    { bucket: "W4", score: 4.0, moodName: "Hopeful" },
  ],
  year: [
    { bucket: "Jan", score: 3.0, moodName: "Reflective" },
    { bucket: "Feb", score: 2.7, moodName: "Low" },
    { bucket: "Mar", score: 3.3, moodName: "Calm" },
    { bucket: "Apr", score: 3.9, moodName: "Hopeful" },
    { bucket: "May", score: 3.5, moodName: "Determined" },
    { bucket: "Jun", score: 3.2, moodName: "Reflective" },
    { bucket: "Jul", score: 4.1, moodName: "Hopeful" },
    { bucket: "Aug", score: 3.8, moodName: "Calm" },
    { bucket: "Sep", score: 2.9, moodName: "Anxious" },
    { bucket: "Oct", score: 3.4, moodName: "Calm" },
    { bucket: "Nov", score: 3.6, moodName: "Reflective" },
    { bucket: "Dec", score: 4.0, moodName: "Hopeful" },
  ],
  all: [
    { bucket: "2022", score: 3.0, moodName: "Mixed" },
    { bucket: "2023", score: 3.3, moodName: "Calm" },
    { bucket: "2024", score: 3.6, moodName: "Hopeful" },
    { bucket: "2025", score: 3.5, moodName: "Reflective" },
    { bucket: "2026", score: 3.9, moodName: "Calm" },
  ],
}

const RANGE_OPTIONS: { value: MoodTimeRange; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All time" },
]

export function MoodOverTimeChart({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  const [range, setRange] = React.useState<MoodTimeRange>("week")
  const data = MOCK_BY_RANGE[range]

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col gap-0 border-border bg-card p-5 shadow-none",
        className,
      )}
      {...props}
    >
      <CardHeader className="flex flex-col gap-3 space-y-0 p-0 sm:flex-row sm:items-start sm:justify-between">
        <CardTitle className="text-base font-medium text-text-muted">
          How you were feeling
        </CardTitle>
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Time range"
        >
          {RANGE_OPTIONS.map(({ value, label }) => {
            const active = range === value
            return (
              <Button
                key={value}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 shrink-0 px-2.5 text-xs font-medium",
                  active &&
                    "bg-teal text-primary-foreground hover:bg-teal-dark hover:text-primary-foreground",
                )}
                onClick={() => setRange(value)}
              >
                {label}
              </Button>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0 pt-4">
        <div className="relative min-h-[200px] w-full flex-1">
          <div
            className="absolute inset-0 overflow-hidden rounded-lg ring-1 ring-border ring-inset"
            style={{
              background:
                "linear-gradient(90deg, var(--color-border) 1px, transparent 1px 100%) 0 0 / calc(100% / 6) 100% repeat no-repeat, linear-gradient(180deg, var(--color-border) 1px, transparent 1px 100%) 0 0 / 100% calc(100% / 4) repeat repeat",
            }}
          >
            <ChartContainer
              id="mood-over-time"
              config={chartConfig}
              className="h-full min-h-[200px] w-full [&>div]:aspect-auto [&>div]:h-full"
            >
              <LineChart
                accessibilityLayer
                data={data}
                margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border/40"
                />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-[11px] text-muted-foreground"
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  width={28}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  className="text-[11px] text-muted-foreground"
                />
                <ChartTooltip
                  cursor={{ className: "stroke-border" }}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      hideIndicator
                      formatter={(value, _name, item) => {
                        const row = item.payload as MoodPoint
                        return (
                          <div className="flex w-full flex-col gap-1">
                            <span className="font-medium text-foreground">
                              {row.bucket} · {row.moodName}
                            </span>
                            <span className="text-muted-foreground">
                              Mock score{" "}
                              <span className="font-mono text-foreground">
                                {typeof value === "number"
                                  ? value.toFixed(1)
                                  : String(value)}
                              </span>
                            </span>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-score)"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "var(--color-card)",
                    stroke: "var(--color-score)",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-text-muted">
          Sample data for layout only — not connected to your journal.
        </p>
      </CardContent>
    </Card>
  )
}
