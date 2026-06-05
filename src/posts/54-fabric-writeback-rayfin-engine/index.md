---
title: 'Building a Write-Back Interface on Microsoft Fabric Apps with Rayfin'
description: >-
  A full technical walkthrough of building a governed write-back interface on Microsoft Fabric Apps with the Rayfin SDK — static hosting, Entra ID SSO, and a server-side functions proxy to an existing REST API, with no separate web app to maintain.
date: '2026-06-05'
updated: '2026-06-05'
tags:
  - microsoft fabric
  - rayfin
  - write-back
  - power bi
  - data engineering
  - typescript
number: 54
canonical_url: 'https://www.fzeba.com/posts/54-fabric-writeback-rayfin-engine/'
published: true
---

## Building a Write-Back Interface on Microsoft Fabric Apps with Rayfin

> *Bridging operational data entry and enterprise analytics in a single governed platform.*

**Audience:** Data Engineers, Solution Architects, Fabric Developers

---

## Table of Contents

1. [The Problem: The Missing Write Layer in Analytics Platforms](#1-the-problem)
2. [The Use Case Architecture](#2-the-use-case-architecture)
3. [Microsoft Fabric Apps and Rayfin: What They Actually Are](#3-fabric-apps-and-rayfin)
4. [The Write-Back Pattern: Approach Overview](#4-the-write-back-pattern)
5. [CORS: The Browser Security Wall](#5-cors)
6. [Bearer Token Authentication: Two Models](#6-bearer-token-authentication)
7. [Option B: Rayfin Functions as a Server-Side Proxy](#7-rayfin-functions-proxy)
8. [Full End-to-End Architecture](#8-full-architecture)
9. [Code Walkthrough](#9-code-walkthrough)
10. [Caveats, Limitations, and Known Issues](#10-caveats)
11. [Alternative Fallback: Fabric User Data Functions](#11-alternative)
12. [Recommendations and Decision Framework](#12-recommendations)

---

## 1. The Problem: The Missing Write Layer in Analytics Platforms

Enterprise analytics platforms are, by design, excellent at consuming and presenting data. Microsoft Fabric excels at ingesting, transforming, and visualising data through pipelines, Lakehouses, and Power BI. What it has historically lacked is a first-class, governed mechanism for writing operational data *back* into the pipeline—without bolting on a separate web application, Azure Function, or Logic App that lives outside the Fabric governance boundary.

The scenario is common in practice:

A business runs operational processes—forecasting, budget adjustments, exception handling, manual corrections—where subject matter experts need to **enter or override values** that feed downstream analytics. These values go into a transactional database, flow through ETL pipelines, and surface in management reports. The challenge is that the data entry interface almost always lives *outside* the analytics platform. It is a separate web app, a SharePoint form, an Excel sheet emailed around, or at worst, a direct database connection handed to power users.

The consequences are familiar:

- **Governance fragmentation**: the write path is outside the data estate; audit trails are inconsistent.
- **Deployment complexity**: maintaining a separate web app solely for data entry creates operational overhead disproportionate to the task.
- **User experience friction**: switching between a data entry interface and a Power BI report breaks the analytical workflow.
- **Security surface expansion**: a standalone web app with its own auth, hosting, and database adds attack surface and compliance scope.

With the introduction of **Fabric Apps** and the **Rayfin SDK** at Microsoft Build 2026, there is now a path to solve this within the Fabric ecosystem itself. This article examines that path in full technical detail.

---

## 2. The Use Case Architecture

The starting architecture for this discussion is as follows:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXISTING SYSTEM                                  │
│                                                                          │
│  ┌──────────────┐    REST API     ┌──────────────┐                      │
│  │   Client /   │ ──────────────► │  Web App     │                      │
│  │   User       │                 │  (hosted)    │                      │
│  └──────────────┘                 │              │                      │
│                                   │ POST /data   │                      │
│                                   │ GET  /data   │                      │
│                                   └──────┬───────┘                      │
│                                          │ writes/reads                 │
│                                          ▼                              │
│                                   ┌──────────────┐                      │
│                                   │  PostgreSQL  │                      │
│                                   │  Database    │                      │
│                                   └──────┬───────┘                      │
│                                          │                              │
│                           ┌─────────────▼──────────────┐               │
│                           │    Microsoft Fabric         │               │
│                           │                             │               │
│                           │  ┌──────────────────────┐  │               │
│                           │  │  Data Pipelines /    │  │               │
│                           │  │  Dataflows Gen2      │  │               │
│                           │  └──────────┬───────────┘  │               │
│                           │             │               │               │
│                           │  ┌──────────▼───────────┐  │               │
│                           │  │  Lakehouse / Warehouse│  │               │
│                           │  └──────────┬───────────┘  │               │
│                           │             │               │               │
│                           │  ┌──────────▼───────────┐  │               │
│                           │  │  Power BI Report      │  │               │
│                           │  └──────────────────────┘  │               │
│                           └─────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Components

**External Web App**: A backend service (Node.js, .NET, Python—any stack) that exposes a REST API. It handles:
- Authentication: issues Bearer tokens via a dedicated auth endpoint (e.g. `POST /auth/token`)
- Data reads: `GET /api/v1/records`
- Data writes: `POST /api/v1/records`, `PUT /api/v1/records/{id}`

**PostgreSQL**: The persistence layer for the operational data. The web app owns the schema and manages connections.

**Microsoft Fabric Pipelines**: Scheduled or event-triggered pipelines that pull from PostgreSQL (via a Linked Service or Data Gateway), transform, and load into the Lakehouse or Warehouse.

**Power BI Report**: Consumes the semantic model built on top of the Lakehouse/Warehouse and surfaces analytics to report consumers.

### The Gap

There is no Fabric-native interface for the data entry step. Users who need to write data must interact with the external web app directly—separate login, separate URL, separate UX—and then wait for the pipeline to pick up their changes before the report reflects them.

The goal: **replace or augment the data entry interface with a Fabric App that lives inside the governed Fabric workspace, uses Fabric SSO, and writes back to the existing web app via its REST API.**

---

## 3. Microsoft Fabric Apps and Rayfin: What They Actually Are

### 3.1 Fabric Apps (Preview)

Fabric Apps, announced at Build 2026 and currently in preview, is a managed application hosting platform inside Microsoft Fabric. It provisions a suite of backend services—database, authentication, API, and static hosting—as a single deployable unit, managed as a first-class Fabric item in the workspace.

The key principle: a Fabric App is not just static file hosting. It is a full-stack managed service where:

- **The database** is a SQL Database in Fabric (MSSQL dialect), schema-managed by TypeScript code.
- **The API** is a GraphQL endpoint auto-generated from TypeScript data model decorators.
- **The authentication** is Fabric SSO via Microsoft Entra ID—the same identity the user used to open Fabric.
- **The frontend** is built frontend assets (HTML, CSS, JS) served from OneLake-backed storage at a public URL.

After deployment, the app is accessible at:

```
https://<app-name>-app.rayfin.windows.net/
```

With the following sub-paths:

| Path | Service |
|---|---|
| `/api/graphql` | Data API (GraphQL read/write) |
| `/auth` | Fabric brokered authentication |
| `/storage` | File storage |

### 3.2 Rayfin SDK and CLI

Rayfin is the open-source SDK and CLI (`@microsoft/rayfin-cli`) that powers Fabric Apps. It is the developer-facing toolchain that:

1. **Scaffolds** new projects: `npm create @microsoft/rayfin@latest`
2. **Runs** a local full-stack environment (Docker-based) for development: `npm run dev`
3. **Deploys** to Fabric: `npx rayfin up`

The SDK provides a set of npm packages:

| Package | Purpose |
|---|---|
| `@microsoft/rayfin-core` | Entity decorators, schema definitions |
| `@microsoft/rayfin-client` | Type-safe GraphQL client for the frontend |
| `@microsoft/rayfin-auth` | Auth utilities |
| `@microsoft/rayfin-auth-provider-fabric` | Fabric SSO auth provider |
| `@microsoft/rayfin-functions` | Server-side functions runtime |
| `@microsoft/rayfin-data` | Type-safe client for Data API Builder |
| `@microsoft/rayfin-storage` | Storage operations client |

### 3.3 Data Models in Code

The schema is defined entirely in TypeScript using class decorators. Rayfin analyses these at deploy time and generates the SQL schema and GraphQL endpoints automatically:

```typescript
import { entity, role, text, number, uuid, date } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*', {
  policy: (claims, item) => claims.sub.eq(item.created_by),
})
export class ForecastEntry {
  @uuid()    id!: string;
  @text()    costCenter!: string;
  @number()  budgetValue!: number;
  @number()  forecastValue!: number;
  @text()    period!: string;
  @text()    created_by!: string;
  @date()    updatedAt!: Date;
}
```

This decorator block causes Rayfin to generate:
- A `ForecastEntry` table in the managed SQL database
- `forecastEntry`, `forecastEntries` GraphQL queries (read)
- `createForecastEntry`, `updateForecastEntry`, `deleteForecastEntry` GraphQL mutations (write)
- Row-level security enforcing that users only access their own records

**Important distinction for this use case**: Rayfin's built-in data layer writes to its *own* managed SQL database, not to the existing PostgreSQL instance. This is a fundamental architectural point addressed in the next section.

---

## 4. The Write-Back Pattern: Approach Overview

There are two broad approaches to achieving write-back in Fabric Apps:

### Approach 1: Fabric App as Frontend Shell (Recommended)

The Rayfin/Fabric App is used **only for its static hosting and authentication**. The frontend JavaScript makes direct or proxied calls to the existing external web app's REST API for all reads and writes. Rayfin's own SQL database and GraphQL layer are not involved in the data path.

```
Fabric App (frontend)  ──► External Web App REST API  ──► PostgreSQL
    │                                                         │
    │ (reads for display)                                     │
    └─────────────────────────────────────────────────────────┘
                                     │
                              Fabric Pipelines
                                     │
                              Power BI Report
```

**Advantages:**
- No data migration or schema duplication required
- Existing web app is the single source of truth
- Write-back is immediate (no sync lag)
- Full TypeScript frontend can be built with React/Vite

**Disadvantages:**
- CORS must be configured on the external web app
- Credential management requires care (see Section 6)
- Does not leverage Rayfin's own data layer for display

### Approach 2: Full Rayfin Backend (Data Migration)

Rayfin's SQL database becomes the new primary store. Fabric pipelines sync *from* PostgreSQL *into* Rayfin's database. Writes go through the GraphQL API into the Rayfin database, and a reverse pipeline (or webhook) pushes back to PostgreSQL. This is a more complex migration path and is out of scope for this article.

**This article focuses entirely on Approach 1.**

---

## 5. CORS: The Browser Security Wall

### 5.1 What CORS Is and Why It Applies Here

Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts how JavaScript running in one origin can make HTTP requests to a different origin. An *origin* is defined as the combination of protocol, host, and port.

When the Fabric App frontend runs at:
```
https://myapp-app.rayfin.windows.net
```

And the external REST API is at:
```
https://api.mycompany.com
```

These are different origins. Any `fetch()` or `XMLHttpRequest` call from the frontend to the API will trigger a CORS check. If the API server does not respond with the correct CORS headers, **the browser will block the request entirely**—not the server, the browser—before any data is exchanged.

### 5.2 The Preflight Problem

For simple `GET` requests with no custom headers, the browser sends the request directly and checks the response headers. For any of the following, the browser first sends an `OPTIONS` preflight request:

- `POST`, `PUT`, `DELETE`, `PATCH` methods
- Any request with an `Authorization` header
- `Content-Type: application/json`

This means **every single authenticated write call to the REST API will be preceded by an OPTIONS preflight**. If the API server does not handle `OPTIONS` correctly, all write calls will silently fail.

### 5.3 Required Server-Side Configuration

On the external web app, the following headers must be returned for all API endpoints:

```
Access-Control-Allow-Origin: https://myapp-app.rayfin.windows.net
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With
Access-Control-Max-Age: 86400
```

For preflight `OPTIONS` responses specifically, the status code must be `200 OK` or `204 No Content`.

**Note on wildcards**: Using `Access-Control-Allow-Origin: *` works for unauthenticated endpoints, but for any endpoint that requires an `Authorization` header (which is your entire auth flow), a wildcard is insufficient. The specific Rayfin origin must be explicitly allowed.

### 5.4 Example Configuration by Stack

**Express.js (Node.js):**
```javascript
import cors from 'cors';

app.use(cors({
  origin: 'https://myapp-app.rayfin.windows.net',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  optionsSuccessStatus: 204
}));

// Ensure OPTIONS is handled for all routes
app.options('*', cors());
```

**ASP.NET Core:**
```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("FabricApp", policy => {
        policy.WithOrigins("https://myapp-app.rayfin.windows.net")
              .AllowAnyMethod()
              .WithHeaders("Authorization", "Content-Type");
    });
});

app.UseCors("FabricApp");
```

**Python/FastAPI:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://myapp-app.rayfin.windows.net"],
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### 5.5 Local Development Consideration

During local development with `npm run dev`, the frontend runs on `http://localhost:<port>`. The external API's CORS configuration must also include `http://localhost:5173` (or whatever Vite's dev port is) to avoid breaking the development workflow. Manage these as environment-specific lists on the server.

---

## 6. Bearer Token Authentication: Two Models

The external web app requires a Bearer token, acquired by calling an auth endpoint, before any data endpoint can be used. This is the classic two-step pattern:

```
Step 1: POST /auth/token  { credentials }  →  { access_token, expires_in }
Step 2: GET  /api/data    Authorization: Bearer <access_token>
Step 3: POST /api/data    Authorization: Bearer <access_token>
```

There are two fundamentally different ways to implement this from a Fabric App frontend.

### 6.1 Option A: Browser-Side Token Acquisition

The token acquisition happens directly in the browser JavaScript. The frontend calls the auth endpoint, receives the token, stores it in React state or `sessionStorage`, and attaches it to subsequent requests.

```typescript
// apiClient.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function acquireToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(`${BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: import.meta.env.VITE_API_CLIENT_ID,
      client_secret: import.meta.env.VITE_API_CLIENT_SECRET,
    }),
  });

  const { access_token, expires_in } = await response.json();
  cachedToken = access_token;
  tokenExpiry = Date.now() + (expires_in * 1000) - 30000; // 30s buffer
  return access_token;
}

export async function apiGet(path: string) {
  const token = await acquireToken();
  return fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
}

export async function apiPost(path: string, body: unknown) {
  const token = await acquireToken();
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(r => r.json());
}
```

#### The Fatal Security Problem

The `VITE_API_CLIENT_ID` and `VITE_API_CLIENT_SECRET` values are embedded in the compiled JavaScript bundle at build time. Vite (and any bundler) inlines these values directly into the output `.js` files. Any user who opens browser DevTools → Sources (or simply runs `curl` on the app URL) can read these credentials in plain text.

This is **not a theoretical risk**. It is the practical reality of how browser-based applications work. Credentials stored in frontend bundles must be treated as public information.

**Option A is only acceptable under one condition**: The auth endpoint takes *per-user* credentials (the logged-in Fabric user's own username and password for the external system), which the user enters into a login form themselves. These are never persisted in code—they are entered at runtime, used to acquire a token, and the token stored in session memory. The credentials themselves are never in the bundle.

### 6.2 Option B: Server-Side Proxy via Rayfin Functions

The correct solution for shared service credentials is to move the token acquisition and API proxying to a server-side function. The browser never sees the credentials; it only calls a Rayfin-hosted function endpoint.

The Rayfin SDK includes the `@microsoft/rayfin-functions` package, which provides a server-side functions runtime analogous to AWS Lambda or Azure Functions, but managed within the Fabric App's deployment unit.

#### Token Acquisition Decision Table

| Credential Type | Stored Where | Option |
|---|---|---|
| Per-user (user enters creds) | Runtime memory, never in code | A or B |
| Shared client_id + client_secret | Must be server-side env vars | B only |
| API key (static) | Must be server-side env vars | B only |
| Entra ID service principal | Not currently supported in Rayfin preview | ⚠️ Blocked |

---

## 7. Option B: Rayfin Functions as a Server-Side Proxy

### 7.1 Architecture of the Proxy Pattern

The Rayfin Functions proxy intercepts all calls to the external REST API on the server side. The browser only ever talks to the Rayfin backend—same origin, no CORS. All credentials are stored in server-side environment configuration. Token acquisition, caching, refresh, and forwarding are handled in the function.

```
┌────────────────────────────────────────────────────────────────────┐
│                     rayfin.windows.net                             │
│                                                                    │
│  ┌─────────────────────┐       ┌─────────────────────────────┐    │
│  │   Static Frontend   │       │   Rayfin Functions Runtime  │    │
│  │   (React / Vite)    │──────►│                             │    │
│  │                     │  HTTP │  /functions/api-proxy/*     │    │
│  │  fetch('/functions/ │       │                             │    │
│  │    api-proxy/data') │       │  1. Read env vars (creds)   │    │
│  └─────────────────────┘       │  2. POST /auth/token        │    │
│                                │  3. Cache token             │    │
│                                │  4. Forward request + auth  │    │
│                                │  5. Return response         │    │
│                                └──────────────┬──────────────┘    │
└───────────────────────────────────────────────┼────────────────────┘
                                                │ Server-to-server
                                                │ (no CORS, no browser)
                                                ▼
                                ┌───────────────────────────────┐
                                │   External Web App REST API   │
                                │   https://api.mycompany.com   │
                                │                               │
                                │  POST /auth/token             │
                                │  GET  /api/v1/records         │
                                │  POST /api/v1/records         │
                                │  PUT  /api/v1/records/{id}    │
                                └──────────────┬────────────────┘
                                               │
                                               ▼
                                        PostgreSQL
```

### 7.2 Environment Configuration

Credentials are stored in `rayfin.yml` as environment variables:

```yaml
# rayfin.yml
name: forecast-writeback
workspace: MyWorkspace

services:
  - db
  - static-hosting
  - functions

env:
  EXTERNAL_API_BASE_URL: "https://api.mycompany.com"
  EXTERNAL_API_CLIENT_ID: "<client-id>"
  EXTERNAL_API_CLIENT_SECRET: "<client-secret>"
  EXTERNAL_API_TOKEN_ENDPOINT: "/auth/token"
```

These values are injected into the function runtime at deploy time by the Fabric App workload. They are **never included in the frontend bundle** and never served to the browser.

### 7.3 The Proxy Function Implementation

```typescript
// rayfin/functions/apiProxy.ts
import { RayfinFunction, HttpRequest, HttpResponse } from '@microsoft/rayfin-functions';

const BASE_URL = process.env.EXTERNAL_API_BASE_URL!;
const CLIENT_ID = process.env.EXTERNAL_API_CLIENT_ID!;
const CLIENT_SECRET = process.env.EXTERNAL_API_CLIENT_SECRET!;
const TOKEN_ENDPOINT = process.env.EXTERNAL_API_TOKEN_ENDPOINT!;

// Module-scope token cache (survives warm function invocations)
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const res = await fetch(`${BASE_URL}${TOKEN_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });

  if (!res.ok) {
    throw new Error(`Token acquisition failed: ${res.status}`);
  }

  const { access_token, expires_in } = await res.json();
  cachedToken = access_token;
  tokenExpiry = Date.now() + (expires_in * 1000) - 30_000;
  return access_token;
}

export const apiProxy: RayfinFunction = async (req: HttpRequest): Promise<HttpResponse> => {
  // Strip the /functions/api-proxy prefix to get the downstream path
  const downstreamPath = req.url.replace(/^\/functions\/api-proxy/, '');

  let token: string;
  try {
    token = await getToken();
  } catch (err) {
    return { status: 502, body: { error: 'Failed to acquire upstream token' } };
  }

  // Forward the request to the external API
  const upstream = await fetch(`${BASE_URL}${downstreamPath}`, {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });

  // If token expired mid-session (401), invalidate cache and retry once
  if (upstream.status === 401) {
    cachedToken = null;
    token = await getToken();
    const retry = await fetch(`${BASE_URL}${downstreamPath}`, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    return { status: retry.status, body: await retry.json() };
  }

  return { status: upstream.status, body: await upstream.json() };
};
```

### 7.4 Frontend API Client (Calls Rayfin Function, Not External API)

With the proxy in place, the frontend API client becomes trivially simple and entirely CORS-free:

```typescript
// src/lib/api.ts
const PROXY_BASE = '/functions/api-proxy';

export async function getRecords(): Promise<Record[]> {
  const res = await fetch(`${PROXY_BASE}/v1/records`);
  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
  return res.json();
}

export async function createRecord(data: CreateRecordDto): Promise<Record> {
  const res = await fetch(`${PROXY_BASE}/v1/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST failed: ${res.status}`);
  return res.json();
}

export async function updateRecord(id: string, data: UpdateRecordDto): Promise<Record> {
  const res = await fetch(`${PROXY_BASE}/v1/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
  return res.json();
}
```

No CORS configuration required on the external API for this path. No credentials in the browser. No `Authorization` headers in frontend code.

---

## 8. Full End-to-End Architecture

### 8.1 Complete System Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                   MICROSOFT FABRIC WORKSPACE                         │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    FABRIC APP (Rayfin)                         │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │  App URL: https://forecast-app.rayfin.windows.net/        │ │  │
│  │  │                                                            │ │  │
│  │  │  ┌──────────────────┐   ┌──────────────────────────────┐ │ │  │
│  │  │  │  Static Frontend │   │  Rayfin Backend Services     │ │ │  │
│  │  │  │                  │   │                              │ │ │  │
│  │  │  │  React + Vite    │   │  /api/graphql  (Rayfin DB)   │ │ │  │
│  │  │  │                  │   │  /auth         (Entra SSO)   │ │ │  │
│  │  │  │  DataGrid        │──►│  /storage      (OneLake)     │ │ │  │
│  │  │  │  EditableTable   │   │  /functions/   (Proxy)       │ │ │  │
│  │  │  │  WriteBackForm   │   │   api-proxy/*                │ │ │  │
│  │  │  └──────────────────┘   └──────────────┬───────────────┘ │ │  │
│  │  └──────────────────────────────────────────┼────────────────┘ │  │
│  │                                             │ server-to-server  │  │
│  │  ┌────────────────────┐                     │                   │  │
│  │  │  SQL Database in   │                     │                   │  │
│  │  │  Fabric (optional) │                     │                   │  │
│  │  └────────────────────┘                     │                   │  │
│  └─────────────────────────────────────────────┼───────────────────┘  │
│                                                │                      │
│  ┌─────────────────────┐                       │                      │
│  │  Fabric Pipelines   │◄──────────────────────┼─── (sync from PG)   │
│  └──────────┬──────────┘                       │                      │
│             │                                  │                      │
│  ┌──────────▼──────────┐                       │                      │
│  │  Lakehouse          │                       │                      │
│  └──────────┬──────────┘                       │                      │
│             │                                  │                      │
│  ┌──────────▼──────────┐                       │                      │
│  │  Power BI Report    │                       │                      │
│  └─────────────────────┘                       │                      │
└────────────────────────────────────────────────┼─────────────────────┘
                                                 ▼
                              ┌──────────────────────────────┐
                              │    EXTERNAL WEB APP          │
                              │                              │
                              │  POST /auth/token            │
                              │  GET  /api/v1/records        │
                              │  POST /api/v1/records        │
                              │  PUT  /api/v1/records/{id}   │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                              ┌──────────────────────────────┐
                              │    PostgreSQL Database        │
                              │    (source of truth)          │
                              └──────────────────────────────┘
```

### 8.2 Authentication Flow

The Fabric App uses Entra ID SSO for the user-to-Fabric auth layer. This is completely separate from the Bearer token used to authenticate to the external REST API.

```
User Opens App URL
        │
        ▼
Fabric SSO (Entra ID)  ──►  Verify Fabric Workspace Membership
        │
        ▼ (authenticated)
Static Frontend Loads
        │
        ▼
React App Initialises
        │
        └──► fetch('/functions/api-proxy/v1/records')
                    │
                    ▼
              Rayfin Function (server-side)
                    │
                    ├──► POST /auth/token  ──►  External Web App
                    │         ◄── Bearer Token ──
                    │
                    └──► GET /api/v1/records (with Bearer token)
                                ◄── [ { record data } ] ──
                    │
              Return data to frontend
                    │
                    ▼
              React renders DataGrid
```

### 8.3 Write-Back Flow

```
User Edits Value in DataGrid
        │
        ▼
User Clicks "Save" / "Write Back"
        │
        ▼
React: fetch('/functions/api-proxy/v1/records/{id}', { method: 'PUT', body })
        │
        ▼
Rayfin Function
        ├── Get cached token (or refresh if expired)
        └── PUT https://api.mycompany.com/v1/records/{id}
                    │
                    ▼
              External Web App
                    │
                    ▼
              PostgreSQL (write persisted)
                    │
              ┌─────┘
              │ (pipeline trigger / scheduled)
              ▼
        Fabric Pipeline
              │
              ▼
        Lakehouse / Warehouse
              │
              ▼
        Power BI Refresh
```

---

## 9. Code Walkthrough

### 9.1 Project Scaffold

```bash
npm create @microsoft/rayfin@latest forecast-writeback -- \
  --workspace "Analytics-Workspace" \
  --template react-vite \
  --services static-hosting,functions
```

### 9.2 Project Structure

```
forecast-writeback/
├── rayfin/
│   ├── data/               # TypeScript data model decorators (optional for Approach 1)
│   ├── functions/
│   │   └── apiProxy.ts     # Server-side proxy function
│   └── rayfin.yml          # Deployment config and env vars
├── src/
│   ├── components/
│   │   ├── DataGrid.tsx     # Editable data table
│   │   ├── WriteBackModal.tsx
│   │   └── StatusBanner.tsx
│   ├── lib/
│   │   └── api.ts           # Frontend API client (calls proxy)
│   ├── hooks/
│   │   ├── useRecords.ts
│   │   └── useWriteBack.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tsconfig.json
```

### 9.3 The Editable DataGrid Component

```tsx
// src/components/DataGrid.tsx
import { useState } from 'react';
import { updateRecord } from '../lib/api';
import type { Record } from '../types';

interface Props {
  records: Record[];
  onRefresh: () => void;
}

export function DataGrid({ records, onRefresh }: Props) {
  const [editing, setEditing] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCellClick = (id: string, field: string, currentValue: string) => {
    setEditing({ id, field });
    setEditValue(currentValue);
    setError(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);

    try {
      await updateRecord(editing.id, { [editing.field]: editValue });
      setEditing(null);
      onRefresh();
    } catch (err) {
      setError(`Write failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setError(null);
  };

  return (
    <div className="data-grid">
      {error && <div className="error-banner">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>Cost Center</th>
            <th>Period</th>
            <th>Budget</th>
            <th>Forecast</th>
            <th>Variance</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.costCenter}</td>
              <td>{record.period}</td>
              <td
                className="editable-cell"
                onClick={() => handleCellClick(record.id, 'budgetValue', String(record.budgetValue))}
              >
                {editing?.id === record.id && editing.field === 'budgetValue' ? (
                  <div className="cell-edit">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      type="number"
                      autoFocus
                    />
                    <button onClick={handleSave} disabled={saving}>
                      {saving ? '…' : '✓'}
                    </button>
                    <button onClick={handleCancel}>✕</button>
                  </div>
                ) : (
                  record.budgetValue.toLocaleString()
                )}
              </td>
              <td
                className="editable-cell"
                onClick={() => handleCellClick(record.id, 'forecastValue', String(record.forecastValue))}
              >
                {editing?.id === record.id && editing.field === 'forecastValue' ? (
                  <div className="cell-edit">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      type="number"
                      autoFocus
                    />
                    <button onClick={handleSave} disabled={saving}>
                      {saving ? '…' : '✓'}
                    </button>
                    <button onClick={handleCancel}>✕</button>
                  </div>
                ) : (
                  record.forecastValue.toLocaleString()
                )}
              </td>
              <td className={record.variance < 0 ? 'negative' : 'positive'}>
                {record.variance.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 9.4 The Main App with Data Loading

```tsx
// src/App.tsx
import { useState, useEffect } from 'react';
import { DataGrid } from './components/DataGrid';
import { getRecords } from './lib/api';
import type { Record } from './types';

export default function App() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecords();
      setRecords(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, []);

  if (loading) return <div className="loading">Loading data…</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="app">
      <header>
        <h1>Forecast Write-Back</h1>
        <button onClick={loadRecords}>Refresh</button>
      </header>
      <p className="subtitle">
        Click any Budget or Forecast value to edit. Changes are written back immediately.
      </p>
      <DataGrid records={records} onRefresh={loadRecords} />
    </div>
  );
}
```

### 9.5 Deployment

```bash
# Build and deploy the full app to Fabric
npx rayfin up

# Output:
# ✓ Building static frontend (React/Vite)
# ✓ Deploying functions (apiProxy.ts)
# ✓ Applying environment configuration
# ✓ Deploying to workspace: Analytics-Workspace
#
# App URL:      https://forecast-writeback-app.rayfin.windows.net/
# Backend URL:  https://forecast-writeback-app.rayfin.windows.net/
```

---

## 10. Caveats, Limitations, and Known Issues

### 10.1 Preview Status — The Most Important Caveat

Fabric Apps and the Rayfin SDK were announced at Microsoft Build 2026 and are in **public preview as of June 2026**. This has several concrete implications:

- **No production SLA**: Microsoft does not guarantee uptime or performance for preview features. A critical failure in the Rayfin runtime has no guaranteed response time.
- **Breaking changes**: APIs, deployment formats (`rayfin.yml`), and CLI commands can change without warning between preview versions.
- **Pricing undisclosed**: At time of writing, Microsoft has not published pricing for Fabric Apps capacity consumption. Budget planning is not possible.
- **Feature gaps**: Not all advertised features may be fully functional. Documentation is sparse (see Section 10.2).

**Recommendation**: Use for internal tooling and proof-of-concept, not for business-critical write-back with SLA requirements. Re-evaluate at GA.

### 10.2 Rayfin Functions Documentation Gap

The `@microsoft/rayfin-functions` package is listed in the Rayfin GitHub repository and is referenced in the SDK package table. However, at launch, the Fabric Apps documentation does not document a `/functions/*` endpoint path, and there is no published reference for how custom HTTP function endpoints are exposed to the frontend.

The three documented backend endpoint paths are:
- `/api/graphql`
- `/auth`
- `/storage`

There is no documented `/functions/` path. This means the proxy architecture described in Section 7 depends on either:

1. Functions being exposed via an undocumented endpoint (test manually)
2. Functions being invocable via the GraphQL endpoint as a resolver (different pattern)
3. A future documentation update clarifying the functions routing

**Before building**: Create a minimal Rayfin project with a simple function that returns `{ status: 200, body: { hello: 'world' } }` and verify it is reachable from the frontend via `fetch('/functions/...')`. If this works, the full proxy pattern is viable. If not, use the Fabric User Data Functions fallback (Section 11).

### 10.3 Service Principal Authentication Not Supported

The Rayfin CLI documents a service principal authentication method (`--auth-methods service-principal`), but this is listed as **not currently supported** in the preview. This means:

- You cannot use an Entra ID registered application as a service principal to authenticate the Fabric App's backend to other Entra-ID-protected resources programmatically.
- If the external web app's auth endpoint requires an Entra ID client credentials flow (`grant_type=client_credentials` against an Entra ID tenant), you cannot currently authenticate server-side within Rayfin using that mechanism.

This is **not a blocker if** your external web app uses its own custom auth endpoint (username/password, API key, or custom JWT issuance). It is a **hard blocker** only if the external API requires Entra ID service principal tokens.

### 10.4 User Access: Fabric Tenant Membership Required

All users who access the Fabric App must:

1. Be members of the Fabric tenant (Entra ID tenant).
2. Have at least **Run and interact** permission on the Fabric App item.

Users who are not in the Entra ID tenant—external contractors, partners, B2C users—**cannot** access the app. There is no guest user flow or external identity provider support for Fabric App auth.

**Workspace roles do not automatically grant app access.** The app has its own item-level permissions. However, workspace members receive *Run and interact* by default.

| Permission Level | Can Open App | Can Write Back | Can Deploy |
|---|---|---|---|
| Run and interact | ✅ | ✅ | ❌ |
| Edit (Write) | ✅ | ✅ | ✅ |
| Reshare | ✅ | ✅ | ❌ |
| No permission | ❌ | ❌ | ❌ |

### 10.5 Power BI Report Latency After Write-Back

A write through the Fabric App completes the following steps synchronously (user sees confirmation):

```
Fabric App → Rayfin Function → External Web App → PostgreSQL ✓
```

The following steps are **asynchronous and scheduled**:

```
PostgreSQL → Fabric Pipeline → Lakehouse/Warehouse → Power BI refresh
```

If the Fabric pipeline runs hourly, a value written through the app at 09:01 will not appear in the Power BI report until approximately 10:00. Users who write data and immediately open the report will see stale values.

**Mitigations**:
- Add a note to the Fabric App UI: "Power BI reflects data as of [last pipeline run]."
- Trigger pipeline runs on-demand via the Fabric REST API from the Rayfin Function after each successful write (adds latency but reduces staleness).
- Display the current value from the external REST API directly in the Fabric App rather than from the Power BI report, giving the user immediate confirmation of their write.

### 10.6 Network Egress from Rayfin Functions

Rayfin Functions run inside the Azure-backed Fabric infrastructure. Outbound HTTP calls to the external web app require:

- The external web app is publicly accessible (not behind a corporate firewall or VPN without network connectivity from Azure).
- If the external web app requires IP allowlisting, the Rayfin function's outbound IP range must be known and added to the allowlist. Fabric does not currently publish dedicated IP ranges for Rayfin function egress.

For web apps hosted in Azure (App Service, AKS, etc.) in the same region, network connectivity is generally reliable. For on-premises or VPN-isolated web apps, a dedicated API Gateway or Azure API Management layer in front of the web app is necessary to expose the endpoints publicly or to the Fabric network range.

### 10.7 Token Caching in Serverless Functions

Module-scope variables in serverless functions are preserved only for the lifetime of the function instance (the "warm" instance). When the Fabric Apps runtime scales to zero or cold-starts a new instance, the token cache is lost. The next invocation will re-acquire the token. This is handled correctly by the pattern in Section 7.3 but adds latency (~200–500ms for a token endpoint round trip) on the first request after a cold start.

In practice, for an internal tool with active daytime users, cold starts will be rare. For low-traffic or overnight scenarios, the first morning request may experience this latency.

### 10.8 Fabric Capacity Requirement

Fabric Apps consumes capacity units from the assigned Fabric capacity. The Fabric App workload must be enabled by a tenant administrator, and the workspace must have a Fabric capacity SKU assigned (not a Pro or Premium Per User capacity).

Teams on free trials or shared capacities should verify that Fabric Apps is enabled and monitor capacity consumption through the Fabric Capacity Metrics app.

---

## 11. Alternative Fallback: Fabric User Data Functions

If Rayfin Functions are not suitable (documentation gap, functionality limitations, or the team prefers Python), **Fabric User Data Functions** provide a mature alternative for the server-side proxy layer.

Fabric User Data Functions are a separate Fabric item type (Python 3.11.9 runtime, serverless) with documented REST endpoints and Entra ID authentication. They are invocable from external systems—including a Rayfin App frontend.

### 11.1 Architecture with User Data Functions

```
Rayfin Frontend (static)
        │
        └──► fetch('https://<tenant>.fabric.microsoft.com/functions/<fn-id>/...')
                    │
                    ▼
         Fabric User Data Function (Python)
                    │
                    ├── Read secrets from Key Vault / Fabric secrets
                    ├── POST /auth/token to external API
                    └── Proxy request + return response
```

### 11.2 Example Python Proxy Function

```python
# proxy_function.py
import requests
import os
from microsoft.fabric.functions import FabricFunction, HttpRequest, HttpResponse

app = FabricFunction()

_token_cache = {"token": None, "expires_at": 0}

def get_token() -> str:
    import time
    if _token_cache["token"] and time.time() < _token_cache["expires_at"]:
        return _token_cache["token"]

    res = requests.post(
        f"{os.environ['EXTERNAL_API_BASE_URL']}/auth/token",
        json={
            "client_id": os.environ["EXTERNAL_API_CLIENT_ID"],
            "client_secret": os.environ["EXTERNAL_API_CLIENT_SECRET"],
        }
    )
    res.raise_for_status()
    data = res.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data["expires_in"] - 30
    return data["access_token"]

@app.route("/proxy/{path:path}")
def proxy(req: HttpRequest, path: str) -> HttpResponse:
    token = get_token()
    upstream = requests.request(
        method=req.method,
        url=f"{os.environ['EXTERNAL_API_BASE_URL']}/{path}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=req.json() if req.method in ("POST", "PUT", "PATCH") else None,
    )
    return HttpResponse(status_code=upstream.status_code, body=upstream.json())
```

The trade-off: User Data Functions add a second Fabric item to manage (separate deployment, separate monitoring) and require the Rayfin frontend to call an external URL rather than a same-origin path—meaning CORS configuration on the User Data Functions endpoint is needed. However, they are more mature, better documented, and have a stable Python runtime.

---

## 12. Recommendations and Decision Framework

### 12.1 Is This the Right Architecture?

Use Fabric Apps + Rayfin for this use case if all of the following are true:

- **Users are Fabric tenant members** — they already use Fabric or Power BI and have Entra ID identities.
- **The external web app is publicly reachable** — or at least reachable from Azure infrastructure in your Fabric region.
- **The auth flow is custom JWT** (not Entra ID service principal) — or users enter their own credentials.
- **The use case is internal tooling** — you accept preview limitations and have no hard SLA requirement.
- **You want a unified Fabric experience** — write-back UI and Power BI report in the same workspace.

### 12.2 Decision Tree

```
Does the external API use Entra ID service principal auth?
    YES → Cannot use Rayfin proxy today (blocked by preview limitation)
          └── Use Azure API Management + APIM Managed Identity as proxy layer instead
    NO  ↓

Are API credentials shared/static (not per-user)?
    YES → Must use Rayfin Functions proxy (Option B) — credentials in env vars
          └── Verify Rayfin Functions HTTP endpoints work (Section 10.2 caveat)
          └── Fallback: Fabric User Data Functions (Python)
    NO  ↓

Are users all Fabric tenant members?
    YES → Proceed with Fabric Apps + Rayfin (full approach)
    NO  → Consider Azure Static Web Apps + Azure Functions (broader auth support)
          or Custom Pages in Power BI Premium with Power Automate for write-back
```

### 12.3 Monitoring and Observability

Deploy the following regardless of which proxy option is chosen:

- **Fabric Capacity Metrics app**: Monitor Fabric App CU consumption.
- **Logging in the proxy function**: Log every token acquisition, API call, status code, and latency. Fabric Apps surfaces function logs in the portal.
- **Error handling with user feedback**: Never silently swallow API errors. Show users a clear message when a write fails so they know to retry or escalate.
- **Retry logic**: Implement exponential backoff for transient failures (network timeouts, 503s from the external API).

### 12.4 Final Architecture Summary

| Component | Technology | Responsibility |
|---|---|---|
| UI hosting | Fabric Apps static content (OneLake) | Serves React frontend |
| User authentication | Fabric SSO (Entra ID) | Authenticates workspace members |
| Token acquisition | Rayfin Functions (or UDF) | Calls external auth endpoint securely |
| API proxy | Rayfin Functions (or UDF) | Forwards read/write calls to external API |
| Data persistence | External web app + PostgreSQL | Source of truth for operational data |
| Analytics ingestion | Fabric Pipelines | Syncs PostgreSQL → Lakehouse |
| Reporting | Power BI semantic model + report | Analytics presentation |

### 12.5 What to Watch For

Rayfin is a very early preview (launched June 2026). The most important things to monitor as the platform matures:

- **Rayfin Functions HTTP routing** — official documentation of custom function endpoints and their URL structure.
- **Service principal auth GA** — will unlock Entra ID–protected downstream APIs without custom credential flows.
- **Pricing announcement** — necessary for TCO assessment against the alternative (dedicated Azure Static Web App + Azure Functions).
- **Fabric App networking options** — VNet integration or Private Endpoints for Rayfin function egress to private web apps.
- **General Availability** — when Fabric Apps exits preview, the SLA, pricing, and feature set will be stable enough to commit to for production workloads.

---

## Summary

The write-back use case described here — a Fabric-hosted interface that reads data from and writes data to an existing REST-API-backed web app, persisting to PostgreSQL, feeding Fabric pipelines and Power BI — is **technically achievable today** with Fabric Apps and Rayfin. The architecture is sound, and the primary building blocks (static hosting, Entra ID SSO, TypeScript frontend, server-side functions proxy) are all present in the platform.

The two concerns that require hands-on verification before committing to production are:

1. **Rayfin Functions HTTP endpoint availability** — the package exists but the routing documentation is absent at launch.
2. **Preview stability** — Fabric Apps is hours old at the time of writing; treating it as production infrastructure requires accepting significant risk.

For teams already invested in Microsoft Fabric, this is exactly the kind of internal tooling the platform was built for. The prospect of having data entry, analytics, and governance unified in a single workspace — with no separate hosting infrastructure to manage — is a compelling operational simplification. The caveat is simply one of timing: revisit this architecture at GA for production commitment.

---

*All code samples are illustrative. Verify package APIs against the current `@microsoft/rayfin-*` npm package versions before implementing.*

*Sources: [Fabric Apps overview](https://learn.microsoft.com/en-us/fabric/apps/overview) · [Rayfin GitHub](https://github.com/microsoft/rayfin) · [Build 2026 announcement](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Introducing-Rayfin-A-new-AI-first-way-to-build-deploy-and-govern/ba-p/5191676) · [Rayfin BaaS analysis](https://byteiota.com/rayfin-microsoft-fabric-baas/) · [Fabric User Data Functions](https://learn.microsoft.com/en-us/fabric/data-engineering/user-data-functions/user-data-functions-overview)*
