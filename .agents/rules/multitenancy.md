# Multi-Tenancy Rules

- Tenant identity must come from an authoritative authenticated/resolved source.
- Every tenant-owned read/write must be scoped by tenant/company identifier at the data-access layer.
- Never trust a client-provided tenant ID without server-side authorization.
- IDs alone are not sufficient authorization for cross-tenant resources.
- Tests for data-access changes must include a cross-tenant negative case.
- Background jobs, webhooks, caches, Redis keys, idempotency keys and telemetry must preserve tenant separation.
- A missing/ambiguous tenant fails closed.
