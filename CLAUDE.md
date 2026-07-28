# Conventions for this repo

Stack: Nest.js + Prisma (PostgreSQL).

Pattern for a new REST resource:
DTO (class-validator decorators) -> Controller -> Service -> Prisma call.

- Query params (pagination, sorting, search) go through a dedicated DTO,
  validated via the global ValidationPipe.
- Pagination: `page`/`limit` query params with sensible defaults, capped `limit`.
- Run tests with `pnpm test`.
- Conventional commits, everything (commits, PR title/description, comments) in English.
