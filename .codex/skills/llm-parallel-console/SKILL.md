---
name: llm-parallel-console
description: Run repository-local LLM consultations from PowerShell or CMD using installed Codex and GitHub Copilot CLIs. Use when Codex needs a parallel read-only opinion, a bounded review, or an isolated worker prompt while migrating Klip, especially through scripts that save consultation output under .codex/consults without exposing secrets.
---

# LLM Parallel Console

Use this skill to ask local LLM CLIs for parallel analysis from the terminal. Default to read-only consultations and store outputs under `.codex/consults`.

## Available Providers

- `codex`: available as `codex`; supports `codex exec` with `--sandbox read-only`.
- `copilot`: available as `copilot`; use prompt-only/read-only mode unless a separate worktree is explicitly provided.

## Workflow

1. Read `references/prompt-contract.md`.
2. Prepare a concise prompt with scope, repo paths, constraints, and required output.
3. Use `scripts/Invoke-LlmConsult.ps1` for one provider.
4. Use `scripts/Invoke-ParallelLlmConsults.ps1` for multiple providers.
5. Read the saved output and integrate only verified findings into the main work.

## Safety Rules

- Default mode is read-only. Do not ask other CLIs to edit the main workspace.
- Never include secrets or raw `.env` values in prompts.
- If worker mode is required, create or choose an isolated worktree and state the allowed write scope.
- Treat external LLM output as advice. Verify code, APIs, and tests locally before acting.
- Keep generated consultation files in `.codex/consults`; do not commit them unless the user asks.

## Examples

```powershell
.\.codex\skills\llm-parallel-console\scripts\Invoke-LlmConsult.ps1 `
  -Provider codex `
  -Prompt "Review src/App.tsx for modularization risks. Read-only. Return top 5 findings."
```

```powershell
.\.codex\skills\llm-parallel-console\scripts\Invoke-ParallelLlmConsults.ps1 `
  -Providers codex,copilot `
  -Prompt "Compare the legacy task API usage with the v2 shell. Read-only. Return a migration checklist."
```
