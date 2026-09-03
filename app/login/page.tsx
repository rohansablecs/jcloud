"use client"

import { FormEvent, useState } from "react"
import { Cloud, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi } from "@/lib/api"

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
      setError("Enter your username and password.")
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
          ? err.message
          : "Unable to connect to JCloud."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Cloud className="size-6" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Welcome to JCloud
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your private cloud
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-background p-6 shadow-sm"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium"
              >
                Username
              </label>

              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium"
              >
                Password
              </label>

              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          JCloud private infrastructure
        </p>
      </div>
    </main>
  )
}