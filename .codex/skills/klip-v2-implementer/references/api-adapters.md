# Klip API Adapter Rules

## Environment

Use these variable names without exposing values:

- `VITE_API_BASE_URL`
- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE`
- Optional compatibility fallback: `VITE_API_AUTH0_AUDIENCE`

## Task Mapping

API task fields:

- `title` maps to the task title.
- `notes` maps to v2 description/notes.
- `dueDate` maps to due date; normalize to `YYYY-MM-DD` for date inputs and ISO/date-time for API writes if required.
- `isCompleted` maps to completion.
- `parentTaskId` maps to subtasks.

V2 status mapping:

- `isCompleted: true` -> `done`.
- `isCompleted: false` -> `todo`.
- `in_progress`, `review`, and `cancelled` have no API persistence and must be `Em desenvolvimento` or disabled.

V2 fields with no task API support:

- `priority`
- `assignee`
- advanced status history or workflow state

## Project Mapping

API supports `name`, `description`, and `color`. Use project IDs from API responses. Do not synthesize IDs except in tests or temporary UI placeholders clearly marked non-persistent.

Task/project assignment is not a field on the task DTO. Use `ProjectsTasks/assign` and `ProjectsTasks/unassign`; fetch project-specific tasks through `ProjectsTasks/project/{projectId}/tasks` or `tasks-with-custom-fields`.

## Custom Field Mapping

API field definition types are strings. Preserve known values:

- `text` -> text input.
- `number` -> numeric input and `valueNumber`.
- `date` -> date input and `valueText` unless the API contract adds a date-specific field.
- `boolean` -> checkbox and `valueText` unless the API contract adds a boolean-specific field.
- `enum` -> select input using comma-separated `options`.

Normalize `options` from string to array for UI. Convert array back to comma-separated string for API writes.

For custom field reads, resolve values by ID first, then by name, then by normalized name. Legacy API responses may use inconsistent keys.

## Response Handling

Most API endpoints return `ResponseModel<T>` with `data`, `message`, `status`, and `timestamp`. Treat `status === false` as an API failure. On 401, route through the Auth0 logout/relogin behavior instead of silently clearing local state.
