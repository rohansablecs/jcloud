import {
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { JCloudShell } from "@/components/jcloud/shell"

export default function MachinesPage() {
  return (
    <JCloudShell>
      <div className="space-y-6">
        <section>
          <p className="text-sm text-muted-foreground">
            Virtualization
          </p>

          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Machines
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Access virtual computers running on JCloud.
          </p>
        </section>

        <div className="rounded-xl border bg-background">
          <div className="flex min-h-96 items-center justify-center p-6">
            <div className="max-w-md text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
                <Monitor className="size-6 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-medium">
                No machines available
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Virtual machines will appear here when the
                virtualization service is connected.
              </p>

              <div className="mt-6 flex justify-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Cpu className="size-3.5" />
                  vCPU
                </span>

                <span className="flex items-center gap-1.5">
                  <MemoryStick className="size-3.5" />
                  RAM
                </span>

                <span className="flex items-center gap-1.5">
                  <HardDrive className="size-3.5" />
                  Disk
                </span>
              </div>

              <Button variant="outline" className="mt-6">
                Machine templates
              </Button>
            </div>
          </div>
        </div>
      </div>
    </JCloudShell>
  )
}