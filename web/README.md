# pka2xml web workshop

A Korean-first introduction and local Packet Tracer conversion workbench. Next.js renders the introduction at `/`; the interactive GUI and command console live at `/workbench`.

## Run locally

From this directory:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production build:

```bash
npm run build
npm run start
```

The checked-in `public/pka2xml.js` and `public/pka2xml.wasm` are generated engine assets. To rebuild them from the C++ source, follow the root build instructions and run `web/build_wasm.sh` in an Emscripten environment. The web npm dependencies and a prepared Emscripten/native toolchain are separate requirements.

## What runs where

- `/` is prerendered and does not request the conversion engine. Workbench links disable prefetching.
- The workbench waits until the first conversion before starting `converter.worker.js` and loading the engine.
- Input bytes stay in the browser. A worker owns the virtual filesystem and conversion; the UI receives bytes and logs.
- The worker supports cancellation and a bounded job lifetime. Each conversion starts with a fresh operation state. Changing the selected file, GUI mode, or output format clears the previous result.
- The page and engine assets must be available to load the application. This is not an installable offline PWA, and reloading requires those assets again.

No file contents are uploaded, and no external font CDN is used. `public/fonts/README.md` documents the self-hosted, renamed Pretendard UI subset and its OFL license. System fonts cover characters outside the bundled interface subset.

## Workbench operations

| Operation | Input | Output |
| --- | --- | --- |
| `-d` | `.pka`, `.pkt` | XML |
| `-e` | `.xml` | `.pka` or `.pkt` |
| `-f` | `.pka`, `.pkt` | Version-marker-patched copy |
| `-nets` | `nets`, `.nets`, `.txt` | Captured text |
| `-logs` | `.log`, `.txt` | Captured text |
| `--forge` | No input file | Authentication data |

The browser input limit is **32 MiB**. An extension check helps select the right operation; the engine validates the content. Packet Tracer format/version differences can still cause a conversion or subsequent import to fail. A version-marker patch does not implement compatibility for unsupported internal features.

The original file is never overwritten. Save the result using **결과 다운로드**. XML and decoded text results have a bounded 8 KiB plain-text preview; content is rendered as text, never HTML.

## Command console

Choose a file in the console's picker first; selecting it prepares a matching command. The input name in a command must match the selected file. Quotes support names containing spaces or Korean text:

```text
pka2xml -d "수업 자료.pka" "수업 자료.xml"
pka2xml -e "수업 자료.xml" "수업 자료.pka"
pka2xml -nets nets
pka2xml -logs session.log
pka2xml --forge auth.txt
```

`help`, `ls`, `download`, and `clear` are built-in commands. Up/down arrows recall command history. Editing the command or asking for help preserves the last successful result; executing another conversion clears it. Native inputs support Korean IME, clipboard use, screen readers, and mobile keyboards. This console does not execute a system shell or arbitrary processes.

## Verification

```bash
npm run lint
npm run build
npm run test:e2e
```

Playwright needs a browser installed (`npx playwright install chromium`) or the browser executable configured by the repository's test setup. Tests exercise actual browser conversion and download behavior, malformed input recovery, result invalidation, cancellation, command parsing, and responsive layouts. See the root verification record for the exact checks executed in the implementation environment.

Authored UI is in `app/` and `components/`; `lib/conversion.ts` contains the shared file/command contract, and `lib/useConversion.ts` owns UI lifecycle and stale-result protection. `lib/wasmLoader.ts` and `public/converter.worker.js` form the worker bridge. Only the generated Emscripten bundle is excluded from linting; the authored worker and loader are checked.
