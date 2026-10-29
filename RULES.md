# AWTOMATIG: Common Rules

Rules that apply to the whole repository and to every AI agent working in it. Agent instructions are in [AGENTS.md](AGENTS.md). Folder-specific rules are in [frontend/RULES.md](frontend/RULES.md), [backend/RULES.md](backend/RULES.md) and [admin/RULES.md](admin/RULES.md). Read the root and the folder you are working in. If they conflict, the folder's rule wins for that folder, and the conflict should be fixed.

"Must" is enforced in review or CI. "Should" needs a reason to skip.

---

## 1. Repo and workflow

- `frontend/`, `backend/` and `admin/` are independent packages. **Must not** import across them. The only contract is the backend's OpenAPI spec.
- Work on a branch, open a PR, get one review. No direct pushes to `main`.
- Commit messages are imperative with one topic per commit (`add stock adjustment use case`). Do not mix refactors with features.
- A change that alters a decision updates the matching decision log in the same PR: root `ARCHITECTURE.md` for system-wide decisions, otherwise the folder's own docs.
- **Memory has two levels, and both are mandatory in the same change as the work.** A task is not done until they are written.
  - **Each folder's `MEMORY.md`** (`frontend/`, `backend/`, `admin/`) is the detailed record of the work done in that folder: the status table, decisions and why, gotchas, open items and a dated change log saying what changed, what was verified and what was not. Update it whenever you decide, build, fix, clean up or resolve something in that folder.
  - **The root `MEMORY.md`** is the overview: one status row per folder, cross-folder decisions and open items, and a short dated change-log line for each piece of work that says which folder(s) changed and what, pointing to the folder's memory for the detail. No implementation detail at the root.
  - A change in one folder updates that folder's memory and adds one overview line at the root. A change that spans folders updates each folder's memory and adds one root line.
- **Must not** commit secrets, `.env` files, dumps of real data or build output. Each folder keeps an up-to-date `.env.example`.

## 2. TypeScript (all folders)

- `strict` is on. **Must not** use `any`; use `unknown` and narrow it. A rare `// eslint-disable` needs a comment saying why.
- Prefer small, pure functions. Names: `camelCase` variables and functions, `PascalCase` types and components, `SCREAMING_SNAKE_CASE` constants.
- Comments explain why, not what, and match the surrounding code's density.
- Formatting is automated (Prettier). Run the folder's format and lint commands before committing.

## 3. Security (all folders)

- Secrets live in environment variables only, validated at boot. **Must not** put a secret in a `NEXT_PUBLIC_*` variable.
- Never trust the client: validate on the server, and check authorization on the server.
- Do not log secrets, passwords, tokens or personal data.
- No new dependency without a reason in the PR. Run `npm audit` in CI.

## 4. Documentation

- A new convention or component is documented in the folder where it lives, in the same change.
- Keep docs short and true. If a doc and the code disagree, the code wins; fix the doc.

## 5. AI-assisted work

- Agents follow these rules the same as people. If a task conflicts with a rule, stop and ask rather than work around it.
- Read the surrounding code and the folder's docs before editing. Do not add dependencies, change architecture or touch migrations unless the request includes it.
- Report what was verified (build, tests, migration applied) and what was not.
