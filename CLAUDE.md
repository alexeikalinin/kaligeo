# KaliGEO — Claude Instructions

## Session continuity (REQUIRED)

**At the START of every conversation:** Read `SESSION.md` before doing anything else.  
If the user says "продолжай", "continue", "где остановились" — SESSION.md is the source of truth.

**At the END of a conversation** (user says goodbye / closes topic): run `/handoff` to update SESSION.md.

## Project overview

Vanilla HTML/CSS/JS landing page for KaliGEO — AI search visibility audit service.  
Main file: `index.html`. Ideas backlog: `IDEAS.md`.  
Three design previews exist: `preview-premium.html`, `preview-editorial.html`, `preview-dark.html`.

## Auto-commit

Every Edit/Write is auto-committed via PostToolUse hook. No manual `git add/commit` needed.

## Key conventions

- Single-file architecture — everything in one HTML file
- No build tools, no npm
- Russian UI copy, English code
- Design tokens via CSS custom properties in `:root`
