# backend

## Stack
Nest.js + Prisma (PostgreSQL, hosted on Supabase). Deployed to GCP Cloud Run.

## Run / test
- `pnpm install` then `pnpm start:dev` (watch mode).
- `pnpm test` — Jest unit tests (`*.spec.ts`, colocated with source).
- `pnpm test:e2e` — Jest e2e suite (`test/`).
- `pnpm lint` — ESLint, `--fix`, zero warnings allowed.
- `pnpm typecheck` — `tsc --noEmit`.
- `pnpm exec prisma migrate dev` — new local migration after a schema change.

## Structure
- `src/<feature>/` — one folder per resource (`auth`, `users`, `listings`,
  `provider-profiles`, `service-categories`), each with its own
  `*.controller.ts`, `*.service.ts`, `*.module.ts`, `dto/`.
- `src/prisma/` — `PrismaService`, injected into feature services.
- `prisma/schema.prisma` — single schema file, `prisma/migrations/` for history.
- `src/config/env.validation.ts` — startup env-var validation.

## Conventions
Pattern for a new REST resource: DTO (class-validator decorators) ->
Controller -> Service -> Prisma call.
- Query params (pagination, sorting, search) go through a dedicated DTO,
  validated via the global `ValidationPipe`.
- Pagination: `page`/`limit` query params with sensible defaults, capped `limit`.
- Conventional commits, everything (commits, PR title/description, comments)
  in English.
- Tests are written FIRST, based on the task specification, before
  implementation (TDD-lite) — keeps tests an independent check of behavior,
  not a mirror of whatever got implemented.

## Never do
- Never commit `.env` or real secrets — runtime secrets live in GCP Secret
  Manager, only referenced by name from CI.
- Never write a Prisma migration by hand — always `prisma migrate dev` and
  commit the generated SQL as-is.
- Never bypass the DTO/ValidationPipe layer by reading `req.body` directly.
- Never add a peripheral `@nestjs/*` package without pinning its version to
  match `@nestjs/common`/`@nestjs/core`'s major — see BLOG_NOTES.md for the
  three separate incidents this caused (swagger, mapped-types, passport).
- Never merge a PR with a red `pnpm lint`/`pnpm typecheck`/`pnpm test` — all
  three are required CI checks on `main` and `staging`.
