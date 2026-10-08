// 도면 SVG 내보내기(B-20261006-10). 구성도 데이터(엔진 좌표)로 직접 그린다.
// 화면(DOM)을 읽지 않으므로 줌·선택·선 종류 필터·테마와 무관하게 같은 구성도는 같은 문자열이 된다(결정 M-f: 늘 밝은 바탕).
// - 장비: 엔진 geometry 치수(화면과 같다). 사진은 넣지 않고 자리만 둔다(결정 M-c)
// - 연결: 화면과 같은 계산(normalizeBidiEdges → edgeOffsets → edgeJumps → buildOrthogonalPath). 라벨은 화면과 같다(결정 M-d)
// - 메모·영역: 구 Builder AnnotationNode·ShapeNode와 같은 규칙(B-20261006-09)
import { geometry as G, type Diagram, type DiagramEdge, type DiagramNode, type Equipment, type LineType, type Port } from '../engine';
import { ANNOTATION_DEFAULTS, SHAPE_DEFAULTS, type NoteData } from '../components/NoteNodes';
import { buildOrthogonalPath, edgeJumps, getEdgePoints, type XY } from '../edges/edgeGeometry';
import { edgeOffsets, normalizeBidiEdges } from '../edges/edgeProcessing';
import { anchorOf } from '../proximity';

export const SVG_FONT = "Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
const MARGIN = 40;
const STAMP_HEIGHT = 24;
const COLORS = { text: '#0f172a', muted: '#64748b', line: '#e2e8f0', node: '#ffffff', reused: '#fffbeb', photo: '#f1f5f9', background: '#ffffff' };
const NODE_ORDER: Record<string, number> = { shape: 0, equipment: 1, annotation: 2 };

export interface SvgOptions {
  lineTypes: LineType[];
  // 오른쪽 아래 표기(결정 M-b). 빼면 표기 없이 그린다(시험은 결정적 결과를 위해 고정 값을 준다)
  stamp?: { version: string; date: string };
}
export interface DiagramSvg { svg: string; width: number; height: number }

// ── 문자열 도우미 ──
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
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
// 글자 폭 어림(한글·한자는 1em, 그 밖은 0.6em). 줄임표·줄 바꿈·라벨 상자에 쓴다
export const textWidth = (text: string, size: number) => [...text].reduce((sum, char) => sum + (/[ᄀ-ᇿ　-鿿가-힯＀-￯]/.test(char) ? 1 : 0.6), 0) * size;
const ellipsize = (text: string, size: number, max: number) => {
  if (textWidth(text, size) <= max) return text;
  let out = text;
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
  const brand = [data.manufacturer ?? '', tag, data.isReused ? '재사용' : ''].filter(Boolean).join(' · ');
  const inner = width - 24;
  parts.push(text(ellipsize(brand, 11, inner), { x: x + 12, y: header + 13, 'font-size': 11, fill: COLORS.muted }));
  parts.push(text(ellipsize(data.model ?? '', 14, inner), { x: x + 12, y: header + 31, 'font-size': 14, fill: COLORS.text }, true));
  parts.push(text(ellipsize(data.name ?? '', 11, inner), { x: x + 12, y: header + 47, 'font-size': 11, fill: COLORS.muted }));
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
    const label = side === 'both' ? ellipsize(port.label, 11, width - 40) : ellipsize(port.label, 11, column);
    if (side === 'left') {
      out.push(`<circle${attrs({ cx: x + 14.5, cy: rowY, r: 2.5, fill: color })}/>`);
      out.push(text(label, { x: x + 21, y: rowY + 4, 'font-size': 11, fill: COLORS.text }));
    } else if (side === 'right') {
      out.push(`<circle${attrs({ cx: x + width - 14.5, cy: rowY, r: 2.5, fill: color })}/>`);
      out.push(text(label, { x: x + width - 21, y: rowY + 4, 'font-size': 11, fill: COLORS.text, 'text-anchor': 'end' }));
    } else {
      out.push(text(label, { x: x + width / 2, y: rowY + 4, 'font-size': 11, fill: COLORS.text, 'text-anchor': 'middle' }));
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
// 글을 상자 폭에 맞춰 줄을 나눈다(SVG는 스스로 줄을 바꾸지 않는다). 사용자가 넣은 줄 바꿈은 그대로 둔다
function wrap(content: string, size: number, max: number): string[] {
  const lines: string[] = [];
  for (const paragraph of content.split('\n')) {
    let line = '';
    for (const char of [...paragraph]) {
      if (line && textWidth(line + char, size) > max) { lines.push(line); line = ''; }
      line += char;
    }
    lines.push(line);
  }
  return lines;
}

function annotationSvg(node: DiagramNode): string {
  const note = { ...ANNOTATION_DEFAULTS, ...(node.data as NoteData) };
  const { x, y } = node.position;
  const width = node.style?.width ?? 200;
  const height = node.style?.height ?? 60;
  const stroke = note.borderStyle === 'none' ? undefined : note.borderColor;
  const parts = [`<rect${attrs({ x, y, width, height, rx: note.borderRadius, fill: note.bgColor === 'transparent' ? 'none' : note.bgColor, stroke, 'stroke-width': stroke ? 1.5 : undefined, 'stroke-dasharray': stroke ? dash(note.borderStyle) : undefined, opacity: note.bgOpacity })}/>`];
  const lines = wrap(note.label ?? '', note.fontSize, width - 16);
  const lineHeight = note.fontSize * 1.35;
  const top = y + height / 2 - (lines.length * lineHeight) / 2 + note.fontSize * 0.95;
  const anchor = note.textAlign === 'left' ? 'start' : note.textAlign === 'right' ? 'end' : 'middle';
  const textX = note.textAlign === 'left' ? x + 8 : note.textAlign === 'right' ? x + width - 8 : x + width / 2;
  lines.forEach((line, index) => parts.push(text(line, { x: textX, y: top + index * lineHeight, 'font-size': note.fontSize, fill: note.fontColor, 'text-anchor': anchor })));
  return `<g${attrs({ 'data-node': node.id })}>${parts.join('')}</g>`;
}

function shapeSvg(node: DiagramNode): string {
  const zone = { ...SHAPE_DEFAULTS, ...(node.data as NoteData) };
  const { x, y } = node.position;
  const width = node.style?.width ?? 350;
  const height = node.style?.height ?? 250;
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
    const label = edge.data?.label ? { text: edge.data.label, x: (source.ax + target.ax) / 2 + splitOffset * 0.5, y: (source.ay + target.ay) / 2 } : undefined;
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
  const width = bounds.maxX - bounds.minX + MARGIN * 2;
  const height = bounds.maxY - bounds.minY + MARGIN * 2 + (options.stamp ? STAMP_HEIGHT : 0);
  const shift = { x: MARGIN - bounds.minX, y: MARGIN - bounds.minY };
  const zones = nodes.filter(node => node.type === 'shape').map(shapeSvg);
  const devices = nodes.filter(node => node.type === 'equipment').map(node => equipmentSvg(node, colorOf));
  const notes = nodes.filter(node => node.type === 'annotation').map(annotationSvg);
  const lines = drawings.map(drawing => `<path${attrs({ 'data-edge': drawing.id, d: drawing.d, fill: 'none', stroke: drawing.color, 'stroke-width': 2, 'stroke-linejoin': 'round' })}/>`);
  const labels = drawings.map(labelSvg);
  const stamp = options.stamp
    ? text(`AV Portal Builder v${options.stamp.version} · ${options.stamp.date}`, { x: width - MARGIN / 2, y: height - MARGIN / 2, 'font-size': 10, fill: COLORS.muted, 'text-anchor': 'end' })
    : '';
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<svg xmlns="http://www.w3.org/2000/svg"${attrs({ width, height, viewBox: `0 0 ${n(width)} ${n(height)}`, 'font-family': SVG_FONT })}>`
    + '<title>AV System Builder 구성도</title>'
    + `<rect${attrs({ x: 0, y: 0, width, height, fill: COLORS.background })}/>`
    + `<g${attrs({ transform: `translate(${n(shift.x)} ${n(shift.y)})` })}>`
    + zones.join('') + lines.join('') + labels.join('') + devices.join('') + notes.join('')
    + '</g>' + stamp + '</svg>\n';
  return { svg, width: Math.round(width * 10) / 10, height: Math.round(height * 10) / 10 };
}
