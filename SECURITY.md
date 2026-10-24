# Security and data handling

The supported web workbench processes files in a local Web Worker. The desktop renderer communicates through a restricted preload bridge; the main process starts the local converter without shell interpolation. Native and WASM conversion share the same source engine.

For a sensitive report, use GitHub's private vulnerability reporting for this repository if it is available. Otherwise contact the maintainer through the contact listed on their public GitHub profile. Do not attach private network configurations to public issues. A minimal synthetic input, affected commit, platform, and reproduction command are the most useful starting point.

Regular bugs can be reported with the issue template. There is no promised response SLA or separate long-term-supported release series. Report against a current commit and identify the exact version tested.

Historical `lambda/` server code is retained for reference and is not used by the current browser workbench. The old remote upload interface has been retired from the documentation entry page.
