# Coding Rules

- Inspect existing patterns before creating new abstractions.
- Prefer the smallest complete change.
- Do not duplicate an existing service, source of truth or integration path without an explicit migration plan.
- Keep error handling explicit; do not swallow failures.
- Bound retries and make retry safety explicit.
- Add/adjust tests for regressions fixed.
- Do not hardcode tenant-specific, credential, endpoint or environment data when a canonical configuration source exists.
- Keep backward compatibility or document the intentional break and migration.
