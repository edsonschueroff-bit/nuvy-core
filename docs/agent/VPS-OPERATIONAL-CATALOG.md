# VPS Operational Catalog Reconciliation

This document records the useful central agent catalog observed on the VPS during the
read-only audit for Nuvy Agent Operating Standard v1. It exists so the bootstrap standard
in this repository does not accidentally erase the richer AG Kit already operating on the
server.

## Audit Scope

- Date: 2026-10-06.
- VPS root inspected: `/opt/nuvycore`.
- Mode: read-only inventory and hash checks; no deploy, reload, database, DNS, network,
  WireGuard, MikroTik or production side effect.
- Local Git state: `/opt/nuvycore` is not a Git checkout, so adoption must not assume that
  a Git merge can be applied directly to the live tree.

## Root Entry Points Observed

- `/opt/AGENTS.md -> /opt/nuvycore/AGENTS.md`.
- `/opt/CLAUDE.md -> /opt/nuvycore/CLAUDE.md`.
- `/opt/.agents -> /opt/nuvycore/.agents`.
- `/opt/NUVY_CORE_PADRAO.md -> /opt/nuvycore/NUVY_CORE_PADRAO.md`.

## Central AG Kit Inventory

The central `/opt/nuvycore/.agents` catalog contains:

- 20 specialized agents under `.agents/agent/`.
- 54 skills under `.agents/skills/`.
- 7 master rules under `.agents/rules/`.
- 13 workflows under `.agents/workflows/`.
- MCP configuration, memory files and Notion operational helpers.

## Specialized Agents

- `orchestrator`: complex task coordination.
- `frontend-specialist`: React/Vite interfaces, Nuvy Telecom v4, responsiveness.
- `backend-specialist`: Node.js/Express APIs, microservices, auth and integrations.
- `database-architect`: MySQL/PostgreSQL modeling, query integrity and migrations.
- `devops-engineer`: PM2, Nginx Proxy Manager, Docker, SSL, deploys and Linux servers.
- `project-planner`: phased planning, architecture and task breakdown.
- `debugger`: systematic debugging and root-cause analysis.
- `qa-automation-engineer`: E2E automation, Playwright and coverage.
- `security-auditor`: OWASP, credentials and security auditing.
- `performance-optimizer`: profiling, waterfalls, Core Web Vitals and bundle size.
- `explorer-agent`: code scanning, structural indexing and impact discovery.
- `code-archaeologist`: legacy refactoring, simplification and dead-code removal.
- `mobile-developer`: mobile-first and PWA patterns.
- `product-manager`: product strategy and prioritization.
- `product-owner`: acceptance criteria, user stories and delivery value.
- `documentation-writer`: technical docs, ADRs, API manuals and guides.
- `penetration-tester`: controlled offensive tests and MITRE simulations.
- `seo-specialist`: SEO and generative engine optimization.
- `game-developer`: game loops, engines and gamification.
- `test-engineer`: practical validation and regression testing.

## Nuvy-Specific Skills To Preserve

- `cora-agent-reliability`.
- `figma-developer-mcp`.
- `multi-tenancy-architect`.
- `nuvy-database-navigator`.
- `nuvy-lime-design-system` documenting the current Nuvy Telecom v4 design standard.
- `nuvy-mcp-workflows`.
- `nuvy-pm2-ops`.

## Master Rules To Preserve

- `core-protocol.md`: P0 agent loading, skill announcement and dependency checks.
- `request-routing.md`: automatic request classification and dynamic routing.
- `code-rules.md`: coding guidelines, Socratic Gate and planning modes.
- `universal-rules.md`: PT-BR communication and clean code expectations.
- `nuvy-rules.md`: Nuvy ecosystem guardrails, zero mocks and port/design consistency.
- `design-rules.md`: UI contrast, typography and spacing rules.
- `quick-reference.md`: quick reference for essential components.

## Workflows To Preserve

`/brainstorm`, `/coordinate`, `/create`, `/debug`, `/deploy`, `/enhance`,
`/orchestrate`, `/plan`, `/preview`, `/remember`, `/status`, `/test` and `/verify`.

## Adoption Rules

1. Treat this repository's bootstrap standard as governance, not as an instruction to
   replace the live VPS AG Kit wholesale.
2. Preserve `.agents/`, `.agent/`, `.claude/`, `CLAUDE.md` and existing memory until a
   dedicated migration task proves equivalence and rollback.
3. Apply central policies, MCP registry and adapter files additively.
4. For every future sync, produce a file-by-file table with `add`, `adapt`, `preserve`,
   `deprecate later` or `do not apply`.
5. Abort if a planned sync removes rules, skills, workflows, hooks, memory or adapter
   context without explicit operator approval.

## Rollback Reference

Before any future write to the VPS, snapshot the affected agent artifacts and record a
manifest with path, size, hash and timestamp. Roll back by restoring only the changed
agent artifacts from that snapshot, then re-run structure checks. This PR does not
authorize the sync itself.
