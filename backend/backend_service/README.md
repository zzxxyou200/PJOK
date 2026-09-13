# demo-service

Starter Spring Boot microservice: REST API + JWT-based login + JPA, ready to extend.

## Stack / Dependencies

- Spring Boot 3.3 (Java 17)
- Spring Web — REST controllers
- Spring Security — auth, password hashing (BCrypt)
- Spring Data JPA — H2 by default (Postgres/Oracle configs included, commented out)
- jjwt — JWT generation/validation
- springdoc-openapi — Swagger UI at `/swagger-ui.html`
- Spring Boot Actuator — `/actuator/health`
- Lombok — less boilerplate

## Run

```bash
mvn spring-boot:run
```

App starts on `http://localhost:8080`. H2 console: `http://localhost:8080/h2-console`
(JDBC URL `jdbc:h2:mem:demodb`, user `sa`, empty password).

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

## Switching database

Edit `src/main/resources/application.yml`:
- Postgres block is included, commented out (uncomment + set credentials)
- Oracle block is included, commented out — also uncomment the `ojdbc11` dependency in `pom.xml`

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