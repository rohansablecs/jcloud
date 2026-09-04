import {
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { JCloudShell } from "@/components/jcloud/shell"

export default function MachinesPage() {
  return (
    <JCloudShell>
      <div className="space-y-8">

        <section className="flex flex-col justify-between gap-6 border-b border-[#292c2c] pb-8 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.18em] text-[#4f5452]">
              <span className="size-1.5 bg-[#b7ff4a]" />
              Virtualization / Compute
            </div>

            <h2 className="mt-4 text-5xl font-medium tracking-[-0.045em]">
              Machines
            </h2>

            <p className="mt-3 max-w-lg font-mono text-[9px] leading-5 text-[#4f5452]">
              Access virtual computers running on JCloud.
            </p>

          </div>

          <Button
            variant="outline"
            className="
              h-10
              rounded-none
              border-[#353a37]
              bg-[#0b0d0d]
              px-4
              font-mono
              text-[9px]
              uppercase
              tracking-[0.1em]
              hover:bg-[#151717]
              hover:text-[#e8e8e3]
            "
          >
            <Plus className="mr-2 size-3.5" />
            Create machine
          </Button>

        </section>


        <div className="grid grid-cols-2 border-y border-[#292c2c] sm:grid-cols-4">

          <div className="border-r border-[#292c2c] px-5 py-4">
            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Provider
            </div>

            <div className="mt-2 font-mono text-[9px] uppercase">
              Libvirt / QEMU
            </div>
          </div>

          <div className="border-r border-[#292c2c] px-5 py-4">
            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Instances
            </div>

            <div className="mt-2 font-mono text-[9px]">
              00
            </div>
          </div>

          <div className="border-r border-[#292c2c] px-5 py-4">
            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              State
            </div>

            <div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase">
              <span className="size-1.5 bg-[#4f5452]" />
              Waiting
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Compute
            </div>

            <div className="mt-2 font-mono text-[9px] uppercase">
              Virtual
            </div>
          </div>

        </div>


        <section>

          <div className="mb-3 flex items-center justify-between">

            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#4f5452]">
              Virtual machines
            </span>

            <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
              00 instances
            </span>

          </div>

          <div className="border border-[#292c2c] bg-[#090a0a]">

            <div className="flex min-h-[420px] items-center justify-center p-8">

              <div className="max-w-md text-center">

                <div className="mx-auto flex size-14 items-center justify-center border border-[#292c2c]">
                  <Monitor className="size-5 text-[#4f5452]" />
                </div>

                <div className="mt-6 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e8e8e3]">
                  No machines available
                </div>

                <p className="mt-3 font-mono text-[8px] leading-5 text-[#4f5452]">
                  Virtual machines will appear here when the
                  virtualization service is connected.
                </p>

                <div className="mt-7 flex justify-center gap-5 border-y border-[#292c2c] py-4">

                  <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#4f5452]">
                    <Cpu className="size-3.5" />
                    vCPU
                  </span>

                  <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#4f5452]">
                    <MemoryStick className="size-3.5" />
                    RAM
                  </span>

                  <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#4f5452]">
                    <HardDrive className="size-3.5" />
                    Disk
                  </span>

                </div>

                <Button
                  variant="outline"
                  className="
                    mt-7
                    h-10
                    rounded-none
                    border-[#353a37]
                    bg-[#0b0d0d]
                    px-4
                    font-mono
                    text-[9px]
                    uppercase
                    tracking-[0.1em]
                    hover:bg-[#151717]
                    hover:text-[#e8e8e3]
                  "
                >
                  Machine templates
                </Button>

              </div>

            </div>

            <div className="flex items-center justify-between border-t border-[#292c2c] px-5 py-3 font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
              <span>JCLOUD / MACHINE CONTROL</span>
              <span>NODE / LIBVIRT</span>
            </div>

          </div>

        </section>

      </div>
    </JCloudShell>
  )
}