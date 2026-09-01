"use client"

import { usePathname, useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const titles: Record<string, string> = {
  "/": "Dashboard",
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

  const title =
    titles[pathname] ??
    Object.entries(titles).find(
      ([path]) =>
        path !== "/" && pathname.startsWith(path)
    )?.[1] ??
    "JCloud"

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

        {/* SERVER STATUS */}

        <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-[#737875] sm:flex">

          <span className="size-1.5 bg-[#b7ff4a]" />

          System online

        </div>


        {/* ACCOUNT MENU */}

        <DropdownMenu>

          <DropdownMenuTrigger
            className="
              flex
              size-8
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

            <Avatar className="size-7 rounded-none">

              <AvatarFallback className="rounded-none bg-transparent font-mono text-[9px] text-[#e8e8e3]">
                JC
              </AvatarFallback>

            </Avatar>

          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="end"
            className="
              w-48
              rounded-none
              border-[#292c2c]
              bg-[#0d0f0f]
              p-1
              text-[#e8e8e3]
            "
          >

            <DropdownMenuItem
              onClick={() => router.push("/settings")}
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
              onClick={() => router.push("/login")}
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