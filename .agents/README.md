# .agents — NuvyCore

This directory contains reusable execution guidance for engineering agents.

## Load order
1. Repository root `AGENTS.md`
2. `docs/agent/START-HERE.md`
3. Relevant files in `rules/`
4. Relevant files in `policies/`
5. Relevant skill(s) in `skills/`
6. `mcp-registry.json` only when external tools are needed

## Directory roles
- `rules/`: invariants that apply by technical concern.
- `policies/`: how agents are allowed to operate.
- `skills/`: task/domain-specific playbooks.
- `mcp-registry.json`: approved MCP candidates and permission classes.

Keep these files small. Move historical narrative and product context to canonical Notion pages or focused docs rather than expanding the agent startup context.
