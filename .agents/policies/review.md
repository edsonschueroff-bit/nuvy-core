# Review Policy

## Minimum evidence for every non-trivial change
- canonical task reference;
- files changed;
- reason for each logical change;
- tests executed;
- test results;
- known risks;
- config/schema/dependency changes;
- production impact;
- rollback path;
- remaining blockers or deferred work.

## Required QA by change type
- **Frontend/UI:** build + browser QA of the affected flow + console/network error check.
- **API/backend:** focused tests + contract/request validation + negative-path checks.
- **Database:** migration review + tenant-scope review + rollback/forward-fix plan.
- **Cora/AI:** grounding, idempotency, Cost Guard, loop/retry and relevant eval/regression coverage.
- **Nuvy Lab:** deterministic test-plan evidence, network isolation and hardware-safe cleanup/reconciliation.
- **MCP:** tool inventory, auth scopes, read/write classification, timeout/rate limit, audit and revocation.

## Completion rule
“Build passed” alone is never sufficient evidence for a user-facing or production-sensitive change.
