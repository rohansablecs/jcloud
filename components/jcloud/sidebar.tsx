"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  ["01", "Dashboard", "/dashboard"],
  ["02", "Storage", "/storage"],
  ["03", "Machines", "/machines"],
  ["04", "Applications", "/applications"],
  ["05", "Databases", "/databases"],
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-[#292c2c] bg-[#090a0a] lg:block">

      {/* HEADER */}

      <div className="flex h-[92px] flex-col justify-between border-b border-[#292c2c] px-6 py-5">

        <Link href="/dashboard" className="group">
          <div className="flex items-center gap-3">

            <div className="relative flex size-8 items-center justify-center border border-[#555b58]">
              <div className="size-2 bg-[#b7ff4a]" />
            </div>

            <div>
              <div className="text-[15px] font-semibold tracking-tight">
                JCLOUD
              </div>

              <div className="font-mono text-[8px] tracking-[0.18em] text-[#737875]">
                PRIVATE INFRASTRUCTURE
              </div>
            </div>

          </div>
        </Link>

      </div>

      {/* NAVIGATION */}

      <div className="px-4 py-8">

        <div className="mb-4 px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4f5452]">
          Navigation
        </div>

        <nav>
          {items.map(([number, label, href]) => {

            const active =
              href === "/dashboard"
                ? pathname === "/"
                : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                className={`
                  group flex h-11 items-center border-b border-[#181a1a]
                  px-2 font-mono text-[11px] uppercase tracking-[0.08em]
                  transition-colors
                  ${
                    active
                      ? "bg-[#b7ff4a] text-black"
                      : "text-[#858b88] hover:bg-[#151717] hover:text-white"
                  }
                `}
              >

                <span
                  className={`
                    mr-4 text-[9px]
                    ${
                      active
                        ? "text-black"
                        : "text-[#4f5452]"
                    }
                  `}
                >
                  {number}
                </span>

                <span>{label}</span>

                <span className="ml-auto">
                  {active ? "→" : ""}
                </span>

              </Link>
            )
          })}
        </nav>

      </div>

      {/* SYSTEM */}

      <div className="absolute bottom-0 left-0 right-0 border-t border-[#292c2c]">

        <div className="p-5">

          <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4f5452]">
            System
          </div>

          <Link
            href="/monitoring"
            className="mb-2 flex items-center gap-3 font-mono text-[10px] uppercase text-[#737875] hover:text-white"
          >
            <span className="size-1.5 bg-[#b7ff4a]" />
            Monitoring
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 font-mono text-[10px] uppercase text-[#737875] hover:text-white"
          >
            <span className="size-1.5 border border-[#555b58]" />
            Settings
          </Link>

          <div className="mt-8 flex justify-between border-t border-[#292c2c] pt-4 font-mono text-[8px] uppercase text-[#4f5452]">
            <span>JCLOUD</span>
            <span>v0.1.0</span>
          </div>

        </div>

      </div>

    </aside>
  )
}