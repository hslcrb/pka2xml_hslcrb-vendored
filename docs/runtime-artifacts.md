# Runtime artifact provenance

Both engines were rebuilt from `main.cpp` and `include/pka2xml.hpp` after the
boundary and atomic-output fixes. Browser artifacts are checked in. The native
executable is a local build output: the historical 21.6 MB tracked executable was
removed, and `./setup.sh` builds a current executable for the target system.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `pka2xml` (local verification build) | 2,267,760 | `6b668365147705743a048f5e91614e914099a650cc163f89dada3f62cecfc23e` |
| `web/public/pka2xml.js` | 71,948 | `43bc91c9a63d4cc16223704ff049abae1e83f1ab50a93af5bba92072998daf46` |
| `web/public/pka2xml.wasm` | 687,563 | `aee14031e309f45b314328cb6cb4dc857bb60297ab253a6fc14852b8d68d5941` |

## Native executable

Built on Linux x86-64 with GCC 13.3.0, using the pinned Crypto++, RE2, and zlib
static archives listed in [dependencies](dependencies.md), then stripped of
debug symbols. The host has glibc 2.39. The executable still links the platform's
C/C++ runtime libraries; it is **not** a fully static, cross-platform release.
Rebuild with `./setup.sh` on the target system. Windows and macOS native builds
were not validated in this change.

The stripped executable passed all 23 native CLI, launcher, and topology
regression tests, including a real Packet Tracer fixture and byte-identical
round trips. See [native build](native-build.md) for reproducible commands.

## Browser engine

Built with Emscripten 6.0.13 through `web/build_wasm.sh`. Dependency source copies
and object files live in `.build/wasm/`, separate from native archives. Exception
handling is enabled. A bounded 1 MiB stack with overflow checks accommodates the
native file reader's 64 KiB buffer; leaving Emscripten's default stack caused a
reproduced failure during repeated conversions. Memory can grow to 512 MiB.

The worker limits browser input to 32 MiB and each request to 60 seconds. Four
real-engine worker tests cover repeated round trips, recovery from corrupt
inputs, command/path/size validation, and the distinct forge/nets arity. The
browser UI and Chromium checks are recorded in the final verification report.

Hash and byte-size differences across toolchain versions are expected; rebuild
and rerun the tests before distributing a changed artifact.
