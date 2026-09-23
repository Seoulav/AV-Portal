# First Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Run a local AV Portal browser that reads the private 338-item list and supports search, filters, and evidence display.
**Architecture:** A dependency-free Node HTTP server reads a path supplied at runtime. A browser UI uses the JSON API and renders with DOM APIs. The list is never checked into Git.
**Tech Stack:** Node.js 24, HTML, CSS, browser JavaScript, Node built-in test runner.
**Spec:** `Work/작업/W-20260923-003.md`

## Global Constraints

- Bind to localhost and keep the JSON outside Git.
- Preserve source_records and multiple categories.
- Never infer a manufacturer, verified specification, or source language.
- RTCOM research is outside this task; no external requests occur during loading.
- Builder and LED are external links only.

## Review Focus

- A missing or malformed input path must report a clear local error without exposing file contents.
- Duplicate IDs or missing row references must not silently produce misleading counts.
- Browser text and links from the JSON must not run scripts or accept unsafe URL schemes.
- A product with several categories must match any selected category while one brand is selected.
- A source without a URL must stay a text reference rather than become a fabricated link.

### Task 1: Data loader and local server

**Files:** `app/catalog.mjs`, `app/server.mjs`, `tests/catalog.test.mjs`, `tests/server.test.mjs`, `package.json`.
**Interfaces:** `loadCatalog(path)` returns the parsed catalog with validated products and source rows; `createAppServer({dataPath, publicDir})` returns a Node HTTP server.
- [x] Write tests for actual 338/342 data, duplicate IDs, excluded models, missing file, API and static routes.
- [x] Run `npm test` and confirm tests fail because the modules are missing.
- [x] Implement JSON validation, fixed routes, loopback listener, and useful error responses.
- [x] Run `npm test` until green.

### Task 2: Browser exploration and evidence display

**Files:** `app/public/index.html`, `app/public/styles.css`, `app/public/app.js`, `app/public/catalog-view.mjs`, `tests/catalog-view.test.mjs`, `README.md`, `Work/지시서.md`.
**Interfaces:** `filterProducts(products, {query, brand, categories})`, `listFacets(products)`, `safeHttpUrl(value)`.
- [x] Write tests for alias search, brand filter, multi-category OR, source count, and URL safety.
- [x] Run `npm test` and confirm the new behavior fails.
- [x] Implement responsive list, filter controls, product details, source links, direct references, missing states, and external Builder/LED links.
- [x] Run `npm test`, open the local page, check search/filter/details and error state, then update run instructions and progress record.
- [x] Run `git diff --check`, inspect Git status and only commit public app files and progress records.
