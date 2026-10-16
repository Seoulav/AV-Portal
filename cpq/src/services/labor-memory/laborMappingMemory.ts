/**
 * 이 PC가 기억하는 "확인한 품셈 연결" (B-20261016-05, 2026-10-16 사용자
 * 결정: "한 번 확인한 연결은 기억 — 이 PC에 저장").
 *
 * ## 무엇을 저장하는가
 *
 * **품셈 판(`versions.labor`) + 품셈 연결 id + 연결 내용 지문 + 확인 시각**
 * 뿐이다. 견적 문서·고객명·현장명·금액·원가는 **넣지 않는다** — 설계서
 * §8.8("견적 문서를 브라우저에 영속 저장하지 않는다")의 대상이 아니다.
 * 그래서 이 파일은 화면 경로(`src/app`, `src/features`) 밖에 두고, 화면은
 * 아래 함수만 부른다. `tools/audit-exports.mjs`는 **이 파일, 이 열쇠
 * (`LABOR_MEMORY_STORAGE_KEY`)에서만** 브라우저 저장소를 허용한다.
 *
 * ## 언제 적용하는가
 *
 * 지금 품셈 판과 같은 판에서 확인했고, **지금 연결 내용의 지문이 확인할 때와
 * 같을 때만** 적용한다(`isApplicable`). 원본 해시가 같은 채
 * `labor-mappings.json`의 연결 내용(할증·요율·환산 등)만 바뀌어도 예전
 * 확인은 쓰지 않는다(독립 검토 지적 C). 적용되지 않는 옛 기록은 새로
 * 저장할 때 정리한다.
 *
 * ## 저장소를 못 쓰면
 *
 * 읽기: 사생활 보호 모드·손상된 값이면 **기억이 없는 것**으로 본다 —
 * 지금과 똑같이 행마다 확인을 묻는다(잘못 풀리는 쪽으로 실패하지 않는다).
 * 쓰기: 실패를 `{ ok: false }`로 돌려준다. 화면은 건수를 늘리지 않고
 * 저장하지 못했다고 알린다 — 조용히 성공한 척하지 않는다.
 */

/** 저장 열쇠. 형식을 바꾸면 버전을 올린다(옛 값을 잘못 읽지 않게). */
export const LABOR_MEMORY_STORAGE_KEY = 'av-cpq.confirmed-labor-mappings.v1';

export interface RememberedLaborMapping {
  /** 확인한 그 순간의 품셈 판(`BasisVersions.labor`). */
  laborVersion: string;
  laborMappingId: string;
  /** 확인한 그 순간의 연결 내용 지문(`computeLaborMappingFingerprint`). */
  mappingFingerprint: string;
  /** ISO 시각 — 표시용. 판정에는 쓰지 않는다. */
  confirmedAt: string;
}

/** 지금 품셈 자료에서 그 연결의 내용 지문. 연결이 없으면 `undefined`. */
export type CurrentMappingFingerprint = (laborMappingId: string) => string | undefined;

/** `Storage`의 필요한 부분만. 시험에서 가짜를 넣는다. */
export interface MemoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type MemoryWriteResult =
  | {
      ok: true;
      memory: readonly RememberedLaborMapping[];
      /** 이 호출로 **새로** 더해졌는가(이미 있던 것이면 false). 실행 취소 기록용. */
      added: boolean;
    }
  | { ok: false; memory: readonly RememberedLaborMapping[]; reason: string };

const UNAVAILABLE = '이 브라우저에서는 저장소를 쓸 수 없습니다.';
const WRITE_FAILED = '브라우저 저장소에 쓰지 못했습니다(용량 초과·사생활 보호 모드 등).';

/** 브라우저 저장소. 없거나(시험 환경) 막혀 있으면 `undefined`. */
export function browserMemoryStorage(): MemoryStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function isEntry(value: unknown): value is RememberedLaborMapping {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['laborVersion'] === 'string' &&
    v['laborVersion'] !== '' &&
    typeof v['laborMappingId'] === 'string' &&
    v['laborMappingId'] !== '' &&
    typeof v['mappingFingerprint'] === 'string' &&
    v['mappingFingerprint'] !== '' &&
    typeof v['confirmedAt'] === 'string'
  );
}

/** 허용한 네 칸만 다시 만든다 — 다른 칸이 섞여 있어도 옮기지 않는다. */
function clean(e: RememberedLaborMapping): RememberedLaborMapping {
  return {
    laborVersion: e.laborVersion,
    laborMappingId: e.laborMappingId,
    mappingFingerprint: e.mappingFingerprint,
    confirmedAt: e.confirmedAt,
  };
}

function sameEntry(a: RememberedLaborMapping, b: RememberedLaborMapping): boolean {
  return (
    a.laborVersion === b.laborVersion &&
    a.laborMappingId === b.laborMappingId &&
    a.mappingFingerprint === b.mappingFingerprint
  );
}

/** 저장된 기억을 읽는다. 없거나 손상됐으면 빈 목록. */
export function loadLaborMappingMemory(
  storage: MemoryStorage | undefined = browserMemoryStorage(),
): readonly RememberedLaborMapping[] {
  if (storage === undefined) return [];
  try {
    const raw = storage.getItem(LABOR_MEMORY_STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).map(clean);
  } catch {
    return [];
  }
}

/** 지금 판·지금 연결 내용에 그대로 적용되는 기록인가. */
export function isApplicable(
  entry: RememberedLaborMapping,
  laborVersion: string,
  fingerprintOf: CurrentMappingFingerprint,
): boolean {
  return entry.laborVersion === laborVersion && fingerprintOf(entry.laborMappingId) === entry.mappingFingerprint;
}

/** 지금 적용되는 기록만. 화면 건수도 이것으로 센다. */
export function applicableEntries(
  memory: readonly RememberedLaborMapping[],
  laborVersion: string,
  fingerprintOf: CurrentMappingFingerprint,
): readonly RememberedLaborMapping[] {
  return memory.filter((e) => isApplicable(e, laborVersion, fingerprintOf));
}

/** 지금 적용되는 연결 id. 판이 다르거나 연결 내용이 바뀌었으면 빠진다. */
export function applicableMappingIds(
  memory: readonly RememberedLaborMapping[],
  laborVersion: string,
  fingerprintOf: CurrentMappingFingerprint,
): ReadonlySet<string> {
  return new Set(applicableEntries(memory, laborVersion, fingerprintOf).map((e) => e.laborMappingId));
}

function write(
  storage: MemoryStorage | undefined,
  next: readonly RememberedLaborMapping[],
): { ok: true } | { ok: false; reason: string } {
  if (storage === undefined) return { ok: false, reason: UNAVAILABLE };
  try {
    if (next.length === 0) storage.removeItem(LABOR_MEMORY_STORAGE_KEY);
    else storage.setItem(LABOR_MEMORY_STORAGE_KEY, JSON.stringify(next.map(clean)));
    return { ok: true };
  } catch {
    return { ok: false, reason: WRITE_FAILED };
  }
}

/**
 * 확인 하나를 더한다. `keep`이 거짓인 옛 기록(지금 판·지금 연결 내용에
 * 적용되지 않는 것)은 이때 함께 정리한다. 같은 기록이 이미 있으면
 * `added: false`다.
 */
export function rememberLaborMapping(
  entry: RememberedLaborMapping,
  keep: (existing: RememberedLaborMapping) => boolean,
  storage: MemoryStorage | undefined = browserMemoryStorage(),
): MemoryWriteResult {
  const current = loadLaborMappingMemory(storage);
  const kept = current.filter(keep);
  const added = !kept.some((e) => sameEntry(e, entry));
  const next = added ? [...kept, clean(entry)] : kept;
  if (!added && next.length === current.length) return { ok: true, memory: current, added: false };
  const result = write(storage, next);
  return result.ok ? { ok: true, memory: next, added } : { ok: false, memory: current, reason: result.reason };
}

/** 기록 하나를 뺀다(실행 취소). 없으면 아무 것도 하지 않는다. */
export function forgetLaborMapping(
  entry: RememberedLaborMapping,
  storage: MemoryStorage | undefined = browserMemoryStorage(),
): MemoryWriteResult {
  const current = loadLaborMappingMemory(storage);
  const next = current.filter((e) => !sameEntry(e, entry));
  if (next.length === current.length) return { ok: true, memory: current, added: false };
  const result = write(storage, next);
  return result.ok ? { ok: true, memory: next, added: false } : { ok: false, memory: current, reason: result.reason };
}

/** 기억을 전부 지운다. 값을 비워 쓰지 않고 열쇠 자체를 없앤다. */
export function clearLaborMappingMemory(
  storage: MemoryStorage | undefined = browserMemoryStorage(),
): MemoryWriteResult {
  const result = write(storage, []);
  return result.ok
    ? { ok: true, memory: [], added: false }
    : { ok: false, memory: loadLaborMappingMemory(storage), reason: result.reason };
}
