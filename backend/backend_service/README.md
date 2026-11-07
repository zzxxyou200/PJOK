# demo-service

Starter Spring Boot microservice: REST API + JWT-based login + JPA, ready to extend.

## Stack / Dependencies

- Spring Boot 3.3 (Java 17)
- Spring Web — REST controllers
- Spring Security — auth, password hashing (BCrypt)
- Spring Data JPA — local MySQL by default; PostgreSQL is supported for Neon
- jjwt — JWT generation/validation
- springdoc-openapi — Swagger UI at `/swagger-ui.html`
- Spring Boot Actuator — `/actuator/health`
- Lombok — less boilerplate

## Run

```bash
mvn spring-boot:run
```

Start local MySQL from the repository root with `docker compose up -d mysql`,
then run the backend from this directory. The app starts on
`http://localhost:8080`.

## Try it

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"pp","password":"password123"}'

# Login -> returns accessToken + refreshToken
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pp","password":"password123"}'

# Call protected endpoint
curl http://localhost:8080/api/users/me \
  -H "Authorization: Bearer <accessToken>"
```

## Neon PostgreSQL demo database

The app supports local MySQL and PostgreSQL. To use Neon, create a Neon project,
open its SQL Editor, and run `src/main/resources/db/neon-demo-seed.sql` to create
the PostgreSQL tables and insert the demo data. The seed script is safe to rerun:
it leaves rows that conflict with existing primary or unique keys unchanged.
Use a dedicated demo database; the script includes demo accounts and sample
purchase history.

Configure these environment variables for the backend (for example, in Render):

- `DB_URL`: `jdbc:postgresql://<neon-host>/<database>?sslmode=require`
- `DB_USERNAME`: the Neon database role
- `DB_PASSWORD`: the Neon database password
- `JWT_SECRET`: a private random secret of at least 256 bits

Keep the database credentials and `JWT_SECRET` on the backend; do not put them in
the React frontend. The default local `DB_URL` continues to use MySQL from
`docker-compose.yml`.

## Deploy the Java backend to Railway

1. Push this repository to GitHub and create a Railway project with **Deploy
   from GitHub repo**.
2. In the backend service's **Settings**, set **Root Directory** to
   `/backend/backend_service`. Railway will build the existing `Dockerfile`
   with Java 17 and Maven.
3. Before deploying, run `src/main/resources/db/neon-demo-seed.sql` in the
   Neon SQL Editor if the demo tables and data are not already present.
4. In the Railway service's **Variables**, add:
   - `DB_URL`: Neon JDBC URL, for example
     `jdbc:postgresql://<neon-host>/neondb?sslmode=require&channel_binding=require`
   - `DB_USERNAME`: Neon database role
   - `DB_PASSWORD`: Neon database password (set it in Railway; never commit it)
   - `JWT_SECRET`: a private random secret of at least 256 bits
   - `CORS_ALLOWED_ORIGINS`: the deployed frontend origin, such as
     `https://<your-site>.pages.dev` (no trailing slash). Multiple origins can
     be comma-separated.
5. Deploy the service, then use **Settings → Networking → Generate Domain** to
   create its public URL. Verify `https://<railway-domain>/actuator/health`
   returns `{"status":"UP"}`.
6. Point the frontend's `REACT_APP_API_URL` to
   `https://<railway-domain>/api` and rebuild/redeploy the frontend.

Railway provides the `PORT` variable automatically; the application listens on
it. Do not expose the Neon password or JWT secret in frontend variables.

## Before deploying anywhere real

- Set `JWT_SECRET` as an environment variable (don't ship the default in `application.yml`)
- Set `ddl-auto` to `validate` and manage schema via migrations (Flyway/Liquibase) instead of `update`
- Add refresh-token rotation + a blacklist (Redis) if you need real logout/revocation
- Restrict CORS explicitly once a frontend origin is known
- Consider Spring Cloud Config / Eureka / Gateway once this needs to split into multiple services

## Project layout

```
src/main/java/com/example/demo/
  config/        Spring Security config
  controller/    REST endpoints
  dto/           Request/response payloads
  entity/        JPA entities
  exception/     Global exception handling
  repository/    Spring Data repositories
  security/      JWT filter/service, UserDetailsService
  service/       Business logic
```

## Docker

```bash
docker build -t demo-service .
docker run -p 8080:8080 -e JWT_SECRET=your-real-secret demo-service
```
Features enabled successfully — restart is required. Please restart your PC now, then:
1. Start Docker Desktop (wait until it shows "Engine running")
2. In D:\Dude\PJOK, run docker compose up -d
3. Adminer → http://localhost:6768, MySQL → localhost:6787
Ping me after the reboot and I'll verify everything and start the containers for you.