/**
 * 가격표 불러오기·지우기·빈 서식 내려받기 (B-20261016-06, LED 구성기 방식).
 *
 * 직원이 고른 파일은 **이 브라우저 안에서만** 읽는다. 원가·판매가는 이
 * 브라우저 저장소(IndexedDB, `services/price-book/store.ts`)에만 두고 다음
 * 방문 때 자동으로 쓴다. 파일 이름·내용을 네트워크로 보내지 않는다.
 *
 *   1순위  표준품셈 원본 — 시트마다 머리글을 찾고, 처음 한 번은 원가 열·판매가
 *          열을 사람이 확인한다. 고른 열(자리·머리글 이름)만 저장한다.
 *   2순위  4시트 가격표 — `품목 단가` 시트를 읽는다.
 *
 * 화면에는 **건수와 좌표만** 보여준다. 가격 값은 이 화면에 그리지 않는다.
 */
import { useRef, useState } from 'react';
import type { Catalog } from '../../data/catalog/load';
import { readXlsxWorkbook, TableReadError, type XlsxSheetGrid } from '../../services/private-cost/readTable';
import {
  analyzePumsemWorkbook,
  isFourSheetWorkbook,
  normalizeText,
  PriceFileError,
  readFourSheetPrices,
  readPumsemPrices,
  savedChoiceFits,
  type PumsemAnalysis,
} from '../../services/price-book/readPriceFile';
import { clearStoredPriceRecord, saveStoredPriceRecord } from '../../services/price-book/store';
import { buildBlankPriceTemplate, PRICE_TEMPLATE_FILE_NAME } from '../../services/price-book/template';
import { priceBookFits } from '../../services/price-book/apply';
import type {
  PriceBook,
  PriceImportSummary,
  PumsemColumnChoice,
  StoredPriceRecord,
} from '../../services/price-book/types';
import { downloadBinaryFile } from '../../services/files/download';

interface PendingColumns {
  sheets: readonly XlsxSheetGrid[];
  analysis: PumsemAnalysis;
}

type Notice = { kind: 'ok' | 'error'; text: string };

function describeKind(book: PriceBook): string {
  return book.kind === 'pumsem' ? '표준품셈 원본' : '4시트 가격표';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function messageOf(err: unknown, fallback: string): string {
  if (err instanceof TableReadError || err instanceof PriceFileError) return err.message;
  return fallback;
}

export function PriceBookPanel({
  catalog,
  record,
  storeError,
  onRecordChange,
  documentOpen,
  onApplyToDocument,
}: {
  /** 가격을 붙이기 전 견적 단가표(품목 목록과 지문). */
  catalog: Catalog;
  record: StoredPriceRecord | undefined;
  /** 시작할 때 저장소를 읽지 못한 사유. */
  storeError: string | undefined;
  onRecordChange(record: StoredPriceRecord | undefined): void;
  documentOpen: boolean;
  onApplyToDocument(): number | 'basis-mismatch' | 'no-document';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingColumns | undefined>(undefined);
  const [result, setResult] = useState<PriceImportSummary | undefined>(undefined);
  const [notice, setNotice] = useState<Notice | undefined>(undefined);

  const book = record?.book;
  const fits = priceBookFits(catalog, book);

  /**
   * 저장하고 화면에 반영한다. 그 사이 다른 파일을 고르거나 「지우기」를 눌렀으면
   * (`requestId`가 바뀌었으면) 화면에 반영하지 않는다 — 저장소 작업 자체는
   * `store.ts`가 한 줄로 세워 순서대로 처리하므로 뒤의 지우기가 이긴다.
   */
  async function persist(next: StoredPriceRecord, summary: PriceImportSummary, requestId: number): Promise<void> {
    let saved = true;
    try {
      await saveStoredPriceRecord(next);
    } catch {
      saved = false;
    }
    if (requestId !== requestRef.current) return;
    if (saved) {
      setNotice({ kind: 'ok', text: '가격표를 이 브라우저에 저장했습니다. 다음 방문 때 자동으로 적용됩니다.' });
    } else {
      setNotice({
        kind: 'error',
        text: '가격표를 이 브라우저에 저장하지 못했습니다 — 이번 방문에서만 적용됩니다(사생활 보호 모드 등).',
      });
    }
    onRecordChange(next);
    setResult(summary);
  }

  function handleFile(file: File): void {
    const requestId = ++requestRef.current;
    setPending(undefined);
    setResult(undefined);
    setNotice(undefined);
    if (!/\.xlsx$/i.test(file.name)) {
      setNotice({ kind: 'error', text: '가격표는 .xlsx 파일만 읽습니다(매크로·외부 링크·암호 없는 파일).' });
      return;
    }
    setBusy(true);
    void (async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (requestId !== requestRef.current) return;
        const sheets = readXlsxWorkbook(bytes);
        const now = new Date().toISOString();
        if (isFourSheetWorkbook(sheets)) {
          const next = readFourSheetPrices(sheets, catalog, now);
          await persist({ schemaVersion: 1, book: next, ...(record?.pumsemColumns ? { pumsemColumns: record.pumsemColumns } : {}) }, next.summary, requestId);
          return;
        }
        const analysis = analyzePumsemWorkbook(sheets, catalog);
        if (record?.pumsemColumns !== undefined && savedChoiceFits(analysis, record.pumsemColumns)) {
          const next = readPumsemPrices(sheets, analysis, record.pumsemColumns, catalog, now);
          await persist({ schemaVersion: 1, book: next, pumsemColumns: record.pumsemColumns }, next.summary, requestId);
          return;
        }
        setPending({ sheets, analysis });
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setNotice({ kind: 'error', text: `가격표를 읽지 못했습니다 — ${messageOf(err, '알 수 없는 오류')}` });
      } finally {
        if (requestId === requestRef.current) setBusy(false);
      }
    })();
  }

  function confirmColumns(choice: PumsemColumnChoice): void {
    if (pending === undefined) return;
    const { sheets, analysis } = pending;
    const requestId = ++requestRef.current;
    setPending(undefined);
    let next: PriceBook;
    try {
      next = readPumsemPrices(sheets, analysis, choice, catalog, new Date().toISOString());
    } catch (err) {
      setNotice({ kind: 'error', text: `가격표를 읽지 못했습니다 — ${messageOf(err, '알 수 없는 오류')}` });
      return;
    }
    setBusy(true);
    void persist({ schemaVersion: 1, book: next, pumsemColumns: choice }, next.summary, requestId).finally(() => {
      if (requestId === requestRef.current) setBusy(false);
    });
  }

  function handleClear(): void {
    const requestId = ++requestRef.current;
    setPending(undefined);
    setResult(undefined);
    setBusy(true);
    // 화면에서는 바로 뺀다 — 지우기를 누른 뒤에는 원가·판매가를 쓰지 않는다.
    onRecordChange(undefined);
    void (async () => {
      let cleared = true;
      try {
        await clearStoredPriceRecord();
      } catch {
        cleared = false;
      }
      if (requestId !== requestRef.current) return;
      setNotice(
        cleared
          ? { kind: 'ok', text: '이 브라우저에 저장된 가격표(원가·판매가·열 선택)를 지웠습니다.' }
          : { kind: 'error', text: '저장된 가격표를 지우지 못했습니다 — 이번 방문에서는 적용하지 않습니다.' },
      );
      setBusy(false);
    })();
  }

  function handleTemplate(): void {
    downloadBinaryFile(PRICE_TEMPLATE_FILE_NAME, buildBlankPriceTemplate(catalog));
  }

  function handleApply(): void {
    const outcome = onApplyToDocument();
    if (outcome === 'no-document') return;
    setNotice(
      outcome === 'basis-mismatch'
        ? { kind: 'error', text: '열린 견적이 다른 판의 견적 단가표로 만들어져 단가를 다시 붙이지 않았습니다.' }
        : { kind: 'ok', text: outcome === 0 ? '바뀐 단가가 없습니다.' : `열린 견적의 단가 ${outcome}행을 가격표로 바꿨습니다(실행 취소 가능).` },
    );
  }

  return (
    <section className="q-card q-price-book" aria-label="가격표">
      <h3>가격표 (원가·판매가)</h3>
      <p className="q-muted" data-price-book-state={book === undefined ? 'none' : fits ? 'active' : 'stale'}>
        {book === undefined
          ? "이 브라우저에 저장된 가격표가 없습니다 — 모든 품목이 '단가 미등록'입니다."
          : fits
            ? `가격표 사용 중 — ${describeKind(book)} · ${formatDate(book.importedAt)} 불러옴 · 판매가 ${book.summary.sellingApplied}건 · 원가 ${book.summary.costApplied}건.`
            : '저장된 가격표가 지금 견적 단가표와 다른 판에서 불러온 것이라 적용하지 않았습니다 — 다시 불러오세요.'}{' '}
        파일은 이 브라우저 안에서만 읽고 저장하며, 서버로 보내지 않습니다.
      </p>
      {storeError !== undefined && (
        <p role="alert" className="q-notice q-notice-error">
          저장된 가격표를 읽지 못했습니다 — {storeError}
        </p>
      )}
      <div className="q-price-book-actions">
        <button type="button" className="q-button" disabled={busy} onClick={() => inputRef.current?.click()}>
          가격표 불러오기
        </button>
        <button type="button" className="q-button" disabled={busy || record === undefined} onClick={handleClear}>
          가격표 지우기
        </button>
        <button type="button" className="q-button" onClick={handleTemplate}>
          빈 가격표 서식 내려받기
        </button>
        {documentOpen && (
          <button type="button" className="q-button" onClick={handleApply}>
            열린 견적에 가격표 단가 적용
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        aria-label="가격표 파일 선택"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file !== undefined) handleFile(file);
        }}
      />
      {busy && <p className="q-muted">가격표를 읽는 중입니다…</p>}
      {pending !== undefined && (
        <ColumnChooser
          pending={pending}
          saved={record?.pumsemColumns}
          onConfirm={confirmColumns}
          onCancel={() => setPending(undefined)}
        />
      )}
      {notice !== undefined && (
        <p role={notice.kind === 'error' ? 'alert' : 'status'} className={notice.kind === 'error' ? 'q-notice q-notice-error' : 'q-muted'}>
          {notice.text}
        </p>
      )}
      {result !== undefined && <ImportResult summary={result} />}
    </section>
  );
}

function ImportResult({ summary }: { summary: PriceImportSummary }) {
  return (
    <div role="status" aria-label="가격표 불러오기 결과" className="q-price-book-result">
      <p>
        붙은 품목 <strong data-count="applied">{summary.applied}</strong>건(판매가 {summary.sellingApplied} · 원가{' '}
        {summary.costApplied}) · 가격표 행 불일치 <strong data-count="mismatched">{summary.mismatched}</strong>건 · 빈 칸{' '}
        <strong data-count="blank">{summary.blank}</strong>건
      </p>
      <p className="q-muted">
        원가 빈 칸 {summary.costBlank} · 판매가 빈 칸 {summary.sellingBlank} · 수식이라 읽지 않은 칸 {summary.formulaSkipped} ·
        숫자가 아닌 칸 {summary.notNumeric}
        {summary.unknownCodes > 0 ? ` · 목록에 없는 품목코드 ${summary.unknownCodes}` : ''} · 파일에서 찾지 못한 품목{' '}
        {summary.missingInFile}
      </p>
      {(summary.issues.length > 0 || summary.sheetsSkipped.length > 0) && (
        <details>
          <summary>확인할 행·시트 보기</summary>
          {summary.issues.length > 0 && (
            <ul>
              {summary.issues.map((issue, index) => (
                <li key={index}>
                  가격표 행 불일치, 확인 필요 — 시트 '{issue.sheet}' {issue.row}행{issue.sku !== undefined ? ` (${issue.sku})` : ''}:{' '}
                  {issue.reason}
                </li>
              ))}
            </ul>
          )}
          {summary.sheetsSkipped.length > 0 && (
            <ul>
              {summary.sheetsSkipped.map((sheet) => (
                <li key={sheet.name}>
                  읽지 않은 시트 '{sheet.name}' — {sheet.reason}
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </div>
  );
}

function ColumnChooser({
  pending,
  saved,
  onConfirm,
  onCancel,
}: {
  pending: PendingColumns;
  saved: PumsemColumnChoice | undefined;
  onConfirm(choice: PumsemColumnChoice): void;
  onCancel(): void;
}) {
  const { analysis } = pending;
  const first = analysis.layouts[0]!;
  // 저장한 열은 **자리와 머리글이 모두 맞을 때만** 미리 고른다. 판이 바뀌어 그
  // 자리에 다른 열이 있으면 머리글 이름으로 고른 제안을 쓴다(독립 리뷰 지적).
  const fits = (ref: { index: number; label: string } | undefined): boolean =>
    ref !== undefined &&
    analysis.options.some((o) => o.index === ref.index && normalizeText(o.label) === normalizeText(ref.label));
  const initial = (ref: { index: number; label: string } | undefined): string =>
    ref !== undefined && fits(ref) ? String(ref.index) : '';
  const [cost, setCost] = useState<string>(() =>
    initial(fits(saved?.cost) ? saved?.cost : analysis.suggestion.cost),
  );
  const [selling, setSelling] = useState<string>(() =>
    initial(fits(saved?.selling) ? saved?.selling : analysis.suggestion.selling),
  );

  const refOf = (value: string): { index: number; label: string } | undefined => {
    if (value === '') return undefined;
    const option = analysis.options.find((o) => String(o.index) === value);
    return option === undefined ? undefined : { index: option.index, label: option.label };
  };
  const ready = cost !== '' || selling !== '';

  return (
    <div role="alert" className="q-field-error" aria-label="가격표 열 확인">
      <p>
        표준품셈 원본으로 보입니다 — 시트 {analysis.layouts.length}개에서 머리글을 찾았습니다. 원가 열과 판매가 열을
        확인하세요(첫 시트 '{first.sheet}' 기준 열 문자입니다. 다른 시트는 같은 머리글 이름으로 찾습니다). 매입처·제조사·비고
        열은 고를 수 없습니다. 고른 열(자리·머리글 이름)은 저장해 두고 다음부터 다시 묻지 않습니다.
      </p>
      <label>
        원가 열
        <select aria-label="원가 열" value={cost} onChange={(event) => setCost(event.target.value)}>
          <option value="">(읽지 않음)</option>
          {analysis.options.map((o) => (
            <option key={o.index} value={o.index}>
              {o.letter}: {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        판매가 열
        <select aria-label="판매가 열" value={selling} onChange={(event) => setSelling(event.target.value)}>
          <option value="">(읽지 않음)</option>
          {analysis.options.map((o) => (
            <option key={o.index} value={o.index}>
              {o.letter}: {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="q-button"
        disabled={!ready || (cost !== '' && cost === selling)}
        onClick={() => {
          const costRef = refOf(cost);
          const sellingRef = refOf(selling);
          onConfirm({ ...(costRef ? { cost: costRef } : {}), ...(sellingRef ? { selling: sellingRef } : {}) });
        }}
      >
        이 열로 불러오기
      </button>
      <button type="button" className="q-button" onClick={onCancel}>
        취소
      </button>
    </div>
  );
}
