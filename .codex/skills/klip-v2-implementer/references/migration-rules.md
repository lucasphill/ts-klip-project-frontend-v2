# Klip V2 Migration Rules

## Layout Baseline

The current v2 shell in `src\App.tsx` and `src\MobileApp.tsx` is the visual baseline. Implementers may extract modules from these files, but must not replace the experience with copied legacy screens.

Target modularization:

- Domain/API types in `src/types`.
- HTTP clients and endpoint wrappers in `src/services`.
- API-to-UI transforms in `src/lib` or `src/adapters`.
- Shared state/actions in `src/contexts` or focused hooks.
- Desktop/mobile presentational pieces in `src/components` and page-level views only after shared data flow exists.

## Migration Order

1. Add dependency parity needed for real data: Auth0, Axios, routing if routes are preserved, and notifications.
2. Port Auth0 provider and API token injection. Standardize on `VITE_AUTH0_AUDIENCE`, with optional fallback to `VITE_API_AUTH0_AUDIENCE` only for compatibility.
3. Add API services matching OpenAPI.
4. Add providers for projects, tasks, and custom field definitions.
5. Replace v2 mock data with provider data and domain actions.
6. Wire desktop task/project/custom field flows.
7. Wire mobile task/project/custom field flows using the same actions.
8. Revisit calendar/settings after core CRUD works.

## Feature Parity

Keep these functional:

- Task create, edit, delete, complete/uncomplete, due date, notes, subtasks.
- Project create, edit, delete, color, description.
- Assign/unassign tasks to projects.
- Universal and project custom fields.
- Custom field value editing from task tables/details.
- Calendar/task date views where supported by task due dates.
- Loading, theme, search/filter/sort preferences when they are local UI state.

Mark these as `Em desenvolvimento` unless the API contract changes:

- Advanced statuses beyond completed/pending.
- Priority.
- Assignee/responsible user.
- API token management.
- GitHub/Google integrations.
- LLM configuration persistence.

## Quality Rules

- Keep data normalization out of JSX.
- Avoid duplicate desktop/mobile business logic.
- Prefer small providers/hooks over a monolithic app data context once real API calls are introduced.
- Preserve optimistic updates only when rollback is implemented.
- Use explicit error messages and keep failed API states recoverable.
- Run `npm run lint` and `npm run build` after changes.
