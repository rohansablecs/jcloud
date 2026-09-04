"use client"

import { useEffect, useState } from "react"
import { Mail, User, ShieldCheck } from "lucide-react"

import { JCloudShell } from "@/components/jcloud/shell"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

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
    let cancelled = false

    async function loadProfile() {
      try {
        const data = await authApi.me()

        if (!cancelled) {
          setProfile(data)
        }
      } catch (err) {
        console.error("[JCloud Settings]", err)

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load account."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
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
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join("") || "JC"

  return (
    <JCloudShell>
      <div className="space-y-10">

        {/* HEADER */}

        <section>
          <div className="j-label">
            ACCOUNT
          </div>

          <h2 className="mt-2 text-4xl font-medium tracking-tight">
            Settings
          </h2>

          <p className="mt-3 max-w-xl font-mono text-[10px] leading-6 text-[#4f5452]">
            Manage your JCloud account and
            Nextcloud identity.
          </p>
        </section>

        {/* ERROR */}

        {error && (
          <div className="max-w-3xl border border-red-900/40 bg-[#0d0f0f] p-5 font-mono text-[10px] text-red-400">
            {error}
          </div>
        )}

        {/* PROFILE */}

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

          {/* PROFILE HERO */}

          <div className="flex items-center gap-5 border-b border-[#292c2c] p-6">

            <Avatar className="size-16 rounded-none border border-[#292c2c]">
              <AvatarImage
                src={authApi.avatarUrl(128)}
                alt={displayName}
                className="rounded-none object-cover"
              />

              <AvatarFallback className="rounded-none bg-[#151717] font-mono text-sm text-[#e8e8e3]">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="text-xl font-medium">
                {loading
                  ? "Loading..."
                  : displayName}
              </div>

              <div className="mt-1 font-mono text-[10px] text-[#4f5452]">
                {profile?.username
                  ? `@${profile.username}`
                  : "Loading account..."}
              </div>
            </div>

          </div>

          {/* ACCOUNT DATA */}

          <div className="grid sm:grid-cols-2">

            <div className="border-b border-r border-[#292c2c] p-6">

              <div className="j-label">
                DISPLAY NAME
              </div>

              <div className="mt-4 text-sm">
                {loading
                  ? "Loading..."
                  : displayName}
              </div>

            </div>

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

            <div className="border-r border-[#292c2c] p-6">

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

            <div className="p-6">

              <div className="j-label">
                IDENTITY PROVIDER
              </div>

              <div className="mt-4 font-mono text-sm">
                NEXTCLOUD
              </div>

            </div>

          </div>

        </section>

        {/* SECURITY / SESSION */}

        <section className="max-w-3xl border border-[#292c2c]">

          <div className="border-b border-[#292c2c] p-6">

            <div className="flex items-center gap-3">

              <ShieldCheck className="size-4 text-[#b7ff4a]" />

              <div>
                <div className="j-label">
                  SECURITY
                </div>

                <h3 className="mt-2 text-lg font-medium">
                  Session
                </h3>
              </div>

            </div>

          </div>

          <div className="p-6">

            <div className="flex items-center gap-3">

              <span className="size-2 bg-[#b7ff4a]" />

              <span className="font-mono text-[10px] uppercase tracking-[0.08em]">
                JCloud session active
              </span>

            </div>

            <p className="mt-4 max-w-lg font-mono text-[9px] leading-5 text-[#4f5452]">
              Your JCloud session authenticates
              requests while your account identity
              remains synchronized with Nextcloud.
            </p>

          </div>

        </section>

      </div>
    </JCloudShell>
  )
}
