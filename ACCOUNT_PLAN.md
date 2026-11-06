# Account settings, change email and forgot password: plan

Status: **built and documented 2026-11-06. Phases 1 (Account page and change password), 2 (mail foundation), 3 (change email), 4 (forgot and reset password) and 5 (docs and release preparation) complete; only the live VPS release steps remain (section 8). Real Gmail delivery needs the app password in `backend/.env`, then `npm run mail:check`.** Questions for the owner are in section 3; Q1 to Q3 are answered, the rest keep their defaults.

What it does: every employee gets an **Account** page in the admin where they can **change their password** and **change their sign-in email**, and the sign-in screen gets **Forgot password?** for an employee who cannot sign in. Both email-based flows need the backend to send email, which it cannot do today.

It touches `backend/` and `admin/`. The website (`frontend/`) is not involved, except that its mailer is the model for the new one.

Folder docs to read before each phase: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md), [backend/RULES.md](backend/RULES.md), [admin/ARCHITECTURE.md](admin/ARCHITECTURE.md), [admin/RULES.md](admin/RULES.md), [admin/DESIGN.md](admin/DESIGN.md).

---

## 1. What is asked for

| Piece | Behaviour |
| --- | --- |
| Account page | `/account` in the admin, opened from the user block at the bottom of the sidebar. Shows who you are (name, email, role) and three cards: Email address, Password, and (read-only) your details. |
| Change password | Current password, new password, confirm. Optionally sign out of all other devices. |
| Change email | The employee types a new address and their current password. The change only takes effect after they confirm from **both** inboxes. |
| Forgot password | A link on the sign-in screen. The employee enters their email, receives a link valid for 1 hour, sets a new password and is sent to sign-in. |

"Emails" in the request is read as **the email the employee signs in with**. If it also meant notification preferences, say so (Q1).

## 2. What is already in place (checked in the code)

| Fact | Where | Consequence |
| --- | --- | --- |
| Better Auth **1.7.14** with `emailAndPassword` on; password 12 to 128 characters; sign-up closed; `revokeSessionsOnPasswordReset: true` | `backend/src/shared/auth/auth.factory.ts` | Reset and change-password endpoints already exist behind the same instance; only the email sending and the screens are missing. |
| `/change-password` is already rate-limited (10 a minute per address) | same file | No new rule needed for it. |
| `core.verifications` exists | `auth.schema.ts` | Reset and change-email tokens need **no migration**. |
| The seeded admin has `email_verified = true` | `seed-admin.ts:59` | Better Auth then uses its two-step change-email flow (below). Employees created later (no screen yet) must also be created verified, or the flow weakens. |
| Better Auth's `POST /change-email` needs **only a session**, not the password (read from `dist/api/routes/update-user.mjs`) | node_modules | A stolen session could start an email change. The plan adds a password check (section 4.2) and the two-inbox confirmation. |
| Asking to change to an address that already belongs to someone answers **200 and sends nothing** | same source | The UI must not say "email sent" as a fact. It says "If this address can be used, we sent a link." |
| The backend sends **no email** and has no mail library; the Gmail app password is in `frontend/.env` only | backend B11, root S5 | A new decision is needed (B21, S11 below). |
| The admin's auth calls are hand-written `fetch`es in `lib/auth/client.ts` with one message table | `admin/lib/auth/client.ts` | New calls and messages go in that one file. |
| `proxy.ts` lets only `/login` through without a session cookie | `admin/proxy.ts` | `/forgot-password` and `/reset-password` must be added to its matcher exclusions. |
| Employees are **not** login users (HR decision 17) | `HR_PLAN.md` | Changing a login email does **not** change the email on an HR employee record. They are separate on purpose; the Account page says nothing about HR. |

## 3. Questions (each has a default)

| # | Question | My default |
| --- | --- | --- |
| Q1 ✔ | Does "emails" mean the sign-in email address only? | **Answered 2026-11-06: yes.** No notification preferences. |
| Q2 ✔ | May the backend gain one dependency, `nodemailer` (the website already uses it)? Rule 5 of `AGENTS.md` forbids new dependencies unless the request includes them. | **Taken as yes** (the owner said the account emails are sent with the Gmail app password, which needs it). Reopen if that was not meant. |
| Q3 ✔ | Which mailbox sends the account emails? | **Answered 2026-11-06: the Gmail app password, as the website does.** Copied into `backend/.env` (`SMTP_USER`, `SMTP_PASS`) with `MAIL_FROM` = "AWTOMATIG Admin <that address>". |
| Q4 | Can an employee edit their display name on the Account page? | No. The name is set by whoever creates the account; it can come with the employee-management screen. |
| Q5 | After a password change, sign out the other devices? | A checkbox, **ticked by default**. After a *reset* it is always done (already configured). |
| Q6 | If an employee loses access to their email as well? | Out of scope: `npm run seed:admin -- --reset-password` stays as the break-glass for the administrator, and an administrator-managed reset belongs to the future employee-management screen. |
| Q7 | Link lifetimes. | Reset link 1 hour. Change-email links 1 hour each (Better Auth's default). |

## 4. Design

### 4.1 Change password (no email needed)

- Admin calls Better Auth's `POST /change-password` with `currentPassword`, `newPassword`, `revokeOtherSessions`.
- Backend additions, in `auth.factory.ts` hooks: reject a new password equal to the current one (`PASSWORD_UNCHANGED`, 400); audit `auth.password_changed` on success and `auth.password_change_failed` (reason code only) on failure, with the employee id, address and user agent, never a password; once mail exists (phase 2), send a **"Your password was changed"** notice to the employee's address.
- The new password follows the existing rule (12 to 128). The screen shows the rule, a show / hide eye (`PasswordInput`) and a confirm field; matching is checked in the browser only for feedback.
- The current session stays signed in. Other sessions end if the box is ticked.

### 4.2 Change email (two inboxes, password required)

```
Employee ─► Account page: new address + current password
        ─► backend checks the password (Better Auth /verify-password), then calls /change-email
        ─► mail 1 to the CURRENT address: "Approve changing your sign-in email to <new>"  (link, 1 hour)
        ─► employee opens it ─► Better Auth sends mail 2 to the NEW address: "Confirm this address" (link, 1 hour)
        ─► employee opens it ─► the email is changed; notice to the OLD address: "Your sign-in email was changed. If this was not you, contact an administrator."
```

- Config: `user.changeEmail.enabled`, `sendChangeEmailConfirmation` (mail 1) and `emailVerification.sendVerificationEmail` (mail 2). `emailAndPassword.requireEmailVerification` stays **off**, so sign-in is unaffected.
- **Password check.** Better Auth's endpoint ignores the password, so the raw `/change-email` is blocked by a `before` hook and the admin calls a thin backend endpoint, `POST /api/v1/account/email-change` (`{ newEmail, currentPassword }`), which verifies the password and then calls `auth.api.changeEmail`. (The first task of phase 3 is a short spike to confirm this wrapping works on 1.7.14; if a `before` hook can read an extra `currentPassword` field, that is simpler and replaces the wrapper.)
- The two links come back to the admin through the existing `/api` rewrite with `callbackURL=/account`. The Account page always shows the email from the live session, so after the second link it shows the new address. After the first link the page shows a fixed line: "If you were approving an email change, now check the new address for the second link."
- The session reads the database on every request, so the new email applies at once; other sessions stay signed in (the link in the old inbox is the proof of control).
- Audit: `auth.email_change_requested` and `auth.email_changed` with ids only. **No address is written to the audit log or the application log** (`RULES.md` sections 3 and 5).

### 4.3 Forgot password

- Sign-in screen: a "Forgot password?" link under the password field.
- `/forgot-password`: one email field. The answer is **always the same** ("If that address belongs to an employee, we sent a link"), whether or not the account exists. The mail is sent without waiting for it (the callback does not await SMTP), so response time does not reveal the account either; a test measures both cases.
- Backend: `sendResetPassword({ user, url })` with `resetPasswordTokenExpiresIn: 3600`. `redirectTo` is the admin's `/reset-password`. A small in-memory cooldown (60 seconds per address) stops one inbox from being flooded; `/request-password-reset` and `/reset-password` get the same tight rate limit as sign-in (10 a minute per address).
- `/reset-password?token=…`: new password and confirm. An invalid, used or expired token shows one clear message with a link back to "Forgot password?". Success sends the employee to `/login` with a notice. Tokens are single use and every session of that employee is ended (already configured).
- `onPasswordReset` sends the same "Your password was changed" notice, and audit records `auth.password_reset_requested` and `auth.password_reset_completed` (ids only).

### 4.4 Mail sender (shared by 4.1 to 4.3)

- New `backend/src/shared/mail/`: `MailService.send({ to, subject, text, html })` over `nodemailer` with the Gmail app password, a global `MailModule`, and a small `templates.ts` with the five messages (change approval, new-address confirmation, email-changed notice, reset link, password-changed notice). Each has a plain-text part and a simple HTML part in the website's email look; no external images or tracking.
- Env, validated at boot like the others: `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. In tests `MailService` is replaced by a fake that records messages, so no real network is used.
- Failures are logged by error name only and never include the address or link. A send failure never changes the answer the browser gets (that would reveal whether an account exists).
- This **supersedes B11's "the backend sends no email"** for account emails only. The website keeps sending the contact and careers emails itself.

### 4.5 Admin screens

| Screen | Route | Notes |
| --- | --- | --- |
| Account | `/account` (signed in) | Server Component page; one client form per card (React Hook Form + zod, as in AD10). Cards: Details (name, email, role, read-only), Email address, Password. Forms are one column, 640px max. Success is an inline line inside the card, not a toast (no toast primitive exists; DESIGN.md section 7.7 says one comes with the first screen that needs it, and a single confirmation line does not justify it). |
| Forgot password | `/forgot-password` | In the `(auth)` group, uses `AuthCard`. |
| Reset password | `/reset-password` | Same. Reads `?token=`. |
| Entry point | sidebar user block | The initials and name become a link to `/account`; the sign-out icon stays. The mobile drawer uses the same component. |

- `lib/auth/client.ts` gains `changePassword`, `requestEmailChange`, `requestPasswordReset`, `resetPassword` and the error messages for `PASSWORD_UNCHANGED`, `INVALID_TOKEN`, `PASSWORD_TOO_SHORT` and `PASSWORD_TOO_LONG`.
- `proxy.ts` matcher also excludes `forgot-password` and `reset-password`.
- No new dependency, no CSP or CORS change, no new env var in the admin.
- No permission is needed: any signed-in employee changes **their own** account, and Better Auth authenticates by the session. (These are Better Auth's endpoints, outside the OpenAPI permission rule, like sign-in.) The one new Nest endpoint, `POST /account/email-change`, is session-only and goes into `openapi.json`.

## 5. Security notes

- **2FA is off (B10).** Until it returns, control of an employee's inbox is control of their account, through reset. This plan does not make that worse than sign-in alone, but it makes the existing 2FA open item more urgent. Say so in the docs.
- Layers on email change: session, current password, approval from the old inbox, confirmation from the new one, a notice to the old address afterwards, audit, rate limits.
- Same response for known and unknown addresses on reset and change-email; mail is sent in the background.
- Links contain a token: never log a link, a token or an address; never put them in the audit log.
- The reset and approval links point to the admin's own origin (`BETTER_AUTH_URL`), over HTTPS in production.
- Gmail sending limits (about 500 a day) are far above need for a company this size; check once that mail reaches the inbox and not spam.

## 6. Phases

Each phase ends with typecheck, lint, build and the tests that exist. Phases 1 and 2 are independent of mail, so the Account page ships first.

| Phase | Folder | Work | Done when |
| --- | --- | --- | --- |
| 1. Account page and change password ✅ **done 2026-11-06** | `backend/`, `admin/` | Hooks for `PASSWORD_UNCHANGED` and the two audit actions; `/account` with the Details and Password cards; sidebar link; breadcrumb label; `client.ts` additions. No mail yet, so no notice. | An employee changes their password, wrong current password and a same-as-old password are refused with clear messages, other devices are signed out when ticked, audit rows exist, and the new password works on the next sign-in. **Met:** 7 new backend e2e tests (610 pass in total) and a 24-check browser run. The "password changed" email notice moves to phase 2. Detail in `backend/MEMORY.md` and `admin/MEMORY.md`. |
| 2. Mail foundation ✅ **built 2026-11-06 (real delivery still to be tried by the owner)** | `backend/` | `nodemailer`, `shared/mail/`, env vars (`env.ts`, `env.spec.ts`, `test/setup-env.ts`, `.env.example`), templates, fake in tests, the **password changed** notice wired into 4.1. A one-off `mail:check` script (like `storage:check`) that sends one test message to an address you pass. | Tests pass with the fake; `mail:check` delivers a real message to your inbox; the password-changed notice arrives. **Needs `SMTP_USER` and `SMTP_PASS` (and optionally `MAIL_FROM`) in the VPS `backend/.env` before the deploy.** **Met so far:** tests pass with the in-memory transport (624 in total), the notice is sent in the background and a mail failure changes nothing for the employee, and `mail:check` reached Gmail and failed cleanly with fake credentials. **Not yet met:** a real message arriving in an inbox. `MAIL_FROM` turned out optional (default "AWTOMATIG Admin <SMTP_USER>"). Detail in `backend/MEMORY.md`, decision B21. |
| 3. Change email ✅ **built 2026-11-06 (real delivery and a browser look still to do)** | `backend/`, `admin/` | Spike on the wrapper vs `before` hook; `changeEmail` config; `POST /account/email-change`; block raw `/change-email`; the Email card; the three messages; audit; `openapi.json` and admin types regenerated. | The full two-inbox flow works end to end against a throwaway database; wrong password refused; an address already in use looks identical to a fresh one and sends nothing; old-address notice arrives; no address in any log or audit row. **Met so far:** the spike showed a Better Auth `before` hook can read `currentPassword`, so there is **no wrapper endpoint and `openapi.json` is unchanged**: Better Auth's own `POST /auth/change-email` now refuses (400 `INVALID_PASSWORD`, audited) unless the current password is right, and refuses an unverified account (`EMAIL_CHANGE_UNAVAILABLE`), so the raw call is safe and nothing else is blocked. `/send-verification-email` is blocked (404). `/change-email` has the 10-a-minute limit. The two links land on fixed paths `/account?email=approved` and `/account?email=changed` (Better Auth adds `error=…` for a bad link) and the Account page says what happened. Better Auth's links are signed tokens, not rows in `core.verifications`, so a link can be opened again within its hour; a second use fails because the old address no longer exists, and no second notice is sent. 19 new backend tests (643 in total, real PostgreSQL) cover wrong or missing password, same address, unverified account, an address already in use (same answer, nothing sent), the whole two-inbox flow, replayed and forged links, audit rows, and no address, token or password in the audit log or the process output. **Not met yet:** a real message in an inbox, and a look at the Email card in a browser (skipped at the owner's request). |
| 4. Forgot and reset password ✅ **built 2026-11-06** | `backend/`, `admin/` | `sendResetPassword`, `onPasswordReset`, cooldown, rate limits, two pages, the sign-in link, `proxy.ts` change. | Request, mail, reset, sign-in with the new password all work; used and expired tokens are refused; unknown and known addresses give the same answer and similar timing; old sessions are gone. **Met:** `templates.ts` with `passwordResetEmail` (unit tested), Better Auth `sendResetPassword` (1-hour expiry, 60s cooldown per address, lands on `/reset-password`), `onPasswordReset` (audits `auth.password_reset_completed` with actorId, sends "password changed" notice), `/request-password-reset` and `/reset-password` on tight 10/min rate limits, audited `auth.password_reset_requested`. Admin: `proxy.ts` allows both routes, `client.ts` has `requestPasswordReset` and `resetPassword` and error codes, sign-in screen has "Forgot password?" link and handles `?reset=1`, `/forgot-password` and `/reset-password` pages with full error handling. Admin and backend `typecheck`, `lint`, and production `build` pass. |
| 5. Docs and release ✅ **done 2026-11-06 (VPS deployment pending)** | all | B21 (backend mail sender), S11 (root: the backend now sends account email; the Gmail app password lives in two env files), AD17 (admin Account and reset screens), README and `.env.example`, both `MEMORY.md` files and the root line. Close the "change-password" and "password reset" open items. VPS checklist (section 8). | Docs match the code. **Met:** Decisions B21, B22, S11, and AD17 recorded; `backend/README.md`, `admin/README.md`, `backend/.env.example` updated; open items closed in `backend/ARCHITECTURE.md`, `admin/ARCHITECTURE.md`, `backend/MEMORY.md`, `admin/MEMORY.md`, and root `MEMORY.md`. Release checklist in section 8 prepared. |

## 7. Tests

- **Backend (real PostgreSQL, fake mailer, per `backend/RULES.md` section 6):** change password (success, wrong current, same as current, too short, too long, other sessions revoked or kept); audit rows exist and contain no secret; reset (full flow by reading the token out of the fake mailer, expired token, reused token, unknown email gives the same status and body, cooldown, rate limit); change email (full two-step flow, wrong password, already-used address sends nothing and answers 200, unverified user path, old-address notice, raw `/change-email` refused); no address or token in captured logs.
- **Admin:** `typecheck`, `lint`, `build`, then a scripted headless-Chrome run as in earlier phases (sign in, each card's success and error states, forgot-password pages, the reset page with a bad token, 390px width). Real delivery is checked by the owner once with `mail:check`.

## 8. VPS release checklist

1. Add `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` to the VPS `backend/.env` **before** merging (a missing variable stops the API at boot; `deploy.sh` does not touch `.env`).
2. Deploy. No migration is expected; if the spike finds one is needed it will be additive.
3. Run `npm run mail:check -- you@example.com` on the VPS and confirm it lands in the inbox.
4. Test once with the administrator account: change password, then reset by email, then sign in.
5. Do not run the email-change flow on the real administrator account until the first three steps pass; use a second test employee.

## 9. Not in this plan

2FA; administrator-managed password reset or employee invites (needs the employee-management screen); a list of active sessions; editing the display name (Q4); notification preferences (Q1); linking login users to HR employees.
