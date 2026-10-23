# pka2xml — The transparent workshop

## Intent

Make the existing Packet Tracer conversion toolkit dependable, approachable, and easy to contribute to. Preserve its name, GPL-3.0 licensing, native command-line interface, and commitment to local processing. The user authorizes implementation, branch creation, and a push after every small commit.

## Architecture and scope

- C++ remains the shared conversion engine. Validate arguments and binary input, report useful failures, and avoid destroying source/output files on a failed conversion.
- Electron remains the desktop interface. Keep renderer privileges isolated; implement responsive conversion state, file dialogs, useful errors, and resource paths that survive packaging.
- Next.js remains the web interface. Separate a lightweight introduction at `/` from the interactive workbench at `/workbench`. Load the conversion engine only when needed, run it in a Web Worker, and permit repeated conversions without stale output.
- Preserve offline assets while describing exactly which dependencies are supplied and which require a prepared build environment. Do not claim unsupported operating systems or a complete offline build without verification.

## Brand and experience

Name: **pka2xml**. Theme: a transparent workshop for the networks inside your files. Refine the existing lightning/spark motif into a packet-shaped glass mark. Palette: ink `#17343B`, sea glass `#26766D`, mist `#BCE6DA`, blush `#E9AD9F`, and paper `#F5F4ED`. Blush adds warmth; teal identifies actions. Use restrained translucent surfaces, strong readable text, visible focus, reduced-motion support, and deliberate empty/error/success states.

The introduction explains what the tool does, how local conversion works, and where to begin. Show an honest interface preview; link to the working browser app and source/build instructions. Do not invent download releases or usage statistics.

## Branches and ownership

The shallow base is `master` at `bb58d79b`. Integrate on `chatgpt/glass/integration`. Child branches fork from this branch: `chatgpt/glass/core`, `chatgpt/glass/desktop`, and `chatgpt/glass/web`. Use isolated worktrees. Every commit uses an English prefix and Korean subject and is immediately pushed. Keep the default branch untouched until the completed change is reviewable in a pull request.

## Success criteria

1. Native round trips, invalid arguments, corrupt input, and output preservation have executable evidence.
2. Web production build, lint/type checks, real WASM round trips, error recovery, keyboard use, and mobile layouts are verified.
3. Desktop renderer and main-process builds pass; packaged-runtime limitations are explicitly recorded if the execution environment cannot launch Electron.
4. README, contribution guide, brand/philosophy, architecture, dependency provenance, and task/evidence records agree with the shipped code.
