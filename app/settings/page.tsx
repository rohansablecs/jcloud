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
      <div className="mx-auto w-full max-w-[1200px] space-y-8">

        {/* HEADER */}

        <section className="border-b border-[#e4e8ef] pb-7">

          <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">

            <div className="flex size-7 items-center justify-center rounded-lg bg-[#eff6ff]">
              <User className="size-3.5 text-[#2563eb]" />
            </div>

            Account settings

          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-[#172033] sm:text-4xl">
            Settings
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#667085]">
            Manage your JCloud account and connected Nextcloud identity.
          </p>

        </section>


        {/* ERROR */}

        {error && (

          <div className="max-w-4xl rounded-xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4">

            <div className="flex items-center gap-2 text-xs font-semibold text-[#b42318]">

              <span className="size-2 rounded-full bg-[#dc2626]" />

              Unable to load account

            </div>

            <p className="mt-1.5 text-xs text-[#b42318]/80">
              {error}
            </p>

          </div>

        )}


        <div className="grid max-w-4xl gap-5">

          {/* PROFILE */}

          <section className="overflow-hidden rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            {/* SECTION HEADER */}

            <div className="flex items-center justify-between border-b border-[#eef1f5] px-6 py-5">

              <div>

                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">
                  Profile
                </div>

                <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[#172033]">
                  Account information
                </h2>

                <p className="mt-1 text-xs text-[#98a2b3]">
                  Your JCloud account identity.
                </p>

              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-[#f7f9fc]">

                <User className="size-4 text-[#667085]" />

              </div>

            </div>


            {/* PROFILE HERO */}

            <div className="flex items-center gap-4 border-b border-[#eef1f5] px-6 py-6">

              <Avatar className="size-16 rounded-xl border border-[#dfe5ee]">

                <AvatarImage
                  src={authApi.avatarUrl(128)}
                  alt={displayName}
                  className="rounded-xl object-cover"
                />

                <AvatarFallback className="rounded-xl bg-[#eff6ff] font-semibold text-[#2563eb]">
                  {initials}
                </AvatarFallback>

              </Avatar>


              <div className="min-w-0">

                <div className="truncate text-xl font-semibold tracking-tight text-[#172033]">

                  {loading
                    ? "Loading..."
                    : displayName}

                </div>

                <div className="mt-1 font-mono text-xs text-[#667085]">

                  {profile?.username
                    ? `@${profile.username}`
                    : "Loading account..."}

                </div>

              </div>

            </div>


            {/* ACCOUNT DATA */}

            <div className="grid sm:grid-cols-2">

              {/* DISPLAY NAME */}

              <div className="border-b border-[#eef1f5] p-6 sm:border-r">

                <div className="text-xs font-medium text-[#98a2b3]">
                  Display name
                </div>

                <div className="mt-2 text-sm font-medium text-[#344054]">

                  {loading
                    ? "Loading..."
                    : displayName}

                </div>

              </div>


              {/* USERNAME */}

              <div className="border-b border-[#eef1f5] p-6">

                <div className="text-xs font-medium text-[#98a2b3]">
                  Username
                </div>

                <div className="mt-2 font-mono text-sm font-medium text-[#344054]">

                  {loading
                    ? "Loading..."
                    : profile?.username || "—"}

                </div>

              </div>


              {/* EMAIL */}

              <div className="border-b border-[#eef1f5] p-6 sm:border-b-0 sm:border-r">

                <div className="text-xs font-medium text-[#98a2b3]">
                  Email
                </div>

                <div className="mt-2 flex items-center gap-2 font-mono text-sm font-medium text-[#344054]">

                  <Mail className="size-3.5 text-[#667085]" />

                  <span className="truncate">

                    {loading
                      ? "Loading..."
                      : profile?.email || "Not configured"}

                  </span>

                </div>

              </div>


              {/* IDENTITY PROVIDER */}

              <div className="p-6">

                <div className="text-xs font-medium text-[#98a2b3]">
                  Identity provider
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-[#344054]">

                  <span className="size-2 rounded-full bg-[#16a34a]" />

                  Nextcloud

                </div>

              </div>

            </div>

          </section>


          {/* SECURITY */}

          <section className="overflow-hidden rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            {/* SECTION HEADER */}

            <div className="flex items-center gap-3 border-b border-[#eef1f5] px-6 py-5">

              <div className="flex size-9 items-center justify-center rounded-lg bg-[#ecfdf3]">

                <ShieldCheck className="size-4 text-[#16a34a]" />

              </div>

              <div>

                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">
                  Security
                </div>

                <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#172033]">
                  Session
                </h2>

              </div>

            </div>


            {/* SESSION STATUS */}

            <div className="p-6">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-[#172033]">

                    <span className="size-2 rounded-full bg-[#16a34a]" />

                    JCloud session active

                  </div>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-[#667085]">
                    Your JCloud session authenticates requests while your
                    account identity remains synchronized with Nextcloud.
                  </p>

                </div>


                <div className="hidden rounded-lg bg-[#ecfdf3] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#15803d] sm:block">
                  Secure
                </div>

              </div>

            </div>

          </section>


          {/* ACCOUNT CONNECTION */}

          <section className="rounded-xl border border-[#e4e8ef] bg-[#f8fbff] p-5">

            <div className="flex gap-3">

              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">

                <Mail className="size-4 text-[#2563eb]" />

              </div>

              <div>

                <div className="text-sm font-semibold text-[#172033]">
                  Connected account
                </div>

                <p className="mt-1 text-xs leading-5 text-[#667085]">
                  JCloud uses your Nextcloud identity for account information
                  and profile synchronization.
                </p>

              </div>

            </div>

          </section>

        </div>


        {/* FOOTER */}

        <footer className="flex flex-col gap-2 border-t border-[#e4e8ef] py-5 text-xs text-[#98a2b3] sm:flex-row sm:items-center sm:justify-between">

          <span>
            JCloud · Account
          </span>

          <span>
            Identity synchronized with Nextcloud
          </span>

        </footer>

      </div>
    </JCloudShell>
  )
}