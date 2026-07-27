2026-07-27 — PATCH instead of PUT for user updates: partial updates are more convenient for the client; idempotency is guaranteed by merge-not-delta semantics, not by the choice of HTTP method.
