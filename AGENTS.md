# Repository working guide

Read the user's instructions first. Work in a focused branch; ChatGPT-created branches start with `chatgpt/`. Commit coherent small changes using an English prefix and Korean subject, and publish each commit before continuing.

- Native engine: `main.cpp`, `include/`; build and launcher entrypoints remain at the root for compatibility.
- Desktop: `gui/`; conversion IPC and execution must remain typed and shell-free.
- Browser: `web/`; its own `AGENTS.md` requires the local Next.js documentation to be read before changing framework code.
- Brand and principles: `brand/`, `PHILOSOPHY.md`.
- Evidence and implementation history: `agent-brain/`, `docs/`, `tests/`.

Do not commit `.build/`, `.worktrees/`, test reports, `.next/`, or local dependency-install noise. Native libraries and WASM libraries must be built separately. Preserve third-party licenses and source pins. Keep the depth-one baseline distinction when reporting history.

Reproduce a bug before fixing it. Verify real conversion behavior, not just compilation. Never claim a binary, platform, deployment, or browser flow was tested without the corresponding result. Keep the README's support matrix aligned with the evidence.
