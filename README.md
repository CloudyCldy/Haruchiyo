# Sanzu - Project Management & AI Assistant API

Sanzu is a standalone REST API for project managers. Haitani is an external client and is not included in this repository. Haitani, mobile apps, web apps, and API tools communicate with Sanzu over HTTP/JSON.

## Architecture

`Haitani -> HTTP/REST -> Sanzu route handlers -> services and methodology engine -> PostgreSQL / configurable AI provider`

The App Router is used only as a backend API boundary; there is no frontend application.

## Features

Authentication with bcrypt and JWT, project membership authorization, project/task/team/backlog/sprint/milestone/risk/issue management, deterministic metrics and health scoring, methodology compliance, recommendations, contextual AI assistance, and chat history.

Supported strategies are Agile, Scrum, Kanban, Extreme Programming, Lean, Waterfall, and Hybrid. Strategies are registered in `src/methodology/types.ts` and can be extended without rewriting route handlers.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and a strong `JWT_SECRET`.
2. Run `npm install`.
3. Run `npx prisma generate`.
4. Run `npx prisma migrate dev --name init` against PostgreSQL.
5. Run `npm run seed` for demo data.
6. Run `npm run dev`.

The API is available at `http://localhost:3000`. A public liveness endpoint is `GET /api/health`. Use `npm test` and `npm run typecheck` for verification.

## Authentication

Register or log in using `/api/auth/register` and `/api/auth/login`. Send the returned token as `Authorization: Bearer <token>`. Password hashes are never returned.

Example: `GET /api/projects/{id}/analysis`, `GET /api/projects/{id}/health`, `GET /api/projects/{id}/metrics`, or `POST /api/chatbot/message` with `{ "projectId": "...", "message": "Why is this project behind schedule?" }`.

## Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) and [openapi.yaml](openapi.yaml). Prisma schema and seed data are in `prisma/`.

## Security and operations

Secrets are environment-only. The API validates input with Zod, enforces project ownership or membership, avoids sensitive logging, and returns safe structured errors. Configure `AI_API_KEY`, `AI_MODEL`, and `AI_BASE_URL` for an OpenAI-compatible provider; without a key, the assistant returns deterministic findings without making a network call.

## Future improvements

Add refresh tokens, pagination, audit events, queues for long-running AI analysis, richer historical flow metrics, and adapters for SAFe, PRINCE2, Six Sigma, Crystal, and Scrumban.
