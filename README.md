# SyncSlate

SyncSlate is a collaborative whiteboard application built as a Turborepo monorepo. It combines a Next.js canvas frontend, an Express HTTP API, a WebSocket sync server, and a PostgreSQL database managed with Prisma.

The app lets users sign up, sign in, create whiteboards, draw together in real time, persist board state, preview boards from the dashboard, and export canvases as images or PDFs.

## What is implemented

- Landing page for SyncSlate with product sections and calls to action.
- Signup and signin flows with form validation, loading states, and API error handling.
- JWT-based authentication stored on the client and attached to API requests.
- Dashboard for authenticated users to list, create, open, and delete whiteboards.
- Optional board naming; unnamed boards are created with a generated UUID slug.
- Board thumbnails that are automatically saved from the canvas and shown in the dashboard.
- Full-screen collaborative canvas route at `/canvas/[roomId]`.
- Drawing tools for rectangle, circle, line, freehand pencil, eraser, and selection.
- Stroke color presets, custom color picker, and stroke width controls.
- Undo and redo for locally created shapes.
- Shape deletion with the eraser tool.
- Shape selection and dragging.
- Rectangle resize handles with live resize updates.
- Real-time collaboration through WebSockets.
- Remote cursor broadcasting between users in the same room.
- Shape persistence in PostgreSQL.
- Clear-board action that deletes persisted room shapes and broadcasts the clear event.
- PNG export with a white background.
- PDF export using `jspdf`.
- Share button that copies the current board URL.
- Loading and access/error overlays for the canvas.
- Shared Zod schemas for backend request validation.
- Shared Prisma client package for both backend services.
- Shared TypeScript and ESLint config packages for the monorepo.

## Tech stack

- Monorepo: Turborepo, pnpm workspaces
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, lucide-react
- HTTP API: Express 5, bcrypt, jsonwebtoken, cors
- Realtime: `ws` WebSocket server
- Database: PostgreSQL, Prisma 7, `@prisma/adapter-pg`
- Validation: Zod
- Export: `jspdf`, Canvas API

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

## Apps

### `apps/excalidraw-frontend`

The frontend is a Next.js app.

Important routes:

- `/` - SyncSlate landing page.
- `/signup` - creates a user account.
- `/signin` - signs in and stores the returned JWT in `localStorage`.
- `/dashboard` - lists the signed-in user's whiteboards, supports creation and deletion.
- `/canvas/[roomId]` - collaborative drawing canvas.

Important frontend modules:

- `lib/axios.ts` - Axios client pointed at `http://localhost:3001`; automatically attaches the JWT bearer token.
- `draw/Game.ts` - main canvas engine for drawing, selecting, dragging, resizing, undo/redo, thumbnails, and redraws.
- `draw/createShape.ts` - creates typed shape objects.
- `draw/drawShape.ts` - renders shapes and selection handles.
- `draw/getShape.ts` - hit-testing for selection and erasing.
- `draw/geometry.ts` - distance helpers used for circles and line hit-testing.
- `draw/types.ts` - shared canvas shape and tool types.

Supported tools:

- Select
- Pencil
- Rectangle
- Circle
- Line
- Eraser

Canvas actions:

- Undo and redo
- Clear board
- Export as PNG
- Export as PDF
- Copy share link
- Save thumbnail every 10 seconds
- Broadcast mouse position to collaborators

### `apps/http-backend`

The HTTP backend runs on port `3001`.

Routes:

- `POST /signup`
  - Validates `name`, `email`, and `password`.
  - Rejects duplicate email addresses.
  - Hashes passwords with bcrypt.
  - Creates a user.

- `POST /signin`
  - Validates email and password.
  - Checks the bcrypt password hash.
  - Returns a JWT that expires in 7 days.

- `POST /room`
  - Requires authentication.
  - Creates a room for the signed-in user.
  - Uses the provided `slug` or generates one with `crypto.randomUUID()`.
  - Prevents duplicate room slugs for the same admin.

- `GET /rooms`
  - Requires authentication.
  - Returns rooms owned by the signed-in user.
  - Includes room id, slug, thumbnail, and creation date.

- `DELETE /room/:roomId`
  - Requires authentication.
  - Allows only the room admin to delete the room.
  - Deletes all shapes in the room before deleting the room.

- `GET /shapes/:roomId`
  - Requires authentication.
  - Returns persisted shapes for a room in creation order.

- `PUT /room/:roomId/thumbnail`
  - Requires authentication.
  - Saves a base64 thumbnail for the room.

The middleware accepts either `Authorization: Bearer <token>` or the raw token as the authorization header.

### `apps/ws-backend`

The WebSocket backend runs on port `8080`.

Clients connect with:

```txt
ws://localhost:8080?token=<jwt>
```

The server verifies the JWT, tracks connected users, and stores joined room IDs per socket.

Supported WebSocket messages:

- `join_room`
  - Adds the socket to a room.
  - Responds with `joined`.

- `shape`
  - Upserts a shape by `shape.id`.
  - Persists the JSON shape in PostgreSQL.
  - Broadcasts the shape to other users in the room.

- `clear`
  - Deletes all shapes for the room.
  - Broadcasts the clear event to other users in the room.

- `deleteShape`
  - Deletes a shape by `shapeId`.
  - Broadcasts the deletion to other users in the room.

- `dragShape`
  - Broadcasts shape movement or resize updates.
  - Persists the final shape update when the client sends `flag: true`.

- `mouse_move`
  - Broadcasts cursor coordinates to other users in the room.

## Database schema

The Prisma schema lives in `packages/db/prisma/schema.prisma`.

Models:

- `User`
  - `id`, `email`, `password`, `name`, optional `photo`, `createdAt`
  - Owns rooms and shapes.

- `Room`
  - `id`, `slug`, optional `thumbnail`, `createdAt`, `updatedAt`, `adminId`
  - Belongs to a user.
  - Contains shapes.

- `Shape`
  - `id`, unique `shapeId`, `roomId`, `userId`, JSON `shape`, `createdAt`
  - Stores canvas elements as JSON so different shape types can share one table.

The migration history includes user/room creation, chat-to-room evolution, shape persistence, thumbnails, and changes to slug uniqueness.

## Packages

- `@repo/db`
  - Exports `@repo/db/client`.
  - Creates a Prisma client using `PrismaPg`.
  - Reads `DATABASE_URL`.

- `@repo/common`
  - Exports request validation schemas:
    - `CreateUserSchema`
    - `SigninSchema`
    - `CreateRoomSchema`

- `@repo/backend-common`
  - Exports `JWT_SECRET`.
  - Falls back to `"123123"` if `JWT_SECRET` is not set.

- `@repo/ui`
  - Shared React component package from the Turborepo setup.

- `@repo/eslint-config`
  - Shared lint presets.

- `@repo/typescript-config`
  - Shared TypeScript presets for base, React library, and Next.js projects.

## Getting started

### Prerequisites

- Node.js 18 or newer
- pnpm 9
- PostgreSQL database

### Install dependencies

```sh
pnpm install
```

### Environment variables

Create `packages/db/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-secure-secret"
```

Both backend apps load `packages/db/.env` before starting.

### Generate Prisma client and run migrations

From `packages/db`:

```sh
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

### Run the project

From the repository root:

```sh
pnpm dev
```

This starts all apps through Turborepo.

Expected local services:

- Frontend: `http://localhost:3000`
- HTTP API: `http://localhost:3001`
- WebSocket API: `ws://localhost:8080`

You can also run apps individually:

```sh
pnpm --filter excalidraw-frontend dev
pnpm --filter http-backend dev
pnpm --filter ws-backend dev
```

## Useful scripts

From the root:

```sh
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm format
```

Backend package scripts:

```sh
pnpm --filter http-backend build
pnpm --filter http-backend start
pnpm --filter ws-backend build
pnpm --filter ws-backend start
```

Frontend package scripts:

```sh
pnpm --filter excalidraw-frontend build
pnpm --filter excalidraw-frontend start
pnpm --filter excalidraw-frontend lint
```

## Current development notes

- The frontend API URL is hardcoded to `http://localhost:3001` in `apps/excalidraw-frontend/lib/axios.ts`.
- The frontend WebSocket URL is hardcoded to `ws://localhost:8080` in the canvas page.
- CORS is configured to allow `http://localhost:3000`.
- Room access checks for shapes and thumbnails are currently commented out in the HTTP backend.
- Canvas undo/redo is local to the current browser session.
- Shapes are stored as JSON, which keeps the canvas flexible while the supported shape set evolves.
