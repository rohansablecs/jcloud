"use client"

import { ChangeEvent, useEffect, useState } from "react"
import {
  Download,
  File,
  Folder,
  FolderPlus,
  HardDrive,
  Loader2,
  Search,
  Trash2,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { JCloudShell } from "@/components/jcloud/shell"
import { storageApi } from "@/lib/api"

type StorageItem = {
  name: string
  path: string
  is_directory: boolean
  size: number | null
  modified: string | null
  content_type: string | null
}

function isFolder(item: StorageItem) {
  return item.is_directory === true
}

function formatBytes(bytes: number | null) {
  if (bytes === null || bytes === 0) {
    return "—"
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatDate(date: string | null) {
  if (!date) {
    return "—"
  }

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return "—"
  }

  return parsed.toLocaleDateString()
}

function normalizePath(path: string) {
  if (!path || path === "/") {
    return ""
  }

  return `/${path.replace(/^\/+|\/+$/g, "")}/`
}

function getParentPath(path: string) {
  const normalized = normalizePath(path)

  if (!normalized) {
    return ""
  }

  const parts = normalized
    .split("/")
    .filter(Boolean)

  parts.pop()

  if (parts.length === 0) {
    return ""
  }

  return `/${parts.join("/")}/`
}

export default function StoragePage() {
  const [path, setPath] = useState("")
  const [items, setItems] = useState<StorageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  async function loadFiles(currentPath: string) {
    try {
      setLoading(true)
      setError("")

      const normalizedPath = normalizePath(currentPath)

      const data = await storageApi.list(normalizedPath)

      const result = Array.isArray(data)
        ? data
        : []

      setItems(result)
    } catch (err) {
      console.error("[JCloud Storage]", err)

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Unable to load files from JCloud.")
      }

      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles("")
  }, [])

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      setUploading(true)
      setError("")

      await storageApi.upload(file, normalizePath(path))

      await loadFiles(path)
    } catch (err) {
      console.error("[JCloud Upload]", err)

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Upload failed.")
      }
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  async function handleDelete(item: StorageItem) {
    const confirmed = window.confirm(
      `Delete "${item.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setError("")

      await storageApi.delete(item.path)

      await loadFiles(path)
    } catch (err) {
      console.error("[JCloud Delete]", err)

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Delete failed.")
      }
    }
  }

  async function handleCreateFolder() {
    const name = window.prompt("Folder name")

    if (!name?.trim()) {
      return
    }

    const cleanName = name.trim()

    const folderPath = path
      ? `${normalizePath(path)}${cleanName}/`
      : `/${cleanName}/`

    try {
      setError("")

      await storageApi.createFolder(folderPath)

      await loadFiles(path)
    } catch (err) {
      console.error("[JCloud Folder]", err)

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Could not create folder.")
      }
    }
  }

  async function handleDownload(item: StorageItem) {
    try {
      setError("")

      const blob = await storageApi.download(item.path)

      const url = URL.createObjectURL(blob)

      const anchor = document.createElement("a")

      anchor.href = url
      anchor.download = item.name

      document.body.appendChild(anchor)

      anchor.click()

      anchor.remove()

      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("[JCloud Download]", err)

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Download failed.")
      }
    }
  }

  function openFolder(item: StorageItem) {
    if (!isFolder(item)) {
      return
    }

    const nextPath = normalizePath(item.path)

    setPath(nextPath)
    setSearch("")

    loadFiles(nextPath)
  }

  function goHome() {
    setPath("")
    setSearch("")

    loadFiles("")
  }

  function goParent() {
    const parent = getParentPath(path)

    setPath(parent)
    setSearch("")

    loadFiles(parent)
  }

  const filteredItems = items.filter((item) =>
    item.name
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <JCloudShell>
      <div className="space-y-6">

        {/* HEADER */}

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

            <Button
              variant="outline"
              onClick={handleCreateFolder}
            >
              <FolderPlus className="mr-2 size-4" />
              New folder
            </Button>

            <label className="cursor-pointer">
              <span className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                {uploading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 size-4" />
                )}

                {uploading
                  ? "Uploading..."
                  : "Upload"}
              </span>

              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>

          </div>
        </section>

        {/* TOOLBAR */}

        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-center gap-2 text-sm">
            <button
              onClick={goHome}
              className="font-medium hover:underline"
            >
              Home
            </button>

            {path && (
              <>
                <span className="text-muted-foreground">
                  /
                </span>

                <button
                  onClick={goParent}
                  className="truncate text-muted-foreground hover:text-foreground hover:underline"
                >
                  {path
                    .split("/")
                    .filter(Boolean)
                    .at(-1)}
                </button>
              </>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              className="pl-9"
              placeholder="Search files"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* FILE LIST */}

        <div className="overflow-hidden rounded-xl border bg-background">

          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b px-5 py-3 text-xs font-medium text-muted-foreground">
            <span>Name</span>

            <span className="hidden sm:block">
              Modified
            </span>

            <span>Size</span>
          </div>

          {loading ? (

            <div className="flex min-h-96 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>

          ) : filteredItems.length === 0 ? (

            <div className="flex min-h-96 items-center justify-center px-6">

              <div className="max-w-sm text-center">

                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
                  <HardDrive className="size-6 text-muted-foreground" />
                </div>

                <h3 className="mt-4 font-medium">
                  {search
                    ? "No matching files"
                    : "No files"}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {search
                    ? "Try another search."
                    : "Upload a file or create a folder to get started."}
                </p>

              </div>

            </div>

          ) : (

            <div>

              {filteredItems.map((item) => {
                const folder = isFolder(item)

                return (
                  <div
                    key={item.path}
                    className="group grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-5 py-4 last:border-b-0 hover:bg-muted/40"
                  >

                    <button
                      type="button"
                      onClick={() => openFolder(item)}
                      disabled={!folder}
                      className="flex min-w-0 items-center gap-3 text-left disabled:cursor-default"
                    >

                      {folder ? (
                        <Folder className="size-5 shrink-0" />
                      ) : (
                        <File className="size-5 shrink-0 text-muted-foreground" />
                      )}

                      <span className="truncate text-sm font-medium">
                        {item.name}
                      </span>

                    </button>

                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {formatDate(item.modified)}
                    </span>

                    <div className="flex items-center gap-3">

                      <span className="text-xs text-muted-foreground">
                        {folder
                          ? "Folder"
                          : formatBytes(item.size)}
                      </span>

                      {!folder && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(item)
                          }
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          title="Download"
                        >
                          <Download className="size-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(item)
                        }
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </button>

                    </div>

                  </div>
                )
              })}

            </div>
          )}
        </div>
      </div>
    </JCloudShell>
  )
}