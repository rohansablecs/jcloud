"use client"

import {
  Activity,
  Check,
  Cpu,
  HardDrive,
  Loader2,
  MemoryStick,
  Monitor,
  Power,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Timer,
  Unlock,
  X,
} from "lucide-react"

import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { JCloudShell } from "@/components/jcloud/shell"
import {
  machinesApi,
  request,
  type Machine,
  type MachineLifecycleState,
} from "@/lib/api"


function lifecycleLabel(
  state: MachineLifecycleState
) {
  switch (state) {
    case "AVAILABLE":
      return "Available"
    case "STARTING":
      return "Starting"
    case "IN_USE":
      return "In use"
    case "RESETTING":
      return "Resetting"
    case "ERROR":
      return "Error"
    default:
      return state
  }
}


function lifecycleDescription(
  state: MachineLifecycleState
) {
  switch (state) {
    case "AVAILABLE":
      return "Ready to claim"
    case "STARTING":
      return "Booting virtual machine"
    case "IN_USE":
      return "Reserved by current session"
    case "RESETTING":
      return "Restoring clean image"
    case "ERROR":
      return "Requires administrator attention"
    default:
      return "Unknown state"
  }
}


function lifecycleDotClass(
  state: MachineLifecycleState
) {
  switch (state) {
    case "AVAILABLE":
      return "bg-[#16a34a]"
    case "STARTING":
      return "bg-[#d99a16]"
    case "IN_USE":
      return "bg-[#2563eb]"
    case "RESETTING":
      return "bg-[#9333ea]"
    case "ERROR":
      return "bg-[#dc2626]"
    default:
      return "bg-[#98a2b3]"
  }
}


function lifecycleTextClass(
  state: MachineLifecycleState
) {
  switch (state) {
    case "AVAILABLE":
      return "text-[#15803d]"
    case "STARTING":
      return "text-[#a16207]"
    case "IN_USE":
      return "text-[#2563eb]"
    case "RESETTING":
      return "text-[#7e22ce]"
    case "ERROR":
      return "text-[#b42318]"
    default:
      return "text-[#667085]"
  }
}


function formatDate(
  value: string | null
) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}


function formatRemaining(
  value: string | null
) {
  if (!value) {
    return null
  }

  const timestamp = new Date(value).getTime()

  if (Number.isNaN(timestamp)) {
    return null
  }

  const remaining = timestamp - Date.now()

  if (remaining <= 0) {
    return "expiring"
  }

  const minutes = Math.floor(
    remaining / 60000
  )

  const hours = Math.floor(
    minutes / 60
  )

  const mins = minutes % 60

  if (hours > 0) {
    return `${hours}h ${mins}m remaining`
  }

  return `${mins}m remaining`
}


type ConsoleTicketResponse = {
  machine_id: string
  viewer_url: string
  expires_in: number
}


export default function MachinesPage() {

  const [machines, setMachines] =
    useState<Machine[]>([])

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [actionMachine, setActionMachine] =
    useState<string | null>(null)

  const [consoleMachine, setConsoleMachine] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)


  const loadMachines = useCallback(
    async (
      background = false
    ) => {

      if (background) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {

        setError(null)

        const response =
          await machinesApi.list()

        setMachines(
          response.machines
        )

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load machines"
        )

      } finally {

        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )


  useEffect(() => {
    loadMachines()
  }, [loadMachines])


  async function openConsole(machine: Machine) {
  if (
    machine.lifecycle_state !== "IN_USE" ||
    machine.state !== "running"
  ) {
    setError(
      "Machine must be running to open the console."
    )
    return
  }

  /*
   * Open the window immediately from the user's
   * click so Brave/Safari popup blockers don't
   * reject it while the ticket request is running.
   */
  const viewerWindow = window.open(
    "about:blank",
    "_blank"
  )

  if (!viewerWindow) {
    setError(
      "Console window was blocked by the browser. Allow popups for JCloud and try again."
    )
    return
  }

  setConsoleMachine(machine.id)
  setError(null)

  try {
    viewerWindow.document.title =
      "JCloud Console"

    viewerWindow.document.body.innerHTML = `
      <div style="
        margin:0;
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#090a0a;
        color:#e8e8e3;
        font-family:monospace;
      ">
        CONNECTING TO ${machine.display_name.toUpperCase()}...
      </div>
    `

    /*
     * IMPORTANT:
     * Do NOT use raw fetch("/api/...") here.
     *
     * machinesApi.console() uses the same authenticated
     * API client as the rest of the Machines page.
     */
    const data =
  await request<ConsoleTicketResponse>(
    `/machines/${encodeURIComponent(
      machine.id
    )}/console-ticket`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
    }
  )

if (!data.viewer_url) {
  throw new Error(
    "Console gateway did not return a viewer URL."
  )
}

viewerWindow.location.href =
  data.viewer_url

    viewerWindow.location.href =
      data.viewer_url

  } catch (err) {
    viewerWindow.close()

    setError(
      err instanceof Error
        ? err.message
        : "Unable to open machine console"
    )
  } finally {
    setConsoleMachine(null)
  }
}


  async function performAction(
    machine: Machine,
    action:
      | "claim"
      | "release"
      | "start"
      | "stop"
      | "reboot"
  ) {

    setActionMachine(
      machine.id
    )

    setError(null)

    try {

      let result: Machine

      switch (action) {

        case "claim":
          result =
            await machinesApi.claim(
              machine.id
            )
          break

        case "release":
          result =
            await machinesApi.release(
              machine.id
            )
          break

        case "start":
          result =
            await machinesApi.start(
              machine.id
            )
          break

        case "stop":
          result =
            await machinesApi.stop(
              machine.id
            )
          break

        case "reboot":
          result =
            await machinesApi.reboot(
              machine.id
            )
          break
      }

      setMachines(
        current =>
          current.map(
            item =>
              item.id === result.id
                ? result
                : item
          )
      )

      if (
        action === "claim" ||
        action === "release"
      ) {
        await loadMachines(true)
      }

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Machine action failed"
      )

      await loadMachines(true)

    } finally {

      setActionMachine(null)
    }
  }


  const availableCount =
    machines.filter(
      machine =>
        machine.lifecycle_state ===
        "AVAILABLE"
    ).length

  const inUseCount =
    machines.filter(
      machine =>
        machine.lifecycle_state ===
        "IN_USE"
    ).length

  const resettingCount =
    machines.filter(
      machine =>
        machine.lifecycle_state ===
        "RESETTING"
    ).length


  return (
    <JCloudShell>

      <div className="mx-auto w-full max-w-[1500px] space-y-8">

        {/* HEADER */}

        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">

              <div className="flex size-7 items-center justify-center rounded-lg bg-[#eff6ff]">
                <Monitor className="size-3.5 text-[#2563eb]" />
              </div>

              Compute

            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#172033] sm:text-4xl">
              Machines
            </h1>

            <p className="mt-2 max-w-xl text-sm text-[#667085]">
              Access the virtual computers running on your private infrastructure.
            </p>

          </div>


          <Button
            variant="outline"
            disabled={refreshing}
            onClick={() =>
              loadMachines(true)
            }
            className="
              h-10
              rounded-lg
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
            "
          >

            {refreshing ? (
              <Loader2
                className="
                  mr-2
                  size-4
                  animate-spin
                "
              />
            ) : (
              <RefreshCw
                className="mr-2 size-4"
              />
            )}

            Refresh

          </Button>

        </section>


        {/* FLEET SUMMARY */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-xs font-medium text-[#667085]">
                  Machines
                </div>

                <div className="mt-3 text-2xl font-semibold tracking-tight text-[#172033]">
                  {loading
                    ? "--"
                    : machines.length}
                </div>

              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-[#eff6ff]">
                <Server className="size-4 text-[#2563eb]" />
              </div>

            </div>

            <div className="mt-2 text-xs text-[#98a2b3]">
              Fixed virtual machines
            </div>

          </div>


          {/* AVAILABLE */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-xs font-medium text-[#667085]">
                  Available
                </div>

                <div className="mt-3 text-2xl font-semibold tracking-tight text-[#172033]">
                  {loading
                    ? "--"
                    : availableCount}
                </div>

              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-[#ecfdf3]">
                <Check className="size-4 text-[#16a34a]" />
              </div>

            </div>

            <div className="mt-2 text-xs text-[#98a2b3]">
              Ready to claim
            </div>

          </div>


          {/* IN USE */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-xs font-medium text-[#667085]">
                  In use
                </div>

                <div className="mt-3 text-2xl font-semibold tracking-tight text-[#172033]">
                  {loading
                    ? "--"
                    : inUseCount}
                </div>

              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-[#eff6ff]">
                <Activity className="size-4 text-[#2563eb]" />
              </div>

            </div>

            <div className="mt-2 text-xs text-[#98a2b3]">
              Currently reserved
            </div>

          </div>


          {/* RESETTING */}

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-xs font-medium text-[#667085]">
                  Resetting
                </div>

                <div className="mt-3 text-2xl font-semibold tracking-tight text-[#172033]">
                  {loading
                    ? "--"
                    : resettingCount}
                </div>

              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-[#faf5ff]">
                <RotateCcw className="size-4 text-[#9333ea]" />
              </div>

            </div>

            <div className="mt-2 text-xs text-[#98a2b3]">
              Restoring clean image
            </div>

          </div>

        </section>


        {/* ERROR */}

        {error && (

          <div className="flex items-start justify-between gap-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white">

                <X className="size-3.5 text-[#dc2626]" />

              </div>

              <div>

                <div className="text-xs font-semibold text-[#b42318]">
                  Something went wrong
                </div>

                <div className="mt-1 text-xs leading-5 text-[#b42318]/80">
                  {error}
                </div>

              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="rounded-md p-1 text-[#b42318]/60 transition hover:bg-white hover:text-[#b42318]"
              aria-label="Dismiss error"
            >
              <X className="size-4" />
            </button>

          </div>

        )}


        {/* MACHINE LIST */}

        <section>

          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h2 className="text-lg font-semibold tracking-tight text-[#172033]">
                Virtual machines
              </h2>

              <p className="mt-1 text-xs text-[#98a2b3]">
                Each machine provides a fixed development environment.
              </p>

            </div>

            <span className="text-xs text-[#98a2b3]">
              {loading
                ? "Loading..."
                : `${machines.length} machines`}
            </span>

          </div>


          <div className="overflow-hidden rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            {/* LOADING */}

            {loading && (

              <div className="flex min-h-[420px] items-center justify-center px-6 py-16">

                <div className="text-center">

                  <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#eff6ff]">

                    <Loader2 className="size-5 animate-spin text-[#2563eb]" />

                  </div>

                  <div className="mt-5 text-sm font-medium text-[#344054]">
                    Loading machines
                  </div>

                  <p className="mt-1 text-xs text-[#98a2b3]">
                    Connecting to the JCloud compute service.
                  </p>

                </div>

              </div>

            )}


            {/* EMPTY */}

            {!loading &&
              machines.length === 0 && (

                <div className="flex min-h-[420px] items-center justify-center px-6 py-16">

                  <div className="max-w-md text-center">

                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#eff6ff]">

                      <Monitor className="size-6 text-[#2563eb]" />

                    </div>

                    <h3 className="mt-6 text-base font-semibold text-[#172033]">
                      No machines available
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#667085]">
                      The JCloud virtualization service
                      did not return any machines.
                    </p>

                    <Button
                      variant="outline"
                      disabled={refreshing}
                      onClick={() =>
                        loadMachines(true)
                      }
                      className="
                        mt-6
                        h-10
                        rounded-lg
                        border-[#d0d5dd]
                        bg-white
                        px-4
                        text-sm
                        font-medium
                        text-[#344054]
                        hover:bg-[#f7f9fc]
                      "
                    >
                      <RefreshCw className="mr-2 size-4" />
                      Try again
                    </Button>

                  </div>

                </div>

              )}


            {/* MACHINE LIST */}

            {!loading &&
              machines.length > 0 && (

                <div>

                  {machines.map(
                    (machine) => {

                      const busy =
                        actionMachine ===
                        machine.id

                      const connecting =
                        consoleMachine ===
                        machine.id

                      const isOwner =
                        machine.lifecycle_state ===
                          "IN_USE" &&
                        machine.owner !== null

                      const canConnect =
                        isOwner &&
                        machine.lifecycle_state ===
                          "IN_USE" &&
                        machine.state ===
                          "running"

                      const remaining =
                        formatRemaining(
                          machine.lease_expires_at
                        )

                      const isAvailable =
                        machine.lifecycle_state ===
                        "AVAILABLE"

                      const isError =
                        machine.lifecycle_state ===
                        "ERROR"

                      return (

                        <article
                          key={machine.id}
                          className={`
                            border-b
                            border-[#eef1f5]
                            p-5
                            last:border-b-0
                            sm:p-6
                            ${
                              isError
                                ? "bg-[#fffafa]"
                                : ""
                            }
                          `}
                        >

                          {/* MACHINE HEADER */}

                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                            <div className="flex min-w-0 items-start gap-4">

                              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f7f9fc]">

                                <Server className="size-5 text-[#667085]" />

                              </div>


                              <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h3 className="text-base font-semibold tracking-tight text-[#172033]">
                                    {machine.display_name}
                                  </h3>

                                  <span className="rounded-md bg-[#f2f4f7] px-2 py-1 font-mono text-[10px] text-[#667085]">
                                    {machine.id}
                                  </span>

                                </div>


                                <div className="mt-1 text-xs text-[#98a2b3]">
                                  {machine.name}
                                </div>

                              </div>

                            </div>


                            {/* STATUS */}

                            <div
                              className={`
                                inline-flex
                                w-fit
                                items-center
                                gap-2
                                rounded-full
                                border
                                px-3
                                py-1.5
                                text-xs
                                font-medium
                                ${lifecycleTextClass(
                                  machine.lifecycle_state
                                )}
                                ${
                                  machine.lifecycle_state ===
                                  "AVAILABLE"
                                    ? "border-[#bbf7d0] bg-[#f0fdf4]"
                                    : machine.lifecycle_state ===
                                      "STARTING"
                                      ? "border-[#fde68a] bg-[#fffbeb]"
                                      : machine.lifecycle_state ===
                                        "IN_USE"
                                        ? "border-[#bfdbfe] bg-[#eff6ff]"
                                        : machine.lifecycle_state ===
                                          "RESETTING"
                                          ? "border-[#e9d5ff] bg-[#faf5ff]"
                                          : machine.lifecycle_state ===
                                            "ERROR"
                                            ? "border-[#fecaca] bg-[#fef2f2]"
                                            : "border-[#e4e8ef] bg-[#f7f9fc]"
                                }
                              `}
                            >

                              {machine.lifecycle_state ===
                                "STARTING" ||
                              machine.lifecycle_state ===
                                "RESETTING" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <span
                                  className={`
                                    size-1.5
                                    rounded-full
                                    ${lifecycleDotClass(
                                      machine.lifecycle_state
                                    )}
                                  `}
                                />
                              )}

                              {lifecycleLabel(
                                machine.lifecycle_state
                              )}

                            </div>

                          </div>


                          {/* RESOURCES */}

                          <div className="mt-6 grid overflow-hidden rounded-xl border border-[#e4e8ef] sm:grid-cols-4">

                            <div className="flex items-center gap-3 border-b border-[#e4e8ef] p-4 sm:border-b-0 sm:border-r">

                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f7f9fc]">
                                <Cpu className="size-4 text-[#667085]" />
                              </div>

                              <div>

                                <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                                  vCPU
                                </div>

                                <div className="mt-1 text-sm font-semibold text-[#344054]">
                                  {machine.vcpus}
                                </div>

                              </div>

                            </div>


                            <div className="flex items-center gap-3 border-b border-[#e4e8ef] p-4 sm:border-b-0 sm:border-r">

                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f7f9fc]">
                                <MemoryStick className="size-4 text-[#667085]" />
                              </div>

                              <div>

                                <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                                  Memory
                                </div>

                                <div className="mt-1 text-sm font-semibold text-[#344054]">
                                  {machine.memory_mb / 1024} GiB
                                </div>

                              </div>

                            </div>


                            <div className="flex items-center gap-3 border-b border-[#e4e8ef] p-4 sm:border-b-0 sm:border-r">

                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f7f9fc]">
                                <HardDrive className="size-4 text-[#667085]" />
                              </div>

                              <div>

                                <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                                  Disk
                                </div>

                                <div className="mt-1 text-sm font-semibold text-[#344054]">
                                  {machine.disk_gb} GiB
                                </div>

                              </div>

                            </div>


                            <div className="flex items-center gap-3 p-4">

                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f7f9fc]">
                                <Power className="size-4 text-[#667085]" />
                              </div>

                              <div>

                                <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                                  Power
                                </div>

                                <div className="mt-1 flex items-center gap-2 text-sm font-semibold capitalize text-[#344054]">

                                  <span
                                    className={`
                                      size-1.5
                                      rounded-full
                                      ${
                                        machine.state ===
                                        "running"
                                          ? "bg-[#16a34a]"
                                          : "bg-[#98a2b3]"
                                      }
                                    `}
                                  />

                                  {machine.state}

                                </div>

                              </div>

                            </div>

                          </div>


                          {/* OWNER / LEASE */}

                          <div className="mt-5 flex flex-col gap-4 rounded-lg bg-[#f8fafc] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex flex-wrap gap-x-5 gap-y-2">

                              <div className="flex items-center gap-2 text-xs text-[#667085]">

                                <ShieldCheck className="size-3.5 text-[#98a2b3]" />

                                {machine.owner
                                  ? `Owner: ${machine.owner}`
                                  : "No owner"
                                }

                              </div>


                              {machine.claimed_at && (

                                <div className="flex items-center gap-2 text-xs text-[#667085]">

                                  <Activity className="size-3.5 text-[#98a2b3]" />

                                  Claimed{" "}
                                  {formatDate(
                                    machine.claimed_at
                                  )}

                                </div>

                              )}


                              {remaining && (

                                <div className="flex items-center gap-2 text-xs text-[#667085]">

                                  <Timer className="size-3.5 text-[#98a2b3]" />

                                  {remaining}

                                </div>

                              )}

                            </div>


                            <div className="text-xs text-[#98a2b3]">

                              {lifecycleDescription(
                                machine.lifecycle_state
                              )}

                            </div>

                          </div>


                          {/* ACTIONS */}

                          <div className="mt-5 flex flex-wrap gap-2">

                            {/* CLAIM */}

                            {isAvailable && (

                              <Button
                                disabled={busy}
                                onClick={() =>
                                  performAction(
                                    machine,
                                    "claim"
                                  )
                                }
                                className="
                                  h-9
                                  rounded-lg
                                  bg-[#2563eb]
                                  px-4
                                  text-xs
                                  font-semibold
                                  text-white
                                  shadow-sm
                                  transition
                                  hover:bg-[#1d4ed8]
                                  disabled:opacity-60
                                "
                              >

                                {busy ? (
                                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                                ) : (
                                  <Check className="mr-2 size-3.5" />
                                )}

                                Claim machine

                              </Button>

                            )}


                            {/* CONNECT */}

                            {canConnect && (

                              <Button
                                disabled={
                                  busy ||
                                  connecting
                                }
                                onClick={() =>
                                  openConsole(
                                    machine
                                  )
                                }
                                className="
                                  h-9
                                  rounded-lg
                                  bg-[#2563eb]
                                  px-4
                                  text-xs
                                  font-semibold
                                  text-white
                                  shadow-sm
                                  transition
                                  hover:bg-[#1d4ed8]
                                  disabled:opacity-60
                                "
                              >

                                {connecting ? (
                                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                                ) : (
                                  <Monitor className="mr-2 size-3.5" />
                                )}

                                {connecting
                                  ? "Connecting..."
                                  : "Open console"
                                }

                              </Button>

                            )}


                            {/* RELEASE */}

                            {isOwner && (

                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  performAction(
                                    machine,
                                    "release"
                                  )
                                }
                                className="
                                  h-9
                                  rounded-lg
                                  border-[#d0d5dd]
                                  bg-white
                                  px-4
                                  text-xs
                                  font-medium
                                  text-[#344054]
                                  shadow-sm
                                  hover:bg-[#f7f9fc]
                                "
                              >

                                {busy ? (
                                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                                ) : (
                                  <Unlock className="mr-2 size-3.5" />
                                )}

                                Release

                              </Button>

                            )}


                            {/* START */}

                            {isOwner &&
                              machine.lifecycle_state ===
                                "IN_USE" &&
                              machine.state ===
                                "stopped" && (

                                <Button
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() =>
                                    performAction(
                                      machine,
                                      "start"
                                    )
                                  }
                                  className="
                                    h-9
                                    rounded-lg
                                    border-[#d0d5dd]
                                    bg-white
                                    px-4
                                    text-xs
                                    font-medium
                                    text-[#344054]
                                    shadow-sm
                                    hover:bg-[#f7f9fc]
                                  "
                                >

                                  <Power className="mr-2 size-3.5" />

                                  Start

                                </Button>

                              )}


                            {/* STOP */}

                            {isOwner &&
                              machine.lifecycle_state ===
                                "IN_USE" &&
                              machine.state ===
                                "running" && (

                                <Button
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() =>
                                    performAction(
                                      machine,
                                      "stop"
                                    )
                                  }
                                  className="
                                    h-9
                                    rounded-lg
                                    border-[#d0d5dd]
                                    bg-white
                                    px-4
                                    text-xs
                                    font-medium
                                    text-[#344054]
                                    shadow-sm
                                    hover:bg-[#f7f9fc]
                                  "
                                >

                                  <Power className="mr-2 size-3.5" />

                                  Stop

                                </Button>

                              )}


                            {/* REBOOT */}

                            {isOwner &&
                              machine.lifecycle_state ===
                                "IN_USE" &&
                              machine.state ===
                                "running" && (

                                <Button
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() =>
                                    performAction(
                                      machine,
                                      "reboot"
                                    )
                                  }
                                  className="
                                    h-9
                                    rounded-lg
                                    border-[#d0d5dd]
                                    bg-white
                                    px-4
                                    text-xs
                                    font-medium
                                    text-[#344054]
                                    shadow-sm
                                    hover:bg-[#f7f9fc]
                                  "
                                >

                                  <RotateCcw className="mr-2 size-3.5" />

                                  Reboot

                                </Button>

                              )}

                          </div>

                        </article>

                      )
                    }
                  )}

                </div>

              )}


            {/* FOOTER */}

            <div className="flex flex-col gap-1 border-t border-[#eef1f5] px-5 py-4 text-xs text-[#98a2b3] sm:flex-row sm:items-center sm:justify-between">

              <span>
                JCloud compute
              </span>

              <span>
                {resettingCount > 0
                  ? `${resettingCount} machine${resettingCount === 1 ? "" : "s"} resetting`
                  : `${inUseCount} machine${inUseCount === 1 ? "" : "s"} in use`}
              </span>

            </div>

          </div>

        </section>

      </div>

    </JCloudShell>
  )
}