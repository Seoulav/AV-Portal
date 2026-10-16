/**
 * 아주 작은 xlsx 쓰기 — 빈 가격표 서식(B-20261016-06)과 시험용 가짜 가격표를
 * 만든다.
 *
 * 견적 출력(`src/export/ooxml`)은 정제 템플릿의 서식을 그대로 살려야 해서
 * 템플릿 ZIP을 고쳐 쓰지만, 가격표 서식은 서식이 필요 없다. 문자열은
 * `inlineStr`로 넣고, 스타일은 기본 하나만 둔다.
 *
 * 이 모듈은 **값을 받아 쓰기만** 한다. 원가·판매가를 채우는 일은 호출부가
 * 하고, 빈 서식은 가격 칸을 비운 채로 만든다.
 */
import { strToU8, zipSync } from 'fflate';
import { escapeXmlAttr, escapeXmlText } from '../../export/ooxml/xml';
import { columnLetter } from '../private-cost/parse';

export type XlsxCell =
  | string
  | { number: string }
  | { formula: string; cached?: string }
  | undefined;

export interface XlsxSheetSpec {
  name: string;
  rows: readonly (readonly XlsxCell[])[];
  /** `G2:H2` 꼴. */
  merges?: readonly string[];
  /** 열 너비(문자 수). 0부터 센 열 순서. */
  widths?: readonly number[];
}

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function cellXml(ref: string, cell: XlsxCell): string {
  if (cell === undefined || cell === '') return '';
  if (typeof cell === 'string') {
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXmlText(cell)}</t></is></c>`;
  }
  if ('number' in cell) return `<c r="${ref}"><v>${escapeXmlText(cell.number)}</v></c>`;
  const cached = cell.cached === undefined ? '' : `<v>${escapeXmlText(cell.cached)}</v>`;
  return `<c r="${ref}"><f>${escapeXmlText(cell.formula)}</f>${cached}</c>`;
}

function sheetXml(sheet: XlsxSheetSpec): string {
  const rows = sheet.rows
    .map((row, rowIndex) => {
      const cells = row.map((cell, col) => cellXml(`${columnLetter(col)}${rowIndex + 1}`, cell)).join('');
      return cells === '' ? '' : `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');
  const cols =
    sheet.widths === undefined || sheet.widths.length === 0
      ? ''
      : `<cols>${sheet.widths
          .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
          .join('')}</cols>`;
  const merges =
    sheet.merges === undefined || sheet.merges.length === 0
      ? ''
      : `<mergeCells count="${sheet.merges.length}">${sheet.merges
          .map((ref) => `<mergeCell ref="${escapeXmlAttr(ref)}"/>`)
          .join('')}</mergeCells>`;
  return (
    `${XML_DECL}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `${cols}<sheetData>${rows}</sheetData>${merges}</worksheet>`
  );
}

/** 시트 목록으로 xlsx 바이트를 만든다. */
export function buildSimpleXlsx(sheets: readonly XlsxSheetSpec[]): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const overrides = sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join('');
  files['[Content_Types].xml'] = strToU8(
    `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      `${overrides}</Types>`,
  );
  files['_rels/.rels'] = strToU8(
    `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
  );
  files['xl/workbook.xml'] = strToU8(
    `${XML_DECL}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets
        .map((s, i) => `<sheet name="${escapeXmlAttr(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join('') +
      '</sheets></workbook>',
  );
  files['xl/_rels/workbook.xml.rels'] = strToU8(
    `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      sheets
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
        )
        .join('') +
      `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      '</Relationships>',
  );
  files['xl/styles.xml'] = strToU8(
    `${XML_DECL}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      '<fonts count="1"><font><sz val="11"/><name val="맑은 고딕"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>',
  );
  sheets.forEach((sheet, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(sheet));
  });
  return zipSync(files);
}
