// 평행 간격(B-20261006-06 결정 I-c). 같은 두 장비 사이 엣지 여러 개가 smoothstep의 세로 구간을 한 x에 겹쳐
// 한 줄로 보이지 않게, 꺾이는 위치(stepPosition)를 순서대로 띄운다. 화면에만 쓰고 파일에는 남지 않는다.
// 구 Builder 평행선 알고리즘(edgeProcessing) 이식은 다음 작업에서 이 함수를 바꾼다.
import type { DiagramEdge, DiagramNode } from './engine';
import { anchorOf } from './proximity';

export const PARALLEL_GAP = 12;

// 엣지 ID → stepPosition(0~1, 출발 → 도착 사이 꺾이는 위치). 두 개 이상 묶인 엣지만 돌려준다
export function stepPositions(nodes: DiagramNode[], edges: DiagramEdge[]): Map<string, number> {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const groups = new Map<string, { id: string; sy: number; ty: number; dx: number }[]>();
  for (const edge of edges) {
    const source = anchorOf(byId.get(edge.source), edge.sourceHandle);
    const target = anchorOf(byId.get(edge.target), edge.targetHandle);
    if (!source || !target) continue;
    const key = `${edge.source}->${edge.target}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ id: edge.id, sy: source.ay, ty: target.ay, dx: Math.abs(target.ax - source.ax) });
  }
  const result = new Map<string, number>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => (a.sy - b.sy) || (a.ty - b.ty) || (a.id < b.id ? -1 : 1));
    const dx = Math.min(...group.map(item => item.dx));
    if (dx <= 0) continue;
    // 아래로 내려가는 묶음은 위의 선이 도착 쪽에서 꺾여야 서로 건너지 않는다. 올라가면 반대다
    const down = group.reduce((sum, item) => sum + (item.ty - item.sy), 0) >= 0;
    const gap = Math.min(PARALLEL_GAP, (dx * 0.8) / group.length) / dx;
    const middle = (group.length - 1) / 2;
    group.forEach((item, index) => {
      const offset = (index - middle) * gap;
      result.set(item.id, Math.min(0.95, Math.max(0.05, 0.5 + (down ? -offset : offset))));
    });
  }
  return result;
}
