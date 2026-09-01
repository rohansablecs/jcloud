import { Database } from "lucide-react"

import { Button } from "@/components/ui/button"

import { JCloudShell } from "@/components/jcloud/shell"

export default function DatabasesPage() {
  return (
    <JCloudShell>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">
              Data services
            </p>

            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              Databases
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Provision and manage application databases.
            </p>
          </div>

          <Button>Create database</Button>
        </section>

        <div className="rounded-xl border bg-background">
          <div className="flex min-h-96 items-center justify-center p-6">
            <div className="max-w-md text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
                <Database className="size-6 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-medium">
                No databases
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Databases will appear here once the database
                service is connected.
              </p>

              <Button className="mt-5">
                Create database
              </Button>
            </div>
          </div>
        </div>
      </div>
    </JCloudShell>
  )
}