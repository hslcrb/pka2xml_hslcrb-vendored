# Glass workshop — verification record

**Date:** 2026-10-23 · **Code and tests reviewed:** `9fba256324cee155bb9d88b0c56d3d7e77e0c136`

The native, desktop, and browser branches were merged into
`chatgpt/glass/integration` with merge commits. This report records observed
results, including integration failures found and corrected before handoff.

## Executed checks

| Check | Result | What it establishes |
| --- | --- | --- |
| Native CLI, launchers, topology | **24 passed** | Real fixture round trip, binary/Unicode paths, strict arguments, malformed data, aliases, interrupted output preservation, stale setup, missing desktop runtime, graph exceptions |
| Engine ASan/UBSan | **10 groups passed** | Short and oversized headers, declared lengths, trailing data, authentication, Base64 rejection, legacy header and version patch |
| Actual WASM worker | **4 passed** | Repeated byte-identical conversions, recovery, command/path/size rejection, forge/nets arity |
| Desktop process and policy tests | **8 passed** | Shell-free arguments, output preservation, cancellation/timeouts, path and trusted-frame policy |
| Actual Electron UI smoke | **11 checks passed** | Renderer → preload → IPC → source-built engine, real fixture round trip, dialog responses, clipboard, retry, responsive layout |
| Integrated Chromium production UI | **7 passed; 0 skipped, failed, or flaky** | Lazy introduction, actual worker, GUI downloads, stale-result reset, corrupt recovery, forge/nets, startup cancellation/retry, console download |
| Web lint and production build | **Passed** | Zero ESLint warnings, TypeScript, prerendered `/`, `/workbench`, and not-found route |
| Desktop lint and build | **Passed** | Zero lint warnings, TypeScript, renderer/main/preload bundles |

The final Chromium suite took **9.525 seconds**. This is one local test run,
not a benchmark or a promised conversion latency. The tests read downloaded
bytes and compare them with the source instead of treating a success label as
proof of a correct conversion.

## Environment and reproducible commands

Linux x86-64; Node.js **24.19.0**; GCC **13.3.0**; glibc **2.39**;
Emscripten **6.0.13**; Electron **30.5.1**; Chromium **153.0.8010.0**;
Playwright **1.62.1**. Exact dependency revisions are in
[dependencies.md](dependencies.md), and engine hashes are in
[runtime-artifacts.md](runtime-artifacts.md).

```sh
# Build the source engine and run native/launcher/topology + engine checks.
git submodule update --init --recursive
./setup.sh
make test
ASAN_OPTIONS=detect_leaks=0 make test-sanitize

# Exercise the actual checked-in browser engine.
node --test --test-isolation=none tests/wasm-worker.test.cjs
```

The final stripped source executable was separately checked with
`PKA2XML_BINARY=./pka2xml python3 -m unittest discover -s tests -p 'test_*.py' -v`.
The existing `B13_스7회.pka` decrypted exactly to its checked-in XML and survived
encryption/decryption. Its topology yielded **6 devices and 5 links**.

```sh
cd web
npm ci
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

`PKA2XML_CHROMIUM_EXECUTABLE` selects an already-installed Chromium. The test
configuration starts a local production server on port 3108, or uses
`PKA2XML_TEST_BASE_URL` when a server is already running.

```sh
cd gui
npm run lint
npm test
npm run build
npm run test:electron
```

The Electron integration script needs a prepared Electron runtime, a display
(Xvfb was used here), and Playwright. [The desktop guide](../gui/README.md)
documents the optional executable/module environment variables. Native file
dialog **responses** are controlled by the test; the renderer, bridge, IPC,
process execution, and generated files are real. The final run used the new
source-built engine, after an earlier run had used the inherited executable.

## Integration findings and their fixes

1. **Malformed native input could terminate conversion or damage output.**
   Strict arity, bounded binary reads, authenticated/decompression validation,
   and same-directory temporary output now produce explicit failure states.
   Existing output survives corrupt input and interrupted writes.
2. **Native source pins and setup behavior were incomplete.** `.gitmodules`
   now identifies exact upstream revisions. Default `make` builds locally,
   launchers preserve the caller's paths, and failed/stale setup cannot claim
   success. A final review added early guidance for a missing Electron runtime.
3. **Desktop command strings and renderer initialization were unreliable.**
   `execFile` receives validated argument arrays, the renderer uses six typed
   bridge methods, and destination selection uses a save dialog. Unsupported
   `GRAPH_MODE` was replaced by accurate topology-tool guidance.
4. **The browser could report script loading as engine readiness.** A dedicated
   lazy worker now owns initialization, fixed virtual paths, request IDs,
   conversion, cleanup, cancellation, and recovery. The GUI remains responsive
   while native code runs in the worker.
5. **The rebuilt native reader overflowed Emscripten's default stack.** A real
   repeated round-trip test failed with `table index is out of bounds`. The new
   reader uses a 64 KiB buffer; the default stack was also 64 KiB. An explicit
   bounded **1 MiB stack plus overflow checks** fixed the reproduced failure.
   All four real-engine worker tests then passed.
6. **Web operation contracts and result lifetime diverged from the CLI.** Forge
   now takes no input, nets/logs return captured text, and changing a file or
   mode clears prior results. Cancellation invalidates late completions.
7. **Typing a console command erased the last successful result.** Independent
   review caught that this made `download` impossible. Editing a command now
   preserves the result; a new conversion, file change, clear, or error resets
   it as appropriate. The integrated UI test types `ls` and `download` after
   conversion and checks the downloaded file.
8. **Topology export lost Korean names and assumed complete schemas.** The
   optional exporter now uses standard-library XML/DOT handling, escapes names,
   tolerates missing fields, distinguishes node IDs, and checks Graphviz errors.

The native author reviewed the browser worker/client independently. The desktop
author reviewed the native/desktop boundary. The integrator reviewed actual UI
behavior and added the final browser regression suite. Reported actionable
findings above were corrected before completion.

## Resource and experience observations

| Observation | Before / preparation | Final behavior |
| --- | --- | --- |
| Introduction engine requests | Converter and introduction shared the initial screen | **0** worker/engine requests on the introduction page |
| UI font payload | Full Pretendard Variable: 2,057,688 bytes | Shared renamed OFL subset: **106,472 bytes**, **94.8% smaller** |
| Web console | xterm plus two addons | Native accessible input and bounded history; three dependencies removed |
| Runtime execution | Main-thread browser integration | Dedicated worker, cancellation, 60-second request timeout |
| Native output in source control | Historical 21,590,152-byte executable | Generated locally from source; verified stripped build **2,267,760 bytes** |

The smaller native executable reflects rebuilding/stripping and is not evidence
of a corresponding execution-speed improvement. Native and WASM library objects
are separate, preventing one build target from poisoning the other's archives.
Browser traces observed no file-content POST/PUT requests. Electron smoke
observed no network requests or renderer exceptions.

## Screenshots

These are captures of the implemented production web app and actual Electron
app, not design mockups. Brand assets remain editable SVG.

| Introduction | Web workbench |
| --- | --- |
| [Full introduction](screenshots/web-introduction.jpg) | [Desktop-width workbench](screenshots/web-workbench.jpg) |
| [Mobile workbench](screenshots/web-mobile.jpg) | [Actual Electron workbench](screenshots/desktop-workbench.jpg) |

## Scope limits

Linux x86-64 and Chromium were tested. Windows/macOS native builds, other
browsers, AppImage installation/distribution, and production deployment were not
validated here. Electron's configured sandbox is enabled, but the root container
smoke needed a test-only `--no-sandbox` flag, so it does not establish OS sandbox
enforcement. LeakSanitizer was disabled because this container cannot inspect
processes; address/undefined-behavior checks remained active, and dependency
archives were ordinary optimized builds.

Browser input is limited to 32 MiB; the engine bounds plaintext/decompressed
output to 128 MiB. Tested real and synthetic fixtures do not establish support
for every Packet Tracer version. The web app processes files locally but is not
a service-worker offline-installable PWA. Initial source/dependency preparation
still needs the packages and toolchains described in the setup guides.
