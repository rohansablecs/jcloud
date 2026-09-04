"use client"

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Download,
  File,
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { JCloudShell } from "@/components/jcloud/shell"
import {
  storageApi,
  StorageItem,
} from "@/lib/api"

type SortKey =
  | "name"
  | "modified"
  | "size"

type SortDirection =
  | "asc"
  | "desc"

type DialogType =
  | "folder"
  | "rename"
  | "move"
  | "delete"
  | null

type UploadItem = {
  id: string
  file: File
  status:
    | "queued"
    | "uploading"
    | "done"
    | "error"
  error?: string
}

function isFolder(item: StorageItem) {
  return item.is_directory === true
}

function formatBytes(bytes: number | null) {
  if (bytes === null) {
    return "—"
  }

  if (bytes === 0) {
    return "0 B"
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

  return `${(
    bytes /
    1024 /
    1024 /
    1024
  ).toFixed(1)} GB`
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

  return `/${path.replace(
    /^\/+|\/+$/g,
    ""
  )}/`
}

function getParentPath(path: string) {
  const normalized =
    normalizePath(path)

  if (!normalized) {
    return ""
  }

  const parts =
    normalized
      .split("/")
      .filter(Boolean)

  parts.pop()

  if (!parts.length) {
    return ""
  }

  return `/${parts.join("/")}/`
}

function getFileIcon(
  item: StorageItem
) {
  if (item.is_directory) {
    return Folder
  }

  const type =
    item.content_type?.toLowerCase() ||
    ""

  const extension =
    item.name
      .split(".")
      .pop()
      ?.toLowerCase() || ""

  if (
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
  ) {
    return FileImage
  }

  if (
    type.startsWith("video/") ||
    [
      "mp4",
      "webm",
      "mov",
      "m4v",
      "avi",
    ].includes(extension)
  ) {
    return FileVideo
  }

  if (
    type.startsWith("audio/") ||
    [
      "mp3",
      "wav",
      "ogg",
      "m4a",
      "aac",
      "flac",
    ].includes(extension)
  ) {
    return FileAudio
  }

  if (
    type.includes("zip") ||
    type.includes("archive") ||
    [
      "zip",
      "tar",
      "gz",
      "7z",
      "rar",
    ].includes(extension)
  ) {
    return FileArchive
  }

  if (
    type.startsWith("text/") ||
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
  ) {
    return FileCode2
  }

  if (
    type.includes("pdf") ||
    [
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "pdf",
    ].includes(extension)
  ) {
    return FileText
  }

  return File
}

function PreviewContent({
  item,
  url,
}: {
  item: StorageItem
  url: string
}) {
  const type =
    item.content_type?.toLowerCase() ||
    ""

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
        />
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
          JCloud cannot render this file
          type directly in the browser.
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
  const [path, setPath] =
    useState("")

  const [items, setItems] =
    useState<StorageItem[]>([])

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [error, setError] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [sortKey, setSortKey] =
    useState<SortKey>("name")

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc")

  const [dragging, setDragging] =
    useState(false)

  const [uploads, setUploads] =
    useState<UploadItem[]>([])

  const [menuItem, setMenuItem] =
    useState<StorageItem | null>(null)

  const [actionItem, setActionItem] =
    useState<StorageItem | null>(null)

  const [dialog, setDialog] =
    useState<DialogType>(null)

  const [dialogValue, setDialogValue] =
    useState("")

  const [dialogBusy, setDialogBusy] =
    useState(false)

  const [previewItem, setPreviewItem] =
    useState<StorageItem | null>(null)

  const [previewUrl, setPreviewUrl] =
    useState("")

  const [previewText, setPreviewText] =
    useState("")

  const [previewLoading, setPreviewLoading] =
    useState(false)

  const fileInputRef =
    useRef<HTMLInputElement>(null)

  async function loadFiles(
    currentPath: string,
    options: {
      silent?: boolean
    } = {}
  ) {
    try {
      if (options.silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const data =
        await storageApi.list(
          normalizePath(
            currentPath
          )
        )

      setItems(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (err) {
      console.error(
        "[JCloud Storage]",
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load files from JCloud."
      )

      if (!options.silent) {
        setItems([])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadFiles("")
  }, [])

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key !== "Escape"
      ) {
        return
      }

      setMenuItem(null)

      if (!dialogBusy) {
        setDialog(null)
        setActionItem(null)
        setDialogValue("")
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    )

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      )
    }
  }, [dialogBusy])

  function addUploadFiles(
    files: File[]
  ) {
    const entries =
      files.map((file) => ({
        id:
          `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        status:
          "queued" as const,
      }))

    if (!entries.length) {
      return
    }

    setUploads((current) => [
      ...current,
      ...entries,
    ])

    processUploads(entries)
  }

  async function processUploads(
    entries: UploadItem[]
  ) {
    for (const entry of entries) {
      setUploads((current) =>
        current.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                status:
                  "uploading",
              }
            : item
        )
      )

      try {
        await storageApi.upload(
          entry.file,
          normalizePath(path)
        )

        setUploads((current) =>
          current.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: "done",
                }
              : item
          )
        )
      } catch (err) {
        setUploads((current) =>
          current.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: "error",
                  error:
                    err instanceof Error
                      ? err.message
                      : "Upload failed",
                }
              : item
          )
        )
      }
    }

    await loadFiles(path, {
      silent: true,
    })
  }

  function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target.files || []
      )

    addUploadFiles(files)

    event.target.value = ""
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault()
    setDragging(false)

    addUploadFiles(
      Array.from(
        event.dataTransfer.files
      )
    )
  }

  function removeUpload(
    id: string
  ) {
    setUploads((current) =>
      current.filter(
        (item) =>
          item.id !== id
      )
    )
  }

  function clearCompletedUploads() {
    setUploads((current) =>
      current.filter(
        (item) =>
          item.status !== "done"
      )
    )
  }

  function openFolder(
    item: StorageItem
  ) {
    if (!isFolder(item)) {
      return
    }

    const nextPath =
      normalizePath(item.path)

    setMenuItem(null)
    setPath(nextPath)
    setSearch("")

    loadFiles(nextPath)
  }

  function goHome() {
    setMenuItem(null)
    setPath("")
    setSearch("")
    loadFiles("")
  }

  function goParent() {
    const parent =
      getParentPath(path)

    setMenuItem(null)
    setPath(parent)
    setSearch("")

    loadFiles(parent)
  }

  function goBreadcrumb(
    index: number
  ) {
    const parts =
      path
        .split("/")
        .filter(Boolean)

    const next =
      parts.slice(
        0,
        index + 1
      )

    const nextPath =
      next.length
        ? `/${next.join("/")}/`
        : ""

    setMenuItem(null)
    setPath(nextPath)
    setSearch("")

    loadFiles(nextPath)
  }

  function openFolderDialog() {
    setMenuItem(null)
    setActionItem(null)
    setDialogValue("")
    setDialog("folder")
  }

  function openRenameDialog(
    item: StorageItem
  ) {
    setMenuItem(null)
    setActionItem(item)
    setDialogValue(item.name)
    setDialog("rename")
  }

  function openMoveDialog(
    item: StorageItem
  ) {
    setMenuItem(null)
    setActionItem(item)
    setDialogValue(
      getParentPath(item.path)
    )
    setDialog("move")
  }

  function openDeleteDialog(
    item: StorageItem
  ) {
    setMenuItem(null)
    setActionItem(item)
    setDialogValue("")
    setDialog("delete")
  }

  function closeDialog() {
    if (dialogBusy) {
      return
    }

    setDialog(null)
    setActionItem(null)
    setDialogValue("")
  }

  async function submitDialog() {
    try {
      setDialogBusy(true)
      setError("")

      if (dialog === "folder") {
        const cleanName =
          dialogValue.trim()

        if (!cleanName) {
          setError(
            "Folder name cannot be empty."
          )
          return
        }

        if (
          cleanName.includes("/") ||
          cleanName.includes("\\")
        ) {
          setError(
            "Folder name cannot contain path separators."
          )
          return
        }

        const folderPath =
          `${normalizePath(path)}${cleanName}/`

        await storageApi.createFolder(
          folderPath
        )
      }

      if (
        dialog === "rename" &&
        actionItem
      ) {
        const cleanName =
          dialogValue.trim()

        if (!cleanName) {
          setError(
            "Name cannot be empty."
          )
          return
        }

        if (
          cleanName.includes("/") ||
          cleanName.includes("\\")
        ) {
          setError(
            "Name cannot contain path separators."
          )
          return
        }

        await storageApi.rename(
          actionItem.path,
          cleanName
        )
      }

      if (
        dialog === "move" &&
        actionItem
      ) {
        const destinationDirectory =
          normalizePath(
            dialogValue
          )

        const destination =
          `${destinationDirectory}${actionItem.name}`

        await storageApi.move(
          actionItem.path,
          destination
        )
      }

      if (
        dialog === "delete" &&
        actionItem
      ) {
        await storageApi.delete(
          actionItem.path
        )
      }

      setDialog(null)
      setActionItem(null)
      setDialogValue("")

      await loadFiles(path)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Filesystem operation failed."
      )
    } finally {
      setDialogBusy(false)
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

      document.body.appendChild(
        anchor
      )

      anchor.click()
      anchor.remove()

      URL.revokeObjectURL(url)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Download failed."
      )
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
      setMenuItem(null)
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
        contentType.startsWith(
          "text/"
        ) ||
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
        setPreviewText(
          await blob.text()
        )
      } else {
        setPreviewUrl(
          URL.createObjectURL(
            blob
          )
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to preview file."
      )

      setPreviewItem(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  function closePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      )
    }

    setPreviewItem(null)
    setPreviewUrl("")
    setPreviewText("")
    setPreviewLoading(false)
  }

  function changeSort(
    key: SortKey
  ) {
    if (sortKey === key) {
      setSortDirection(
        (current) =>
          current === "asc"
            ? "desc"
            : "asc"
      )

      return
    }

    setSortKey(key)
    setSortDirection("asc")
  }

  const sortedItems =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      const filtered =
        items.filter((item) =>
          item.name
            .toLowerCase()
            .includes(query)
        )

      return [...filtered].sort(
        (a, b) => {
          if (
            a.is_directory !==
            b.is_directory
          ) {
            return a.is_directory
              ? -1
              : 1
          }

          let comparison = 0

          if (
            sortKey === "name"
          ) {
            comparison =
              a.name.localeCompare(
                b.name
              )
          }

          if (
            sortKey === "size"
          ) {
            comparison =
              (a.size ?? -1) -
              (b.size ?? -1)
          }

          if (
            sortKey === "modified"
          ) {
            comparison =
              new Date(
                a.modified || 0
              ).getTime() -
              new Date(
                b.modified || 0
              ).getTime()
          }

          return sortDirection ===
            "asc"
            ? comparison
            : -comparison
        }
      )
    }, [
      items,
      search,
      sortKey,
      sortDirection,
    ])

  const breadcrumbs =
    path
      .split("/")
      .filter(Boolean)

  const activeUploads =
    uploads.filter(
      (item) =>
        item.status ===
          "uploading" ||
        item.status === "queued"
    )

  const completedUploads =
    uploads.filter(
      (item) =>
        item.status === "done"
    )

  return (
    <JCloudShell>
      <div className="relative space-y-8">

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
              onClick={
                openFolderDialog
              }
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

            <Button
              variant="outline"
              onClick={() =>
                loadFiles(path, {
                  silent: true,
                })
              }
              disabled={refreshing}
              className="
                h-10
                rounded-none
                border-[#353a37]
                bg-[#0b0d0d]
                px-3
                font-mono
                text-[9px]
                uppercase
                tracking-[0.1em]
                hover:bg-[#151717]
                hover:text-[#e8e8e3]
              "
              title="Refresh"
            >
              <RefreshCw
                className={`size-3.5 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
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
                <Upload className="mr-2 size-3.5" />
                Upload
              </span>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
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

        {/* DROP ZONE */}

        <div
          onDragEnter={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={(event) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              setDragging(false)
            }
          }}
          onDrop={handleDrop}
          className={`
            relative
            border
            border-dashed
            px-6
            py-5
            transition-colors
            ${
              dragging
                ? "border-[#b7ff4a] bg-[#b7ff4a]/[0.04]"
                : "border-[#292c2c] bg-[#090a0a]"
            }
          `}
        >
          <div className="flex items-center justify-center gap-3">

            <Upload
              className={`size-4 ${
                dragging
                  ? "text-[#b7ff4a]"
                  : "text-[#4f5452]"
              }`}
            />

            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452]">
              {dragging
                ? "Release to upload"
                : "Drop files here to upload"}
            </span>

          </div>
        </div>

        {/* UPLOAD QUEUE */}

        {uploads.length > 0 && (
          <section className="border border-[#292c2c] bg-[#090a0a]">

            <div className="flex items-center justify-between border-b border-[#292c2c] bg-[#0d0f0f] px-5 py-4">

              <div>
                <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#e8e8e3]">
                  Upload queue
                </div>

                <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.12em] text-[#4f5452]">
                  {activeUploads.length
                    ? `${activeUploads.length} active`
                    : `${completedUploads.length} complete`}
                </div>
              </div>

              {completedUploads.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    clearCompletedUploads
                  }
                  className="font-mono text-[7px] uppercase tracking-[0.1em] text-[#4f5452] hover:text-[#e8e8e3]"
                >
                  Clear complete
                </button>
              )}

            </div>

            <div className="divide-y divide-[#202323]">

              {uploads.map(
                (upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center gap-4 px-5 py-3"
                  >

                    <File className="size-3.5 shrink-0 text-[#4f5452]" />

                    <div className="min-w-0 flex-1">

                      <div className="truncate font-mono text-[9px] text-[#cfd3d0]">
                        {upload.file.name}
                      </div>

                      <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-[#3f4441]">
                        {formatBytes(
                          upload.file.size
                        )}
                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      {upload.status ===
                        "uploading" && (
                        <>
                          <Loader2 className="size-3 animate-spin text-[#b7ff4a]" />

                          <span className="font-mono text-[7px] uppercase text-[#b7ff4a]">
                            Uploading
                          </span>
                        </>
                      )}

                      {upload.status ===
                        "queued" && (
                        <span className="font-mono text-[7px] uppercase text-[#4f5452]">
                          Queued
                        </span>
                      )}

                      {upload.status ===
                        "done" && (
                        <span className="font-mono text-[7px] uppercase text-[#b7ff4a]">
                          Complete
                        </span>
                      )}

                      {upload.status ===
                        "error" && (
                        <span className="font-mono text-[7px] uppercase text-red-400">
                          Failed
                        </span>
                      )}

                      {upload.status !==
                        "uploading" && (
                        <button
                          type="button"
                          onClick={() =>
                            removeUpload(
                              upload.id
                            )
                          }
                          className="text-[#4f5452] hover:text-[#e8e8e3]"
                        >
                          <X className="size-3" />
                        </button>
                      )}

                    </div>

                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* TOOLBAR */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 items-center gap-2 overflow-x-auto">

            <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.15em] text-[#4f5452]">
              Path
            </span>

            <span className="h-3 w-px shrink-0 bg-[#292c2c]" />

            <button
              type="button"
              onClick={goHome}
              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-[#a5aaa7] hover:text-[#b7ff4a]"
            >
              Home
            </button>

            {breadcrumbs.map(
              (crumb, index) => (
                <div
                  key={`${crumb}-${index}`}
                  className="flex shrink-0 items-center gap-2"
                >

                  <ChevronRight className="size-3 text-[#353a37]" />

                  <button
                    type="button"
                    onClick={() =>
                      goBreadcrumb(
                        index
                      )
                    }
                    className={`
                      max-w-40
                      truncate
                      font-mono
                      text-[10px]
                      uppercase
                      tracking-[0.06em]
                      transition-colors
                      ${
                        index ===
                        breadcrumbs.length - 1
                          ? "text-[#e8e8e3]"
                          : "text-[#737875] hover:text-[#e8e8e3]"
                      }
                    `}
                  >
                    {crumb}
                  </button>

                </div>
              )
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
              placeholder="SEARCH DIRECTORY"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="flex items-start justify-between gap-4 border border-red-900/40 bg-red-950/10 p-4">

            <div>
              <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-red-400">
                <span className="size-1.5 bg-red-400" />
                Filesystem error
              </div>

              <p className="mt-2 font-mono text-[9px] leading-5 text-red-300/70">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-400/60 hover:text-red-400"
            >
              <X className="size-3.5" />
            </button>

          </div>
        )}

        {/* FILE LIST */}

        <div className="overflow-visible border border-[#292c2c] bg-[#090a0a]">

          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#292c2c] bg-[#0d0f0f] px-5 py-4">

            <button
              type="button"
              onClick={() =>
                changeSort("name")
              }
              className="flex items-center gap-2 text-left font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452] hover:text-[#e8e8e3]"
            >
              Name

              {sortKey ===
                "name" &&
                (
                  sortDirection ===
                  "asc"
                    ? <ArrowUp className="size-3" />
                    : <ArrowDown className="size-3" />
                )}
            </button>

            <button
              type="button"
              onClick={() =>
                changeSort("modified")
              }
              className="hidden items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452] hover:text-[#e8e8e3] sm:flex"
            >
              Modified

              {sortKey ===
                "modified" &&
                (
                  sortDirection ===
                  "asc"
                    ? <ArrowUp className="size-3" />
                    : <ArrowDown className="size-3" />
                )}
            </button>

            <button
              type="button"
              onClick={() =>
                changeSort("size")
              }
              className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452] hover:text-[#e8e8e3]"
            >
              Size

              {sortKey ===
                "size" &&
                (
                  sortDirection ===
                  "asc"
                    ? <ArrowUp className="size-3" />
                    : <ArrowDown className="size-3" />
                )}
            </button>

          </div>

          {loading ? (

            <div className="flex min-h-[420px] flex-col items-center justify-center">

              <Loader2 className="size-5 animate-spin text-[#b7ff4a]" />

              <div className="mt-4 font-mono text-[8px] uppercase tracking-[0.16em] text-[#4f5452]">
                Reading filesystem
              </div>

            </div>

          ) : sortedItems.length ===
            0 ? (

            <div className="flex min-h-[420px] items-center justify-center px-6">

              <div className="text-center">

                <div className="mx-auto flex size-14 items-center justify-center border border-[#292c2c]">
                  {search ? (
                    <Search className="size-5 text-[#4f5452]" />
                  ) : (
                    <HardDrive className="size-5 text-[#4f5452]" />
                  )}
                </div>

                <div className="mt-6 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e8e8e3]">
                  {search
                    ? "No matching objects"
                    : "Filesystem empty"}
                </div>

                <p className="mt-2 max-w-xs font-mono text-[8px] leading-5 text-[#4f5452]">
                  {search
                    ? "No filesystem objects match the current query."
                    : "Drop files above or create a folder to initialize this directory."}
                </p>

              </div>

            </div>

          ) : (

            <div>

              {sortedItems.map(
                (item) => {
                  const folder =
                    isFolder(item)

                  const Icon =
                    getFileIcon(item)

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
                          handlePreview(
                            item
                          )
                        }
                        className="flex min-w-0 items-center gap-4 text-left"
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
                          <Icon
                            className={`
                              size-4
                              ${
                                folder
                                  ? "text-[#b7ff4a]"
                                  : "text-[#737875]"
                              }
                            `}
                          />
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
                        {formatDate(
                          item.modified
                        )}
                      </span>

                      <div className="flex items-center gap-1">

                        <span className="hidden whitespace-nowrap px-2 font-mono text-[8px] uppercase text-[#666c68] sm:block">
                          {folder
                            ? "Folder"
                            : formatBytes(
                                item.size
                              )}
                        </span>

                        {!folder && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownload(
                                item
                              )
                            }
                            className="
                              flex
                              size-8
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
                              sm:size-7
                            "
                            title="Download"
                          >
                            <Download className="size-3.5" />
                          </button>
                        )}

                        <div className="relative">

                          <button
                            type="button"
                            onClick={() => {
                              setMenuItem(
                                menuItem?.path ===
                                  item.path
                                  ? null
                                  : item
                              )
                            }}
                            className="
                              flex
                              size-8
                              items-center
                              justify-center
                              border
                              border-transparent
                              text-[#4f5452]
                              transition-all
                              hover:border-[#353a37]
                              hover:bg-[#151717]
                              hover:text-[#e8e8e3]
                              sm:size-7
                            "
                            title="Actions"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </button>

                          {menuItem?.path ===
                            item.path && (
                            <div
                              className="
                                absolute
                                right-0
                                top-9
                                z-[80]
                                w-48
                                border
                                border-[#353a37]
                                bg-[#0b0d0d]
                                py-1
                                shadow-2xl
                              "
                            >

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuItem(null)

                                  if (
                                    item.is_directory
                                  ) {
                                    openFolder(
                                      item
                                    )
                                  } else {
                                    handlePreview(
                                      item
                                    )
                                  }
                                }}
                                className="
                                  flex
                                  w-full
                                  items-center
                                  justify-between
                                  px-4
                                  py-2.5
                                  font-mono
                                  text-[8px]
                                  uppercase
                                  tracking-[0.1em]
                                  text-[#a5aaa7]
                                  hover:bg-[#151717]
                                  hover:text-[#e8e8e3]
                                "
                              >
                                Open
                                <ChevronRight className="size-3" />
                              </button>

                              {!item.is_directory && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuItem(null)
                                    handleDownload(
                                      item
                                    )
                                  }}
                                  className="
                                    flex
                                    w-full
                                    items-center
                                    justify-between
                                    px-4
                                    py-2.5
                                    font-mono
                                    text-[8px]
                                    uppercase
                                    tracking-[0.1em]
                                    text-[#a5aaa7]
                                    hover:bg-[#151717]
                                    hover:text-[#e8e8e3]
                                  "
                                >
                                  Download
                                  <Download className="size-3" />
                                </button>
                              )}

                              <div className="my-1 border-t border-[#292c2c]" />

                              <button
                                type="button"
                                onClick={() =>
                                  openRenameDialog(
                                    item
                                  )
                                }
                                className="
                                  flex
                                  w-full
                                  items-center
                                  justify-between
                                  px-4
                                  py-2.5
                                  font-mono
                                  text-[8px]
                                  uppercase
                                  tracking-[0.1em]
                                  text-[#a5aaa7]
                                  hover:bg-[#151717]
                                  hover:text-[#e8e8e3]
                                "
                              >
                                Rename
                                <Pencil className="size-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openMoveDialog(
                                    item
                                  )
                                }
                                className="
                                  flex
                                  w-full
                                  items-center
                                  justify-between
                                  px-4
                                  py-2.5
                                  font-mono
                                  text-[8px]
                                  uppercase
                                  tracking-[0.1em]
                                  text-[#a5aaa7]
                                  hover:bg-[#151717]
                                  hover:text-[#e8e8e3]
                                "
                              >
                                Move
                                <FolderOpen className="size-3" />
                              </button>

                              <div className="my-1 border-t border-[#292c2c]" />

                              <button
                                type="button"
                                onClick={() =>
                                  openDeleteDialog(
                                    item
                                  )
                                }
                                className="
                                  flex
                                  w-full
                                  items-center
                                  justify-between
                                  px-4
                                  py-2.5
                                  font-mono
                                  text-[8px]
                                  uppercase
                                  tracking-[0.1em]
                                  text-red-400
                                  hover:bg-red-950/20
                                "
                              >
                                Delete
                                <Trash2 className="size-3" />
                              </button>

                            </div>
                          )}

                        </div>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </div>

        {/* FOOTER */}

        <div className="flex flex-col justify-between gap-2 border-t border-[#292c2c] pt-4 font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441] sm:flex-row">

          <span>
            JCLOUD / STORAGE CONTROL
          </span>

          <span>
            {sortedItems.length} OBJECT
            {sortedItems.length === 1
              ? ""
              : "S"} VISIBLE
          </span>

          <span>
            NODE / NEXTCLOUD
          </span>

        </div>

        {/* ACTION DIALOG */}

        {dialog && (
          <div
            className="
              fixed
              inset-0
              z-[110]
              flex
              items-center
              justify-center
              bg-black/75
              p-4
              backdrop-blur-sm
            "
            onClick={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !dialogBusy
              ) {
                closeDialog()
              }
            }}
          >

            <div className="w-full max-w-md border border-[#353a37] bg-[#0b0d0d] shadow-2xl">

              <div className="flex items-center justify-between border-b border-[#292c2c] px-5 py-4">

                <div className="min-w-0">

                  <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#4f5452]">
                    Filesystem / Action
                  </div>

                  <div className="mt-2 truncate font-mono text-[11px] text-[#e8e8e3]">
                    {dialog ===
                    "folder"
                      ? "Create directory"
                      : actionItem?.name}
                  </div>

                </div>

                <button
                  type="button"
                  disabled={dialogBusy}
                  onClick={
                    closeDialog
                  }
                  className="
                    flex
                    size-8
                    items-center
                    justify-center
                    text-[#4f5452]
                    hover:text-[#e8e8e3]
                  "
                >
                  <X className="size-4" />
                </button>

              </div>

              <div className="p-5">

                {dialog ===
                  "folder" && (
                  <>
                    <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#4f5452]">
                      Folder name
                    </div>

                    <Input
                      autoFocus
                      value={
                        dialogValue
                      }
                      onChange={(
                        event
                      ) =>
                        setDialogValue(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          submitDialog()
                        }

                        if (
                          event.key ===
                          "Escape"
                        ) {
                          closeDialog()
                        }
                      }}
                      placeholder="New folder"
                      className="
                        mt-3
                        h-11
                        rounded-none
                        border-[#353a37]
                        bg-[#090a0a]
                        font-mono
                        text-[10px]
                        text-[#e8e8e3]
                        placeholder:text-[#3f4441]
                        focus-visible:border-[#b7ff4a]
                        focus-visible:ring-0
                      "
                    />

                    <div className="mt-3 font-mono text-[7px] leading-5 text-[#3f4441]">
                      Created inside:
                      {" "}
                      {path || "/"}
                    </div>
                  </>
                )}

                {dialog ===
                  "rename" && (
                  <>
                    <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#4f5452]">
                      New name
                    </div>

                    <Input
                      autoFocus
                      value={
                        dialogValue
                      }
                      onChange={(
                        event
                      ) =>
                        setDialogValue(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          submitDialog()
                        }

                        if (
                          event.key ===
                          "Escape"
                        ) {
                          closeDialog()
                        }
                      }}
                      className="
                        mt-3
                        h-11
                        rounded-none
                        border-[#353a37]
                        bg-[#090a0a]
                        font-mono
                        text-[10px]
                        text-[#e8e8e3]
                        focus-visible:border-[#b7ff4a]
                        focus-visible:ring-0
                      "
                    />
                  </>
                )}

                {dialog ===
                  "move" && (
                  <>
                    <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#4f5452]">
                      Destination directory
                    </div>

                    <Input
                      autoFocus
                      value={
                        dialogValue
                      }
                      onChange={(
                        event
                      ) =>
                        setDialogValue(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          submitDialog()
                        }

                        if (
                          event.key ===
                          "Escape"
                        ) {
                          closeDialog()
                        }
                      }}
                      placeholder="/Photos/"
                      className="
                        mt-3
                        h-11
                        rounded-none
                        border-[#353a37]
                        bg-[#090a0a]
                        font-mono
                        text-[10px]
                        text-[#e8e8e3]
                        placeholder:text-[#3f4441]
                        focus-visible:border-[#b7ff4a]
                        focus-visible:ring-0
                      "
                    />

                    <div className="mt-3 font-mono text-[7px] leading-5 text-[#3f4441]">
                      Enter the existing
                      destination directory.
                      The object keeps its
                      current name.
                    </div>
                  </>
                )}

                {dialog ===
                  "delete" && (
                  <div className="border border-red-900/40 bg-red-950/10 p-4">

                    <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-red-400">
                      <span className="size-1.5 bg-red-400" />
                      Destructive operation
                    </div>

                    <p className="mt-3 font-mono text-[9px] leading-5 text-red-300/70">
                      {actionItem?.is_directory
                        ? `Delete "${actionItem.name}" and everything inside it?`
                        : `Delete "${actionItem?.name}" permanently?`}
                    </p>

                  </div>
                )}

              </div>

              <div className="flex justify-end gap-2 border-t border-[#292c2c] px-5 py-4">

                <button
                  type="button"
                  disabled={
                    dialogBusy
                  }
                  onClick={
                    closeDialog
                  }
                  className="
                    h-9
                    border
                    border-[#292c2c]
                    px-4
                    font-mono
                    text-[8px]
                    uppercase
                    tracking-[0.1em]
                    text-[#737875]
                    hover:bg-[#151717]
                    hover:text-[#e8e8e3]
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    dialogBusy
                  }
                  onClick={
                    submitDialog
                  }
                  className={`
                    flex
                    h-9
                    items-center
                    gap-2
                    px-4
                    font-mono
                    text-[8px]
                    uppercase
                    tracking-[0.1em]
                    ${
                      dialog ===
                      "delete"
                        ? "bg-red-500/90 text-white hover:bg-red-500"
                        : "bg-[#b7ff4a] text-[#080908] hover:bg-[#c7ff75]"
                    }
                  `}
                >
                  {dialogBusy && (
                    <Loader2 className="size-3 animate-spin" />
                  )}

                  {dialog ===
                  "delete"
                    ? "Delete"
                    : dialog ===
                        "move"
                      ? "Move"
                      : dialog ===
                          "folder"
                        ? "Create"
                        : "Rename"}
                </button>

              </div>

            </div>

          </div>
        )}

        {/* PREVIEW */}

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

            <div className="flex max-h-[90vh] w-full max-w-6xl flex-col border border-[#292c2c] bg-[#090a0a] shadow-2xl">

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
                    className="flex h-8 items-center gap-2 border border-[#292c2c] px-3 font-mono text-[8px] uppercase tracking-[0.08em] text-[#737875] hover:bg-[#151717] hover:text-[#e8e8e3]"
                  >
                    <Download className="size-3" />
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={
                      closePreview
                    }
                    className="flex size-8 items-center justify-center border border-[#292c2c] font-mono text-sm text-[#737875] hover:bg-[#151717] hover:text-[#e8e8e3]"
                  >
                    ×
                  </button>

                </div>

              </div>

              <div className="min-h-0 flex-1 overflow-auto bg-[#070808]">

                {previewLoading ? (

                  <div className="flex min-h-[500px] flex-col items-center justify-center">

                    <Loader2 className="size-5 animate-spin text-[#b7ff4a]" />

                    <div className="mt-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#4f5452]">
                      Loading object
                    </div>

                  </div>

                ) : previewText ? (

                  <pre className="min-h-[500px] whitespace-pre-wrap break-words p-6 font-mono text-[11px] leading-6 text-[#c8ccc9]">
                    {previewText}
                  </pre>

                ) : previewUrl ? (

                  <PreviewContent
                    item={previewItem}
                    url={previewUrl}
                  />

                ) : null}

              </div>

              <div className="flex items-center justify-between border-t border-[#292c2c] bg-[#0d0f0f] px-5 py-3">

                <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
                  JCLOUD / FILE PREVIEW
                </span>

                <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#3f4441]">
                  {previewItem.size !==
                  null
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