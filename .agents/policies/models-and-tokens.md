# Model and Token Policy

## Goal
Use the minimum model/context needed for reliable execution.

## Suggested routing
- discovery, file lookup, routine docs: fast/economical model;
- normal implementation/refactor: standard engineering model;
- complex architecture, concurrency, migrations, security incidents: strong reasoning model;
- critical security/financial/production review: strong model plus independent review when practical.

## Context discipline
- Start from canonical START HERE/task pages.
- Do not reread long historical logs unless needed.
- Load only relevant rules and skills.
- Summarize stable context into canonical docs instead of repeatedly replaying chat history.
- Prefer targeted file reads over whole-repository ingestion.
- Stop recursive tool/agent loops with explicit step ceilings/timeouts.

Cost optimization must never weaken required safety or test coverage.
