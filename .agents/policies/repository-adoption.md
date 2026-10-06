# Repository Adoption Policy

## Goal
Adopt the Nuvy Agent Operating Standard across repositories without destroying useful local agent tooling.

## Rule: extend, do not overwrite
Before adding agent files to a repository, inventory:
- AGENTS.md / CLAUDE.md / GEMINI.md;
- .agents/ and .agent/;
- local rules, skills, workflows, hooks and MCP config;
- repository-specific architecture/design docs.

If a mature local framework exists, preserve it and add a thin compatibility entry point. Do not bulk-copy the central .agents tree over it.

## Precedence
1. Explicit operator approval/restriction for the active task.
2. Canonical active Notion task and repository-specific current-execution page.
3. Nuvy Agent Operating Standard hard safety rules.
4. Repository-local rules/skills that extend but do not weaken the above.
5. Historical docs.

## Duplicate frameworks
If both .agent/ and .agents/ exist:
- choose a canonical candidate only after audit;
- do not delete or move either during discovery;
- map unique rules/skills/workflows and runtime dependencies;
- deprecate duplicates only after equivalence and runtime validation.

## Large legacy CLAUDE.md files
Do not rewrite or delete them in one step.
- Treat them as legacy architecture/context.
- Extract stable rules into rules/skills/docs gradually.
- Keep an explicit migration checklist.
- Reduce them only after agents can complete real tasks without losing required context.

## Minimum onboarding for a repository
- Root AGENTS.md or equivalent universal entry adapter.
- Adapter for the primary runtime when useful.
- Link to the repository's canonical current-execution/task source.
- Explicit production/deploy permission boundary.
- A review/evidence requirement.
- No new secrets.

## Validation
Onboard one real task in a draft PR before expanding the pattern to the rest of the repository.
