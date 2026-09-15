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
      <defs>
        <mask
          id="jcloud-sidebar-logo"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="42"
          height="34"
        >
          {/* Everything starts transparent */}
          <rect
            width="42"
            height="34"
            fill="black"
          />

          {/* Cloud is visible */}
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
            fill="white"
          />

          {/* J becomes transparent / cut out */}
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
            stroke="black"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M21 7 H26"
            stroke="black"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </mask>
      </defs>

      {/* BLUE CLOUD ONLY */}
      <rect
        width="42"
        height="34"
        fill="#2563EB"
        mask="url(#jcloud-sidebar-logo)"
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
        border-[#e4e8ef]
        bg-white
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

      {/* BRAND */}

      <div
        className={`
          relative
          flex
          h-[76px]
          items-center
          border-b
          border-[#e4e8ef]
          ${
            collapsed
              ? "justify-center"
              : "px-5"
          }
        `}
      >

        {collapsed ? (

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
              rounded-lg
              transition
              hover:bg-[#f7f9fc]
            "
          >
            <JCloudLogo />
          </button>

        ) : (

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

                <div className="text-[15px] font-semibold tracking-tight text-[#172033]">
                  JCLOUD
                </div>

                <div className="mt-0.5 whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.14em] text-[#98a2b3]">
                  Private infrastructure
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
                right-[-10px]
                top-1/2
                z-50
                flex
                size-5
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-[#e4e8ef]
                bg-white
                text-[#98a2b3]
                shadow-sm
                transition
                hover:border-[#bfdbfe]
                hover:text-[#2563eb]
              "
            >
              <ChevronLeft className="size-3.5" />
            </button>

          </>

        )}

      </div>


      {/* EXPANDED CONTENT */}

      <div
        className={`
          absolute
          inset-x-0
          top-[76px]
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

        <div className="px-3 py-6">

          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
            Workspace
          </div>

          <nav className="space-y-1">

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
                    className={`
                      group
                      flex
                      h-11
                      items-center
                      rounded-lg
                      px-3
                      text-sm
                      font-medium
                      transition
                      ${
                        active
                          ? "bg-[#eff6ff] text-[#2563eb]"
                          : "text-[#667085] hover:bg-[#f7f9fc] hover:text-[#344054]"
                      }
                    `}
                  >

                    <div
                      className={`
                        flex
                        size-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-md
                        ${
                          active
                            ? "bg-white shadow-sm"
                            : ""
                        }
                      `}
                    >

                      <Icon
                        className={`
                          size-4
                          ${
                            active
                              ? "text-[#2563eb]"
                              : "text-[#98a2b3] group-hover:text-[#667085]"
                          }
                        `}
                      />

                    </div>

                    <span className="ml-3">
                      {label}
                    </span>

                    {active && (
                      <span className="ml-auto size-1.5 rounded-full bg-[#2563eb]" />
                    )}

                  </Link>
                )
              }
            )}

          </nav>

        </div>


        {/* SYSTEM */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-[#eef1f5] bg-white">

          <div className="p-4">

            <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
              System
            </div>


            <Link
              href="/monitoring"
              className={`
                mb-1
                flex
                h-10
                items-center
                gap-3
                rounded-lg
                px-3
                text-xs
                font-medium
                transition
                ${
                  pathname.startsWith(
                    "/monitoring"
                  )
                    ? "bg-[#eff6ff] text-[#2563eb]"
                    : "text-[#667085] hover:bg-[#f7f9fc] hover:text-[#344054]"
                }
              `}
            >

              <div className="flex size-7 items-center justify-center rounded-md bg-[#f7f9fc]">

                <Activity className="size-3.5 text-[#667085]" />

              </div>

              Monitoring

            </Link>


            <Link
              href="/settings"
              className={`
                flex
                h-10
                items-center
                gap-3
                rounded-lg
                px-3
                text-xs
                font-medium
                transition
                ${
                  pathname.startsWith(
                    "/settings"
                  )
                    ? "bg-[#eff6ff] text-[#2563eb]"
                    : "text-[#667085] hover:bg-[#f7f9fc] hover:text-[#344054]"
                }
              `}
            >

              <div className="flex size-7 items-center justify-center rounded-md bg-[#f7f9fc]">

                <Settings className="size-3.5 text-[#667085]" />

              </div>

              Settings

            </Link>


            <div className="mt-4 flex items-center justify-between border-t border-[#eef1f5] px-2 pt-4 text-[10px] text-[#98a2b3]">

              <span className="font-medium">
                JCloud
              </span>

              <span className="font-mono">
                v0.1.0
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* COLLAPSED ICON RAIL */}

      <div
        className={`
          absolute
          inset-x-0
          top-[76px]
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

        <nav className="p-2">

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
                    mb-1
                    flex
                    h-11
                    w-full
                    items-center
                    justify-center
                    rounded-lg
                    transition
                    ${
                      active
                        ? "bg-[#eff6ff] text-[#2563eb]"
                        : "text-[#98a2b3] hover:bg-[#f7f9fc] hover:text-[#667085]"
                    }
                  `}
                >

                  <Icon className="size-4" />

                </Link>
              )
            }
          )}

        </nav>


        {/* SYSTEM ICONS */}

        <div className="mt-auto border-t border-[#eef1f5] p-2">

          <Link
            href="/monitoring"
            title="Monitoring"
            className={`
              mb-1
              flex
              h-11
              w-full
              items-center
              justify-center
              rounded-lg
              transition
              ${
                pathname.startsWith(
                  "/monitoring"
                )
                  ? "bg-[#eff6ff] text-[#2563eb]"
                  : "text-[#98a2b3] hover:bg-[#f7f9fc] hover:text-[#667085]"
              }
            `}
          >
            <Activity className="size-4" />
          </Link>


          <Link
            href="/settings"
            title="Settings"
            className={`
              flex
              h-11
              w-full
              items-center
              justify-center
              rounded-lg
              transition
              ${
                pathname.startsWith(
                  "/settings"
                )
                  ? "bg-[#eff6ff] text-[#2563eb]"
                  : "text-[#98a2b3] hover:bg-[#f7f9fc] hover:text-[#667085]"
              }
            `}
          >
            <Settings className="size-4" />
          </Link>

        </div>

      </div>

    </aside>
  )
}