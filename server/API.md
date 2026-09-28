# API Documentation

> **Base URL:** `https://wavearena.vercel.app` (or your deployed URL)
> **Framework:** Express.js v5.2.1
> **Database:** MongoDB (Mongoose)
> **Authentication:** JWT (HTTP-only cookie, 7-day expiry)
> **Content-Type:** `application/json`

---

## Table of Contents

- [Global Information](#global-information)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#1-health-check)
  - [Register User](#2-register-user)
  - [Login User](#3-login-user)
  - [Logout User](#4-logout-user)
  - [Change Password](#5-change-password)
- [Test Cases for Testers](#test-cases-for-testers)
- [TestSprite Integration Notes](#testsprite-integration-notes)

---

## Global Information

### CORS
- **Origin:** Configured via `APP_ORIGIN` environment variable
- **Credentials:** Enabled (cookies are sent cross-origin)

### Global Middleware (Applied to ALL routes)
| Middleware | Purpose |
|------------|---------|
| `cors()` | Cross-origin resource sharing |
| `express.json()` | Parse JSON request bodies |
| `express.urlencoded({ extended: true })` | Parse URL-encoded bodies |
| `cookieParser()` | Parse cookies |

### Authentication Middleware (`verifyJWT`)
- **Applied to:** Logout, Change Password
- **Token Source:** `accessToken` cookie OR `Authorization: Bearer <token>` header
- **Token Expiry:** 7 days
- **Behavior:** Extracts JWT → Verifies with `ACCESS_TOKEN_SECRET` → Looks up user → Injects `req.user` into request

---

## Endpoints

### 1. Health Check

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/health` |
| **Auth Required** | No |
| **Rate Limited** | No |

#### Request
No body required.

#### Response

**200 OK**
```json
{
  "status": "ok",
  "message": "Server up and running..."
}
```

---

### 2. Register User

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/register` |
| **Auth Required** | No |
| **Content-Type** | `application/json` |

#### Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `firstName` | string | Yes | 3-10 characters |
| `lastName` | string | No | 3-10 characters |
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | 8-20 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character |

#### Request Example
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "MyP@ssw0rd"
}
```

#### Response

**201 Created**
```json
{
  "success": true,
  "message": "user created successfully"
}
```
> Also sets an `accessToken` HTTP-only cookie.

**400 Bad Request** — Missing or invalid fields
```json
{
  "success": false,
  "message": "firstName is required"
}
```

**409 Conflict** — Email already exists
```json
{
  "success": false,
  "message": "email already exists"
}
```

**503 Service Unavailable** — Failed to create user
```json
{
  "success": false,
  "message": "failed to create user"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "internal server error"
}
```

---

### 3. Login User

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/login` |
| **Auth Required** | No |
| **Content-Type** | `application/json` |

#### Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userName` | string | One of userName/email | 5-20 characters |
| `email` | string | One of userName/email | Valid email format |
| `password` | string | Yes | Min 1 character |

> **Note:** Must provide either `userName` OR `email` (at least one).

#### Request Example (with email)
```json
{
  "email": "john.doe@example.com",
  "password": "MyP@ssw0rd"
}
```

#### Request Example (with userName)
```json
{
  "userName": "johndoe",
  "password": "MyP@ssw0rd"
}
```

#### Response

**200 OK**
```json
{
  "success": true,
  "message": "login successfully"
}
```
> Also sets an `accessToken` HTTP-only cookie.

**400 Bad Request** — Missing credentials
```json
{
  "success": false,
  "message": "email or userName is required"
}
```

**400 Bad Request** — Invalid credentials
```json
{
  "success": false,
  "message": "invalid credentials"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "internal server error"
}
```

---

### 4. Logout User

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/logout` |
| **Auth Required** | Yes (JWT) |
| **Content-Type** | `application/json` |

#### Request
No body required. Requires valid JWT token.

#### Response

**200 OK**
```json
{
  "success": true,
  "message": "Logout successfully"
}
```
> Clears the `accessToken` cookie.

**401 Unauthorized** — No token provided
```json
{
  "success": false,
  "message": "unauthorized"
}
```

**503 Service Unavailable** — Server error
```json
{
  "success": false,
  "message": "failed to logout"
}
```

---

### 5. Change Password

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/change-password` |
| **Auth Required** | Yes (JWT) |
| **Content-Type** | `application/json` |

#### Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `oldPassword` | string | Yes | Must match current password |
| `newPassword` | string | Yes | Must be different from old password |

#### Request Example
```json
{
  "oldPassword": "MyP@ssw0rd",
  "newPassword": "NewP@ssw0rd"
}
```

#### Response

**200 OK**
```json
{
  "success": true,
  "message": "password changed"
}
```

**400 Bad Request** — Missing fields
```json
{
  "success": false,
  "message": "oldPassword and newPassword are required"
}
```

**401 Unauthorized** — Wrong old password or user not found
```json
{
  "success": false,
  "message": "invalid credentials"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "internal server error"
}
```

---

## Test Cases for Testers

### Health Check Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| HC-01 | Server is running | Send `GET /health` | `200` with `{ status: "ok" }` |
| HC-02 | Health check without auth | Send `GET /health` without any token | `200` (should work without auth) |

### Register User Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| REG-01 | Register with valid data | Send `POST /api/v1/auth/register` with all valid fields | `201` with success message |
| REG-02 | Register without firstName | Omit `firstName` field | `400` with validation error |
| REG-03 | Register with short firstName | `firstName: "Jo"` (2 chars) | `400` with validation error |
| REG-04 | Register with long firstName | `firstName: "JohnJohnJohn"` (14 chars) | `400` with validation error |
| REG-05 | Register with invalid email | `email: "not-an-email"` | `400` with validation error |
| REG-06 | Register with short password | `password: "Ab1!"` (4 chars) | `400` with validation error |
| REG-07 | Register with password (no uppercase) | `password: "myp@ssw0rd"` | `400` with validation error |
| REG-08 | Register with password (no lowercase) | `password: "MYP@SSW0RD"` | `400` with validation error |
| REG-09 | Register with password (no number) | `password: "MyP@ssword"` | `400` with validation error |
| REG-10 | Register with password (no special char) | `password: "MyPassw0rd"` | `400` with validation error |
| REG-11 | Register with duplicate email | Register with an email that already exists | `409` with "email already exists" |
| REG-12 | Register without lastName | Omit `lastName` (optional field) | `201` (should succeed) |
| REG-13 | Register with empty body | Send `POST /api/v1/auth/register` with `{}` | `400` with validation error |
| REG-14 | Register with extra fields | Add unexpected fields | Should ignore extra fields or return `400` |

### Login User Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| LOG-01 | Login with valid email | Send `POST /api/v1/auth/login` with valid email + password | `200` with success message |
| LOG-02 | Login with valid userName | Send `POST /api/v1/auth/login` with valid userName + password | `200` with success message |
| LOG-03 | Login with wrong password | Send valid email but wrong password | `400` with "invalid credentials" |
| LOG-04 | Login with non-existent email | Send email not in database | `400` with "invalid credentials" |
| LOG-05 | Login without email or userName | Send only `password` | `400` with "email or userName is required" |
| LOG-06 | Login without password | Send email but no password | `400` with validation error |
| LOG-07 | Login with empty body | Send `POST /api/v1/auth/login` with `{}` | `400` with validation error |
| LOG-08 | Login with short userName | `userName: "john"` (4 chars) | `400` with validation error |
| LOG-09 | Login sets cookie | After successful login, check response headers | `accessToken` cookie is set (HTTP-only) |

### Logout User Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| OUT-01 | Logout with valid token | Login first, then send `POST /api/v1/auth/logout` with token | `200` with success message |
| OUT-02 | Logout without token | Send `POST /api/v1/auth/logout` without any token | `401` with "unauthorized" |
| OUT-03 | Logout with expired token | Use an expired JWT token | `401` with "unauthorized" |
| OUT-04 | Logout with malformed token | Use an invalid/garbage token | `401` with "unauthorized" |
| OUT-05 | Logout clears cookie | After logout, check response headers | `accessToken` cookie is cleared |
| OUT-06 | Access protected route after logout | After logout, try `POST /api/v1/auth/change-password` | `401` with "unauthorized" |

### Change Password Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| CP-01 | Change password with valid data | Login, then send `POST /api/v1/auth/change-password` with correct old + new password | `200` with success message |
| CP-02 | Change password without auth | Send `POST /api/v1/auth/change-password` without token | `401` with "unauthorized" |
| CP-03 | Change password with wrong old password | Send incorrect `oldPassword` | `401` with "invalid credentials" |
| CP-04 | Change password without oldPassword | Omit `oldPassword` field | `400` with validation error |
| CP-05 | Change password without newPassword | Omit `newPassword` field | `400` with validation error |
| CP-06 | Change password with same password | Send same value for old and new password | `400` or `401` (depends on implementation) |
| CP-07 | Change password with empty body | Send `POST /api/v1/auth/change-password` with `{}` | `400` with validation error |
| CP-08 | Login with new password after change | After changing password, login with new password | `200` with success message |
| CP-09 | Login with old password after change | After changing password, login with old password | `400` with "invalid credentials" |

---

## TestSprite Integration Notes

### Overview
This section provides guidance for testing the API using **TestSprite** or similar automated API testing tools.

### Base Configuration
```
Base URL: https://wavearena.vercel.app
Content-Type: application/json
```

### Authentication Flow for Testing
1. **Register** a new user via `POST /api/v1/auth/register`
2. **Login** via `POST /api/v1/auth/login` to obtain the `accessToken` cookie
3. Use the `accessToken` cookie for all authenticated requests (Logout, Change Password)
4. **Logout** via `POST /api/v1/auth/logout` to invalidate the token

### Cookie Handling
- The `accessToken` is set as an **HTTP-only cookie** upon successful registration/login
- TestSprite should be configured to **store and send cookies** automatically
- Cookie name: `accessToken`
- Cookie expiry: 7 days

### TestSprite Test Suite Structure

```
TestSprite Suite: User Authentication API
├── Health Check
│   └── GET /health → Expect 200
├── Registration Tests
│   ├── POST /api/v1/auth/register (valid) → Expect 201
│   ├── POST /api/v1/auth/register (duplicate email) → Expect 409
│   ├── POST /api/v1/auth/register (invalid data) → Expect 400
│   └── POST /api/v1/auth/register (missing fields) → Expect 400
├── Login Tests
│   ├── POST /api/v1/auth/login (valid email) → Expect 200
│   ├── POST /api/v1/auth/login (valid userName) → Expect 200
│   ├── POST /api/v1/auth/login (wrong password) → Expect 400
│   └── POST /api/v1/auth/login (missing credentials) → Expect 400
├── Authenticated Tests (require login first)
│   ├── POST /api/v1/auth/logout (with token) → Expect 200
│   ├── POST /api/v1/auth/logout (without token) → Expect 401
│   ├── POST /api/v1/auth/change-password (valid) → Expect 200
│   ├── POST /api/v1/auth/change-password (wrong old password) → Expect 401
│   └── POST /api/v1/auth/change-password (without token) → Expect 401
└── End-to-End Flow
    ├── Register → Login → Change Password → Login with new password → Logout
    └── Register → Login → Logout → Try authenticated route → Expect 401
```

### Environment Variables for Testing
| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | JWT signing secret | `your-secret-key` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/mydb` |
| `PORT` | Server port | `3000` |

### Common Response Codes
| Code | Meaning | When It Occurs |
|------|---------|----------------|
| `200` | OK | Successful login, logout, password change |
| `201` | Created | Successful registration |
| `400` | Bad Request | Missing/invalid fields, invalid credentials |
| `401` | Unauthorized | Missing/invalid/expired token, wrong password |
| `409` | Conflict | Duplicate email on registration |
| `500` | Internal Server Error | Unexpected server errors |
| `503` | Service Unavailable | Database or service issues |

---

## Quick cURL Commands for Manual Testing

### Health Check
```bash
curl -X GET https://wavearena.vercel.app/health
```

### Register
```bash
curl -X POST https://wavearena.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "MyP@ssw0rd"
  }'
```

### Login
```bash
curl -X POST https://wavearena.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "MyP@ssw0rd"
  }'
```

### Logout (with cookie)
```bash
curl -X POST https://wavearena.vercel.app/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -b "accessToken=YOUR_JWT_TOKEN"
```

### Change Password (with cookie)
```bash
curl -X POST https://wavearena.vercel.app/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -b "accessToken=YOUR_JWT_TOKEN" \
  -d '{
    "oldPassword": "MyP@ssw0rd",
    "newPassword": "NewP@ssw0rd"
  }'
```

---

*Last updated: 2026-09-28*
