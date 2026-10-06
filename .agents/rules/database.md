# Database Rules

- Inspect the real schema before writing queries or migrations.
- Parameterize queries; never concatenate untrusted input.
- Preserve tenant scoping on SELECT/INSERT/UPDATE/DELETE.
- Schema changes require migration, compatibility analysis and rollback/forward-fix plan.
- Avoid destructive cleanup in the same step as a feature rollout.
- Use idempotent migrations when practical.
- Production data mutation requires the permissions gate.
