# Native build and checks

The verified environment is Linux x86-64 with GCC and GNU Make. The CLI uses
POSIX file operations for safe same-directory replacement. Other operating
systems and packaged desktop runtimes need their own build and execution checks.

## Build from pinned dependency sources

Install a C++17 compiler, C compiler, GNU Make, Git, and Bash. Python 3 is needed
only for the regression suite. Then run:

```sh
git submodule update --init --recursive
./setup.sh
./run_cli.sh --help
make test
```

`make` builds locally and does not install into system directories. Crypto++, RE2,
and zlib are built from the recorded source revisions. libzip is retained as a
historical submodule but is not required by the converter. Build parallelism is
bounded to two jobs per dependency; override with `make JOBS=4` if appropriate.
The dependency build is offline once sources and compiler tools are present.
See [dependency provenance](dependencies.md) for exact revisions.

Alternatively, with system development packages for Crypto++, RE2, and zlib
already installed, run `./setup.sh --system`. `make pka2xml-static` requires static
system archives. Those alternatives remain available, but the current execution
evidence uses the pinned-source build. zlib must provide `uncompress2` (1.2.9+).

Setup rebuilds the executable and stops if any command fails. The launcher checks
source and binary checksums before running, so the historical tracked executable
or a stale success marker cannot silently stand in for a current source build.
Run setup again after updating sources or replacing the executable. The launchers
accept paths with spaces and preserve the CLI caller's working directory.

## Conversion behavior

All historical operations remain available: `-d`, `-e`, `-f`, `-nets`, `-logs`, and
`--forge`. `--help`/`-h` prints usage. Exit status is 0 for success, 1 for conversion
or I/O failure, and 2 for invalid arguments. Exactly one operation is required.

Input is read as binary. Output is created in a temporary file next to the
requested destination and renamed only after conversion and writing succeed.
Input/output aliases and non-regular output paths are rejected. Invalid input or
an interrupted write preserves an existing destination. A process killed while
writing may leave a `*.pka2xml-*` temporary file, which can be removed after the
process exits. This is atomic replacement, not a promise of durability through
a power loss. Newly created outputs use private file permissions.

The engine limits plaintext/decompressed output to 128 MiB and encoded input to
129 MiB. It checks authentication, short headers, the exact declared decompressed
size, trailing compressed data, and malformed log Base64. `-f` changes a version
tag; it does not guarantee that newer Packet Tracer features work in older
versions. Script-module conversion remains unimplemented.

## Verification scope

`make test` covers argument validation, binary and Unicode path round trips,
the real `B13_스7회.pka` fixture matching its checked-in XML, corrupt data, source
aliases, output failures, interrupted writes, launcher paths, and stale builds.
The engine suite also tests synthetic legacy version patching and synthetic
nets/logs data. These do not establish support for all Packet Tracer versions or
all real nets/logs variants.

```sh
make test-sanitize
```

This enables AddressSanitizer and UndefinedBehaviorSanitizer for the engine test
translation unit. Dependency archives are ordinary optimized builds. In a
container where LeakSanitizer cannot inspect processes, use
`ASAN_OPTIONS=detect_leaks=0 make test-sanitize`; this keeps address/undefined
behavior checks active while disabling leak detection.

System installation is explicit through the existing `*-install` targets.
Use `PREFIX` and `DESTDIR` to stage an install without writing system directories.

## Optional topology export

`python3 graph.py input.xml` writes `network.dot` and uses Graphviz `dot` to render
`network.png`. For a headless export with only Python's standard library, run
`python3 graph.py input.xml --no-render --dot "output network.dot"`. `--png` sets
the rendered image path. Korean/Unicode names are preserved and quoted for DOT;
unknown ports use fallback names. Unresolvable device references are skipped with
a warning. Activity files export the first `PACKETTRACER5/NETWORK`, matching the
historical script's selection. Rendering failures return a nonzero exit status
while leaving the DOT source available.
