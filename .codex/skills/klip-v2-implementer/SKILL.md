---
name: klip-v2-implementer
description: Implement real Klip functionality inside the new React/Ant Design v2 shell. Use when Codex needs to replace mock data in C:\dev\ts-klip-project-frontend-v2, preserve the current App.tsx/MobileApp.tsx layout, modularize the shell, wire Auth0/API services, or migrate tasks, projects, custom fields, subtasks, calendar, and settings from the legacy frontend.
---

# Klip V2 Implementer

Use this skill to implement migration work after the feature map is known. Preserve the new v2 shell as the visual product. Modularize it as needed for clean code, DRY behavior, and shared desktop/mobile state.

## Required References

- Read `references/migration-rules.md` before broad edits.
- Read `references/api-adapters.md` before changing task, project, or custom field data flow.
- If feature support is unclear, use `$klip-legacy-mapper` first.

## Implementation Workflow

1. Inspect the current v2 shell in `src\App.tsx` and `src\MobileApp.tsx`.
2. Identify the smallest vertical slice to migrate: Auth/bootstrap first, then projects/tasks, then custom fields, then calendar/settings.
3. Extract shared types, API clients, adapters, contexts, hooks, and reusable components before wiring both desktop and mobile views.
4. Replace mock arrays only through shared providers or hooks, not through duplicate page-local state.
5. Keep desktop and mobile behavior equivalent by sharing the same service layer and domain actions.
6. Mark API-missing features as `Em desenvolvimento` in the UI instead of faking persistence.
7. Run `npm run lint` and `npm run build` after implementation changes.

## Non-Negotiables

- Keep skills repository-local; do not depend on global custom skills for this project.
- Do not copy the legacy layout over the v2 layout.
- Do not expose `.env` values in logs, UI, tests, or summaries.
- Do not add one-off data transforms in components when an adapter or helper can centralize the rule.
- Prefer Ant Design documented props/tokens and the existing v2 visual language.
- Preserve readable TypeScript types over `any`; use `unknown` only at API/error boundaries.

## Unsupported UI Policy

When a v2 UI affordance has no OpenAPI support, keep it visibly present only if it helps the new shell communicate the intended product direction. Disable editing or route the command to a clear `Em desenvolvimento` state. Current examples include advanced task status beyond completion, priority, assignee, API tokens, external integrations, and LLM settings.
