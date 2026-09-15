"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  LogOut,
  User,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  authApi,
  type UserProfile,
} from "@/lib/api"


const titles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/storage": "Storage",
  "/machines": "Machines",
  "/applications": "Applications",
  "/databases": "Databases",
  "/monitoring": "Monitoring",
  "/settings": "Settings",
}


export function Header() {

  const pathname = usePathname()
  const router = useRouter()

  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [avatarError, setAvatarError] =
    useState(false)

  const title =
    titles[pathname] ??
    Object.entries(titles).find(
      ([path]) =>
        path !== "/" &&
        pathname.startsWith(path)
    )?.[1] ??
    "JCloud"


  useEffect(() => {

    let cancelled = false

    async function loadProfile() {

      try {
        const data =
          await authApi.me()

        if (!cancelled) {
          setProfile(data)
        }

      } catch {
        if (!cancelled) {
          setProfile(null)
        }
      }

    }

    loadProfile()

    return () => {
      cancelled = true
    }

  }, [])


  async function handleLogout() {

    try {
      await authApi.logout()
    } catch {}

    router.replace("/login")
    router.refresh()
  }


  const displayName =
    profile?.display_name ||
    profile?.username ||
    "Account"

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase()
      )
      .join("") ||
    "JC"


  return (
    <header className="flex h-[76px] items-center justify-between border-b border-[#e4e8ef] bg-white px-5 lg:px-8">

      {/* PAGE LOCATION */}

      <div className="flex min-w-0 items-center gap-3">

        <div className="hidden items-center gap-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3] sm:flex">

          <span>
            JCloud
          </span>

          <span className="text-[#d0d5dd]">
            /
          </span>

        </div>


        <div className="truncate text-sm font-semibold text-[#172033]">

          {title}

        </div>

      </div>


      {/* RIGHT SIDE */}

      <div className="flex items-center gap-4">

        {/* SYSTEM STATUS */}

        <div className="hidden items-center gap-2 rounded-full bg-[#ecfdf3] px-3 py-1.5 text-[10px] font-medium text-[#15803d] sm:flex">

          <span className="size-1.5 rounded-full bg-[#16a34a]" />

          System online

        </div>


        {/* ACCOUNT */}

        <DropdownMenu>

          <DropdownMenuTrigger
            className="
              flex
              size-10
              items-center
              justify-center
              rounded-xl
              border
              border-[#e4e8ef]
              bg-white
              p-0
              outline-none
              shadow-sm
              transition
              hover:bg-[#f7f9fc]
              focus-visible:border-[#2563eb]
              focus-visible:ring-4
              focus-visible:ring-[#2563eb]/10
            "
          >

            <Avatar className="size-8 rounded-lg">

              {!avatarError && (
                <AvatarImage
                  src={authApi.avatarUrl(64)}
                  alt={displayName}
                  onError={() =>
                    setAvatarError(true)
                  }
                  className="rounded-lg object-cover"
                />
              )}

              <AvatarFallback className="rounded-lg bg-[#eff6ff] font-semibold text-[10px] text-[#2563eb]">
                {initials}
              </AvatarFallback>

            </Avatar>

          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="
              w-64
              rounded-xl
              border-[#e4e8ef]
              bg-white
              p-1.5
              text-[#172033]
              shadow-[0_12px_32px_rgba(16,24,40,0.12)]
            "
          >

            {/* ACCOUNT SUMMARY */}

            <div className="px-3 py-3">

              <div className="flex items-center gap-3">

                <Avatar className="size-9 rounded-lg">

                  {!avatarError && (
                    <AvatarImage
                      src={authApi.avatarUrl(64)}
                      alt={displayName}
                      onError={() =>
                        setAvatarError(true)
                      }
                      className="rounded-lg object-cover"
                    />
                  )}

                  <AvatarFallback className="rounded-lg bg-[#eff6ff] text-[10px] font-semibold text-[#2563eb]">
                    {initials}
                  </AvatarFallback>

                </Avatar>


                <div className="min-w-0">

                  <div className="truncate text-sm font-semibold text-[#172033]">
                    {displayName}
                  </div>

                  <div className="mt-0.5 truncate font-mono text-[10px] text-[#98a2b3]">
                    @{profile?.username ?? "account"}
                  </div>

                </div>

              </div>


              {profile?.email && (
                <div className="mt-3 truncate border-t border-[#eef1f5] pt-3 font-mono text-[10px] text-[#98a2b3]">
                  {profile.email}
                </div>
              )}

            </div>


            <DropdownMenuSeparator className="bg-[#eef1f5]" />


            {/* ACCOUNT */}

            <DropdownMenuItem
              onClick={() =>
                router.push("/settings")
              }
              className="
                cursor-pointer
                rounded-lg
                px-3
                py-2.5
                text-xs
                font-medium
                text-[#344054]
                outline-none
                focus:bg-[#f7f9fc]
                focus:text-[#172033]
              "
            >

              <div className="mr-2 flex size-7 items-center justify-center rounded-md bg-[#eff6ff]">

                <User className="size-3.5 text-[#2563eb]" />

              </div>

              Account

            </DropdownMenuItem>


            <DropdownMenuSeparator className="bg-[#eef1f5]" />


            {/* SIGN OUT */}

            <DropdownMenuItem
              onClick={handleLogout}
              className="
                cursor-pointer
                rounded-lg
                px-3
                py-2.5
                text-xs
                font-medium
                text-[#dc2626]
                outline-none
                focus:bg-[#fef2f2]
                focus:text-[#dc2626]
              "
            >

              <div className="mr-2 flex size-7 items-center justify-center rounded-md bg-[#fef2f2]">

                <LogOut className="size-3.5 text-[#dc2626]" />

              </div>

              Sign out

            </DropdownMenuItem>

          </DropdownMenuContent>

        </DropdownMenu>

      </div>

    </header>
  )
}