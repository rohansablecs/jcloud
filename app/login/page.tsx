"use client"

import { FormEvent, useState } from "react"
import {
  ArrowRight,
  Cpu,
  KeyRound,
  Loader2,
  LockKeyhole,
  Terminal,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { authApi } from "@/lib/api"

function JCloudLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JCloud"
    >
      <defs>
        <mask id="jcloud-login-logo">
          <rect
            width="32"
            height="32"
            fill="black"
          />

          {/* FILLED CLOUD */}
          <path
            d="
              M8.2 24.2
              H23
              C26.8 24.2 29 21.8 29 18.7
              C29 15.6 26.8 13.2 23.6 13
              C22.5 9.4 19.3 7.1 15.5 7.1
              C11 7.1 7.4 10.1 6.5 14.3
              C3.7 14.5 1.7 16.5 1.7 19.2
              C1.7 22.1 4.1 24.2 8.2 24.2
              Z
            "
            fill="white"
          />

          {/* NEGATIVE-SPACE J */}
          <path
            d="
              M17.4 11.2
              V19.2
              C17.4 20.6 16.7 21.4 15.4 21.4
              C14.1 21.4 13.4 20.6 13.4 19.3
            "
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <path
            d="M15.8 11.2H19"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </mask>
      </defs>

      <rect
        width="32"
        height="32"
        fill="#b7ff4a"
        mask="url(#jcloud-login-logo)"
      />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
    <main className="relative min-h-screen overflow-hidden bg-[#070808] text-[#e8e8e3]">

      {/* BACKGROUND GRID */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.13]
          [background-image:linear-gradient(to_right,#292c2c_1px,transparent_1px),linear-gradient(to_bottom,#292c2c_1px,transparent_1px)]
          [background-size:48px_48px]
        "
      />

      {/* SUBTLE DEPTH */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          size-[720px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#b7ff4a]/[0.018]
          blur-[140px]
        "
      />

      {/* TOP BAR */}

      <header
        className="
          absolute
          inset-x-0
          top-0
          z-20
          flex
          h-[76px]
          items-center
          justify-between
          border-b
          border-[#292c2c]
          bg-[#070808]/80
          px-6
          backdrop-blur-sm
          lg:px-10
        "
      >

        {/* BRAND */}

        <div className="flex items-center gap-3">

          <div className="flex size-8 shrink-0 items-center justify-center">
            <JCloudLogo />
          </div>

          <div>

            <div className="font-mono text-[11px] font-medium tracking-[0.18em]">
              JCLOUD
            </div>

            <div className="mt-1 font-mono text-[7px] tracking-[0.18em] text-[#4f5452]">
              PRIVATE INFRASTRUCTURE
            </div>

          </div>

        </div>


        {/* SYSTEM STATUS */}

        <div className="hidden items-center gap-6 font-mono text-[8px] uppercase tracking-[0.12em] text-[#4f5452] sm:flex">

          <span>
            NODE / LOCAL
          </span>

          <span className="h-3 w-px bg-[#292c2c]" />

          <span className="flex items-center gap-2">
            <span className="size-1.5 bg-[#b7ff4a]" />
            SYSTEM READY
          </span>

        </div>

      </header>


      {/* MAIN */}

      <div
        className="
          relative
          z-10
          flex
          min-h-screen
          items-center
          justify-center
          px-5
          pb-12
          pt-[100px]
          lg:px-10
          lg:pt-[110px]
        "
      >

        <div className="grid w-full max-w-[1120px] lg:grid-cols-[1fr_440px]">

          {/* LEFT INFORMATION PANEL */}

          <section
            className="
              hidden
              min-h-[570px]
              border
              border-r-0
              border-[#292c2c]
              bg-[#090a0a]/90
              p-10
              lg:flex
              lg:flex-col
              lg:justify-between
            "
          >

            <div>

              <div className="mb-12 flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.16em] text-[#4f5452]">

                <span className="size-1.5 bg-[#b7ff4a]" />

                Secure access terminal

              </div>


              <div className="max-w-[560px]">

                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4f5452]">
                  PRIVATE COMPUTE / STORAGE / NETWORK
                </div>

                <h1
                  className="
                    mt-6
                    text-[clamp(4rem,5.5vw,6.5rem)]
                    font-medium
                    leading-[0.9]
                    tracking-[-0.055em]
                  "
                >
                  Your
                  <br />
                  infrastructure.
                  <br />
                  <span className="text-[#b7ff4a]">
                    Your control.
                  </span>
                </h1>

                <p className="mt-9 max-w-md font-mono text-[9px] leading-6 text-[#555b58]">
                  Unified access to your private
                  infrastructure layer. Manage storage,
                  compute, applications and services
                  from a single control plane.
                </p>

              </div>

            </div>


            {/* READOUT */}

            <div className="grid grid-cols-2 border-t border-[#292c2c] pt-6">

              <div>

                <div className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#3f4441]">
                  Environment
                </div>

                <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase">
                  <span className="size-1.5 bg-[#b7ff4a]" />
                  Local node
                </div>

              </div>

              <div>

                <div className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#3f4441]">
                  Encryption
                </div>

                <div className="mt-3 font-mono text-[9px] uppercase">
                  Session / JWT
                </div>

              </div>

            </div>

          </section>


          {/* AUTH PANEL */}

          <section
            className="
              relative
              border
              border-[#292c2c]
              bg-[#0b0d0d]
            "
          >

            {/* LIME TOP EDGE */}

            <div className="absolute inset-x-0 top-0 h-px bg-[#b7ff4a]" />


            {/* PANEL CONTENT */}

            <div className="p-7 sm:p-9 lg:p-10">

              {/* HEADER */}

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.18em] text-[#4f5452]">

                    <LockKeyhole className="size-3" />

                    Authentication

                  </div>

                  <h2 className="mt-5 text-[34px] font-medium tracking-[-0.045em]">
                    Sign in
                  </h2>

                  <p className="mt-2 max-w-xs font-mono text-[8px] leading-5 text-[#4f5452]">
                    Authenticate with your Nextcloud
                    account to continue.
                  </p>

                </div>


                {/* STATUS MARK */}

                <div className="flex size-10 items-center justify-center border border-[#292c2c]">

                  <span className="flex size-4 items-center justify-center border border-[#b7ff4a]">

                    <span className="size-1.5 bg-[#b7ff4a]" />

                  </span>

                </div>

              </div>


              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="mt-11"
              >

                <div className="space-y-7">

                  {/* USERNAME */}

                  <div>

                    <label
                      htmlFor="username"
                      className="
                        flex
                        items-center
                        justify-between
                        font-mono
                        text-[7px]
                        uppercase
                        tracking-[0.16em]
                        text-[#666c68]
                      "
                    >
                      <span>
                        Username
                      </span>

                      <span className="text-[#393d3b]">
                        01
                      </span>
                    </label>


                    <div
                      className="
                        group
                        mt-3
                        flex
                        items-center
                        border-b
                        border-[#353a37]
                        transition-colors
                        focus-within:border-[#b7ff4a]
                      "
                    >

                      <span className="pl-1 font-mono text-sm text-[#4f5452]">
                        $
                      </span>

                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value)
                        }
                        placeholder="username"
                        autoComplete="username"
                        disabled={loading}
                        className="
                          h-12
                          w-full
                          border-0
                          bg-transparent
                          px-3
                          font-mono
                          text-[12px]
                          text-[#e8e8e3]
                          outline-none
                          placeholder:text-[#343836]
                        "
                      />

                    </div>

                  </div>


                  {/* PASSWORD */}

                  <div>

                    <label
                      htmlFor="password"
                      className="
                        flex
                        items-center
                        justify-between
                        font-mono
                        text-[7px]
                        uppercase
                        tracking-[0.16em]
                        text-[#666c68]
                      "
                    >
                      <span>
                        Password
                      </span>

                      <span className="text-[#393d3b]">
                        02
                      </span>
                    </label>


                    <div
                      className="
                        mt-3
                        flex
                        items-center
                        border-b
                        border-[#353a37]
                        transition-colors
                        focus-within:border-[#b7ff4a]
                      "
                    >

                      <KeyRound className="ml-1 size-3 text-[#4f5452]" />

                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                        disabled={loading}
                        className="
                          h-12
                          w-full
                          border-0
                          bg-transparent
                          px-3
                          font-mono
                          text-[12px]
                          tracking-[0.15em]
                          text-[#e8e8e3]
                          outline-none
                          placeholder:text-[#343836]
                        "
                      />

                    </div>

                  </div>


                  {/* ERROR */}

                  {error && (
                    <div className="border border-red-900/40 bg-red-950/10 px-4 py-3">

                      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.1em] text-red-400">

                        <span className="size-1.5 bg-red-400" />

                        Authentication error

                      </div>

                      <p className="mt-2 font-mono text-[8px] leading-5 text-red-300/70">
                        {error}
                      </p>

                    </div>
                  )}


                  {/* SUBMIT */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      group
                      flex
                      h-12
                      w-full
                      items-center
                      justify-between
                      border
                      border-[#b7ff4a]
                      bg-[#b7ff4a]
                      px-4
                      font-mono
                      text-[8px]
                      font-medium
                      uppercase
                      tracking-[0.15em]
                      text-[#080908]
                      transition-colors
                      hover:bg-[#c7ff75]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >

                    <span className="flex items-center gap-2">

                      {loading ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          Authenticating
                        </>
                      ) : (
                        "Initialize session"
                      )}

                    </span>

                    {!loading && (
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    )}

                  </button>

                </div>

              </form>


              {/* FOOTER */}

              <div className="mt-11 border-t border-[#202323] pt-5">

                <div className="flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">

                  <span>
                    JCLOUD AUTH / 01
                  </span>

                  <span>
                    SESSION SECURE
                  </span>

                </div>

              </div>

            </div>

          </section>

        </div>

      </div>


      {/* BOTTOM STATUS */}

      <div
        className="
          absolute
          inset-x-0
          bottom-0
          z-20
          hidden
          h-8
          items-center
          justify-between
          border-t
          border-[#202323]
          px-6
          font-mono
          text-[7px]
          uppercase
          tracking-[0.12em]
          text-[#3b403e]
          lg:flex
          lg:px-10
        "
      >

        <span>
          JCLOUD / CONTROL PLANE
        </span>

        <span>
          AUTHORIZED ACCESS ONLY
        </span>

        <span>
          v0.1.0
        </span>

      </div>

    </main>
  )
}