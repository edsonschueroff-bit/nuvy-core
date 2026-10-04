# Nuvy MCP Security Policy

## Purpose
This policy governs MCP servers used by NuvyCore engineering agents and, only after separate approval, by Cora.

## Default stance
- New MCPs start read-only or sandboxed whenever possible.
- Production write, deploy, financial, messaging, DNS/network, ads-budget, signature, or destructive actions require explicit approval gates.
- Never store OAuth tokens, API keys, passwords, session cookies, or private certificates in this repository.
- Prefer official provider MCPs. Community MCPs require source/origin review and isolated testing.

## Required controls
Every MCP must define:
1. Tool allowlist.
2. Least-privilege auth scopes.
3. Timeout and retry policy.
4. Rate limiting.
5. Audit logging.
6. Revocation/kill procedure.
7. Cost guard for billable calls.
8. Data classification and retention expectations.

## Cora boundary
No new external MCP enters the Cora Core v2 critical production path until the TEXT/READ steady-state is stable. When later introduced, sensitive side effects must remain behind Nuvy backend authorization and Pending Action/confirmation rules.

## Lifecycle
planned -> verified -> sandbox -> homologated_read -> homologated_write (optional) -> production (optional) -> deprecated/revoked.

## Prohibited
- Auto-installing unknown MCPs from public directories.
- Passing production secrets through prompts, Redis payloads, issue bodies, Notion pages, or logs.
- Giving a model unrestricted shell, database admin, cloud admin, or ad-spend authority.
- Letting an MCP bypass Cost Guard, grounding, tenant isolation, idempotency, or audit controls.
