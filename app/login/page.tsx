"use client"

import { FormEvent, useEffect, useState } from "react"
import {
  ArrowRight,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { authApi } from "@/lib/api"

function JCloudLogo() {
  return (
    <svg
      width="42"
      height="34"
      viewBox="0 0 42 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JCloud"
    >
      <defs>
        <mask
          id="jcloud-login-logo"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="42"
          height="34"
        >
          <rect
            width="42"
            height="34"
            fill="black"
          />

          {/* CLOUD */}

          <path
            d="
              M10 27
              H30
              C36 27
              40 23.7
              40 19
              C40 14.8
              36.6 11.4
              32 11.1
              C30.6 6.1
              26.3 2.8
              21.1 2.8
              C15.3 2.8
              10.5 6.9
              9.1 12
              C4.1 12.2
              0.8 15.4
              0.8 19.7
              C0.8 24
              4.3 27
              10 27
              Z
            "
            fill="white"
          />

          {/* J CUTOUT */}

          <path
            d="
              M23.5 7
              V17.7
              C23.5 20.8
              22 22.5
              19.5 22.5
              C17 22.5
              15.2 20.8
              15.2 18.3
            "
            stroke="black"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M21 7 H26"
            stroke="black"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </mask>
      </defs>

      <rect
        width="42"
        height="34"
        fill="#2563EB"
        mask="url(#jcloud-login-logo)"
      />
    </svg>
  )
}


/* =========================================================
   REACT-BITS STYLE SPOTLIGHT
   ========================================================= */

function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  const [position, setPosition] = useState({
    x: 50,
    y: 50,
  })

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    const rect =
      event.currentTarget.getBoundingClientRect()

    setPosition({
      x:
        ((event.clientX - rect.left) /
          rect.width) *
        100,
      y:
        ((event.clientY - rect.top) /
          rect.height) *
        100,
    })
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      className={`
        relative
        overflow-hidden
        ${className}
      `}
    >

      {/* CURSOR SPOTLIGHT */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          z-0
          opacity-0
          transition-opacity
          duration-500
          group-hover:opacity-100
        "
        style={{
          background: `
            radial-gradient(
              500px circle at ${position.x}% ${position.y}%,
              rgba(37,99,235,0.075),
              transparent 42%
            )
          `,
        }}
      />

      <div className="relative z-10">
        {children}
      </div>

    </div>
  )
}


/* =========================================================
   ANIMATED BACKGROUND
   ========================================================= */

function LoginGrid() {
  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        inset-0
        overflow-hidden
      "
    >

      <div
        className="
          absolute
          -inset-[64px]
          opacity-[0.48]
          [background-image:linear-gradient(to_right,#dbe7fb_1px,transparent_1px),linear-gradient(to_bottom,#dbe7fb_1px,transparent_1px)]
          [background-size:32px_32px]
          animate-[jcloudGrid_18s_linear_infinite]
        "
      />

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_50%_45%,rgba(37,99,235,0.065),transparent_42%)]
        "
      />

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_center,transparent_30%,#f6f8fc_82%)]
        "
      />

    </div>
  )
}


/* =========================================================
   PAGE
   ========================================================= */

export default function LoginPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const cleanUsername = username.trim()

    if (!cleanUsername || !password) {
      setError("USERNAME AND PASSWORD REQUIRED")
      return
    }

    setLoading(true)
    setError("")

    try {
      await authApi.login(cleanUsername, password)

      router.replace("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("[JCloud Login]", err)

      setError(
        err instanceof Error
          ? err.message.toUpperCase()
          : "UNABLE TO CONNECT TO JCLOUD"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fc] text-[#172033]">

      <style>{`
        @keyframes jcloudGrid {
          0% {
            transform: translate3d(0, 0, 0);
          }

          100% {
            transform: translate3d(32px, 32px, 0);
          }
        }

        @keyframes jcloudReveal {
          0% {
            opacity: 0;
            transform: translateY(14px);
            filter: blur(8px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes jcloudLogoReveal {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes jcloudPulse {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.12);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>


      {/* BACKGROUND */}

      <LoginGrid />


      {/* =====================================================
          BRAND
      ===================================================== */}

      <div
        className={`
          absolute
          left-6
          top-6
          z-20
          sm:left-8
          sm:top-8
          ${
            mounted
              ? "animate-[jcloudLogoReveal_700ms_cubic-bezier(.22,1,.36,1)_both]"
              : "opacity-0"
          }
        `}
      >

        <div className="flex items-center gap-3">

          <JCloudLogo />

          <div>

            <div className="text-sm font-semibold tracking-tight text-[#172033]">
              JCloud
            </div>

            <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#98a2b3]">
              Private infrastructure
            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          STATUS
      ===================================================== */}

      <div className="absolute right-6 top-7 z-20 sm:right-8 sm:top-9">

        <div className="flex items-center gap-2 text-xs text-[#667085]">

          <span
            className="
              size-1.5
              rounded-full
              bg-[#16a34a]
              animate-[jcloudPulse_2.5s_ease-in-out_infinite]
            "
          />

          <span className="hidden sm:inline">
            System operational
          </span>

        </div>

      </div>


      {/* =====================================================
          LOGIN
      ===================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-24 sm:px-8">

        <SpotlightCard
          className={`
            group
            w-full
            max-w-[920px]
            rounded-2xl
            border
            border-[#e4e8ef]
            bg-white
            shadow-[0_24px_80px_rgba(16,24,40,0.08)]
            transition-shadow
            duration-500
            hover:shadow-[0_28px_90px_rgba(37,99,235,0.09)]
            ${
              mounted
                ? "animate-[jcloudReveal_800ms_cubic-bezier(.22,1,.36,1)_both]"
                : "opacity-0"
            }
          `}
        >

          <div className="grid overflow-hidden lg:grid-cols-[1fr_430px]">


            {/* =================================================
                LEFT
            ================================================= */}

            <section className="relative hidden overflow-hidden border-r border-[#e4e8ef] bg-[#f8faff] p-10 lg:flex lg:flex-col lg:justify-between">

              <div
                className="
                  pointer-events-none
                  absolute
                  -inset-16
                  opacity-40
                  [background-image:linear-gradient(to_right,#dbe7fb_1px,transparent_1px),linear-gradient(to_bottom,#dbe7fb_1px,transparent_1px)]
                  [background-size:32px_32px]
                  animate-[jcloudGrid_24s_linear_infinite]
                "
              />

              <div className="relative">

                <div className="flex items-center gap-2 text-xs font-medium text-[#2563eb]">

                  <span className="flex size-7 items-center justify-center rounded-lg border border-[#dbe7fb] bg-white shadow-sm">

                    <ShieldCheck className="size-3.5" />

                  </span>

                  Secure infrastructure access

                </div>


                <div className="mt-16 max-w-md">

                  <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#172033]">

                    Your cloud.
                    <br />

                    <span className="text-[#2563eb]">
                      Your control.
                    </span>

                  </h1>

                  <p className="mt-6 max-w-sm text-sm leading-6 text-[#667085]">
                    Access your private compute, storage,
                    applications and data from one secure
                    control plane.
                  </p>

                </div>

              </div>


              {/* EXISTING INFO */}

              <div className="relative grid grid-cols-2 gap-3">

                <div className="rounded-xl border border-[#dbe7fb] bg-white/85 p-4 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1">

                  <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                    Infrastructure
                  </div>

                  <div className="mt-2 text-sm font-semibold text-[#344054]">
                    Private
                  </div>

                </div>


                <div className="rounded-xl border border-[#dbe7fb] bg-white/85 p-4 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1">

                  <div className="text-[10px] font-medium uppercase tracking-wide text-[#98a2b3]">
                    Access
                  </div>

                  <div className="mt-2 text-sm font-semibold text-[#344054]">
                    Protected
                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                RIGHT
            ================================================= */}

            <section className="p-7 sm:p-10">

              <div className="mx-auto w-full max-w-sm">


                {/* MOBILE BRAND */}

                <div className="mb-10 flex items-center gap-3 lg:hidden">

                  <JCloudLogo />

                  <div>

                    <div className="text-sm font-semibold text-[#172033]">
                      JCloud
                    </div>

                    <div className="text-[10px] uppercase tracking-[0.12em] text-[#98a2b3]">
                      Private infrastructure
                    </div>

                  </div>

                </div>


                {/* HEADER */}

                <div>

                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#eff6ff] transition-transform duration-300 hover:scale-105">

                    <LockKeyhole className="size-4 text-[#2563eb]" />

                  </div>


                  <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">
                    Welcome back
                  </h2>

                  <p className="mt-2 text-sm leading-5 text-[#667085]">
                    Sign in with your Nextcloud account
                    to access JCloud.
                  </p>

                </div>


                {/* FORM */}

                <form
                  onSubmit={handleSubmit}
                  className="mt-9"
                >

                  <div className="space-y-5">


                    {/* USERNAME */}

                    <div>

                      <label
                        htmlFor="username"
                        className="mb-2 block text-xs font-medium text-[#344054]"
                      >
                        Username
                      </label>

                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value)
                        }
                        placeholder="Enter your username"
                        autoComplete="username"
                        disabled={loading}
                        className="
                          h-11
                          w-full
                          rounded-lg
                          border
                          border-[#d0d5dd]
                          bg-white
                          px-3
                          text-sm
                          text-[#172033]
                          outline-none
                          transition
                          duration-200
                          placeholder:text-[#98a2b3]
                          hover:border-[#98a2b3]
                          focus:border-[#2563eb]
                          focus:ring-4
                          focus:ring-[#2563eb]/10
                          disabled:cursor-not-allowed
                          disabled:bg-[#f7f9fc]
                        "
                      />

                    </div>


                    {/* PASSWORD */}

                    <div>

                      <label
                        htmlFor="password"
                        className="mb-2 block text-xs font-medium text-[#344054]"
                      >
                        Password
                      </label>

                      <div className="relative">

                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />

                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          disabled={loading}
                          className="
                            h-11
                            w-full
                            rounded-lg
                            border
                            border-[#d0d5dd]
                            bg-white
                            pl-10
                            pr-3
                            text-sm
                            text-[#172033]
                            outline-none
                            transition
                            duration-200
                            placeholder:text-[#98a2b3]
                            hover:border-[#98a2b3]
                            focus:border-[#2563eb]
                            focus:ring-4
                            focus:ring-[#2563eb]/10
                            disabled:cursor-not-allowed
                            disabled:bg-[#f7f9fc]
                          "
                        />

                      </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                      <div className="animate-[jcloudReveal_300ms_ease-out_both] rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3">

                        <div className="flex items-center gap-2 text-xs font-semibold text-[#b42318]">

                          <span className="size-1.5 rounded-full bg-[#dc2626]" />

                          Authentication failed

                        </div>

                        <p className="mt-1.5 text-xs leading-5 text-[#b42318]/80">
                          {error}
                        </p>

                      </div>

                    )}


                    {/* BUTTON */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        group/button
                        relative
                        flex
                        h-11
                        w-full
                        items-center
                        justify-between
                        overflow-hidden
                        rounded-lg
                        bg-[#2563eb]
                        px-4
                        text-sm
                        font-semibold
                        text-white
                        shadow-sm
                        transition-all
                        duration-200
                        hover:-translate-y-0.5
                        hover:bg-[#1d4ed8]
                        hover:shadow-[0_8px_24px_rgba(37,99,235,0.2)]
                        focus:outline-none
                        focus:ring-4
                        focus:ring-[#2563eb]/15
                        active:translate-y-0
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >

                      {/* BUTTON LIGHT */}

                      <span
                        aria-hidden="true"
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          -left-1/3
                          w-1/3
                          rotate-12
                          bg-white/10
                          blur-md
                          transition-transform
                          duration-700
                          group-hover/button:translate-x-[430%]
                        "
                      />

                      <span className="relative flex items-center gap-2">

                        {loading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign in"
                        )}

                      </span>


                      {!loading && (
                        <ArrowRight
                          className="
                            relative
                            size-4
                            transition-transform
                            duration-200
                            group-hover/button:translate-x-1
                          "
                        />
                      )}

                    </button>

                  </div>

                </form>


                {/* SECURITY */}

                <div className="mt-8 flex items-start gap-3 border-t border-[#eef1f5] pt-5">

                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#16a34a]" />

                  <p className="text-[11px] leading-5 text-[#98a2b3]">
                    Your session is authenticated through
                    the JCloud control plane. Access is limited
                    to authorized infrastructure users.
                  </p>

                </div>


                {/* SIGNATURE */}

                <div className="mt-7 flex items-center justify-between text-[10px] text-[#b0b8c5]">

                  <span>
                    Built by Rohan · 2026
                  </span>

                  <span>
                    v0.1.0
                  </span>

                </div>

              </div>

            </section>

          </div>

        </SpotlightCard>

      </div>

    </main>
  )
}