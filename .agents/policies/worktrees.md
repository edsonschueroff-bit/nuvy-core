# Worktree Policy

## Rule
One agent = one task = one branch = one worktree.

## Naming
Recommended branch:
`agent/<module>/<task-slug>`

Recommended worktree folder:
`../wt-<module>-<task-slug>`

## Requirements
- Never have two agents edit the same checkout.
- Rebase/update from the intended base before starting when practical.
- Do not mix unrelated fixes in one worktree.
- Commit or preserve evidence before deleting a worktree.
- A task that depends on an unmerged PR must declare that dependency explicitly.
- Cleanup happens only after the PR is merged/closed and required artifacts are preserved.

## Production
A worktree grants zero production authority by itself.
