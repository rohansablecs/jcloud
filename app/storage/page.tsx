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

function PreviewContent({
  item,
  url,
}: {
  item: StorageItem
  url: string
}) {
  const type =
    item.content_type?.toLowerCase() || ""

  const extension =
    item.name
      .split(".")
      .pop()
      ?.toLowerCase() || ""

  const isImage =
    type.startsWith("image/") ||
    [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
    ].includes(extension)

  const isPdf =
    type === "application/pdf" ||
    extension === "pdf"

  const isVideo =
    type.startsWith("video/") ||
    [
      "mp4",
      "webm",
      "mov",
      "m4v",
      "ogg",
    ].includes(extension)

  const isAudio =
    type.startsWith("audio/") ||
    [
      "mp3",
      "wav",
      "ogg",
      "m4a",
      "aac",
      "flac",
    ].includes(extension)

  if (isImage) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-8">
        <img
          src={url}
          alt={item.name}
          className="max-h-[70vh] max-w-full object-contain"
        />
      </div>
    )
  }

  if (isPdf) {
    return (
      <iframe
        src={url}
        title={item.name}
        className="h-[70vh] min-h-[500px] w-full border-0"
      />
    )
  }

  if (isVideo) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-8">
        <video
          src={url}
          controls
          className="max-h-[70vh] max-w-full"
        >
          Your browser does not support video playback.
        </video>
      </div>
    )
  }

  if (isAudio) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-8">
        <div className="w-full max-w-lg border border-[#292c2c] bg-[#0d0f0f] p-8">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452]">
            Audio object
          </div>

          <div className="mt-3 truncate font-mono text-sm text-[#e8e8e3]">
            {item.name}
          </div>

          <audio
            src={url}
            controls
            className="mt-8 w-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[500px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center border border-[#292c2c]">
          <File className="size-6 text-[#4f5452]" />
        </div>

        <div className="mt-6 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e8e8e3]">
          Preview unavailable
        </div>

        <p className="mt-3 font-mono text-[8px] leading-5 text-[#4f5452]">
          JCloud cannot render this file type
          directly in the browser.
        </p>

        <p className="mt-3 font-mono text-[8px] text-[#3f4441]">
          {item.content_type ||
            extension.toUpperCase()}
        </p>
      </div>
    </div>
  )
}

export default function StoragePage() {
  const [path, setPath] = useState("")
  const [items, setItems] = useState<StorageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const [previewItem, setPreviewItem] =
    useState<StorageItem | null>(null)

  const [previewUrl, setPreviewUrl] =
    useState("")

  const [previewText, setPreviewText] =
    useState("")

  const [previewLoading, setPreviewLoading] =
    useState(false)

  async function loadFiles(currentPath: string) {
    try {
      setLoading(true)
      setError("")

      const normalizedPath =
        normalizePath(currentPath)

      const data =
        await storageApi.list(normalizedPath)

      const result = Array.isArray(data)
        ? data
        : []

      setItems(result)
    } catch (err) {
      console.error(
        "[JCloud Storage]",
        err
      )

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(
          "Unable to load files from JCloud."
        )
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

      await storageApi.upload(
        file,
        normalizePath(path)
      )

      await loadFiles(path)
    } catch (err) {
      console.error(
        "[JCloud Upload]",
        err
      )

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

  async function handleDelete(
    item: StorageItem
  ) {
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
      console.error(
        "[JCloud Delete]",
        err
      )

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Delete failed.")
      }
    }
  }

  async function handleCreateFolder() {
    const name =
      window.prompt("Folder name")

    if (!name?.trim()) {
      return
    }

    const cleanName = name.trim()

    const folderPath = path
      ? `${normalizePath(path)}${cleanName}/`
      : `/${cleanName}/`

    try {
      setError("")

      await storageApi.createFolder(
        folderPath
      )

      await loadFiles(path)
    } catch (err) {
      console.error(
        "[JCloud Folder]",
        err
      )

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(
          "Could not create folder."
        )
      }
    }
  }

  async function handleDownload(
    item: StorageItem
  ) {
    try {
      setError("")

      const blob =
        await storageApi.download(
          item.path
        )

      const url =
        URL.createObjectURL(blob)

      const anchor =
        document.createElement("a")

      anchor.href = url
      anchor.download = item.name

      document.body.appendChild(anchor)

      anchor.click()

      anchor.remove()

      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(
        "[JCloud Download]",
        err
      )

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Download failed.")
      }
    }
  }

  async function handlePreview(
    item: StorageItem
  ) {
    if (isFolder(item)) {
      openFolder(item)
      return
    }

    try {
      setError("")
      setPreviewLoading(true)
      setPreviewItem(item)
      setPreviewUrl("")
      setPreviewText("")

      const blob =
        await storageApi.download(
          item.path
        )

      const contentType =
        item.content_type ||
        blob.type ||
        ""

      const extension =
        item.name
          .split(".")
          .pop()
          ?.toLowerCase() || ""

      const isText =
        contentType.startsWith("text/") ||
        [
          "txt",
          "md",
          "json",
          "csv",
          "xml",
          "html",
          "css",
          "js",
          "ts",
          "tsx",
          "jsx",
          "py",
          "java",
          "c",
          "cpp",
          "h",
          "hpp",
          "yaml",
          "yml",
          "log",
        ].includes(extension)

      if (isText) {
        const text = await blob.text()

        setPreviewText(text)

        return
      }

      const url =
        URL.createObjectURL(blob)

      setPreviewUrl(url)
    } catch (err) {
      console.error(
        "[JCloud Preview]",
        err
      )

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(
          "Unable to preview file."
        )
      }

      setPreviewItem(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  function closePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewItem(null)
    setPreviewUrl("")
    setPreviewText("")
    setPreviewLoading(false)
  }

  function openFolder(item: StorageItem) {
    if (!isFolder(item)) {
      return
    }

    const nextPath =
      normalizePath(item.path)

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
    const parent =
      getParentPath(path)

    setPath(parent)
    setSearch("")

    loadFiles(parent)
  }

  const filteredItems = items.filter(
    (item) =>
      item.name
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  )

  return (
    <JCloudShell>
      <div className="relative space-y-8">

        {/* BACKGROUND */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            -z-10
            opacity-[0.07]
            [background-image:linear-gradient(to_right,#292c2c_1px,transparent_1px),linear-gradient(to_bottom,#292c2c_1px,transparent_1px)]
            [background-size:48px_48px]
          "
        />

        {/* HEADER */}

        <section className="flex flex-col justify-between gap-6 border-b border-[#292c2c] pb-8 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.18em] text-[#4f5452]">
              <span className="size-1.5 bg-[#b7ff4a]" />
              Filesystem / Nextcloud
            </div>

            <h2 className="mt-4 text-5xl font-medium tracking-[-0.045em]">
              Storage
            </h2>

            <p className="mt-3 max-w-lg font-mono text-[9px] leading-5 text-[#4f5452]">
              Private cloud storage managed
              through the JCloud control plane.
            </p>

          </div>

          <div className="flex flex-wrap gap-2">

            <Button
              variant="outline"
              onClick={handleCreateFolder}
              className="
                h-10
                rounded-none
                border-[#353a37]
                bg-[#0b0d0d]
                px-4
                font-mono
                text-[9px]
                uppercase
                tracking-[0.1em]
                hover:bg-[#151717]
                hover:text-[#e8e8e3]
              "
            >
              <FolderPlus className="mr-2 size-3.5" />
              New folder
            </Button>

            <label className="cursor-pointer">

              <span
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  border
                  border-[#b7ff4a]
                  bg-[#b7ff4a]
                  px-4
                  font-mono
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.1em]
                  text-[#080908]
                  transition-colors
                  hover:bg-[#c7ff75]
                "
              >
                {uploading ? (
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-2 size-3.5" />
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


        {/* SYSTEM STRIP */}

        <div className="grid grid-cols-2 border-y border-[#292c2c] sm:grid-cols-4">

          <div className="border-r border-[#292c2c] px-5 py-4">

            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Filesystem
            </div>

            <div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase">
              <span className="size-1.5 bg-[#b7ff4a]" />
              Online
            </div>

          </div>

          <div className="border-r border-[#292c2c] px-5 py-4">

            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Provider
            </div>

            <div className="mt-2 font-mono text-[9px] uppercase">
              Nextcloud
            </div>

          </div>

          <div className="border-r border-[#292c2c] px-5 py-4">

            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Objects
            </div>

            <div className="mt-2 font-mono text-[9px]">
              {items.length
                .toString()
                .padStart(2, "0")}
            </div>

          </div>

          <div className="px-5 py-4">

            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#4f5452]">
              Location
            </div>

            <div className="mt-2 truncate font-mono text-[9px]">
              {path || "/"}
            </div>

          </div>

        </div>


        {/* TOOLBAR */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 items-center gap-3">

            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#4f5452]">
              Path
            </span>

            <span className="h-3 w-px bg-[#292c2c]" />

            <button
              onClick={goHome}
              className="
                font-mono
                text-[10px]
                uppercase
                tracking-[0.06em]
                text-[#a5aaa7]
                transition-colors
                hover:text-[#b7ff4a]
              "
            >
              Home
            </button>

            {path && (
              <>
                <span className="font-mono text-[#353a37]">
                  /
                </span>

                <button
                  onClick={goParent}
                  className="
                    truncate
                    font-mono
                    text-[10px]
                    uppercase
                    tracking-[0.06em]
                    text-[#737875]
                    transition-colors
                    hover:text-[#e8e8e3]
                  "
                >
                  {path
                    .split("/")
                    .filter(Boolean)
                    .at(-1)}
                </button>
              </>
            )}

          </div>

          <div className="relative w-full lg:w-80">

            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#4f5452]" />

            <Input
              className="
                h-10
                rounded-none
                border-[#292c2c]
                bg-[#0b0d0d]
                pl-9
                font-mono
                text-[10px]
                text-[#e8e8e3]
                placeholder:text-[#3f4441]
                focus-visible:border-[#b7ff4a]
                focus-visible:ring-0
              "
              placeholder="SEARCH FILESYSTEM"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

        </div>


        {/* ERROR */}

        {error && (
          <div className="border border-red-900/40 bg-red-950/10 p-4">

            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-red-400">
              <span className="size-1.5 bg-red-400" />
              Filesystem error
            </div>

            <p className="mt-2 font-mono text-[9px] leading-5 text-red-300/70">
              {error}
            </p>

          </div>
        )}


        {/* FILE LIST */}

        <div className="overflow-hidden border border-[#292c2c] bg-[#090a0a]">

          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#292c2c] bg-[#0d0f0f] px-5 py-4">

            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452]">
              Name
            </span>

            <span className="hidden font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452] sm:block">
              Modified
            </span>

            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452]">
              Size
            </span>

          </div>


          {loading ? (

            <div className="flex min-h-[420px] flex-col items-center justify-center">

              <Loader2 className="size-5 animate-spin text-[#b7ff4a]" />

              <div className="mt-4 font-mono text-[8px] uppercase tracking-[0.16em] text-[#4f5452]">
                Reading filesystem
              </div>

            </div>

          ) : filteredItems.length === 0 ? (

            <div className="flex min-h-[420px] items-center justify-center px-6">

              <div className="text-center">

                <div className="mx-auto flex size-14 items-center justify-center border border-[#292c2c]">
                  <HardDrive className="size-5 text-[#4f5452]" />
                </div>

                <div className="mt-6 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e8e8e3]">
                  {search
                    ? "No matching objects"
                    : "Filesystem empty"}
                </div>

                <p className="mt-2 max-w-xs font-mono text-[8px] leading-5 text-[#4f5452]">
                  {search
                    ? "No filesystem objects match the current query."
                    : "Upload a file or create a folder to initialize this directory."}
                </p>

              </div>

            </div>

          ) : (

            <div>

              {filteredItems.map((item) => {

                const folder =
                  isFolder(item)

                return (
                  <div
                    key={item.path}
                    className="
                      group
                      grid
                      grid-cols-[1fr_auto_auto]
                      items-center
                      gap-4
                      border-b
                      border-[#202323]
                      px-5
                      py-4
                      transition-colors
                      last:border-b-0
                      hover:bg-[#0d0f0f]
                    "
                  >

                    <button
                      type="button"
                      onClick={() =>
                        handlePreview(item)
                      }
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-4
                        text-left
                      "
                    >

                      <div
                        className={`
                          flex
                          size-9
                          shrink-0
                          items-center
                          justify-center
                          border
                          ${
                            folder
                              ? "border-[#39432f] bg-[#11160d]"
                              : "border-[#292c2c] bg-[#0d0f0f]"
                          }
                        `}
                      >

                        {folder ? (
                          <Folder className="size-4 text-[#b7ff4a]" />
                        ) : (
                          <File className="size-4 text-[#737875]" />
                        )}

                      </div>

                      <div className="min-w-0">

                        <div className="truncate font-mono text-[10px] text-[#d9dcd9]">
                          {item.name}
                        </div>

                        <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-[#3f4441]">
                          {folder
                            ? "Directory"
                            : item.content_type ||
                              "File"}
                        </div>

                      </div>

                    </button>


                    <span className="hidden whitespace-nowrap font-mono text-[8px] text-[#4f5452] sm:block">
                      {formatDate(item.modified)}
                    </span>


                    <div className="flex items-center gap-4">

                      <span className="whitespace-nowrap font-mono text-[8px] uppercase text-[#666c68]">
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
                          className="
                            flex
                            size-7
                            items-center
                            justify-center
                            border
                            border-transparent
                            text-[#4f5452]
                            opacity-0
                            transition-all
                            hover:border-[#353a37]
                            hover:text-[#e8e8e3]
                            group-hover:opacity-100
                          "
                          title="Download"
                        >
                          <Download className="size-3.5" />
                        </button>
                      )}


                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(item)
                        }
                        className="
                          flex
                          size-7
                          items-center
                          justify-center
                          border
                          border-transparent
                          text-[#4f5452]
                          opacity-0
                          transition-all
                          hover:border-red-900/50
                          hover:text-red-400
                          group-hover:opacity-100
                        "
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>

                    </div>

                  </div>
                )
              })}

            </div>

          )}

        </div>


        {/* FOOTER */}

        <div className="flex flex-col justify-between gap-2 border-t border-[#292c2c] pt-4 font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441] sm:flex-row">

          <span>
            JCLOUD / STORAGE CONTROL
          </span>

          <span>
            {filteredItems.length} OBJECT
            {filteredItems.length === 1
              ? ""
              : "S"}{" "}
            VISIBLE
          </span>

          <span>
            NODE / NEXTCLOUD
          </span>

        </div>


        {/* FILE PREVIEW */}

        {previewItem && (
          <div
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-center
              justify-center
              bg-black/80
              p-4
              backdrop-blur-sm
              sm:p-8
            "
            onClick={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closePreview()
              }
            }}
          >

            <div
              className="
                flex
                max-h-[90vh]
                w-full
                max-w-6xl
                flex-col
                border
                border-[#292c2c]
                bg-[#090a0a]
                shadow-2xl
              "
            >

              {/* PREVIEW HEADER */}

              <div className="flex items-center justify-between border-b border-[#292c2c] bg-[#0d0f0f] px-5 py-4">

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex size-8 shrink-0 items-center justify-center border border-[#292c2c]">
                    <File className="size-3.5 text-[#737875]" />
                  </div>

                  <div className="min-w-0">

                    <div className="truncate font-mono text-[10px] text-[#e8e8e3]">
                      {previewItem.name}
                    </div>

                    <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.12em] text-[#4f5452]">
                      {previewItem.content_type ||
                        "FILE"}
                    </div>

                  </div>

                </div>


                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        previewItem
                      )
                    }
                    className="
                      flex
                      h-8
                      items-center
                      gap-2
                      border
                      border-[#292c2c]
                      px-3
                      font-mono
                      text-[8px]
                      uppercase
                      tracking-[0.08em]
                      text-[#737875]
                      transition-colors
                      hover:bg-[#151717]
                      hover:text-[#e8e8e3]
                    "
                  >
                    <Download className="size-3" />
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={closePreview}
                    className="
                      flex
                      size-8
                      items-center
                      justify-center
                      border
                      border-[#292c2c]
                      font-mono
                      text-sm
                      text-[#737875]
                      transition-colors
                      hover:bg-[#151717]
                      hover:text-[#e8e8e3]
                    "
                    title="Close"
                  >
                    ×
                  </button>

                </div>

              </div>


              {/* PREVIEW BODY */}

              <div className="min-h-0 flex-1 overflow-auto bg-[#070808]">

                {previewLoading ? (

                  <div className="flex min-h-[500px] flex-col items-center justify-center">

                    <Loader2 className="size-5 animate-spin text-[#b7ff4a]" />

                    <div className="mt-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452]">
                      Loading object
                    </div>

                  </div>

                ) : previewText ? (

                  <pre
                    className="
                      min-h-[500px]
                      whitespace-pre-wrap
                      break-words
                      p-6
                      font-mono
                      text-[11px]
                      leading-6
                      text-[#c8ccc9]
                    "
                  >
                    {previewText}
                  </pre>

                ) : previewUrl ? (

                  <PreviewContent
                    item={previewItem}
                    url={previewUrl}
                  />

                ) : null}

              </div>


              {/* PREVIEW FOOTER */}

              <div className="flex items-center justify-between border-t border-[#292c2c] bg-[#0d0f0f] px-5 py-3">

                <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
                  JCLOUD / FILE PREVIEW
                </span>

                <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
                  {previewItem.size !== null
                    ? formatBytes(
                        previewItem.size
                      )
                    : "SIZE UNKNOWN"}
                </span>

              </div>

            </div>

          </div>
        )}

      </div>
    </JCloudShell>
  )
}