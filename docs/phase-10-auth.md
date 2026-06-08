# Phase 10 — RBAC & Authentication

## What Was Built

### Backend
| File | Purpose |
|------|---------|
| `app/models/user.py` | User model — email, username, hashed_password, role (UserRole enum), is_active |
| `app/schemas/user.py` | UserCreate, UserResponse, TokenResponse, LoginRequest Pydantic schemas |
| `app/core/security.py` | `hash_password`, `verify_password` (bcrypt), `create_access_token`, `decode_token` (HS256 JWT) |
| `app/api/auth.py` | POST /auth/register, POST /auth/login, GET /auth/me, GET /auth/users |
| `app/api/deps.py` | `get_current_user`, `require_admin`, `require_operator` FastAPI dependencies |
| `alembic/versions/003_users.py` | Creates users table with userrole enum |
| `app/api/__init__.py` | Router-level auth via `dependencies=[Depends(get_current_user)]` on all protected routers |
| `requirements.txt` | Added python-jose[cryptography], passlib[bcrypt] |

### Frontend
| File | Purpose |
|------|---------|
| `api/auth.js` | Axios calls for register, login, me, users |
| `api/client.js` | Request interceptor adds `Authorization: Bearer <token>`; 401 interceptor redirects to /login |
| `store/slices/authSlice.js` | Redux slice — login, register, fetchMe thunks; token persisted to localStorage |
| `pages/Login.jsx` | Email + password form, link to Register |
| `pages/Register.jsx` | Email + username + password + confirm — first user auto-gets admin role |
| `components/auth/ProtectedRoute.jsx` | Redirects to /login if no token in Redux state |
| `App.jsx` | All routes wrapped with ProtectedRoute; fetches `/auth/me` on app boot if token exists |
| `components/Layout/Header.jsx` | Shows username, role chip (admin=red, operator=yellow, viewer=default), logout button |

---

## Roles

| Role | Can Do |
|------|--------|
| `admin` | Everything — create/delete projects, trigger apply/destroy, manage users |
| `operator` | Read + plan + apply, cannot manage users or delete projects |
| `viewer` | Read-only — can view projects, deployments, logs |

---

## Token Flow

```
Register/Login → POST /auth/register or /auth/login
              ← { access_token: "<jwt>", user: { ... } }
              → localStorage.setItem("tf_token", token)

Every request → Authorization: Bearer <jwt>   ← axios interceptor adds this

JWT payload: { sub: "<user_uuid>", role: "admin", exp: <timestamp> }

get_current_user dependency:
  1. Extracts Bearer token from Authorization header (OAuth2PasswordBearer)
  2. decode_token() → validates signature + expiry
  3. Fetches User from DB by payload["sub"]
  4. Returns User ORM object to route handler

401 response → axios interceptor clears localStorage + redirects to /login
```

---

## First User Bootstrap

The first user to register is automatically granted the `admin` role:

```python
role=UserRole.admin if await _first_user(db) else UserRole.viewer
```

This avoids chicken-and-egg: you can't seed an admin without an authenticated API call.

---

## Router-Level Protection Pattern

Instead of adding `Depends(get_current_user)` to every individual route function, TerraForge applies it at the router include level:

```python
_auth = [Depends(get_current_user)]
api_router.include_router(projects_router, dependencies=_auth)
api_router.include_router(deployments_router, dependencies=_auth)
```

Every route in those routers is automatically protected. New routes added to the router are protected by default without any extra code.

---

## Interview Q&A

### Q: What is JWT and why is it stateless?
A JWT (JSON Web Token) encodes a JSON payload as a base64url-encoded string, then signs it with a secret (HMAC-SHA256). The server doesn't need to look anything up to validate a token — it just re-computes the signature and checks the expiry. This makes it stateless: no session table, no Redis lookup per request. The tradeoff is that you cannot revoke a token before its expiry without adding a denylist (which reintroduces state).

### Q: What is the difference between authentication and authorization?
Authentication answers "Who are you?" — verifying identity via password + JWT. Authorization answers "What can you do?" — checking the user's `role` field against the required role for an operation. TerraForge's `require_admin` and `require_operator` dependencies handle authorization after `get_current_user` handles authentication.

### Q: Why does TerraForge use bcrypt for password hashing instead of SHA-256?
SHA-256 is a general-purpose hash — it's designed to be fast. An attacker with a GPU can compute billions of SHA-256 hashes per second, making brute-force trivial. bcrypt is intentionally slow — it has a configurable `rounds` parameter that adds a time cost. passlib's bcrypt with default rounds takes ~100ms per hash, reducing a brute-force attack's speed by orders of magnitude.

### Q: Where is the JWT secret stored and what happens if it leaks?
It's stored in the `SECRET_KEY` environment variable, injected via Docker Compose from `.env`. If it leaks, an attacker can forge tokens for any user, including admins. Mitigation: rotate the secret (invalidates all existing tokens, forcing re-login) and use asymmetric signing (RS256) so the private key is only on the auth server and the public key can be distributed safely.

### Q: What is the `OAuth2PasswordBearer` class doing in FastAPI?
`OAuth2PasswordBearer(tokenUrl=...)` tells FastAPI two things: (1) extract the `Authorization: Bearer <token>` header value and inject it into the route function via `Depends(oauth2_scheme)`, and (2) document the security scheme in OpenAPI/Swagger so the "Authorize" button appears. It does NOT validate the token — that's done by `decode_token()` in the dependency.

### Q: How would you implement token refresh without requiring a new login?
Issue two tokens at login: a short-lived **access token** (15 min) and a long-lived **refresh token** (7 days). Store the refresh token in an `HttpOnly` cookie (not accessible to JS, not vulnerable to XSS). When the access token expires and an API call returns 401, the frontend automatically calls `POST /auth/refresh` — the server reads the cookie, validates the refresh token (checked against a `refresh_tokens` DB table for revocability), and issues a new access token.

### Q: How does the first-user-is-admin pattern work and what are its risks?
`_first_user()` runs `SELECT count(*) FROM users`. If 0, the registering user gets `admin`. In a race condition (two requests in parallel before either commits), both could get admin — this is a known edge case. Fix: use a DB-level unique constraint or a serializable transaction. For TerraForge's interview use case, the simple count check is acceptable.

### Q: What is RBAC and how does it differ from ABAC?
RBAC (Role-Based Access Control) assigns permissions to roles, then assigns roles to users. It's coarse-grained but simple: TerraForge's admin/operator/viewer model. ABAC (Attribute-Based Access Control) grants access based on arbitrary attributes of the user, resource, and environment — e.g. "operator can apply deployments only for projects they created in their region." ABAC is more flexible but exponentially harder to reason about and audit. AWS IAM is a hybrid: role-based at the top level, attribute-based via policy conditions.
