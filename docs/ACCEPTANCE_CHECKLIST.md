# Acceptance Checklist

Frontend:

- Template list loads from `/api/v1/templates`.
- Field dictionary loads from `/api/v1/template/fields/:templateType`.
- Print logs load from `/api/v1/print/logs`.
- Create, save draft, publish, disable, copy, import, export, AI draft generation, and print submit use API calls.
- Loading, empty, and backend error states are visible.

Backend:

- `GET /api/v1/health` returns `{ code, message, data }`.
- `npm run migrate` creates all six tables.
- Seed templates and field dictionaries exist after migration.
- Publish API rejects invalid DSL.
- Print submit writes `print_log`.
- Operation actions write `operation_log`.

Docker:

- `docker compose config` passes.
- `docker compose up -d --build` starts MySQL, backend, frontend, and Nginx when Docker daemon is running.
- `http://127.0.0.1:8080/api/v1/health` is reachable.

Tests:

- `npm test` passes in `backend`.
- `RUN_DB_TESTS=1 npm test` runs the publish integration test after MySQL migration.
