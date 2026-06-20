# SyncSlate

**A real-time collaborative whiteboard, built from scratch as a Turborepo monorepo.**

SyncSlate lets multiple users draw on the same canvas simultaneously — shapes, cursors, and edits sync live across every connected client, are persisted to PostgreSQL, and can be exported as PNG or PDF. The project is split into three independently deployable services (Next.js frontend, Express HTTP API, WebSocket sync server) sharing common packages for validation, database access, and config.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![WebSocket](https://img.shields.io/badge/WebSocket-realtime-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss&logoColor=white)

## Why this project

SyncSlate was built to go deeper than a typical CRUD app and tackle problems that come up in real collaborative software:

- **Real-time state synchronization** across multiple clients using raw WebSockets — no third-party realtime SDK.
- **Conflict-aware persistence**: every shape mutation (create, drag, resize, delete) is broadcast _and_ written to PostgreSQL, with debounced final-state writes for drag/resize.
- **Monorepo discipline**: shared Zod schemas, a shared Prisma client, and shared TypeScript/ESLint configs are consumed by three separate apps via Turborepo.
- **Shared auth**: JWT-based authentication works across both the HTTP API and the WebSocket server, with room ownership checks.

## Features

- Signup/signin with validation, loading states, and JWT auth
- Dashboard to create, list, open, and delete whiteboards, with auto-saved thumbnails
- Drawing tools: rectangle, circle, line, freehand pencil, eraser, selection
- Selection, dragging, live resizing, undo/redo
- Real-time sync of shapes and cursors across all clients in a room
- Clear-board action, synced live
- Export as PNG or PDF
- One-click share link

## Tech stack

Turborepo · pnpm workspaces · Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Express 5 · `ws` (WebSockets) · PostgreSQL · Prisma 7 · Zod · `jspdf`

## Architecture

![Architecture Diagram](image.png)

A full breakdown of API routes, WebSocket message types, and the database schema is in [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Repository structure

```txt
apps/
  excalidraw-frontend/   Next.js frontend for landing, auth, dashboard, and canvas
  http-backend/          Express API for auth, rooms, shapes, and thumbnails
  ws-backend/            WebSocket server for realtime room collaboration

packages/
  db/                    Prisma schema, migrations, and shared Prisma client
  common/                Shared Zod validation schemas
  backend-common/        Shared backend config such as JWT secret
  ui/                    Shared React UI package from the Turborepo setup
  eslint-config/         Shared ESLint configs
  typescript-config/     Shared TypeScript configs
```

## Getting started

### Prerequisites

- Node.js 18+, pnpm 9, a PostgreSQL database

### Setup

```sh
pnpm install
```

Create `packages/db/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-secure-secret"
```

```sh
cd packages/db
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

### Run

```sh
pnpm dev
```

| Service       | URL                     |
| ------------- | ----------------------- |
| Frontend      | `http://localhost:3000` |
| HTTP API      | `http://localhost:3001` |
| WebSocket API | `ws://localhost:8080`   |

## Known limitations

- Frontend API/WebSocket URLs are currently hardcoded to `localhost`, not read from env config — a clear next step before deployment.
- Room-level access checks for shapes/thumbnail endpoints are implemented but currently disabled.
- Undo/redo is local to the current browser session, not yet a synced collaborative action.

More detail, including the full API reference and database schema, is in [`ARCHITECTURE.md`](ARCHITECTURE.md).
