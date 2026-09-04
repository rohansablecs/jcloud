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
      <div className="space-y-8">

        {/* HEADER */}

        <section className="flex flex-col justify-between gap-6 border-b border-[#292c2c] pb-8 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.18em] text-[#4f5452]">
              <span className="size-1.5 bg-[#b7ff4a]" />
              Infrastructure / Telemetry
            </div>

            <h2 className="mt-4 text-5xl font-medium tracking-[-0.045em]">
              Monitoring
            </h2>

            <p className="mt-3 max-w-lg font-mono text-[9px] leading-5 text-[#4f5452]">
              Live metrics from the JCloud server.
            </p>

          </div>

          <button
            onClick={loadStats}
            className="
              flex
              h-10
              items-center
              gap-2
              border
              border-[#353a37]
              bg-[#0b0d0d]
              px-4
              font-mono
              text-[9px]
              uppercase
              tracking-[0.1em]
              text-[#a5aaa7]
              transition-colors
              hover:bg-[#151717]
              hover:text-[#e8e8e3]
            "
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>

        </section>


        {/* SYSTEM STRIP */}

        <div className="grid grid-cols-2 border-y border-[#292c2c] sm:grid-cols-4">

          <div className="border-r border-[#292c2c] px-5 py-4">

            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Telemetry
            </div>

            <div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase">
              <span
                className={`size-1.5 ${
                  error
                    ? "bg-red-400"
                    : stats
                      ? "bg-[#b7ff4a]"
                      : "bg-[#4f5452]"
                }`}
              />

              {error
                ? "Offline"
                : stats
                  ? "Online"
                  : "Connecting"}
            </div>

          </div>

          <div className="border-r border-[#292c2c] px-5 py-4">

            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Polling
            </div>

            <div className="mt-2 font-mono text-[9px] uppercase">
              5 Seconds
            </div>

          </div>

          <div className="border-r border-[#292c2c] px-5 py-4">

            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Metrics
            </div>

            <div className="mt-2 font-mono text-[9px] uppercase">
              04 Active
            </div>

          </div>

          <div className="px-5 py-4">

            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Updated
            </div>

            <div className="mt-2 truncate font-mono text-[9px]">
              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "—"}
            </div>

          </div>

        </div>


        {/* ERROR */}

        {error && (
          <div className="border border-red-900/40 bg-red-950/10 p-4">

            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-red-400">
              <span className="size-1.5 bg-red-400" />
              Server error
            </div>

            <p className="mt-2 font-mono text-[9px] leading-5 text-red-300/70">
              {error}
            </p>

          </div>
        )}


        {/* SYSTEM RESOURCES */}

        <section>

          <div className="mb-3 flex items-center justify-between">

            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#4f5452]">
              System resources
            </span>

            <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
              Live telemetry
            </span>

          </div>

          <div className="grid gap-px border border-[#292c2c] bg-[#292c2c] md:grid-cols-3">

            {cards.map((metric) => {
              const Icon = metric.icon

              return (
                <div
                  key={metric.label}
                  className="bg-[#090a0a] p-5"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex size-9 items-center justify-center border border-[#292c2c] bg-[#0d0f0f]">
                        <Icon className="size-4 text-[#737875]" />
                      </div>

                      <div>

                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#d9dcd9]">
                          {metric.label}
                        </div>

                        <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-[#3f4441]">
                          {metric.description}
                        </div>

                      </div>

                    </div>

                    {stats && (
                      <Activity className="size-3.5 text-[#b7ff4a]" />
                    )}

                  </div>


                  <div className="mt-8">

                    <div className="font-mono text-4xl font-medium tracking-[-0.04em] text-[#e8e8e3]">
                      {metric.value}
                    </div>

                    <div className="mt-3 font-mono text-[8px] text-[#4f5452]">
                      {metric.detail}
                    </div>

                    {stats && (
                      <div className="mt-5 h-px bg-[#292c2c]">
                        <div
                          className="h-px bg-[#b7ff4a] transition-all duration-500"
                          style={{
                            width: `${metric.percentage}%`,
                          }}
                        />
                      </div>
                    )}

                  </div>

                </div>
              )
            })}

          </div>

        </section>


        {/* NETWORK */}

        <section>

          <div className="mb-3 flex items-center justify-between">

            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#4f5452]">
              Network interface
            </span>

            <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
              Live traffic
            </span>

          </div>

          <div className="border border-[#292c2c] bg-[#090a0a]">

            <div className="grid md:grid-cols-2">

              <div className="border-b border-[#292c2c] p-5 md:border-b-0 md:border-r">

                <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.15em] text-[#4f5452]">
                  <ArrowDown className="size-3.5 text-[#b7ff4a]" />
                  Download
                </div>

                <div className="mt-6 font-mono text-3xl font-medium tracking-[-0.04em] text-[#e8e8e3]">
                  {stats
                    ? formatSpeed(networkSpeed.rx)
                    : "—"}
                </div>

                <div className="mt-2 font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
                  RX / Interface aggregate
                </div>

              </div>


              <div className="p-5">

                <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.15em] text-[#4f5452]">
                  <ArrowUp className="size-3.5 text-[#b7ff4a]" />
                  Upload
                </div>

                <div className="mt-6 font-mono text-3xl font-medium tracking-[-0.04em] text-[#e8e8e3]">
                  {stats
                    ? formatSpeed(networkSpeed.tx)
                    : "—"}
                </div>

                <div className="mt-2 font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
                  TX / Interface aggregate
                </div>

              </div>

            </div>

            <div className="border-t border-[#292c2c] px-5 py-3 font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
              Calculated from live server interface counters.
            </div>

          </div>

        </section>


        {/* FOOTER */}

        <div className="flex flex-col justify-between gap-2 border-t border-[#292c2c] pt-4 font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441] sm:flex-row">

          <span>
            JCLOUD / MONITORING CONTROL
          </span>

          <span>
            {error
              ? "SERVER OFFLINE"
              : stats
                ? "SERVER ONLINE"
                : "CONNECTING..."}
          </span>

          <span>
            {lastUpdated
              ? `UPDATED ${lastUpdated.toLocaleTimeString()}`
              : "WAITING FOR TELEMETRY"}
          </span>

        </div>

      </div>
    </JCloudShell>
  )
}