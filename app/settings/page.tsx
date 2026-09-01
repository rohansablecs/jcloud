import { JCloudShell } from "@/components/jcloud/shell"

export default function SettingsPage() {
  return (
    <JCloudShell>
      <div className="space-y-6">
        <section>
          <p className="text-sm text-muted-foreground">
            Account
          </p>

          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Settings
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Manage your JCloud account.
          </p>
        </section>

        <div className="max-w-2xl rounded-xl border bg-background">
          <div className="border-b p-6">
            <h3 className="font-medium">
              Account
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Your account information will be loaded from
              the JCloud API.
            </p>
          </div>

          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              Authentication is not connected yet.
            </p>
          </div>
        </div>
      </div>
    </JCloudShell>
  )
}