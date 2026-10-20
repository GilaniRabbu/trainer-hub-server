<div align="center">

# TrainerHub API

**REST API powering the TrainerHub marketplace — authentication, service providers, platform statistics, and contact inquiries.**

[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8%2Fmongoose%208-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![JSON Web Tokens](https://img.shields.io/badge/JSON_Web_Tokens-HS256-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Built with Express, TypeScript, and Mongoose — modular by feature, JWT-secured, and deployed on Vercel.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

TrainerHub API is the backend for the **TrainerHub frontend** — a marketplace where clients discover and book service providers. It exposes a versioned REST API under `/api/v1`, stores data in MongoDB, and issues HS256 JSON Web Tokens for stateless authentication with rotating refresh tokens.

The codebase is organized **by feature module** (`Auth`, `User`, `ServiceProvider`, `Contact`), where each module owns its routes, controller, service, and (where applicable) model and validation schemas.

## Key Features

- **JWT authentication** — short-lived access tokens (Bearer) and rotating refresh tokens delivered as httpOnly cookies, with `SameSite=None; Secure` in production for cross-site clients
- **Role-based authorization** — `auth(...roles)` middleware supporting `ADMIN`, `USER`, and `SERVICE_PROVIDER`, with account status checks (blocked/deleted users are rejected)
- **Password security** — bcrypt hashing; password hashes are never returned in API responses
- **Modular architecture** — feature modules with clear route → controller → service layering and `catchAsync` error propagation
- **Centralized error handling** — one error handler that normalizes Zod errors, typed `ApiError`s, JWT errors, and Multer errors into a consistent JSON envelope
- **Expressive query APIs** — provider search, faceted filtering, category aggregation, plus reusable pagination and query-builder helpers
- **CORS allowlist** — credentials-enabled CORS restricted to the deployed frontend and local dev origins
- **Request logging** — morgan dev logging; graceful shutdown on `unhandledRejection` / `uncaughtException`

## Tech Stack

| Layer          | Choices                                    |
| -------------- | ------------------------------------------ |
| Runtime        | Node.js, Express 4                         |
| Language       | TypeScript 5 (compiled with `tsc`)         |
| Database       | MongoDB via Mongoose 8                     |
| Auth           | jsonwebtoken (HS256), bcrypt               |
| Validation     | Zod schemas + `validateRequest` middleware |
| Tooling        | ts-node-dev (dev), ESLint + Prettier       |
| Logging / HTTP | morgan, http-status                        |
| Deploy         | Vercel (`@vercel/node`, see `vercel.json`) |

## Getting Started

### Prerequisites

- **Node.js 20.9+**
- **MongoDB** — a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Installation

```bash
git clone <your-repo-url>
cd trainer-hub-server
npm install
```

> **npm 11+ note:** install scripts are blocked by default. If `bcrypt` fails at runtime with a missing `bcrypt_lib.node`, run `npm install-scripts approve bcrypt && npm rebuild bcrypt` (see [Troubleshooting](#troubleshooting)).

### Environment Variables

Create a `.env` file in the project root:

**Required**

| Variable                   | Description                                                               |
| -------------------------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`             | MongoDB connection string (database `fast-fix-db`)                        |
| `PORT`                     | Server port — defaults to `5000` if unset                                 |
| `NODE_ENV`                 | `development` or `production` (controls cookie `secure`/`sameSite` flags) |
| `ACCESS_TOKEN_SECRET`      | Secret used to sign access tokens                                         |
| `ACCESS_TOKEN_EXPIRES_IN`  | Access token lifetime (e.g. `15m`, `1d`)                                  |
| `REFRESH_TOKEN_SECRET`     | Secret used to sign refresh tokens                                        |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`)                                        |

**Optional / situational**

| Variable                                                                            | Description                                                               |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `JWT_SECRET`, `EXPIRES_IN`                                                          | Legacy/general JWT settings used by the OTP-check helper                  |
| `OTP_TOKEN_SECRET`, `OTP_TOKEN_EXPIRES_IN`                                          | OTP token signing                                                         |
| `RESET_PASS_TOKEN`, `RESET_PASS_TOKEN_EXPIRES_IN`                                   | Password-reset token signing                                              |
| `FRONTEND_URL`                                                                      | Allowed origin for cross-origin requests                                  |
| `STRIPE_*`, `CLOUDINARY_*`, `DO_SPACE_*`, `SSLCOMMERZ/STORE_*`, `EMAIL`, `APP_PASS` | Integration credentials read by `src/config` when those features are used |

> Never commit `.env` — it is git-ignored. Only non-secret values belong in the repository.

### Run the Development Server

```bash
npm run dev
```

The server connects to MongoDB and listens on your configured `PORT` (default `5000`):

```
✅ MongoDB connected
Server is running on port 5000
```

## Available Scripts

| Command         | Description                                          |
| --------------- | ---------------------------------------------------- |
| `npm run dev`   | Start with hot reload via ts-node-dev                |
| `npm run build` | Compile TypeScript to `dist/`                        |
| `npm run start` | Run the compiled production build (`dist/server.js`) |
| `npm test`      | Placeholder — no test suite is configured yet        |

## Project Structure

```
├── src/
│   ├── server.ts               # Bootstrap: DB connect, listen, process guards
│   ├── app.ts                  # Express app: CORS, parsing, routes, error handler
│   ├── config/                 # Centralized env config (+ service account keys)
│   ├── routes (app/routes/)    # /api/v1 router — mounts every module
│   ├── app/
│   │   ├── modules/
│   │   │   ├── Auth/           #   Login, token refresh (route/controller/service/validation)
│   │   │   ├── User/           #   User creation, statistics (model/interface/validation)
│   │   │   ├── ServiceProvider/ #  List/search/filter/categories (reads User collection)
│   │   │   └── Contact/        #   Contact inquiries (model/controller/service)
│   │   ├── middlewares/        #   auth (RBAC), verifyToken, globalErrorHandler, zod validate
│   │   └── db/                 #   Mongoose connection
│   ├── errors/                 #   ApiError + Zod/Prisma error mappers
│   ├── shared/                 #   catchAsync, sendResponse, pick
│   ├── helpars/                #   jwtHelpers, pagination, queryBuilder, file uploaders, email
│   ├── jobs/                   #   Scheduled cron jobs (scaffolded)
│   └── interfaces/             #   Shared TS types
├── vercel.json                 # Production build & routing config
└── tsconfig.json
```

## API Reference

**Base path:** `/api/v1` — e.g. `http://localhost:5000/api/v1` (substitute your `PORT`).

### Response envelope

Every endpoint responds with the same shape:

```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "meta": null,
  "data": { "totalServiceProviders": 10 }
}
```

Errors use `success: false` with an `errorMessages` array; `meta` carries pagination (`page`, `limit`, `total`) when applicable.

### Auth

| Method | Path                  | Access                         | Description                                                                                                                                |
| ------ | --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST` | `/auth/login`         | Public                         | Sign in with `email` + `password`; returns `accessToken`, `refreshToken`, and the user object (password excluded); sets the refresh cookie |
| `POST` | `/auth/refresh-token` | Refresh token (cookie or body) | Rotates the refresh token and returns a fresh access token                                                                                 |

### Users

| Method | Path                | Access | Description                                                             |
| ------ | ------------------- | ------ | ----------------------------------------------------------------------- |
| `POST` | `/users/create`     | Public | Register a new user (password bcrypt-hashed)                            |
| `GET`  | `/users/statistics` | Public | Platform totals: providers, customers, distinct professions & locations |

### Service providers

All provider data lives in the `User` collection (`role: "SERVICE_PROVIDER"`); password fields are always excluded.

| Method | Path                                          | Description                                                              |
| ------ | --------------------------------------------- | ------------------------------------------------------------------------ |
| `GET`  | `/service-providers`                          | List all providers                                                       |
| `GET`  | `/service-providers/:id`                      | Provider profile by id (validates ObjectId)                              |
| `GET`  | `/service-providers/search?searchTerm=`       | Case-insensitive search across name, profession, email, phone            |
| `GET`  | `/service-providers/filter`                   | Filter by `profession`, `location` (repeatable), `experienceYears` (min) |
| `GET`  | `/service-providers/categories`               | Aggregated categories as `{ name, total }[]`                             |
| `GET`  | `/service-providers/categories/:categoryName` | Providers in one category (case-insensitive exact match)                 |

### Contacts

| Method | Path               | Access | Description                      |
| ------ | ------------------ | ------ | -------------------------------- |
| `POST` | `/contacts/create` | Public | Submit a contact/booking inquiry |

## Authentication

Access tokens are sent as a Bearer header; the refresh token travels in an **httpOnly cookie** (set at login) with a **body fallback** for clients that block cross-site cookies.

```bash
# 1. Sign in — captures the refresh cookie and returns an access token
curl -i -c cookies.txt -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'

# 2. Use the access token
curl http://localhost:5000/api/v1/users/statistics \
  -H "Authorization: Bearer <accessToken>"

# 3. Rotate tokens when the access token expires
curl -i -b cookies.txt -X POST http://localhost:5000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json"
```

To protect a route, apply the existing middleware with optional role scoping:

```ts
import auth from '../middlewares/auth';

router.get('/private', auth('ADMIN', 'SUPER_ADMIN'), controller.handler);
// req.user is populated with the authenticated Mongoose user document
```

The middleware rejects missing/invalid/expired tokens (`401`) and forbidden roles (`403`), and re-reads the user from the database on every request so blocked or deleted accounts lose access immediately.

## Error Handling

All errors flow through `src/app/middlewares/globalErrorHandler.ts`, which maps:

| Error type              | Status         |
| ----------------------- | -------------- |
| Zod validation          | `400`          |
| `ApiError` (custom)     | its own status |
| JWT expired / invalid   | `401`          |
| Multer (file size/type) | `400`          |
| Unknown                 | `500`          |

Handlers are wrapped with `catchAsync`, so async failures reach the error handler without `try/catch` boilerplate. Responses include a stack trace only when `NODE_ENV !== 'production'`.

## Deployment

The API builds to `dist/` and is served by Vercel as configured in `vercel.json` (`@vercel/node` → `dist/server.js`, with CORS headers applied at the edge).

1. Set every **Required** environment variable in your Vercel project (use your Atlas `DATABASE_URL`)
2. Build command: `npm run build`
3. Deploy — the frontend's `NEXT_PUBLIC_BASEURL` should point at `https://<your-deployment>/api/v1`

For other platforms, `npm run build && npm start` runs the same compiled server anywhere Node runs.

## Troubleshooting

**`Cannot find module '.../bcrypt/lib/binding/.../bcrypt_lib.node'`**
npm 11+ blocks dependency install scripts by default. Approve and rebuild bcrypt:

```bash
npm install-scripts approve bcrypt
npm rebuild bcrypt
```

**`Please define the MONGODB_URI environment variable`**
`DATABASE_URL` is missing from `.env`.

**Refresh requests return `401`**
The refresh cookie was not sent (cross-site context without `NODE_ENV=production`, or cookies disabled) — the client can send the refresh token in the request body instead; both are accepted.

## License

[ISC](https://opensource.org/licenses/ISC) © Gilani Rabbu
