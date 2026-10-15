# AI Prompt Log

Every prompt sent to an AI tool during this project is recorded here **word for word**, together with how its output was reviewed and validated.
Process rules: see [PLAN.md §3](../PLAN.md#3-ai-usage-and-prompt-documentation-process).

## Entry template

```markdown
### P-### — <short title>
- **Date:** YYYY-MM-DD
- **Tool / model / effort:** e.g. Claude Code (Sonnet, low effort)
- **Phase / step:** e.g. Phase 1, step 2
- **Requirements:** e.g. R4, B5
- **Prompt (verbatim):**
  > ...
- **Context given:** files/attachments supplied with the prompt
- **Output summary:** what came back (files, commit SHA, no big code dumps)
- **Review:** ✅ accepted / ✏️ modified / ❌ rejected — and why
- **Validation:** exact test/command/manual check that proved it correct
- **Commit:** <sha> (commit body contains `AI: P-###`)
```

---

## Log

### P-001 — Project planning
- **Date:** 2026-10-15
- **Tool / model:** Claude Code desktop (Claude Opus 5.5)
- **Phase / step:** Phase 0, planning
- **Requirements:** all (R1–R8, B1–B7, F1–F4, X1–X6)
- **Prompt (verbatim):**
  > create a comprehensive plan for this task.
  > every step of this project should be explained and validated, every step and every ai prompt should be documented
- **Context given:** `roeto-home-assignment .pdf` (assignment brief, 3 pages)
- **Output summary:** `PLAN.md` (requirements breakdown with IDs, assumptions A1–A6, architecture, API design, 8 phases each with steps and validation gates, prompt-logging process, acceptance checklist, schedule, risks), plus this log file with its template.
- **Review:** _to fill in: did you change any decisions (stack, assumptions, scope of extras)?_
- **Validation:** _to fill in: check that every requirement in the PDF maps to an ID in PLAN.md §0 and to a row in §4._
- **Commit:** _to fill in_

### P-002 — Project location, git repo, cost policy
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Claude Opus 5.5, low effort)
- **Phase / step:** Phase 0, steps 1 and 3
- **Requirements:** none (process)
- **Prompt (verbatim):**
  > this entire project should be created inside ~/git_wa/job_interviews.
  > make sure this directory exists.
  > create a local git repo, get my permission before every commit.
  > make sure that this project costs as little usage as possible, use methods like switching to cheaper ai models or to lower effort levels when necessary
- **Context given:** PLAN.md and docs/ai-prompts.md from P-001
- **Output summary:** Confirmed the folder exists. Created `roeto-dice-game/` inside it with `git init -b main` and a `.gitignore`, and moved PLAN.md and this log there. Added PLAN.md §3a (commit approval policy) and §3b (AI cost policy: model tiers, effort levels, token-saving habits). Added model/effort to the log template.
- **Review:** _to fill in_
- **Validation:** `git status` shows the repo on `main` with no commits yet; PLAN.md §3a/§3b exist.
- **Commit:** _not committed yet (waiting for approval)_

### P-003 — Start Phase 0 (substep-by-substep, Sonnet)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort — switched by the user via `/model`; verified with `get_session`)
- **Phase / step:** Phase 0, step 2
- **Requirements:** none (setup)
- **Prompt (verbatim):**
  > start, ask me before every substep
  > go, make sure i picked Sonnet, with effort set to Low.
- **Output summary:** Created the npm workspaces skeleton (`shared`, `server`, `client`), `tsconfig.base.json`, ESLint flat config, Prettier config; client generated with `npm create vite` (react-ts); dev tools installed (eslint, typescript-eslint, prettier, vitest, typescript).
- **Review:** _to fill in_
- **Validation:** `npm run lint`, `npm run typecheck` and `npm test` all pass (no tests yet; `--passWithNoTests`).
- **Commit:** _not committed yet_

### P-004 — Phase 0 substep 0.3 (docs skeleton)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 0, step 3
- **Requirements:** none (docs)
- **Prompt (verbatim):**
  > Yes, 0.3
- **Output summary:** Added `README.md` skeleton and `docs/decisions/0001-architecture.md`.
- **Review:** _to fill in_
- **Validation:** Files exist; ADR content matches PLAN.md §1.
- **Commit:** _not committed yet_

### P-005 — Phase 0 substep 0.4 (CI workflow)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 0, step 4
- **Requirements:** none (process)
- **Prompt (verbatim):**
  > Yes, 0.4
- **Output summary:** Added `.github/workflows/ci.yml` running `npm ci`, lint, typecheck and test on every push and PR (Node 22).
- **Review:** _to fill in_
- **Validation:** Same three commands pass locally; the workflow itself can only be checked once the repo is pushed to GitHub (no remote yet).
- **Commit:** _not committed yet_

### P-006 — Phase 0 substep 0.5 (.env.example)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 0, step 5
- **Requirements:** none (setup)
- **Prompt (verbatim):**
  > Yes, 0.5
- **Output summary:** Added `.env.example` with `PORT`, `DATABASE_URL`, `JWT_SECRET` (placeholder) and `CLIENT_ORIGIN`. `.env` is already in `.gitignore`.
- **Review:** _to fill in_
- **Validation:** `git check-ignore .env` confirms `.env` is ignored; no real secret in the file.
- **Commit:** _not committed yet_
