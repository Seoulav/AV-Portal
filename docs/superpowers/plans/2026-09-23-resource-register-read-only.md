# W-20260923-004 Resource Register Read-Only Connection Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Steps use checkboxes for tracking.

**Goal:** Show each catalog product's registered resources by kind, source, language, verification and applicability without publishing local paths or changing the existing catalog.
**Architecture:** A server-only adapter reads and validates the optional local register, joins by product/resource ID, and projects a strict public allowlist. A new GET endpoint provides one product's resources. The existing product detail fetches it only when opened and renders a separate section.
**Tech Stack:** Node.js built-in HTTP, fs and test runner; browser standard DOM; no dependencies or DB.
**Spec:** `Work/작업/W-20260923-004.md` at baseline `b9ca63e0b227a57de1a759f2b78fa0c1824ef329`.

## Global Constraints

- Keep 338 catalog products, 342 original rows, categories, filters and existing source display intact.
- Local inputs stay out of Git and are read only; RTCOM web research is prohibited.
- No file serving, raw local paths, raw input JSON, upload/editing, DB or final schema.
- No status may be translated into a stronger verification or applicability claim.
- Builder and LED remain external links.

## Review Focus

1. A register with duplicate or dangling IDs, mismatched reverse references, or conflicting duplicate associations must be unavailable while catalog search still works.
2. A resource title, URL, ID or unknown status containing a Windows/POSIX path must not leak into API, DOM or error messages.
3. HTTPS URLs with credentials and non-HTTPS schemes must remain plain text, not links.
4. A shared resource must appear once per product; explicit ko sorts before en without inferring missing language.
5. An absent register, valid empty product result and unreadable/malformed register must have distinct states.

## Task 1: Server Adapter and Contract

**Files:** create `app/resource-register.mjs`, `tests/resource-register.test.mjs`.
**Interface:** `loadResourceIndex(path, catalog)` returns an index with `resourcesFor(productId)` and counts; the server receives only projected fields.
- [ ] Write failing tests for valid shared resources, stable language order, safe projection, unknown enums, malformed relationships and paths.
- [ ] Run targeted test and confirm expected failure.
- [ ] Implement strict validation and projection without reading or modifying referenced files.
- [ ] Run targeted and existing tests.

## Task 2: GET Endpoint

**Files:** modify `app/server.mjs`, `tests/server.test.mjs`.
**Interface:** `createAppServer({dataPath, resourcePath, publicDir})`; GET `/api/products/:productId/resources` returns `{status, product_id, resources}`.
- [ ] Write failing endpoint tests for not_configured, available-empty, available-shared, 404, unavailable, and non-GET.
- [ ] Run targeted test and confirm expected failure.
- [ ] Implement route with generic errors, no raw paths, and independent catalog endpoint.
- [ ] Run server and full tests.

## Task 3: Product Detail Presentation

**Files:** modify `app/public/catalog-view.mjs`, `app/public/app.js`, `app/public/styles.css`, `tests/catalog-view.test.mjs`.
**Interface:** pure label/group functions feed safe DOM nodes; the detail requests resources on first open.
- [ ] Write failing view tests for kind grouping, unknown enum wording, ko-first order and safe URL behavior.
- [ ] Run targeted test and confirm expected failure.
- [ ] Implement detail section, state/error text, safe links and minimal styling.
- [ ] Run view and full tests; inspect browser with configured and unconfigured server.

## Task 4: Local Verification and Delivery

**Files:** modify `package.json`, `README.md`, `Work/지시서.md`; create `scripts/verify-resources-local.mjs`, `Work/기록/W-20260923-004-Work-인계.md`.
- [ ] Add local verification command that requires explicit private input paths and prints actual counts without hardcoding register totals.
- [ ] Run full tests plus both real-input verifiers; compare input SHA-256 before/after.
- [ ] Inspect configured/unconfigured browser, API responses, and repository diff for private data.
- [ ] Record only completed checks, commit, push, create PR, review mergeability and merge within user authorization.
