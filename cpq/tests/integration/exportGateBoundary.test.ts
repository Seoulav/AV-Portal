import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildGuideBasis, type BasisVersions } from '@/data/catalog/guideBasis';
import {
  GUIDE_IDS,
  readGuideTemplate,
  type GuideId,
  type GuideManifest,
  type GuideTemplateSet,
} from '@/export/ooxml/guideTemplate';
import { prepareQuote, type PreparedQuote } from '@/export/variants/prepare';
import { pickedItemsToQuote } from '@/import/picker/toQuote';
import { buildCatalog } from '@/data/catalog/load';
import {
  buildCustomerDownload,
  buildSharedDownload,
  assertExportAllowed,
  ExportBlockedError,
} from '@/export/variants/download';
import { buildSalesDownload } from '@/export/internal/salesExportAction';
import type { SharedNotes } from '@/export/shared/projection';
import type { QuoteDocument } from '@/domain/quote/types';
import { fakeApprovedPrices } from '../fixtures/fakePrices';

/**
 * 공통 출력 경계 — 기준 불일치(가이드 템플릿·노임 판)인 prepared는 등급과
 * 무관하게 전부 거부한다(2026-10-05 독립 검토 지적: 화면 버튼의 disabled
 * 속성만이 유일한 방어선이면 안 된다).
 *
 * 2026-10-16 사용자 결정: 확인 항목이 남아도 내려받기(B-20261016-05). 전에는
 * 여기서 "`prepared.blocking`이면 세 등급 전부 거부"도 고정했다. 이제
 * blocking(구성도·품셈·계산 확인 항목)은 출력 경계가 막지 않는다 — 아래
 * 해당 시험은 "세 등급 모두 실제 바이트를 만든다"로 바뀌었다. 기준 불일치
 * 거부 시험은 그대로다.
 *
 * **실제 승인 카탈로그로 만든 prepared를 직접 호출한다** — UI/버튼을 전혀
 * 거치지 않는다. 그래야 "버튼이 막아서 호출이 안 된 것"과 "이 함수
 * 자신이 막은 것"이 섞이지 않는다.
 */

const ROOT = resolve(__dirname, '../..');
const j = (name: string): unknown => JSON.parse(readFileSync(resolve(ROOT, 'data/approved', name), 'utf8'));
const manifest = (): GuideManifest =>
  JSON.parse(readFileSync(resolve(ROOT, 'templates/sanitized/guide-manifest.json'), 'utf8')) as GuideManifest;
const guide = (id: GuideId) =>
  readGuideTemplate(id, new Uint8Array(readFileSync(resolve(ROOT, `templates/sanitized/guide-${id}.xlsx`))), manifest());
const allGuides = (): GuideTemplateSet => Object.fromEntries(GUIDE_IDS.map((id) => [id, guide(id)])) as GuideTemplateSet;

const EMPTY_NOTES: SharedNotes = { supplierByRow: new Map(), salesRemarkByRow: new Map() };

function realBasisVersions(): BasisVersions {
  return buildGuideBasis({
    laborItemsRaw: j('labor-items.json'),
    wageTableRaw: j('wage-table.json'),
    laborMappingsRaw: j('labor-mappings.json'),
    choice: { kind: 'guide', guide: guide('pumsem') },
  }).versions;
}

/**
 * 실제 승인 카탈로그의 **아직 확인하지 않은**(`confirmed: false`) 품셈 연결이
 * 붙은 품목으로 만든 문서 — 자연히 blocking이다. B-20261016-07부터 일부
 * 연결이 확인됐으므로 확인된 연결은 고르지 않는다.
 */
function unconfirmedPricedProduct() {
  const cat = buildCatalog(j('products.json'), fakeApprovedPrices());
  const mappings = (j('labor-mappings.json') as { mappings: { laborMappingId: string; confirmed: boolean }[] }).mappings;
  const unconfirmed = new Set(mappings.filter((m) => !m.confirmed).map((m) => m.laborMappingId));
  const product = cat.products.find(
    (p) => p.laborMappingId !== undefined && unconfirmed.has(p.laborMappingId) && cat.prices.has(p.sku),
  )!;
  return { cat, product };
}

function realPrepared(): PreparedQuote {
  const { cat, product: matrix } = unconfirmedPricedProduct();
  const document = pickedItemsToQuote(
    {
      header: {
        quoteNumber: 'GATE-1',
        quoteDate: '2026-10-05',
        customer: '합성 고객',
        projectName: '출력 경계 시험',
        contact: '',
        conditions: [],
      },
      systems: [{ name: '회의실', items: [{ sku: matrix.sku, quantity: '1' }] }],
    },
    cat,
  ).document;

  return prepareQuote({
    document,
    laborReference: buildGuideBasis({
      laborItemsRaw: j('labor-items.json'),
      wageTableRaw: j('wage-table.json'),
      laborMappingsRaw: j('labor-mappings.json'),
      choice: { kind: 'guide', guide: guide('pumsem') },
    }).reference,
    basisVersions: realBasisVersions(),
    guides: allGuides(),
    profileBySystem: new Map(document.systems.map((s) => [s.systemId, 'general'])),
    importWarnings: [],
    wageMode: 'initialize-new',
  });
}

describe('실제 승인 카탈로그 전제 확인', () => {
  it('미확인 품셈 연결이 붙은 실제 카탈로그 품목으로 만든 문서는 blocking이다', () => {
    // 이 전제가 깨지면(미확인 연결 품목이 남지 않거나 미확인이 막지 않으면)
    // 아래 시험들의 "자연히 blocking" 가정도 다시 봐야 한다 — 그래서 별도로
    // 확인해 둔다.
    expect(unconfirmedPricedProduct().product).toBeDefined();
    expect(realPrepared().blocking).toBe(true);
  });
});

describe('assertExportAllowed — 공통 출력 경계의 단일 게이트', () => {
  // 2026-10-16 사용자 결정: 확인 항목이 남아도 내려받기. blocking만으로는 던지지 않는다.
  it('blocking이어도 기준이 지금과 같으면 던지지 않는다', () => {
    expect(() => assertExportAllowed(realPrepared(), allGuides(), realBasisVersions())).not.toThrow();
  });

  it('blocking이고 템플릿 기준이 다르면 기준 불일치로 던진다 — blocking 허용이 기준 대조를 건너뛰지 않는다', () => {
    const p = realPrepared();
    const stale = { ...p, document: { ...p.document, versions: { ...p.document.versions, template: 'STALE' } } };
    expect(stale.blocking).toBe(true);
    expect(() => assertExportAllowed(stale, allGuides(), realBasisVersions())).toThrow(ExportBlockedError);
  });
});

/**
 * **"blocking 플래그만 보는 시험"으로는 부족하다**(2026-10-05 독립 검토
 * 재지적) — `blocking: false`인 `prepared`라도, **그 문서가 기록한
 * 가이드 템플릿 기준(`versions.template`)이 지금 넘겨받은 `guides`와
 * 다르면** 과거 한때는 유효했던 계산 결과를 지금 기준인 것처럼 출력하는
 * 셈이다. `assertExportAllowed`가 `guides`까지 받아 현재 기준과 직접
 * 대조하는지, 가짜 객체가 아니라 **실제 승인 카탈로그로 만든 prepared**를
 * 세 등급 함수에 직접 넘겨 확인한다.
 */
describe('과거에는 유효했던(blocking:false) prepared도 지금 guides와 템플릿 기준이 다르면 거부한다', () => {
  function withStaleTemplate(): PreparedQuote {
    const p = realPrepared();
    return {
      ...p,
      blocking: false, // 이 시험은 blocking이 아니라 basis 정합만 가린다.
      document: {
        ...p.document,
        versions: { ...p.document.versions, template: 'STALE-TEMPLATE-FINGERPRINT-시험용' },
      },
    };
  }

  it('고객용(2단계)이 거부한다', () => {
    expect(() => buildCustomerDownload(withStaleTemplate(), allGuides(), realBasisVersions())).toThrow(
      ExportBlockedError,
    );
  });

  it('공유용(1단계)이 거부한다', () => {
    expect(() =>
      buildSharedDownload(withStaleTemplate(), allGuides(), EMPTY_NOTES, realBasisVersions()),
    ).toThrow(ExportBlockedError);
  });

  it('영업팀용(0단계)이 거부한다', () => {
    expect(() =>
      buildSalesDownload(withStaleTemplate(), allGuides(), EMPTY_NOTES, [], new Map(), realBasisVersions()),
    ).toThrow(ExportBlockedError);
  });

  it('템플릿 기준이 지금 guides와 같으면(정상 경로) 통과해 실제 바이트를 만든다', () => {
    const p = { ...realPrepared(), blocking: false };
    const file = buildCustomerDownload(p, allGuides(), realBasisVersions());
    expect(file.bytes.length).toBeGreaterThan(0);
  });
});

// 2026-10-16 사용자 결정: 확인 항목이 남아도 내려받기(B-20261016-05).
// 전에는 이 묶음이 "blocking인 prepared는 0/1/2 세 등급 전부가 거부한다"였다.
// 확인 필요 표시(0·1 있음, 2 없음)와 값 칸 처리는 `exportUnblocked.test.ts`가 본다.
describe('blocking인 prepared도 0/1/2 세 등급 모두 실제 바이트를 만든다 — UI를 거치지 않고 직접 호출', () => {
  it('고객용(2단계)이 만든다', () => {
    const p = realPrepared();
    expect(p.blocking).toBe(true);
    expect(buildCustomerDownload(p, allGuides(), realBasisVersions()).bytes.length).toBeGreaterThan(0);
  });

  it('공유용(1단계)이 만든다', () => {
    const p = realPrepared();
    expect(buildSharedDownload(p, allGuides(), EMPTY_NOTES, realBasisVersions()).bytes.length).toBeGreaterThan(0);
  });

  it('영업팀용(0단계)이 만든다', () => {
    const p = realPrepared();
    expect(
      buildSalesDownload(p, allGuides(), EMPTY_NOTES, [], new Map(), realBasisVersions()).bytes.length,
    ).toBeGreaterThan(0);
  });
});

/**
 * **템플릿 지문과 노임(wage) 지문은 별개다**(2026-10-05 독립 검토 재지적) —
 * "UI가 새 prepared를 안 만든다"는 것만으로는 공통 함수가 받는 stale
 * prepared를 직접 방어하는 것을 대체하지 못한다. 여기서는 **합성
 * 입력으로, 처음부터 blocking:false인(품셈과 무관한 'not-applicable'
 * 행) prepared 둘을 노임 기준만 다르게 만들어** — 단순히 애초에
 * blocking:true인 실 카탈로그 자료로 거부를 증명하지 않는다.
 */
describe('노임(wage) 기준 — 템플릿과 별개로 공통 출력 경계에서 재확인한다', () => {
  const FIXED_LABOR_LABEL = 'LABOR-합성고정';

  function syntheticPreparedWithWage(wage: string): PreparedQuote {
    const catalog = buildCatalog(
      {
        schemaVersion: 1,
        generatedOn: '2026-10-05',
        sourceSha256: 'b'.repeat(64),
        products: [
          {
            productId: 'SYN-0001',
            sku: 'SYN-0001',
            brand: '',
            model: 'SYN',
            quoteName: '합성 품목',
            quoteSpec: 'SYN-SPEC',
            unit: 'EA',
            options: {},
            currency: 'KRW',
            evidence: 'verified',
          },
        ],
      },
      {
        schemaVersion: 1,
        generatedOn: '2026-10-05',
        sourceSha256: 'b'.repeat(64),
        currency: 'KRW',
        prices: { 'SYN-0001': { sellingUnitPrice: '100000', currency: 'KRW' } },
      },
    );

    const picked = pickedItemsToQuote(
      {
        header: {
          quoteNumber: 'WAGE-GATE-1',
          quoteDate: '2026-10-05',
          customer: '합성 고객',
          projectName: '노임 기준 경계 시험',
          contact: '',
          conditions: [],
        },
        systems: [{ name: '시스템1', items: [{ sku: 'SYN-0001', quantity: '1' }] }],
      },
      catalog,
    ).document;

    // 품셈과 무관하게 genuinely blocking:false를 만든다 — 'not-applicable'은
    // 노무비에 0을 기여하는 기존 동작 그대로이며, 품셈 연결(mapped)이
    // 아니므로 confirmed:false 정책의 mapping-unconfirmed 차단과 무관하다.
    const document: QuoteDocument = {
      ...picked,
      rows: picked.rows.map((r) =>
        r.type === 'item'
          ? { ...r, laborMode: 'not-applicable' as const, overrideReason: '합성 시험 — 노무 해당 없음' }
          : r,
      ),
    };

    return prepareQuote({
      document,
      laborReference: {
        items: [],
        mappings: [],
        wages: { wageTableId: 'SYN-WAGE', periodLabel: '합성 시험', source: '합성 시험', wages: {} },
      },
      basisVersions: { labor: FIXED_LABOR_LABEL, wage },
      guides: allGuides(),
      profileBySystem: new Map(document.systems.map((s) => [s.systemId, 'general'])),
      importWarnings: [],
      wageMode: 'initialize-new',
    });
  }

  it('합성 입력 전제 확인 — 노임 기준이 달라도 둘 다 genuinely blocking:false다', () => {
    expect(syntheticPreparedWithWage('WAGE-OLD').blocking).toBe(false);
    expect(syntheticPreparedWithWage('WAGE-NEW').blocking).toBe(false);
  });

  it('템플릿은 같되 노임 기준이 지금 채택과 다른 과거 prepared는 세 등급 전부 거부한다', () => {
    const stale = syntheticPreparedWithWage('WAGE-OLD');
    const currentlyAdopted: BasisVersions = { labor: FIXED_LABOR_LABEL, wage: 'WAGE-NEW' };

    expect(() => buildCustomerDownload(stale, allGuides(), currentlyAdopted)).toThrow(ExportBlockedError);
    expect(() => buildSharedDownload(stale, allGuides(), EMPTY_NOTES, currentlyAdopted)).toThrow(
      ExportBlockedError,
    );
    expect(() =>
      buildSalesDownload(stale, allGuides(), EMPTY_NOTES, [], new Map(), currentlyAdopted),
    ).toThrow(ExportBlockedError);
  });

  it('지금 채택된 노임 기준과 같은 최신 prepared는 통과해 실제 바이트를 만든다', () => {
    const fresh = syntheticPreparedWithWage('WAGE-NEW');
    const currentlyAdopted: BasisVersions = { labor: FIXED_LABOR_LABEL, wage: 'WAGE-NEW' };

    const file = buildCustomerDownload(fresh, allGuides(), currentlyAdopted);
    expect(file.bytes.length).toBeGreaterThan(0);
  });
});
