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
    <header className="flex h-[92px] items-center justify-between border-b border-[#292c2c] px-6 lg:px-10">

      {/* PAGE LOCATION */}

      <div className="flex items-center gap-5">

        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#4f5452]">
          SYSTEM
        </span>

        <span className="h-3 w-px bg-[#292c2c]" />

        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a5aaa7]">
          {title}
        </span>

      </div>


      {/* RIGHT SIDE */}

      <div className="flex items-center gap-6">

        <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-[#737875] sm:flex">

          <span className="size-1.5 bg-[#b7ff4a]" />

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
              border
              border-[#292c2c]
              bg-transparent
              p-0
              text-[#e8e8e3]
              outline-none
              transition-colors
              hover:bg-[#151717]
              focus-visible:border-[#b7ff4a]
            "
          >

            <Avatar className="size-8 rounded-none">

              {!avatarError && (
                <AvatarImage
                  src={authApi.avatarUrl(64)}
                  alt={displayName}
                  onError={() =>
                    setAvatarError(true)
                  }
                  className="rounded-none object-cover"
                />
              )}

              <AvatarFallback className="rounded-none bg-transparent font-mono text-[9px] text-[#e8e8e3]">
                {initials}
              </AvatarFallback>

            </Avatar>

          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="end"
            className="
              w-64
              rounded-none
              border-[#292c2c]
              bg-[#0d0f0f]
              p-1
              text-[#e8e8e3]
            "
          >

            <div className="px-3 py-3">

              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#e8e8e3]">
                {displayName}
              </div>

              <div className="mt-1 font-mono text-[9px] text-[#4f5452]">
                @{profile?.username ?? "account"}
              </div>

              {profile?.email && (
                <div className="mt-1 truncate font-mono text-[9px] text-[#4f5452]">
                  {profile.email}
                </div>
              )}

            </div>


            <DropdownMenuSeparator className="bg-[#292c2c]" />


            <DropdownMenuItem
              onClick={() =>
                router.push("/settings")
              }
              className="
                cursor-pointer
                rounded-none
                font-mono
                text-[10px]
                uppercase
                tracking-[0.08em]
                focus:bg-[#151717]
                focus:text-white
              "
            >
              <User className="mr-2 size-3" />

              Account
            </DropdownMenuItem>


            <DropdownMenuSeparator className="bg-[#292c2c]" />


            <DropdownMenuItem
              onClick={handleLogout}
              className="
                cursor-pointer
                rounded-none
                font-mono
                text-[10px]
                uppercase
                tracking-[0.08em]
                focus:bg-[#151717]
                focus:text-white
              "
            >
              <LogOut className="mr-2 size-3" />

              Sign out
            </DropdownMenuItem>

          </DropdownMenuContent>

        </DropdownMenu>

      </div>

    </header>
  )
}