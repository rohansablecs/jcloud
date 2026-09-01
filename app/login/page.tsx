"use client"

import { FormEvent, useState } from "react"
import { Cloud, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!username || !password) {
      return
    }

    setLoading(true)

    // Real authentication will be connected to FastAPI.
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
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Username"
                autoComplete="username"
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
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Password"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              Sign in
            </Button>
          </div>a
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          JCloud private infrastructure
        </p>
      </div>
    </main>
  )
}