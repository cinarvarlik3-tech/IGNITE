import { MoodDistributionPieChart } from "@/components/ui/mood-distribution-pie-chart"
import { MoodOverTimeChart } from "@/components/ui/mood-over-time-chart"
import DashboardJournalsCarousel from "@/components/dashboard/DashboardJournalsCarousel"

export default function DashboardScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col py-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 px-2 sm:px-4 md:w-[80%] md:px-0">
        <div className="grid shrink-0 grid-cols-1 content-start gap-4 md:grid-cols-2">
          <div className="min-h-[min(360px,55vh)] md:min-h-0">
            <MoodDistributionPieChart className="h-full min-h-[300px]" />
          </div>
          <div className="min-h-[min(380px,55vh)] md:min-h-0">
            <MoodOverTimeChart className="h-full min-h-[320px]" />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card/80 px-4 py-5 md:px-6">
          <DashboardJournalsCarousel />
        </div>
      </div>
    </div>
  )
}
