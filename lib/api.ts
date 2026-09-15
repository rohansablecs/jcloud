const API_URL = "https://jcloud.taile8e3b7.ts.net/api"

const TOKEN_KEY = "jcloud_access_token"

/* =========================================================
   AUTHENTICATION
   ========================================================= */

function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem(TOKEN_KEY)
}

function setAccessToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

function clearAccessToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY)
  }
}

function authHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers)
  const token = getAccessToken()

  if (token) {
    result.set("Authorization", `Bearer ${token}`)
  }

  return result
}

/* =========================================================
   CORE REQUEST
   ========================================================= */

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders(options.headers),
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    let message = `JCloud API error: ${response.status}`

    try {
      const data = await response.json()

      if (data?.detail) {
        message = data.detail
      }
    } catch {}

    if (response.status === 401) {
      clearAccessToken()
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

/* =========================================================
   AUTH
   ========================================================= */

export type UserProfile = {
  authenticated: boolean
  username: string
  display_name: string
  email: string
}

export type LoginResponse = {
  authenticated: boolean
  username: string
  token: string
}

export const authApi = {
  async login(
    username: string,
    password: string,
  ): Promise<LoginResponse> {
    const data = await request<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      },
    )

    setAccessToken(data.token)

    return data
  },

  async logout() {
    try {
      return await request<{
        authenticated: boolean
      }>(
        "/auth/logout",
        {
          method: "POST",
        },
      )
    } finally {
      clearAccessToken()
    }
  },

  me() {
    return request<UserProfile>("/auth/me")
  },

  avatarUrl(size = 64) {
    return `${API_URL}/auth/avatar?size=${size}`
  },
}

/* =========================================================
   STORAGE
   ========================================================= */

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
      `/storage/files?path=${encodeURIComponent(path)}`,
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
      },
    )
  },

  upload(
    file: File,
    path = "",
  ) {
    const formData = new FormData()

    formData.append("file", file)

    return request<{
      uploaded: boolean
      name: string
      path: string
    }>(
      `/storage/upload?path=${encodeURIComponent(path)}`,
      {
        method: "POST",
        body: formData,
      },
    )
  },

  uploadMany(
    files: File[],
    path = "",
  ) {
    const formData = new FormData()

    for (const file of files) {
      formData.append("files", file)
    }

    return request<{
      uploaded: number
      files: Array<{
        name: string
        path: string
      }>
    }>(
      `/storage/upload-many?path=${encodeURIComponent(path)}`,
      {
        method: "POST",
        body: formData,
      },
    )
  },

  rename(
    path: string,
    name: string,
  ) {
    return request<{
      renamed: boolean
      path: string
      name: string
    }>(
      `/storage/rename?path=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}`,
      {
        method: "POST",
      },
    )
  },

  move(
    path: string,
    destination: string,
  ) {
    return request<{
      moved: boolean
      source: string
      destination: string
    }>(
      `/storage/move?path=${encodeURIComponent(path)}&destination=${encodeURIComponent(destination)}`,
      {
        method: "POST",
      },
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
      },
    )
  },

  async download(path: string) {
    const response = await fetch(
      `${API_URL}/storage/download?path=${encodeURIComponent(path)}`,
      {
        credentials: "include",
        headers: authHeaders(),
        cache: "no-store",
      },
    )

    if (!response.ok) {
      let message = `JCloud API error: ${response.status}`

      try {
        const data = await response.json()

        if (data?.detail) {
          message = data.detail
        }
      } catch {}

      if (response.status === 401) {
        clearAccessToken()
      }

      throw new Error(message)
    }

    return response.blob()
  },
}

/* =========================================================
   MONITORING
   ========================================================= */

export type StoragePool = {
  path: string
  total: number
  used: number
  free: number
  percent: number
  available: boolean
}

export type MonitoringSystem = {
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
    nextcloud: StoragePool
    applications: StoragePool
    databases: StoragePool
    vm: StoragePool
    backups: StoragePool
  }

  network: {
    rx_bytes: number
    tx_bytes: number
  }
}

export const monitoringApi = {
  system() {
    return request<MonitoringSystem>(
      "/monitoring/system",
    )
  },
}

/* =========================================================
   MACHINES
   ========================================================= */

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
      "/machines",
    )
  },

  get(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}`,
    )
  },

  claim(
    id: string,
    leaseMinutes?: number,
  ) {
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
            : {},
        ),
      },
    )
  },

  release(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}/release`,
      {
        method: "POST",
      },
    )
  },

  start(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}/start`,
      {
        method: "POST",
      },
    )
  },

  stop(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}/stop`,
      {
        method: "POST",
      },
    )
  },

  reboot(id: string) {
    return request<Machine>(
      `/machines/${encodeURIComponent(id)}/reboot`,
      {
        method: "POST",
      },
    )
  },

  console(id: string) {
    return request<{
      machine_id: string
      console: string
    }>(
      `/machines/${encodeURIComponent(id)}/console`,
    )
  },
}

/* =========================================================
   APPLICATIONS — TYPES
   ========================================================= */

export type ApplicationPort = {
  container: string
  host_ip: string | null
  host: string | null
}

export type ApplicationMount = {
  type: string
  source: string
  destination: string
  read_only: boolean
}

export type Application = {
  id: string
  name: string
  image: string
  status: string
  state: string
  created: string

  ports: ApplicationPort[]

  labels: Record<string, string>

  command: string[]

  environment: Record<string, string>

  restart_policy: string

  cpu_limit: number | null

  memory_limit: number | null

  mounts: ApplicationMount[]

  endpoint_url: string | null
}

export type ApplicationStats = {
  application_id: string
  cpu_percent: number
  memory_usage: number
  memory_limit: number
  memory_percent: number
}

export type ApplicationLogs = {
  application_id: string
  logs: string
}

export type DeployApplicationData = {
  name: string
  image: string

  command: string[] | null

  environment: Record<string, string>

  ports: Array<{
    container: string
  }>

  cpu_limit: number | null

  memory_limit: string | null

  persistent_storage: boolean

  mount_path: string

  restart_policy:
    | "no"
    | "always"
    | "on-failure"
    | "unless-stopped"
}

/* =========================================================
   APPLICATIONS — API
   ========================================================= */

export const applicationsApi = {
  list() {
    return request<Application[]>(
      "/applications",
    )
  },

  get(id: string) {
    return request<Application>(
      `/applications/${encodeURIComponent(id)}`,
    )
  },

  deploy(data: DeployApplicationData) {
    return request<Application>(
      "/applications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    )
  },

  start(id: string) {
    return request<Application>(
      `/applications/${encodeURIComponent(id)}/start`,
      {
        method: "POST",
      },
    )
  },

  stop(id: string) {
    return request<Application>(
      `/applications/${encodeURIComponent(id)}/stop`,
      {
        method: "POST",
      },
    )
  },

  restart(id: string) {
    return request<Application>(
      `/applications/${encodeURIComponent(id)}/restart`,
      {
        method: "POST",
      },
    )
  },

  delete(id: string) {
    return request<void>(
      `/applications/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    )
  },

  logs(id: string) {
    return request<ApplicationLogs>(
      `/applications/${encodeURIComponent(id)}/logs`,
    )
  },

  stats(id: string) {
    return request<ApplicationStats>(
      `/applications/${encodeURIComponent(id)}/stats`,
    )
  },
}

/* =========================================================
   DATABASES — TYPES
   ========================================================= */

export type DatabaseType =
  | "postgresql"
  | "mysql"
  | "redis"

export type DatabaseStatus =
  | "running"
  | "stopped"
  | "paused"
  | "created"
  | "restarting"
  | "removing"
  | "dead"
  | "unknown"
  | string

export type DatabaseMount = {
  type: string | null
  source: string | null
  destination: string | null
  read_only: boolean
}

export type Database = {
  id: string
  name: string

  database_type: DatabaseType

  image: string

  status: DatabaseStatus
  state: string
  created: string

  port: number

  database_name: string | null
  username: string | null

  restart_policy: string

  cpu_limit: number | null
  memory_limit: number | null

  mounts: DatabaseMount[]

  host: string
}

export type DatabaseCredentials = {
  database_type: DatabaseType
  host: string
  port: number
  database_name: string | null
  username: string | null
  password: string | null
  connection_string: string | null
}

export type DatabaseLogs = {
  database_id: string
  logs: string
}

export type DatabaseStats = {
  database_id: string
  cpu_percent: number
  memory_usage: number
  memory_limit: number
  memory_percent: number
}

export type CreateDatabaseData = {
  name: string

  database_type: DatabaseType

  database_name?: string

  username?: string

  password?: string

  cpu_limit?: number | null

  memory_limit?: string | null

  persistent_storage: boolean

  restart_policy:
    | "no"
    | "always"
    | "on-failure"
    | "unless-stopped"
}

/* =========================================================
   DATABASES — API
   ========================================================= */

export const databasesApi = {
  list() {
    return request<Database[]>(
      "/databases",
    )
  },

  get(id: string) {
    return request<Database>(
      `/databases/${encodeURIComponent(id)}`,
    )
  },

  credentials(id: string) {
    return request<DatabaseCredentials>(
      `/databases/${encodeURIComponent(id)}/credentials`,
    )
  },

  create(data: CreateDatabaseData) {
    return request<Database>(
      "/databases",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    )
  },

  start(id: string) {
    return request<Database>(
      `/databases/${encodeURIComponent(id)}/start`,
      {
        method: "POST",
      },
    )
  },

  stop(id: string) {
    return request<Database>(
      `/databases/${encodeURIComponent(id)}/stop`,
      {
        method: "POST",
      },
    )
  },

  restart(id: string) {
    return request<Database>(
      `/databases/${encodeURIComponent(id)}/restart`,
      {
        method: "POST",
      },
    )
  },

  delete(id: string) {
    return request<void>(
      `/databases/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    )
  },

  logs(id: string) {
    return request<DatabaseLogs>(
      `/databases/${encodeURIComponent(id)}/logs`,
    )
  },

  stats(id: string) {
    return request<DatabaseStats>(
      `/databases/${encodeURIComponent(id)}/stats`,
    )
  },
}