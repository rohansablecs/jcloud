"use client"

import {
  Activity,
  ArrowLeft,
  Box,
  CheckCircle2,
  CircleStop,
  Clock3,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Loader2,
  MemoryStick,
  Play,
  RefreshCw,
  Server,
  SquareTerminal,
  Trash2,
  X,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import {
  useEffect,
  useState,
} from "react"

import { JCloudShell } from "@/components/jcloud/shell"

type Port = {
  container: string
  host_ip: string | null
  host: string | null
}

type Mount = {
  type: string
  source: string
  destination: string
  read_only: boolean
}

type Application = {
  id: string
  name: string
  image: string
  status: string
  state: string
  created: string
  ports: Port[]
  labels: Record<string, string>
  command: string[]
  environment: Record<string, string>
  restart_policy: string
  cpu_limit: number | null
  memory_limit: number | null
  mounts: Mount[]
  endpoint_url: string | null
}

type Stats = {
  application_id: string
  cpu_percent: number
  memory_usage: number
  memory_limit: number
  memory_percent: number
}

const API = "/api"

async function api<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API}${path}`,
    {
      ...options,
      credentials: "include",
      cache: "no-store",
    },
  )

  if (!response.ok) {
    let message = `Request failed (${response.status})`

    try {
      const data =
        await response.json()

      if (data?.detail) {
        message = data.detail
      }
    } catch {}

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

function bytes(
  value: number,
) {
  if (!value) {
    return "0 B"
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ]

  let size = value
  let unit = 0

  while (
    size >= 1024 &&
    unit < units.length - 1
  ) {
    size /= 1024
    unit++
  }

  return `${size.toFixed(
    size >= 100 ? 0 : 1,
  )} ${units[unit]}`
}

function date(
  value: string,
) {
  try {
    return new Date(
      value,
    ).toLocaleString()
  } catch {
    return value
  }
}

export default function ApplicationDetailPage() {
  const params =
    useParams<{
      id: string
    }>()

  const router =
    useRouter()

  const id = params.id

  const [
    application,
    setApplication,
  ] =
    useState<Application | null>(
      null,
    )

  const [
    stats,
    setStats,
  ] =
    useState<Stats | null>(
      null,
    )

  const [
    logs,
    setLogs,
  ] =
    useState("")

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    logsLoading,
    setLogsLoading,
  ] =
    useState(false)

  const [
    busy,
    setBusy,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState("")

  async function load() {
    try {
      const app =
        await api<Application>(
          `/applications/${encodeURIComponent(
            id,
          )}`,
        )

      setApplication(app)

      if (
        app.status ===
        "running"
      ) {
        try {
          const liveStats =
            await api<Stats>(
              `/applications/${encodeURIComponent(
                id,
              )}/stats`,
            )

          setStats(
            liveStats,
          )
        } catch {
          setStats(null)
        }
      } else {
        setStats(null)
      }

      setError("")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load application.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return

    load()

    const interval =
      window.setInterval(
        load,
        5000,
      )

    return () =>
      window.clearInterval(
        interval,
      )
  }, [id])

  async function action(
    type:
      | "start"
      | "stop"
      | "restart",
  ) {
    setBusy(true)

    try {
      await api(
        `/applications/${encodeURIComponent(
          id,
        )}/${type}`,
        {
          method: "POST",
        },
      )

      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Action failed.",
      )
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "Delete this application? Persistent storage will remain on the server.",
      )
    ) {
      return
    }

    setBusy(true)

    try {
      await api(
        `/applications/${encodeURIComponent(
          id,
        )}`,
        {
          method: "DELETE",
        },
      )

      router.push(
        "/applications",
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Delete failed.",
      )

      setBusy(false)
    }
  }

  async function loadLogs() {
    setLogsLoading(true)

    try {
      const result =
        await api<{
          logs: string
        }>(
          `/applications/${encodeURIComponent(
            id,
          )}/logs?tail=500`,
        )

      setLogs(
        result.logs,
      )
    } catch (err) {
      setLogs(
        err instanceof Error
          ? err.message
          : "Unable to load logs.",
      )
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return

    loadLogs()
  }, [id])

  if (loading) {
    return (
      <JCloudShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#2563eb]" />
        </div>
      </JCloudShell>
    )
  }

  if (!application) {
    return (
      <JCloudShell>
        <div className="mx-auto max-w-[1500px]">
          <button
            onClick={() =>
              router.push(
                "/applications",
              )
            }
            className="mb-5 flex items-center gap-2 text-xs font-medium text-[#667085]"
          >
            <ArrowLeft className="size-4" />
            Applications
          </button>

          <div className="rounded-xl border border-[#fecaca] bg-[#fff7f7] p-6 text-sm text-[#b42318]">
            {error ||
              "Application not found."}
          </div>
        </div>
      </JCloudShell>
    )
  }

  const running =
    application.status ===
    "running"

  return (
    <JCloudShell>
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <button
          onClick={() =>
            router.push(
              "/applications",
            )
          }
          className="flex items-center gap-2 text-xs font-medium text-[#667085] hover:text-[#2563eb]"
        >
          <ArrowLeft className="size-4" />
          Applications
        </button>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#fecaca] bg-[#fff7f7] px-4 py-3 text-sm text-[#b42318]">
            {error}

            <button
              onClick={() =>
                setError("")
              }
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#eff6ff]">
              <Box className="size-6 text-[#2563eb]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#172033]">
                  {application.name}
                </h1>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    running
                      ? "bg-[#ecfdf3] text-[#027a48]"
                      : "bg-[#f2f4f7] text-[#667085]"
                  }`}
                >
                  {running
                    ? "Running"
                    : "Stopped"}
                </span>
              </div>

              <p className="mt-1 font-mono text-xs text-[#667085]">
                {application.image}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {application.endpoint_url &&
              running && (
                <a
                  href={
                    application.endpoint_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[#dbe7fb] bg-[#f7faff] px-3 text-[11px] font-semibold text-[#2563eb] hover:bg-[#eff6ff]"
                >
                  <ExternalLink className="size-3.5" />
                  Open application
                </a>
              )}

            {running ? (
              <ActionButton
                onClick={() =>
                  action("stop")
                }
                disabled={busy}
                icon={
                  <CircleStop className="size-3.5" />
                }
              >
                Stop
              </ActionButton>
            ) : (
              <ActionButton
                onClick={() =>
                  action("start")
                }
                disabled={busy}
                primary
                icon={
                  <Play className="size-3.5" />
                }
              >
                Start
              </ActionButton>
            )}

            <ActionButton
              onClick={() =>
                action("restart")
              }
              disabled={busy}
              icon={
                <RefreshCw className="size-3.5" />
              }
            >
              Restart
            </ActionButton>

            <ActionButton
              onClick={remove}
              disabled={busy}
              danger
              icon={
                <Trash2 className="size-3.5" />
              }
            >
              Delete
            </ActionButton>
          </div>
        </section>

        {application.endpoint_url && (
          <section className="rounded-xl border border-[#dbe7fb] bg-[#f7faff] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#667085]">
                  Private application endpoint
                </p>

                <p className="mt-1 truncate font-mono text-xs text-[#2563eb]">
                  {
                    application.endpoint_url
                  }
                </p>
              </div>

              {running && (
                <a
                  href={
                    application.endpoint_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] px-3 text-[10px] font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  <ExternalLink className="size-3" />
                  Open
                </a>
              )}
            </div>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={
              <Cpu className="size-4" />
            }
            label="CPU"
            value={
              stats
                ? `${stats.cpu_percent.toFixed(
                    1,
                  )}%`
                : "—"
            }
            detail={
              application.cpu_limit
                ? `Limit ${application.cpu_limit} vCPU`
                : "No explicit limit"
            }
          />

          <StatCard
            icon={
              <MemoryStick className="size-4" />
            }
            label="Memory"
            value={
              stats
                ? bytes(
                    stats.memory_usage,
                  )
                : "—"
            }
            detail={
              stats?.memory_limit
                ? `${bytes(
                    stats.memory_limit,
                  )} limit`
                : "No explicit limit"
            }
          />

          <StatCard
            icon={
              <HardDrive className="size-4" />
            }
            label="Storage"
            value={
              application.mounts
                .length
                ? "Persistent"
                : "Ephemeral"
            }
            detail={
              application.mounts
                .length
                ? `${application.mounts.length} mount`
                : "Container filesystem"
            }
          />

          <StatCard
            icon={
              <Activity className="size-4" />
            }
            label="Memory usage"
            value={
              stats
                ? `${stats.memory_percent.toFixed(
                    1,
                  )}%`
                : "—"
            }
            detail="Live container utilization"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Container"
            icon={
              <Server className="size-4" />
            }
          >
            <Detail
              label="Container ID"
              value={
                application.id
              }
              mono
            />

            <Detail
              label="Created"
              value={date(
                application.created,
              )}
              icon={
                <Clock3 className="size-3.5" />
              }
            />

            <Detail
              label="State"
              value={
                application.state
              }
            />

            <Detail
              label="Restart policy"
              value={
                application.restart_policy
              }
            />

            <Detail
              label="Command"
              value={
                application.command.join(
                  " ",
                ) ||
                "Image default"
              }
              mono
            />
          </Panel>

          <Panel
            title="Networking"
            icon={
              <Activity className="size-4" />
            }
          >
            <div className="mb-4 rounded-lg border border-[#dbe7fb] bg-[#f7faff] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#667085]">
                Network
              </p>

              <p className="mt-1 font-mono text-xs text-[#2563eb]">
                jcloud-apps
              </p>

              <p className="mt-1 text-[10px] leading-4 text-[#667085]">
                No host ports are exposed.
                Traffic is routed through
                the private Traefik gateway.
              </p>
            </div>

            {application.ports.length ===
            0 ? (
              <Empty text="No exposed container ports." />
            ) : (
              <div className="space-y-2">
                {application.ports.map(
                  (
                    port,
                    index,
                  ) => (
                    <div
                      key={`${port.container}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-[#eef0f4] bg-[#fafbfc] px-3 py-2.5"
                    >
                      <span className="font-mono text-xs text-[#344054]">
                        {port.container}
                      </span>

                      <span className="text-xs text-[#98a2b3]">
                        internal
                      </span>

                      <span className="rounded-md bg-[#ecfdf3] px-2 py-1 font-mono text-[10px] font-semibold text-[#027a48]">
                        private
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </Panel>
        </section>

        <Panel
          title="Persistent storage"
          icon={
            <HardDrive className="size-4" />
          }
        >
          {application.mounts.length ===
          0 ? (
            <div className="rounded-lg border border-dashed border-[#d0d5dd] bg-[#fafbfc] p-5 text-center">
              <HardDrive className="mx-auto size-5 text-[#98a2b3]" />

              <p className="mt-2 text-xs font-medium text-[#475467]">
                No persistent storage
                configured
              </p>

              <p className="mt-1 text-[11px] text-[#98a2b3]">
                Data currently lives inside
                the container filesystem.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {application.mounts.map(
                (
                  mount,
                  index,
                ) => (
                  <div
                    key={index}
                    className="rounded-lg border border-[#eef0f4] bg-[#fafbfc] p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                          Server
                        </p>

                        <p className="mt-1 break-all font-mono text-xs text-[#344054]">
                          {
                            mount.source
                          }
                        </p>
                      </div>

                      <div className="hidden text-[#98a2b3] sm:block">
                        →
                      </div>

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                          Container
                        </p>

                        <p className="mt-1 break-all font-mono text-xs text-[#2563eb]">
                          {
                            mount.destination
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[10px] text-[#667085]">
                      <CheckCircle2 className="size-3.5 text-[#12b76a]" />

                      {mount.read_only
                        ? "Read only"
                        : "Read / write"}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </Panel>

        <Panel
          title="Environment"
          icon={
            <Database className="size-4" />
          }
        >
          {Object.keys(
            application.environment,
          ).length === 0 ? (
            <Empty text="No environment variables." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#eef0f4]">
              {Object.entries(
                application.environment,
              ).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 border-b border-[#eef0f4] px-4 py-3 last:border-0 sm:grid-cols-[220px_1fr]"
                  >
                    <span className="font-mono text-[11px] font-semibold text-[#344054]">
                      {key}
                    </span>

                    <span className="mt-1 break-all font-mono text-[11px] text-[#667085] sm:mt-0">
                      {value}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </Panel>

        <Panel
          title="Logs"
          icon={
            <SquareTerminal className="size-4" />
          }
          action={
            <button
              onClick={loadLogs}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e4e8ef] px-2.5 text-[10px] font-semibold text-[#667085] hover:bg-[#f8fafc]"
            >
              <RefreshCw className="size-3" />
              Refresh
            </button>
          }
        >
          <div className="overflow-hidden rounded-xl border border-[#e4e8ef] bg-[#0f172a]">
            <pre className="max-h-[420px] overflow-auto p-4 font-mono text-[11px] leading-5 text-[#dbeafe]">
              {logsLoading
                ? "Loading logs..."
                : logs ||
                  "No logs available."}
            </pre>
          </div>
        </Panel>
      </div>
    </JCloudShell>
  )
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border border-[#e4e8ef] bg-white p-4">
      <div className="flex items-center gap-2 text-[#667085]">
        {icon}

        <span className="text-[11px] font-medium">
          {label}
        </span>
      </div>

      <p className="mt-3 text-xl font-semibold text-[#172033]">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-[#98a2b3]">
        {detail}
      </p>
    </div>
  )
}

function Panel({
  title,
  icon,
  children,
  action,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[#e4e8ef] bg-white">
      <div className="flex items-center justify-between border-b border-[#eef0f4] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-[#667085]">
            {icon}
          </span>

          <h2 className="text-xs font-semibold text-[#172033]">
            {title}
          </h2>
        </div>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  )
}

function Detail({
  label,
  value,
  mono = false,
  icon,
}: {
  label: string
  value: string
  mono?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#eef0f4] py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-1.5 text-[11px] text-[#98a2b3]">
        {icon}
        {label}
      </span>

      <span
        className={`max-w-full break-all text-[11px] text-[#344054] sm:text-right ${
          mono
            ? "font-mono"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function Empty({
  text,
}: {
  text: string
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#d0d5dd] bg-[#fafbfc] p-6 text-center text-[11px] text-[#98a2b3]">
      {text}
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
  danger,
  icon,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  danger?: boolean
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition disabled:opacity-50 ${
        primary
          ? "border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
          : danger
            ? "border-[#fee2e2] text-[#b42318] hover:bg-[#fff7f7]"
            : "border-[#e4e8ef] text-[#475467] hover:bg-[#f8fafc]"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}