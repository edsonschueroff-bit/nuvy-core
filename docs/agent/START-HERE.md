# NuvyCore Agent — START HERE

Use this file before changing code.

## 1. Resolve the task
Identify the canonical project and task in Notion. Record:
- project/module;
- task ID/title;
- acceptance criteria;
- current phase/status;
- explicit operator approvals or prohibitions.

If there is no canonical task for a non-trivial change, stop and create/confirm one before implementation.

## 2. Establish execution scope
Before editing, state internally:
- repository and branch;
- dedicated worktree;
- allowed paths;
- forbidden paths;
- production access: yes/no;
- deploy/reload permission: yes/no;
- database mutation permission: yes/no;
- external side effects permission: yes/no.

Default is NO for production side effects.

## 3. Load only relevant guidance
Read:
1. `AGENTS.md`;
2. the applicable files in `.agents/rules/`;
3. the applicable files in `.agents/policies/`;
4. only the skills needed for the task;
5. `.agents/mcp-registry.json` before using MCPs.

Do not load unrelated historical documentation unless the canonical task requires it.

## 4. Work in isolation
Use one task = one branch = one worktree. Do not let multiple agents edit the same checkout.

## 5. Execute and verify
Make the smallest complete change. Run the tests required by the task and by `.agents/policies/review.md`.

## 6. Close with evidence
Report changed files, tests, results, risks, configuration changes, production impact, rollback, and remaining blockers.

A task is not complete because code was written; it is complete when acceptance criteria and evidence are satisfied.
