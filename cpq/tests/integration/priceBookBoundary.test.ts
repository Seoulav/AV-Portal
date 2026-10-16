import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { buildGuideBasis } from '@/data/catalog/guideBasis';
import { buildCatalog, type Catalog } from '@/data/catalog/load';
import { buildSalesDownload } from '@/export/internal/salesExportAction';
import {
  GUIDE_IDS,
  readGuideTemplate,
  type GuideId,
  type GuideManifest,
  type GuideTemplateSet,
} from '@/export/ooxml/guideTemplate';
import type { SharedNotes } from '@/export/shared/projection';
import { buildCustomerDownload, buildSharedDownload } from '@/export/variants/download';
import { prepareQuote, type PreparedQuote } from '@/export/variants/prepare';
import { pickedItemsToQuote } from '@/import/picker/toQuote';
import { catalogWithPriceBook, priceBookCostSession } from '@/services/price-book/apply';
import { emptySummary, type PriceBook } from '@/services/price-book/types';
import { internalLines } from '@/services/private-cost/calculate';

/**
 * 가격표 경계 (B-20261016-06).
 *
 * 가격표는 원가와 판매가를 함께 담는다. 판매가는 견적 행 단가로, 원가는
 * 영업팀용(0) 출력에만 가야 한다. 공개 품목 목록(`products.json`)에 **가짜**
 * 가격표를 붙여 0·1·2 세 등급을 실제로 만들어 본다.
 *
 * 원가 표식 `7654321`은 지어낸 값이다. 실제 원가 파일은 쓰지 않는다.
 */

const ROOT = resolve(__dirname, '../..');
const j = (name: string): unknown => JSON.parse(readFileSync(resolve(ROOT, 'data/approved', name), 'utf8'));
const manifest = (): GuideManifest =>
  JSON.parse(readFileSync(resolve(ROOT, 'templates/sanitized/guide-manifest.json'), 'utf8')) as GuideManifest;
const guide = (id: GuideId) =>
  readGuideTemplate(id, new Uint8Array(readFileSync(resolve(ROOT, `templates/sanitized/guide-${id}.xlsx`))), manifest());
const GUIDES: GuideTemplateSet = Object.fromEntries(GUIDE_IDS.map((id) => [id, guide(id)])) as GuideTemplateSet;
const BASIS = buildGuideBasis({
  laborItemsRaw: j('labor-items.json'),
  wageTableRaw: j('wage-table.json'),
  laborMappingsRaw: j('labor-mappings.json'),
  choice: { kind: 'guide', guide: GUIDES.pumsem },
});
const NOTES: SharedNotes = { supplierByRow: new Map(), salesRemarkByRow: new Map() };

const COST_SENTINEL = '7654321';
const SELLING = '1500000';

const baseCatalog = (): Catalog => buildCatalog(j('products.json'));

function pickProduct(catalog: Catalog) {
  return catalog.products.find((p) => p.quoteSpec === 'XDM-12')!;
}

function fakeBook(catalog: Catalog, sku: string): PriceBook {
  return {
    schemaVersion: 1,
    kind: 'four-sheet',
    catalogSourceSha256: catalog.sourceSha256,
    importedAt: '2026-10-16T00:00:00.000Z',
    entries: { [sku]: { cost: COST_SENTINEL, selling: SELLING } },
    summary: emptySummary(),
  };
}

function prepared(catalog: Catalog, sku: string): PreparedQuote {
  const document = pickedItemsToQuote(
    {
      header: { quoteNumber: 'PB-1', quoteDate: '2026-10-16', customer: '합성 고객', projectName: '가격표 경계', contact: '', conditions: [] },
      systems: [{ name: '회의실', items: [{ sku, quantity: '2' }] }],
    },
    catalog,
  ).document;
  return prepareQuote({
    document,
    laborReference: BASIS.reference,
    basisVersions: BASIS.versions,
    guides: GUIDES,
    profileBySystem: new Map(document.systems.map((s) => [s.systemId, 'general'])),
    importWarnings: [],
    wageMode: 'initialize-new',
  });
}

function allXml(bytes: Uint8Array): string {
  return Object.entries(unzipSync(bytes))
    .filter(([name]) => name.endsWith('.xml'))
    .map(([, b]) => strFromU8(b))
    .join('\n');
}

describe('가격표가 있을 때 — 판매가는 견적 행으로, 원가는 영업팀용에만', () => {
  const base = baseCatalog();
  const sku = pickProduct(base).sku;
  const book = fakeBook(base, sku);
  const catalog = catalogWithPriceBook(base, book);
  const p = prepared(catalog, sku);
  const item = p.document.rows.find((r) => r.type === 'item')!;

  it('견적 행 단가는 가격표 판매가다', () => {
    expect(item.type === 'item' && item.sellingUnitPrice).toBe(SELLING);
  });

  it('견적 문서(작업 파일로 저장되는 것)에 원가가 없다', () => {
    expect(JSON.stringify(p.document)).not.toContain(COST_SENTINEL);
  });

  it('고객용(2)·공유용(1) 파일에 원가가 없다', () => {
    const customer = allXml(buildCustomerDownload(p, GUIDES, BASIS.versions).bytes);
    const shared = allXml(buildSharedDownload(p, GUIDES, NOTES, BASIS.versions).bytes);
    expect(customer).not.toContain(COST_SENTINEL);
    expect(shared).not.toContain(COST_SENTINEL);
  });

  it('영업팀용(0) 파일에는 가격표 원가가 들어간다', () => {
    const session = priceBookCostSession(book, base)!;
    const lines = internalLines(
      p.document.rows.flatMap((r) =>
        r.type === 'item'
          ? [{ rowId: r.rowId, ...(r.sku !== undefined ? { sku: r.sku } : {}), name: r.name, specification: r.specification, unit: r.unit, quantity: r.quantity, ...(r.sellingUnitPrice !== undefined ? { sellingUnitPrice: r.sellingUnitPrice } : {}) }]
          : [],
      ),
      session,
    );
    expect(lines[0]!.costRegistered).toBe(true);
    const sales = allXml(buildSalesDownload(p, GUIDES, NOTES, lines, new Map(), BASIS.versions).bytes);
    expect(sales).toContain(COST_SENTINEL);
  });
});

describe('가격표가 없을 때 — 단가 미등록, 내려받기는 막지 않는다', () => {
  const base = baseCatalog();
  const sku = pickProduct(base).sku;
  const catalog = catalogWithPriceBook(base, undefined);
  const p = prepared(catalog, sku);

  it('견적 행 단가가 비어 있다 — 0이 아니다', () => {
    const item = p.document.rows.find((r) => r.type === 'item')!;
    expect(item).not.toHaveProperty('sellingUnitPrice');
    expect(p.blocking).toBe(true);
  });

  it('세 등급 모두 파일이 나온다', () => {
    expect(buildCustomerDownload(p, GUIDES, BASIS.versions).bytes.byteLength).toBeGreaterThan(0);
    expect(buildSharedDownload(p, GUIDES, NOTES, BASIS.versions).bytes.byteLength).toBeGreaterThan(0);
    expect(buildSalesDownload(p, GUIDES, NOTES, [], new Map(), BASIS.versions).bytes.byteLength).toBeGreaterThan(0);
  });
});
