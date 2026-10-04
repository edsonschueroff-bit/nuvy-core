<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


<!-- BEGIN:nuvy-mcp-governance -->
## Nuvy MCP governance

Before using or adding an MCP server:
1. Check `.agents/mcp-registry.json`.
2. Follow `docs/mcp/POLICY.md`.
3. Never add credentials, OAuth tokens, API keys, cookies, or certificates to the repository.
4. New MCPs default to read-only/sandbox and require explicit homologation before write, deploy, production, financial, messaging, DNS/network, signature, or ads-budget side effects.
5. Do not introduce a new external MCP into the Cora Core v2 production critical path while the TEXT/READ steady-state gate remains open.
6. MCP tools must not bypass tenant isolation, grounding, idempotency, Pending Actions, Cost Guard, audit logging, or kill switches.
<!-- END:nuvy-mcp-governance -->
