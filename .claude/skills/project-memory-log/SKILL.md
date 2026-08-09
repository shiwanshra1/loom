---
name: project-memory-log
description: Maintains a running memory.txt log of every instruction, decision, and deliverable in this project so a new session can pick up exactly where the last one left off. Use this skill at the START of every conversation in this project — check project knowledge for an existing memory.txt and read it before doing anything else, even if the user hasn't mentioned memory. Use it again at the END of any substantive exchange (a new instruction was given, a decision was made, a file was produced) to append a new entry. Also trigger whenever the user says things like "remember this", "update the memory", "save this to memory", "catch me up", "what have we done so far", "what's the context so far", or asks Claude to recall something from a prior session in this project.
---

# Project memory log

A plain-text running log (`memory.txt`) of what has happened in this project, written so that restarting a session after days or weeks still starts with full context — without relying on Claude's background memory system, which the user can't see or edit directly.

This is a **manual, user-controlled** log, distinct from Claude's automatic memory. It exists because the user wants something explicit, readable, and versionable — a file they can open, edit, or hand to another tool (e.g. a coding agent in VS Code) directly.

## The core limitation to always respect

Claude cannot write directly into this project's knowledge files — they are read-only from Claude's side. Every time this skill produces an updated `memory.txt`, Claude must:
1. Create/update the file via the file tools.
2. Present it to the user.
3. **Explicitly remind them** to replace the old `memory.txt` in the project's knowledge files (or wherever they keep it) so the next session can find it. Don't skip this reminder — a file that's created but never re-uploaded is invisible next session, and the whole point of this skill is continuity.

## At the start of every conversation in this project

Before doing anything else:
1. Call `project_knowledge_search` with a query like `memory log project history` to check whether a `memory.txt` already exists in the project's files.
2. If found, read it fully. Use it to understand what's already been decided, built, or discussed — don't re-ask questions already answered in the log, and don't re-litigate decisions already made unless the user brings them up again.
3. Don't narrate this check out loud unless the user asks what Claude knows — just use the context naturally, the same way memory is applied elsewhere (see the memory_application_instructions in the system prompt: no "I see in the log that...", just proceed informed).
4. If no `memory.txt` exists yet, mention once, briefly, that none was found and offer to start one — don't create it unprompted the very first time unless the user has clearly asked for this skill to be active.

## What goes in an entry

Each session/checkpoint gets one dated entry. Keep entries **short and factual** — this is a log, not a transcript. Format:

```
## YYYY-MM-DD

**Requested:** one or two lines on what the user asked for
**Delivered:** files produced (names), decisions made, key numbers/choices locked in
**Open questions / next steps:** anything explicitly left unresolved for next time
```

Do not:
- Paste full documents or long content into the log — reference the filename, not the contents (the actual files already live in the project).
- Log routine back-and-forth (clarifying questions, minor wording tweaks) — only log what someone would need to know to pick the project back up.
- Include sensitive personal information beyond what's needed for project continuity.

## When to append a new entry

Append (don't overwrite) at natural checkpoints:
- The user gives a new substantive instruction or changes direction
- A deliverable is completed (a file created, a decision finalized)
- The user explicitly says to save/update memory
- The conversation is clearly wrapping up

Trivial exchanges (a single clarifying question, a typo fix) don't need their own entry — fold them into the entry for the surrounding piece of work.

## Keeping the file from growing unbounded

If `memory.txt` exceeds roughly 100 lines or a dozen dated entries, compact the oldest entries into a short "Earlier context" summary block at the top (3–5 lines covering what was established before), and keep full detail only for the most recent few sessions. Always tell the user when compaction happens, since it's a lossy step.

## Output format

`memory.txt` — plain text, no markdown rendering needed elsewhere, but markdown-style headers (`##`) are fine since they're readable either way and this may also be read by a coding agent.

## Example first entry (for a brand-new log)

```
# Forge Loom — Project Memory Log
# Manual continuity log — read this first, then check project files for full deliverables.

## 2026-08-09

**Requested:** Full system architecture + wireframes for Forge Loom (formerly Forge LMS), a multi-role LMS/execution platform. Stack: MERN + TypeScript, one app with role-based dashboards, target 5k-50k users.
**Delivered:** forge-loom-architecture.md (data model, auth, scaling, Citadel state machine, score engine), forge-loom-wireframes.md (textual screen specs for all 11 roles), forge-loom-local-to-cloud-migration.md (Docker local dev -> MongoDB Atlas + AWS/DigitalOcean/Render), forge-loom-screen-to-data-binding.md (maps user's own visual designs to the data model, flagged new schema fields needed: streaks/XP/sprint tasks/agendas).
**Open questions / next steps:** Achievements/Communities/Resources/Opportunities sidebar sections not yet speced (need decision: build now or stub as "coming soon"). Confirm whether XP/streaks feed into builderScore or stay cosmetic.
```

## When the user asks "what have we done so far" or similar

Answer from the log directly, in plain prose — don't dump the raw file contents at them unless they ask to see it verbatim.
