# W-20260929-006 RTCOM Public Sync Implementation Plan

**Spec:** `Work/작업/W-20260929-006.md`

**Goal:** Preserve the RTCOM public feed as an atomic last-known-good snapshot and render it through AV Portal's existing home, search, detail, static catalog, PDF viewer, and deployment flows without changing the existing 240 detail records.

**Global constraints:**

- RTCOM remains the sole source. Stored JSON bytes are not rewritten.
- A candidate set is promoted only after index, every allowed detail, and every referenced image validate.
- A failed candidate leaves the live snapshot byte-for-byte unchanged.
- Product count is derived from the feed. The observed count 32 is never a validation constant.
- Block `HS-88M-U`, `HS-88MX`, `HD-D104U`, and `HD-D108U`.
- Existing `beta/site/catalog.json`, `beta/site/detail/data/*.json`, and existing detail images remain unchanged.
- Normal home loading uses at most three data requests: AV catalog, RTCOM index, combined search index.
- Tests precede production changes and each RED failure is recorded in the execution ledger.

## Task 1: Define adapter and feed validation contracts

**Tests first:** Add `tests/rtcom-adapter.test.mjs` for feed schema validation, dynamic product count, excluded model filtering, `rtcom-<id>` slugs, collision rejection, catalog mapping, detail mapping, local image base, related links, official RTCOM source link, and document URL mapping.

**Implementation:** Add browser/Node shared `beta/site/shared/rtcom-adapter.mjs`. It must be pure and perform no network or file writes.

**Expected:** `node --test tests/rtcom-adapter.test.mjs` fails before the module exists and passes after the minimal adapter is implemented.

## Task 2: Build atomic last-known-good synchronization

**Tests first:** Add `tests/rtcom-sync.test.mjs` using a local in-memory fetch fixture. Cover successful staging/promotion, raw byte SHA preservation, deterministic no-change rerun, unreachable index, missing detail, missing image, excluded product handling, slug collision, and rollback after a promotion error.

**Implementation:** Add `beta/sync-rtcom.mjs`. Resolve `detailPath` and `imagePath` from the index, write the candidate outside the live directory, validate it, then promote it. Store exact `raw/index.json`, exact `raw/products/<id>.json`, images, and deterministic `SYNC.json`. Support `--check` and dependency injection for tests.

**Expected:** the focused test fails because the sync module is absent, then passes. A failed sync leaves the previous snapshot hash unchanged.

## Task 3: Fetch and commit the initial public snapshot

**Precondition:** Tasks 1–2 pass.

**Action:** Run `node beta/sync-rtcom.mjs` against the public source. Verify the response index SHA equals the stored raw file SHA, all allowed details and referenced images exist, failures are zero, and a second run produces no diff.

**Expected:** observed product count comes from the feed, currently 32; `SYNC.json` records source counts, exclusions, and file SHA/byte metadata without a volatile timestamp.

## Task 4: Integrate home, search index, and readable catalogs

**Tests first:** Extend search and readable-catalog tests to require RTCOM items, preserve the existing AV-only result sets for the 20 regression queries, enforce the three-data-request path, and prove fallback when the RTCOM snapshot or combined index is absent/damaged.

**Implementation:**

- Load the stored RTCOM index beside `catalog.json` and merge adapted items in memory.
- Extend `beta/build-search-index.mjs` with a stable composite source hash and adapted RTCOM detail entries.
- Extend `beta/build-readable-catalog.mjs` to include adapted RTCOM entries without altering `catalog.json`.
- Add the `RTCOM Matrix Configurator` card to home section 03.

**Expected:** `node beta/build-search-index.mjs --check` is deterministic; `catalog.html` and `llms.txt` list existing catalog items plus dynamic RTCOM items; existing AV search output is identical.

## Task 5: Integrate RTCOM detail and external PDF viewing

**Tests first:** Add renderer/model tests for dynamic RTCOM loading, `presentation.imageBase`, the exact `알티컴 제품정보에서 자세히 보기 ↗` header link, related `rtcom-` links, omitted RTCOM-only advanced cards, and same-origin RTCOM PDF actions opening in PDF.js without a local copy.

**Implementation:**

- Update the prototype detail source, then sync generated detail assets.
- For `rtcom-<id>`, read the stored raw detail and pass it through the shared adapter.
- Resolve RTCOM images from the synchronized image set.
- Treat the trusted RTCOM Pages PDF path as a PDF.js source while leaving other external documents as new-tab links.

**Expected:** existing product rendering remains byte/data compatible and RTCOM products use the same 01–07 card renderer.

## Task 6: Extend artifact verification and automation

**Tests first:** Add tests for Pages artifact RTCOM validation and workflow structure: daily schedule, `workflow_dispatch`, no-change exit, changed-only PR, validation before merge, and explicit Pages dispatch after an automated merge.

**Implementation:**

- Extend `beta/verify-pages.mjs` to validate the synchronized manifest, raw hashes, dynamic count, details, images, excluded models, and slug collisions while keeping the existing 240 checks.
- Add `.github/workflows/sync-rtcom.yml` with daily and manual triggers. It syncs and regenerates derived files, creates no PR on no change, validates before PR creation, merges the validated PR under the standing rule, and dispatches the Pages workflow.
- Add README/AGENTS regeneration and operational notes.

**Expected:** focused tests pass; the workflow has only repository-scoped write permissions needed for branch/PR/dispatch operations.

## Task 7: Browser, failure, and deployment verification

**Action:** Add/run a browser verification script against the local static server. Capture `xdm`, `hd-210u`, `xdm-ctr100`, and `hoc-ux`, plus home searches `HDMI` and `RTCOM`, at 1280px and 390px. Verify all RTCOM source links, at least one RTCOM PDF popup and download URL, the configurator card, zero console errors, and no 390px horizontal overflow. Re-run failure fixtures and compare the live snapshot hash.

**Expected:** captures and a machine-readable report under `Work/기록/W-20260929-006-*`; no existing product data files change.

## Task 8: Full verification, implementation record, PR, merge, and public check

**Action:** Run `npm test`, `node beta/verify-pages.mjs`, `node beta/build-search-index.mjs --check`, readable-catalog regeneration/check, `git diff --check`, and existing 240 file/search hash comparisons. Record deviations, risks, and rollback. Request one fresh whole-branch review, resolve Critical/Important findings with RED→GREEN tests, then create the implementation PR.

**After merge:** Confirm Pages deployment, run the sync workflow manually once, verify that an unchanged feed creates no PR, and check the public representative pages and links.

**Expected:** all checks pass, implementation PR is merged under the user's explicit authorization, Pages succeeds, and the manual sync run reports no change unless the RTCOM source changed after the committed snapshot.

## Review focus

- Atomicity on Windows and Linux, especially failure between backup and promotion.
- Raw-byte preservation versus parsed adapter data.
- Cross-origin behavior in local preview versus same-origin GitHub Pages PDF loading.
- GitHub `GITHUB_TOKEN` event behavior after workflow-created PR merge and explicit Pages dispatch.
- Search fallback when one of the three data files is absent or stale.
- No accidental edits to existing 240 detail JSON files or `catalog.json`.
