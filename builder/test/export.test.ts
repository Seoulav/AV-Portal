import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, type Equipment, type Library, type Port } from '../src/engine';
import { diagramSvg, textWidth } from '../src/export/diagramSvg';
import { createBuilderStore } from '../src/state/store';

// 합성 라이브러리(현재 Portal 데이터와 무관). 모델명에 XML 특수 문자를 넣는다
const port = (id: string, direction: Port['direction'], signal: string, type: string): Port => ({ id, label: id, type, direction, connector: signal === 'ETHERNET' ? 'RJ45' : 'HDMI', signals: [signal], verification: 'FOUND' });
const UNITS: [string, string, Port[]][] = [
  ['src', 'A&B <SRC>', [port('out-hdmi-1', 'out', 'HDMI', 'video'), port('out-hdmi-2', 'out', 'HDMI', 'video'), port('both-ethernet-1', 'both', 'ETHERNET', 'network')]],
  ['dst', '"DST"', [port('in-hdmi-1', 'in', 'HDMI', 'video'), port('in-hdmi-2', 'in', 'HDMI', 'video'), port('both-ethernet-1', 'both', 'ETHERNET', 'network')]],
];
const library = {
  schema: 'av-portal.builder-library', schemaVersion: '1.0.0', source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })), vocabulary: { connectorWildcards: {}, connectorEquivalents: [], levelPairs: [] },
  products: UNITS.map(([id, model, ports]) => ({ productId: id, source: 'portal', brand: 'T', product: id, categories: ['x', 'Video', 'D'], detailUrl: '', placeable: true, units: [{ unitId: id, equipment: { id, category: 'video', name: '장비', model, manufacturer: 'T', inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'), portal: { productId: id, source: 'portal', detailUrl: '' } } as Equipment }], readiness: { ioRows: 1, ports: ports.length, unresolvedRows: 0, nonPortRows: 0 } })),
} as unknown as Library;
const OPTIONS = { lineTypes: DEFAULT_RULES.lineTypes, stamp: { version: '0.0.0-test', date: '2026-10-08' } };

const setup = () => {
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed: 8, now: 0 }) });
  store.getState().setLibrary(index);
  const place = (id: string, x: number, y: number) => store.getState().addEquipment(index.units.get(id)!.equipment, { x, y });
  const src = place('src', 0, 0);
  const dst = place('dst', 500, 160);
  for (const [s, sh, t, th] of [[src, 'out-hdmi-1', dst, 'in-hdmi-1'], [src, 'out-hdmi-2', dst, 'in-hdmi-2'], [src, 'source_both-ethernet-1', dst, 'target_both-ethernet-1']]) {
    expect(store.getState().connect({ source: s, sourceHandle: sh, target: t, targetHandle: th })).toBe(true);
  }
  const hdmi = store.getState().diagram.edges.find(edge => edge.sourceHandle === 'out-hdmi-1')!;
  store.getState().updateEdge(hdmi.id, { label: 'PGM <1> & "A"', rows: [] });
  store.getState().addAnnotation({ x: 0, y: 420 });
  store.getState().addShape({ x: 700, y: 420 });
  return { store, src, dst };
};

describe('diagram SVG export (B-20261006-10)', () => {
  it('draws every device, link, note and zone, with the stamp only when asked', () => {
    const { store } = setup();
    const { diagram } = store.getState();
    const { svg, width, height } = diagramSvg(diagram, OPTIONS);
    expect((svg.match(/ data-node="/g) ?? []).length).toBe(diagram.nodes.length);
    expect((svg.match(/<path data-edge="/g) ?? []).length).toBe(diagram.edges.length);
    expect(svg).toContain('data-edge-label=');
    expect(svg).toContain('AV Portal Builder v0.0.0-test · 2026-10-08');
    expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
    expect(diagramSvg(diagram, { lineTypes: OPTIONS.lineTypes }).svg).not.toContain('AV Portal Builder v');
  });

  it('escapes XML special characters in models and labels', () => {
    const { store } = setup();
    const { svg } = diagramSvg(store.getState().diagram, OPTIONS);
    expect(svg).toContain('A&amp;B &lt;SRC&gt;');
    expect(svg).toContain('&quot;DST&quot;');
    expect(svg).toContain('PGM &lt;1&gt; &amp; &quot;A&quot;');
    // 글자 안에 날것의 < 나 엔티티가 아닌 & 가 없다
    for (const [, content] of svg.matchAll(/<text[^>]*>([^]*?)<\/text>/g)) {
      expect(content).not.toMatch(/<|&(?!amp;|lt;|gt;|quot;|#39;)/);
    }
  });

  it('is the same for the same diagram whatever the order or the screen state (selection, drag, filter, theme)', () => {
    const { store } = setup();
    const { diagram } = store.getState();
    const base = diagramSvg(diagram, OPTIONS).svg;
    const shuffled = { ...diagram, nodes: [...diagram.nodes].reverse(), edges: [...diagram.edges].reverse() };
    expect(diagramSvg(shuffled, OPTIONS).svg).toBe(base);
    const viewState = { ...diagram, nodes: diagram.nodes.map(node => ({ ...node, selected: true, dragging: true })) };
    expect(diagramSvg(viewState, OPTIONS).svg).toBe(base);
    store.getState().toggleLineType('network');
    store.getState().toggleTheme();
    expect(diagramSvg(store.getState().diagram, OPTIONS).svg).toBe(base);
    // 선 경로 좌표는 0.1 단위, 투명도 같은 값은 그대로(0.25가 0.3으로 뭉개지지 않는다)
    for (const [, d] of base.matchAll(/ d="([^"]+)"/g)) expect(d).not.toMatch(/\d\.\d{2,}/);
    expect(base).toContain('opacity="0.25"');
  });

  it('frames the drawing around everything with a margin, including the dots outside the device border', () => {
    const { store } = setup();
    const { diagram } = store.getState();
    const { svg, width } = diagramSvg(diagram, OPTIONS);
    const [, dx] = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(svg)!;
    // 가장 왼쪽 장비 점(x = -20)이 여백 40 안쪽에 온다
    expect(Number(dx)).toBe(60);
    expect(width).toBeGreaterThan(700 + 350);
  });

  it('wraps a long note into lines and keeps manual line breaks', () => {
    const { store } = setup();
    const note = store.getState().diagram.nodes.find(node => node.type === 'annotation')!;
    store.getState().updateNoteData(note.id, { label: `첫 줄\n${'긴 메모 글자를 상자 폭에 맞춰 나눈다 '.repeat(2)}` });
    const { svg } = diagramSvg(store.getState().diagram, OPTIONS);
    const group = new RegExp(`<g data-node="${note.id}">(.*?)</g>`).exec(svg)![1];
    const lines = [...group.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(match => match[1]);
    expect(lines[0]).toBe('첫 줄');
    expect(lines.length).toBeGreaterThan(2);
    expect(lines.every(line => textWidth(line, 14) <= 200 - 16)).toBe(true);
  });

  it('colours port dots and links with the line type colours', () => {
    const { store } = setup();
    const { svg } = diagramSvg(store.getState().diagram, OPTIONS);
    const video = DEFAULT_RULES.lineTypes.find(item => item.id === 'video')!.color;
    const network = DEFAULT_RULES.lineTypes.find(item => item.id === 'network')!.color;
    expect(svg).toContain(`fill="${video}"`);
    expect(svg).toMatch(new RegExp(`<path data-edge="[^"]+" d="[^"]+" fill="none" stroke="${network}"`));
  });
});
