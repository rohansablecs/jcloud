"use client"

import {
  Activity,
  ArrowLeft,
  Check,
  CircleStop,
  Clock3,
  Copy,
  Database,
  FileText,
  HardDrive,
  KeyRound,
  Loader2,
  MemoryStick,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react"
import Link from "next/link"
import { use, useCallback, useEffect, useState } from "react"

import { JCloudShell } from "@/components/jcloud/shell"
import {
  databasesApi,
  type Database as DatabaseItem,
  type DatabaseCredentials as Credentials,
  type DatabaseStats as Stats,
} from "@/lib/api"

function engineLabel(type: DatabaseItem["database_type"]) {
  if (type === "postgresql") return "PostgreSQL"
  if (type === "mysql") return "MySQL"
  return "Redis"
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—"

  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let index = 0

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index++
  }

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function statusIsRunning(database: DatabaseItem) {
  return database.status === "running" || database.state === "running"
}

export default function DatabaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [database, setDatabase] = useState<DatabaseItem | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState("")

  const [loading, setLoading] = useState(true)
  const [loadingCredentials, setLoadingCredentials] = useState(false)

  const [logsOpen, setLogsOpen] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [connectionVisible, setConnectionVisible] = useState(false)

  const [action, setAction] = useState<
    "start" | "stop" | "restart" | "delete" | null
  >(null)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)

  const loadDatabase = useCallback(async () => {
    try {
      const data = await databasesApi.get(id)
      setDatabase(data)
      setError("")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load database.",
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadStats = useCallback(async () => {
    try {
      const data = await databasesApi.stats(id)

      setStats({
        cpu_percent: data.cpu_percent,
        memory_usage: data.memory_usage,
        memory_limit: data.memory_limit,
        memory_percent: data.memory_percent,
      })
    } catch {
      // Best effort.
    }
  }, [id])

  useEffect(() => {
    loadDatabase()
  }, [loadDatabase])

  useEffect(() => {
    if (!database || !statusIsRunning(database)) {
      setStats(null)
      return
    }

    loadStats()

    const interval = window.setInterval(loadStats, 5000)

    return () => window.clearInterval(interval)
  }, [database, loadStats])

  useEffect(() => {
    const interval = window.setInterval(loadDatabase, 5000)

    return () => window.clearInterval(interval)
  }, [loadDatabase])

  useEffect(() => {
    if (!success && !error) return

    const timer = window.setTimeout(() => {
      setSuccess("")
      setError("")
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [success, error])

  async function loadCredentials() {
    if (credentials) {
      setCredentials(null)
      setPasswordVisible(false)
      setConnectionVisible(false)
      return
    }

    setLoadingCredentials(true)
    setError("")

    try {
      const data = await databasesApi.credentials(id)
      setCredentials(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load credentials.",
      )
    } finally {
      setLoadingCredentials(false)
    }
  }

  async function performAction(
    nextAction: "start" | "stop" | "restart",
  ) {
    setError("")
    setSuccess("")
    setAction(nextAction)

    try {
      let data: DatabaseItem

      if (nextAction === "start") {
        data = await databasesApi.start(id)
      } else if (nextAction === "stop") {
        data = await databasesApi.stop(id)
      } else {
        data = await databasesApi.restart(id)
      }

      setDatabase(data)

      setSuccess(
        nextAction === "restart"
          ? "Database restarted successfully."
          : `Database ${nextAction}ed successfully.`,
      )

      if (nextAction !== "stop") {
        setTimeout(loadStats, 1000)
      } else {
        setStats(null)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${nextAction} database.`,
      )
    } finally {
      setAction(null)
    }
  }

  async function deleteDatabase() {
    setError("")
    setSuccess("")
    setAction("delete")

    try {
      await databasesApi.delete(id)

      window.location.href = "/databases"
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete database.",
      )

      setAction(null)
    }
  }

  async function loadLogs() {
    try {
      const data = await databasesApi.logs(id)

      setLogs(data.logs || "")
      setLogsOpen(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load logs.",
      )
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setSuccess("Copied to clipboard.")
    } catch {
      setError("Unable to copy to clipboard.")
    }
  }

  if (loading) {
    return (
      <JCloudShell>
        <div className="mx-auto flex min-h-[60vh] w-full max-w-[1500px] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <Loader2 className="size-4 animate-spin" />
            Loading database…
          </div>
        </div>
      </JCloudShell>
    )
  }

  if (!database) {
    return (
      <JCloudShell>
        <div className="mx-auto w-full max-w-[1500px]">
          <Link
            href="/databases"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#667085] hover:text-[#172033]"
          >
            <ArrowLeft className="size-3.5" />
            Back to databases
          </Link>

          <div className="mt-10 rounded-xl border border-[#e4e8ef] bg-white p-10 text-center">
            <Database className="mx-auto size-7 text-[#98a2b3]" />

            <h1 className="mt-4 text-base font-semibold text-[#172033]">
              Database unavailable
            </h1>

            <p className="mt-2 text-sm text-[#667085]">
              {error || "The requested database could not be found."}
            </p>
          </div>
        </div>
      </JCloudShell>
    )
  }

  const running = statusIsRunning(database)

  return (
    <JCloudShell>
      <div className="mx-auto w-full max-w-[1500px] space-y-7">
        <section>
          <Link
            href="/databases"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#667085] transition hover:text-[#172033]"
          >
            <ArrowLeft className="size-3.5" />
            Databases
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl border border-[#e4e8ef] bg-[#f8fafc] text-xs font-bold text-[#475467]">
                  {database.database_type === "postgresql"
                    ? "PG"
                    : database.database_type === "mysql"
                      ? "MY"
                      : "RD"}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[#172033] sm:text-3xl">
                      {database.name}
                    </h1>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium ${
                        running
                          ? "bg-[#ecfdf3] text-[#067647]"
                          : "bg-[#f2f4f7] text-[#667085]"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          running ? "bg-[#12b76a]" : "bg-[#98a2b3]"
                        }`}
                      />
                      {running ? "Running" : database.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-[#667085]">
                    {engineLabel(database.database_type)} · {database.image}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {running ? (
                <button
                  onClick={() => performAction("stop")}
                  disabled={action !== null}
                  className="flex h-9 items-center gap-2 rounded-lg border border-[#e4e8ef] px-3 text-xs font-semibold text-[#344054] hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  {action === "stop" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CircleStop className="size-3.5" />
                  )}
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => performAction("start")}
                  disabled={action !== null}
                  className="flex h-9 items-center gap-2 rounded-lg border border-[#e4e8ef] px-3 text-xs font-semibold text-[#344054] hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  {action === "start" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                  Start
                </button>
              )}

              <button
                onClick={() => performAction("restart")}
                disabled={action !== null}
                className="flex h-9 items-center gap-2 rounded-lg border border-[#e4e8ef] px-3 text-xs font-semibold text-[#344054] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                {action === "restart" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                Restart
              </button>

              <button
                onClick={loadLogs}
                className="flex h-9 items-center gap-2 rounded-lg border border-[#e4e8ef] px-3 text-xs font-semibold text-[#344054] hover:bg-[#f8fafc]"
              >
                <FileText className="size-3.5" />
                Logs
              </button>

              <button
                onClick={() => setDeleteOpen(true)}
                className="flex h-9 items-center gap-2 rounded-lg border border-[#f1d0cd] px-3 text-xs font-semibold text-[#b42318] hover:bg-[#fff8f8]"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </div>
          </div>
        </section>

        {(error || success) && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-[#f1c7c7] bg-[#fff8f8] text-[#b42318]"
                : "border-[#b7e1c5] bg-[#f6fff8] text-[#18753c]"
            }`}
          >
            {error ? (
              <X className="size-4 shrink-0" />
            ) : (
              <Check className="size-4 shrink-0" />
            )}

            <span className="flex-1">{error || success}</span>

            <button
              onClick={() => {
                setError("")
                setSuccess("")
              }}
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#667085]">CPU</span>
              <Activity className="size-4 text-[#98a2b3]" />
            </div>

            <div className="mt-3 text-2xl font-semibold text-[#172033]">
              {stats ? `${stats.cpu_percent.toFixed(1)}%` : "—"}
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              {database.cpu_limit
                ? `${database.cpu_limit} CPU limit`
                : "No CPU limit"}
            </div>
          </div>

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#667085]">
                Memory
              </span>
              <MemoryStick className="size-4 text-[#98a2b3]" />
            </div>

            <div className="mt-3 text-2xl font-semibold text-[#172033]">
              {stats ? `${stats.memory_percent.toFixed(0)}%` : "—"}
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              {stats
                ? `${formatBytes(stats.memory_usage)} used`
                : database.memory_limit
                  ? formatBytes(database.memory_limit)
                  : "No memory limit"}
            </div>
          </div>

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#667085]">Port</span>
              <Server className="size-4 text-[#98a2b3]" />
            </div>

            <div className="mt-3 text-2xl font-semibold text-[#172033]">
              {database.port}
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              Private Docker network
            </div>
          </div>

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#667085]">
                Storage
              </span>
              <HardDrive className="size-4 text-[#98a2b3]" />
            </div>

            <div className="mt-3 text-2xl font-semibold text-[#172033]">
              {database.mounts.length ? "Persistent" : "Ephemeral"}
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              {database.mounts.length
                ? "Data survives recreation"
                : "Container storage"}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
          <div className="flex flex-col gap-4 border-b border-[#eef1f5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-[#2563eb]" />
                <h2 className="text-sm font-semibold text-[#172033]">
                  Connection
                </h2>
              </div>

              <p className="mt-1 text-xs text-[#98a2b3]">
                Credentials for connecting applications to this database.
              </p>
            </div>

            <button
              onClick={loadCredentials}
              disabled={loadingCredentials}
              className="flex h-8 items-center gap-2 rounded-lg border border-[#e4e8ef] px-3 text-xs font-medium text-[#344054] hover:bg-[#f8fafc]"
            >
              {loadingCredentials ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <KeyRound className="size-3.5" />
              )}

              {credentials ? "Hide credentials" : "Show credentials"}
            </button>
          </div>

          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-b border-[#eef1f5] p-5 sm:border-r">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                Host
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="truncate text-xs font-semibold text-[#344054]">
                  {credentials?.host || database.host}
                </span>

                {credentials?.host && (
                  <button
                    onClick={() => copyText(credentials.host)}
                    className="text-[#98a2b3] hover:text-[#344054]"
                  >
                    <Copy className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="border-b border-[#eef1f5] p-5 lg:border-r">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                Port
              </div>

              <div className="mt-2 text-xs font-semibold text-[#344054]">
                {database.port}
              </div>
            </div>

            <div className="border-b border-[#eef1f5] p-5 sm:border-r lg:border-b-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                Database
              </div>

              <div className="mt-2 truncate text-xs font-semibold text-[#344054]">
                {credentials?.database_name ||
                  database.database_name ||
                  "Redis DB 0"}
              </div>
            </div>

            <div className="border-b border-[#eef1f5] p-5 lg:border-b-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                Username
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="truncate text-xs font-semibold text-[#344054]">
                  {credentials?.username || database.username || "—"}
                </span>

                {credentials?.username && (
                  <button
                    onClick={() =>
                      copyText(credentials.username || "")
                    }
                    className="text-[#98a2b3] hover:text-[#344054]"
                  >
                    <Copy className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {credentials && (
            <div className="border-t border-[#eef1f5] p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                    Password
                  </div>

                  <div className="flex h-10 items-center gap-2 rounded-lg border border-[#e4e8ef] bg-[#fbfcfe] px-3">
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#344054]">
                      {passwordVisible
                        ? credentials.password
                        : "••••••••••••••••••••"}
                    </span>

                    <button
                      onClick={() =>
                        setPasswordVisible(!passwordVisible)
                      }
                      className="shrink-0 text-[11px] font-medium text-[#667085] hover:text-[#172033]"
                    >
                      {passwordVisible ? "Hide" : "Show"}
                    </button>

                    <button
                      onClick={() =>
                        copyText(credentials.password || "")
                      }
                      className="shrink-0 text-[#98a2b3] hover:text-[#344054]"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                    Connection string
                  </div>

                  <div className="flex h-10 items-center gap-2 rounded-lg border border-[#e4e8ef] bg-[#fbfcfe] px-3">
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#344054]">
                      {connectionVisible
                        ? credentials.connection_string
                        : "••••••••••••••••••••••••••"}
                    </span>

                    <button
                      onClick={() =>
                        setConnectionVisible(!connectionVisible)
                      }
                      className="shrink-0 text-[11px] font-medium text-[#667085] hover:text-[#172033]"
                    >
                      {connectionVisible ? "Hide" : "Show"}
                    </button>

                    <button
                      onClick={() =>
                        copyText(
                          credentials.connection_string || "",
                        )
                      }
                      className="shrink-0 text-[#98a2b3] hover:text-[#344054]"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="border-b border-[#eef1f5] px-6 py-5">
              <h2 className="text-sm font-semibold text-[#172033]">
                Instance details
              </h2>
            </div>

            <div className="divide-y divide-[#eef1f5]">
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-2 text-xs text-[#667085]">
                  <Database className="size-3.5" />
                  Engine
                </div>

                <span className="text-xs font-medium text-[#344054]">
                  {engineLabel(database.database_type)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-2 text-xs text-[#667085]">
                  <Server className="size-3.5" />
                  Container
                </div>

                <span className="max-w-[260px] truncate font-mono text-[11px] text-[#344054]">
                  {database.id}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-2 text-xs text-[#667085]">
                  <Clock3 className="size-3.5" />
                  Created
                </div>

                <span className="text-xs text-[#344054]">
                  {new Date(database.created).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-2 text-xs text-[#667085]">
                  <RefreshCw className="size-3.5" />
                  Restart policy
                </div>

                <span className="text-xs font-medium text-[#344054]">
                  {database.restart_policy}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="border-b border-[#eef1f5] px-6 py-5">
              <h2 className="text-sm font-semibold text-[#172033]">
                Storage
              </h2>
            </div>

            {database.mounts.length ? (
              <div className="divide-y divide-[#eef1f5]">
                {database.mounts.map((mount, index) => (
                  <div
                    key={`${mount.source}-${index}`}
                    className="px-6 py-5"
                  >
                    <div className="flex items-center gap-2">
                      <HardDrive className="size-4 text-[#667085]" />

                      <span className="text-xs font-semibold text-[#344054]">
                        Persistent volume
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-[#98a2b3]">
                          Server path
                        </div>

                        <div className="mt-1 break-all font-mono text-[11px] text-[#344054]">
                          {mount.source}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-[#98a2b3]">
                          Container path
                        </div>

                        <div className="mt-1 break-all font-mono text-[11px] text-[#344054]">
                          {mount.destination}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[180px] items-center justify-center px-6 text-center">
                <div>
                  <HardDrive className="mx-auto size-5 text-[#98a2b3]" />

                  <p className="mt-3 text-xs font-medium text-[#344054]">
                    No persistent storage
                  </p>

                  <p className="mt-1 text-[11px] text-[#98a2b3]">
                    Data is stored inside the container.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e4e8ef] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-[#2563eb]" />

              <h2 className="text-sm font-semibold text-[#172033]">
                Networking
              </h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-[#f8fafc] p-4">
                <div className="text-[10px] uppercase tracking-wide text-[#98a2b3]">
                  Network
                </div>

                <div className="mt-2 text-xs font-semibold text-[#344054]">
                  jcloud-databases
                </div>
              </div>

              <div className="rounded-lg bg-[#f8fafc] p-4">
                <div className="text-[10px] uppercase tracking-wide text-[#98a2b3]">
                  Port
                </div>

                <div className="mt-2 text-xs font-semibold text-[#344054]">
                  {database.port}/tcp
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-5 text-[#98a2b3]">
              Database ports are not published directly to the host. They
              remain inside the private Docker network.
            </p>
          </div>

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#2563eb]" />

              <h2 className="text-sm font-semibold text-[#172033]">
                Access
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc]">
                  <KeyRound className="size-3.5 text-[#667085]" />
                </div>

                <div>
                  <div className="text-xs font-medium text-[#344054]">
                    Credentials protected
                  </div>

                  <div className="mt-1 text-[11px] leading-5 text-[#98a2b3]">
                    Credentials are only retrieved through the authenticated
                    JCloud API.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc]">
                  <User className="size-3.5 text-[#667085]" />
                </div>

                <div>
                  <div className="text-xs font-medium text-[#344054]">
                    JCloud managed
                  </div>

                  <div className="mt-1 text-[11px] leading-5 text-[#98a2b3]">
                    This instance is controlled by the JCloud database service.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {logsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/20 px-4 backdrop-blur-[2px]">
          <div className="flex max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-[0_20px_60px_rgba(16,24,40,0.18)]">
            <div className="flex items-center justify-between border-b border-[#eef1f5] px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-[#172033]">
                  Database logs
                </h2>

                <p className="mt-1 text-[11px] text-[#98a2b3]">
                  Latest 300 lines from {database.name}.
                </p>
              </div>

              <button
                onClick={() => setLogsOpen(false)}
                className="rounded-lg p-2 text-[#667085] hover:bg-[#f2f4f7]"
              >
                <X className="size-4" />
              </button>
            </div>

            <pre className="min-h-[400px] flex-1 overflow-auto bg-[#0f172a] p-5 font-mono text-[11px] leading-5 text-[#d7deea]">
              {logs || "No logs available."}
            </pre>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#172033]/20 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-[#e4e8ef] bg-white p-6 shadow-[0_20px_60px_rgba(16,24,40,0.18)]">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#fff1f0]">
              <Trash2 className="size-4 text-[#b42318]" />
            </div>

            <h2 className="mt-5 text-base font-semibold text-[#172033]">
              Delete {database.name}?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#667085]">
              The database container will be removed. Persistent storage is
              not automatically deleted.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={action === "delete"}
                className="h-9 rounded-lg px-4 text-xs font-medium text-[#667085] hover:bg-[#f2f4f7]"
              >
                Cancel
              </button>

              <button
                onClick={deleteDatabase}
                disabled={action === "delete"}
                className="flex h-9 items-center gap-2 rounded-lg bg-[#d92d20] px-4 text-xs font-semibold text-white hover:bg-[#b42318] disabled:opacity-60"
              >
                {action === "delete" && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}

                Delete database
              </button>
            </div>
          </div>
        </div>
      )}
    </JCloudShell>
  )
}