/**
 * 가격표를 **이 브라우저에만** 저장한다 (B-20261016-06, LED 구성기 방식).
 *
 * LED 구성기는 `localStorage` 한 열쇠에 가격표를 둔다. 견적 단가표는
 * 1,400품목이 넘어 크기 여유가 있는 IndexedDB를 쓴다 — 데이터베이스 하나,
 * 저장소 하나, 열쇠 하나다.
 *
 * `tools/audit-exports.mjs` 7번 규칙이 **이 파일에서만, 아래 세 상수로만**
 * 브라우저 저장소를 허용한다. 다른 데이터베이스·저장소·열쇠를 쓰거나,
 * 목록을 훑거나(`getAll`·커서), `localStorage`에 닿으면 검사가 실패한다.
 * 이 파일은 네트워크에 닿지 않는다(원가 모듈 규칙 3번).
 *
 * 저장하는 것: 원가(SKU별 — 판매가는 담지 않는다), 불러온 시각, 대조한 견적 단가표 지문,
 * 불러오기 결과 건수, 표준품셈 원본에서 고른 열(자리·머리글).
 * 저장하지 않는 것: **파일 이름**, 고객·현장·견적 문서.
 *
 * "가격표 지우기"는 이 열쇠의 값을 지운다.
 */
import { parseStoredPriceRecord, type StoredPriceRecord } from './types';

export const PRICE_BOOK_DB_NAME = 'av-cpq.price-book.v1';
export const PRICE_BOOK_STORE = 'price-book';
export const PRICE_BOOK_RECORD_KEY = 'current';

/** 데이터베이스 판. 저장소 구조를 바꿀 때만 올린다. */
const DB_VERSION = 1;

export type StoredPriceLoad =
  | { kind: 'none' }
  | { kind: 'ok'; record: StoredPriceRecord }
  /** 저장소를 못 쓰거나 값이 깨졌다 — 가격표 없이 계속한다. 사유만 보여준다. */
  | { kind: 'error'; reason: string };

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error && err.message !== '' ? err.message : fallback;
}

function openPriceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('이 브라우저에서는 저장소(IndexedDB)를 쓸 수 없습니다.'));
      return;
    }
    const request = indexedDB.open(PRICE_BOOK_DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PRICE_BOOK_STORE)) db.createObjectStore(PRICE_BOOK_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('저장소를 열지 못했습니다.'));
    request.onblocked = () => reject(new Error('다른 창이 저장소를 쓰고 있어 열지 못했습니다.'));
  });
}

function finish(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('저장소 작업이 실패했습니다.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('저장소 작업이 취소됐습니다.'));
  });
}

/** 시작할 때 저장소가 응답하지 않으면 이만큼만 기다리고 가격표 없이 연다. */
const OPEN_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** 저장된 가격표를 읽는다. 없거나 깨졌으면 그렇다고 알린다 — 던지지 않는다. */
export async function loadStoredPriceRecord(): Promise<StoredPriceLoad> {
  let db: IDBDatabase;
  try {
    db = await withTimeout(openPriceDatabase(), OPEN_TIMEOUT_MS, '저장소가 응답하지 않습니다.');
  } catch (err) {
    return { kind: 'error', reason: messageOf(err, '저장소를 열지 못했습니다.') };
  }
  try {
    const transaction = db.transaction(PRICE_BOOK_STORE, 'readonly');
    const request = transaction.objectStore(PRICE_BOOK_STORE).get(PRICE_BOOK_RECORD_KEY);
    await finish(transaction);
    const raw: unknown = request.result;
    if (raw === undefined) return { kind: 'none' };
    const record = parseStoredPriceRecord(raw);
    if (record === undefined) {
      return { kind: 'error', reason: '저장된 가격표의 형식이 맞지 않아 쓰지 않습니다. 다시 불러오세요.' };
    }
    return { kind: 'ok', record };
  } catch (err) {
    return { kind: 'error', reason: messageOf(err, '저장된 가격표를 읽지 못했습니다.') };
  } finally {
    db.close();
  }
}

/**
 * 쓰기·지우기를 한 줄로 세운다 — 저장 중에 「지우기」를 눌러도 순서가 뒤바뀌어
 * 지운 가격표가 다시 살아나지 않는다(독립 리뷰 지적).
 */
let writeQueue: Promise<unknown> = Promise.resolve();
function enqueue(task: () => Promise<void>): Promise<void> {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => undefined);
  return run;
}

/** 가격표를 저장한다. 실패하면 던진다 — 화면이 "저장하지 못했다"를 알린다. */
export function saveStoredPriceRecord(record: StoredPriceRecord): Promise<void> {
  return enqueue(() => writeRecord(record));
}

async function writeRecord(record: StoredPriceRecord): Promise<void> {
  const db = await openPriceDatabase();
  try {
    const transaction = db.transaction(PRICE_BOOK_STORE, 'readwrite');
    transaction.objectStore(PRICE_BOOK_STORE).put(record, PRICE_BOOK_RECORD_KEY);
    await finish(transaction);
  } finally {
    db.close();
  }
}

/** "가격표 지우기" — 저장된 값을 지운다. 실패하면 던진다. */
export function clearStoredPriceRecord(): Promise<void> {
  return enqueue(deleteRecord);
}

async function deleteRecord(): Promise<void> {
  const db = await openPriceDatabase();
  try {
    const transaction = db.transaction(PRICE_BOOK_STORE, 'readwrite');
    transaction.objectStore(PRICE_BOOK_STORE).delete(PRICE_BOOK_RECORD_KEY);
    await finish(transaction);
  } finally {
    db.close();
  }
}
