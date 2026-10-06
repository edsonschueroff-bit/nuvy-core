# Nuvy Agent Operating Standard v1

## Purpose
Provide one operating model for Codex, Antigravity, Claude Code and future engineering agents.

## Sources of truth
- **Notion:** product context, architecture, decisions, tasks, status and operator approvals.
- **GitHub:** executable engineering rules, policies, skills, code and review evidence.

When they conflict, stop and resolve the conflict instead of guessing.

## Execution lifecycle
1. Discover canonical task.
2. Create/use dedicated branch and worktree.
3. Declare execution scope and authority.
4. Load minimal rules, policies, skills and MCPs.
5. Inspect before changing.
6. Implement smallest safe change.
7. Run focused tests, then required regression tests.
8. Perform browser/API/hardware QA when applicable.
9. Produce evidence and rollback notes.
10. Open/update PR.
11. Production actions happen only after their separate gate.

## Safety principles
- Least privilege.
- No secrets in prompts, source control, Notion or logs.
- No production side effect by assumption.
- No direct bypass of tenant isolation, grounding, idempotency, Pending Actions, Cost Guard, audit or kill switches.
- No unbounded retries or recursive agent/tool loops.
- Prefer deterministic checks for facts and safety-critical decisions.

## Pilot scope
The first validation targets are Cora Core v2 and Nuvy Lab. Expand to Finance, CRM, Hotspot and Admin only after the QA gate passes.
