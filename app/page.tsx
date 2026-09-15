"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { authApi } from "@/lib/api"

export default function EntryPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        await authApi.me()

        if (!cancelled) {
          router.replace("/dashboard")
        }
      } catch {
        if (!cancelled) {
          router.replace("/login")
        }
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-6">
      <div className="flex flex-col items-center">
        {/* Brand mark */}
        <div className="flex size-11 items-center justify-center rounded-[10px] bg-[#2563eb] shadow-sm">
          <span className="text-[11px] font-bold tracking-tight text-white">
            JC
          </span>
        </div>

        {/* Brand */}
        <div className="mt-4 text-[15px] font-semibold tracking-[-0.02em] text-[#172033]">
          JCloud
        </div>

        <div className="mt-1 text-[11px] text-[#98a2b3]">
          Private cloud infrastructure
        </div>

        {/* Loading indicator */}
        <div className="mt-7 flex items-center gap-2">
          <span className="size-1.5 animate-pulse rounded-full bg-[#2563eb]" />

          <span className="text-[11px] font-medium text-[#667085]">
            Checking your session
          </span>
        </div>
      </div>
    </main>
  )
}