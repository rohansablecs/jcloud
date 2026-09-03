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
    },
    {
      label: "MEMORY",
      description: "RAM utilization",
      icon: MemoryStick,
      value: stats ? `${stats.memory.percent}%` : "—",
      detail: stats
        ? `${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}`
        : "Waiting for server",
    },
    {
      label: "STORAGE",
      description: "Root disk utilization",
      icon: HardDrive,
      value: stats ? `${stats.storage.percent}%` : "—",
      detail: stats
        ? `${formatBytes(stats.storage.used)} / ${formatBytes(stats.storage.total)}`
        : "Waiting for server",
    },
  ]

  return (
    <JCloudShell>
      <div className="space-y-6">

        <section>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Infrastructure
              </p>

              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                Monitoring
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Live metrics from the JCloud server.
              </p>
            </div>

            <button
              onClick={loadStats}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <RefreshCw className="size-4" />
              Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">

          {cards.map((metric) => {
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

                <div className="mt-8">

                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-semibold tracking-tight">
                      {metric.value}
                    </span>

                    {stats && (
                      <Activity className="mb-1 size-5 text-muted-foreground" />
                    )}
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {metric.detail}
                  </p>

                  {stats && (
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{
                          width: `${
                            metric.label === "MEMORY"
                              ? stats.memory.percent
                              : metric.label === "STORAGE"
                                ? stats.storage.percent
                                : Math.min(
                                    stats.cpu.load_1m * 100,
                                    100
                                  )
                          }%`,
                        }}
                      />
                    </div>
                  )}

                </div>
              </div>
            )
          })}

          {/* NETWORK */}

          <div className="rounded-xl border bg-background p-6">

            <div className="flex items-center gap-3">

              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Network className="size-5" />
              </div>

              <div>
                <h3 className="font-medium">
                  NETWORK
                </h3>

                <p className="text-sm text-muted-foreground">
                  Live network traffic
                </p>
              </div>

            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">

              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowDown className="size-4" />
                  DOWNLOAD
                </div>

                <div className="mt-3 text-2xl font-semibold tracking-tight">
                  {stats
                    ? formatSpeed(networkSpeed.rx)
                    : "—"}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowUp className="size-4" />
                  UPLOAD
                </div>

                <div className="mt-3 text-2xl font-semibold tracking-tight">
                  {stats
                    ? formatSpeed(networkSpeed.tx)
                    : "—"}
                </div>
              </div>

            </div>

            <div className="mt-6 text-xs text-muted-foreground">
              Calculated from live server interface counters.
            </div>

          </div>

        </div>

        <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">

          <span>
            {error
              ? "SERVER OFFLINE"
              : stats
                ? "● SERVER ONLINE"
                : "CONNECTING..."}
          </span>

          <span>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Waiting for telemetry"}
          </span>

        </div>

      </div>
    </JCloudShell>
  )
}