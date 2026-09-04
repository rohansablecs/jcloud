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
    <div className="min-h-screen bg-[#090a0a] text-[#e8e8e3]">

      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      <div
        className={`
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

        <main className="px-6 py-8 lg:px-10 lg:py-12">

          <div className="mx-auto max-w-[1500px]">

            {children}

          </div>

        </main>

      </div>

    </div>
  )
}