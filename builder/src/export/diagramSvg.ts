// 도면 SVG 내보내기(B-20261006-10). 구성도 데이터(엔진 좌표)로 직접 그린다.
// 화면(DOM)을 읽지 않으므로 줌·선택·선 종류 필터·테마와 무관하게 같은 구성도는 같은 문자열이 된다(결정 M-f: 늘 밝은 바탕).
// - 장비: 엔진 geometry 치수(화면과 같다). 사진은 넣지 않고 자리만 둔다(결정 M-c)
// - 연결: 화면과 같은 계산(normalizeBidiEdges → edgeOffsets → edgeJumps → buildOrthogonalPath). 라벨은 화면과 같다(결정 M-d)
// - 메모·영역: 구 Builder AnnotationNode·ShapeNode와 같은 규칙(B-20261006-09)
import { geometry as G, type Diagram, type DiagramEdge, type DiagramNode, type Equipment, type LineType, type Port } from '../engine';
import { ANNOTATION_DEFAULTS, SHAPE_DEFAULTS } from '../components/NoteNodes';
import { buildOrthogonalPath, edgeJumps, getEdgePoints, type XY } from '../edges/edgeGeometry';
import { edgeOffsets, normalizeBidiEdges } from '../edges/edgeProcessing';
import { anchorOf } from '../proximity';

export const SVG_FONT = "Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
const MARGIN = 40;
const STAMP_HEIGHT = 24;
const COLORS = { text: '#0f172a', muted: '#64748b', line: '#e2e8f0', node: '#ffffff', reused: '#fffbeb', photo: '#f1f5f9', background: '#ffffff' };
const NODE_ORDER: Record<string, number> = { shape: 0, equipment: 1, annotation: 2 };
// 화면과 같은 기준: 이 둘이 아닌 단자는 "확인" 배지를 단다(EquipmentNode)
const ACCEPTED = new Set(['VERIFIED', 'FOUND']);
const BADGE_WIDTH = 22;

export interface SvgOptions {
  lineTypes: LineType[];
  // 오른쪽 아래 표기(결정 M-b). 빼면 표기 없이 그린다(시험은 결정적 결과를 위해 고정 값을 준다)
  stamp?: { version: string; date: string };
}
export interface DiagramSvg { svg: string; width: number; height: number }

// ── 문자열 도우미 ──
// XML 1.0이 허용하지 않는 제어 문자는 뺀다. 붙여 넣은 글이나 가져온 파일에 섞이면 SVG 전체가 깨진다
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;
export const cleanText = (value: string) => value.replace(INVALID_XML, '');
const escape = (value: string) => cleanText(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
// 가져온 파일의 서식 값은 형식이 틀릴 수 있다(검증기는 메모 서식의 형식을 보지 않는다). 그때는 기본값을 쓴다
const num = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : value === undefined || value === null ? fallback : String(value));
// 숫자는 정해진 자리에서 반올림해 적는다(같은 입력이면 같은 문자열, 소수 잡음 없음).
// 선 경로 좌표는 0.1 단위, 그 밖의 속성(투명도·굵기 등)은 0.01 단위다
const round = (value: number, step: number) => {
  const rounded = Math.round(value / step) * step;
  const fixed = Number(rounded.toFixed(step < 0.1 ? 2 : 1));
  return Object.is(fixed, -0) ? '0' : String(fixed);
};
const n = (value: number) => round(value, 0.01);
const roundPath = (d: string) => d.replace(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g, match => round(Number(match), 0.1));
const attrs = (values: Record<string, string | number | undefined>) =>
  Object.entries(values).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => ` ${key}="${typeof value === 'number' ? n(value) : escape(value!)}"`).join('');
// 글자 폭(em). PDF에 넣는 Pretendard Regular의 실측값이다: ASCII 95자는 아래 표, 한글은 0.864, 한자·전각은 1, 그 밖은 0.6.
// 줄임표·줄 바꿈·라벨 상자에 쓴다. 너무 넉넉하게 어림하면 화면에서는 다 보이는 단자 이름이 잘린다
const ASCII_EM = [
  0.251, 0.257, 0.379, 0.6, 0.607, 0.862, 0.609, 0.201, 0.341, 0.341, 0.471, 0.627, 0.258, 0.433, 0.254, 0.334,
  0.596, 0.438, 0.587, 0.617, 0.624, 0.597, 0.613, 0.552, 0.606, 0.613, 0.254, 0.254, 0.627, 0.627, 0.627, 0.479,
  0.88, 0.646, 0.619, 0.693, 0.686, 0.567, 0.557, 0.709, 0.706, 0.244, 0.516, 0.621, 0.533, 0.853, 0.718, 0.727,
  0.604, 0.727, 0.608, 0.607, 0.611, 0.707, 0.646, 0.915, 0.612, 0.634, 0.595, 0.341, 0.334, 0.341, 0.442, 0.425,
  0.469, 0.535, 0.591, 0.529, 0.591, 0.553, 0.337, 0.579, 0.562, 0.218, 0.218, 0.517, 0.218, 0.834, 0.557, 0.567,
  0.579, 0.579, 0.35, 0.496, 0.34, 0.553, 0.529, 0.777, 0.513, 0.529, 0.513, 0.341, 0.306, 0.341, 0.627,
];
const HANGUL = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/;
const WIDE = /[\u2e80-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;
export const textWidth = (value: string, size: number) => [...value].reduce((sum, char) => {
  const code = char.codePointAt(0)!;
  if (code >= 0x20 && code < 0x7f) return sum + ASCII_EM[code - 0x20];
  return sum + (HANGUL.test(char) ? 0.864 : WIDE.test(char) ? 1 : 0.6);
}, 0) * size;
// 넘치면 가운데를 줄인다. 끝의 번호(In 1, Out 12)가 남아야 단자끼리 구별된다(예: Line Audio In 1 → Line Au…In 1)
export const ellipsize = (value: string, size: number, max: number) => {
  if (textWidth(value, size) <= max) return value;
  const tail = /\s\S{1,6}$/.exec(value)?.[0] ?? value.slice(-3);
  let head = value.slice(0, value.length - tail.length);
  while (head && textWidth(`${head.trimEnd()}…${tail.trimStart()}`, size) > max) head = head.slice(0, -1);
  if (head.trim()) return `${head.trimEnd()}…${tail.trimStart()}`;
  let out = value;
  while (out && textWidth(`${out}…`, size) > max) out = out.slice(0, -1);
  return `${out}…`;
};
// 굵은 글자: font-weight와 함께 글자 색의 얇은 외곽선을 둔다. PDF에는 Regular 글꼴 하나만 넣으므로(결정 M-e) 외곽선이 굵기를 대신한다
const text = (content: string, values: Record<string, string | number | undefined>, bold = false) => {
  const size = Number(values['font-size'] ?? 12);
  const weight = bold ? { 'font-weight': 700, stroke: values.fill, 'stroke-width': Math.round(size * 0.035 * 100) / 100, 'stroke-linejoin': 'round' } : {};
  return `<text${attrs({ ...values, ...weight })}>${escape(content)}</text>`;
};
const dash = (style: string | undefined) => (style === 'dashed' ? '6 4' : style === 'dotted' ? '1.5 3' : undefined);
const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// ── 장비 ──
function equipmentSvg(node: DiagramNode, colorOf: (type: string) => string): string {
  const data = node.data as unknown as Equipment & { isReused?: boolean };
  const { x, y } = node.position;
  const width = G.NODE_WIDTH;
  const height = G.nodeHeight(data);
  const parts: string[] = [];
  parts.push(`<rect${attrs({ x, y, width, height, rx: 12, fill: data.isReused ? COLORS.reused : COLORS.node, stroke: COLORS.line, 'stroke-width': 1 })}/>`);
  // 헤더(54px): 제조사·모델명·장비 이름 세 줄
  const header = y + G.NODE_PADDING;
  const tag = data.portal?.unit ? data.portal.unit.toUpperCase() : data.portal?.variant ? '모델' : '';
  const brand = [str(data.manufacturer), tag, data.isReused ? '재사용' : ''].filter(Boolean).join(' · ');
  const inner = width - 24;
  parts.push(text(ellipsize(brand, 11, inner), { x: x + 12, y: header + 13, 'font-size': 11, fill: COLORS.muted }));
  parts.push(text(ellipsize(str(data.model), 14, inner), { x: x + 12, y: header + 31, 'font-size': 14, fill: COLORS.text }, true));
  parts.push(text(ellipsize(str(data.name), 11, inner), { x: x + 12, y: header + 47, 'font-size': 11, fill: COLORS.muted }));
  // 사진 자리(결정 M-c: 사진은 넣지 않고 높이만 화면과 같게 둔다)
  if (data.imageUrl) parts.push(`<rect${attrs({ x: x + 12, y: header + G.NODE_HEADER_HEIGHT + 4, width: inner, height: G.NODE_IMAGE_HEIGHT - 8, rx: 6, fill: COLORS.photo })}/>`);
  // 단자: 행 가운데 높이는 엔진 portAnchors와 같다. 점은 테두리 밖, 이름은 행 안쪽
  const anchors = new Map(G.portAnchors(data).map(anchor => [anchor.handle, anchor]));
  const hasIO = data.inputs.length > 0 || data.outputs.length > 0;
  const column = (width - 8) / 2 - 12 - 9;
  const portRow = (port: Port, side: 'left' | 'right' | 'both') => {
    const color = colorOf(port.type);
    const handle = side === 'both' ? `target_${port.id}` : port.id;
    const rowY = y + (anchors.get(handle)?.y ?? 0);
    const out: string[] = [];
    const dot = (cx: number) => out.push(`<circle${attrs({ cx, cy: rowY, r: G.HANDLE_SIZE / 2, fill: color, stroke: '#ffffff', 'stroke-width': 1.5 })}/>`);
    if (side === 'left' || side === 'both') dot(x - G.HANDLE_OUTSET + G.HANDLE_SIZE / 2);
    if (side === 'right' || side === 'both') dot(x + width + G.HANDLE_OUTSET - G.HANDLE_SIZE / 2);
    // 확인이 필요한 단자(VERIFIED·FOUND가 아님)는 화면처럼 "확인" 배지를 붙인다. 배지 자리만큼 이름 폭을 줄인다
    const review = !ACCEPTED.has(port.verification ?? '');
    const badge = review ? BADGE_WIDTH + 4 : 0;
    const label = ellipsize(str(port.label, port.id), 11, (side === 'both' ? width - 40 : column) - badge);
    const labelWidth = textWidth(label, 11);
    const badgeAt = (bx: number) => {
      if (!review) return;
      out.push(`<rect${attrs({ x: bx, y: rowY - 6.5, width: BADGE_WIDTH, height: 13, rx: 4, fill: '#fef3c7' })}/>`);
      out.push(text('확인', { x: bx + BADGE_WIDTH / 2, y: rowY + 3, 'font-size': 9, fill: '#b45309', 'text-anchor': 'middle' }));
    };
    if (side === 'left') {
      out.push(`<circle${attrs({ cx: x + 14.5, cy: rowY, r: 2.5, fill: color })}/>`);
      out.push(text(label, { x: x + 21, y: rowY + 4, 'font-size': 11, fill: COLORS.text }));
      badgeAt(x + 21 + labelWidth + 4);
    } else if (side === 'right') {
      out.push(`<circle${attrs({ cx: x + width - 14.5, cy: rowY, r: 2.5, fill: color })}/>`);
      out.push(text(label, { x: x + width - 21, y: rowY + 4, 'font-size': 11, fill: COLORS.text, 'text-anchor': 'end' }));
      badgeAt(x + width - 21 - labelWidth - 4 - BADGE_WIDTH);
    } else {
      // 양방향 행: 점 + 이름 (+ 배지)을 가운데에 모은다(화면 .port-both와 같다)
      const start = x + width / 2 - (5 + 4 + labelWidth + badge) / 2;
      out.push(`<circle${attrs({ cx: start + 2.5, cy: rowY, r: 2.5, fill: color })}/>`);
      out.push(text(label, { x: start + 9, y: rowY + 4, 'font-size': 11, fill: COLORS.text }));
      badgeAt(start + 9 + labelWidth + 4);
    }
    return out.join('');
  };
  data.inputs.forEach(port => parts.push(portRow(port, 'left')));
  data.outputs.forEach(port => parts.push(portRow(port, 'right')));
  if (data.bidirectional.length) {
    const firstBidi = anchors.get(`target_${data.bidirectional[0].id}`);
    if (firstBidi) parts.push(text('양방향', { x: x + width / 2, y: y + firstBidi.y - G.PORT_ROW_HEIGHT / 2 - 3, 'font-size': 10, fill: COLORS.muted, 'text-anchor': 'middle' }));
    data.bidirectional.forEach(port => parts.push(portRow(port, 'both')));
  }
  if (!hasIO && !data.bidirectional.length) parts.push(text('Portal에 단자 정보가 없습니다', { x: x + 12, y: header + G.NODE_HEADER_HEIGHT + (data.imageUrl ? G.NODE_IMAGE_HEIGHT : 0) + 14, 'font-size': 11, fill: COLORS.muted }));
  return `<g${attrs({ 'data-node': node.id })}>${parts.join('')}</g>`;
}

// ── 메모·영역 ──
// 글을 상자 폭에 맞춰 줄을 나눈다(SVG는 스스로 줄을 바꾸지 않는다). 화면처럼 낱말 단위로 나누고,
// 한 낱말이 폭보다 길면 글자 단위로 나눈다. 사용자가 넣은 줄 바꿈은 그대로 둔다
export function wrap(content: string, size: number, max: number): string[] {
  const lines: string[] = [];
  for (const paragraph of content.split('\n')) {
    let line = '';
    // 폭보다 긴 낱말은 글자 단위로 나눈다
    const byChar = (word: string) => {
      for (const char of [...word]) {
        if (line && textWidth(line + char, size) > max) { lines.push(line.trimEnd()); line = ''; }
        line += char;
      }
    };
    for (const word of paragraph.split(/(?<=\s)/)) {
      if (textWidth(line + word.trimEnd(), size) <= max) { line += word; continue; }
      if (line.trim()) { lines.push(line.trimEnd()); line = ''; }
      if (textWidth(word.trimEnd(), size) <= max) line = word;
      else byChar(word);
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

// 메모 서식 값(형식이 틀린 값은 기본값)
function noteStyle(data: Record<string, unknown>) {
  const D = ANNOTATION_DEFAULTS;
  const align = data.textAlign === 'left' || data.textAlign === 'right' ? data.textAlign : 'center';
  return {
    label: str(data.label), fontSize: num(data.fontSize, D.fontSize), fontColor: str(data.fontColor, D.fontColor), bgColor: str(data.bgColor, D.bgColor),
    bgOpacity: num(data.bgOpacity, D.bgOpacity), borderColor: str(data.borderColor, D.borderColor), borderStyle: str(data.borderStyle, D.borderStyle),
    borderRadius: num(data.borderRadius, D.borderRadius), textAlign: align,
  };
}

// clip: 상자 밖으로 넘친 글은 화면(overflow: hidden)처럼 자른다
function annotationSvg(node: DiagramNode, clipId: string): { body: string; clip: string } {
  const note = noteStyle(node.data);
  const { x, y } = node.position;
  const width = num(node.style?.width, 200);
  const height = num(node.style?.height, 60);
  const stroke = note.borderStyle === 'none' ? undefined : note.borderColor;
  const parts = [`<rect${attrs({ x, y, width, height, rx: note.borderRadius, fill: note.bgColor === 'transparent' ? 'none' : note.bgColor, stroke, 'stroke-width': stroke ? 1.5 : undefined, 'stroke-dasharray': stroke ? dash(note.borderStyle) : undefined, opacity: note.bgOpacity })}/>`];
  const lines = wrap(cleanText(note.label), note.fontSize, width - 16);
  const lineHeight = note.fontSize * 1.35;
  const top = y + height / 2 - (lines.length * lineHeight) / 2 + note.fontSize * 0.95;
  const anchor = note.textAlign === 'left' ? 'start' : note.textAlign === 'right' ? 'end' : 'middle';
  const textX = note.textAlign === 'left' ? x + 8 : note.textAlign === 'right' ? x + width - 8 : x + width / 2;
  const texts = lines.map((line, index) => text(line, { x: textX, y: top + index * lineHeight, 'font-size': note.fontSize, fill: note.fontColor, 'text-anchor': anchor }));
  parts.push(`<g${attrs({ 'clip-path': `url(#${clipId})` })}>${texts.join('')}</g>`);
  return {
    body: `<g${attrs({ 'data-node': node.id })}>${parts.join('')}</g>`,
    clip: `<clipPath${attrs({ id: clipId })}><rect${attrs({ x, y, width, height, rx: note.borderRadius })}/></clipPath>`,
  };
}

function shapeSvg(node: DiagramNode): string {
  const D = SHAPE_DEFAULTS;
  const data = node.data;
  const shapeType = data.shapeType === 'circle' || data.shapeType === 'rounded-rectangle' ? data.shapeType : 'rectangle';
  const zone = {
    shapeType, label: cleanText(str(data.label)), fontSize: num(data.fontSize, D.fontSize), fontColor: str(data.fontColor, D.fontColor), bgColor: str(data.bgColor, D.bgColor),
    bgOpacity: num(data.bgOpacity, D.bgOpacity), borderColor: str(data.borderColor, D.borderColor), borderStyle: str(data.borderStyle, D.borderStyle), borderWidth: num(data.borderWidth, D.borderWidth),
  };
  const { x, y } = node.position;
  const width = num(node.style?.width, 350);
  const height = num(node.style?.height, 250);
  const stroke = zone.borderStyle === 'none' ? undefined : zone.borderColor;
  const paint = { fill: zone.bgColor === 'transparent' ? 'none' : zone.bgColor, stroke, 'stroke-width': stroke ? zone.borderWidth : undefined, 'stroke-dasharray': stroke ? dash(zone.borderStyle) : undefined, opacity: zone.bgOpacity };
  const body = zone.shapeType === 'circle'
    ? `<ellipse${attrs({ cx: x + width / 2, cy: y + height / 2, rx: width / 2, ry: height / 2, ...paint })}/>`
    : `<rect${attrs({ x, y, width, height, rx: zone.shapeType === 'rounded-rectangle' ? 12 : undefined, ...paint })}/>`;
  const label = zone.label ? text(ellipsize(zone.label.toUpperCase(), zone.fontSize, width - 24), { x: x + width / 2, y: y + 12 + zone.fontSize, 'font-size': zone.fontSize, fill: zone.fontColor, 'text-anchor': 'middle', 'letter-spacing': '0.05em' }, true) : '';
  return `<g${attrs({ 'data-node': node.id })}>${body}${label}</g>`;
}

// ── 연결 ──
interface EdgeDrawing { id: string; d: string; color: string; label?: { text: string; x: number; y: number } ; points: XY[] }
function edgeDrawings(nodes: DiagramNode[], edges: DiagramEdge[], colorOf: (type: string) => string): EdgeDrawing[] {
  const view = normalizeBidiEdges(edges, nodes);
  const offsets = edgeOffsets(view, nodes);
  const byNode = new Map(nodes.map(node => [node.id, node]));
  const lines = view.flatMap(edge => {
    const source = anchorOf(byNode.get(edge.source), edge.sourceHandle);
    const target = anchorOf(byNode.get(edge.target), edge.targetHandle);
    if (!source || !target) return [];
    const splitOffset = offsets.get(edge.id) ?? 0;
    return [{ edge, splitOffset, source, target, points: getEdgePoints({ sourceX: source.ax, sourceY: source.ay, targetX: target.ax, targetY: target.ay, splitOffset }) }];
  });
  const jumps = edgeJumps(lines.map(line => ({ id: line.edge.id, points: line.points })));
  return lines.map(({ edge, splitOffset, source, target, points }) => {
    const labelText = cleanText(str(edge.data?.label));
    const label = labelText ? { text: labelText, x: (source.ax + target.ax) / 2 + splitOffset * 0.5, y: (source.ay + target.ay) / 2 } : undefined;
    return { id: edge.id, d: roundPath(buildOrthogonalPath(points, jumps.get(edge.id) ?? [])), color: (edge.style?.stroke as string) || colorOf(edge.data?.lineTypeId ?? ''), label, points };
  });
}

function labelSvg(drawing: EdgeDrawing): string {
  if (!drawing.label) return '';
  const width = textWidth(drawing.label.text, 10) + 14;
  const height = 17;
  return `<g${attrs({ 'data-edge-label': drawing.id })}>`
    + `<rect${attrs({ x: drawing.label.x - width / 2, y: drawing.label.y - height / 2, width, height, rx: 4, fill: '#ffffff', 'fill-opacity': 0.94, stroke: drawing.color, 'stroke-opacity': 0.4, 'stroke-width': 1 })}/>`
    + text(drawing.label.text, { x: drawing.label.x, y: drawing.label.y + 3.5, 'font-size': 10, fill: drawing.color, 'text-anchor': 'middle' }, true)
    + '</g>';
}

// ── 도면 범위 ──
function boundsOf(nodes: DiagramNode[], drawings: EdgeDrawing[]) {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  const take = (x: number, y: number) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
  for (const node of nodes) {
    const { x, y } = node.position;
    if (node.type === 'equipment') {
      take(x - G.HANDLE_OUTSET, y);
      take(x + G.NODE_WIDTH + G.HANDLE_OUTSET, y + G.nodeHeight(node.data as unknown as Equipment));
    } else {
      take(x, y);
      take(x + (node.style?.width ?? 0), y + (node.style?.height ?? 0));
    }
  }
  for (const drawing of drawings) {
    for (const point of drawing.points) take(point.x, point.y);
    if (drawing.label) {
      const half = (textWidth(drawing.label.text, 10) + 14) / 2;
      take(drawing.label.x - half, drawing.label.y - 9);
      take(drawing.label.x + half, drawing.label.y + 9);
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 400, maxY: 200 };
  return { minX, minY, maxX, maxY };
}

export function diagramSvg(diagram: Pick<Diagram, 'nodes' | 'edges'>, options: SvgOptions): DiagramSvg {
  const colors = new Map(options.lineTypes.map(lineType => [lineType.id, lineType.color]));
  const colorOf = (type: string) => colors.get(type) ?? '#64748b';
  // 화면 순서와 무관하게 같은 결과가 나오게 영역 → 장비 → 메모, 각각 id 순으로 그린다(영역은 선 아래, 메모는 위)
  const nodes = [...diagram.nodes].sort((a, b) => (NODE_ORDER[a.type] - NODE_ORDER[b.type]) || byId(a, b));
  const edges = [...diagram.edges].sort(byId);
  const drawings = edgeDrawings(nodes, edges, colorOf);
  const bounds = boundsOf(nodes, drawings);
  const stampText = options.stamp ? `AV Portal Builder v${options.stamp.version} · ${options.stamp.date}` : '';
  // 아주 작은 도면에서도 표기가 잘리지 않게 폭을 넓힌다
  const width = Math.max(bounds.maxX - bounds.minX + MARGIN * 2, stampText ? textWidth(stampText, 10) + MARGIN * 2 : 0);
  const height = bounds.maxY - bounds.minY + MARGIN * 2 + (options.stamp ? STAMP_HEIGHT : 0);
  const shift = { x: MARGIN - bounds.minX, y: MARGIN - bounds.minY };
  const zones = nodes.filter(node => node.type === 'shape').map(shapeSvg);
  const devices = nodes.filter(node => node.type === 'equipment').map(node => equipmentSvg(node, colorOf));
  const notes = nodes.filter(node => node.type === 'annotation').map((node, index) => annotationSvg(node, `note-clip-${index + 1}`));
  const lines = drawings.map(drawing => `<path${attrs({ 'data-edge': drawing.id, d: drawing.d, fill: 'none', stroke: drawing.color, 'stroke-width': 2, 'stroke-linejoin': 'round' })}/>`);
  const labels = drawings.map(labelSvg);
  const stamp = stampText ? text(stampText, { x: width - MARGIN / 2, y: height - MARGIN / 2, 'font-size': 10, fill: COLORS.muted, 'text-anchor': 'end' }) : '';
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<svg xmlns="http://www.w3.org/2000/svg"${attrs({ width, height, viewBox: `0 0 ${n(width)} ${n(height)}`, 'font-family': SVG_FONT })}>`
    + '<title>AV System Builder 구성도</title>'
    + (notes.length ? `<defs>${notes.map(note => note.clip).join('')}</defs>` : '')
    + `<rect${attrs({ x: 0, y: 0, width, height, fill: COLORS.background })}/>`
    + `<g${attrs({ transform: `translate(${n(shift.x)} ${n(shift.y)})` })}>`
    + zones.join('') + lines.join('') + labels.join('') + devices.join('') + notes.map(note => note.body).join('')
    + '</g>' + stamp + '</svg>\n';
  return { svg, width: Math.round(width * 10) / 10, height: Math.round(height * 10) / 10 };
}
