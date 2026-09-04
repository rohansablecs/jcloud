"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Activity,
  ChevronLeft,
  Database,
  HardDrive,
  LayoutDashboard,
  Monitor,
  Rocket,
  Settings,
} from "lucide-react"

const items = [
  ["01", "Dashboard", "/dashboard", LayoutDashboard],
  ["02", "Storage", "/storage", HardDrive],
  ["03", "Machines", "/machines", Monitor],
  ["04", "Applications", "/applications", Rocket],
  ["05", "Databases", "/databases", Database],
] as const

type SidebarProps = {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

function JCloudLogo() {
  return (
    <svg
      width="42"
      height="34"
      viewBox="0 0 42 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JCloud"
    >
      {/* CLOUD */}

      <path
        d="
          M10 27
          H30
          C36 27
          40 23.7
          40 19
          C40 14.8
          36.6 11.4
          32 11.1
          C30.6 6.1
          26.3 2.8
          21.1 2.8
          C15.3 2.8
          10.5 6.9
          9.1 12
          C4.1 12.2
          0.8 15.4
          0.8 19.7
          C0.8 24
          4.3 27
          10 27
          Z
        "
        fill="#b7ff4a"
      />

      {/* J CUT INTO CLOUD */}

      <path
        d="
          M23.5 7
          V17.7
          C23.5 20.8
          22 22.5
          19.5 22.5
          C17 22.5
          15.2 20.8
          15.2 18.3
        "
        stroke="#090a0a"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M21 7 H26"
        stroke="#090a0a"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`
        fixed
        inset-y-0
        left-0
        z-50
        hidden
        border-r
        border-[#292c2c]
        bg-[#090a0a]
        lg:block
        transition-[width]
        duration-300
        ease-out
        ${
          collapsed
            ? "w-[64px]"
            : "w-[250px]"
        }
      `}
    >

      {/* ================================================= */}
      {/* BRAND */}
      {/* ================================================= */}

      <div
        className={`
          relative
          flex
          h-[92px]
          items-center
          border-b
          border-[#292c2c]
          ${
            collapsed
              ? "justify-center"
              : "px-6"
          }
        `}
      >

        {collapsed ? (

          /*
           * COLLAPSED:
           * The logo itself is the expand button.
           * There is NO chevron rendered here.
           */

          <button
            type="button"
            onClick={() =>
              onCollapsedChange(false)
            }
            aria-label="Expand sidebar"
            className="
              flex
              h-10
              w-full
              items-center
              justify-center
              transition-transform
              duration-200
              hover:scale-105
            "
          >
            <JCloudLogo />
          </button>

        ) : (

          /*
           * EXPANDED:
           * Normal logo + collapse control.
           */

          <>
            <Link
              href="/dashboard"
              className="
                flex
                min-w-0
                items-center
              "
            >

              <div className="flex size-[42px] shrink-0 items-center justify-center">
                <JCloudLogo />
              </div>

              <div className="ml-3">

                <div className="text-[15px] font-semibold tracking-tight">
                  JCLOUD
                </div>

                <div className="mt-1 whitespace-nowrap font-mono text-[8px] tracking-[0.18em] text-[#737875]">
                  PRIVATE INFRASTRUCTURE
                </div>

              </div>

            </Link>


            {/* COLLAPSE BUTTON */}

            <button
              type="button"
              onClick={() =>
                onCollapsedChange(true)
              }
              aria-label="Collapse sidebar"
              className="
                absolute
                bottom-[-9px]
                right-[-1px]
                z-50
                flex
                size-5
                items-center
                justify-center
                bg-[#090a0a]
                text-[#59605d]
                transition-colors
                duration-150
                hover:text-[#b7ff4a]
              "
            >
              <ChevronLeft className="size-4" />
            </button>

          </>

        )}

      </div>


      {/* ================================================= */}
      {/* EXPANDED CONTENT */}
      {/* ================================================= */}

      <div
        className={`
          absolute
          inset-x-0
          top-[92px]
          bottom-0
          overflow-hidden
          transition-opacity
          duration-200
          ${
            collapsed
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }
        `}
      >

        {/* NAVIGATION */}

        <div className="px-4 py-8">

          <div className="mb-4 px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4f5452]">
            Navigation
          </div>

          <nav>

            {items.map(
              ([number, label, href]) => {

                const active =
                  href === "/dashboard"
                    ? pathname === "/dashboard" ||
                      pathname === "/"
                    : pathname.startsWith(href)

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      group
                      flex
                      h-11
                      items-center
                      border-b
                      border-[#181a1a]
                      px-2
                      font-mono
                      text-[11px]
                      uppercase
                      tracking-[0.08em]
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
                        mr-4
                        text-[9px]
                        ${
                          active
                            ? "text-black"
                            : "text-[#4f5452]"
                        }
                      `}
                    >
                      {number}
                    </span>

                    <span>
                      {label}
                    </span>

                    <span className="ml-auto">
                      {active ? "→" : ""}
                    </span>

                  </Link>
                )
              }
            )}

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
              className="
                mb-3
                flex
                items-center
                gap-3
                font-mono
                text-[10px]
                uppercase
                text-[#737875]
                transition-colors
                hover:text-white
              "
            >
              <span className="size-1.5 bg-[#b7ff4a]" />
              Monitoring
            </Link>

            <Link
              href="/settings"
              className="
                flex
                items-center
                gap-3
                font-mono
                text-[10px]
                uppercase
                text-[#737875]
                transition-colors
                hover:text-white
              "
            >
              <span className="size-1.5 border border-[#555b58]" />
              Settings
            </Link>

            <div className="mt-8 flex justify-between border-t border-[#292c2c] pt-4 font-mono text-[8px] uppercase text-[#4f5452]">

              <span>
                JCLOUD
              </span>

              <span>
                v0.1.0
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* COLLAPSED ICON RAIL */}
      {/* ================================================= */}

      <div
        className={`
          absolute
          inset-x-0
          top-[92px]
          bottom-0
          flex
          flex-col
          overflow-hidden
          transition-opacity
          duration-200
          ${
            collapsed
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      >

        {/* PAGE ICONS */}

        <nav>

          {items.map(
            ([number, label, href, Icon]) => {

              const active =
                href === "/dashboard"
                  ? pathname === "/dashboard" ||
                    pathname === "/"
                  : pathname.startsWith(href)

              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`
                    relative
                    flex
                    h-14
                    w-full
                    items-center
                    justify-center
                    border-b
                    border-[#181a1a]
                    transition-colors
                    ${
                      active
                        ? "bg-[#b7ff4a] text-black"
                        : "text-[#4f5452] hover:bg-[#151717] hover:text-[#b7ff4a]"
                    }
                  `}
                >

                  <Icon className="size-5" />

                </Link>
              )
            }
          )}

        </nav>


        {/* SYSTEM ICONS */}

        <div className="mt-auto border-t border-[#292c2c]">

          <Link
            href="/monitoring"
            title="Monitoring"
            className="
              flex
              h-14
              w-full
              items-center
              justify-center
              border-b
              border-[#181a1a]
              text-[#4f5452]
              transition-colors
              hover:bg-[#151717]
              hover:text-[#b7ff4a]
            "
          >
            <Activity className="size-5" />
          </Link>

          <Link
            href="/settings"
            title="Settings"
            className="
              flex
              h-14
              w-full
              items-center
              justify-center
              text-[#4f5452]
              transition-colors
              hover:bg-[#151717]
              hover:text-[#b7ff4a]
            "
          >
            <Settings className="size-5" />
          </Link>

        </div>

      </div>

    </aside>
  )
}