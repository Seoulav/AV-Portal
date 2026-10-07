// 선 종류 필터(구 Builder App.tsx의 hiddenLineTypeIds). 화면 상태라 파일·자동 저장·실행 취소에 넣지 않는다.
// 숨긴 선 종류의 연결은 그리지 않는다. 필터가 켜지면 보이는 연결이 없는 장비도 숨긴다(구와 같다). 메모·영역은 그대로 보인다
import type { Diagram, LineType } from './engine';

export interface LineFilter { active: boolean; hiddenEdges: Set<string>; hiddenNodes: Set<string> }
export const NO_FILTER: LineFilter = Object.freeze({ active: false, hiddenEdges: new Set<string>(), hiddenNodes: new Set<string>() });

// 도면에 쓰인 선 종류만 칩으로 보인다(결정 K-c). 순서는 규칙의 선 종류 순서이고, 규칙에 없는 id는 뒤에 붙인다.
// 숨겨 둔 종류는 그 연결을 다 지운 뒤에도 칩을 남긴다. 칩이 없으면 숨김을 풀 방법이 없다(리뷰 2)
export function usedLineTypes(diagram: Pick<Diagram, 'edges' | 'lineTypes'>, lineTypes: LineType[], hidden: string[] = []): LineType[] {
  const used = new Set([...diagram.edges.map(edge => edge.data.lineTypeId), ...hidden]);
  const known = lineTypes.filter(lineType => used.has(lineType.id));
  const listed = new Set(known.map(lineType => lineType.id));
  const fromFile = new Map(diagram.lineTypes.map(lineType => [lineType.id, lineType]));
  const rest = [...used].filter(id => !listed.has(id)).sort().map(id => fromFile.get(id) ?? { id, name: id, color: '#64748b' });
  return [...known, ...rest];
}

export function lineFilter(diagram: Pick<Diagram, 'nodes' | 'edges'>, hiddenLineTypes: string[]): LineFilter {
  if (!hiddenLineTypes.length) return NO_FILTER;
  const hidden = new Set(hiddenLineTypes);
  const hiddenEdges = new Set(diagram.edges.filter(edge => hidden.has(edge.data.lineTypeId)).map(edge => edge.id));
  // 숨긴 종류의 연결이 도면에 없으면(그 연결을 다 지운 뒤 등) 칩도 없으니 필터가 꺼진 것으로 본다
  if (!hiddenEdges.size) return NO_FILTER;
  const connected = new Set<string>();
  for (const edge of diagram.edges) {
    if (hiddenEdges.has(edge.id)) continue;
    connected.add(edge.source);
    connected.add(edge.target);
  }
  const hiddenNodes = new Set(diagram.nodes.filter(node => node.type === 'equipment' && !connected.has(node.id)).map(node => node.id));
  return { active: true, hiddenEdges, hiddenNodes };
}

// 근접 연결·묶음 놓기·범위 선택이 볼 장비. 숨긴 장비에 선이 붙거나 단자가 골라지지 않게 뺀다(리뷰 1)
export function visibleNodes<T extends { id: string }>(nodes: T[], filter: LineFilter): T[] {
  return filter.hiddenNodes.size ? nodes.filter(node => !filter.hiddenNodes.has(node.id)) : nodes;
}
