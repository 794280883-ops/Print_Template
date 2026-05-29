# Deployment

Local Docker startup:

```bash
cp .env.example .env
docker compose up -d --build
```

Default URLs:

```text
Frontend: http://127.0.0.1:8080
Health:   http://127.0.0.1:8080/api/v1/health
MySQL:    127.0.0.1:3306
```

Manual backend startup:

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Manual frontend startup:

```bash
cd frontend
npm install
npm run dev
```

Production notes:

- Replace all `.env` secrets before deployment.
- Put TLS termination in front of Nginx or extend `nginx/default.conf` with certificates.
- Run `npm run migrate` before switching traffic to a new database.
- Add real authentication before exposing write APIs publicly.
- Configure MySQL backups outside the application container.
