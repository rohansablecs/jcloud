import {
  FilePlus2,
  FolderPlus,
  HardDrive,
  Search,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { JCloudShell } from "@/components/jcloud/shell"

export default function StoragePage() {
  return (
    <JCloudShell>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">
              Cloud storage
            </p>

            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              Storage
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Your files, managed through JCloud.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <FolderPlus className="mr-2 size-4" />
              New folder
            </Button>

            <Button>
              <Upload className="mr-2 size-4" />
              Upload
            </Button>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Home
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              className="pl-9"
              placeholder="Search files"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b px-5 py-3 text-xs font-medium text-muted-foreground">
            <span>Name</span>
            <span className="hidden sm:block">
              Modified
            </span>
            <span>Size</span>
          </div>

          <div className="flex min-h-96 items-center justify-center px-6">
            <div className="max-w-sm text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
                <HardDrive className="size-6 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-medium">
                No files to display
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Your Nextcloud files will appear here once
                the storage API is connected.
              </p>

              <Button className="mt-5">
                <Upload className="mr-2 size-4" />
                Upload files
              </Button>
            </div>
          </div>
        </div>
      </div>
    </JCloudShell>
  )
}