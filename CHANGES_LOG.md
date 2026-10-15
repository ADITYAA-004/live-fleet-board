# CHANGES_LOG — Live Fleet Board

This file traces every change made to the project. **Codex must update it after every task** (see `AGENTS.md` §6).
Append-only: never edit or delete old entries.

---

## Step Status

| # | Step | Status | Date done | Notes |
|---|------|--------|-----------|-------|
| 0 | Kickoff / read rules | ✅ Done | 2026-10-15 | Required docs read; project files moved into a dedicated repository folder. |
| 1 | Project structure + README | ⬜ Not started | | |
| 2 | Node.js simulator | ⬜ Not started | | |
| 3 | WebSocket server + minimal client | ⬜ Not started | | |
| 4 | React table (normal traffic) | ⬜ Not started | | |
| 5 | Sequence guard + latest-state map | ⬜ Not started | | |
| 6 | requestAnimationFrame render loop | ⬜ Not started | | |
| 7 | Auto burst + out-of-order + door transitions | ⬜ Not started | | |
| 8 | Honesty panel (measured metrics) | ⬜ Not started | | |
| 9 | Load/burst test + fixes | ⬜ Not started | | |
| 10 | DECISIONS.md + demo prep + transcript | ⬜ Not started | | |

Status values: ⬜ Not started · 🟨 In progress · ✅ Done · ❌ Blocked

---

## Deviations from spec / AGENTS.md

| Date | What deviated | Why | Where documented |
|------|---------------|-----|------------------|
| | | | |

---

## AI Suggestions Log
(Needed for the demo video: one incorrect or lazy AI suggestion and how it was handled.)

| Date | Step | What the AI suggested | Why it was wrong/lazy | How it was handled |
|------|------|-----------------------|-----------------------|--------------------|
| | | | | |

---

## Entry template (copy for each new entry)

    ### [YYYY-MM-DD HH:MM] Step N — <short title>
    **Prompt summary:** one line of what the user asked
    **Files created:** path — purpose
    **Files modified:** path — what changed and why
    **Files deleted:** path — why (or "none")
    **What changed (plain English):**
    **Why / design reasoning:**
    **Tests run & REAL results:** command → output summary (pass/fail)
    **Verified:** …   **Not verified:** …
    **Known issues / limitations:**
    **Deviations from spec:** none | describe
    **Next step:**

---

## Change Log (newest first)

<!-- Codex: add new entries directly below this line -->

### [2026-10-15 12:21] Step 0 follow-up — Make busfleet the project root
**Prompt summary:** Copy the project setup into the active `busfleet` workspace, initialize Git if needed, verify the copies, and create the workspace-ready commit.
**Files created:** `AGENTS.md`, `.gitignore`, `docs/SOURCE_OF_TRUTH.docx`, and the copied `docs/ai-transcript/` session log.
**Files modified:** `CHANGES_LOG.md` — added this entry naming `C:\Users\adity\OneDrive\Desktop\busfleet` as the project root because the earlier Codex session was opened on this folder.
**Files deleted:** none.
**What changed (plain English):** Copied the project files from `C:\Users\adity\Projects\live-fleet-board` into the active workspace without moving or overwriting anything, initialized Git in `busfleet`, and prepared the first commit.
**Why / design reasoning:** Keep all project work in the folder that Codex is already using, avoiding a workspace mismatch.
**Tests run & REAL results:** No application tests (no app code written). `git init` succeeded and `git rev-parse --is-inside-work-tree` returned `true`. `Get-FileHash -Algorithm SHA256` matched the source for `AGENTS.md`, `CHANGES_LOG.md`, `.gitignore`, `docs/SOURCE_OF_TRUTH.docx`, and every file under `docs/ai-transcript/` before this entry was added. The copied `CHANGES_LOG.md` hash intentionally changes after this requested entry.
**Verified:** Required file paths exist; original files remain in the Projects source folder; no destination conflicts were present; Git author identity is configured.
**Not verified:** Application behavior (not implemented in this task).
**Known issues / limitations:** The workspace copy of `CHANGES_LOG.md` differs from the source copy because this new workspace-root entry was requested.
**Deviations from spec:** None.
**Next step:** Continue future work with `C:\Users\adity\OneDrive\Desktop\busfleet` as the project root.

### [2026-10-15 12:13] Step 0 follow-up — Isolate project files from Downloads
**Prompt summary:** Move the project instructions, changelog, and source document into a dedicated live-fleet-board folder, initialize Git, and leave application code untouched.
**Files created:** `.gitignore` — ignore dependencies, build outputs, logs, and local environment files; `docs/ai-transcript/step-00-workspace-relocation-session-log.md` — accurate session log.
**Files modified:** `CHANGES_LOG.md` — added this entry and refreshed Step 0 status notes.
**Files deleted:** none; three project files were moved from Downloads to the repository.
**What changed (plain English):** Created `C:\Users\adity\Projects\live-fleet-board`, moved `AGENTS.md` and `CHANGES_LOG.md` to its root, moved the source document to `docs/SOURCE_OF_TRUTH.docx`, created `.gitignore`, and ran `git init`.
**Why / design reasoning:** Keep the project separate from Downloads and make the intended repository root explicit.
**Tests run & REAL results:** No application tests (no application code exists). `git init` succeeded. SHA-256 before/after move matched for all three files; source document hash: `07BCB28A5443A68BBD27322A493E38CD5DD4719BEC A670F7FC8D96866362DC03` (line break in display omitted); Git reported no commits yet and the expected project files as untracked.
**Verified:** Project root and docs file paths exist; `.git` exists; the files match their pre-move hashes; Downloads source paths are no longer present.
**Not verified:** The current Codex session has not been reopened with the new folder as its workspace; no project commit was made.
**Known issues / limitations:** `CODEX_PROMPTS.md` remains in Downloads at `C:\Users\adity\Downloads\CODEX_PROMPTS.md`; the user can paste Prompt 1 from that copy after opening the new project folder. No app source or README has been created.
**Deviations from spec:** None; added the `.gitignore` required by the original setup instructions.
**Next step:** Reopen Codex with `C:\Users\adity\Projects\live-fleet-board` as the project folder, verify the three required files, then paste Prompt 1.

### [2026-10-15 12:08] Step 0 — Read project rules and source of truth
**Prompt summary:** Read AGENTS.md, CHANGES_LOG.md, and docs/SOURCE_OF_TRUTH.docx; summarize scope and risks; mark Step 0 Done.
**Files created:** none
**Files modified:** C:\Users\adity\Downloads\CHANGES_LOG.md — recorded this task and updated Step 0 status.
**Files deleted:** none
**What changed (plain English):** Read the project rules and change log, and reviewed the available Live Fleet Board specification. No application code was written.
**Why / design reasoning:** Followed the user's no-code instruction and recorded the completed kickoff review.
**Tests run & REAL results:** none (documentation review only). Path checks: the workspace project files and expected docs/SOURCE_OF_TRUTH.docx were absent; the source candidate's DOCX text extraction completed successfully.
**Verified:** AGENTS.md and CHANGES_LOG.md were read from Downloads; source document text was read from C:\Users\adity\Downloads\Live_Fleet_Board_Project_Source_of_Truth.docx; Step 0 status entry updated.
**Not verified:** The source file's identity as the intended original was not independently confirmed; it is not present at the expected project path `docs/SOURCE_OF_TRUTH.docx`.
**Known issues / limitations:** The project repository and expected source-document path do not exist in the workspace.
**Deviations from spec:** Read the matching source document from Downloads because the expected project path was absent; did not copy or modify it.
**Next step:** Confirm/place the original source document at the expected project path before starting Step 1.

### [Project start] Step 0 — Planning files created
**Prompt summary:** Created AGENTS.md, CHANGES_LOG.md, and CODEX_PROMPTS.md from the Source of Truth document.
**Files created:** AGENTS.md, CHANGES_LOG.md, CODEX_PROMPTS.md
**Tests run & REAL results:** none (documentation only)
**Next step:** Step 1 — project structure + README
