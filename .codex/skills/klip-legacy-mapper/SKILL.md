---
name: klip-legacy-mapper
description: Map legacy Klip frontend functionality before migrating it into the new Klip v2 shell. Use when Codex needs to inspect C:\dev\ts-klip-project-frontend, compare it with C:\dev\ts-klip-project-frontend-v2, inventory tasks/projects/custom fields/Auth0/API usage, or decide whether a v2 layout feature is API-backed or should be marked "Em desenvolvimento".
---

# Klip Legacy Mapper

Use this skill before implementing or reviewing migration work. Treat the old frontend as read-only, the v2 frontend as the target shell, and the public OpenAPI document as the source of truth for API support.

## Sources

- Legacy frontend: `C:\dev\ts-klip-project-frontend`
- Target frontend: current repo, `C:\dev\ts-klip-project-frontend-v2`
- API docs: `https://api.klip.app.br/openapi/v1.json`
- API summary: read `references/api-contract.md`

Do not print `.env` values. Mention only variable names such as `VITE_API_BASE_URL`, `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, and `VITE_AUTH0_AUDIENCE`.

## Workflow

1. Confirm both repos exist and inspect only the files needed for the requested map.
2. Run `scripts/fetch-openapi.ps1` when the current API contract matters.
3. Run `scripts/inventory-legacy.ps1` to collect routes, providers, API calls, exported modules, and v2 shell entry points.
4. Compare legacy features against OpenAPI support and the v2 shell.
5. Produce a migration matrix with these columns: `feature`, `legacy source`, `API support`, `v2 destination`, `status`, `notes`.

## Classification

- `Supported`: API endpoint and DTO support the feature directly.
- `Partial`: API supports the core data but not every v2 UI affordance.
- `Em desenvolvimento`: feature appears in the v2 shell or old UI but has no API support.
- `Local-only`: feature is a UI preference, theme, layout, or client storage behavior that should remain local.

## Required Feature Coverage

Always check these areas unless the user asks for a narrower slice:

- Auth0 login, token injection, logout on auth failures, bootstrap loading.
- Task CRUD, completion, due date, notes, subtasks via `parentTaskId`.
- Project CRUD and project color/description.
- Task/project assignment through `ProjectsTasks`.
- Custom field definitions, universal/project scope, project assignment, and custom field values.
- Calendar/month/week views and any route-level behavior.
- URL route parity for `/tasks`, `/projects`, `/projects/:projectId`, `/calendar`, `/settings/user`, and `/settings/fields`.
- Table filters, sorting, column/search preferences, hierarchy display, and local storage.
- V2-only UI features such as advanced status, priority, assignee, API tokens, integrations, and LLM settings.

## Output Rules

- Prefer a compact table plus short implementation notes.
- Call out exact files only where they disambiguate the migration.
- If OpenAPI and legacy code disagree, label the disagreement and prefer OpenAPI for implementable API behavior.
- Do not propose copying legacy screens over the v2 layout; the v2 `App.tsx` and `MobileApp.tsx` shell is the visual baseline.
