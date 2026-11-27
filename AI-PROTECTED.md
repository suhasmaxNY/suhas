# SUHAS AI — Protected Module

Status: APPROVED BASELINE (2026-11-27)

## Production entry
- https://suhasny.pages.dev/ai/
- Legacy URL https://suhasny.pages.dev/assistant.html redirects to /ai/

## Dedicated frontend
All AI chat frontend files live under public/ai/:
- index.html — page structure
- style.css — AI-only styling
- app.js — chat, local history, search, voice dictation, read-aloud and assistant API client

The marketplace launcher is the only intended storefront integration point:
- public/app.js: #aiLaunch navigates to /ai/
- Keep AI page styles out of public/styles.css and do not modify marketplace layout to style AI.

## Backend boundary
src/worker.js currently owns /api/assistant together with other API routes. Keep this endpoint unchanged when editing unrelated routes. Extracting it later requires a separately reviewed refactor and tests.

## Protected snapshot
backups/suhas-ai-approved-2026-11-27/ stores the approved pre-isolation HTML, CSS, JS and Worker baseline. Never overwrite or delete it. Before major AI changes, create a new dated snapshot. Make AI UI changes only in public/ai/ after explicit user request.

## Regression checklist
1. /ai/ loads directly on mobile and desktop.
2. New Chat, local history persistence and history search work.
3. Messages call /api/assistant and errors remain visible.
4. Voice dictation and Read Aloud fail gracefully when unsupported.
5. Marketplace / still renders; AI launcher opens /ai/.
6. /assistant.html redirects to /ai/.
7. Do not describe voice as real-time two-way until streaming audio is implemented and tested.
