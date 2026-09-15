"use client"

import { useState } from "react"

import { Sidebar } from "./sidebar"
import { Header } from "./header"

export function JCloudShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#172033]">

      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      <div
        className={`
          min-h-screen
          transition-[padding]
          duration-300
          ease-out
          ${
            collapsed
              ? "lg:pl-[64px]"
              : "lg:pl-[250px]"
          }
        `}
      >

        <Header />

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

          <div className="mx-auto w-full max-w-[1500px]">

            {children}

          </div>

        </main>

      </div>

    </div>
  )
}