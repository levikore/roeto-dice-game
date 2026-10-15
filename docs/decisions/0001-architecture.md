# ADR 0001 — Architecture

- **Status:** Accepted (2026-10-15)
- **Context:** The brief requires all game logic in a backend API with authentication, and a React frontend with no game logic.
- **Decision:**
  - TypeScript monorepo with npm workspaces: `shared`, `server`, `client`.
  - Node + Express API, Zod validation, JWT auth with bcrypt, SQLite via Prisma.
  - The game rules are a pure function (`applyAction`) with an injectable dice roller.
  - React + Vite + TanStack Query for the client; it renders server state only.
- **Consequences:** Rules are easy to unit-test; the client stays thin; SQLite needs no setup but is single-node.
- **Details:** see [PLAN.md §1](../../PLAN.md).
