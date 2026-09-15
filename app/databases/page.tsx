"use client"

import {
  Activity,
  AlertCircle,
  Check,
  ChevronRight,
  CircleStop,
  Database,
  Eye,
  HardDrive,
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Server,
  Table2,
  Trash2,
  X,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { JCloudShell } from "@/components/jcloud/shell"

type DatabaseItem = {
  id: string
  name: string
  database_type: "postgresql" | "mysql" | "redis"
  image: string
  status: string
  state: string
  created: string
  port: number
  database_name: string | null
  username: string | null
  restart_policy: string
  cpu_limit: number | null
  memory_limit: number | null
  mounts: {
    type: string | null
    source: string | null
    destination: string | null
    read_only: boolean
  }[]
  host: string
}

type DatabaseStats = {
  cpu_percent: number
  memory_usage: number
  memory_limit: number
  memory_percent: number
}

type DeployForm = {
  name: string
  database_type: "postgresql" | "mysql" | "redis"
  database_name: string
  username: string
  password: string
  cpu_limit: string
  memory_limit: string
  persistent_storage: boolean
  restart_policy: string
}

const emptyForm: DeployForm = {
  name: "",
  database_type: "postgresql",
  database_name: "",
  username: "jcloud",
  password: "",
  cpu_limit: "1",
  memory_limit: "512m",
  persistent_storage: true,
  restart_policy: "unless-stopped",
}

function engineLabel(type: DatabaseItem["database_type"]) {
  if (type === "postgresql") return "PostgreSQL"
  if (type === "mysql") return "MySQL"
  return "Redis"
}

function engineDescription(type: DatabaseItem["database_type"]) {
  if (type === "postgresql") return "Relational database"
  if (type === "mysql") return "Relational database"
  return "In-memory data store"
}

function engineIcon(type: DatabaseItem["database_type"]) {
  if (type === "postgresql") return "PG"
  if (type === "mysql") return "MY"
  return "RD"
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

function isRunning(database: DatabaseItem) {
  return database.status === "running" || database.state === "running"
}

function isStopped(database: DatabaseItem) {
  return (
    database.status === "exited" ||
    database.state === "exited" ||
    database.status === "created" ||
    database.state === "created"
  )
}

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<DatabaseItem[]>([])
  const [stats, setStats] = useState<Record<string, DatabaseStats>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [deploying, setDeploying] = useState(false)

  const [form, setForm] = useState<DeployForm>(emptyForm)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [actionId, setActionId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DatabaseItem | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)

  const loadDatabases = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true)

      try {
        const response = await fetch("/api/databases", {
          credentials: "include",
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Unable to load databases.")
        }

        const data = await response.json()
        setDatabases(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load databases.",
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [],
  )

  const loadStats = useCallback(async (items: DatabaseItem[]) => {
    const running = items.filter(isRunning)

    if (!running.length) {
      setStats({})
      return
    }

    const results = await Promise.all(
      running.map(async (database) => {
        try {
          const response = await fetch(
            `/api/databases/${database.id}/stats`,
            {
              credentials: "include",
              cache: "no-store",
            },
          )

          if (!response.ok) return null

          const data = await response.json()

          return {
            id: database.id,
            stats: {
              cpu_percent: data.cpu_percent,
              memory_usage: data.memory_usage,
              memory_limit: data.memory_limit,
              memory_percent: data.memory_percent,
            },
          }
        } catch {
          return null
        }
      }),
    )

    const nextStats: Record<string, DatabaseStats> = {}

    for (const result of results) {
      if (result) {
        nextStats[result.id] = result.stats
      }
    }

    setStats(nextStats)
  }, [])

  useEffect(() => {
    loadDatabases()
  }, [loadDatabases])

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadDatabases()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [loadDatabases])

  useEffect(() => {
    if (databases.length) {
      loadStats(databases)
    }
  }, [databases, loadStats])

  useEffect(() => {
    if (!success && !error) return

    const timer = window.setTimeout(() => {
      setSuccess("")
      setError("")
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [success, error])

  const runningCount = useMemo(
    () => databases.filter(isRunning).length,
    [databases],
  )

  const persistentCount = useMemo(
    () =>
      databases.filter(
        (database) => database.mounts.length > 0,
      ).length,
    [databases],
  )

  async function deployDatabase() {
    setError("")
    setSuccess("")

    if (!form.name.trim()) {
      setError("Database name is required.")
      return
    }

    if (
      form.database_type !== "redis" &&
      !form.database_name.trim()
    ) {
      setError("Database name is required.")
      return
    }

    setDeploying(true)

    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        database_type: form.database_type,
        persistent_storage: form.persistent_storage,
        restart_policy: form.restart_policy,
      }

      if (form.database_name.trim()) {
        body.database_name = form.database_name.trim()
      }

      if (form.username.trim()) {
        body.username = form.username.trim()
      }

      if (form.password.trim()) {
        body.password = form.password.trim()
      }

      if (form.cpu_limit.trim()) {
        body.cpu_limit = Number(form.cpu_limit)
      }

      if (form.memory_limit.trim()) {
        body.memory_limit = form.memory_limit.trim()
      }

      const response = await fetch("/api/databases", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to deploy database.",
        )
      }

      setModalOpen(false)
      setForm(emptyForm)
      setSuccess(`${engineLabel(data.database_type)} deployed successfully.`)

      await loadDatabases()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to deploy database.",
      )
    } finally {
      setDeploying(false)
    }
  }

  async function performAction(
    database: DatabaseItem,
    action: "start" | "stop" | "restart",
  ) {
    setError("")
    setSuccess("")
    setActionId(database.id)
    setMenuId(null)

    try {
      const response = await fetch(
        `/api/databases/${database.id}/${action}`,
        {
          method: "POST",
          credentials: "include",
        },
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Unable to ${action} database.`,
        )
      }

      await loadDatabases()

      setSuccess(
        `${database.name} ${
          action === "restart"
            ? "restarted"
            : `${action}ed`
        } successfully.`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${action} database.`,
      )
    } finally {
      setActionId(null)
    }
  }

  async function deleteDatabase() {
    if (!deleteTarget) return

    setError("")
    setSuccess("")
    setActionId(deleteTarget.id)

    try {
      const response = await fetch(
        `/api/databases/${deleteTarget.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to delete database.",
        )
      }

      setDatabases((current) =>
        current.filter(
          (database) =>
            database.id !== deleteTarget.id,
        ),
      )

      setDeleteTarget(null)
      setSuccess(
        `${deleteTarget.name} deleted.`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete database.",
      )
    } finally {
      setActionId(null)
    }
  }

  function generatePassword() {
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+"

    let password = ""

    for (let index = 0; index < 24; index++) {
      password +=
        alphabet[
          Math.floor(
            Math.random() * alphabet.length,
          )
        ]
    }

    setForm((current) => ({
      ...current,
      password,
    }))
  }

  return (
    <JCloudShell>
      <div
        className="mx-auto w-full max-w-[1500px] space-y-8"
        onClick={() => setMenuId(null)}
      >
        {/* HEADER */}

        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#eff6ff]">
                <Database className="size-3.5 text-[#2563eb]" />
              </div>

              Data services
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#172033] sm:text-4xl">
              Databases
            </h1>

            <p className="mt-2 max-w-xl text-sm text-[#667085]">
              Provision and manage databases for your
              applications.
            </p>
          </div>

          <Button
            onClick={(event) => {
              event.stopPropagation()
              setError("")
              setModalOpen(true)
            }}
            className="h-10 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] focus:ring-4 focus:ring-[#2563eb]/15"
          >
            <Plus className="mr-2 size-4" />
            Create database
          </Button>
        </section>

        {/* ALERTS */}

        {(error || success) && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-[#f1c7c7] bg-[#fff8f8] text-[#b42318]"
                : "border-[#b7e1c5] bg-[#f6fff8] text-[#18753c]"
            }`}
          >
            {error ? (
              <AlertCircle className="size-4 shrink-0" />
            ) : (
              <Check className="size-4 shrink-0" />
            )}

            <span className="flex-1">
              {error || success}
            </span>

            <button
              onClick={() => {
                setError("")
                setSuccess("")
              }}
              className="rounded p-1 hover:bg-black/5"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* OVERVIEW */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="text-xs font-medium text-[#667085]">
              Service
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#eff6ff]">
                <Database className="size-4 text-[#2563eb]" />
              </div>

              <span className="text-sm font-semibold text-[#172033]">
                Database
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="text-xs font-medium text-[#667085]">
              Instances
            </div>

            <div className="mt-3 text-2xl font-semibold tracking-tight text-[#172033]">
              {String(databases.length).padStart(2, "0")}
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              {runningCount} running
            </div>
          </div>

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="text-xs font-medium text-[#667085]">
              Status
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  runningCount > 0
                    ? "bg-[#16a34a]"
                    : "bg-[#d99a16]"
                }`}
              />

              <span className="text-sm font-semibold text-[#172033]">
                {runningCount > 0
                  ? "Operational"
                  : databases.length
                    ? "Stopped"
                    : "Ready"}
              </span>
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              Database service
            </div>
          </div>

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            <div className="text-xs font-medium text-[#667085]">
              Storage
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#f7f9fc]">
                <HardDrive className="size-4 text-[#667085]" />
              </div>

              <span className="text-sm font-semibold text-[#172033]">
                {persistentCount} persistent
              </span>
            </div>
          </div>
        </section>

        {/* DATABASES */}

        <section>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#172033]">
                Your databases
              </h2>

              <p className="mt-1 text-xs text-[#98a2b3]">
                Database instances provisioned through
                JCloud.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#98a2b3]">
              {refreshing && (
                <Loader2 className="size-3.5 animate-spin" />
              )}

              <span>
                {databases.length}{" "}
                {databases.length === 1
                  ? "instance"
                  : "instances"}
              </span>

              <button
                onClick={() => loadDatabases(true)}
                className="rounded-md p-1.5 text-[#667085] transition hover:bg-[#f2f4f7] hover:text-[#172033]"
                title="Refresh"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
            {loading ? (
              <div className="flex min-h-[420px] items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-[#667085]">
                  <Loader2 className="size-4 animate-spin" />
                  Loading databases…
                </div>
              </div>
            ) : databases.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center px-6 py-16">
                <div className="w-full max-w-md text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#eff6ff]">
                    <Database className="size-6 text-[#2563eb]" />
                  </div>

                  <h3 className="mt-6 text-base font-semibold text-[#172033]">
                    No databases yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#667085]">
                    Create a database to give your
                    applications a managed place to store
                    and work with data.
                  </p>

                  <div className="mt-8 grid overflow-hidden rounded-xl border border-[#e4e8ef] sm:grid-cols-3">
                    <div className="flex flex-col items-center border-b border-[#e4e8ef] p-4 sm:border-b-0 sm:border-r">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[#f7f9fc]">
                        <Server className="size-4 text-[#667085]" />
                      </div>

                      <span className="mt-2 text-xs font-medium text-[#344054]">
                        Engine
                      </span>

                      <span className="mt-1 text-[10px] text-[#98a2b3]">
                        PostgreSQL · MySQL · Redis
                      </span>
                    </div>

                    <div className="flex flex-col items-center border-b border-[#e4e8ef] p-4 sm:border-b-0 sm:border-r">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[#f7f9fc]">
                        <HardDrive className="size-4 text-[#667085]" />
                      </div>

                      <span className="mt-2 text-xs font-medium text-[#344054]">
                        Storage
                      </span>

                      <span className="mt-1 text-[10px] text-[#98a2b3]">
                        Persistent
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-4">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[#f7f9fc]">
                        <Table2 className="size-4 text-[#667085]" />
                      </div>

                      <span className="mt-2 text-xs font-medium text-[#344054]">
                        Data
                      </span>

                      <span className="mt-1 text-[10px] text-[#98a2b3]">
                        Managed
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setError("")
                      setModalOpen(true)
                    }}
                    className="mt-7 h-10 rounded-lg bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] focus:ring-4 focus:ring-[#2563eb]/15"
                  >
                    <Plus className="mr-2 size-4" />
                    Create database
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#eef1f5]">
                {databases.map((database) => {
                  const running = isRunning(database)
                  const databaseStats = stats[database.id]

                  return (
                    <div
                      key={database.id}
                      className="group flex flex-col gap-5 p-5 transition hover:bg-[#fbfcfe] lg:flex-row lg:items-center"
                    >
                      <Link
                        href={`/databases/${database.id}`}
                        className="flex min-w-0 flex-1 items-center gap-4"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#e4e8ef] bg-[#f8fafc] text-[11px] font-bold text-[#475467]">
                          {engineIcon(
                            database.database_type,
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-[#172033]">
                              {database.name}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                running
                                  ? "bg-[#ecfdf3] text-[#067647]"
                                  : "bg-[#f2f4f7] text-[#667085]"
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  running
                                    ? "bg-[#12b76a]"
                                    : "bg-[#98a2b3]"
                                }`}
                              />

                              {running
                                ? "Running"
                                : database.status}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#667085]">
                            <span>
                              {engineLabel(
                                database.database_type,
                              )}
                            </span>

                            <span className="text-[#d0d5dd]">
                              /
                            </span>

                            <span>
                              {database.image}
                            </span>

                            <span className="text-[#d0d5dd]">
                              /
                            </span>

                            <span>
                              :{database.port}
                            </span>
                          </div>
                        </div>
                      </Link>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[430px]">
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                            CPU
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#344054]">
                            <Activity className="size-3.5 text-[#98a2b3]" />
                            {databaseStats
                              ? `${databaseStats.cpu_percent.toFixed(1)}%`
                              : database.cpu_limit
                                ? `${database.cpu_limit} CPU`
                                : "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                            Memory
                          </div>

                          <div className="mt-1 text-xs font-medium text-[#344054]">
                            {databaseStats
                              ? `${databaseStats.memory_percent.toFixed(0)}%`
                              : database.memory_limit
                                ? formatBytes(
                                    database.memory_limit,
                                  )
                                : "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                            Storage
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#344054]">
                            <HardDrive className="size-3.5 text-[#98a2b3]" />
                            {database.mounts.length
                              ? "Persistent"
                              : "Ephemeral"}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                            Database
                          </div>

                          <div className="mt-1 truncate text-xs font-medium text-[#344054]">
                            {database.database_name ||
                              "Redis"}
                          </div>
                        </div>
                      </div>

                      <div
                        className="relative flex shrink-0 items-center gap-1"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        {running ? (
                          <button
                            onClick={() =>
                              performAction(
                                database,
                                "stop",
                              )
                            }
                            disabled={
                              actionId === database.id
                            }
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e4e8ef] px-3 text-xs font-medium text-[#344054] transition hover:bg-[#f8fafc] disabled:opacity-50"
                          >
                            {actionId === database.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CircleStop className="size-3.5" />
                            )}
                            Stop
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              performAction(
                                database,
                                "start",
                              )
                            }
                            disabled={
                              actionId === database.id
                            }
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e4e8ef] px-3 text-xs font-medium text-[#344054] transition hover:bg-[#f8fafc] disabled:opacity-50"
                          >
                            {actionId === database.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Play className="size-3.5" />
                            )}
                            Start
                          </button>
                        )}

                        <Link
                          href={`/databases/${database.id}`}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-[#f2f4f7] px-3 text-xs font-medium text-[#344054] transition hover:bg-[#e9edf2]"
                        >
                          <Eye className="size-3.5" />
                          View
                        </Link>

                        <button
                          onClick={() =>
                            setMenuId(
                              menuId === database.id
                                ? null
                                : database.id,
                            )
                          }
                          className="flex size-8 items-center justify-center rounded-lg border border-[#e4e8ef] text-[#667085] transition hover:bg-[#f8fafc]"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>

                        {menuId === database.id && (
                          <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-[#e4e8ef] bg-white py-1 shadow-[0_8px_30px_rgba(16,24,40,0.12)]">
                            <button
                              onClick={() =>
                                performAction(
                                  database,
                                  "restart",
                                )
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#344054] hover:bg-[#f8fafc]"
                            >
                              <RotateCcw className="size-3.5" />
                              Restart
                            </button>

                            <button
                              onClick={() =>
                                setDeleteTarget(database)
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#b42318] hover:bg-[#fff8f8]"
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <ChevronRight className="hidden size-4 shrink-0 text-[#c0c6d0] lg:block" />
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex flex-col gap-1 border-t border-[#eef1f5] px-5 py-4 text-xs text-[#98a2b3] sm:flex-row sm:items-center sm:justify-between">
              <span>Database services</span>
              <span>
                PostgreSQL · MySQL · Redis
              </span>
            </div>
          </div>
        </section>

        {/* INFORMATION */}

        <section className="rounded-xl border border-[#dbe7fb] bg-[#f7faff] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <Table2 className="size-4 text-[#2563eb]" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#172033]">
                Keep application data separate
              </h3>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#667085]">
                JCloud databases run on an isolated Docker
                network with persistent storage managed
                independently from application containers.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CREATE MODAL */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/20 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-[0_20px_60px_rgba(16,24,40,0.18)]">
            <div className="flex items-center justify-between border-b border-[#eef1f5] px-6 py-5">
              <div>
                <h2 className="text-base font-semibold text-[#172033]">
                  Create database
                </h2>

                <p className="mt-1 text-xs text-[#667085]">
                  Provision an isolated managed database.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-[#667085] hover:bg-[#f2f4f7]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#344054]">
                    Database type
                  </label>

                  <select
                    value={form.database_type}
                    onChange={(event) => {
                      const type =
                        event.target.value as DeployForm["database_type"]

                      setForm((current) => ({
                        ...current,
                        database_type: type,
                        database_name:
                          type === "redis"
                            ? ""
                            : current.database_name,
                        username:
                          type === "redis"
                            ? ""
                            : current.username ||
                              "jcloud",
                      }))
                    }}
                    className="form-input"
                  >
                    <option value="postgresql">
                      PostgreSQL
                    </option>
                    <option value="mysql">
                      MySQL
                    </option>
                    <option value="redis">
                      Redis
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-[#344054]">
                    Instance name
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="postgres-prod"
                    className="form-input"
                  />

                  <p className="mt-1.5 text-[11px] text-[#98a2b3]">
                    Letters, numbers, hyphens and underscores.
                  </p>
                </div>

                {form.database_type !== "redis" && (
                  <>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-[#344054]">
                        Database name
                      </label>

                      <input
                        value={form.database_name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            database_name:
                              event.target.value,
                          }))
                        }
                        placeholder={
                          form.database_type ===
                          "postgresql"
                            ? "myapp"
                            : "myapp"
                        }
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-[#344054]">
                        Username
                      </label>

                      <input
                        value={form.username}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            username:
                              event.target.value,
                          }))
                        }
                        placeholder="jcloud"
                        className="form-input"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-2 block text-xs font-medium text-[#344054]">
                    Password
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.password}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          password:
                            event.target.value,
                        }))
                      }
                      placeholder="Leave empty to generate"
                      className="form-input"
                    />

                    <button
                      type="button"
                      onClick={generatePassword}
                      className="h-10 shrink-0 rounded-lg border border-[#e4e8ef] px-3 text-xs font-medium text-[#344054] hover:bg-[#f8fafc]"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#344054]">
                      CPU limit
                    </label>

                    <input
                      value={form.cpu_limit}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          cpu_limit:
                            event.target.value,
                        }))
                      }
                      placeholder="1"
                      inputMode="decimal"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#344054]">
                      Memory limit
                    </label>

                    <input
                      value={form.memory_limit}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          memory_limit:
                            event.target.value,
                        }))
                      }
                      placeholder="512m"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-[#344054]">
                    Restart policy
                  </label>

                  <select
                    value={form.restart_policy}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        restart_policy:
                          event.target.value,
                      }))
                    }
                    className="form-input"
                  >
                    <option value="unless-stopped">
                      Unless stopped
                    </option>
                    <option value="always">
                      Always
                    </option>
                    <option value="on-failure">
                      On failure
                    </option>
                    <option value="no">
                      Never
                    </option>
                  </select>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e4e8ef] bg-[#fbfcfe] p-4">
                  <div>
                    <div className="text-xs font-semibold text-[#344054]">
                      Persistent storage
                    </div>

                    <div className="mt-1 text-[11px] text-[#98a2b3]">
                      Keep database data across container
                      restarts and recreation.
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.persistent_storage}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        persistent_storage:
                          event.target.checked,
                      }))
                    }
                    className="size-4 accent-[#2563eb]"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#eef1f5] px-6 py-4">
              <button
                onClick={() => setModalOpen(false)}
                disabled={deploying}
                className="h-9 rounded-lg px-4 text-xs font-medium text-[#667085] hover:bg-[#f2f4f7]"
              >
                Cancel
              </button>

              <Button
                onClick={deployDatabase}
                disabled={deploying}
                className="h-9 rounded-lg bg-[#2563eb] px-4 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
              >
                {deploying ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Deploying…
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-3.5" />
                    Deploy database
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#172033]/20 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-[#e4e8ef] bg-white p-6 shadow-[0_20px_60px_rgba(16,24,40,0.18)]">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#fff1f0]">
              <Trash2 className="size-4 text-[#b42318]" />
            </div>

            <h2 className="mt-5 text-base font-semibold text-[#172033]">
              Delete {deleteTarget.name}?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#667085]">
              This removes the database container. Persistent
              files under the database storage directory are
              intentionally left untouched.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={actionId === deleteTarget.id}
                className="h-9 rounded-lg px-4 text-xs font-medium text-[#667085] hover:bg-[#f2f4f7]"
              >
                Cancel
              </button>

              <button
                onClick={deleteDatabase}
                disabled={actionId === deleteTarget.id}
                className="flex h-9 items-center rounded-lg bg-[#d92d20] px-4 text-xs font-semibold text-white hover:bg-[#b42318] disabled:opacity-60"
              >
                {actionId === deleteTarget.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Delete database"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </JCloudShell>
  )
}