---
name: nest-crud-resource
description: Use when adding a new CRUD REST endpoint or resource to this Nest.js + Prisma backend (e.g. a new GET/POST/PATCH/DELETE route, a new Prisma model, pagination/search/sort on a list endpoint). Follow this pattern for consistent, tested, secure endpoints.
---

# Adding a CRUD resource in this repo

Follow this order — tests before implementation (see CLAUDE.md: TDD-lite for this repo):

1. **If a new Prisma model is needed:** add it to `schema.prisma`, run a migration (`pnpm prisma migrate dev --name <name>`).
2. **Write tests first**, based on the task's spec, covering:
   - The happy path (valid input -> expected response/status code).
   - Not-found / error cases where relevant (e.g. 404 for a missing id).
   - Input validation failures (e.g. invalid DTO fields).
3. **DTO**: define request/query DTOs with `class-validator` decorators. Reuse the existing pagination pattern (`page`/`limit` with defaults, capped `limit`) for list endpoints.
4. **Controller**: thin — route + delegation only (validation is enforced by the global `ValidationPipe` already configured in `main.ts`).
5. **Service**: business logic + Prisma calls. Use Prisma's parameterized queries; never string-interpolate raw SQL.
6. **Register** the module/controller in `AppModule` if it's a new module.
7. Run `pnpm test` until everything (new and existing) is green.

## Common pitfalls to avoid

- Don't hardcode CORS origins — read from the `CORS_ORIGIN` env var.
- Don't skip the not-found case on `:id` routes — always return 404, not a raw Prisma error.
- Don't write tests that just mirror the implementation — write them from the spec, first.
