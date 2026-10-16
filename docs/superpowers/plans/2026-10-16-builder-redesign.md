# Builder Portal-Aligned Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AV System Designer read and behave like the AV Portal family at desktop and mobile widths while preserving its diagram engine and file format.

**Architecture:** Keep the Zustand diagram state and one mounted React Flow instance. Reorganize only the toolbar and app shell; use local React state for a mobile library/canvas/inspector view, with CSS that maintains the canvas measurement when its tab is inactive. The existing LibraryPanel ＋ action signals the shell to show the canvas after adding a unit.

**Tech Stack:** React 19, TypeScript, React Flow, CSS, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-16-builder-cpq-redesign.md` §§공통 화면 언어, Builder 화면, 접근성·회귀 경계.

## Global Constraints

- Reuse the Portal/CPQ blue→purple mark, blue emphasis, light gradient background, translucent white cards and rounded controls. Keep Builder dark theme legible.
- Keep diagram JSON 1.2, autosave, shortcuts, button disabled conditions, connector/line colors, node geometry, drag/connect engine and export behavior unchanged.
- Do not change Portal products, builder-library generator or vocabulary. No new external UI library.
- Desktop target: brand/status header, grouped project/edit/view actions and library/canvas/inspector three-column workspace. Mobile target: explicit library/canvas/inspector tabs with a persistent React Flow instance.
- The 390px design must expose every action without covering the canvas; the 1280px design must keep the canvas as the primary area.

## Review Focus

1. A 390px first-time user can find a unit, press ＋ and see that unit in the canvas without a coordinate error; Task 2 owns the browser test.
2. A saved diagram opens on the mobile canvas without remounting or losing zoom; Task 2 owns the browser test.
3. A selected equipment/edge or issue remains reachable from the mobile inspector tab; Task 2 owns the browser test.
4. Dark theme leaves new cards, labels, disabled buttons and focus indicators legible; Task 3 owns the browser check.
5. 768px and 390px layouts show all export/view controls with no page-level horizontal overflow; Task 3 owns the browser test.

---

### Task 1: Portal shell and grouped toolbar

**Files:**
- Modify: `builder/src/components/Toolbar.tsx` (returned JSX only; retain handlers)
- Modify: `builder/src/styles.css` (root surface tokens, `.toolbar*`, `.workspace`, `.library-panel`, `.side-panel`)
- Create: `builder/e2e/workspace-design.spec.ts`

**Interfaces:**
- Consumes: the current `Toolbar` state/handlers and the existing `.app > .toolbar + .workspace` structure.
- Produces: `.toolbar-brand`, `.toolbar-group-project`, `.toolbar-group-edit`, `.toolbar-group-view` and existing action labels/handlers; Task 3 styles these classes.

- [ ] **Step 1: Write failing desktop semantics test.** In `builder/e2e/workspace-design.spec.ts`, add:

```ts
import { test, expect } from '@playwright/test';
import { library } from './fixture';
test('desktop presents Portal identity and grouped commands', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.goto('./');
  await expect(page.locator('.toolbar-brand').getByRole('link', { name: 'AV Portal' })).toBeVisible();
  await expect(page.locator('.toolbar-group-project').getByRole('button', { name: '내보내기' })).toBeVisible();
  await expect(page.locator('.toolbar-group-edit').getByRole('button', { name: '메모' })).toBeVisible();
  await expect(page.locator('.toolbar-group-view').getByRole('button', { name: '미니맵' })).toBeVisible();
  await expect(page.locator('.canvas')).toBeVisible();
});
```

- [ ] **Step 2: Run red test.** From `builder/`, run `npm run build` then `npx playwright test e2e/workspace-design.spec.ts`. Expect missing `.toolbar-brand` and grouped controls, not a startup/network error.
- [ ] **Step 3: Rewrap existing JSX without changing handlers.** In `Toolbar.tsx`, place the Portal link, mark, title/beta and status in `.toolbar-brand`; group the existing buttons by project/edit/view in `.toolbar-actions > .toolbar-group-*`. Put a visible heading or `aria-label` on each group. Preserve each existing `onClick`, `disabled`, `title` and `aria-pressed`. Keep file input outside the visible groups.

```tsx
<div className="toolbar-group toolbar-group-project" aria-label="프로젝트">
  <button type="button" onClick={confirmNew} disabled={!ready}>새 구성도</button>
  <button type="button" className="primary" onClick={exportFile} disabled={!ready}>내보내기</button>
</div>
<div className="toolbar-group toolbar-group-edit" aria-label="편집">
  <button type="button" onClick={state.undo} disabled={!state.past.length}>실행 취소</button>
  <button type="button" onClick={() => state.addAnnotation(center())} disabled={!ready}>메모</button>
</div>
<div className="toolbar-group toolbar-group-view" aria-label="보기">
  <button type="button" className={state.showMiniMap ? 'active' : ''} aria-pressed={state.showMiniMap} onClick={state.toggleMiniMap}>미니맵</button>
</div>
```

- [ ] **Step 4: Apply Portal shell styling.** In `styles.css`, add corresponding light/dark tokens for background wash, card fill/stroke/shadow and mark gradient. Make `.app` the page background, `.toolbar` a rounded two-row shell, `.workspace` a padded three-column layout and side panels rounded cards. Leave `.equipment-node`, handles and cable line styles unchanged.
- [ ] **Step 5: Run green checks and commit.** Run `npm run typecheck`, `npm run build`, `npx playwright test e2e/workspace-design.spec.ts`; expect pass. Commit only Task 1 files with `feat: align Builder shell with Portal`.

### Task 2: Mobile workspace tabs and add-to-canvas path

**Files:**
- Modify: `builder/src/App.tsx`
- Modify: `builder/src/components/LibraryPanel.tsx`
- Modify: `builder/src/styles.css`
- Modify: `builder/e2e/workspace-design.spec.ts`

**Interfaces:**
- `LibraryPanel({ onEquipmentAdded?: () => void })` calls the optional callback after the current `addEquipment` action; desktop callers may omit it.
- `App` owns `type MobileView = 'library' | 'canvas' | 'inspector'` locally. It passes `onEquipmentAdded={() => setMobileView('canvas')}` and uses `data-mobile-view` on `.workspace`.
- The React Flow provider and `<Canvas />` remain mounted across tab changes; state is never added to diagram JSON or autosave.

- [ ] **Step 1: Write failing mobile path tests.** Route `**/builder-library.json` to `library` from `./fixture` before `page.goto('./')`. Add tests with width 390 to `workspace-design.spec.ts`: tab buttons with `aria-selected`, only the active panel visible, click the first library unit's labeled ＋ button, see the canvas tab become selected and one equipment node visible, switch to inspector and back, then verify the node remains. A second test uses `diagramText([['cam', 0, 0]], [])` from `./fixture` and `page.addInitScript(({key,text}) => localStorage.setItem(key, text), {key:'av-portal-builder:current',text})` before navigation; it asserts the initial tab is canvas.

```ts
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('./');
await expect(page.getByRole('tab', { name: '라이브러리' })).toHaveAttribute('aria-selected', 'true');
await page.locator('.library-group .group-title').first().click();
await page.locator('.unit-item button[aria-label$="추가"]').first().click();
await expect(page.getByRole('tab', { name: '캔버스' })).toHaveAttribute('aria-selected', 'true');
await expect(page.locator('.react-flow__node')).toHaveCount(1);
```

- [ ] **Step 2: Run the new tests red.** `npm run build` then `npx playwright test e2e/workspace-design.spec.ts`; expect tab selector failure.
- [ ] **Step 3: Add local mobile view state and accessible tab controls.** In `App.tsx`, initialize the tab after library/autosave load to canvas if saved nodes exist, otherwise library. Render `<nav role="tablist" aria-label="작업 화면">` with the three explicit buttons, `aria-controls` and `aria-selected`; assign matching `id`/`role="tabpanel"` wrappers. Keep all three panel components mounted. Preserve the current desktop DOM order and `SidePanel` selection decision. Use a visible canvas size/ResizeObserver or `requestAnimationFrame` after the tab changes; do not run fitView on every switch (zoom must persist).
- [ ] **Step 4: Connect the ＋ callback.** Pass `onEquipmentAdded` from App through `LibraryPanel` to `UnitItem`; call after `addEquipment(...)`. Before placement, ensure the inactive canvas has a meaningful measured rectangle; when showing it, verify the new node is within the viewport. Keep drag/drop and desktop ＋ behavior unchanged.

```tsx
function UnitItem({ product, unit, onEquipmentAdded }: { product: LibraryProduct; unit: LibraryUnit; onEquipmentAdded?: () => void }) {
  const addAtCenter = () => {
    const bounds = document.querySelector('.canvas')?.getBoundingClientRect();
    const point = bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 3 } : { x: 400, y: 200 };
    addEquipment(unit.equipment, freePosition(builderStore.getState().diagram.nodes, flow.screenToFlowPosition(point)));
    onEquipmentAdded?.();
  };
  // existing item markup
}
```

- [ ] **Step 5: Add mobile CSS and rerun.** At the existing `max-width: 760px` media query, show the tab list and one panel at a time; keep inactive Canvas mounted with non-zero width/height and no pointer/focus exposure. Avoid `display:none` on the React Flow canvas if it causes width 0. Canvas visible height target is at least 60vh. Run typecheck, build and targeted E2E; commit `feat: add Builder mobile workspace tabs`.

### Task 3: Empty state, responsive polish and full regression

**Files:**
- Modify: `builder/src/App.tsx` or `builder/src/components/Canvas.tsx` (non-blocking empty hint)
- Modify: `builder/src/styles.css`
- Modify: `builder/e2e/workspace-design.spec.ts`
- Modify: `builder/README.md`, `builder/CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1 toolbar classes and Task 2 `data-mobile-view`/tabs.
- Produces: empty canvas help overlay with `pointer-events: none`, shown only while `diagram.nodes.length === 0`; no state/export changes.

- [ ] **Step 1: Write red empty/responsive tests.** Assert an empty canvas hint is visible on desktop and disappears after adding a unit; on 390 and 768 widths all three tab/action groups remain reachable, page `scrollWidth <= clientWidth + 1`, and toggling dark theme still leaves the canvas and tab labels visible. Use a browser screenshot for visual contrast rather than testing exact RGB values.
- [ ] **Step 2: Run red targeted E2E.** `npm run build && npx playwright test e2e/workspace-design.spec.ts`; expect the missing hint or responsive assertion to fail.
- [ ] **Step 3: Add hint and finish styling.** Put an absolutely positioned, non-interactive hint in `.canvas` or its wrapper. Complete button sizes, focus-visible outlines, card spacing, toolbar wrapping and dark token overrides; do not change node dimensions, cable colors or React Flow keyboard bindings.
- [ ] **Step 4: Update Builder docs.** In `builder/README.md` document grouped controls and mobile tab/add flow; in `builder/CHANGELOG.md` record a presentation-only change and preserved JSON compatibility.
- [ ] **Step 5: Verify and commit.** Run `npm run typecheck`, `npm test`, `npm run check:schema`, `npm run build`, `npm run e2e`; expect all pass. Run the root public tests and Pages checks on an LF checkout per `Work/빌더/README.md`. Capture empty and populated Builder at 1280/768/390, including dark theme. Commit `feat: polish Builder workspace responsiveness`.

## Integration and deployment gate

- Use a dedicated branch/worktree from latest `origin/main`; document the approved user instruction in the Builder `B-20261016-01` task file before implementation. Do not alter `Work/지시서.md` for this Builder task.
- Before PR, inspect changed files and `git diff --check origin/main...HEAD`; run Builder CI-equivalent checks and confirm existing Builder/CPQ workflow behavior. Ask for a whole-branch independent review if a reviewer is available; fix concrete findings.
- Rebase or merge latest main without force-push or mechanical resolution of generated assets. Confirm PR CI is green; merge within the user's standing approval, then wait for Pages and inspect public `/builder/` at 1280px and 390px.
