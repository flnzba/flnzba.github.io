---
title: '#41 Fixing the OpenPanel Signup Issue on Dokploy'
description: 'Explaining the interaction between HTTPS, Traefik, and environment variables in fixing the OpenPanel signup issue on Dokploy.'
publishDate: '04 October 2025'
updatedDate: '04 October 2025'
# coverImage:
#     src: ''
#     alt: ''
tags: ['Dokploy', 'OpenPanel', 'Traefik']
---

When deploying **OpenPanel** on **Dokploy**, many users encounter a puzzling issue after the first spin-up:

> The dashboard loads fine — but signup (and sometimes login) simply doesn’t work.

The browser console reports errors like:

```
Laden von gemischten aktiven Inhalten "http://monitor-openpanel-…/trpc/auth.signUpEmail" wurde blockiert.
```

and later, after partial fixes:

```
Cross-Origin-Anfrage blockiert: Die Gleiche-Quelle-Regel verbietet das Lesen der externen Ressource...
```

At first, it looks like a frontend or network bug — but the actual problem lies in how **Dokploy’s Traefik reverse proxy**, **HTTPS setup**, and **OpenPanel’s environment variables** interact.

Let’s break down what’s happening and how to fix it properly.

## 🔍 The Problem: Mixed Content, CORS, and Misaligned URLs

OpenPanel is a modern analytics stack composed of multiple services:

-   **op-dashboard** → The frontend (Next.js)
-   **op-api** → The backend (tRPC + Next.js)
-   **op-worker** → The background job runner
-   **op-db, op-kv, op-ch** → Database, Redis, and ClickHouse services

Dokploy automatically provisions and exposes these services behind **Traefik**, which manages routing, HTTPS certificates, and load balancing.

When OpenPanel is first deployed through Dokploy, it is usually assigned **temporary Traefik test URLs**, for example:

```
https://monitor-openpanel-XXXX.traefik.me
```

Later, you might configure **manual redirects** or **custom domains** (e.g. `dashboard.example.com` for the dashboard and `api.example.com` for the API). This is done in the settings pannel of the service directly in Dokploy.

This domain change introduces the real problem:

-   The original `.env` values still pointed to the **temporary Traefik URL**, not the new custom domains.
-   The dashboard (served under HTTPS) was calling the API (still referenced as HTTP or with the wrong host).

As a result:

-   The browser blocked requests due to **mixed active content** (HTTPS → HTTP).
-   Once HTTPS was enabled, **CORS (Cross-Origin Resource Sharing)** blocked requests between mismatched subdomains.

## ⚙️ Step 1 — Correcting Base URLs in the Environment Configuration

The most critical fix is to ensure every service knows the **correct public URLs** for the dashboard and API.

OpenPanel uses **Next.js**, which reads these variables at build and runtime to form absolute URLs.

In the `.env` file, define the URLs explicitly for your final domains:

```dotenv
# Domains
DASHBOARD_HOST=dashboard.example.com
API_HOST=api.example.com

# Public origins
NEXT_PUBLIC_DASHBOARD_URL=https://${DASHBOARD_HOST}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_DASHBOARD_URL}
NEXT_PUBLIC_API_URL=https://${API_HOST}

# NextAuth (if used)
NEXTAUTH_URL=${NEXT_PUBLIC_DASHBOARD_URL}
AUTH_TRUST_HOST=true
```

**Why this matters:**

-   The frontend (dashboard) will now call the API via `https://api.example.com` — not via the old `http://monitor-openpanel-*.traefik.me` domain.
-   Both the dashboard and API “know” they are served under HTTPS.
-   Future domain changes only require edits in one place: the `.env` file.

## 🧱 Step 2 — Configuring Traefik to Handle HTTPS and CORS

Dokploy already ships with a working Traefik setup.
However, for multi-domain OpenPanel deployments, we need to make it **explicitly enforce HTTPS** and **allow cross-origin requests** from the dashboard to the API.

### ✅ Static Traefik configuration (`/etc/dokploy/traefik/traefik.yml`)

This is Dokploy’s default configuration, which we keep intact.
It ensures Traefik listens on both ports 80 (HTTP) and 443 (HTTPS), with automatic Let’s Encrypt certificate provisioning.

```yaml
entryPoints:
    web:
        address: :80
    websecure:
        address: :443
        http3:
            advertisedPort: 443
        http:
            tls:
                certResolver: letsencrypt
```

### ✅ Dynamic middlewares (`/etc/dokploy/traefik/dynamic/middlewares.yml`)

We add two key middlewares:

1. `redirect-to-https` — Redirects all HTTP requests to HTTPS.
2. `openpanel-cors` — Allows the dashboard origin to access the API safely.

```yaml
http:
    middlewares:
        redirect-to-https:
            redirectScheme:
                scheme: https
                permanent: true

        openpanel-cors:
            headers:
                accessControlAllowOriginList:
                    - 'https://dashboard.example.com'
                accessControlAllowMethods:
                    - GET
                    - POST
                    - PUT
                    - PATCH
                    - DELETE
                    - OPTIONS
                accessControlAllowHeaders:
                    - '*'
                accessControlAllowCredentials: true
                addVaryHeader: true
```

**Explanation:**

-   The redirect middleware ensures HTTPS-only traffic, preventing mixed content.
-   The CORS middleware allows the dashboard domain to make API calls across subdomains.

### ✅ Traefik labels in the Docker configuration

We attach these middlewares to the respective services via labels.

#### API service (`op-api`)

```yaml
labels:
    - 'traefik.enable=true'
    - 'traefik.http.routers.openpanel-api.rule=Host(`${API_HOST}`)'
    - 'traefik.http.routers.openpanel-api.entrypoints=websecure'
    - 'traefik.http.routers.openpanel-api.tls=true'
    - 'traefik.http.routers.openpanel-api.middlewares=openpanel-cors@file'
    - 'traefik.http.services.openpanel-api.loadbalancer.server.port=3000'

    # HTTP → HTTPS redirect
    - 'traefik.http.routers.openpanel-api-http.rule=Host(`${API_HOST}`)'
    - 'traefik.http.routers.openpanel-api-http.entrypoints=web'
    - 'traefik.http.routers.openpanel-api-http.middlewares=redirect-to-https@file'
```

#### Dashboard service (`op-dashboard`)

```yaml
labels:
    - 'traefik.enable=true'
    - 'traefik.http.routers.openpanel-dash.rule=Host(`${DASHBOARD_HOST}`)'
    - 'traefik.http.routers.openpanel-dash.entrypoints=websecure'
    - 'traefik.http.routers.openpanel-dash.tls=true'
    - 'traefik.http.services.openpanel-dash.loadbalancer.server.port=3000'

    # HTTP → HTTPS redirect
    - 'traefik.http.routers.openpanel-dash-http.rule=Host(`${DASHBOARD_HOST}`)'
    - 'traefik.http.routers.openpanel-dash-http.entrypoints=web'
    - 'traefik.http.routers.openpanel-dash-http.middlewares=redirect-to-https@file'
```

**Why this works:**

-   The dashboard and API each run on their own host.
-   Traefik automatically redirects plain HTTP to HTTPS.
-   The API explicitly allows requests from the dashboard domain.

## 🩺 Step 3 — Fixing the “Unhealthy Container” Problem

After HTTPS and CORS were fixed, Dokploy still sometimes failed the deployment with:

```
dependency failed to start: container op-api-1 is unhealthy
```

This happens because Dokploy checks container health via the `HEALTHCHECK` directive in Docker Compose.
OpenPanel’s API runs database migrations on first start, which can delay the healthcheck response.

The solution is to **simplify the healthcheck** to a TCP-level check and give it more time.

```yaml
healthcheck:
    test: ['CMD-SHELL', 'nc -z localhost 3000']
    interval: 10s
    timeout: 5s
    retries: 60
    start_period: 180s
```

Additionally, other services (`op-dashboard`, `op-worker`) should **not wait for a “healthy”** API, just for it to be “started”:

```yaml
depends_on:
    op-api:
        condition: service_started
```

**Why this works:**

-   The TCP check ensures the container passes as soon as the Node.js process listens on port 3000.
-   The longer start period gives time for migrations and schema initialization.
-   Dependent services no longer fail during the first startup.

## ✅ The Final Result

After applying these fixes:

-   The OpenPanel dashboard and API communicate securely over HTTPS.
-   CORS headers allow cross-domain communication between frontend and backend.
-   Dokploy deployments succeed without “unhealthy” container errors.
-   Signup and onboarding work immediately after the first boot — no more browser security blocks.

## 🚀 Lessons Learned

1. **Dokploy’s automation is powerful, but explicit configuration is key** when you introduce custom domains.
2. **Next.js apps require correct public URLs** (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DASHBOARD_URL`) — otherwise, the frontend calls the wrong endpoint.
3. **Traefik handles HTTPS and CORS elegantly**, but only if you tell it exactly what to allow.
4. **Healthchecks should reflect startup behavior** — migrations and initialization often take longer on first boot.
5. **Centralizing domains in `.env`** keeps your stack maintainable across staging and production.
