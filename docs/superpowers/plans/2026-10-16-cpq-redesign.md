# CPQ Portal-Aligned Quote Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AV 견적 산출기 look and read like the AV Portal family, make its two entry choices obvious, and clarify the quote-editing hierarchy without changing calculations or exports.

**Architecture:** Reuse the current CPQ design tokens and React workspace state. Rearrange the existing JSX into start/file/edit/output groups, retaining the same handlers and disabled conditions; apply new CSS for empty and editing states. Keep the existing review → quote sheet → collapsible sections order and responsive table scroll.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-16-builder-cpq-redesign.md` §§공통 화면 언어, CPQ 화면, 접근성·회귀 경계.

## Global Constraints

- Reuse the existing Portal/CPQ blue→purple mark, blue emphasis, light gradient background, translucent cards and rounded controls; no new UI library or brand image.
- Preserve quote calculations, approved product/price data, JSON work-file format, 0/1/2 output grade meanings, Excel/PDF data, warning/export gate, button labels, disabled logic and file-selection callbacks.
- Preserve the editing document sequence: review summary, quote sheet, then collapsible supporting sections; keep the quote table's contained horizontal scroll on narrow widths.
- Keep official reference documents visible and reachable, but visually subordinate to the entry choices on the empty screen.
- At 390px and 1280px, the page must not have unwanted horizontal overflow; data tables may scroll inside their own wrappers.

## Review Focus

1. Missing or damaged startup resources still show the two entry buttons and an error explanation rather than an empty shell; Task 1 owns the browser test.
2. Reordering the entry choices does not create duplicate buttons, drop the direct-picker/JSON callbacks, or break `PortalDiagramInput`; Task 1 owns the browser test.
3. Work-file open/save, undo/redo and unsaved status retain their existing conditions when the document is empty or editing; Task 2 owns the browser test.
4. The output grade radio group retains the customer default, label association and Excel gate; Task 2 owns the browser test.
5. A long 390px quote and its expanded supporting sections remain readable via table-internal scrolling with no page-level horizontal overflow; Task 3 owns the browser test.

---

### Task 1: Portal shell and clear empty-state entry

**Files:**
- Modify: `cpq/src/app/App.tsx:378-405`, `cpq/src/app/App.tsx:510-575`
- Modify: `cpq/src/styles/tokens.css`, `cpq/src/styles/base.css`, `cpq/src/styles/workspace.css`
- Create: `cpq/tests/e2e/portal-workspace-design.spec.ts`

**Interfaces:**
- Consumes: `status.kind`, `resources`, `setEntry`, `ReferenceDocs`, `DiagramInput`, `ProductPicker` and existing `q-top/q-workspace/q-main` classes.
- Produces: `.q-start-workspace` on the existing `q-workspace` when `status.kind === 'empty'`, `.q-start-actions` containing one instance each of the two entry buttons, and `.q-start-intro` in the main empty state.

- [ ] **Step 1: Write red E2E tests.** In `portal-workspace-design.spec.ts`, use `mockResources` from `./fixtures` and assert exactly one button for each entry, their callbacks, a visible start heading and a visible but subordinate reference section; repeat with a missing required resource. Preserve the existing `workspace.spec.ts` error expectation.

```ts
import { test, expect } from '@playwright/test';
import { mockResources } from './fixtures';
test('empty quote emphasizes both entry paths without duplication', async ({ page }) => {
  await mockResources(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '견적 시작' })).toBeVisible();
  await expect(page.getByRole('button', { name: '구성도 JSON 열기' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '품목 직접 선택' })).toHaveCount(1);
  await page.getByRole('button', { name: '품목 직접 선택' }).click();
  await expect(page.getByText('승인된 카탈로그 1개 품목에서 고릅니다.')).toBeVisible();
});
```

- [ ] **Step 2: Run red E2E.** From `cpq/`, run `npm run build` and `npx playwright test tests/e2e/portal-workspace-design.spec.ts`; expect missing start heading, not fixture/startup failures.
- [ ] **Step 3: Reorder the shell and entry area.** In `App.tsx`, retain the existing `q-brand-lockup` and portal links but place app identity and company meta into a clear header hierarchy. Move `<ReferenceDocs />` after the workspace card (visible in both empty and editing states). On empty status, give the current workspace `q-start-workspace`, add heading/one-line descriptions around the two current entry buttons, and replace the large blank empty body with a compact `q-start-intro`. Do **not** duplicate the two buttons; keep them present even if startup resources failed, using the same disabled condition.

```tsx
<div className={`q-workspace${status.kind === 'empty' ? ' q-start-workspace' : ''}`}>
  {status.kind === 'empty' && <h1 className="q-start-title">견적 시작</h1>}
  <div className="q-start-actions">
  <button type="button" className="q-button" disabled={resources === undefined} onClick={() => setEntry('diagram')}>구성도 JSON 열기</button>
  <button type="button" className="q-button" disabled={resources === undefined} onClick={() => setEntry('picker')}>품목 직접 선택</button>
</div>
<div className="q-edit-tools" role="group" aria-label="편집">
  <button type="button" className="q-button" onClick={workspace.undo} disabled={!workspace.canUndo}>실행 취소</button>
</div>
</div>
<ReferenceDocs />
```

- [ ] **Step 4: Style the entry card and shared shell.** Use existing `--q-*` tokens; adjust spacing, card sizes and typography in `base.css`/`workspace.css`. Only add missing tokens to `tokens.css` if their Portal value is already evidenced by existing Portal/CPQ CSS. Do not modify validation colors or document preview dimensions.
- [ ] **Step 5: Run targeted E2E and commit.** Run typecheck, build and targeted E2E plus `workspace.spec.ts`; expect pass. Commit `feat: clarify CPQ start workspace`.

### Task 2: Editing toolbar groups and quote hierarchy

**Files:**
- Modify: `cpq/src/app/App.tsx:402-510`, `cpq/src/app/App.tsx:690-830`
- Modify: `cpq/src/styles/base.css`, `cpq/src/styles/workspace.css`
- Modify: `cpq/tests/e2e/portal-workspace-design.spec.ts`

**Interfaces:**
- Consumes: existing `workspace.undo/redo`, `handleSaveWorkFile`, `handleOpenWorkFileSelected`, `OUTPUT_GRADES`, `handleExcelDownload`, `exportGate`, `ReviewSummary`, `QuoteSheet` and `WorkspaceSection`.
- Produces: `.q-file-tools`, `.q-edit-tools`, `.q-output-tools` visual groups; the handler/grade interfaces are unchanged.

- [ ] **Step 1: Write red editing tests.** Open a mocked quote using the existing fixture pattern in `cpq/tests/e2e/responsive.spec.ts`. Assert review comes before the quote sheet, the quote sheet precedes supporting sections, grade `2 고객용` is checked and Excel respects the existing gate. Assert one work-file open/save button and working undo/redo after an edit; include unsaved status text.
- [ ] **Step 2: Run red targeted E2E.** `npm run build` then `npx playwright test tests/e2e/portal-workspace-design.spec.ts`; expect missing group/stage selectors.
- [ ] **Step 3: Rewrap current controls.** In `App.tsx`, group current work-file buttons, undo/redo and output radios/download under the produced classes. Keep every `onClick`, `onChange`, disabled expression, hidden file input, status/error message and current order of substantive quote components. Put an accessible group label on each group; do not add another download button.

```tsx
<div className="q-file-tools" role="group" aria-label="작업 파일">
  <button type="button" className="q-button" onClick={handleSaveWorkFile} disabled={status.kind !== 'editing' || pendingCableEdit}>작업 파일로 저장</button>
</div>
<div className="q-edit-tools" role="group" aria-label="편집">
  <button type="button" className="q-button" onClick={workspace.undo} disabled={!workspace.canUndo}>실행 취소</button>
</div>
<div className="q-output-tools" role="group" aria-label="출력">
  <div className="q-grade" role="radiogroup" aria-label="출력 등급">
    {OUTPUT_GRADES.map(grade => <label key={grade.value} className="q-grade-option"><input type="radio" name="output-grade" value={grade.value} checked={outputGrade === grade.value} onChange={() => setOutputGrade(grade.value)} />{grade.label}</label>)}
  </div>
  <button type="button" className="q-button q-primary" onClick={handleExcelDownload} disabled={resources === undefined || !exportGate(status, pendingCableEdit).allowed}>Excel 다운로드</button>
</div>
```

- [ ] **Step 4: Apply editing visual hierarchy.** In `base.css` and `workspace.css`, make the quote identity/save status a compact summary, the quote sheet the strongest work card, review issues readable above it and supporting sections quieter below. Keep table sizes/scroll and reference links intact. At mobile widths make start/file/output order obvious without a fixed overlay that covers form fields.
- [ ] **Step 5: Run targeted regression and commit.** Run `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/portal-workspace-design.spec.ts tests/e2e/workspace-navigation.spec.ts tests/e2e/work-file.spec.ts tests/e2e/download.spec.ts`; expect pass. Commit `feat: organize CPQ editing controls`.

### Task 3: Mobile polish, contrast and full regression

**Files:**
- Modify: `cpq/src/styles/base.css`, `cpq/src/styles/workspace.css`
- Modify: `cpq/tests/e2e/portal-workspace-design.spec.ts`
- Modify: `cpq/README.md` (document the entry and responsive behavior; CPQ has no CHANGELOG file).

**Interfaces:**
- Consumes: Task 1 start and Task 2 editing classes; no state/schema interface changes.
- Produces: stable 1280/768/390 layouts and documented design behavior.

- [ ] **Step 1: Write red responsive tests.** On 390 and 768 widths, check the start actions are both visible and 44px minimum touch targets, and check document-level `scrollWidth <= clientWidth + 1`; on an editing quote, confirm `.q-table-wrap` can scroll internally without overflowing the page. Reuse `mockResources` and `openTwoSystemQuote` logic from `responsive.spec.ts`; do not assert pixel-identical screenshots.
- [ ] **Step 2: Run targeted E2E red.** `npm run build && npx playwright test tests/e2e/portal-workspace-design.spec.ts`; expect missing class/touch-target assertions to fail.
- [ ] **Step 3: Final responsive CSS.** Balance control wrapping, card gutters, breadcrumb and document title at 390/768; keep focus-visible styles and sufficient text contrast. Avoid hiding reference documents, validation messages or output controls.
- [ ] **Step 4: Verify whole app.** Run `npm run typecheck`, `npm test`, `npm run audit:exports`, `npm run build`, `npm run test:e2e`. Capture empty and editing states at 1280/768/390; compare export file content before/after for the same fixture and confirm no JS errors. Run the root public tests, `node beta/verify-pages.mjs` and `node beta/build-search-index.mjs --check` on an LF checkout as the repository gate, even though no Portal product data is expected to change.
- [ ] **Step 5: Commit.** Commit `feat: finish CPQ responsive workspace styling` with only CPQ UI/tests/docs changed.

## Integration and deployment gate

- Use a dedicated implementation branch/worktree from latest main after the approved design and this plan are reviewed. Keep CPQ independent of the Builder plan so either app can be tested and reviewed without the other.
- Review the diff for calculation/format/data changes; there should be none. Run `git diff --check origin/main...HEAD`, targeted E2E and full CPQ checks, then an independent whole-branch review if a reviewer is available.
- Reintegrate latest main without force-push or mechanical generated-asset conflict resolution. Merge only after green PR CI and scope review, then wait for Pages and inspect public `/cpq/` at 1280px and 390px with an empty and a loaded quote.
