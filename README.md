# JCloud

Private Cloud Infrastructure. One Control Plane.

JCloud is a self-hosted cloud infrastructure platform that brings virtual machines, containerized applications, databases, private cloud storage, monitoring, and remote access into one modern control plane.

Built for private infrastructure where powerful backend systems remain isolated while users get a clean, unified interface.

---

## What is JCloud?

JCloud turns a Linux server into a private cloud platform.

Instead of separately managing Docker, libvirt, QEMU, Nextcloud, networking, and individual services, JCloud provides one unified interface for operating the infrastructure.

                         ┌─────────────────────────┐
                         │         JCloud          │
                         │      Control Plane      │
                         └────────────┬────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
        ┌───────────┐          ┌────────────┐          ┌────────────┐
        │    VMs    │          │Applications│          │ Databases  │
        │  libvirt  │          │   Docker   │          │   Docker   │
        └───────────┘          └────────────┘          └────────────┘
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      ▼
                              ┌──────────────┐
                              │   Storage    │
                              │  Nextcloud   │
                              └──────────────┘

> Infrastructure should be powerful underneath and effortless to operate on top.

---

## Features

### Virtual Machines

Manage isolated development machines through the JCloud control plane.

- VM lifecycle management
- Start / stop / restart
- CPU and memory allocation
- Persistent VM storage
- Automatic IP discovery
- Browser-based remote console
- SPICE console integration
- Machine availability states
- Automatic lifecycle handling

VM lifecycle:

AVAILABLE → STARTING → IN USE → RESETTING → AVAILABLE

### Application Platform

Deploy containerized applications without manually managing Docker networking.

JCloud handles:

- Docker container creation
- CPU limits
- Memory limits
- Persistent application storage
- Restart policies
- Application lifecycle
- Logs
- Resource statistics
- Internal HTTP ports
- Reverse proxy routing

Applications are exposed through:

https://<jcloud-host>/apps/<application>

Architecture:

                    JCloud
                       │
                       ▼
                  Traefik :9000
                       │
                ┌──────┴──────┐
                ▼             ▼
             App One        App Two
             :8080          :3000

Applications communicate through the private `jcloud-apps` Docker network.

Individual application containers do not require public host port bindings.

### Database Platform

JCloud provides managed private database instances using isolated Docker networking.

Supported engines:

| Engine | Image | Default Port |
|---|---|---:|
| PostgreSQL | postgres:17-alpine | 5432 |
| MySQL | mysql:8.4 | 3306 |
| Redis | redis:8-alpine | 6379 |

Each database receives:

- Isolated Docker networking
- Persistent storage
- CPU limits
- Memory limits
- Credentials
- Connection information
- Start / stop / restart controls
- Logs
- Resource statistics

Database ports are not published directly to the host.

                     JCloud
                       │
                 jcloud-databases
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   PostgreSQL        MySQL          Redis
      :5432          :3306          :6379

Persistent database storage:

/srv/databases/
├── postgresql/
├── mysql/
└── redis/

### Private Cloud Storage

JCloud integrates with Nextcloud to provide private cloud storage.

Capabilities include:

- File browsing
- File uploads
- Downloads
- Folder creation
- Rename
- Move
- Delete
- Persistent storage
- Remote private access

Storage is separated from the operating system root filesystem:

/srv/nextcloud

### Infrastructure Monitoring

JCloud provides a unified infrastructure dashboard.

Monitoring covers:

- Storage pools
- Applications
- Databases
- Virtual machines
- Backups
- CPU utilization
- Memory utilization
- Container statistics
- Service state

The goal is to make infrastructure health visible without requiring constant SSH access.

---

## Architecture

                         ┌──────────────────────┐
                         │       Vercel         │
                         │    Next.js Frontend  │
                         └──────────┬───────────┘
                                    │
                               /api requests
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Tailscale       │
                         │    Private Network   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    FastAPI Backend   │
                         │        :8000         │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
        ┌──────────┐          ┌───────────┐          ┌────────────┐
        │ libvirt  │          │  Docker   │          │ Nextcloud  │
        │   VMs    │          │ Services  │          │  Storage   │
        └──────────┘          └─────┬─────┘          └────────────┘
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                         ▼                     ▼
                   Applications           Databases
                     Traefik             PostgreSQL
                                         MySQL
                                         Redis

---

## Technology Stack

Frontend: Next.js 16, React, TypeScript, Turbopack, Vercel

Backend: Python, FastAPI, Pydantic, JWT authentication, REST API

Infrastructure: Ubuntu Linux, Docker, Docker SDK for Python, libvirt, QEMU/KVM, SPICE, Traefik

Storage: Nextcloud, WebDAV, ext4, LVM

Networking: Tailscale, Docker bridge networks, Traefik reverse proxy

---

## Project Structure

JCloud/
│
├── app/
│   ├── applications/
│   ├── databases/
│   ├── dashboard/
│   ├── login/
│   ├── machines/
│   ├── monitoring/
│   ├── settings/
│   └── storage/
│
├── components/
│   └── jcloud/
│
├── lib/
│   └── api.ts
│
├── backend/
│   └── app/
│       ├── core/
│       ├── routers/
│       └── services/
│
├── public/
├── next.config.ts
├── package.json
└── README.md

---

## API

### Authentication

POST /auth/login
POST /auth/logout
GET  /auth/me

### Storage

GET    /storage
POST   /storage/folders
DELETE /storage
POST   /storage/upload

### Machines

GET  /machines
GET  /machines/{id}
POST /machines/{id}/start
POST /machines/{id}/stop
POST /machines/{id}/restart

### Applications

GET    /applications
POST   /applications
GET    /applications/{id}
DELETE /applications/{id}
POST   /applications/{id}/start
POST   /applications/{id}/stop
POST   /applications/{id}/restart
GET    /applications/{id}/logs
GET    /applications/{id}/stats

### Databases

GET    /databases
POST   /databases
GET    /databases/{id}
DELETE /databases/{id}
GET    /databases/{id}/credentials
GET    /databases/{id}/logs
GET    /databases/{id}/stats
POST   /databases/{id}/start
POST   /databases/{id}/stop
POST   /databases/{id}/restart

### Monitoring

GET /monitoring

---

## Storage Architecture

The host uses LVM to separate infrastructure workloads.

 /dev/sda
    │
    └── ubuntu-vg
        │
        ├── ubuntu-lv        → /
        ├── nextcloud-lv     → /srv/nextcloud
        ├── applications-lv  → /srv/applications
        ├── databases-lv     → /srv/databases
        ├── vm-lv            → /srv/vm
        └── backups-lv       → /srv/backups

This prevents a single workload from consuming the entire root filesystem.

---

## Security Model

JCloud separates the public UI from infrastructure access.

Authentication uses signed JWT sessions stored using HTTP-only cookies.

Infrastructure management remains private through Tailscale.

Applications use:

jcloud-apps

Databases use:

jcloud-databases

VMs use:

libvirt / QEMU networking

Management access uses:

Tailscale

Database ports and application containers are not directly published to the host unless explicitly required.

The intended deployment model is:

PUBLIC INTERNET
      │
      ▼
   Vercel
      │
      │ Public UI
      ▼
   Browser
      │
      │ Private API access
      ▼
  Tailscale
      │
      ▼
 JCloud Server

This allows the frontend to be publicly visible while the infrastructure control plane remains accessible only to authorized devices on the private network.

---

## Development

Clone the repository:

git clone https://github.com/rohansablecs/JCloud.git
cd JCloud

Install dependencies:

npm install

Start the development server:

npm run dev

Open:

http://localhost:3000

---

## Environment Variables

Frontend:

NEXT_PUBLIC_API_URL=/api

Backend:

APP_NAME=JCloud
APP_ENV=production
JWT_SECRET=<secret>
CORS_ORIGINS=http://localhost:3000
NEXTCLOUD_URL=http://127.0.0.1:11000
LIBVIRT_URI=qemu:///system
DOCKER_HOST=unix:///var/run/docker.sock
PUBLIC_BASE_URL=https://<private-jcloud-host>

Never commit production secrets or credentials to Git.

---

## Validation

### PostgreSQL

PostgreSQL 17.11

✓ Deployment
✓ Authentication
✓ SQL queries
✓ Persistent storage
✓ Restart
✓ Data recovery

### MySQL

MySQL 8.4.11

✓ Deployment
✓ Authentication
✓ SQL queries
✓ Persistent storage
✓ Restart
✓ Data recovery

### Redis

Redis 8

✓ Deployment
✓ Authentication
✓ Key/value operations
✓ Persistent storage
✓ Restart
✓ Data recovery

### Applications

✓ Docker deployment
✓ Persistent storage
✓ Resource limits
✓ Traefik routing
✓ /apps/<name> paths
✓ Private network routing

### Virtual Machines

✓ libvirt integration
✓ VM lifecycle
✓ IP discovery
✓ SPICE console
✓ Remote browser console

---

## Roadmap

- [x] Authentication
- [x] Dashboard
- [x] Storage management
- [x] Infrastructure monitoring
- [x] VM management
- [x] Browser VM console
- [x] Docker application deployment
- [x] Traefik application routing
- [x] PostgreSQL support
- [x] MySQL support
- [x] Redis support
- [x] Persistent database storage
- [x] Database lifecycle management
- [ ] Production frontend deployment
- [ ] Production API hardening
- [ ] Automated backups
- [ ] Backup restoration UI
- [ ] Secrets management
- [ ] User / team management
- [ ] Resource quotas
- [ ] Audit logs
- [ ] Advanced VM provisioning
- [ ] Application templates
- [ ] Database templates

---

## Design Philosophy

JCloud is not intended to be another collection of dashboards.

The goal is to create a single operational layer over private infrastructure.

Instead of:

SSH
Docker CLI
virsh
Nextcloud
systemctl
Tailscale CLI
manual networking

JCloud aims to provide:

                         JCloud
                            │
             ┌──────────────┼──────────────┐
             │              │              │
            VMs        Applications     Databases
             │              │              │
             └──────────────┼──────────────┘
                            │
                         Storage
                            │
                       Monitoring

One control plane.

One interface.

Private infrastructure.

---

## License

This project is currently under active development.

License information will be added as JCloud approaches public release.

---

# JCloud

Private infrastructure, simplified.

Built with Next.js, FastAPI, Docker, libvirt, QEMU, Nextcloud, Traefik and Tailscale.
