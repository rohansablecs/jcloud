"use client"

import {
  Activity,
  Box,
  Check,
  ChevronRight,
  CircleStop,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Loader2,
  MemoryStick,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Server,
  SquareTerminal,
  Trash2,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { JCloudShell } from "@/components/jcloud/shell"
import {
  applicationsApi,
  type Application,
  type ApplicationStats as Stats,
} from "@/lib/api"

function formatBytes(
  bytes: number | null | undefined,
) {
  if (!bytes) return "—"

  const units = ["B", "KB", "MB", "GB", "TB"]

  let value = bytes
  let unit = 0

  while (
    value >= 1024 &&
    unit < units.length - 1
  ) {
    value /= 1024
    unit++
  }

  return `${value.toFixed(
    value >= 100 ? 0 : 1,
  )} ${units[unit]}`
}

function statusLabel(status: string) {
  if (status === "running") return "Running"
  if (status === "exited") return "Stopped"
  if (status === "created") return "Created"
  if (status === "restarting") return "Restarting"

  return status || "Unknown"
}

function statusClass(status: string) {
  if (status === "running") {
    return "bg-[#ecfdf3] text-[#027a48]"
  }

  if (status === "exited") {
    return "bg-[#f2f4f7] text-[#667085]"
  }

  return "bg-[#fff7ed] text-[#c2410c]"
}

function portLabel(
  port: Application["ports"][number],
) {
  return port.container.replace("/tcp", "")
}

export default function ApplicationsPage() {
  const [applications, setApplications] =
    useState<Application[]>([])

  const [stats, setStats] =
    useState<Record<string, Stats>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deployOpen, setDeployOpen] = useState(false)
  const [logsOpen, setLogsOpen] =
    useState<string | null>(null)

  const [logs, setLogs] = useState("")
  const [actionBusy, setActionBusy] =
    useState<string | null>(null)

  const [logsLoading, setLogsLoading] =
    useState(false)

  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [command, setCommand] = useState("")
  const [cpu, setCpu] = useState("")
  const [memory, setMemory] = useState("256m")
  const [restart, setRestart] =
    useState("unless-stopped")

  const [persistent, setPersistent] =
    useState(true)

  const [mountPath, setMountPath] =
    useState("/app/data")

  const [ports, setPorts] = useState([
    { container: "80/tcp" },
  ])

  const [environment, setEnvironment] =
    useState([
      {
        key: "",
        value: "",
      },
    ])

  async function loadApplications() {
    try {
      setError("")

      const data =
        await applicationsApi.list()

      setApplications(data)

      const running = data.filter(
        (app) =>
          app.status === "running",
      )

      const results =
        await Promise.allSettled(
          running.map((app) =>
            applicationsApi.stats(app.id),
          ),
        )

      const nextStats: Record<
        string,
        Stats
      > = {}

      results.forEach(
        (result, index) => {
          if (
            result.status ===
            "fulfilled"
          ) {
            nextStats[
              running[index].id
            ] = result.value
          }
        },
      )

      setStats(nextStats)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load applications.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()

    const interval =
      window.setInterval(
        loadApplications,
        5000,
      )

    return () =>
      window.clearInterval(interval)
  }, [])

  async function deploy() {
    if (
      !name.trim() ||
      !image.trim()
    ) {
      return
    }

    setActionBusy("deploy")

    try {
      const cleanPorts =
        ports
          .filter(
            (port) =>
              port.container.trim(),
          )
          .map((port) => ({
            container:
              port.container.trim(),
          }))

      const cleanEnvironment: Record<
        string,
        string
      > = {}

      environment.forEach(
        (item) => {
          if (item.key.trim()) {
            cleanEnvironment[
              item.key.trim()
            ] = item.value
          }
        },
      )

      await applicationsApi.deploy({
        name: name.trim(),
        image: image.trim(),
        command: command.trim()
          ? command
              .trim()
              .split(/\s+/)
          : null,
        environment:
          cleanEnvironment,
        ports: cleanPorts,
        cpu_limit: cpu
          ? Number(cpu)
          : null,
        memory_limit:
          memory.trim()
            ? memory.trim()
            : null,
        persistent_storage:
          persistent,
        mount_path:
          mountPath.trim() ||
          "/app/data",
        restart_policy:
          restart as
            | "no"
            | "always"
            | "on-failure"
            | "unless-stopped",
      })

      setDeployOpen(false)
      resetForm()

      await loadApplications()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Deployment failed.",
      )
    } finally {
      setActionBusy(null)
    }
  }

  function resetForm() {
    setName("")
    setImage("")
    setCommand("")
    setCpu("")
    setMemory("256m")
    setRestart("unless-stopped")
    setPersistent(true)
    setMountPath("/app/data")

    setPorts([
      {
        container: "80/tcp",
      },
    ])

    setEnvironment([
      {
        key: "",
        value: "",
      },
    ])
  }

  async function action(
    id: string,
    type:
      | "start"
      | "stop"
      | "restart",
  ) {
    setActionBusy(
      `${type}:${id}`,
    )

    try {
      if (type === "start") {
        await applicationsApi.start(id)
      } else if (type === "stop") {
        await applicationsApi.stop(id)
      } else {
        await applicationsApi.restart(id)
      }

      await loadApplications()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Application action failed.",
      )
    } finally {
      setActionBusy(null)
    }
  }

  async function remove(id: string) {
    const application =
      applications.find(
        (item) => item.id === id,
      )

    if (
      !window.confirm(
        `Delete ${
          application?.name ??
          "this application"
        }? Persistent storage will remain on the server.`,
      )
    ) {
      return
    }

    setActionBusy(
      `delete:${id}`,
    )

    try {
      await applicationsApi.delete(id)

      await loadApplications()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Delete failed.",
      )
    } finally {
      setActionBusy(null)
    }
  }

  async function openLogs(id: string) {
    setLogsOpen(id)
    setLogsLoading(true)
    setLogs("")

    try {
      const result =
        await applicationsApi.logs(id)

      setLogs(result.logs)
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

  const running =
    applications.filter(
      (app) =>
        app.status === "running",
    ).length

  const stopped =
    applications.filter(
      (app) =>
        app.status === "exited",
    ).length

  const averageCpu =
    useMemo(() => {
      const values =
        Object.values(stats)

      if (!values.length) return 0

      return (
        values.reduce(
          (sum, item) =>
            sum +
            item.cpu_percent,
          0,
        ) / values.length
      )
    }, [stats])

  return (
    <JCloudShell>
      <div className="mx-auto w-full max-w-[1500px] space-y-7">
        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#eff6ff]">
                <Rocket className="size-3.5 text-[#2563eb]" />
              </div>
              Application hosting
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#172033] sm:text-4xl">
              Applications
            </h1>

            <p className="mt-2 max-w-xl text-sm text-[#667085]">
              Deploy and manage containerized
              applications on your private
              infrastructure.
            </p>
          </div>

          <Button
            onClick={() =>
              setDeployOpen(true)
            }
            className="h-10 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
          >
            <Plus className="mr-2 size-4" />
            Deploy application
          </Button>
        </section>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#fecaca] bg-[#fff7f7] px-4 py-3 text-sm text-[#b42318]">
            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
              className="rounded-md p-1 hover:bg-[#fee2e2]"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={
              <Box className="size-4" />
            }
            label="Runtime"
            value="Docker"
            detail="Private container engine"
          />

          <Metric
            icon={
              <Activity className="size-4" />
            }
            label="Running"
            value={String(
              running,
            ).padStart(2, "0")}
            detail={`${applications.length} total deployments`}
          />

          <Metric
            icon={
              <CircleStop className="size-4" />
            }
            label="Stopped"
            value={String(
              stopped,
            ).padStart(2, "0")}
            detail="Containers currently stopped"
          />

          <Metric
            icon={
              <Cpu className="size-4" />
            }
            label="CPU"
            value={`${averageCpu.toFixed(
              1,
            )}%`}
            detail="Average live utilization"
          />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#172033]">
                Your applications
              </h2>

              <p className="mt-1 text-xs text-[#667085]">
                Containers managed by JCloud.
              </p>
            </div>

            <button
              onClick={
                loadApplications
              }
              className="flex h-9 items-center gap-2 rounded-lg border border-[#e4e8ef] bg-white px-3 text-xs font-medium text-[#475467] hover:bg-[#f8fafc]"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-[#e4e8ef] bg-white">
              <Loader2 className="size-5 animate-spin text-[#2563eb]" />
            </div>
          ) : applications.length ===
            0 ? (
            <div className="rounded-xl border border-dashed border-[#d0d5dd] bg-white px-6 py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#eff6ff]">
                <Rocket className="size-5 text-[#2563eb]" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-[#172033]">
                No applications yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#667085]">
                Deploy your first Docker
                application and manage it
                directly from JCloud.
              </p>

              <Button
                onClick={() =>
                  setDeployOpen(true)
                }
                className="mt-5 h-9 rounded-lg bg-[#2563eb] px-4 text-xs font-semibold text-white"
              >
                <Plus className="mr-2 size-3.5" />
                Deploy application
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(
                (app) => {
                  const stat =
                    stats[app.id]

                  const busy =
                    actionBusy?.endsWith(
                      `:${app.id}`,
                    )

                  return (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      stats={stat}
                      busy={busy}
                      onStart={() =>
                        action(
                          app.id,
                          "start",
                        )
                      }
                      onStop={() =>
                        action(
                          app.id,
                          "stop",
                        )
                      }
                      onRestart={() =>
                        action(
                          app.id,
                          "restart",
                        )
                      }
                      onDelete={() =>
                        remove(app.id)
                      }
                      onLogs={() =>
                        openLogs(app.id)
                      }
                    />
                  )
                },
              )}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <InfoCard
            icon={
              <HardDrive className="size-4" />
            }
            title="Persistent storage"
            text="Application data can live outside the container lifecycle."
          />

          <InfoCard
            icon={
              <Server className="size-4" />
            }
            title="Private networking"
            text="Applications stay inside the JCloud Docker network and are routed through Traefik."
          />

          <InfoCard
            icon={
              <Database className="size-4" />
            }
            title="Managed runtime"
            text="JCloud handles deployment, lifecycle and resource limits."
          />
        </section>
      </div>

      {deployOpen && (
        <Modal
          title="Deploy application"
          onClose={() => {
            setDeployOpen(false)
            resetForm()
          }}
        >
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Application name"
                value={name}
                onChange={setName}
                placeholder="my-app"
              />

              <Field
                label="Docker image"
                value={image}
                onChange={setImage}
                placeholder="nginx:alpine"
              />
            </div>

            <Field
              label="Command"
              value={command}
              onChange={setCommand}
              placeholder="Leave empty to use image default"
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="CPU limit"
                value={cpu}
                onChange={setCpu}
                placeholder="0.5"
              />

              <Field
                label="Memory limit"
                value={memory}
                onChange={setMemory}
                placeholder="256m"
              />

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#344054]">
                  Restart policy
                </label>

                <select
                  value={restart}
                  onChange={(
                    event,
                  ) =>
                    setRestart(
                      event.target
                        .value,
                    )
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
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#344054]">
                    HTTP / internal ports
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#98a2b3]">
                    Ports exposed inside the private application network.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setPorts([
                      ...ports,
                      {
                        container: "",
                      },
                    ])
                  }
                  className="text-xs font-semibold text-[#2563eb]"
                >
                  + Add port
                </button>
              </div>

              <div className="space-y-2">
                {ports.map(
                  (
                    port,
                    index,
                  ) => (
                    <div
                      key={index}
                      className="flex gap-2"
                    >
                      <input
                        className="form-input"
                        value={
                          port.container
                        }
                        placeholder="80/tcp"
                        onChange={(
                          event,
                        ) => {
                          const next =
                            [
                              ...ports,
                            ]

                          next[
                            index
                          ].container =
                            event.target.value

                          setPorts(
                            next,
                          )
                        }}
                      />

                      {ports.length >
                        1 && (
                        <button
                          onClick={() =>
                            setPorts(
                              ports.filter(
                                (
                                  _,
                                  i,
                                ) =>
                                  i !==
                                  index,
                              ),
                            )
                          }
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#e4e8ef] text-[#98a2b3] hover:bg-[#f8fafc]"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  ),
                )}
              </div>

              <div className="mt-2 rounded-lg bg-[#f8fafc] px-3 py-2.5 text-[10px] leading-4 text-[#667085]">
                No host ports are opened.
                JCloud routes the application
                privately through
                <span className="font-mono text-[#2563eb]">
                  {" "}
                  /apps/&lt;name&gt;
                </span>
                .
              </div>
            </div>

            <div className="rounded-xl border border-[#dbe7fb] bg-[#f7faff] p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPersistent(
                      !persistent,
                    )
                  }
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${
                    persistent
                      ? "border-[#2563eb] bg-[#2563eb] text-white"
                      : "border-[#d0d5dd] bg-white"
                  }`}
                >
                  {persistent && (
                    <Check className="size-3.5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#172033]">
                    Persistent storage
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[#667085]">
                    Keep application data even if
                    the container is deleted or
                    recreated.
                  </p>

                  {persistent && (
                    <div className="mt-3">
                      <label className="mb-1.5 block text-[11px] font-medium text-[#344054]">
                        Container mount path
                      </label>

                      <input
                        className="form-input"
                        value={
                          mountPath
                        }
                        onChange={(
                          event,
                        ) =>
                          setMountPath(
                            event.target
                              .value,
                          )
                        }
                        placeholder="/app/data"
                      />

                      <p className="mt-1.5 text-[10px] text-[#98a2b3]">
                        Stored on the server under /srv/applications/{name || "<name>"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#344054]">
                    Environment
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#98a2b3]">
                    Values containing secrets are masked in JCloud.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEnvironment([
                      ...environment,
                      {
                        key: "",
                        value: "",
                      },
                    ])
                  }
                  className="text-xs font-semibold text-[#2563eb]"
                >
                  + Add variable
                </button>
              </div>

              <div className="space-y-2">
                {environment.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      key={index}
                      className="flex gap-2"
                    >
                      <input
                        className="form-input"
                        value={
                          item.key
                        }
                        placeholder="VARIABLE"
                        onChange={(
                          event,
                        ) => {
                          const next =
                            [
                              ...environment,
                            ]

                          next[
                            index
                          ].key =
                            event.target.value

                          setEnvironment(
                            next,
                          )
                        }}
                      />

                      <input
                        className="form-input"
                        value={
                          item.value
                        }
                        placeholder="value"
                        onChange={(
                          event,
                        ) => {
                          const next =
                            [
                              ...environment,
                            ]

                          next[
                            index
                          ].value =
                            event.target.value

                          setEnvironment(
                            next,
                          )
                        }}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#eef0f4] pt-4">
              <button
                onClick={() => {
                  setDeployOpen(false)
                  resetForm()
                }}
                className="h-10 rounded-lg border border-[#e4e8ef] px-4 text-xs font-semibold text-[#475467] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>

              <Button
                disabled={
                  !name.trim() ||
                  !image.trim() ||
                  actionBusy ===
                    "deploy"
                }
                onClick={deploy}
                className="h-10 rounded-lg bg-[#2563eb] px-5 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
              >
                {actionBusy ===
                "deploy" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 size-4" />
                    Deploy
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {logsOpen && (
        <Modal
          title={`Logs — ${
            applications.find(
              (app) =>
                app.id ===
                logsOpen,
            )?.name ??
            "Application"
          }`}
          onClose={() =>
            setLogsOpen(null)
          }
          wide
        >
          <div className="overflow-hidden rounded-xl border border-[#e4e8ef] bg-[#0f172a]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[11px] text-white/50">
              <SquareTerminal className="size-3.5" />
              Last 300 lines
            </div>

            <pre className="max-h-[60vh] overflow-auto p-4 font-mono text-[11px] leading-5 text-[#dbeafe]">
              {logsLoading
                ? "Loading logs..."
                : logs ||
                  "No logs available."}
            </pre>
          </div>
        </Modal>
      )}
    </JCloudShell>
  )
}

function Metric({
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
    <div className="rounded-xl border border-[#e4e8ef] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.02)]">
      <div className="flex items-center gap-2 text-[#667085]">
        {icon}
        <span className="text-[11px] font-medium">
          {label}
        </span>
      </div>

      <div className="mt-3 text-xl font-semibold tracking-[-0.02em] text-[#172033]">
        {value}
      </div>

      <p className="mt-1 text-[10px] text-[#98a2b3]">
        {detail}
      </p>
    </div>
  )
}

function ApplicationCard({
  application,
  stats,
  busy,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onLogs,
}: {
  application: Application
  stats?: Stats
  busy?: boolean
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onDelete: () => void
  onLogs: () => void
}) {
  const running =
    application.status ===
    "running"

  return (
    <div className="group rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.02)] transition hover:border-[#cfd8e8]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff]">
              <Box className="size-5 text-[#2563eb]" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-[#172033]">
                  {application.name}
                </h3>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(
                    application.status,
                  )}`}
                >
                  {statusLabel(
                    application.status,
                  )}
                </span>
              </div>

              <p className="mt-1 truncate font-mono text-[11px] text-[#98a2b3]">
                {application.image}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-[#667085]">
            <span className="flex items-center gap-1.5">
              <Cpu className="size-3.5" />

              {stats
                ? `${stats.cpu_percent.toFixed(
                    1,
                  )}%`
                : "—"}
            </span>

            <span className="flex items-center gap-1.5">
              <MemoryStick className="size-3.5" />

              {stats
                ? formatBytes(
                    stats.memory_usage,
                  )
                : "—"}
            </span>

            {application.ports.length >
              0 && (
              <span className="flex items-center gap-1.5 font-mono">
                <Activity className="size-3.5" />
                :{portLabel(
                  application
                    .ports[0],
                )}
              </span>
            )}

            {application.mounts
              .length > 0 && (
              <span className="flex items-center gap-1.5 text-[#2563eb]">
                <HardDrive className="size-3.5" />
                Persistent
              </span>
            )}
          </div>

          {application.endpoint_url && (
            <div className="mt-3 flex items-center gap-2">
              <a
                href={
                  application.endpoint_url
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg bg-[#f7faff] px-2.5 py-1.5 font-mono text-[10px] font-medium text-[#2563eb] hover:bg-[#eff6ff]"
              >
                <ExternalLink className="size-3 shrink-0" />

                <span className="truncate">
                  {
                    application.endpoint_url
                  }
                </span>
              </a>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
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
              Open
            </a>
          )}

          {running ? (
            <button
              disabled={busy}
              onClick={onStop}
              className="h-9 rounded-lg border border-[#e4e8ef] px-3 text-[11px] font-semibold text-[#475467] hover:bg-[#f8fafc] disabled:opacity-50"
            >
              <CircleStop className="mr-1.5 inline size-3.5" />
              Stop
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={onStart}
              className="h-9 rounded-lg border border-[#dbe7fb] bg-[#f7faff] px-3 text-[11px] font-semibold text-[#2563eb] hover:bg-[#eff6ff] disabled:opacity-50"
            >
              <Play className="mr-1.5 inline size-3.5" />
              Start
            </button>
          )}

          <button
            disabled={busy}
            onClick={onRestart}
            className="flex size-9 items-center justify-center rounded-lg border border-[#e4e8ef] text-[#667085] hover:bg-[#f8fafc] disabled:opacity-50"
            title="Restart"
          >
            <RefreshCw className="size-3.5" />
          </button>

          <button
            onClick={onLogs}
            className="flex size-9 items-center justify-center rounded-lg border border-[#e4e8ef] text-[#667085] hover:bg-[#f8fafc]"
            title="Logs"
          >
            <SquareTerminal className="size-3.5" />
          </button>

          <a
            href={`/applications/${encodeURIComponent(
              application.id,
            )}`}
            className="flex size-9 items-center justify-center rounded-lg border border-[#e4e8ef] text-[#667085] hover:bg-[#f8fafc]"
            title="Details"
          >
            <ChevronRight className="size-4" />
          </a>

          <button
            disabled={busy}
            onClick={onDelete}
            className="flex size-9 items-center justify-center rounded-lg border border-[#fee2e2] text-[#b42318] hover:bg-[#fff7f7] disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (
    value: string,
  ) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#344054]">
        {label}
      </label>

      <input
        className="form-input"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
      />
    </div>
  )
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-xl border border-[#e4e8ef] bg-white p-5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-[#f2f4f7] text-[#667085]">
        {icon}
      </div>

      <h3 className="mt-4 text-xs font-semibold text-[#172033]">
        {title}
      </h3>

      <p className="mt-1 text-[11px] leading-5 text-[#667085]">
        {text}
      </p>
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/30 p-4 backdrop-blur-[2px]">
      <div
        className={`max-h-[90vh] w-full overflow-auto rounded-2xl border border-[#e4e8ef] bg-white shadow-[0_20px_60px_rgba(16,24,40,0.18)] ${
          wide
            ? "max-w-5xl"
            : "max-w-2xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eef0f4] bg-white px-5 py-4">
          <h2 className="text-sm font-semibold text-[#172033]">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[#667085] hover:bg-[#f2f4f7]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}