import { MoodDistributionPieChart } from "@/components/ui/mood-distribution-pie-chart"
import { MoodOverTimeChart } from "@/components/ui/mood-over-time-chart"

export default function DashboardScreen() {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 grid-rows-2 gap-4 p-4 md:grid-cols-2 md:grid-rows-2">
      {/* Top-left — mood share (mock) */}
      <div className="min-h-[min(360px,55vh)] md:min-h-0">
        <MoodDistributionPieChart className="h-full min-h-[300px]" />
      </div>

      {/* Top-right — mood chart (mock data only) */}
      <div className="min-h-[min(380px,55vh)] md:min-h-0">
        <MoodOverTimeChart className="h-full min-h-[320px]" />
      </div>

      {/* Bottom row */}
      <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-border bg-card/50 md:min-h-0">
        <p className="text-sm text-text-muted">Coming soon</p>
      </div>
      <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-border bg-card/50 md:min-h-0">
        <p className="text-sm text-text-muted">Coming soon</p>
      </div>
    </div>
  )
}
