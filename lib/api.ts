const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api"

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      credentials: "include",
    }
  )

  if (!response.ok) {
    let message =
      `JCloud API error: ${response.status}`

    try {
      const data = await response.json()

      if (data?.detail) {
        message = data.detail
      }
    } catch {}

    throw new Error(message)
  }

  return response.json()
}


/* ==================== AUTH ==================== */

export type UserProfile = {
  authenticated: boolean
  username: string
  display_name: string
  email: string
}

export const authApi = {

  login(
    username: string,
    password: string
  ) {
    return request<{
      authenticated: boolean
      username: string
    }>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })
  },

  logout() {
    return request<{
      authenticated: boolean
    }>("/auth/logout", {
      method: "POST",
    })
  },

  me() {
    return request<UserProfile>(
      "/auth/me"
    )
  },

  avatarUrl(
    size = 64
  ) {
    return `${API_URL}/auth/avatar?size=${size}`
  },
}


/* ==================== STORAGE ==================== */

export type StorageItem = {
  name: string
  path: string
  is_directory: boolean
  size: number | null
  modified: string | null
  content_type: string | null
}

export const storageApi = {

  list(path = "") {
    return request<StorageItem[]>(
      `/storage/files?path=${encodeURIComponent(path)}`
    )
  },

  createFolder(path: string) {
    return request<{
      created: boolean
      path: string
    }>(
      `/storage/folder?path=${encodeURIComponent(path)}`,
      {
        method: "POST",
      }
    )
  },

  upload(file: File, path = "") {
    const formData = new FormData()

    formData.append("file", file)

    return fetch(
      `${API_URL}/storage/upload?path=${encodeURIComponent(path)}`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    ).then(async (response) => {

      if (!response.ok) {
        let message =
          `JCloud API error: ${response.status}`

        try {
          const data = await response.json()

          if (data?.detail) {
            message = data.detail
          }
        } catch {}

        throw new Error(message)
      }

      return response.json() as Promise<{
        uploaded: boolean
        name: string
        path: string
      }>
    })
  },

  uploadMany(files: File[], path = "") {
    const formData = new FormData()

    for (const file of files) {
      formData.append("files", file)
    }

    return fetch(
      `${API_URL}/storage/upload-many?path=${encodeURIComponent(path)}`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    ).then(async (response) => {

      if (!response.ok) {
        let message =
          `JCloud API error: ${response.status}`

        try {
          const data = await response.json()

          if (data?.detail) {
            message = data.detail
          }
        } catch {}

        throw new Error(message)
      }

      return response.json() as Promise<{
        uploaded: number
        files: Array<{
          name: string
          path: string
        }>
      }>
    })
  },

  rename(path: string, name: string) {
    return request<{
      renamed: boolean
      path: string
      name: string
    }>(
      `/storage/rename?path=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}`,
      {
        method: "POST",
      }
    )
  },

  move(path: string, destination: string) {
    return request<{
      moved: boolean
      source: string
      destination: string
    }>(
      `/storage/move?path=${encodeURIComponent(path)}&destination=${encodeURIComponent(destination)}`,
      {
        method: "POST",
      }
    )
  },

  delete(path: string) {
    return request<{
      deleted: boolean
      path: string
    }>(
      `/storage/file?path=${encodeURIComponent(path)}`,
      {
        method: "DELETE",
      }
    )
  },

  async download(path: string) {
    const response = await fetch(
      `${API_URL}/storage/download?path=${encodeURIComponent(path)}`,
      {
        credentials: "include",
      }
    )

    if (!response.ok) {
      let message =
        `JCloud API error: ${response.status}`

      try {
        const data = await response.json()

        if (data?.detail) {
          message = data.detail
        }
      } catch {}

      throw new Error(message)
    }

    return response.blob()
  },
}


/* ==================== MONITORING ==================== */

export const monitoringApi = {

  system() {
    return request<{
      cpu: {
        load_1m: number
        load_5m: number
        load_15m: number
      }

      memory: {
        total: number
        available: number
        used: number
        percent: number
      }

      storage: {
        total: number
        used: number
        free: number
        percent: number
      }

      pools: {
        nextcloud: {
          path: string
          total: number
          used: number
          free: number
          percent: number
          available: boolean
        }

        applications: {
          path: string
          total: number
          used: number
          free: number
          percent: number
          available: boolean
        }

        databases: {
          path: string
          total: number
          used: number
          free: number
          percent: number
          available: boolean
        }

        vm: {
          path: string
          total: number
          used: number
          free: number
          percent: number
          available: boolean
        }

        backups: {
          path: string
          total: number
          used: number
          free: number
          percent: number
          available: boolean
        }
      }

      network: {
        rx_bytes: number
        tx_bytes: number
      }
    }>("/monitoring/system")
  },
}


/* ==================== MACHINES ==================== */

export type MachineLifecycleState =
  | "AVAILABLE"
  | "STARTING"
  | "IN_USE"
  | "RESETTING"
  | "ERROR"

export type MachinePowerState =
  | "running"
  | "stopped"
  | "paused"
  | "blocked"
  | "crashed"
  | "suspended"
  | "shutdown"
  | "unknown"
  | "unavailable"

export type Machine = {
  id: string
  name: string
  display_name: string

  state: MachinePowerState
  state_code: number | null
  reason: number | null

  uuid: string | null

  vcpus: number
  memory_mb: number
  disk_gb: number

  lifecycle_state: MachineLifecycleState
  owner: string | null
  claimed_at: string | null
  lease_expires_at: string | null
}

export type MachinesResponse = {
  machines: Machine[]
}

export const machinesApi = {

  list() {
    return request<MachinesResponse>(
      "/machines"
    )
  },

  get(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}`
    )
  },

  claim(id: string, leaseMinutes?: number) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}/claim`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          leaseMinutes
            ? {
                lease_minutes: leaseMinutes,
              }
            : {}
        ),
      }
    )
  },

  release(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}/release`,
      {
        method: "POST",
      }
    )
  },

  start(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}/start`,
      {
        method: "POST",
      }
    )
  },

  stop(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}/stop`,
      {
        method: "POST",
      }
    )
  },

  reboot(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}/reboot`,
      {
        method: "POST",
      }
    )
  },

  console(id: string) {
    return request<{
      machine_id: string
      console: string
    }>(
      `/machines/${encodeURIComponent(id)}/console`
    )
  },
}


/* ==================== APPLICATIONS ==================== */

export const applicationsApi = {

  list() {
    return request(
      "/applications"
    )
  },

  get(id: string) {
    return request(
      `/applications/${id}`
    )
  },

  create(data: unknown) {
    return request(
      "/applications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
  },

  delete(id: string) {
    return request(
      `/applications/${id}`,
      {
        method: "DELETE",
      }
    )
  },
}


/* ==================== DATABASES ==================== */

export const databasesApi = {

  list() {
    return request(
      "/databases"
    )
  },

  get(id: string) {
    return request(
      `/databases/${id}`
    )
  },

  create(data: unknown) {
    return request(
      "/databases",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
  },

  delete(id: string) {
    return request(
      `/databases/${id}`,
      {
        method: "DELETE",
      }
    )
  },
}