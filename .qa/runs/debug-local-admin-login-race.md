# Debug Report — local-admin-login-race

**Date:** 2026-10-17  
**Project:** sagatree  
**Shell:** web  
**Repro grade:** full  

---

## Summary

Local Admin `signIn` clears `expectingGoTrueLocalAdminRef` **before** `applyUser`; a concurrent `SIGNED_IN` with `current === null` hits the anti-resurrection branch and **`discardStaleLocalAdminSession()`** wipes the fresh JWT — UI stays on Login, `sagatree-local-admin-session=true`, no `auth-token`.  
**Confidence:** high

---

## Bug description

| | |
|--|--|
| **Expected** | `admin` / `1234` → Dashboard (JWT or intentional fallback) |
| **Actual** | Login form returns; often no error; Local Admin flag set; no session token; REST “not authenticated” |
| **Steps** | 1. Open `http://localhost:3004/` 2. Login `admin` / `1234` 3. Observe still on Login |
| **First seen** | Recurring after Local Admin timeout / JWT-upgrade work (#704); HMR on `auth-context` worsens races |
| **Environment** | macOS, branch `fix/welt-default-unified-atlas`, Vite `:3004` (IPv6/`localhost`), Kong `:8000` |

---

## Reproduction

### Red-capable commands (already run)

```bash
# A — GoTrue itself is healthy
curl -sS -o /tmp/auth-login-debug.json -w '%{http_code}\n' \
  -X POST 'http://localhost:8000/auth/v1/token?grant_type=password' \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sagatree.local","password":"1234"}'
# → HTTP 200, access_token present, user admin@sagatree.local

# B — Vite bind (agent curl pitfall)
lsof -nP -iTCP:3004 -sTCP:LISTEN
# → listens on [::1]:3004 only; 127.0.0.1:3004 fails (use localhost)
```

### Browser MCP

- URL: `http://localhost:3004/`
- Result: **reproduced**
- Instrumented `fetch`: password grant **status 200 in 102ms**
- After: `onLogin=true`, `admin=true`, **`token=null`**, warn `[project-service] ensure_native_starter_project: not authenticated`

### Hard path

yes — recurring auth (≥2 prior fixes: timeout fallback, JWT upgrade). Red loop = GoTrue 200 + client still logged out + no `auth-token`.

---

## Evidence

### Console / app warn

```
[project-service] ensure_native_starter_project: not authenticated
```

(Vite HMR history also: `hmr invalidate /src/lib/auth-context.tsx Could not Fast Refresh ("useAuth" export is incompatible)` — remounts amplify races.)

### Network

| Method | URL | Status | Note |
|--------|-----|--------|------|
| POST | `/auth/v1/token?grant_type=password` | 200 | 102ms — success then discarded client-side |

### Storage after failed UI login

| Key | Value |
|-----|--------|
| `sagatree-local-admin-session` | `"true"` |
| `*-auth-token` | **absent** |

### Code (race)

```390:393:src/lib/auth-context.tsx
          expectingGoTrueLocalAdminRef.current = null;
          applyUser(data.user, generation);
          provisionDornhainDefaultForSession();
```

```319:325:src/lib/auth-context.tsx
        if (current === null && !expectingGoTrue) {
          void (async () => {
            await discardStaleLocalAdminSession();
            ...
```

---

## Prior art

- [x] Repo: `auth-context.tsx` anti-resurrection + #704 JWT upgrade
- [x] Repo: `e2e/auth-local-admin-timeout.spec.ts` — covers timeout races, **not** “fast success must keep JWT”
- [x] GitHub search: many “local admin” issues elsewhere; SagaTree symptom is this race
- [x] `.qa/runs/debug` prior auth work (JWT upgrade) — incomplete without this race guard

---

## Root cause

`onAuthStateChange` treats seeded-admin `SIGNED_IN` with `userRef.current === null` and `!expectingGoTrue` as **stale resurrection** and calls `discardStaleLocalAdminSession()`. Successful Local Admin `signIn` clears `expectingGoTrue` **before** React/`userRef` is updated, so a fast GoTrue `SIGNED_IN` (observed 102ms) races into that discard path and **scrubs the JWT** just granted. Result: Login screen + sticky Local Admin flag + no token. Same class of bug as prior timeout/JWT issues; insufficient hardening after #704.

**Hypotheses tested:**
1. GoTrue/Kong down → **falsified** (curl 200).
2. Wrong password / shortcut miss → **falsified** (grant 200 for admin@sagatree.local).
3. Timeout-only path without `applyUser` → **secondary**; catch still applies fallback; evidence shows grant succeeded then wiped.
4. `SIGNED_IN` discard vs `expectingGoTrue` clear race → **confirmed** by code order + 200 + empty token + provision warn.

**Fix attempts this bug:** 0 (this report). Prior related: timeout fallback, JWT upgrade (insufficient).

---

## Suggested fix (minimal)

1. **`src/lib/auth-context.tsx`**
   - Never discard seeded-admin `SIGNED_IN` while `isLocalAdminSession()` is true (unless superseded by a non-admin `current`).
   - Clear `expectingGoTrueLocalAdminRef` **after** `applyUser` (or keep it set until `userRef` matches).
   - On intentional Local Admin `signIn` success: adopt JWT; do not call discard.
2. **Hardening (stop recurrence)**
   - E2E assertion: after `admin`/`1234`, within 5s → Dashboard **and** `hasSupabaseAuthToken === true` (or documented offline fallback only when grant aborted).
   - Script/check: `scripts/auth-local-admin-login-smoke.mjs` — curl grant 200 + optional Playwright one-shot; wire into `test-gate` or pre-push.
   - Document: after any `auth-context` edit, full page reload (HMR invalidates `useAuth`).
   - Optional: Vite `server.host: true` so `127.0.0.1:3004` works (agent/tooling).
3. **Regression:** extend `e2e/auth-local-admin-timeout.spec.ts` case 1 (or new case 0) to require token after fast success.

**Next step:** `@implement` (user asked for hardening — implement race fix + e2e/smoke gate in same PR)

---

## Notes

- Assumptions: Local Admin shortcut still maps to seeded GoTrue user.
- Out of scope: hosted IdP; rate-limit UX (#670 already mapped).
- Secondary: Vite IPv6-only listen breaks naive `127.0.0.1` health checks — harden separately.
