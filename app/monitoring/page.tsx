"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  ArrowDown,
  ArrowUp,
} from "lucide-react"

import { JCloudShell } from "@/components/jcloud/shell"
import { monitoringApi } from "@/lib/api"

type SystemStats = {
  cpu: {
    load_1m: number
    load_5m: number
    load_15m: number
  }
  memory: {
    total: number
    available: number
    used: number
    percent: number
  }
  storage: {
    total: number
    used: number
    free: number
    percent: number
  }
  network: {
    rx_bytes: number
    tx_bytes: number
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatSpeed(bytesPerSecond: number) {
  return `${formatBytes(bytesPerSecond)}/s`
}

export default function MonitoringPage() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [networkSpeed, setNetworkSpeed] = useState({
    rx: 0,
    tx: 0,
  })

  const [previousNetwork, setPreviousNetwork] = useState<{
    rx: number
    tx: number
    time: number
  } | null>(null)

  async function loadStats() {
    try {
      const data = await monitoringApi.system() as SystemStats

      const now = Date.now()

      if (previousNetwork) {
        const elapsed = (now - previousNetwork.time) / 1000

        if (elapsed > 0) {
          const rx = Math.max(
            0,
            (data.network.rx_bytes - previousNetwork.rx) / elapsed
          )

          const tx = Math.max(
            0,
            (data.network.tx_bytes - previousNetwork.tx) / elapsed
          )

          setNetworkSpeed({
            rx,
            tx,
          })
        }
      }

      setPreviousNetwork({
        rx: data.network.rx_bytes,
        tx: data.network.tx_bytes,
        time: now,
      })

      setStats(data)
      setError("")
      setLastUpdated(new Date())
    } catch (err) {
      console.error(err)
      setError("Unable to reach JCloud server")
    }
  }

  useEffect(() => {
    loadStats()

    const interval = setInterval(loadStats, 5000)

    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      label: "CPU",
      description: "1 minute system load",
      icon: Cpu,
      value: stats ? stats.cpu.load_1m.toFixed(2) : "—",
      detail: stats
        ? `5m ${stats.cpu.load_5m.toFixed(2)} / 15m ${stats.cpu.load_15m.toFixed(2)}`
        : "Waiting for server",
      percentage: stats
        ? Math.min(stats.cpu.load_1m * 100, 100)
        : 0,
    },
    {
      label: "MEMORY",
      description: "RAM utilization",
      icon: MemoryStick,
      value: stats ? `${stats.memory.percent}%` : "—",
      detail: stats
        ? `${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}`
        : "Waiting for server",
      percentage: stats ? stats.memory.percent : 0,
    },
    {
      label: "STORAGE",
      description: "Root disk utilization",
      icon: HardDrive,
      value: stats ? `${stats.storage.percent}%` : "—",
      detail: stats
        ? `${formatBytes(stats.storage.used)} / ${formatBytes(stats.storage.total)}`
        : "Waiting for server",
      percentage: stats ? stats.storage.percent : 0,
    },
  ]

  return (
    <JCloudShell>
      <div className="mx-auto w-full max-w-[1500px] space-y-8">

        {/* HEADER */}

        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">

              <div className="flex size-7 items-center justify-center rounded-lg bg-[#eff6ff]">
                <Activity className="size-3.5 text-[#2563eb]" />
              </div>

              Infrastructure monitoring

            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#172033] sm:text-4xl">
              Monitoring
            </h1>

            <p className="mt-2 max-w-xl text-sm text-[#667085]">
              Live performance and network metrics from your JCloud server.
            </p>

          </div>


          <button
            onClick={loadStats}
            className="
              flex
              h-10
              items-center
              gap-2
              rounded-lg
              border
              border-[#d0d5dd]
              bg-white
              px-4
              text-sm
              font-medium
              text-[#344054]
              shadow-sm
              transition
              hover:bg-[#f7f9fc]
              hover:text-[#172033]
              focus:outline-none
              focus:ring-4
              focus:ring-[#2563eb]/10
            "
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>

        </section>


        {/* STATUS BAR */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TELEMETRY */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="text-xs font-medium text-[#667085]">
              Telemetry
            </div>

            <div className="mt-3 flex items-center gap-2">

              <span
                className={`size-2 rounded-full ${
                  error
                    ? "bg-[#dc2626]"
                    : stats
                      ? "bg-[#16a34a]"
                      : "bg-[#d99a16]"
                }`}
              />

              <span className="text-sm font-semibold text-[#172033]">
                {error
                  ? "Offline"
                  : stats
                    ? "Online"
                    : "Connecting"}
              </span>

            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              JCloud server connection
            </div>

          </div>


          {/* POLLING */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="text-xs font-medium text-[#667085]">
              Polling interval
            </div>

            <div className="mt-3 text-2xl font-semibold tracking-tight text-[#172033]">
              5s
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              Automatic refresh
            </div>

          </div>


          {/* METRICS */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="text-xs font-medium text-[#667085]">
              Metrics
            </div>

            <div className="mt-3 text-2xl font-semibold tracking-tight text-[#172033]">
              04
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              CPU, memory, storage, network
            </div>

          </div>


          {/* LAST UPDATED */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="text-xs font-medium text-[#667085]">
              Last updated
            </div>

            <div className="mt-3 truncate font-mono text-sm font-medium text-[#172033]">
              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "—"}
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              Latest server response
            </div>

          </div>

        </section>


        {/* ERROR */}

        {error && (

          <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3">

            <div className="flex items-center gap-2 text-xs font-semibold text-[#b42318]">

              <span className="size-2 rounded-full bg-[#dc2626]" />

              Unable to reach JCloud server

            </div>

            <p className="mt-1.5 text-xs leading-5 text-[#b42318]/80">
              {error}
            </p>

          </div>

        )}


        {/* SYSTEM RESOURCES */}

        <section>

          <div className="mb-4">

            <h2 className="text-lg font-semibold tracking-tight text-[#172033]">
              System resources
            </h2>

            <p className="mt-1 text-xs text-[#98a2b3]">
              Current resource utilization on the JCloud server.
            </p>

          </div>


          <div className="grid gap-4 md:grid-cols-3">

            {cards.map((metric) => {

              const Icon = metric.icon

              return (

                <div
                  key={metric.label}
                  className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex size-10 items-center justify-center rounded-xl bg-[#eff6ff]">

                        <Icon className="size-4 text-[#2563eb]" />

                      </div>

                      <div>

                        <div className="text-sm font-semibold text-[#172033]">
                          {metric.label}
                        </div>

                        <div className="mt-0.5 text-xs text-[#98a2b3]">
                          {metric.description}
                        </div>

                      </div>

                    </div>


                    {stats && (

                      <div className="flex items-center gap-1.5 rounded-full bg-[#ecfdf3] px-2 py-1 text-[10px] font-medium text-[#15803d]">

                        <span className="size-1.5 rounded-full bg-[#16a34a]" />

                        Live

                      </div>

                    )}

                  </div>


                  <div className="mt-8">

                    <div className="flex items-end justify-between gap-4">

                      <div className="font-mono text-3xl font-medium tracking-[-0.04em] text-[#172033]">
                        {metric.value}
                      </div>

                      <div className="text-right text-[11px] text-[#98a2b3]">
                        {metric.detail}
                      </div>

                    </div>


                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eef2f7]">

                      <div
                        className={`
                          h-full
                          rounded-full
                          transition-all
                          duration-500
                          ${
                            metric.percentage >= 85
                              ? "bg-[#dc2626]"
                              : metric.percentage >= 70
                                ? "bg-[#d99a16]"
                                : "bg-[#2563eb]"
                          }
                        `}
                        style={{
                          width: `${metric.percentage}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

              )
            })}

          </div>

        </section>


        {/* NETWORK */}

        <section>

          <div className="mb-4">

            <h2 className="text-lg font-semibold tracking-tight text-[#172033]">
              Network
            </h2>

            <p className="mt-1 text-xs text-[#98a2b3]">
              Current traffic calculated from server interface counters.
            </p>

          </div>


          <div className="grid gap-4 md:grid-cols-2">

            {/* DOWNLOAD */}

            <div className="rounded-xl border border-[#e4e8ef] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-2 text-sm font-medium text-[#344054]">

                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#eff6ff]">

                      <ArrowDown className="size-4 text-[#2563eb]" />

                    </div>

                    Download

                  </div>

                  <div className="mt-1 text-xs text-[#98a2b3]">
                    Incoming traffic
                  </div>

                </div>


                <Network className="size-4 text-[#98a2b3]" />

              </div>


              <div className="mt-8 font-mono text-3xl font-medium tracking-[-0.04em] text-[#172033]">

                {stats
                  ? formatSpeed(networkSpeed.rx)
                  : "—"}

              </div>


              <div className="mt-2 text-xs text-[#98a2b3]">
                RX / interface aggregate
              </div>

            </div>


            {/* UPLOAD */}

            <div className="rounded-xl border border-[#e4e8ef] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-2 text-sm font-medium text-[#344054]">

                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#f7f9fc]">

                      <ArrowUp className="size-4 text-[#667085]" />

                    </div>

                    Upload

                  </div>

                  <div className="mt-1 text-xs text-[#98a2b3]">
                    Outgoing traffic
                  </div>

                </div>


                <Network className="size-4 text-[#98a2b3]" />

              </div>


              <div className="mt-8 font-mono text-3xl font-medium tracking-[-0.04em] text-[#172033]">

                {stats
                  ? formatSpeed(networkSpeed.tx)
                  : "—"}

              </div>


              <div className="mt-2 text-xs text-[#98a2b3]">
                TX / interface aggregate
              </div>

            </div>

          </div>

        </section>


        {/* SERVER DETAILS */}

        <section className="rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

          <div className="border-b border-[#eef1f5] px-5 py-4">

            <h2 className="text-sm font-semibold text-[#172033]">
              Monitoring details
            </h2>

            <p className="mt-1 text-xs text-[#98a2b3]">
              Information about the current telemetry session.
            </p>

          </div>


          <div className="grid sm:grid-cols-3">

            <div className="border-b border-[#eef1f5] p-5 sm:border-b-0 sm:border-r">

              <div className="text-xs text-[#98a2b3]">
                Data source
              </div>

              <div className="mt-2 text-sm font-medium text-[#344054]">
                JCloud server
              </div>

            </div>


            <div className="border-b border-[#eef1f5] p-5 sm:border-b-0 sm:border-r">

              <div className="text-xs text-[#98a2b3]">
                Update frequency
              </div>

              <div className="mt-2 text-sm font-medium text-[#344054]">
                Every 5 seconds
              </div>

            </div>


            <div className="p-5">

              <div className="text-xs text-[#98a2b3]">
                Connection
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-[#344054]">

                <span
                  className={`size-1.5 rounded-full ${
                    error
                      ? "bg-[#dc2626]"
                      : stats
                        ? "bg-[#16a34a]"
                        : "bg-[#d99a16]"
                  }`}
                />

                {error
                  ? "Unavailable"
                  : stats
                    ? "Connected"
                    : "Connecting"}

              </div>

            </div>

          </div>

        </section>


        {/* FOOTER */}

        <footer className="flex flex-col gap-2 border-t border-[#e4e8ef] py-5 text-xs text-[#98a2b3] sm:flex-row sm:items-center sm:justify-between">

          <span>
            JCloud · Infrastructure monitoring
          </span>

          <span>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Waiting for telemetry"}
          </span>

        </footer>

      </div>
    </JCloudShell>
  )
}