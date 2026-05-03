# LLM Consultation Prompt Contract

Use short, bounded prompts. Include enough repo context for the external model to answer without secrets.

## Required Fields

- Goal: one sentence.
- Repos: current repo and any read-only reference repo.
- Scope: exact files, folders, or feature area.
- Constraints: read-only or isolated worker, no secrets, preserve v2 layout.
- Output: requested format and maximum length.

## Template

```text
Goal: <what to evaluate or produce>
Repos:
- Target: C:\dev\ts-klip-project-frontend-v2
- Legacy reference: C:\dev\ts-klip-project-frontend (read-only)
Scope: <files or feature>
Constraints: read-only; do not print .env values; preserve App.tsx/MobileApp.tsx visual shell.
Output: <table/checklist/findings>; include file references when relevant.
```

## Worker Mode Addendum

Only use worker mode with an isolated worktree or explicitly disposable copy.

```text
Worker mode: write only inside <path>. Do not modify the main workspace. List changed files and verification commands.
```
