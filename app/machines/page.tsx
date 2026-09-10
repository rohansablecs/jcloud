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
      return "bg-[#b7ff4a]"
    case "STARTING":
      return "bg-[#d7b85c]"
    case "IN_USE":
      return "bg-[#6fa8ff]"
    case "RESETTING":
      return "bg-[#c78cff]"
    case "ERROR":
      return "bg-[#ff6868]"
    default:
      return "bg-[#4f5452]"
  }
}


function lifecycleTextClass(
  state: MachineLifecycleState
) {
  switch (state) {
    case "AVAILABLE":
      return "text-[#b7ff4a]"
    case "STARTING":
      return "text-[#d7b85c]"
    case "IN_USE":
      return "text-[#6fa8ff]"
    case "RESETTING":
      return "text-[#c78cff]"
    case "ERROR":
      return "text-[#ff6868]"
    default:
      return "text-[#4f5452]"
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


  async function openConsole(
    machine: Machine
  ) {

    if (
      machine.lifecycle_state !==
        "IN_USE" ||
      machine.state !==
        "running"
    ) {
      setError(
        "Machine must be running to open the console."
      )
      return
    }

    /*
     * Open the window immediately from the
     * user's click so browser popup blockers
     * do not reject it while the ticket request
     * is in flight.
     */
    const viewerWindow =
      window.open(
        "about:blank",
        "_blank"
      )

    if (!viewerWindow) {
      setError(
        "Console window was blocked by the browser. Allow popups for JCloud and try again."
      )
      return
    }

    setConsoleMachine(
      machine.id
    )

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

      const response =
        await fetch(
          `/api/machines/${machine.id}/console-ticket`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )

      if (!response.ok) {

        let message =
          "Unable to open machine console"

        try {
          const body =
            await response.json()

          if (
            typeof body?.detail ===
            "string"
          ) {
            message = body.detail
          }
        } catch {
          // Keep generic message.
        }

        throw new Error(message)
      }

      const data =
        (await response.json()) as
          ConsoleTicketResponse

      if (
        !data.viewer_url
      ) {
        throw new Error(
          "Console gateway did not return a viewer URL."
        )
      }

      /*
       * The viewer URL points directly to
       * the server-side SPICE HTML5 client.
       *
       * That page establishes:
       *
       * browser
       *   -> WSS
       *   -> FastAPI
       *   -> localhost:5900
       *   -> QEMU/SPICE
       */
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

      <div className="space-y-8">

        {/* HEADER */}

        <section
          className="
            flex
            flex-col
            justify-between
            gap-6
            border-b
            border-[#292c2c]
            pb-8
            lg:flex-row
            lg:items-end
          "
        >

          <div>

            <div
              className="
                flex
                items-center
                gap-3
                font-mono
                text-[8px]
                uppercase
                tracking-[0.18em]
                text-[#4f5452]
              "
            >
              <span className="size-1.5 bg-[#b7ff4a]" />

              Virtualization / Compute
            </div>

            <h2
              className="
                mt-4
                text-5xl
                font-medium
                tracking-[-0.045em]
              "
            >
              Machines
            </h2>

            <p
              className="
                mt-3
                max-w-lg
                font-mono
                text-[9px]
                leading-5
                text-[#4f5452]
              "
            >
              Access fixed virtual computers
              running on JCloud.
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
              rounded-none
              border-[#353a37]
              bg-[#0b0d0d]
              px-4
              font-mono
              text-[9px]
              uppercase
              tracking-[0.1em]
              hover:bg-[#151717]
              hover:text-[#e8e8e3]
            "
          >

            {refreshing ? (
              <Loader2
                className="
                  mr-2
                  size-3.5
                  animate-spin
                "
              />
            ) : (
              <RefreshCw
                className="mr-2 size-3.5"
              />
            )}

            Refresh fleet

          </Button>

        </section>


        {/* FLEET SUMMARY */}

        <div
          className="
            grid
            grid-cols-2
            border-y
            border-[#292c2c]
            sm:grid-cols-4
          "
        >

          <div
            className="
              border-r
              border-[#292c2c]
              px-5
              py-4
            "
          >
            <div
              className="
                font-mono
                text-[7px]
                uppercase
                tracking-[0.16em]
                text-[#4f5452]
              "
            >
              Provider
            </div>

            <div
              className="
                mt-2
                font-mono
                text-[9px]
                uppercase
              "
            >
              Libvirt / QEMU
            </div>
          </div>


          <div
            className="
              border-r
              border-[#292c2c]
              px-5
              py-4
            "
          >
            <div
              className="
                font-mono
                text-[7px]
                uppercase
                tracking-[0.16em]
                text-[#4f5452]
              "
            >
              Fleet
            </div>

            <div
              className="
                mt-2
                font-mono
                text-[9px]
              "
            >
              {loading
                ? "--"
                : String(
                    machines.length
                  ).padStart(2, "0")
              }
            </div>
          </div>


          <div
            className="
              border-r
              border-[#292c2c]
              px-5
              py-4
            "
          >
            <div
              className="
                font-mono
                text-[7px]
                uppercase
                tracking-[0.16em]
                text-[#4f5452]
              "
            >
              Available
            </div>

            <div
              className="
                mt-2
                flex
                items-center
                gap-2
                font-mono
                text-[9px]
                uppercase
              "
            >
              <span
                className="
                  size-1.5
                  bg-[#b7ff4a]
                "
              />

              {loading
                ? "--"
                : String(
                    availableCount
                  ).padStart(2, "0")
              }
            </div>
          </div>


          <div className="px-5 py-4">
            <div
              className="
                font-mono
                text-[7px]
                uppercase
                tracking-[0.16em]
                text-[#4f5452]
              "
            >
              Compute
            </div>

            <div
              className="
                mt-2
                font-mono
                text-[9px]
                uppercase
              "
            >
              8 vCPU / 16 GiB
            </div>
          </div>

        </div>


        {/* ERROR */}

        {error && (
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              border
              border-[#4a2727]
              bg-[#130b0b]
              px-4
              py-3
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                font-mono
                text-[8px]
                uppercase
                tracking-[0.08em]
                text-[#ff8585]
              "
            >
              <X className="size-3.5" />
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="
                font-mono
                text-[8px]
                uppercase
                text-[#4f5452]
                hover:text-[#e8e8e3]
              "
            >
              Dismiss
            </button>

          </div>
        )}


        {/* MACHINES */}

        <section>

          <div
            className="
              mb-3
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                font-mono
                text-[8px]
                uppercase
                tracking-[0.15em]
                text-[#4f5452]
              "
            >
              Virtual machines
            </span>

            <span
              className="
                font-mono
                text-[7px]
                uppercase
                tracking-[0.12em]
                text-[#3f4441]
              "
            >
              {loading
                ? "Loading fleet"
                : `${machines.length} fixed instances`
              }
            </span>
          </div>


          <div
            className="
              border
              border-[#292c2c]
              bg-[#090a0a]
            "
          >

            {/* LOADING */}

            {loading && (
              <div
                className="
                  flex
                  min-h-[420px]
                  items-center
                  justify-center
                "
              >
                <div className="text-center">

                  <Loader2
                    className="
                      mx-auto
                      size-5
                      animate-spin
                      text-[#4f5452]
                    "
                  />

                  <div
                    className="
                      mt-5
                      font-mono
                      text-[8px]
                      uppercase
                      tracking-[0.14em]
                      text-[#4f5452]
                    "
                  >
                    Connecting to machine
                    control
                  </div>

                </div>
              </div>
            )}


            {/* EMPTY */}

            {!loading &&
              machines.length === 0 && (
                <div
                  className="
                    flex
                    min-h-[420px]
                    items-center
                    justify-center
                    p-8
                  "
                >
                  <div
                    className="
                      max-w-md
                      text-center
                    "
                  >

                    <div
                      className="
                        mx-auto
                        flex
                        size-14
                        items-center
                        justify-center
                        border
                        border-[#292c2c]
                      "
                    >
                      <Monitor
                        className="
                          size-5
                          text-[#4f5452]
                        "
                      />
                    </div>

                    <div
                      className="
                        mt-6
                        font-mono
                        text-[9px]
                        uppercase
                        tracking-[0.14em]
                        text-[#e8e8e3]
                      "
                    >
                      Machine fleet unavailable
                    </div>

                    <p
                      className="
                        mt-3
                        font-mono
                        text-[8px]
                        leading-5
                        text-[#4f5452]
                      "
                    >
                      The JCloud virtualization
                      service did not return any
                      machines.
                    </p>

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

                      return (
                        <article
                          key={machine.id}
                          className={`
                            group
                            border-b
                            border-[#292c2c]
                            p-5
                            last:border-b-0
                            ${
                              machine.lifecycle_state ===
                              "ERROR"
                                ? "bg-[#100909]"
                                : ""
                            }
                          `}
                        >

                          {/* MACHINE HEADER */}

                          <div
                            className="
                              flex
                              flex-col
                              gap-5
                              lg:flex-row
                              lg:items-start
                              lg:justify-between
                            "
                          >

                            <div
                              className="
                                flex
                                min-w-0
                                items-start
                                gap-4
                              "
                            >

                              <div
                                className="
                                  flex
                                  size-11
                                  shrink-0
                                  items-center
                                  justify-center
                                  border
                                  border-[#292c2c]
                                  bg-[#0b0d0d]
                                "
                              >
                                <Server
                                  className="
                                    size-4
                                    text-[#686d69]
                                  "
                                />
                              </div>


                              <div className="min-w-0">

                                <div
                                  className="
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-3
                                  "
                                >

                                  <h3
                                    className="
                                      font-mono
                                      text-[11px]
                                      uppercase
                                      tracking-[0.08em]
                                      text-[#e8e8e3]
                                    "
                                  >
                                    {
                                      machine.display_name
                                    }
                                  </h3>

                                  <span
                                    className="
                                      font-mono
                                      text-[7px]
                                      uppercase
                                      tracking-[0.12em]
                                      text-[#3f4441]
                                    "
                                  >
                                    {
                                      machine.id
                                    }
                                  </span>

                                </div>

                                <div
                                  className="
                                    mt-2
                                    font-mono
                                    text-[8px]
                                    text-[#4f5452]
                                  "
                                >
                                  {
                                    machine.name
                                  }
                                </div>

                              </div>

                            </div>


                            {/* LIFECYCLE */}

                            <div
                              className="
                                flex
                                items-center
                                gap-3
                              "
                            >

                              <div
                                className={`
                                  flex
                                  items-center
                                  gap-2
                                  border
                                  border-[#292c2c]
                                  bg-[#0b0d0d]
                                  px-3
                                  py-2
                                  font-mono
                                  text-[8px]
                                  uppercase
                                  tracking-[0.1em]
                                  ${lifecycleTextClass(
                                    machine.lifecycle_state
                                  )}
                                `}
                              >

                                {machine.lifecycle_state ===
                                "STARTING" ||
                                machine.lifecycle_state ===
                                "RESETTING" ? (
                                  <Loader2
                                    className="
                                      size-3
                                      animate-spin
                                    "
                                  />
                                ) : (
                                  <span
                                    className={`
                                      size-1.5
                                      ${lifecycleDotClass(
                                        machine.lifecycle_state
                                      )}
                                    `}
                                  />
                                )}

                                {
                                  lifecycleLabel(
                                    machine.lifecycle_state
                                  )
                                }

                              </div>

                            </div>

                          </div>


                          {/* RESOURCE GRID */}

                          <div
                            className="
                              mt-6
                              grid
                              grid-cols-2
                              border-y
                              border-[#292c2c]
                              sm:grid-cols-4
                            "
                          >

                            <div
                              className="
                                border-r
                                border-[#292c2c]
                                px-4
                                py-4
                              "
                            >
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-2
                                  font-mono
                                  text-[7px]
                                  uppercase
                                  tracking-[0.12em]
                                  text-[#4f5452]
                                "
                              >
                                <Cpu className="size-3" />
                                vCPU
                              </div>

                              <div
                                className="
                                  mt-2
                                  font-mono
                                  text-[10px]
                                "
                              >
                                {
                                  machine.vcpus
                                }
                              </div>
                            </div>


                            <div
                              className="
                                border-r
                                border-[#292c2c]
                                px-4
                                py-4
                              "
                            >
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-2
                                  font-mono
                                  text-[7px]
                                  uppercase
                                  tracking-[0.12em]
                                  text-[#4f5452]
                                "
                              >
                                <MemoryStick className="size-3" />
                                RAM
                              </div>

                              <div
                                className="
                                  mt-2
                                  font-mono
                                  text-[10px]
                                "
                              >
                                {
                                  machine.memory_mb /
                                  1024
                                } GiB
                              </div>
                            </div>


                            <div
                              className="
                                border-r
                                border-[#292c2c]
                                px-4
                                py-4
                              "
                            >
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-2
                                  font-mono
                                  text-[7px]
                                  uppercase
                                  tracking-[0.12em]
                                  text-[#4f5452]
                                "
                              >
                                <HardDrive className="size-3" />
                                Disk
                              </div>

                              <div
                                className="
                                  mt-2
                                  font-mono
                                  text-[10px]
                                "
                              >
                                {
                                  machine.disk_gb
                                } GiB
                              </div>
                            </div>


                            <div className="px-4 py-4">
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-2
                                  font-mono
                                  text-[7px]
                                  uppercase
                                  tracking-[0.12em]
                                  text-[#4f5452]
                                "
                              >
                                <Power className="size-3" />
                                Power
                              </div>

                              <div
                                className="
                                  mt-2
                                  flex
                                  items-center
                                  gap-2
                                  font-mono
                                  text-[9px]
                                  uppercase
                                "
                              >

                                <span
                                  className={`
                                    size-1.5
                                    ${
                                      machine.state ===
                                      "running"
                                        ? "bg-[#b7ff4a]"
                                        : "bg-[#4f5452]"
                                    }
                                  `}
                                />

                                {
                                  machine.state
                                }

                              </div>
                            </div>

                          </div>


                          {/* OWNERSHIP / LEASE */}

                          <div
                            className="
                              mt-4
                              flex
                              flex-col
                              gap-3
                              sm:flex-row
                              sm:items-center
                              sm:justify-between
                            "
                          >

                            <div
                              className="
                                flex
                                flex-wrap
                                gap-x-6
                                gap-y-2
                              "
                            >

                              <div
                                className="
                                  flex
                                  items-center
                                  gap-2
                                  font-mono
                                  text-[7px]
                                  uppercase
                                  tracking-[0.1em]
                                  text-[#4f5452]
                                "
                              >
                                <ShieldCheck className="size-3" />

                                {machine.owner
                                  ? `Owner: ${machine.owner}`
                                  : "No owner"
                                }
                              </div>


                              {machine.claimed_at && (
                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-2
                                    font-mono
                                    text-[7px]
                                    uppercase
                                    tracking-[0.1em]
                                    text-[#4f5452]
                                  "
                                >
                                  <Activity className="size-3" />

                                  Claimed{" "}
                                  {
                                    formatDate(
                                      machine.claimed_at
                                    )
                                  }
                                </div>
                              )}


                              {remaining && (
                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-2
                                    font-mono
                                    text-[7px]
                                    uppercase
                                    tracking-[0.1em]
                                    text-[#4f5452]
                                  "
                                >
                                  <Timer className="size-3" />
                                  {remaining}
                                </div>
                              )}

                            </div>


                            <div
                              className="
                                font-mono
                                text-[7px]
                                uppercase
                                tracking-[0.1em]
                                text-[#3f4441]
                              "
                            >
                              {
                                lifecycleDescription(
                                  machine.lifecycle_state
                                )
                              }
                            </div>

                          </div>


                          {/* ACTIONS */}

                          <div
                            className="
                              mt-5
                              flex
                              flex-wrap
                              gap-2
                            "
                          >

                            {/* CLAIM */}

                            {machine.lifecycle_state ===
                              "AVAILABLE" && (
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
                                  rounded-none
                                  bg-[#b7ff4a]
                                  px-4
                                  font-mono
                                  text-[8px]
                                  uppercase
                                  tracking-[0.1em]
                                  text-[#0a0c0b]
                                  hover:bg-[#c7ff70]
                                "
                              >

                                {busy ? (
                                  <Loader2
                                    className="
                                      mr-2
                                      size-3
                                      animate-spin
                                    "
                                  />
                                ) : (
                                  <Check
                                    className="
                                      mr-2
                                      size-3
                                    "
                                  />
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
                                  rounded-none
                                  bg-[#b7ff4a]
                                  px-4
                                  font-mono
                                  text-[8px]
                                  uppercase
                                  tracking-[0.1em]
                                  text-[#0a0c0b]
                                  hover:bg-[#c7ff70]
                                "
                              >

                                {connecting ? (
                                  <Loader2
                                    className="
                                      mr-2
                                      size-3
                                      animate-spin
                                    "
                                  />
                                ) : (
                                  <Monitor
                                    className="
                                      mr-2
                                      size-3
                                    "
                                  />
                                )}

                                {connecting
                                  ? "Connecting"
                                  : "Connect"
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
                                  rounded-none
                                  border-[#353a37]
                                  bg-[#0b0d0d]
                                  px-4
                                  font-mono
                                  text-[8px]
                                  uppercase
                                  tracking-[0.1em]
                                  hover:bg-[#151717]
                                  hover:text-[#e8e8e3]
                                "
                              >

                                {busy ? (
                                  <Loader2
                                    className="
                                      mr-2
                                      size-3
                                      animate-spin
                                    "
                                  />
                                ) : (
                                  <Unlock
                                    className="
                                      mr-2
                                      size-3
                                    "
                                  />
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
                                    rounded-none
                                    border-[#353a37]
                                    bg-[#0b0d0d]
                                    px-4
                                    font-mono
                                    text-[8px]
                                    uppercase
                                    tracking-[0.1em]
                                    hover:bg-[#151717]
                                    hover:text-[#e8e8e3]
                                  "
                                >
                                  <Power
                                    className="
                                      mr-2
                                      size-3
                                    "
                                  />
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
                                    rounded-none
                                    border-[#353a37]
                                    bg-[#0b0d0d]
                                    px-4
                                    font-mono
                                    text-[8px]
                                    uppercase
                                    tracking-[0.1em]
                                    hover:bg-[#151717]
                                    hover:text-[#e8e8e3]
                                  "
                                >
                                  <Power
                                    className="
                                      mr-2
                                      size-3
                                    "
                                  />
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
                                    rounded-none
                                    border-[#353a37]
                                    bg-[#0b0d0d]
                                    px-4
                                    font-mono
                                    text-[8px]
                                    uppercase
                                    tracking-[0.1em]
                                    hover:bg-[#151717]
                                    hover:text-[#e8e8e3]
                                  "
                                >
                                  <RotateCcw
                                    className="
                                      mr-2
                                      size-3
                                    "
                                  />
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

            <div
              className="
                flex
                flex-col
                gap-2
                border-t
                border-[#292c2c]
                px-5
                py-3
                font-mono
                text-[7px]
                uppercase
                tracking-[0.12em]
                text-[#3f4441]
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <span>
                JCLOUD / MACHINE CONTROL
              </span>

              <span>
                {
                  resettingCount > 0
                    ? `${resettingCount} RESETTING`
                    : `${inUseCount} IN USE`
                }
              </span>

            </div>

          </div>

        </section>

      </div>

    </JCloudShell>
  )
}