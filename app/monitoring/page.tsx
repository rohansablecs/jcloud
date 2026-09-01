import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
} from "lucide-react"

import { JCloudShell } from "@/components/jcloud/shell"

const metrics = [
  {
    label: "CPU",
    description: "Processor utilization",
    icon: Cpu,
  },
  {
    label: "Memory",
    description: "RAM utilization",
    icon: MemoryStick,
  },
  {
    label: "Storage",
    description: "Disk utilization",
    icon: HardDrive,
  },
  {
    label: "Network",
    description: "Network traffic",
    icon: Network,
  },
]

export default function MonitoringPage() {
  return (
    <JCloudShell>
      <div className="space-y-6">
        <section>
          <p className="text-sm text-muted-foreground">
            Infrastructure
          </p>

          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Monitoring
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Live metrics from the JCloud server.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <div
                key={metric.label}
                className="rounded-xl border bg-background p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" />
                  </div>

                  <div>
                    <h3 className="font-medium">
                      {metric.label}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {metric.description}
                    </p>
                  </div>
                </div>

                <div className="flex min-h-32 items-center justify-center">
                  <div className="text-center">
                    <Activity className="mx-auto size-5 text-muted-foreground" />

                    <p className="mt-2 text-xs text-muted-foreground">
                      Waiting for server connection
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </JCloudShell>
  )
}