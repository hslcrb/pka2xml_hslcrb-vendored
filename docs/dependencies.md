# Dependency provenance

The native dependency directories are **Git submodules**, not complete source
copies embedded in this repository. A normal clone without submodule hydration
leaves these directories empty. The repository now supplies `.gitmodules` so
that Git can retrieve the exact commits already recorded in its tree.

| Directory | Upstream and exact pinned commit | Role |
| --- | --- | --- |
| `vendor/cryptopp` | [weidai11/cryptopp, b5242667a24e3db8e4600e77b2e502ef204e5280](https://github.com/weidai11/cryptopp/commit/b5242667a24e3db8e4600e77b2e502ef204e5280) | Twofish/CAST and EAX authenticated encryption; Base64 decoding |
| `vendor/re2` | [google/re2, 4be240789d5b322df9f02b7e19c8651f3ccbf205](https://github.com/google/re2/commit/4be240789d5b322df9f02b7e19c8651f3ccbf205) | Version-tag replacement for `-f` |
| `vendor/zlib` | [madler/zlib, f9dd6009be3ed32415edf1e89d1bc38380ecb95d](https://github.com/madler/zlib/commit/f9dd6009be3ed32415edf1e89d1bc38380ecb95d) | Compression and decompression |
| `vendor/libzip` | [nih-at/libzip, e04cda2b035ad49f4a9c3b12fc791411bd7f1e65](https://github.com/nih-at/libzip/commit/e04cda2b035ad49f4a9c3b12fc791411bd7f1e65) | Retained from the original tree; the current engine does not call libzip |

These commit IDs were checked against the corresponding upstream repositories.
They are source revisions, not claims that the libraries are their latest
release. Upstream license and notice files remain in each hydrated submodule;
preserve them when distributing dependency sources or binaries.

## Prepare sources while online

From the repository root:

```sh
git submodule update --init --recursive
git submodule status
```

Git checks out the recorded commits. To prepare a machine without a network,
copy an already hydrated checkout including the dependency source directories,
and provide the appropriate compiler and build tools separately. A source
archive of the top-level repository alone does not include submodule contents.

## Other supplied artifacts

The historical checkout includes a Linux `pka2xml` executable, desktop
`node_modules`, Python wheels, and prebuilt browser WebAssembly assets. Their
presence does not make every platform or source rebuild offline-ready. Binary
artifacts are specific to their architecture/runtime; JavaScript build tools,
Electron runtimes, Python ABI-compatible wheels, and Emscripten still need a
matching prepared environment. Rebuild and test the native engine on the target
platform instead of treating the historical executable as evidence for current
source behavior.
