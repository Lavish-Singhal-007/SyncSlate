# SyncSlate — Architecture & Reference

This document covers the implementation details that don't belong in the top-level README: full API routes, WebSocket message contracts, the database schema, and shared packages.

## Apps in detail

### `apps/excalidraw-frontend`

Routes:

| Route              | Purpose                               |
| ------------------ | ------------------------------------- |
| `/`                | SyncSlate landing page                |
| `/signup`          | Create a user account                 |
| `/signin`          | Sign in, stores JWT in `localStorage` |
| `/dashboard`       | List, create, and delete whiteboards  |
| `/canvas/[roomId]` | Collaborative drawing canvas          |

Key modules:

- `lib/axios.ts` — Axios client pointed at the HTTP API; attaches the JWT bearer token automatically.
- `draw/Game.ts` — core canvas engine: drawing, selection, dragging, resizing, undo/redo, thumbnails, redraws.
- `draw/createShape.ts` — typed shape object creation.
- `draw/drawShape.ts` — shape and selection-handle rendering.
- `draw/getShape.ts` — hit-testing for selection and erasing.
- `draw/geometry.ts` — distance helpers for circle/line hit-testing.
- `draw/types.ts` — shared canvas shape and tool types.

### `apps/http-backend` (port `3001`)

| Method & Route                | Description                                                         |
| ----------------------------- | ------------------------------------------------------------------- |
| `POST /signup`                | Validates input, hashes password (bcrypt), rejects duplicate emails |
| `POST /signin`                | Verifies password hash, returns a 7-day JWT                         |
| `POST /room`                  | Creates a room (auth required); auto-generates slug if omitted      |
| `GET /rooms`                  | Returns rooms owned by the signed-in user                           |
| `DELETE /room/:roomId`        | Admin-only; deletes all room shapes, then the room                  |
| `GET /shapes/:roomId`         | Returns persisted shapes for a room, in creation order              |
| `PUT /room/:roomId/thumbnail` | Saves a base64 thumbnail for the room                               |

Auth middleware accepts either `Authorization: Bearer <token>` or the raw token directly.

### `apps/ws-backend` (port `8080`)

Clients connect with `ws://localhost:8080?token=<jwt>`. The server verifies the JWT and tracks connected users and their joined rooms.

| Message type  | Behavior                                                            |
| ------------- | ------------------------------------------------------------------- |
| `join_room`   | Adds the socket to a room; responds with `joined`                   |
| `shape`       | Upserts a shape by `shape.id`, persists it, broadcasts to the room  |
| `clear`       | Deletes all shapes for the room, broadcasts the clear event         |
| `deleteShape` | Deletes a shape by `shapeId`, broadcasts the deletion               |
| `dragShape`   | Broadcasts live move/resize; persists final state when `flag: true` |
| `mouse_move`  | Broadcasts cursor coordinates to other users in the room            |

## Database schema

Defined in `packages/db/prisma/schema.prisma`:

- **`User`** — `id`, `email`, `password`, `name`, optional `photo`, `createdAt`. Owns rooms and shapes.
- **`Room`** — `id`, `slug`, optional `thumbnail`, `createdAt`, `updatedAt`, `adminId`. Belongs to a user, contains shapes.
- **`Shape`** — `id`, unique `shapeId`, `roomId`, `userId`, JSON `shape`, `createdAt`. Shapes are stored as JSON so any shape type can share one table without a schema migration.

Migration history covers user/room creation, the evolution from chat-rooms to whiteboard-rooms, shape persistence, thumbnails, and slug-uniqueness changes.

## Shared packages

| Package                   | Purpose                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| `@repo/db`                | Prisma client (`@repo/db/client`) built with `PrismaPg`, reads `DATABASE_URL` |
| `@repo/common`            | Shared Zod schemas: `CreateUserSchema`, `SigninSchema`, `CreateRoomSchema`    |
| `@repo/backend-common`    | Shared `JWT_SECRET` (falls back to a dev default if unset)                    |
| `@repo/ui`                | Shared React component package                                                |
| `@repo/eslint-config`     | Shared lint presets                                                           |
| `@repo/typescript-config` | Shared TS presets (base, React library, Next.js)                              |

## Notes on trade-offs

- **Shapes as JSON blobs**: keeps the schema flexible while the supported shape set is still evolving, at the cost of losing per-shape-type query/index support. Deliberate, not an oversight.
- **Hardcoded localhost URLs**: the frontend's API and WebSocket URLs are not yet read from environment config — straightforward to fix before deployment, just not done yet.
- **Disabled room access checks**: the shapes and thumbnail endpoints have access-check logic written but currently commented out — next on the list before this is production-ready.
