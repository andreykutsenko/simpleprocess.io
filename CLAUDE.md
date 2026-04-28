# SimpleProcess.io — Cloudflare Pages deployment

Static mirror of the legacy Tilda site, deployed as a separate Cloudflare Pages project under the production domain `simpleprocess.io`.

## Stack
- Static HTML + Tilda-exported assets (`static.tildacdn.one/`, `thb.tildacdn.one/`, `neo.tildacdn.com/`).
- Cloudflare Pages Functions: `functions/api/contact.js` forwards form submissions to Telegram.
- Custom mailbox `sales@simpleprocess.io` is hosted on **Zoho Mail Free** (separate from Cloudflare Pages).

## Local
```bash
npm run dev          # serve on :8082
```
Pages Functions only run after deploy — local form posts will fail silently.

## Deploy
Requires `wrangler` and Cloudflare API access (env vars in `.env`, never commit).
```bash
npm run deploy
```

## Cloudflare resources
- Account: `57f2b31f16b4e1bd9988bd7e091b8a2a`
- Zone: `simpleprocess.io` (`51ec2e0bedd968d20bdf62438e4bcc5e`)
- Pages project: `simpleprocess-io`
- DNS hosted on Cloudflare (NS: `dean.ns.cloudflare.com`, `nancy.ns.cloudflare.com`)

## Required Pages env vars (Production)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Email
`sales@simpleprocess.io` → Zoho Mail Free. MX/TXT/DKIM records live in Cloudflare DNS.

<!-- repo-task-proof-loop:start -->
## Repo task proof loop

For substantial features, refactors, and bug fixes, use the repo-task-proof-loop workflow.

Required artifact path:
- Keep all task artifacts in `.agent/tasks/<TASK_ID>/` inside this repository.

Required sequence:
1. Freeze `.agent/tasks/<TASK_ID>/spec.md` before implementation.
2. Implement against explicit acceptance criteria (`AC1`, `AC2`, ...).
3. Create `evidence.md`, `evidence.json`, and raw artifacts.
4. Run a fresh verification pass against the current codebase and rerun checks.
5. If verification is not `PASS`, write `problems.md`, apply the smallest safe fix, and reverify.

Hard rules:
- Do not claim completion unless every acceptance criterion is `PASS`.
- Verifiers judge current code and current command results, not prior chat claims.
- Fixers should make the smallest defensible diff.

Installed workflow agents:
- `.claude/agents/task-spec-freezer.md`
- `.claude/agents/task-builder.md`
- `.claude/agents/task-verifier.md`
- `.claude/agents/task-fixer.md`

Claude Code note:
- If `init` just created or refreshed these files during the current Claude Code session, do not assume the refreshed workflow agents are already available.
- The main Claude session may auto-delegate to these workflow agents when the current proof-loop phase matches their descriptions. If automatic delegation is not precise enough, make the current proof-loop phase more explicit in natural language.
- TodoWrite or the visible task/todo UI is optional session-scoped progress display only. The canonical durable proof-loop state is the repo-local artifact set under `.agent/tasks/<TASK_ID>/`.
- Keep this workflow flat. These generated workflow agents are role endpoints, not recursive orchestrators.
- Keep this block in the root `CLAUDE.md`. If the workflow needs longer repo guidance, prefer `@path` imports or `.claude/rules/*.md` instead of expanding this block.
<!-- repo-task-proof-loop:end -->
