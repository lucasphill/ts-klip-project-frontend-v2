# Klip API Contract Summary

Source: `https://api.klip.app.br/openapi/v1.json`

Fetch the source again when exact current behavior matters. This summary records the endpoints and schema shape used by the migration skills.

## Endpoints

- `GET /api/health`
- `GET /api/Tasks`
- `POST /api/Tasks`
- `PUT /api/Tasks/{taskId}`
- `DELETE /api/Tasks/{taskId}`
- `GET /api/Tasks/with-universal-custom-fields`
- `GET /api/Projects`
- `POST /api/Projects`
- `PUT /api/Projects/{projectId}`
- `DELETE /api/Projects/{projectId}`
- `POST /api/ProjectsTasks/assign`
- `GET /api/ProjectsTasks/project/{projectId}/tasks`
- `GET /api/ProjectsTasks/project/{projectId}/tasks-with-custom-fields`
- `DELETE /api/ProjectsTasks/unassign`
- `GET /api/CustomFieldDefinitions`
- `POST /api/CustomFieldDefinitions`
- `PUT /api/CustomFieldDefinitions/{customFieldDefinitionId}`
- `DELETE /api/CustomFieldDefinitions/{customFieldDefinitionId}`
- `POST /api/ProjectsCustomFieldDefinitions/assign`
- `GET /api/ProjectsCustomFieldDefinitions/project/{projectId}/custom-field-definitions`
- `DELETE /api/ProjectsCustomFieldDefinitions/unassign`
- `POST /api/CustomFieldValues`
- `PUT /api/CustomFieldValues`
- `DELETE /api/CustomFieldValues/{customFieldValueId}`

## DTO Shape

- Task create/update: `title`, `notes`, `dueDate`, `isCompleted`, `parentTaskId`.
- Task read: `id`, `title`, `notes`, `dueDate`, `isCompleted`, `parentTaskId`, `createdAt`.
- Task with custom fields: task fields plus `customFields` object.
- Project create/update: `name`, `description`, `color`.
- Project read: `id`, `name`, `description`, `color`, `createdAt`.
- Custom field definition: `id`, `name`, `type`, `isUniversal`, `options`, `createdAt`.
- Custom field value write: `taskId`, `customFieldId`, `valueText`, `valueNumber`, `selectedOptionId`.

## API Support Decisions

- API supports task completion, not multi-step statuses.
- API supports subtasks through `parentTaskId`.
- API supports multiple project assignments through `ProjectsTasks`.
- API supports custom field definitions and project linkage.
- API does not expose task priority, assignee, review/cancelled states, API tokens, integrations, or LLM settings.
