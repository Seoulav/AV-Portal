# HDF-CCF Signal Flow Implementation Plan

**Task:** W-20261015-001 at main SHA 915e4bd4f6b2dcd032965853d68035a02643cbce.

**Goal:** Show the official manual's direct and hub scenarios with forward video/USB and reverse PD in the visual style of the public XDM-CTR100 PSE flow.

**Approach:** Keep the existing `extender` type and evidence-bound graph. Add an optional `cable-scenarios` layout with two scenario records. The existing validator checks node references, evidence, modes and reverse power. Inline the scoped SVG view in `detail-enhancement-view.mjs` because `verify-pages` has an exact module allowlist; only HDF-CCF selects this layout. Mirror validator, view and CSS to the prototype tree.

**Evidence:** The posted manual PDF page 5 (printed page 4) sets connector direction; PDF page 6 (printed page 5) shows both applications. Existing specs preserve the PD 100W versus length-dependent 90W/85W conflict.

**Checks:** Focused contract, SVG and selective-history tests; all product JSON validation; complete serial test suite; derived search index and snapshot checks; Pages verification; Playwright at 1280px and 390px including horizontal scroll, details, zoom and reverse arrow. After PR, integrate latest main, recheck CI, merge in Work-coordinated order and verify public Pages.

**Review risks:** Reverse power must be obvious. The hub route must reach an external hub and then HDMI display. The direct and hub modes must stay distinct. Other flows must keep their generic renderer behavior.
