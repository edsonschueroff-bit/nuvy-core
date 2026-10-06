# Skill: Nuvy Cora Safety

Use this skill for Cora Core changes involving providers, tools, actions, WhatsApp, grounding, state, retries or cost.

## Required invariants
- Nuvy backend remains authority for tenant, authorization, state and side effects.
- Facts about operational/financial state require authorized tool evidence.
- Mutations use the governed action flow and confirmation rules applicable to the active phase.
- Idempotency and outbound ownership prevent duplicate execution/replies.
- Provider calls pass through Cost Guard/circuit breaker/kill controls.
- Retries are bounded and retry-safe.
- Production capability gates from the canonical Cora task override historical docs.

## Before completion
Run the relevant Cora regression suites and record provider/tool usage plus any blocked capability.
