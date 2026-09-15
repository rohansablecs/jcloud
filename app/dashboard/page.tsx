"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import {
  ArrowRight,
  Database,
  HardDrive,
  Loader2,
  Monitor,
  Rocket,
  Server,
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

type StoragePool = {
  path?: string
  total?: number
  used?: number
  free?: number
  percent?: number
  available?: boolean
}

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
  pools?: {
    nextcloud?: StoragePool
    applications?: StoragePool
    databases?: StoragePool
    vm?: StoragePool
    backups?: StoragePool
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

function poolStatus(pool: StoragePool | undefined) {
  if (!pool) {
    return "WAITING"
  }

  if (pool.available === false) {
    return "UNAVAILABLE"
  }

  return "ONLINE"
}

const poolDefinitions = [
  {
    key: "nextcloud",
    name: "NEXTCLOUD",
    path: "/srv/nextcloud",
  },
  {
    key: "applications",
    name: "APPLICATIONS",
    path: "/srv/applications",
  },
  {
    key: "databases",
    name: "DATABASES",
    path: "/srv/databases",
  },
  {
    key: "vm",
    name: "VIRTUAL MACHINES",
    path: "/srv/vm",
  },
  {
    key: "backups",
    name: "BACKUPS",
    path: "/srv/backups",
  },
] as const

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

  const pools = stats?.pools

  return (
    <JCloudShell>
      <div className="mx-auto w-full max-w-[1500px] space-y-8">

        {/* ─────────────────────────────
            PAGE HEADER
        ───────────────────────────── */}

        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
              <Server className="size-3.5 text-[#2563eb]" />
              Infrastructure
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#172033] sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-[#667085]">
              An overview of your private cloud infrastructure.
            </p>

          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#e4e8ef] bg-white px-3 py-2">

            <span
              className={`size-2 rounded-full ${
                online
                  ? "bg-[#16a34a]"
                  : "bg-[#dc2626]"
              }`}
            />

            <span className="text-xs font-medium text-[#475467]">
              {online
                ? "JCloud is online"
                : "JCloud is offline"}
            </span>

          </div>

        </section>

        {/* ─────────────────────────────
            TELEMETRY
        ───────────────────────────── */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {/* CPU */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="flex items-start justify-between">

              <div>
                <div className="text-sm font-medium text-[#344054]">
                  CPU load
                </div>

                <div className="mt-1 text-xs text-[#98a2b3]">
                  Current system load
                </div>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-[#eff6ff]">
                <Server className="size-4 text-[#2563eb]" />
              </div>

            </div>

            <div className="mt-6 flex items-end justify-between">

              <div className="font-mono text-3xl font-medium tracking-tight text-[#172033]">
                {cpuLoad !== undefined
                  ? formatLoad(cpuLoad)
                  : "—"}
              </div>

              <span className="mb-1 text-xs text-[#98a2b3]">
                1 min
              </span>

            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#eef2f7]">

              <div
                className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.max(
                      (cpuLoad ?? 0) * 25,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* MEMORY */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="flex items-start justify-between">

              <div>
                <div className="text-sm font-medium text-[#344054]">
                  Memory
                </div>

                <div className="mt-1 text-xs text-[#98a2b3]">
                  RAM currently in use
                </div>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-[#fff8e7]">
                <Monitor className="size-4 text-[#d99a16]" />
              </div>

            </div>

            <div className="mt-6 flex items-end justify-between">

              <div className="font-mono text-3xl font-medium tracking-tight text-[#172033]">
                {memoryPercent !== undefined
                  ? formatPercent(memoryPercent)
                  : "—"}
              </div>

              {memoryUsed !== undefined &&
              memoryTotal !== undefined && (
                <span className="mb-1 text-xs text-[#98a2b3]">
                  {formatGB(memoryUsed)} /{" "}
                  {formatGB(memoryTotal)}
                </span>
              )}

            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#eef2f7]">

              <div
                className="h-full rounded-full bg-[#d99a16] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.max(
                      memoryPercent ?? 0,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* STORAGE */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)] sm:col-span-2 xl:col-span-1">

            <div className="flex items-start justify-between">

              <div>
                <div className="text-sm font-medium text-[#344054]">
                  Storage
                </div>

                <div className="mt-1 text-xs text-[#98a2b3]">
                  Primary disk usage
                </div>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-[#ecfdf3]">
                <HardDrive className="size-4 text-[#16a34a]" />
              </div>

            </div>

            <div className="mt-6 flex items-end justify-between">

              <div className="font-mono text-3xl font-medium tracking-tight text-[#172033]">
                {storagePercent !== undefined
                  ? formatPercent(storagePercent)
                  : "—"}
              </div>

              <span className="mb-1 text-xs text-[#98a2b3]">
                System disk
              </span>

            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#eef2f7]">

              <div
                className="h-full rounded-full bg-[#16a34a] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.max(
                      storagePercent ?? 0,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* ─────────────────────────────
            RESOURCES
        ───────────────────────────── */}

        <section>

          <div className="mb-4 flex items-end justify-between">

            <div>

              <h2 className="text-lg font-semibold tracking-tight text-[#172033]">
                Resources
              </h2>

              <p className="mt-1 text-xs text-[#98a2b3]">
                Manage the services running on your node.
              </p>

            </div>

            <span className="hidden text-xs text-[#98a2b3] sm:block">
              4 services
            </span>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {systems.map((system) => {

              const Icon = system.icon

              return (
                <Link
                  key={system.href}
                  href={system.href}
                  className="
                    group
                    rounded-xl
                    border
                    border-[#e4e8ef]
                    bg-white
                    p-5
                    shadow-[0_2px_8px_rgba(16,24,40,0.03)]
                    transition
                    hover:-translate-y-0.5
                    hover:border-[#cbd5e1]
                    hover:shadow-[0_10px_30px_rgba(16,24,40,0.07)]
                  "
                >

                  <div className="flex items-start justify-between">

                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#f7f9fc] transition-colors group-hover:bg-[#eff6ff]">

                      <Icon className="size-5 text-[#667085] transition-colors group-hover:text-[#2563eb]" />

                    </div>

                    <div className="flex size-8 items-center justify-center rounded-lg text-[#98a2b3] transition-colors group-hover:bg-[#eff6ff] group-hover:text-[#2563eb]">

                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />

                    </div>

                  </div>

                  <div className="mt-7">

                    <div className="text-xs font-medium uppercase tracking-wide text-[#98a2b3]">
                      {system.type}
                    </div>

                    <div className="mt-1 text-xl font-semibold tracking-tight text-[#172033]">
                      {system.name}
                    </div>

                    <div className="mt-1 text-sm text-[#667085]">
                      {system.description}
                    </div>

                  </div>

                </Link>
              )
            })}

          </div>

        </section>

        {/* ─────────────────────────────
            STORAGE
        ───────────────────────────── */}

        <section>

          <div className="mb-4 flex items-end justify-between">

            <div>

              <h2 className="text-lg font-semibold tracking-tight text-[#172033]">
                Storage
              </h2>

              <p className="mt-1 text-xs text-[#98a2b3]">
                Storage allocation across your infrastructure.
              </p>

            </div>

            {loading && (
              <Loader2 className="size-4 animate-spin text-[#98a2b3]" />
            )}

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {poolDefinitions.map((definition) => {

              const pool =
                pools?.[definition.key]

              const percent =
                pool?.percent

              const status =
                poolStatus(pool)

              const unavailable =
                pool?.available === false

              return (
                <div
                  key={definition.key}
                  className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex size-9 items-center justify-center rounded-lg bg-[#f7f9fc]">

                        <HardDrive className="size-4 text-[#667085]" />

                      </div>

                      <div>

                        <div className="text-sm font-semibold text-[#172033]">
                          {definition.name}
                        </div>

                        <div className="mt-0.5 text-[10px] text-[#98a2b3]">
                          {definition.path}
                        </div>

                      </div>

                    </div>

                    <div
                      className={`flex items-center gap-1.5 text-[10px] font-medium ${
                        unavailable
                          ? "text-[#dc2626]"
                          : status === "WAITING"
                            ? "text-[#98a2b3]"
                            : "text-[#16a34a]"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          unavailable
                            ? "bg-[#dc2626]"
                            : status === "WAITING"
                              ? "bg-[#98a2b3]"
                              : "bg-[#16a34a]"
                        }`}
                      />

                      {status === "ONLINE"
                        ? "Healthy"
                        : status === "UNAVAILABLE"
                          ? "Unavailable"
                          : "Waiting"}
                    </div>

                  </div>

                  <div className="mt-7 flex items-end justify-between">

                    <span className="font-mono text-2xl font-medium tracking-tight text-[#172033]">
                      {formatPercent(percent)}
                    </span>

                    <span className="text-xs text-[#98a2b3]">
                      used
                    </span>

                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef2f7]">

                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        unavailable
                          ? "bg-[#dc2626]"
                          : percent !== undefined &&
                            percent >= 80
                            ? "bg-[#d99a16]"
                            : "bg-[#2563eb]"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.max(
                            percent ?? 0,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">

                    <span className="text-[#667085]">
                      {pool?.used !== undefined
                        ? formatGB(pool.used)
                        : "—"}{" "}
                      used
                    </span>

                    <span className="text-[#98a2b3]">
                      {pool?.free !== undefined
                        ? formatGB(pool.free)
                        : "—"}{" "}
                      free
                    </span>

                  </div>

                </div>
              )
            })}

          </div>

        </section>

        {/* ─────────────────────────────
            NODE INFORMATION
        ───────────────────────────── */}

        <section className="rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

          <div className="flex flex-col gap-4 border-b border-[#eef1f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-sm font-semibold text-[#172033]">
                Primary node
              </h2>

              <p className="mt-1 text-xs text-[#98a2b3]">
                JCloud infrastructure host
              </p>

            </div>

            <div className="flex items-center gap-2 rounded-full bg-[#ecfdf3] px-3 py-1.5 text-[11px] font-medium text-[#15803d]">

              <span className="size-1.5 rounded-full bg-[#16a34a]" />

              {online
                ? "Operational"
                : "Offline"}

            </div>

          </div>

          <div className="grid sm:grid-cols-3">

            <div className="border-b border-[#eef1f5] p-5 sm:border-b-0 sm:border-r">

              <div className="text-xs text-[#98a2b3]">
                Node
              </div>

              <div className="mt-2 font-mono text-sm text-[#344054]">
                JCLOUD-01
              </div>

            </div>

            <div className="border-b border-[#eef1f5] p-5 sm:border-b-0 sm:border-r">

              <div className="text-xs text-[#98a2b3]">
                Platform
              </div>

              <div className="mt-2 text-sm font-medium text-[#344054]">
                Ubuntu Server / KVM
              </div>

            </div>

            <div className="p-5">

              <div className="text-xs text-[#98a2b3]">
                Telemetry
              </div>

              <div className="mt-2 text-sm font-medium text-[#344054]">
                Updated every 5 seconds
              </div>

            </div>

          </div>

        </section>

        {/* ─────────────────────────────
            FOOTER
        ───────────────────────────── */}

        <footer className="flex flex-col gap-3 border-t border-[#e4e8ef] py-5 text-xs text-[#98a2b3] sm:flex-row sm:items-center sm:justify-between">

          <span>
            Built by Rohan · 2026
          </span>

          <div className="flex items-center gap-4">

            <a
              href="https://github.com/rohansablecs"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#2563eb]"
            >
              GitHub
            </a>

            <span className="text-[#d5dce7]">
              ·
            </span>

            <a
              href="https://www.linkedin.com/in/rohan-sable-5379643a7"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#2563eb]"
            >
              LinkedIn
            </a>

          </div>

        </footer>

      </div>
    </JCloudShell>
  )
}