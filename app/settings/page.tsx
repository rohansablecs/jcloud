"use client"

import { useEffect, useState } from "react"

import {
  Mail,
  User,
} from "lucide-react"

import { JCloudShell } from "@/components/jcloud/shell"

import {
  authApi,
  type UserProfile,
} from "@/lib/api"


export default function SettingsPage() {

  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")


  useEffect(() => {

    async function loadProfile() {

      try {

        const data =
          await authApi.me()

        setProfile(data)

      } catch (err) {

        console.error(
          "[JCloud Settings]",
          err
        )

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load account."
        )

      } finally {

        setLoading(false)

      }
    }

    loadProfile()

  }, [])


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
    <JCloudShell>

      <div className="space-y-10">

        <section>

          <div className="j-label">
            ACCOUNT
          </div>

          <h2 className="mt-2 text-4xl font-medium tracking-tight">
            Settings
          </h2>

          <p className="mt-3 max-w-xl font-mono text-[10px] leading-6 text-[#4f5452]">
            Your JCloud identity is synchronized
            directly with your Nextcloud account.
          </p>

        </section>


        {error && (
          <div className="border border-[#292c2c] bg-[#0d0f0f] p-5 font-mono text-[10px] text-red-400">
            {error}
          </div>
        )}


        <section className="max-w-3xl border border-[#292c2c]">

          <div className="border-b border-[#292c2c] p-6">

            <div className="flex items-center justify-between">

              <div>

                <div className="j-label">
                  PROFILE
                </div>

                <h3 className="mt-2 text-xl font-medium">
                  Account information
                </h3>

              </div>

              <User className="size-5 text-[#4f5452]" />

            </div>

          </div>


          <div className="grid sm:grid-cols-2">

            {/* DISPLAY NAME */}

            <div className="border-b border-r border-[#292c2c] p-6">

              <div className="j-label">
                DISPLAY NAME
              </div>

              <div className="mt-4 text-lg">
                {loading
                  ? "Loading..."
                  : displayName}
              </div>

            </div>


            {/* USERNAME */}

            <div className="border-b border-[#292c2c] p-6">

              <div className="j-label">
                USERNAME
              </div>

              <div className="mt-4 font-mono text-sm">
                {loading
                  ? "Loading..."
                  : profile?.username || "—"}
              </div>

            </div>


            {/* EMAIL */}

            <div className="border-b border-r border-[#292c2c] p-6">

              <div className="j-label">
                EMAIL
              </div>

              <div className="mt-4 flex items-center gap-2 font-mono text-sm">

                <Mail className="size-3 text-[#4f5452]" />

                {loading
                  ? "Loading..."
                  : profile?.email || "Not configured"}

              </div>

            </div>


            {/* SOURCE */}

            <div className="border-b border-[#292c2c] p-6">

              <div className="j-label">
                IDENTITY PROVIDER
              </div>

              <div className="mt-4 font-mono text-sm">
                NEXTCLOUD
              </div>

            </div>

          </div>

        </section>


        <section className="max-w-3xl border border-[#292c2c]">

          <div className="p-6">

            <div className="j-label">
              SESSION
            </div>

            <div className="mt-3 flex items-center gap-3">

              <span className="size-2 bg-[#b7ff4a]" />

              <span className="font-mono text-[10px] uppercase">
                JCloud session active
              </span>

            </div>

            <p className="mt-4 max-w-lg font-mono text-[9px] leading-5 text-[#4f5452]">
              Authentication is handled by JCloud
              while your identity and profile remain
              synchronized with Nextcloud.
            </p>

          </div>

        </section>

      </div>

    </JCloudShell>
  )
}