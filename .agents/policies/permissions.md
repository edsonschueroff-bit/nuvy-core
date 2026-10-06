# Agent Permissions Matrix

## Automatic
Agents may, within their assigned branch/worktree:
- read repository files;
- edit local source and tests;
- run linters, unit tests and builds;
- create non-secret local fixtures;
- create branches and draft PRs;
- update task evidence/documentation;
- install development dependencies only when justified and recorded.

## Requires explicit approval
- database schema migration or production data mutation;
- PM2/service reload or restart;
- deploy/release;
- DNS, firewall, routing or cloud infrastructure changes;
- real WhatsApp/SMS/email outbound outside an already-authorized test;
- financial write or payment action;
- ad campaign creation, publication, budget or bid change;
- signing/sending legal documents;
- credential rotation;
- destructive cleanup with production impact.

## Prohibited without a dedicated break-glass procedure
- deleting production data;
- exposing secrets;
- disabling tenant isolation or security guards;
- bypassing Cost Guard, idempotency, grounding, Pending Actions or audit;
- force-pushing protected branches;
- silently changing production provider/credentials;
- granting an external MCP unrestricted production authority.

When uncertain, treat the action as requiring approval.
