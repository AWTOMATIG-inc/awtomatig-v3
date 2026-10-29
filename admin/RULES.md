# Admin: Rules

Rules for everyone (and every AI agent) working in `admin/`. They add to the root [RULES.md](../RULES.md). Reasons are in [ARCHITECTURE.md](ARCHITECTURE.md). "Must" is enforced in review or CI; "should" needs a reason to skip.

---

## 1. Data and the API

- **Must:** all data goes through the backend API. The admin app never connects to the database.
- **Must not** hand-write or copy a backend type. Use the client generated from the OpenAPI spec, and regenerate it when the backend changes.
- Handle every API error shape (`{ code, message, details? }`) in one shared place, and show a useful message, not a raw error.
- List screens use server-side pagination, sorting and filtering. Never load a whole table into the browser.

## 2. Auth and permissions

- **Must:** the session is the backend's httpOnly cookie. Never store a token in `localStorage` or in JavaScript-readable cookies.
- **Must:** hiding a button is not security. Check permissions in the UI for convenience only; the backend is the authority.
- Sign users out cleanly on session expiry and send them back to where they were after login.
- **Must not** put a secret in a `NEXT_PUBLIC_*` variable.

## 3. Structure

- One feature folder per backend module, mirroring `backend/src/modules/`. A feature owns its screens, forms and queries.
- Shared UI primitives live in `components/`; do not copy a primitive into a feature.
- **Must not** import from `frontend/` or `backend/`. Copy design tokens if you need them (see ARCHITECTURE.md section 5).
- Server Components by default; add `"use client"` only for interactivity.

## 4. Forms and data entry

- Validate with zod on the client for feedback and rely on the backend for truth. Reuse the generated schemas where the OpenAPI spec provides them.
- Money and quantities are strings or a decimal type end to end. **Must not** use JS floats for money.
- Destructive actions (delete, void, adjust stock) need a confirmation and show what will change.
- Never double-submit: disable the submit while pending and send an idempotency key for retryable mutations.

## 5. UI and accessibility

- **Must** follow [DESIGN.md](DESIGN.md) for every screen, including its list of banned patterns (no blinking dots, no "all systems operational" banners, no gradients, glass or glow, no filler widgets).
- Next.js has breaking changes from most training data: read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
- Every interactive element has visible hover, focus-visible and disabled states, and touch targets of at least 44×44px.
- Meet WCAG AA contrast. Never rely on color alone for a status.
- Respect `prefers-reduced-motion`.
- Tables, forms and dialogs come from the shared primitives so behavior (keyboard, focus, errors) is consistent.

## 6. Quality

- Run type-check, lint and the build before a PR. Add component or end-to-end tests for critical flows (login, creating a lead, posting an invoice).
- Keep this folder's `MEMORY.md` current with the detail of every change (what, why, what was verified), and add the overview line to the root `MEMORY.md` (see the root rules, section 1).
