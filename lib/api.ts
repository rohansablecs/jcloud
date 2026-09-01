const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
      },
    }
  )

  if (!response.ok) {
    throw new Error(
      `JCloud API error: ${response.status}`
    )
  }

  return response.json()
}

export const authApi = {
  login(username: string, password: string) {
    return request("/auth/login", {
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

  me() {
    return request("/auth/me")
  },

  logout() {
    return request("/auth/logout", {
      method: "POST",
    })
  },
}

export const storageApi = {
  list(path = "/") {
    return request(
      `/storage/files?path=${encodeURIComponent(path)}`
    )
  },

  upload(file: File, path = "/") {
    const form = new FormData()

    form.append("file", file)
    form.append("path", path)

    return fetch(
      `${API_URL}/storage/upload`,
      {
        method: "POST",
        credentials: "include",
        body: form,
      }
    )
  },

  createFolder(path: string, name: string) {
    return request("/storage/folders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path,
        name,
      }),
    })
  },

  delete(path: string) {
    return request(
      `/storage/files?path=${encodeURIComponent(path)}`,
      {
        method: "DELETE",
      }
    )
  },
}

export const machinesApi = {
  list() {
    return request("/machines")
  },

  get(id: string) {
    return request(`/machines/${id}`)
  },

  start(id: string) {
    return request(`/machines/${id}/start`, {
      method: "POST",
    })
  },

  stop(id: string) {
    return request(`/machines/${id}/stop`, {
      method: "POST",
    })
  },

  release(id: string) {
    return request(`/machines/${id}/release`, {
      method: "POST",
    })
  },
}

export const applicationsApi = {
  list() {
    return request("/applications")
  },

  deploy(data: unknown) {
    return request("/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
  },

  delete(id: string) {
    return request(`/applications/${id}`, {
      method: "DELETE",
    })
  },
}

export const databasesApi = {
  list() {
    return request("/databases")
  },

  create(data: unknown) {
    return request("/databases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
  },

  delete(id: string) {
    return request(`/databases/${id}`, {
      method: "DELETE",
    })
  },
}

export const monitoringApi = {
  system() {
    return request("/monitoring/system")
  },

  services() {
    return request("/monitoring/services")
  },
}