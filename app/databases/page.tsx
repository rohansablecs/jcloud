import {
  Database,
  HardDrive,
  Plus,
  Server,
  Table2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { JCloudShell } from "@/components/jcloud/shell"

export default function DatabasesPage() {
  return (
    <JCloudShell>
      <div className="space-y-8">

        <section className="flex flex-col justify-between gap-6 border-b border-[#292c2c] pb-8 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.18em] text-[#4f5452]">
              <span className="size-1.5 bg-[#b7ff4a]" />
              Data Services / Persistence
            </div>

            <h2 className="mt-4 text-5xl font-medium tracking-[-0.045em]">
              Databases
            </h2>

            <p className="mt-3 max-w-lg font-mono text-[9px] leading-5 text-[#4f5452]">
              Provision and manage application databases.
            </p>

          </div>

          <Button
            className="
              h-10
              rounded-none
              border
              border-[#b7ff4a]
              bg-[#b7ff4a]
              px-4
              font-mono
              text-[9px]
              font-medium
              uppercase
              tracking-[0.1em]
              text-[#080908]
              hover:bg-[#c7ff75]
            "
          >
            <Plus className="mr-2 size-3.5" />
            Create database
          </Button>

        </section>


        <div className="grid grid-cols-2 border-y border-[#292c2c] sm:grid-cols-4">

          <div className="border-r border-[#292c2c] px-5 py-4">
            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Service
            </div>

            <div className="mt-2 font-mono text-[9px] uppercase">
              Database
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
              Not connected
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Storage
            </div>

            <div className="mt-2 font-mono text-[9px] uppercase">
              Managed
            </div>
          </div>

        </div>


        <section>

          <div className="mb-3 flex items-center justify-between">

            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#4f5452]">
              Database instances
            </span>

            <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
              00 instances
            </span>

          </div>

          <div className="border border-[#292c2c] bg-[#090a0a]">

            <div className="flex min-h-[420px] items-center justify-center p-8">

              <div className="max-w-md text-center">

                <div className="mx-auto flex size-14 items-center justify-center border border-[#292c2c]">
                  <Database className="size-5 text-[#4f5452]" />
                </div>

                <div className="mt-6 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e8e8e3]">
                  No databases
                </div>

                <p className="mt-3 font-mono text-[8px] leading-5 text-[#4f5452]">
                  Databases will appear here once the database
                  service is connected.
                </p>

                <div className="mt-7 grid grid-cols-3 border-y border-[#292c2c]">

                  <div className="flex flex-col items-center gap-2 border-r border-[#292c2c] py-4">
                    <Server className="size-3.5 text-[#4f5452]" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#4f5452]">
                      Engine
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2 border-r border-[#292c2c] py-4">
                    <HardDrive className="size-3.5 text-[#4f5452]" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#4f5452]">
                      Storage
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2 py-4">
                    <Table2 className="size-3.5 text-[#4f5452]" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#4f5452]">
                      Data
                    </span>
                  </div>

                </div>

                <Button
                  className="
                    mt-7
                    h-10
                    rounded-none
                    border
                    border-[#b7ff4a]
                    bg-[#b7ff4a]
                    px-4
                    font-mono
                    text-[9px]
                    font-medium
                    uppercase
                    tracking-[0.1em]
                    text-[#080908]
                    hover:bg-[#c7ff75]
                  "
                >
                  Create database
                </Button>

              </div>

            </div>

            <div className="flex items-center justify-between border-t border-[#292c2c] px-5 py-3 font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
              <span>JCLOUD / DATABASE CONTROL</span>
              <span>SERVICE / NOT CONNECTED</span>
            </div>

          </div>

        </section>

      </div>
    </JCloudShell>
  )
}