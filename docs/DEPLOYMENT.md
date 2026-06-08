# Deployment

## Recommended workflow

Use this flow for normal changes:

```text
Local hot reload check -> local Docker check -> Git commit/push -> server deploy
```

This avoids deploying to the server for every UI/API adjustment.

## Local hot reload development

Local development uses the existing MySQL service that you manually start in Docker Desktop. It does not pull or start a new MySQL image.

Create a local environment file once:

```bash
cp .env.example .env
```

Start the local development stack:

```bash
./scripts/dev-local.sh
```

Default URLs:

```text
Frontend: http://127.0.0.1:5173
Backend:  http://127.0.0.1:3001
Health:   http://127.0.0.1:3001/api/v1/health
MySQL:    127.0.0.1:3306
```

Notes:

- Frontend changes hot reload through Vite.
- Backend changes restart through `node --watch`.
- Frontend `/api` requests are proxied to `http://127.0.0.1:3001` by `frontend/vite.config.js`.
- MySQL must already be running on `127.0.0.1:3306`.
- DataGrip is used to inspect the database; it does not start MySQL.
- More details: `docs/LOCAL_DEVELOPMENT.md`.

## Pre-push check

Run this before committing or pushing:

```bash
./scripts/check-before-push.sh
```

The script checks:

- Backend JavaScript syntax
- Frontend production build
- Common secret patterns in staged and unstaged diffs
- Accidental tracked env files

## Local Docker startup

Use this before server deployment when you want to verify the production-like Docker stack locally:

```bash
cp .env.example .env
docker compose --env-file .env up -d --build
```

Default URLs:

```text
Frontend: http://127.0.0.1:8080
Health:   http://127.0.0.1:8080/api/v1/health
MySQL:    127.0.0.1:3306
```

## Manual backend startup

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

## Manual frontend startup

```bash
cd frontend
npm install
npm run dev
```

## Server deployment

After local verification and Git push:

```bash
./scripts/deploy-server.sh
```

Defaults:

```text
SERVER_HOST=47.113.118.74
SERVER_USER=root
SERVER_DIR=/opt/wms-print-template-center
SSH_KEY=/tmp/wms_deploy_key
BRANCH=main
```

Override example:

```bash
SSH_KEY=~/.ssh/wms_deploy_key ./scripts/deploy-server.sh
```

Server validation URLs:

```text
http://47.113.118.74
http://47.113.118.74/api/v1/health
```

`customprint.icu` currently requires ICP filing before it can be used normally on the Aliyun mainland server.

## Production notes

- Replace all `.env` secrets before deployment.
- Put TLS termination in front of Nginx or extend `nginx/default.conf` with certificates.
- Run `npm run migrate` before switching traffic to a new database.
- Add real authentication before exposing write APIs publicly.
- Configure MySQL backups outside the application container.
