"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import {
  ArrowUpRight,
  Database,
  HardDrive,
  Loader2,
  Monitor,
  Rocket,
} from "lucide-react"

import { JCloudShell } from "@/components/jcloud/shell"
import { monitoringApi } from "@/lib/api"

const systems = [
  {
    index: "01",
    name: "STORAGE",
    type: "NEXTCLOUD",
    description: "Private filesystem",
    href: "/storage",
    icon: HardDrive,
  },
  {
    index: "02",
    name: "COMPUTE",
    type: "KVM",
    description: "Virtual machines",
    href: "/machines",
    icon: Monitor,
  },
  {
    index: "03",
    name: "APPLICATIONS",
    type: "DOCKER",
    description: "Container workloads",
    href: "/applications",
    icon: Rocket,
  },
  {
    index: "04",
    name: "DATABASES",
    type: "SERVICES",
    description: "Managed data",
    href: "/databases",
    icon: Database,
  },
]

type SystemStats = {
  cpu?: {
    usage_percent?: number
    load_1m?: number
  }
  memory?: {
    total?: number
    used?: number
    percent?: number
  }
  disk?: {
    total?: number
    used?: number
    percent?: number
  }
  storage?: {
    total?: number
    used?: number
    percent?: number
  }
  network?: {
    rx_bytes?: number
    tx_bytes?: number
  }
}

function formatPercent(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) {
    return "—"
  }

  return `${value.toFixed(1)}%`
}

function formatLoad(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) {
    return "—"
  }

  return value.toFixed(2)
}

function formatGB(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) {
    return "—"
  }

  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`
}

export default function Dashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)

  async function loadTelemetry() {
    try {
      const data = await monitoringApi.system()

      /*
       * monitoringApi returns the API response.
       * The backend response is the SystemStats shape.
       */
      setStats(data as unknown as SystemStats)
      setOnline(true)
    } catch (error) {
      console.error("[JCloud Dashboard]", error)
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTelemetry()

    const interval = window.setInterval(
      loadTelemetry,
      5000
    )

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const cpuLoad = stats?.cpu?.load_1m

  const memoryPercent =
    stats?.memory?.percent

  const storagePercent =
    stats?.disk?.percent ??
    stats?.storage?.percent

  const memoryUsed =
    stats?.memory?.used

  const memoryTotal =
    stats?.memory?.total

  return (
    <JCloudShell>
      <div className="j-scanlines space-y-0">

        {/* INTRO */}

        <section className="grid min-h-[420px] grid-cols-1 border-b border-[#292c2c] lg:grid-cols-[1fr_320px]">

          <div className="relative flex flex-col justify-between border-r border-[#292c2c] py-8 pr-8 lg:py-12">

            <div className="j-label">
              JCLOUD // PRIVATE INFRASTRUCTURE
            </div>

            <div className="py-10 lg:py-0">

              <h1 className="j-display max-w-[850px] text-5xl font-medium uppercase tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                Your own
                <br />
                <span className="text-[#737875]">
                  cloud.
                </span>
              </h1>

              <div className="mt-8 flex max-w-xl items-start gap-4">

                <div className="mt-1 size-2 shrink-0 bg-[#b7ff4a]" />

                <p className="max-w-md font-mono text-[9px] leading-5 text-[#737875]">
                  PRIVATE COMPUTE / STORAGE /
                  APPLICATIONS / DATA.
                  <br />
                  CONTROLLED BY YOU.
                </p>

              </div>

            </div>

            <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#4f5452]">
              NODE / 01 &nbsp;&nbsp; INDIA
            </div>

          </div>


          {/* NODE STATUS */}

          <div className="flex flex-col justify-between py-8 lg:py-12 lg:pl-8">

            <div className="flex justify-between">

              <span className="j-label">
                NODE STATUS
              </span>

              <span
                className={`font-mono text-[9px] ${
                  online
                    ? "text-[#b7ff4a]"
                    : "text-[#737875]"
                }`}
              >
                ● {online ? "ONLINE" : "OFFLINE"}
              </span>

            </div>


            <div>

              <div className="font-mono text-[9px] uppercase text-[#4f5452]">
                Primary node
              </div>

              <div className="mt-2 font-mono text-sm">
                JCLOUD-01
              </div>

              <div className="mt-1 font-mono text-[9px] text-[#737875]">
                Ubuntu Server / KVM
              </div>

            </div>


            {/* LIVE TELEMETRY */}

            <div className="border-t border-[#292c2c] pt-5">

              <div className="flex items-center justify-between">

                <div className="j-label">
                  TELEMETRY
                </div>

                {loading && (
                  <Loader2 className="size-3 animate-spin text-[#4f5452]" />
                )}

              </div>

              <div className="mt-3 font-mono text-[9px] leading-6 text-[#737875]">

                CPU LOAD&nbsp;
                {cpuLoad !== undefined
                  ? formatLoad(cpuLoad)
                  : "WAITING"}

                <br />

                MEMORY&nbsp;&nbsp;
                {memoryPercent !== undefined
                  ? formatPercent(memoryPercent)
                  : "WAITING"}

                <br />

                STORAGE&nbsp;
                {storagePercent !== undefined
                  ? formatPercent(storagePercent)
                  : "WAITING"}

              </div>

            </div>

          </div>

        </section>


        {/* SYSTEMS */}

        <section className="py-10">

          <div className="mb-6 flex items-end justify-between">

            <div>

              <div className="j-label">
                01 — SYSTEMS
              </div>

              <h2 className="mt-2 text-2xl font-medium tracking-tight">
                Infrastructure
              </h2>

            </div>

            <div className="hidden font-mono text-[8px] uppercase text-[#4f5452] sm:block">
              04 SERVICES
            </div>

          </div>


          <div className="grid border-l border-t border-[#292c2c] md:grid-cols-2">

            {systems.map((system) => {

              const Icon = system.icon

              return (
                <Link
                  key={system.href}
                  href={system.href}
                  className="group relative min-h-[250px] border-b border-r border-[#292c2c] p-6 transition-colors hover:bg-[#101212]"
                >

                  <div className="flex items-start justify-between">

                    <span className="font-mono text-[8px] text-[#4f5452]">
                      {system.index}
                    </span>

                    <ArrowUpRight className="size-4 text-[#4f5452] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#b7ff4a]" />

                  </div>

                  <div className="absolute bottom-6 left-6 right-6">

                    <Icon className="mb-5 size-5 text-[#737875]" />

                    <div className="font-mono text-[8px] tracking-[0.15em] text-[#737875]">
                      {system.type}
                    </div>

                    <div className="mt-1 text-2xl font-medium tracking-tight">
                      {system.name}
                    </div>

                    <div className="mt-2 font-mono text-[9px] text-[#4f5452]">
                      {system.description}
                    </div>

                  </div>

                </Link>
              )
            })}

          </div>

        </section>


        {/* TELEMETRY */}

        <section className="border-t border-[#292c2c] py-10">

          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">

            <div>

              <div className="j-label">
                02 — TELEMETRY
              </div>

              <h2 className="mt-2 text-2xl font-medium tracking-tight">
                System health
              </h2>

              <p className="mt-4 max-w-sm font-mono text-[9px] leading-5 text-[#4f5452]">
                Live infrastructure metrics from
                the primary JCloud node.
              </p>

            </div>


            <div className="grid border-l border-t border-[#292c2c] sm:grid-cols-3">

              {[
                [
                  "CPU LOAD",
                  cpuLoad !== undefined
                    ? formatLoad(cpuLoad)
                    : "—",
                ],
                [
                  "MEMORY",
                  memoryPercent !== undefined
                    ? formatPercent(memoryPercent)
                    : "—",
                ],
                [
                  "STORAGE",
                  storagePercent !== undefined
                    ? formatPercent(storagePercent)
                    : "—",
                ],
              ].map(([label, value]) => (

                <div
                  key={label}
                  className="border-b border-r border-[#292c2c] p-6"
                >

                  <div className="j-label">
                    {label}
                  </div>

                  <div className="mt-8 font-mono text-3xl">
                    {value}
                  </div>

                  <div className="mt-2 font-mono text-[8px] uppercase text-[#4f5452]">
                    Live telemetry
                  </div>

                </div>

              ))}

            </div>

          </div>


          {/* MEMORY DETAIL */}

          <div className="mt-6 grid border-l border-t border-[#292c2c] sm:grid-cols-2">

            <div className="border-b border-r border-[#292c2c] p-5">

              <div className="j-label">
                MEMORY ALLOCATION
              </div>

              <div className="mt-3 font-mono text-sm">
                {memoryUsed !== undefined &&
                memoryTotal !== undefined
                  ? `${formatGB(memoryUsed)} / ${formatGB(memoryTotal)}`
                  : "—"}
              </div>

            </div>


            <div className="border-b border-r border-[#292c2c] p-5">

              <div className="j-label">
                REFRESH
              </div>

              <div className="mt-3 font-mono text-sm text-[#737875]">
                5 SECOND INTERVAL
              </div>

            </div>

          </div>

        </section>


        {/* FOOTER */}

        <footer className="flex flex-col gap-5 border-t border-[#292c2c] py-6 font-mono text-[9px] uppercase tracking-[0.12em] text-[#4f5452] sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <span>
              JCLOUD / PRIVATE CLOUD
            </span>

            <span className="text-[#292c2c]">
              /
            </span>

            <span>
              2026
            </span>

          </div>


          <div className="flex items-center gap-5">

            <span className="text-[#737875]">
              Built by Rohan
            </span>

            <span className="text-[#292c2c]">
              /
            </span>

            <a
              href="https://github.com/rohansablecs"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#b7ff4a]"
            >
              GitHub ↗
            </a>

            <a
              href="https://www.linkedin.com/in/rohan-sable-5379643a7"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#b7ff4a]"
            >
              LinkedIn ↗
            </a>

          </div>

        </footer>

      </div>
    </JCloudShell>
  )
}