# PJOK — SomeShop

Full-stack product catalog & shop where **prices are resolved per organization and per effective date range** (multi-tenant pricing). Users register, log in with JWT, and browse products filtered by category with their org's active price applied.

## Features

- **Auth** — register / login, stateless Spring Security with BCrypt, JWT access (15 min) + refresh tokens (7 days)
- **Per-org pricing** — `product_prices` are scoped by `organizationId` and an `effectiveFrom`/`effectiveTo` window; the active price is picked by date range
- **Product catalog** — product items with serial, condition, item status (AVAILABLE / RESERVED / SOLD), warranty dates, category and images
- **Category filtering** — `GET /api/products/priced?category=Electronics` (Accessories, Consumables, Electronics, Spare Parts)
- **User profile** — `GET /api/users/me` with Bearer token
- **UI** — React + Material UI, auth-aware navbar, Thai-localized labels, THB currency formatting

## Tech Stack

| Layer    | Tech |
|----------|------|
| Backend  | Java 17, Spring Boot 3.3 (Web, Security, Data JPA, Validation), springdoc-openapi, Lombok, jjwt |
| Frontend | React 19, React Router 6, MUI v9, Create React App |
| Database | MySQL 8.4 (Docker) + Adminer; H2/PostgreSQL/Oracle configs available |
| Tooling  | Maven, Docker Compose, `.env` via spring-dotenv |

## Project Structure

```
├── backend/backend_service/    # Spring Boot REST API (port 8080)
├── frontend/partnership/       # React app (port 3000)
└── docker-compose.yml          # MySQL 8.4 (6787) + Adminer (6768)
```

> `docker-compose.yml` only provisions the database and Adminer — the app runs outside the containers.

## Getting Started

### Prerequisites

- JDK 17+, Maven (or use the Maven wrapper in your IDE)
- Node.js 18+
- Docker + Docker Compose

### 1. Start the database

```bash
docker compose up -d
```

- MySQL: `localhost:6787`, database `Cust_detail`, user `admin` / password `123`
- Adminer UI: http://localhost:6768 (System: MySQL, Server: `mysql`, User: `admin`)

### 2. Run the backend

```bash
cd backend/backend_service
cp .env.example .env          # adjust if needed
mvn spring-boot:run
```

API base: http://localhost:8080/api · Swagger UI: http://localhost:8080/swagger-ui.html · Health: http://localhost:8080/actuator/health

### 3. Run the frontend

```bash
cd frontend/partnership
cp .env.example .env          # REACT_APP_API_URL=http://localhost:8080/api
npm install
npm start
```

App: http://localhost:3000

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Returns `accessToken` + `refreshToken` |
| GET  | `/api/users/me` | Bearer | Current user profile |
| GET  | `/api/users` | Bearer | List users |
| GET  | `/api/products` | Bearer | All products with org price |
| GET  | `/api/products/priced?category=` | Bearer | Category-filtered priced products |

Example:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"secret"}'
```

## Frontend Routes

`/` Home · `/login` · `/register` · `/products` · `/cart` · `/purchase-history` · `/profile`

## Configuration

Backend environment variables (see `backend/backend_service/.env.example`):

| Variable | Default |
|----------|---------|
| `DB_URL` | `jdbc:mysql://localhost:6787/Cust_detail` |
| `DB_USERNAME` / `DB_PASSWORD` | `admin` / `123` |
| `JWT_SECRET` | dev default — **set your own (≥ 256 bits) in production** |
| `JWT_ACCESS_EXPIRATION_MS` | `900000` (15 min) |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` (7 days) |

Frontend: `REACT_APP_API_URL` (see `frontend/partnership/.env.example`).

## Security Notes

Change these before deploying: `JWT_SECRET`, database credentials, CORS origins (`SecurityConfig.java`), and `spring.jpa.hibernate.ddl-auto` (currently `update`).

## License

No license file yet — add one before publishing for reuse.
