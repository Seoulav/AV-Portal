/**
 * 구성도 연결선 → 케이블 행 (계획 2026-10-04 Task 4, 결정 D8 규칙 1).
 *
 * ## 완제품과 벌크를 다르게 센다 (설계서 §7.4)
 *
 * **완제품**은 구간당 한 벌이다. `HDMI 5m` 두 구간은 **2EA**지 10EA가 아니다.
 * 길이는 판매되는 계단(`1·2·3·5·7·10·15·20m`)으로 **올린다**.
 *
 * **벌크**는 길이를 합산한 뒤 10M 단위로 올린다. `12m + 15m = 27m → 10M × 3`.
 *
 * ## 선은 있는데 케이블 품목이 없으면
 *
 * 실물 샘플이 그렇다 — `edges[].data.bomRows`가 전부 비어 있다.
 * 선을 무시하면 **케이블 없는 견적**이 나간다. 선 종류별로 행을 만들되
 * 수량을 비우고 확정을 막는다 (설계서 §7.5).
 *
 * ## 구간 거리(`RouteInput`) — 있으면 쓰고, 없으면 기존 그대로다
 *
 * `routes`(edgeId → `RouteInput`)는 설치 패널에서 사람이 입력한 실측
 * 거리다(`domain/quote/installation.ts`의 `calcRouteMeters` — 결정
 * D8: measured-route는 `(수평+입상+입하)×1.3`, confirmed-total은
 * 재보정 없이 그대로). 아직 입력하지 않은 구간은 이 맵에 없고, 그
 * 구간은 지금처럼 `bomRows[].length`(원본 값, 실물 샘플에서는 거의
 * 늘 비어 있다)를 그대로 쓴다 — **경로 입력이 없다고 제품 길이로
 * 거리를 역산하지 않는다.**
 *
 * 경로 거리가 있으면:
 * - **벌크**는 그 거리를 합산에 쓴다(보정 전 원본 길이 대신).
 * - **완제품**은 그 거리로 다시 계단을 구하고, **원래 맞은 제품과 같은
 *   품셈 묶음(`options.group`)에서 그 계단 길이의 SKU를 다시 찾는다.**
 *   `BOM.length`(제품 규격)는 바꾸지 않는다 — 찾아낸 제품의 SKU·규격·
 *   가격을 통째로 쓴다. 그 길이의 제품을 묶음에서 찾지 못하면 **확인
 *   필요로 남긴다** — 기존 SKU에 새 길이 글자만 붙이지 않는다.
 */
import type { DecimalText } from '../../domain/quote/types';
import type { Catalog, CatalogProduct } from '../../data/catalog/load';
import { Decimal, dec, text } from '../../domain/calculation/rounding';
import { matchByModel, type MatchResult } from './matchCatalog';
import { calcRouteMeters, type RouteInput } from '../../domain/quote/installation';
import type { ImportWarning } from './devices';
import type { DiagramBomRow, DiagramFile } from './types';

/** 판매되는 완제품 케이블 길이(m). 품셈 파일에서 실제로 쓰인 모델에서 뽑았다. */
export const READY_MADE_STEPS = [1, 2, 3, 5, 7, 10, 15, 20] as const;

/** 벌크 케이블의 판매 단위(m). */
export const BULK_UNIT_METERS = 10;

/**
 * 선 종류 이름(대문자) → 기본 벌크 케이블 SKU (운영자 결정 2026-10-12).
 *
 * 구성도 연결선에 케이블 품목이 지정되지 않았을 때, 여기 등록된 선
 * 종류는 "품목 미정" 행 대신 이 SKU를 자동 지정한다. **수량은 여전히
 * 경로 거리에서만 나온다** — 한 구간이라도 거리를 모르면 수량을 비우고
 * 확정을 막는다. 등록되지 않은 선 종류는 기존대로 품목 미정 + 후보 제시다.
 *
 * 예외: `DEFAULT_BULK_METERS_PER_SEGMENT_BY_LINE_TYPE`에 있는 선 종류는
 * 거리를 입력하지 않은 구간을 그 길이로 계산한다(운영자 결정 2026-10-16).
 */
export const DEFAULT_BULK_CABLE_SKU_BY_LINE_TYPE: ReadonlyMap<string, string> = new Map([
  ['A.AUDIO', 'CBL-0106'], // 1CH MIC CABLE · YJ56878 (마이크 케이블)
  // 벨덴 S/FTP CAT6A · 10GXE02. 이름이 'LAN'인 선 전체(HDBaseT·네트워크·Dante)에 적용한다.
  ['LAN', 'CBL-0090'],
]);

/**
 * 선 종류 이름(대문자) → 거리 미입력 구간에 쓰는 기본 길이(m)
 * (운영자 결정 2026-10-16: "구간당 기본 10m로 계산").
 *
 * 경로 입력을 **아예 하지 않은** 구간에만 쓴다. 입력을 시작했으나
 * 완성하지 않은 구간은 지금처럼 수량을 비우고 막는다. 기본 길이를 쓴
 * 구간에는 차단하지 않는 `cable-length-assumed` 안내를 남긴다.
 */
export const DEFAULT_BULK_METERS_PER_SEGMENT_BY_LINE_TYPE: ReadonlyMap<string, number> = new Map([
  ['LAN', 10],
]);

/**
 * 선 종류 이름(대문자) → 기본 완제품 케이블 SKU (운영자 결정 2026-10-16).
 *
 * 품목이 지정되지 않은 연결선에 구간당 1EA를 자동 지정한다.
 * - 거리를 입력하지 않았으면 이 SKU 그대로다(차단하지 않는 안내만 남긴다).
 * - 거리를 입력했으면 **같은 품셈 묶음에서 그 거리 이상인 가장 짧은
 *   제품**으로 바꾼다. 묶음의 길이가 판매 계단(`READY_MADE_STEPS`)과
 *   달라도(예: 7m 없음) 묶음에 실제로 있는 길이에서 고른다.
 * - 묶음의 가장 긴 제품보다 멀면 차단 경고(`cable-length-exceeded`)를 세운다.
 */
export const DEFAULT_READY_MADE_CABLE_SKU_BY_LINE_TYPE: ReadonlyMap<string, string> = new Map([
  ['HDMI', 'CBL-0017'], // RTCOM Locking HDMI Cable 2m · UMC-002
]);

/**
 * 완제품 길이를 계단으로 **올린다**.
 *
 * 내리면 케이블이 모자란다. 현장에서 모자란 것보다 남는 편이 낫다.
 * 가장 큰 계단을 넘으면 그 계단을 돌려주고, **경고는 호출부가 세운다** —
 * 20m를 넘는 구간은 완제품이 아니라 제작 케이블로 가야 한다.
 */
export function snapToStep(meters: number): number {
  for (const step of READY_MADE_STEPS) {
    if (meters <= step) return step;
  }
  return READY_MADE_STEPS[READY_MADE_STEPS.length - 1]!;
}

/** 벌크 길이를 10M 묶음 개수로 올린다. */
export function bulkUnits(meters: number): number {
  if (meters <= 0) return 0;
  return Math.ceil(meters / BULK_UNIT_METERS);
}

export interface CableLine {
  sku?: string;
  name: string;
  specification: string;
  /** `EA`(완제품) 또는 `10M`(벌크). */
  unit: string;
  /** 정하지 못했으면 **없다**. `0`으로 채우지 않는다. */
  quantity?: DecimalText;
  sellingUnitPrice?: DecimalText;
  /** 품셈 연결 id. 케이블에도 설치 노무비가 붙는다. */
  laborMappingId?: string;
  /** 몇 개 구간에서 왔는지. 커넥터 계산의 입력이다 (D8 규칙 2). */
  segmentCount: number;
  lineTypeId: string;
  /** 합쳐진 연결선 전부. */
  sourceEdgeIds: string[];
  sourceCableKey?: string;
  /** 원본 edge ID와 BOM 순번. 길이가 바뀌어도 변하지 않는다. */
  sourceCableMembers?: readonly string[];
  /** 벌크일 때 합산 전 실제 길이(m). 사람이 검토할 근거. */
  totalMeters?: DecimalText;
}

export interface BuildCableLinesResult {
  lines: CableLine[];
  warnings: ImportWarning[];
}

interface Accumulator {
  line: CableLine;
  /** 완제품이면 개수, 벌크면 미터. */
  amount: Decimal;
  edges: Set<string>;
}

/** `cableType`이 없으면 완제품으로 본다 — 길이를 합산하지 않는 쪽이 안전하다. */
function isBulk(row: DiagramBomRow): boolean {
  return row.cableType === 'manufactured';
}

function toNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** `quoteSpec`/`quoteName`에서 `…1M`/`…1m` 꼴의 길이 토큰을 읽는다. */
const LENGTH_TOKEN = /(\d+(?:\.\d+)?)\s*[Mm]\b/;

export function lengthOf(product: CatalogProduct): number | undefined {
  const found = LENGTH_TOKEN.exec(product.quoteSpec) ?? LENGTH_TOKEN.exec(product.quoteName);
  return found !== null ? Number(found[1]) : undefined;
}

export interface ReadyMadeStepLookup {
  /** 정확히 하나만 걸렸을 때만 있다. */
  product?: CatalogProduct;
  /** 같은 길이에 후보가 둘 이상이면(동일 묶음·동일 계단) 여기 담긴다
   *  — 자동으로 아무거나 고르지 않는다. */
  ambiguousSkus?: readonly string[];
}

/**
 * 원래 맞은 제품과 **같은 품셈 묶음**에서 `step`(m) 길이의 완제품을
 * 찾는다.
 *
 * - 묶음이 없으면(원래부터 미매칭) 빈 결과 — 호출부가 확인 필요로 남긴다.
 * - 벌크(`10M`) 단위는 뺀다 — 묶음이 완제품과 벌크를 같이 포함할 수
 *   있어서(예: 배관 묶음), 길이 변환이 완제품 영역을 벗어나지 않게
 *   한다.
 * - **같은 길이에 후보가 둘 이상이면 자동으로 고르지 않는다.** 같은
 *   묶음·같은 길이라도 제조사/사양이 다른 별도 SKU일 수 있다 —
 *   `ambiguousSkus`로 전부 돌려주고 사람이 고르게 한다.
 */
export function findReadyMadeAtStep(
  catalog: Catalog,
  original: CatalogProduct | undefined,
  step: number,
): ReadyMadeStepLookup {
  const group = original?.options['group'];
  if (group === undefined) return {};
  const matches = catalog.products.filter(
    (p) => p.options['group'] === group && p.unit !== `${BULK_UNIT_METERS}M` && lengthOf(p) === step,
  );
  if (matches.length === 0) return {};
  if (matches.length === 1) return { product: matches[0]! };
  return { ambiguousSkus: matches.map((p) => p.sku) };
}

function matchFor(product: CatalogProduct | undefined, catalog: Catalog): MatchResult {
  if (product === undefined) return { matchedBy: 'none' };
  const price = catalog.prices.get(product.sku);
  return { product, ...(price !== undefined ? { sellingUnitPrice: price } : {}), matchedBy: 'model-fragment' };
}

/**
 * `lineTypeLabel`(구성도 `lineTypes[].name`, 예 `HDMI`)과 품셈 묶음
 * (`options.group`)이나 품명이 겹치는 완제품 후보를 찾는다. 벌크
 * 단위(`10M`)는 뺀다 — 완제품 제조사·길이 선택지만 보여준다.
 *
 * 사람이 직접 **제조사별 종류(묶음)·길이**를 눈으로 보고 고를 수
 * 있게 하는 것이 목적이다 — 좁게 맞춘 한두 개만 주는 `candidates`
 * (모호 매칭용)와 다르다.
 */
export function cableCandidates(catalog: Catalog, lineTypeLabel: string, minimumMeters?: number): readonly string[] {
  const keyword = lineTypeLabel.trim().toLowerCase();
  if (keyword === '') return [];
  return catalog.products
    .filter((p) => p.unit !== `${BULK_UNIT_METERS}M`)
    .filter((p) => minimumMeters === undefined || (lengthOf(p) ?? -1) >= minimumMeters)
    .filter((p) => {
      const group = (p.options['group'] ?? '').toLowerCase();
      return group.includes(keyword) || p.quoteName.toLowerCase().includes(keyword);
    })
    .map((p) => p.sku);
}

export function buildCableLines(
  diagram: DiagramFile,
  catalog: Catalog,
  routes: ReadonlyMap<string, RouteInput> = new Map(),
): BuildCableLinesResult {
  const warnings: ImportWarning[] = [];
  const lines: CableLine[] = [];
  const byKey = new Map<string, Accumulator>();
  // 수량을 끝까지 비워 둘 키 — "0"을 수량으로 적으면 명시적 0(확정)과
  // 구분이 안 된다. 품목 미정·경로 입력 미완성 둘 다 여기 들어간다.
  const withholdQuantity = new Set<string>();

  const knownLineTypes = new Set(diagram.lineTypes.map((l) => l.id));
  const lineTypeName = new Map(diagram.lineTypes.map((l) => [l.id, l.name]));
  const reportedUnknown = new Set<string>();

  const push = (key: string, line: CableLine, amount: number, edgeId: string): void => {
    line.sourceCableKey = key;
    const existing = byKey.get(key);
    if (existing === undefined) {
      const accumulator: Accumulator = {
        line,
        amount: dec(String(amount)),
        edges: new Set([edgeId]),
      };
      byKey.set(key, accumulator);
      lines.push(line);
      return;
    }
    existing.amount = existing.amount.plus(dec(String(amount)));
    existing.edges.add(edgeId);
    existing.line.sourceEdgeIds = [...existing.edges];
    existing.line.sourceCableMembers = [...new Set([
      ...(existing.line.sourceCableMembers ?? []), ...(line.sourceCableMembers ?? []),
    ])];
  };

  for (const edge of diagram.edges) {
    const lineTypeId = edge.data?.lineTypeId ?? '';

    if (lineTypeId !== '' && !knownLineTypes.has(lineTypeId)) {
      // 사용자가 선 종류를 추가할 수 있다. 하드코딩한 목록으로 막지 않는다.
      if (!reportedUnknown.has(lineTypeId)) {
        reportedUnknown.add(lineTypeId);
        warnings.push({
          code: 'unknown-line-type',
          blocking: false,
          message: `선 종류 '${lineTypeId}'를 구성도의 lineTypes에서 찾을 수 없다.`,
          edgeId: edge.id,
        });
      }
    }

    const rows = edge.data?.bomRows ?? [];
    if (rows.length === 0) {
      // 선은 그어져 있는데 케이블 품목이 없다. 무시하면 케이블 없는 견적이 나간다.
      const label = lineTypeName.get(lineTypeId) ?? lineTypeId ?? '미상';

      // 기본 완제품 케이블이 정해진 선 종류(HDMI → UMC-002)는 구간당 1EA를
      // 자동 지정한다 (운영자 결정 2026-10-16).
      const readyMadeSku = DEFAULT_READY_MADE_CABLE_SKU_BY_LINE_TYPE.get(label.trim().toUpperCase());
      const readyMadeDefault =
        readyMadeSku !== undefined ? catalog.products.find((p) => p.sku === readyMadeSku) : undefined;
      if (readyMadeDefault !== undefined) {
        const route = routes.get(edge.id);
        const routeStarted = route !== undefined;
        const routeMeters = routeStarted ? calcRouteMeters(route) : undefined;
        // 같은 묶음의 완제품을 길이순으로 — 거리에 맞춰 바꿀 선택지다.
        const group = readyMadeDefault.options['group'];
        const lengthMates = catalog.products
          .filter((p) => group !== undefined && p.options['group'] === group && p.unit !== `${BULK_UNIT_METERS}M`)
          .filter((p) => lengthOf(p) !== undefined)
          .sort((a, b) => lengthOf(a)! - lengthOf(b)!);
        const lineFor = (product: CatalogProduct): CableLine => {
          const price = catalog.prices.get(product.sku);
          return {
            sku: product.sku,
            name: product.quoteName,
            specification: product.quoteSpec,
            unit: 'EA',
            ...(price !== undefined ? { sellingUnitPrice: price } : {}),
            ...(product.laborMappingId !== undefined ? { laborMappingId: product.laborMappingId } : {}),
            segmentCount: 1,
            lineTypeId,
            sourceEdgeIds: [edge.id],
            sourceCableMembers: [JSON.stringify([edge.id, -1])],
          };
        };

        if (routeStarted && routeMeters === undefined) {
          const key = `ready:auto:route-incomplete:${readyMadeDefault.sku}`;
          withholdQuantity.add(key);
          warnings.push({
            code: 'cable-route-incomplete',
            blocking: true,
            message:
              `'${label}' 연결선 구간의 경로 입력이 아직 완성되지 않았다 ` +
              '(수평/입상/입하 또는 확인된 총길이를 모두 채워야 한다). ' +
              '완성 전까지는 케이블 길이와 수량을 정하지 않는다.',
            edgeId: edge.id,
            sourceCableKey: key,
          });
          push(key, lineFor(readyMadeDefault), 0, edge.id);
          continue;
        }

        if (routeMeters === undefined) {
          const key = `ready:auto:${readyMadeDefault.sku}`;
          warnings.push({
            code: 'cable-length-assumed',
            blocking: false,
            message:
              `'${label}' 연결선의 거리를 입력하지 않아 기본 케이블 ` +
              `'${readyMadeDefault.quoteName} (${readyMadeDefault.quoteSpec})'을(를) 지정했다. ` +
              '케이블 거리를 입력하면 그 거리에 맞는 길이로 바뀐다.',
            edgeId: edge.id,
            sourceCableKey: key,
          });
          push(key, lineFor(readyMadeDefault), 1, edge.id);
          continue;
        }

        const meters = Number(routeMeters);
        const fitted = lengthMates.find((p) => lengthOf(p)! >= meters);
        if (fitted === undefined) {
          // 기본 묶음보다 길다 — 품목을 사람이 고르게 한다. 구간마다 필요한
          // 길이가 다르므로 구간별 키로 둔다(한 번 고른 품목이 다른 길이의
          // 구간에 함께 붙지 않게). 후보는 그 길이 이상인 같은 선 종류 완제품이다.
          const longest = lengthMates[lengthMates.length - 1] ?? readyMadeDefault;
          const key = `ready:auto:over:${edge.id}`;
          warnings.push({
            code: 'cable-item-unresolved',
            blocking: true,
            message:
              `'${label}' 구간이 ${routeMeters}m다. 기본 케이블 묶음의 최대 길이 ` +
              `${lengthOf(longest) ?? '?'}m를 넘는다. 그 길이 이상의 케이블을 직접 골라야 한다.`,
            edgeId: edge.id,
            candidates: cableCandidates(catalog, label, meters),
            sourceCableKey: key,
            requiredCableMeters: routeMeters,
          });
          push(key, {
            name: `${label} 케이블 (${routeMeters}m, 품목 선택 필요)`,
            specification: `기본 케이블 최대 ${lengthOf(longest) ?? '?'}m 초과`,
            unit: 'EA',
            segmentCount: 1,
            lineTypeId,
            sourceEdgeIds: [edge.id],
            sourceCableMembers: [JSON.stringify([edge.id, -1])],
          }, 1, edge.id);
          continue;
        }
        push(`ready:auto:${fitted.sku}`, lineFor(fitted), 1, edge.id);
        continue;
      }

      // 기본 케이블이 정해진 선 종류(예: A.AUDIO → 마이크 케이블)는 품목을
      // 자동 지정한다 (운영자 결정 2026-10-12). 거리는 역산하지 않는다 —
      // 한 구간이라도 경로 입력이 없으면 수량을 비우고 차단 경고를 세운다.
      const defaultSku = DEFAULT_BULK_CABLE_SKU_BY_LINE_TYPE.get(label.trim().toUpperCase());
      const defaultProduct =
        defaultSku !== undefined ? catalog.products.find((p) => p.sku === defaultSku) : undefined;
      if (defaultProduct !== undefined) {
        const route = routes.get(edge.id);
        const routeStarted = route !== undefined;
        const routeMeters = routeStarted ? calcRouteMeters(route) : undefined;
        const routeIncomplete = routeStarted && routeMeters === undefined;
        const key = `bulk:auto:${defaultProduct.sku}`;
        const price = catalog.prices.get(defaultProduct.sku);
        // 교체 선택지는 같은 품셈 묶음의 벌크 케이블(예: YJ56878·9451)이다.
        const groupMates = catalog.products
          .filter((p) => p.options['group'] !== undefined && p.options['group'] === defaultProduct.options['group'])
          .map((p) => p.sku);
        const line: CableLine = {
          sku: defaultProduct.sku,
          name: defaultProduct.quoteName,
          specification: defaultProduct.quoteSpec,
          unit: `${BULK_UNIT_METERS}M`,
          ...(price !== undefined ? { sellingUnitPrice: price } : {}),
          ...(defaultProduct.laborMappingId !== undefined
            ? { laborMappingId: defaultProduct.laborMappingId }
            : {}),
          segmentCount: 1,
          lineTypeId,
          sourceEdgeIds: [edge.id],
          sourceCableMembers: [JSON.stringify([edge.id, -1])],
        };
        if (routeIncomplete) {
          withholdQuantity.add(key);
          warnings.push({
            code: 'cable-route-incomplete',
            blocking: true,
            message:
              `'${label}' 연결선 구간의 경로 입력이 아직 완성되지 않았다 ` +
              '(수평/입상/입하 또는 확인된 총길이를 모두 채워야 한다). ' +
              '완성 전까지는 수량을 정하지 않는다.',
            edgeId: edge.id,
            sourceCableKey: key,
          });
          push(key, line, 0, edge.id);
          continue;
        }
        const assumedMeters = DEFAULT_BULK_METERS_PER_SEGMENT_BY_LINE_TYPE.get(label.trim().toUpperCase());
        if (routeMeters === undefined && assumedMeters !== undefined) {
          // 거리를 입력하지 않은 구간은 정해 둔 기본 길이로 계산한다
          // (운영자 결정 2026-10-16). 거리를 넣으면 그 값으로 다시 계산된다.
          warnings.push({
            code: 'cable-length-assumed',
            blocking: false,
            message:
              `'${label}' 연결선의 거리를 입력하지 않아 '${defaultProduct.quoteName} (${defaultProduct.quoteSpec})'을(를) ` +
              `구간당 기본 ${assumedMeters}m로 계산했다. 케이블 거리를 입력하면 그 값으로 다시 계산한다.`,
            edgeId: edge.id,
            sourceCableKey: key,
          });
          push(key, line, assumedMeters, edge.id);
          continue;
        }
        if (routeMeters === undefined) {
          // 거리를 아직 모른다 — 품목은 지정하되 수량은 끝까지 비워 둔다.
          // 일부 구간만 거리가 있어도 합계가 모자라므로 키 전체를 비운다.
          withholdQuantity.add(key);
          warnings.push({
            code: 'cable-item-unresolved',
            blocking: true,
            message:
              `'${label}' 연결선에 기본 케이블 '${defaultProduct.quoteName} (${defaultProduct.quoteSpec})'을(를) ` +
              '자동 지정했다. 케이블 거리(경로)를 입력해야 수량이 정해진다 — ' +
              '다른 품목이면 아래에서 바꿀 수 있다.',
            edgeId: edge.id,
            candidates: groupMates,
            sourceCableKey: key,
          });
          push(key, line, 0, edge.id);
          continue;
        }
        push(key, line, Number(routeMeters), edge.id);
        continue;
      }

      const key = `unresolved:${lineTypeId}`;
      withholdQuantity.add(key);
      const existing = byKey.get(key);
      if (existing === undefined) {
        const line: CableLine = {
          name: `${label} 케이블 (품목 미정)`,
          specification: '구성도에 케이블 품목이 지정되지 않았다',
          unit: 'EA',
          segmentCount: 1,
          lineTypeId,
          sourceEdgeIds: [edge.id],
          sourceCableKey: key,
          sourceCableMembers: [JSON.stringify([edge.id, -1])],
        };
        byKey.set(key, { line, amount: new Decimal(0), edges: new Set([edge.id]) });
        lines.push(line);
      } else {
        existing.edges.add(edge.id);
        existing.line.sourceEdgeIds = [...existing.edges];
        existing.line.segmentCount = existing.edges.size;
        existing.line.sourceCableMembers = [...new Set([
          ...(existing.line.sourceCableMembers ?? []), JSON.stringify([edge.id, -1]),
        ])];
      }
      warnings.push({
        code: 'cable-item-unresolved',
        blocking: true,
        message:
          `'${label}' 연결선에 케이블 품목이 지정되지 않았다. ` +
          '행은 만들었으나 수량을 정할 수 없다 — 품목을 고른 뒤에도 ' +
          '실제 수량을 직접 입력해야 확정된다.',
        edgeId: edge.id,
        candidates: cableCandidates(catalog, label),
        sourceCableKey: key,
      });
      continue;
    }

    // 이 구간의 실측 거리 — 아직 입력 안 했으면(이 맵에 아예 없으면)
    // undefined(기존 bomRow 길이를 그대로 쓴다). source별 계산(D8)은
    // calcRouteMeters가 한다.
    //
    // `routeStarted`와 `routeMeters`를 분리하는 이유: **입력을 시작은
    // 했지만 아직 완성되지 않았거나 형식이 틀린 경우**(예: 수평만
    // 적고 입상·입하는 비움)를 "아예 입력한 적 없음"과 구분해야 한다
    // (독립 검토 지적). 전자는 `calcRouteMeters`가 `undefined`를
    // 주는데, 그렇다고 기존 bomRow 길이로 조용히 계산하면 안 된다 —
    // 사람이 입력을 끝내지 않은 것이지 "원본 길이를 쓰라"는 뜻이
    // 아니다.
    const route = routes.get(edge.id);
    const routeStarted = route !== undefined;
    const routeMeters = routeStarted ? calcRouteMeters(route) : undefined;
    const routeIncomplete = routeStarted && routeMeters === undefined;

    for (const [bomIndex, row] of rows.entries()) {
      const sourceCableMembers = [JSON.stringify([edge.id, bomIndex])];
      const productName = row.productName?.trim() ?? '';
      if (productName === '') continue;

      const originalMatch = matchByModel(productName, catalog);
      const bulk = isBulk(row);
      const count = toNumber(row.quantity, 1);
      const label = lineTypeName.get(lineTypeId) ?? lineTypeId;

      if (routeIncomplete) {
        // 경로 입력이 완성되지 않았다 — 기존 길이로 정상 산정하지
        // 않는다. 완제품·벌크 둘 다 미해결로 두고 수량도 비운다.
        warnings.push({
          code: 'cable-route-incomplete',
          blocking: true,
          message:
            `'${productName}' 구간의 경로 입력이 아직 완성되지 않았다 ` +
            '(수평/입상/입하 또는 확인된 총길이를 모두 채워야 한다). ' +
            '완성 전까지는 구성도 원본 길이로 계산하지 않는다.',
          edgeId: edge.id,
          ...(bulk ? {} : { candidates: cableCandidates(catalog, label) }),
        });

        const key = `route-incomplete:${bulk ? 'bulk' : 'ready'}:${productName}`;
        withholdQuantity.add(key);
        const line: CableLine = {
          name: productName,
          specification: '경로 입력 필요',
          sourceCableMembers,
          unit: bulk ? `${BULK_UNIT_METERS}M` : 'EA',
          segmentCount: 1,
          lineTypeId,
          sourceEdgeIds: [edge.id],
        };
        // 금액에 들어가는 양은 0 — 길이를 모르니 수량도 정할 수 없다.
        push(key, line, 0, edge.id);
        continue;
      }

      const meters = routeMeters !== undefined ? Number(routeMeters) : toNumber(row.length, 0);
      const key = bulk ? `bulk:${productName}` : `ready:${productName}:${snapToStep(meters)}`;

      // 완제품이고 실측 거리가 있으면, 원래 맞은 제품의 품셈 묶음에서
      // 그 거리에 맞는 계단 길이의 SKU를 다시 찾는다. BOM.length(제품
      // 규격)는 바꾸지 않는다 — 찾아낸 제품의 SKU·규격·가격을 통째로
      // 쓰거나, 못 찾으면 확인 필요로 남긴다(기존 SKU에 새 길이
      // 글자만 붙이지 않는다).
      const rerouted = !bulk && routeMeters !== undefined;
      const lookup = rerouted ? findReadyMadeAtStep(catalog, originalMatch.product, snapToStep(meters)) : undefined;
      const match = rerouted ? matchFor(lookup?.product, catalog) : originalMatch;

      if (rerouted && lookup?.product === undefined) {
        const ambiguous = lookup?.ambiguousSkus;
        warnings.push({
          code: 'cable-item-unresolved',
          blocking: true,
          message:
            ambiguous !== undefined
              ? `'${productName}' 구간의 계단 길이(${snapToStep(meters)}m)에 같은 묶음 후보가 ` +
                `${ambiguous.length}건이라 자동으로 고르지 않는다. 직접 선택해야 한다.`
              : `'${productName}' 구간의 실측 거리(${routeMeters}m → ${snapToStep(meters)}m 계단)에 맞는 ` +
                '제품을 같은 묶음에서 찾지 못했다. 품목을 다시 확인해야 한다.',
          edgeId: edge.id,
          candidates: ambiguous !== undefined && meters <= snapToStep(meters) ? ambiguous : cableCandidates(catalog, label, meters),
          sourceCableKey: key,
          requiredCableMeters: routeMeters!,
        });
      } else if (!rerouted && match.product === undefined) {
        // 지금까지는 이 경우(이름은 있지만 카탈로그에 안 걸림)에 아무
        // 경고도 세우지 않았다 — 가격 미등록 경고만 계산 단계에서
        // 뒤늦게 나와 왜 그런지 알기 어려웠다. 사람이 제조사별 종류·
        // 길이를 직접 보고 고를 수 있게 후보를 바로 붙인다.
        warnings.push({
          code: 'cable-item-unresolved',
          blocking: true,
          message: `'${productName}'을(를) 카탈로그에서 찾을 수 없다. 품목을 직접 선택해야 한다.`,
          edgeId: edge.id,
          sourceCableKey: key,
          candidates: cableCandidates(catalog, label),
        });
      }

      // 완제품은 **길이가 다르면 다른 품목이다.** 길이를 키에서 빼면
      // 3m 구간과 15m 구간이 한 행으로 합쳐지고, 먼저 온 쪽 길이가 남아
      // 15m 자리에 3m 케이블이 나간다. 현장에서 모자라고 경고도 없다.
      const line: CableLine = {
        sourceCableMembers,
        ...(match.product !== undefined ? { sku: match.product.sku } : {}),
        name: match.product?.quoteName ?? productName,
        specification: match.product?.quoteSpec ?? (bulk ? '' : `${snapToStep(meters)}m`),
        unit: bulk ? `${BULK_UNIT_METERS}M` : 'EA',
        ...(match.sellingUnitPrice !== undefined
          ? { sellingUnitPrice: match.sellingUnitPrice }
          : {}),
        ...(match.product?.laborMappingId !== undefined
          ? { laborMappingId: match.product.laborMappingId }
          : {}),
        segmentCount: 1,
        lineTypeId,
        sourceEdgeIds: [edge.id],
      };

      if (!bulk && meters > READY_MADE_STEPS[READY_MADE_STEPS.length - 1]!) {
        warnings.push({
          code: 'cable-length-exceeded',
          blocking: true,
          message:
            `'${productName}' 구간이 ${meters}m다. 완제품 최대 길이 ` +
            `${READY_MADE_STEPS[READY_MADE_STEPS.length - 1]}m를 넘는다. 제작 케이블로 바꿔야 한다.`,
          edgeId: edge.id,
        });
      }

      if (bulk && meters <= 0) {
        // 벌크는 길이가 곧 수량이다. 길이가 없으면 `0`이 되어 케이블이
        // 조용히 사라진다 — 금액도 0원이고 아무 표시도 남지 않는다.
        warnings.push({
          code: 'cable-length-missing',
          blocking: true,
          message:
            `'${productName}'은 벌크 케이블인데 구간 길이가 없다. ` +
            '길이를 넣어야 수량을 정할 수 있다.',
          edgeId: edge.id,
        });
      }

      // 완제품은 개수를, 벌크는 미터를 쌓는다.
      push(key, line, bulk ? meters * count : count, edge.id);
    }
  }

  // 쌓은 양을 수량으로 바꾼다.
  for (const [key, accumulator] of byKey) {
    const { line, amount, edges } = accumulator;
    line.segmentCount = edges.size;
    line.sourceEdgeIds = [...edges];

    if (withholdQuantity.has(key)) continue; // 수량을 비워 둔다(품목 미정·경로 입력 미완성)

    if (line.unit === `${BULK_UNIT_METERS}M`) {
      line.totalMeters = text(amount);
      // 길이를 못 구했으면 **수량을 비운다.** `0`은 계산 엔진이 유효한 값으로
      // 보고 0원짜리 행을 만든다. 경고는 위에서 이미 세웠다.
      if (amount.greaterThan(0)) {
        line.quantity = String(bulkUnits(amount.toNumber()));
      }
    } else {
      line.quantity = text(amount);
    }
  }

  return { lines, warnings };
}
