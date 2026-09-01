import Link from "next/link"

import {
  ArrowUpRight,
  Database,
  HardDrive,
  Monitor,
  Rocket,
} from "lucide-react"

import { JCloudShell } from "@/components/jcloud/shell"

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

export default function Dashboard() {
  return (
    <JCloudShell>

      <div className="j-scanlines">

        {/* INTRO */}

        <section className="grid min-h-[420px] grid-cols-1 border-b border-[#292c2c] lg:grid-cols-[1fr_320px]">

          <div className="relative flex flex-col justify-between border-r border-[#292c2c] py-8 pr-8 lg:py-12">

            <div className="j-label">
              JCLOUD // PRIVATE INFRASTRUCTURE
            </div>

            <div>

              <h1 className="j-display max-w-[850px] text-[clamp(4rem,9vw,9rem)] uppercase">
                Your own
                <br />
                <span className="text-[#737875]">
                  cloud.
                </span>
              </h1>

              <div className="mt-8 flex max-w-xl items-start gap-4">

                <div className="mt-1 size-2 shrink-0 bg-[#b7ff4a]" />

                <p className="max-w-md font-mono text-[11px] leading-6 text-[#737875]">
                  PRIVATE COMPUTE / STORAGE /
                  APPLICATIONS / DATA.
                  <br />
                  CONTROLLED BY YOU.
                </p>

              </div>

            </div>

            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#4f5452]">
              NODE / 01 &nbsp;&nbsp; INDIA
            </div>

          </div>

          {/* STATUS */}

          <div className="flex flex-col justify-between py-8 lg:py-12 lg:pl-8">

            <div className="flex justify-between">

              <span className="j-label">
                NODE STATUS
              </span>

              <span className="font-mono text-[9px] text-[#b7ff4a]">
                ● ONLINE
              </span>

            </div>

            <div>

              <div className="font-mono text-[11px] uppercase text-[#4f5452]">
                Primary node
              </div>

              <div className="mt-2 font-mono text-sm">
                JCLOUD-01
              </div>

              <div className="mt-1 font-mono text-[10px] text-[#737875]">
                Ubuntu Server / KVM
              </div>

            </div>

            <div className="border-t border-[#292c2c] pt-5">

              <div className="j-label">
                TELEMETRY
              </div>

              <div className="mt-3 font-mono text-[10px] leading-6 text-[#4f5452]">
                CPU&nbsp;&nbsp;&nbsp;WAITING
                <br />
                MEMORY&nbsp; WAITING
                <br />
                NETWORK WAITING
              </div>

            </div>

          </div>

        </section>


        {/* SYSTEMS */}

        <section className="py-10">

          <div className="mb-6 flex items-end justify-between">

            <div>

              <div className="j-label">
                01 — SYSTEMS
              </div>

              <h2 className="mt-2 text-2xl font-medium tracking-tight">
                Infrastructure
              </h2>

            </div>

            <div className="hidden font-mono text-[9px] uppercase text-[#4f5452] sm:block">
              04 SERVICES
            </div>

          </div>


          <div className="grid border-l border-t border-[#292c2c] md:grid-cols-2">

            {systems.map((system) => {

              const Icon = system.icon

              return (
                <Link
                  key={system.href}
                  href={system.href}
                  className="group relative min-h-[250px] border-b border-r border-[#292c2c] p-6 transition-colors hover:bg-[#101212]"
                >

                  <div className="flex items-start justify-between">

                    <span className="font-mono text-[9px] text-[#4f5452]">
                      {system.index}
                    </span>

                    <ArrowUpRight className="size-4 text-[#4f5452] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#b7ff4a]" />

                  </div>

                  <div className="absolute bottom-6 left-6 right-6">

                    <Icon className="mb-5 size-5 text-[#737875]" />

                    <div className="font-mono text-[9px] tracking-[0.15em] text-[#737875]">
                      {system.type}
                    </div>

                    <div className="mt-1 text-2xl font-medium tracking-tight">
                      {system.name}
                    </div>

                    <div className="mt-2 font-mono text-[10px] text-[#4f5452]">
                      {system.description}
                    </div>

                  </div>

                </Link>
              )
            })}

          </div>

        </section>


        {/* TELEMETRY */}

        <section className="border-t border-[#292c2c] py-10">

          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">

            <div>

              <div className="j-label">
                02 — TELEMETRY
              </div>

              <h2 className="mt-2 text-2xl font-medium tracking-tight">
                System health
              </h2>

              <p className="mt-4 max-w-sm font-mono text-[10px] leading-6 text-[#4f5452]">
                Live infrastructure metrics will appear
                here once the JCloud API establishes a
                connection with the server.
              </p>

            </div>


            <div className="grid border-l border-t border-[#292c2c] sm:grid-cols-3">

              {[
                ["CPU", "—"],
                ["MEMORY", "—"],
                ["STORAGE", "—"],
              ].map(([label, value]) => (

                <div
                  key={label}
                  className="border-b border-r border-[#292c2c] p-6"
                >

                  <div className="j-label">
                    {label}
                  </div>

                  <div className="mt-8 font-mono text-3xl text-[#4f5452]">
                    {value}
                  </div>

                  <div className="mt-2 font-mono text-[8px] uppercase text-[#4f5452]">
                    Awaiting telemetry
                  </div>

                </div>

              ))}

            </div>

          </div>

        </section>


        {/* FOOTER */}

        <footer className="flex flex-col gap-5 border-t border-[#292c2c] py-6 font-mono text-[9px] uppercase tracking-[0.12em] text-[#4f5452] sm:flex-row sm:items-center sm:justify-between">

  <div className="flex items-center gap-3">
    <span>JCLOUD / PRIVATE CLOUD</span>
    <span className="text-[#292c2c]">/</span>
    <span>2026</span>
  </div>

  <div className="flex items-center gap-5">
    <span className="text-[#737875]">
      Built by Rohan
    </span>

    <span className="text-[#292c2c]">/</span>

    <a
      href="https://github.com/rohansablecs"
      target="_blank"
      rel="noopener noreferrer"
      className="transition-colors hover:text-[#b7ff4a]"
    >
      GitHub ↗
    </a>

    <a
      href="https://www.linkedin.com/in/rohan-sable-5379643a7"
      target="_blank"
      rel="noopener noreferrer"
      className="transition-colors hover:text-[#b7ff4a]"
    >
      LinkedIn ↗
    </a>
  </div>

</footer>

      </div>

    </JCloudShell>
  )
}