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
      <div className="flex min-h-[500px] items-center justify-center bg-[#f8fafc] p-8">
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
      <div className="flex min-h-[500px] items-center justify-center bg-[#f8fafc] p-8">
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
      <div className="flex min-h-[500px] items-center justify-center bg-[#f8fafc] p-8">
        <div className="w-full max-w-lg rounded-xl border border-[#e4e8ef] bg-white p-8 shadow-sm">

          <div className="flex size-12 items-center justify-center rounded-xl bg-[#eff6ff]">
            <FileAudio className="size-5 text-[#2563eb]" />
          </div>

          <div className="mt-5 text-xs font-medium text-[#667085]">
            Audio file
          </div>

          <div className="mt-1 truncate text-lg font-semibold text-[#172033]">
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
    <div className="flex min-h-[500px] items-center justify-center bg-[#f8fafc] p-8">
      <div className="max-w-md text-center">

        <div className="mx-auto flex size-16 items-center justify-center rounded-xl border border-[#e4e8ef] bg-white">
          <File className="size-6 text-[#98a2b3]" />
        </div>

        <div className="mt-6 text-sm font-semibold text-[#172033]">
          Preview unavailable
        </div>

        <p className="mt-2 text-xs leading-5 text-[#667085]">
          JCloud cannot render this file type
          directly in the browser.
        </p>

        <p className="mt-3 font-mono text-[10px] text-[#98a2b3]">
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
      <div className="mx-auto w-full max-w-[1500px] space-y-7">

        {/* HEADER */}

        <section className="flex flex-col justify-between gap-5 border-b border-[#e4e8ef] pb-7 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">

              <div className="flex size-7 items-center justify-center rounded-lg bg-[#eff6ff]">
                <HardDrive className="size-3.5 text-[#2563eb]" />
              </div>

              Cloud storage

            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#172033] sm:text-4xl">
              Storage
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#667085]">
              Manage your private files and folders through JCloud.
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
                rounded-lg
                border-[#d0d5dd]
                bg-white
                px-4
                text-sm
                font-medium
                text-[#344054]
                shadow-sm
                hover:bg-[#f7f9fc]
              "
            >
              <FolderPlus className="mr-2 size-4" />
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
                rounded-lg
                border-[#d0d5dd]
                bg-white
                px-3
                text-[#344054]
                shadow-sm
                hover:bg-[#f7f9fc]
              "
              title="Refresh"
            >
              <RefreshCw
                className={`size-4 ${
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
                  rounded-lg
                  bg-[#2563eb]
                  px-4
                  text-sm
                  font-medium
                  text-white
                  shadow-sm
                  transition
                  hover:bg-[#1d4ed8]
                "
              >
                <Upload className="mr-2 size-4" />
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


        {/* STORAGE OVERVIEW */}

        <section className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="flex items-center justify-between">

              <div className="text-xs font-medium text-[#667085]">
                Storage provider
              </div>

              <div className="flex size-8 items-center justify-center rounded-lg bg-[#eff6ff]">
                <HardDrive className="size-4 text-[#2563eb]" />
              </div>

            </div>

            <div className="mt-4 text-lg font-semibold text-[#172033]">
              Nextcloud
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              Private cloud filesystem
            </div>

          </div>


          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="text-xs font-medium text-[#667085]">
              Current directory
            </div>

            <div className="mt-4 truncate font-mono text-lg font-medium text-[#172033]">
              {path || "/"}
            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              {items.length} visible object
              {items.length === 1
                ? ""
                : "s"}
            </div>

          </div>


          <div className="rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="text-xs font-medium text-[#667085]">
              Connection
            </div>

            <div className="mt-4 flex items-center gap-2 text-lg font-semibold text-[#172033]">

              <span className="size-2 rounded-full bg-[#16a34a]" />

              Online

            </div>

            <div className="mt-1 text-xs text-[#98a2b3]">
              Filesystem available
            </div>

          </div>

        </section>


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
            rounded-xl
            border
            border-dashed
            px-6
            py-5
            transition-colors
            ${
              dragging
                ? "border-[#2563eb] bg-[#eff6ff]"
                : "border-[#d0d5dd] bg-white"
            }
          `}
        >

          <div className="flex items-center justify-center gap-3">

            <div className="flex size-9 items-center justify-center rounded-lg bg-[#f7f9fc]">

              <Upload
                className={`size-4 ${
                  dragging
                    ? "text-[#2563eb]"
                    : "text-[#667085]"
                }`}
              />

            </div>

            <div>

              <div className="text-sm font-medium text-[#344054]">
                {dragging
                  ? "Release to upload"
                  : "Drop files here to upload"}
              </div>

              <div className="mt-0.5 text-xs text-[#98a2b3]">
                Upload directly to the current directory
              </div>

            </div>

          </div>

        </div>


        {/* UPLOAD QUEUE */}

        {uploads.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

            <div className="flex items-center justify-between border-b border-[#eef1f5] px-5 py-4">

              <div>

                <div className="text-sm font-semibold text-[#172033]">
                  Upload queue
                </div>

                <div className="mt-1 text-xs text-[#98a2b3]">
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
                  className="text-xs font-medium text-[#667085] hover:text-[#2563eb]"
                >
                  Clear complete
                </button>
              )}

            </div>


            <div className="divide-y divide-[#eef1f5]">

              {uploads.map(
                (upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center gap-4 px-5 py-3"
                  >

                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f7f9fc]">
                      <File className="size-3.5 text-[#667085]" />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="truncate text-sm font-medium text-[#344054]">
                        {upload.file.name}
                      </div>

                      <div className="mt-0.5 text-xs text-[#98a2b3]">
                        {formatBytes(
                          upload.file.size
                        )}
                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      {upload.status ===
                        "uploading" && (
                        <>
                          <Loader2 className="size-3.5 animate-spin text-[#2563eb]" />

                          <span className="text-xs font-medium text-[#2563eb]">
                            Uploading
                          </span>
                        </>
                      )}

                      {upload.status ===
                        "queued" && (
                        <span className="text-xs text-[#667085]">
                          Queued
                        </span>
                      )}

                      {upload.status ===
                        "done" && (
                        <span className="rounded-full bg-[#ecfdf3] px-2 py-1 text-[10px] font-medium text-[#15803d]">
                          Complete
                        </span>
                      )}

                      {upload.status ===
                        "error" && (
                        <span className="rounded-full bg-[#fef2f2] px-2 py-1 text-[10px] font-medium text-[#b42318]">
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
                          className="flex size-7 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f7f9fc] hover:text-[#344054]"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}

                    </div>

                  </div>
                )
              )}

            </div>

          </section>
        )}


        {/* BROWSER TOOLBAR */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg border border-[#e4e8ef] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(16,24,40,0.02)]">

            <button
              type="button"
              onClick={goHome}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-[#667085] hover:bg-[#f7f9fc] hover:text-[#2563eb]"
            >
              Home
            </button>

            {breadcrumbs.map(
              (crumb, index) => (
                <div
                  key={`${crumb}-${index}`}
                  className="flex shrink-0 items-center"
                >

                  <ChevronRight className="mx-1 size-3 text-[#d0d5dd]" />

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
                      rounded-md
                      px-2
                      py-1
                      text-xs
                      font-medium
                      transition-colors
                      ${
                        index ===
                        breadcrumbs.length - 1
                          ? "text-[#172033]"
                          : "text-[#667085] hover:bg-[#f7f9fc] hover:text-[#2563eb]"
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

            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />

            <Input
              className="
                h-10
                rounded-lg
                border-[#d0d5dd]
                bg-white
                pl-9
                text-sm
                text-[#172033]
                shadow-sm
                placeholder:text-[#98a2b3]
                focus-visible:border-[#2563eb]
                focus-visible:ring-4
                focus-visible:ring-[#2563eb]/10
              "
              placeholder="Search files..."
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
          <div className="flex items-start justify-between gap-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4">

            <div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#b42318]">

                <span className="size-2 rounded-full bg-[#dc2626]" />

                Filesystem error

              </div>

              <p className="mt-1.5 text-xs leading-5 text-[#b42318]/80">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="flex size-7 items-center justify-center rounded-md text-[#b42318]/60 hover:bg-white hover:text-[#b42318]"
            >
              <X className="size-3.5" />
            </button>

          </div>
        )}


        {/* FILE LIST */}

        <div className="overflow-visible rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">

          {/* TABLE HEADER */}

          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#eef1f5] bg-[#f8fafc] px-5 py-3.5">

            <button
              type="button"
              onClick={() =>
                changeSort("name")
              }
              className="flex items-center gap-2 text-left text-xs font-semibold text-[#667085] hover:text-[#344054]"
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
              className="hidden items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#344054] sm:flex"
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
              className="flex items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#344054]"
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


          {/* LOADING */}

          {loading ? (

            <div className="flex min-h-[420px] flex-col items-center justify-center">

              <div className="flex size-11 items-center justify-center rounded-xl bg-[#eff6ff]">

                <Loader2 className="size-5 animate-spin text-[#2563eb]" />

              </div>

              <div className="mt-4 text-sm font-medium text-[#344054]">
                Reading filesystem
              </div>

              <div className="mt-1 text-xs text-[#98a2b3]">
                Loading your files and folders
              </div>

            </div>

          ) : sortedItems.length ===
            0 ? (

            <div className="flex min-h-[420px] items-center justify-center px-6">

              <div className="text-center">

                <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-[#eff6ff]">

                  {search ? (
                    <Search className="size-5 text-[#2563eb]" />
                  ) : (
                    <Folder className="size-5 text-[#2563eb]" />
                  )}

                </div>

                <div className="mt-5 text-sm font-semibold text-[#172033]">

                  {search
                    ? "No matching files"
                    : "This folder is empty"}

                </div>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#667085]">

                  {search
                    ? "Try a different search term."
                    : "Upload files or create a folder to get started."}

                </p>

                {!search && (
                  <div className="mt-5 flex justify-center gap-2">

                    <Button
                      variant="outline"
                      onClick={
                        openFolderDialog
                      }
                      className="h-9 rounded-lg border-[#d0d5dd] bg-white text-xs"
                    >
                      <FolderPlus className="mr-2 size-3.5" />
                      New folder
                    </Button>

                    <label className="cursor-pointer">

                      <span className="inline-flex h-9 items-center rounded-lg bg-[#2563eb] px-3 text-xs font-medium text-white hover:bg-[#1d4ed8]">
                        <Upload className="mr-2 size-3.5" />
                        Upload
                      </span>

                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleUpload}
                      />

                    </label>

                  </div>
                )}

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
                        border-[#eef1f5]
                        px-5
                        py-3
                        transition-colors
                        last:border-b-0
                        hover:bg-[#f8fafc]
                      "
                    >

                      {/* NAME */}

                      <button
                        type="button"
                        onClick={() =>
                          handlePreview(
                            item
                          )
                        }
                        className="flex min-w-0 items-center gap-3 text-left"
                      >

                        <div
                          className={`
                            flex
                            size-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            ${
                              folder
                                ? "bg-[#fff8e7]"
                                : "bg-[#f7f9fc]"
                            }
                          `}
                        >

                          <Icon
                            className={`
                              size-4
                              ${
                                folder
                                  ? "text-[#d99a16]"
                                  : "text-[#667085]"
                              }
                            `}
                          />

                        </div>


                        <div className="min-w-0">

                          <div className="truncate text-sm font-medium text-[#344054] group-hover:text-[#172033]">
                            {item.name}
                          </div>

                          <div className="mt-0.5 truncate text-[11px] text-[#98a2b3]">
                            {folder
                              ? "Folder"
                              : item.content_type ||
                                "File"}
                          </div>

                        </div>

                      </button>


                      {/* MODIFIED */}

                      <span className="hidden whitespace-nowrap text-xs text-[#98a2b3] sm:block">
                        {formatDate(
                          item.modified
                        )}
                      </span>


                      {/* ACTIONS */}

                      <div className="flex items-center gap-1">

                        <span className="hidden min-w-16 text-right text-xs text-[#667085] sm:block">
                          {folder
                            ? "—"
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
                              rounded-md
                              text-[#98a2b3]
                              opacity-0
                              transition
                              hover:bg-[#eff6ff]
                              hover:text-[#2563eb]
                              group-hover:opacity-100
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
                              rounded-md
                              text-[#98a2b3]
                              transition
                              hover:bg-[#f2f4f7]
                              hover:text-[#344054]
                            "
                            title="Actions"
                          >
                            <MoreHorizontal className="size-4" />
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
                                overflow-hidden
                                rounded-lg
                                border
                                border-[#e4e8ef]
                                bg-white
                                py-1
                                shadow-[0_12px_32px_rgba(16,24,40,0.14)]
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
                                  text-xs
                                  font-medium
                                  text-[#344054]
                                  hover:bg-[#f8fafc]
                                "
                              >
                                Open
                                <ChevronRight className="size-3.5 text-[#98a2b3]" />
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
                                    text-xs
                                    font-medium
                                    text-[#344054]
                                    hover:bg-[#f8fafc]
                                  "
                                >
                                  Download
                                  <Download className="size-3.5 text-[#98a2b3]" />
                                </button>
                              )}


                              <div className="my-1 border-t border-[#eef1f5]" />


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
                                  text-xs
                                  font-medium
                                  text-[#344054]
                                  hover:bg-[#f8fafc]
                                "
                              >
                                Rename
                                <Pencil className="size-3.5 text-[#98a2b3]" />
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
                                  text-xs
                                  font-medium
                                  text-[#344054]
                                  hover:bg-[#f8fafc]
                                "
                              >
                                Move
                                <FolderOpen className="size-3.5 text-[#98a2b3]" />
                              </button>


                              <div className="my-1 border-t border-[#eef1f5]" />


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
                                  text-xs
                                  font-medium
                                  text-[#dc2626]
                                  hover:bg-[#fef2f2]
                                "
                              >
                                Delete
                                <Trash2 className="size-3.5" />
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


        {/* STORAGE FOOTER */}

        <div className="flex flex-col gap-2 border-t border-[#e4e8ef] py-4 text-xs text-[#98a2b3] sm:flex-row sm:items-center sm:justify-between">

          <span>
            JCloud · Storage
          </span>

          <span>
            {sortedItems.length} object
            {sortedItems.length === 1
              ? ""
              : "s"} visible
          </span>

          <span>
            Nextcloud filesystem
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
              bg-[#101828]/45
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

            <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#e4e8ef] bg-white shadow-[0_24px_64px_rgba(16,24,40,0.18)]">

              <div className="flex items-center justify-between border-b border-[#eef1f5] px-5 py-4">

                <div className="min-w-0">

                  <div className="text-xs font-medium text-[#98a2b3]">
                    Storage action
                  </div>

                  <div className="mt-1 truncate text-base font-semibold text-[#172033]">
                    {dialog ===
                    "folder"
                      ? "Create folder"
                      : actionItem?.name}
                  </div>

                </div>

                <button
                  type="button"
                  disabled={dialogBusy}
                  onClick={
                    closeDialog
                  }
                  className="flex size-8 items-center justify-center rounded-lg text-[#98a2b3] hover:bg-[#f7f9fc] hover:text-[#344054]"
                >
                  <X className="size-4" />
                </button>

              </div>


              <div className="p-5">

                {dialog ===
                  "folder" && (
                  <>
                    <div className="text-xs font-medium text-[#344054]">
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
                        mt-2
                        h-11
                        rounded-lg
                        border-[#d0d5dd]
                        bg-white
                        text-sm
                        text-[#172033]
                        placeholder:text-[#98a2b3]
                        focus-visible:border-[#2563eb]
                        focus-visible:ring-4
                        focus-visible:ring-[#2563eb]/10
                      "
                    />

                    <div className="mt-2 text-xs text-[#98a2b3]">
                      Created inside {path || "/"}
                    </div>
                  </>
                )}


                {dialog ===
                  "rename" && (
                  <>
                    <div className="text-xs font-medium text-[#344054]">
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
                        mt-2
                        h-11
                        rounded-lg
                        border-[#d0d5dd]
                        bg-white
                        text-sm
                        text-[#172033]
                        focus-visible:border-[#2563eb]
                        focus-visible:ring-4
                        focus-visible:ring-[#2563eb]/10
                      "
                    />
                  </>
                )}


                {dialog ===
                  "move" && (
                  <>
                    <div className="text-xs font-medium text-[#344054]">
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
                        mt-2
                        h-11
                        rounded-lg
                        border-[#d0d5dd]
                        bg-white
                        text-sm
                        text-[#172033]
                        placeholder:text-[#98a2b3]
                        focus-visible:border-[#2563eb]
                        focus-visible:ring-4
                        focus-visible:ring-[#2563eb]/10
                      "
                    />

                    <div className="mt-2 text-xs leading-5 text-[#98a2b3]">
                      Enter an existing destination directory. The object keeps its current name.
                    </div>
                  </>
                )}


                {dialog ===
                  "delete" && (
                  <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4">

                    <div className="flex items-center gap-2 text-xs font-semibold text-[#b42318]">

                      <Trash2 className="size-3.5" />

                      Destructive operation

                    </div>

                    <p className="mt-2 text-xs leading-5 text-[#b42318]/80">
                      {actionItem?.is_directory
                        ? `Delete "${actionItem.name}" and everything inside it?`
                        : `Delete "${actionItem?.name}" permanently?`}
                    </p>

                  </div>
                )}

              </div>


              <div className="flex justify-end gap-2 border-t border-[#eef1f5] px-5 py-4">

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
                    rounded-lg
                    border
                    border-[#d0d5dd]
                    bg-white
                    px-4
                    text-xs
                    font-medium
                    text-[#344054]
                    hover:bg-[#f7f9fc]
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
                    rounded-lg
                    px-4
                    text-xs
                    font-medium
                    ${
                      dialog ===
                      "delete"
                        ? "bg-[#dc2626] text-white hover:bg-[#b91c1c]"
                        : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                    }
                  `}
                >

                  {dialogBusy && (
                    <Loader2 className="size-3.5 animate-spin" />
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
              bg-[#101828]/55
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

            <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[#e4e8ef] bg-white shadow-[0_24px_64px_rgba(16,24,40,0.2)]">

              <div className="flex items-center justify-between border-b border-[#eef1f5] px-5 py-4">

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff]">
                    <File className="size-4 text-[#2563eb]" />
                  </div>

                  <div className="min-w-0">

                    <div className="truncate text-sm font-semibold text-[#172033]">
                      {previewItem.name}
                    </div>

                    <div className="mt-0.5 truncate text-xs text-[#98a2b3]">
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
                      hidden
                      h-8
                      items-center
                      gap-2
                      rounded-lg
                      border
                      border-[#d0d5dd]
                      bg-white
                      px-3
                      text-xs
                      font-medium
                      text-[#344054]
                      hover:bg-[#f7f9fc]
                      sm:flex
                    "
                  >
                    <Download className="size-3.5" />
                    Download
                  </button>


                  <button
                    type="button"
                    onClick={
                      closePreview
                    }
                    className="flex size-8 items-center justify-center rounded-lg text-[#98a2b3] hover:bg-[#f7f9fc] hover:text-[#344054]"
                  >
                    <X className="size-4" />
                  </button>

                </div>

              </div>


              <div className="min-h-0 flex-1 overflow-auto bg-[#f8fafc]">

                {previewLoading ? (

                  <div className="flex min-h-[500px] flex-col items-center justify-center">

                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#eff6ff]">

                      <Loader2 className="size-5 animate-spin text-[#2563eb]" />

                    </div>

                    <div className="mt-4 text-sm font-medium text-[#344054]">
                      Loading object
                    </div>

                    <div className="mt-1 text-xs text-[#98a2b3]">
                      Preparing preview
                    </div>

                  </div>

                ) : previewText ? (

                  <pre className="min-h-[500px] whitespace-pre-wrap break-words bg-white p-6 font-mono text-[11px] leading-6 text-[#344054]">
                    {previewText}
                  </pre>

                ) : previewUrl ? (

                  <PreviewContent
                    item={previewItem}
                    url={previewUrl}
                  />

                ) : null}

              </div>


              <div className="flex items-center justify-between border-t border-[#eef1f5] bg-white px-5 py-3">

                <span className="text-xs text-[#98a2b3]">
                  JCloud file preview
                </span>

                <span className="font-mono text-[10px] text-[#98a2b3]">
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