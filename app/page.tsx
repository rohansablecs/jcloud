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
    <main className="flex min-h-screen items-center justify-center bg-[#090a0a] text-[#e8e8e3]">

      <div className="text-center">

        <div className="mx-auto flex size-10 items-center justify-center border border-[#555b58]">

          <div className="size-2 bg-[#b7ff4a]" />

        </div>

        <div className="mt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4f5452]">
          JCLOUD
        </div>

      </div>

    </main>
  )
}