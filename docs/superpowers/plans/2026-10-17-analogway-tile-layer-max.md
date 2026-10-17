# Analog Way Tile Layer Maximum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show an evaluator-derived 4K60 mixing limit on each feasible Aquilon tile-mode model card.

**Architecture:** Add a pure helper to the existing `analogway-tile-guide.mjs` adapter that tries every supported per-group layer count through `calculateRecommendations` and reads the passing model's wall-wide layer count from its result. The shared Analog Way guide renderer calls it only for tile input and adds one line to feasible Aquilon cards. The existing feasibility result, model data, and other input modes stay intact.

**Tech Stack:** JavaScript ES modules, Node test runner, shared Portal detail renderer, headless Chrome visual check.

## Task 1: Evaluator-derived maximum

- [x] Add failing tests in `tests/w20261017-007-analogway-tile-limits.test.mjs` for 4×2 RS2=8, RS4=12, RS6=16; 2×2 RS alpha=4; 4×4 Cmax against repeated evaluator calls.
- [x] Run the tests and confirm the missing helper is the failure.
- [x] Implement the smallest helper in `beta/site/detail/analogway-tile-guide.mjs` and mirror it to `prototype/brc-am7/`; use only `prepareTileGuide` and the injected evaluator.
- [x] Run the focused tests to green.

## Task 2: Model card display

- [x] Add a tile-mode browser assertion for visible per-model limits, while the same cards in other modes retain their prior layout.
- [x] Add the limit line and short assumptions to `beta/site/detail/analogway-layer-guide.mjs`, mirror the generated source, and add minimal CSS if needed. Preserve current infeasible reasons.
- [x] Run the browser check at 1280px and 390px, inspect screenshots and horizontal overflow.

## Task 3: Record and review

- [ ] Record scope and verification in `Work/지시서.md` and `Work/기록/W-20261017-007-Work-인계.md`.
- [ ] Run the focused and full tests, `verify-pages`, search-index check, asset generation, and diff checks.
- [ ] Integrate latest `origin/main`, commit and push; open a Draft PR with 1280px and 390px captures for Work's independent review. Do not merge before that review.

**Resolved wording decision:** Work directs the cards to show split `2N` as a conversion from mixing N, citing the manual's pair rule (p. 66) and the simulator's exact 2× split setting. Tests directly call the evaluator for split values within the eight-per-group input range. Above that range, label split `2N` as a documented conversion rather than a directly evaluated result.
