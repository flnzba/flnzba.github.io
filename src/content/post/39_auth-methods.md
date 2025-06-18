---
title: '#39 JWT, SAML, and OAuth: Understanding Key Web Auth Methods'
description: 'JWT, SAML, and OAuth are three key web auth methods. This article explains their differences, use cases, and how they work with practical examples.'
publishDate: '18 June 2025'
updatedDate: '18 June 2025'
# coverImage:
#     src: ''
#     alt: ''
tags: ['web security', 'authentication', 'authorization']
---

## 1. JWT: The Compact & Stateless Token for API Authentication

**JSON Web Token (JWT)** is a compact, URL-safe means of representing claims (pieces of information) to be transferred between two parties. It's often used for **authentication and authorization in API-driven applications**, especially when a stateless approach is desired.

### What is a JWT?

A JWT is essentially a digitally signed, Base64Url-encoded string made of three parts, separated by dots:

1.  **Header:** Contains metadata like the token type (JWT) and the signing algorithm (e.g., HS256).
    ```json
    {
        "alg": "HS256",
        "typ": "JWT"
    }
    ```
2.  **Payload (Claims):** Contains the actual information or "claims" about the user and the token itself (e.g., user ID, roles, expiration time).
    ```json
    {
        "sub": "user_id_123",
        "name": "Alice User",
        "role": "author",
        "exp": 1735689600 // Expiration timestamp
    }
    ```
3.  **Signature:** Created by hashing the encoded header, encoded payload, and a secret key using the algorithm specified in the header. This ensures the token's integrity and authenticity.
    $$ \text{HMACSHA256}(\text{base64UrlEncode(header)} + "." + \text{base64UrlEncode(payload)}, \text{secret}) $$

A complete JWT looks like `HeaderBase64Url.PayloadBase64Url.Signature`.

### How JWT Authentication Works (Example Flow)

Imagine **Alice** logging into a simple **blog application**.

1.  **Alice Logs In:** Alice enters her username and password into the blog's client application (e.g., a web browser). The client sends these credentials to the blog's backend server.

2.  **Server Authenticates & Creates JWT:** The backend server verifies Alice's credentials. If valid, it generates a JWT containing her user ID, role, and an expiration time, and signs it with a secret key known only to the server.

3.  **Token Sent to Client:** The server sends this JWT back to Alice's browser.

4.  **Client Stores Token:** Alice's browser stores the JWT, typically in `localStorage` or `sessionStorage`.

5.  **Subsequent Requests with Token:** When Alice wants to fetch her blog posts, her browser retrieves the stored JWT and includes it in the `Authorization` header of the HTTP request:

    ```
    Authorization: Bearer <The_JWT_String>
    ```

6.  **Server Verifies Token:** The backend server receives the request. It extracts the JWT, verifies its signature using the secret key, and checks if it has expired. If valid, it decodes the payload to get Alice's user ID and role.

7.  **Access Granted:** Based on the valid token and claims, the server processes the request (e.g., fetches Alice's posts) and sends the data back.

**Key Takeaway for JWT:** It's excellent for **stateless API authentication**, where the server doesn't need to maintain session information, making it highly scalable for microservices and mobile backends.

## 2. SAML: The Standard for Enterprise Single Sign-On (SSO)

**SAML (Security Assertion Markup Language)** is an XML-based open standard specifically designed for **exchanging authentication and authorization data between an Identity Provider (IdP) and a Service Provider (SP)**. Its primary goal is to enable **Single Sign-On (SSO)**, allowing users to log in once to access multiple enterprise applications.

### Key Components of SAML

1.  **Identity Provider (IdP):** Authenticates the user (e.g., your corporate login system like Okta, Azure AD, ADFS). It asserts the user's identity.
2.  **Service Provider (SP):** The application or service the user wants to access (e.g., Salesforce, Workday, Slack). It relies on the IdP for user authentication.
3.  **SAML Assertion:** The core XML document issued by the IdP to the SP. It confirms that the user has been authenticated and often includes user attributes (like email, roles). These assertions are digitally signed by the IdP.

### How SAML Authentication Works (Example Flow - SP-Initiated SSO)

Let's follow **Sarah** as she logs into **Salesforce** using **Acme Corp's Okta** (her company's Identity Provider). This is called **SP-initiated SSO** because Sarah starts at the Service Provider.

1.  **Sarah Tries to Access Salesforce:** Sarah opens her browser and navigates to `https://acmecorp.salesforce.com`.

2.  **Salesforce Redirects to Okta:** Salesforce (the SP) detects Sarah isn't logged in. Instead of asking for credentials, it generates a SAML authentication request (an XML message) and redirects Sarah's browser to Okta's (the IdP's) login page, including this request.

3.  **Sarah Logs into Okta:** Sarah's browser lands on the Okta login page. She enters her Acme Corp username and password. Okta authenticates her.

4.  **Okta Generates & Posts SAML Assertion:** Upon successful login, Okta creates a digitally signed SAML Response containing a SAML Assertion with Sarah's user information (e.g., her email: `sarah.jones@acmecorp.com`, her role: `Sales Rep`). Okta then tells Sarah's browser to POST this entire SAML Response to a specific "Assertion Consumer Service" (ACS) URL on Salesforce.

5.  **Salesforce Validates & Grants Access:** Salesforce (the SP) receives the SAML Response. It validates the digital signature using a public key shared previously by Okta. If valid, it extracts Sarah's email and role, trusts Okta's authentication, and logs Sarah into Salesforce.

6.  **Sarah Accesses Salesforce:** Sarah is now seamlessly logged into her Salesforce dashboard without having to re-enter her credentials.

**Key Takeaway for SAML:** It's the go-to standard for **enterprise-level Single Sign-On**, allowing organizations to centralize user authentication for numerous cloud applications.

## 3. OAuth: The Protocol for Delegated **Authorization**

**OAuth (Open Authorization)** is an **open standard for authorization** that enables a user to grant a third-party application limited access to their resources on another service (e.g., Google Photos, Twitter) without exposing their actual login credentials to the third party.

**Crucially, OAuth is about _authorization_ (granting permission), not directly about _authentication_ (proving who you are).** While often used together with OpenID Connect for authentication, OAuth's core purpose is delegated access.

### Key Concepts and Roles in OAuth 2.0

1.  **Resource Owner:** You, the user, who owns the data (e.g., your photos).
2.  **Client Application:** The third-party app wanting access (e.g., a photo editor).
3.  **Authorization Server:** Authenticates the Resource Owner and issues access tokens (e.g., Google's OAuth server).
4.  **Resource Server:** Stores the protected resources (e.g., Google Photos API).
5.  **Access Token:** A temporary, specific-purpose key that the Client Application uses to access resources on your behalf.
6.  **Scope:** Defines the specific permissions requested by the Client Application (e.g., `read_photos`, `post_tweets`).

### How OAuth 2.0 Works (Authorization Code Grant Type Example)

Let's say you want to use **"Photo Album Sync"** (a Client Application) to back up your **Google Photos** (the Resource Server).

1.  **Client Requests Authorization:** You click "Connect to Google Photos" in "Photo Album Sync." The app redirects your browser to Google's Authorization Server. This URL includes `client_id`, `redirect_uri`, and importantly, the `scope` (e.g., `https://www.googleapis.com/auth/photoslibrary.read_only`).

Crucially, OAuth is an authorization protocol, not an authentication protocol. It's about granting permission for an application to do something or access something on your behalf, not about proving who you are. However, it's very commonly used in conjunction with OpenID Connect (OIDC) to achieve authentication (SSO), where OIDC builds an authentication layer on top of OAuth 2.0.

2.  **User Authorizes (or Denies) Access:**

    -   Your browser lands on a Google page. If you're not logged in, Google prompts you to log into your Google account.
    -   After logging in, Google displays a consent screen: "Photo Album Sync wants to: View your Google Photos library. [Allow] [Deny]"
    -   You click "Allow." Google's Authorization Server then generates a temporary **authorization code**.

3.  **Authorization Server Redirects with Code:** Google redirects your browser back to "Photo Album Sync"'s `redirect_uri`, appending the `authorization code` to the URL.

4.  **Client Exchanges Code for Tokens (Server-to-Server):**

    -   "Photo Album Sync"'s server receives this `authorization code`.
    -   **Crucially, in a secure, direct server-to-server request**, "Photo Album Sync" sends this code, its `client_id`, and its confidential `client_secret` to Google's **token endpoint**.
    -   Google validates these credentials and, if correct, issues an **Access Token** (and usually a **Refresh Token** for future renewals) directly to "Photo Album Sync"'s server.

5.  **Client Uses Access Token to Access Resources:**
    -   "Photo Album Sync"'s server stores the Access Token.
    -   When it needs to read your photos, it makes an API call to the Google Photos API (the Resource Server), including the Access Token in the `Authorization` header:
        ```
        Authorization: Bearer <Access_Token_Value>
        ```
    -   The Google Photos API validates the token. If it's valid and covers the requested `scope` (read-only access), it returns your photo album data.

**Key Takeaway for OAuth:** It provides a secure way for **third-party applications to access specific user data on other services without ever seeing your password**, making it fundamental for integrations (e.g., "Login with Google," connecting apps to social media).

---

## Conclusion: Distinct Tools for Different Jobs

While JWT, SAML, and OAuth all contribute to web security, they serve different, albeit sometimes overlapping, purposes:

-   **JWT:** Ideal for **stateless API authentication and authorization** within a single application or a tightly coupled ecosystem of microservices, offering efficiency and scalability.
-   **SAML:** The robust standard for **enterprise-wide Single Sign-On (SSO)**, bridging user identities between a centralized identity provider and various disconnected service providers.
-   **OAuth:** Primarily an **authorization protocol** that enables delegated access to user resources on third-party services, allowing users to grant granular permissions without sharing credentials. It forms the backbone for "connect with X" features.

Understanding these distinctions allows developers and architects to choose the right security tool for the job, building more secure, efficient, and user-friendly web applications.
