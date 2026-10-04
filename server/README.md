# Wave Arena — Auth Server

A production-ready authentication API built with **Node.js**, **Express**, and **TypeScript**. It provides user registration, login, OTP-based email verification, profile management, and JWT-based session handling — everything a frontend team needs to integrate authentication into a web or mobile app.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#1-health-check)
  - [Register User](#2-register-user)
  - [Login User](#3-login-user)
  - [Logout User](#4-logout-user)
  - [Change Password](#5-change-password)
  - [Change Profile Picture](#6-change-profile-picture)
  - [Get Current User](#7-get-current-user)
  - [Verify OTP](#8-verify-otp)
  - [Resend OTP](#9-resend-otp)
- [Error Handling](#error-handling)
- [Response Format](#response-format)
- [Frontend Integration Guide](#frontend-integration-guide)
  - [Setting Up an API Client](#setting-up-an-api-client)
  - [Handling Auth Tokens](#handling-auth-tokens)
  - [Complete Auth Flow Example](#complete-auth-flow-example)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [License](#license)

---

## Features

- **User Registration** — Sign up with first name, last name, username, email, and password
- **Email Verification** — OTP-based verification sent via email (6-digit code, 10-minute expiry)
- **User Login** — Authenticate with username *or* email + password
- **JWT Sessions** — Secure, HTTP-only cookie-based authentication with Bearer token fallback
- **Password Management** — Change password with current password verification
- **Profile Picture Upload** — Avatar upload via Cloudinary (jpg, jpeg, png, webp — max 2 MB)
- **Resend OTP** — Request a new verification code if the original expires
- **Input Validation** — Server-side validation on all inputs with descriptive error messages
- **CORS Enabled** — Configured for cross-origin requests with credentials

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ESM) |
| Language | TypeScript |
| Framework | Express.js v5 |
| Database | MongoDB (via Mongoose) |
| Cache / OTP Store | Redis |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File Upload | express-fileupload |
| Image Storage | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Validation | Zod |
| Dev Runner | tsx (watch mode) |

---

## Getting Started

### Prerequisites

- **Node.js** v18+ installed
- **MongoDB** instance (local or Atlas)
- **Redis** instance (local or Upstash/Redis Cloud)
- **Cloudinary** account (for image uploads)
- **Gmail** account with an App Password (for sending OTP emails)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd server

# Install dependencies
npm install

# Copy the sample environment file
cp .env.sample .env
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=5000
APP_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>

# Redis (OTP storage)
REDIS_USERNAME=default
REDIS_PASSWORD=<your-redis-password>
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379

# JWT
ACCESS_TOKEN_SECRET=<your-super-secret-key>
ACCESS_TOKEN_EXPIRY=1d

# Email (Gmail SMTP)
SMTP_USER=<your-email@gmail.com>
SMTP_PASS=<your-gmail-app-password>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### Running the Server

```bash
# Development (with hot-reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

The server will start on `http://localhost:5000` (or your configured `PORT`).

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/v1/auth/register` | No | Register a new user |
| `POST` | `/api/v1/auth/login` | No | Log in a user |
| `POST` | `/api/v1/auth/logout` | Yes | Log out current user |
| `POST` | `/api/v1/auth/change-password` | Yes | Change account password |
| `POST` | `/api/v1/auth/change-profile-picture` | Yes | Upload a new avatar |
| `GET` | `/api/v1/auth/me` | Yes | Get current user profile |
| `POST` | `/api/v1/auth/verify-user` | No | Verify email with OTP |
| `POST` | `/api/v1/auth/resend-otp` | No | Resend OTP email |

---

## Authentication

This API uses **JSON Web Tokens (JWT)** for authentication. The token is delivered to the client in two ways:

1. **HTTP-only cookie** (`accessToken`) — set automatically on login/register
2. **Authorization header** — `Authorization: Bearer <token>` as a fallback

### Token Payload

```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "email": "john.doe@example.com",
  "userName": "johndoe"
}
```

### Cookie Configuration

| Property | Value |
|----------|-------|
| `httpOnly` | `true` |
| `secure` | `true` in production |
| `sameSite` | `lax` |
| `maxAge` | 7 days |
| `path` | `/` |

### Protecting Routes

To access protected endpoints, include the token in one of these ways:

```http
# Option 1: Cookie (automatic in browsers)
Cookie: accessToken=<your-jwt-token>

# Option 2: Authorization header
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Health Check

Verify the server is running.

```http
GET /health
```

**Response — 200 OK**

```json
{
  "status": "ok",
  "message": "Server up and running..."
}
```

---

### 2. Register User

Create a new account. An OTP verification email is sent automatically upon success.

```http
POST /api/v1/auth/register
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `firstName` | string | Yes | 3–20 chars, letters/spaces/hyphens/apostrophes only |
| `lastName` | string | Yes | 3–20 chars (same pattern as firstName) |
| `userName` | string | Yes | 5–20 chars, lowercase, `[a-z0-9_.]` only, must be unique |
| `email` | string | Yes | Valid email, max 254 chars, must be unique |
| `password` | string | Yes | 8–20 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char, no spaces |

#### Sample Request

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "userName": "johndoe",
  "email": "john.doe@example.com",
  "password": "MyP@ssw0rd"
}
```

#### Response — 201 Created

```json
{
  "success": true,
  "message": "user created successfully"
}
```

> **Note:** The `accessToken` cookie is set automatically. The user must verify their email via OTP before they can log in.

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing/empty fields | `{ "success": false, "message": "Required fields cannot be empty" }` |
| 400 | Email send failed | `{ "success": false, "message": "Failed to send verification email" }` |
| 409 | Email already exists | `{ "success": false, "message": "Another user with this email already exists" }` |
| 503 | Database error | `{ "success": false, "message": "Failed to create user, Try again later" }` |
| 500 | Server error | `{ "success": false, "message": "internal server error, Please try again later" }` |

---

### 3. Login User

Authenticate with a username or email and password.

```http
POST /api/v1/auth/login
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userName` | string | One of userName/email | 5–20 chars, `[a-z0-9_.]` |
| `email` | string | One of userName/email | Valid email format |
| `password` | string | Yes | Min 1 character |

> You must provide **either** `userName` **or** `email` — at least one is required.

#### Sample Request

```json
{
  "email": "john.doe@example.com",
  "password": "MyP@ssw0rd"
}
```

#### Response — 200 OK

```json
{
  "success": true,
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "firstName": "John",
    "lastName": "Doe",
    "userName": "johndoe",
    "email": "john.doe@example.com",
    "avatar": {
      "url": null,
      "publicId": null
    },
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "login successfully"
}
```

> **Note:** The `accessToken` cookie is set automatically. The `password` field is never returned.

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing credentials | `{ "success": false, "message": "Username/email and password are required" }` |
| 400 | Invalid credentials | `{ "success": false, "message": "invalid credentials" }` |
| 401 | Account not verified | `{ "success": false, "message": "Please verify your account before login" }` |
| 500 | Server error | `{ "success": false, "message": "internal server error, Please try again later" }` |

---

### 4. Logout User

Invalidate the current session by clearing the auth cookie.

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

#### Request Body

No body required.

#### Response — 200 OK

```json
{
  "success": true,
  "message": "Logout successfully"
}
```

> The `accessToken` cookie is cleared from the response.

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| 401 | No token provided | `{ "status": false, "message": "Unauthorized" }` |
| 503 | Server error | `{ "success": false, "message": "Internal server error, Please try gain later" }` |

---

### 5. Change Password

Update the account password. Requires the current password for verification.

```http
POST /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `currentPassword` | string | Yes | Must match the current password |
| `newPassword` | string | Yes | Must be different from current password |

#### Sample Request

```json
{
  "currentPassword": "MyP@ssw0rd",
  "newPassword": "NewP@ssw0rd"
}
```

#### Response — 200 OK

```json
{
  "success": true,
  "message": "password changed"
}
```

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing fields | `{ "success": false, "message": "Provide required fields" }` |
| 401 | Wrong password / user not found | `{ "success": false, "message": "unauthorized" }` |
| 500 | Server error | `{ "success": false, "message": "internal server error, Try again later" }` |

---

### 6. Change Profile Picture

Upload a new avatar image. The old image on Cloudinary is deleted automatically.

```http
POST /api/v1/auth/change-profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Request Body (form-data)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `profilePicture` | File | Yes | Single file, jpg/jpeg/png/webp only, max 2 MB |

#### Sample Request (cURL)

```bash
curl -X POST http://localhost:5000/api/v1/auth/change-profile-picture \
  -H "Authorization: Bearer <token>" \
  -F "profilePicture=@/path/to/avatar.jpg"
```

#### Response — 200 OK

```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "avatar": {
    "url": "https://res.cloudinary.com/<cloud>/image/upload/v1234567890/avatar/abc123.jpg",
    "publicId": "avatar/abc123"
  }
}
```

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | No file uploaded | `{ "success": false, "message": "No files were uploaded." }` |
| 400 | Multiple files | `{ "success": false, "message": "upload only a single image under 5 MB" }` |
| 400 | Invalid file type | `{ "success": false, "message": "Invalid file type. Only jpg, jpeg, png, and webp are allowed." }` |
| 404 | User not found | `{ "success": false, "message": "User not found." }` |
| 500 | Upload failed | `{ "success": false, "message": "Failed to upload image. Please try again." }` |
| 500 | Server error | `{ "success": false, "message": "Internal server error. Please try again later." }` |

---

### 7. Get Current User

Retrieve the authenticated user's full profile.

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

#### Request Body

No body required.

#### Response — 200 OK

```json
{
  "success": true,
  "message": "user fetched successfully",
  "currentUser": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "firstName": "John",
    "lastName": "Doe",
    "userName": "johndoe",
    "email": "john.doe@example.com",
    "password": "$2b$10$...",
    "avatar": {
      "url": "https://res.cloudinary.com/<cloud>/image/upload/v1234567890/avatar/abc123.jpg",
      "publicId": "avatar/abc123"
    },
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Invalid token / user not found | `{ "success": false, "message": "Invalid token, Please login again." }` |
| 500 | Server error | `{ "success": false, "message": "Failed to fetch user details" }` |

---

### 8. Verify OTP

Verify the email address using the 6-digit OTP sent during registration.

```http
POST /api/v1/auth/verify-user
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `otp` | string | Yes | 6-digit code sent to email |
| `email` | string | Yes | Must match registered email |

#### Sample Request

```json
{
  "otp": "123456",
  "email": "john.doe@example.com"
}
```

#### Response — 200 OK

```json
{
  "success": true,
  "message": "otp verified"
}
```

> Sets `isVerified = true` on the user document. The user can now log in.

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing OTP | `{ "success": false, "message": "Please provide an otp to verify" }` |
| 400 | User not found | `{ "success": false, "message": "could not found the user" }` |
| 400 | Wrong OTP | `{ "success": false, "message": "invalid otp" }` |
| 503 | Redis unavailable / OTP expired | `{ "success": false, "message": "service unavilable, Please try again laeter" }` |
| 500 | Server error | `{ "success": false, "message": "Internal server error, Try again later" }` |

---

### 9. Resend OTP

Request a new OTP code. The previous code (if any) is invalidated.

```http
POST /api/v1/auth/resend-otp
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address |
| `firstName` | string | No | Used in email greeting (defaults to "there") |

#### Sample Request

```json
{
  "email": "john.doe@example.com",
  "firstName": "John"
}
```

#### Response — 200 OK

```json
{
  "success": true,
  "message": "otp send successfully"
}
```

> A new 6-digit OTP is stored in Redis with a 10-minute expiry. The old OTP is deleted.

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing email | `{ "success": false, "message": "please provide an email addess" }` |
| 503 | Email send failed | `{ "success": false, "message": "failed to send otp, Please try again later" }` |

---

## Error Handling

All errors follow a consistent JSON structure:

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

> **Note:** The auth middleware may return `{ "status": false, "message": "..." }` instead of `{ "success": false, ... }`. Frontend code should check both keys when handling 401 responses from protected routes.

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (registration) |
| 400 | Bad Request — validation errors, missing fields |
| 401 | Unauthorized — invalid/missing token or credentials |
| 404 | Not Found — resource doesn't exist |
| 409 | Conflict — duplicate email/username |
| 500 | Internal Server Error |
| 503 | Service Unavailable — external service (Redis, DB, email) failure |

---

## Response Format

All responses use JSON. Successful responses include a `success: true` field; error responses include `success: false` and a descriptive `message`.

### Success Response Structure

```json
{
  "success": true,
  "message": "Description of what happened",
  "data": { }
}
```

### Error Response Structure

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

---

## Frontend Integration Guide

### Setting Up an API Client

Here's a reusable `fetch` wrapper that handles credentials and JSON parsing:

```typescript
const API_BASE = "http://localhost:5000/api/v1";

async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    credentials: "include", // sends cookies automatically
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}
```

### Handling Auth Tokens

The server sets an HTTP-only `accessToken` cookie on login/register. For browser-based apps, cookies are sent automatically with `credentials: "include"`. For mobile or non-browser clients, extract the token from the `Set-Cookie` header and send it via the `Authorization` header.

```typescript
// Login example
async function login(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Cookie is set automatically — no manual token storage needed
  console.log("Logged in as:", data.user.userName);
  return data.user;
}

// Accessing a protected route
async function getProfile() {
  const data = await apiFetch("/auth/me", {
    method: "GET",
    // Cookie is sent automatically
  });

  return data.currentUser;
}
```

### Complete Auth Flow Example

Here's a full registration → OTP verification → login → profile fetch flow:

```typescript
// 1. Register
await apiFetch("/auth/register", {
  method: "POST",
  body: JSON.stringify({
    firstName: "John",
    lastName: "Doe",
    userName: "johndoe",
    email: "john.doe@example.com",
    password: "MyP@ssw0rd",
  }),
});
// → OTP email sent

// 2. Verify OTP
await apiFetch("/auth/verify-user", {
  method: "POST",
  body: JSON.stringify({
    otp: "123456",
    email: "john.doe@example.com",
  }),
});
// → Account verified

// 3. Login
const { user } = await apiFetch("/auth/login", {
  method: "POST",
  body: JSON.stringify({
    email: "john.doe@example.com",
    password: "MyP@ssw0rd",
  }),
});
// → Cookie set, user data returned

// 4. Fetch profile (protected route)
const { currentUser } = await apiFetch("/auth/me");
console.log("Profile:", currentUser);

// 5. Upload profile picture (protected route)
const formData = new FormData();
formData.append("profilePicture", fileInput.files[0]);
const { avatar } = await apiFetch("/auth/change-profile-picture", {
  method: "POST",
  body: formData,
});
console.log("New avatar URL:", avatar.url);

// 6. Logout
await apiFetch("/auth/logout", { method: "POST" });
// → Cookie cleared
```

---

## Project Structure

```
server/
├── src/
│   ├── server.ts              # Entry point — DB connection + HTTP server start
│   ├── app.ts                 # Express app setup, middleware, route mounting
│   ├── config/
│   │   └── config.ts          # Centralized config + cookie options
│   ├── controllers/
│   │   └── user.controller.ts # All business logic for auth endpoints
│   ├── db/
│   │   └── db.ts              # MongoDB connection via Mongoose
│   ├── middlewares/
│   │   └── auth.middleware.ts # JWT verification middleware
│   ├── models/
│   │   └── user.model.ts      # Mongoose User schema + methods
│   ├── routes/
│   │   └── user.routes.ts     # Express router for /api/v1/auth/*
│   ├── types/
│   │   ├── config.d.ts        # Config type definitions
│   │   ├── express.d.ts       # Extends Express Request with `user`
│   │   └── token.d.ts         # Decoded JWT token type
│   └── utils/
│       ├── cloudinary.ts      # Image upload/delete via Cloudinary
│       ├── mail.ts            # OTP email sending via Nodemailer
│       ├── redis.ts           # Redis client for OTP storage
│       └── validation.ts      # Zod validation schemas
├── docs/
│   ├── PRD.md                 # Product Requirements Document
│   └── API.md                 # API Documentation (legacy)
├── .env                       # Environment variables (gitignored)
├── .env.sample                # Sample env file
├── package.json
├── tsconfig.json
└── README.md
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled production server |

---

## License

ISC
