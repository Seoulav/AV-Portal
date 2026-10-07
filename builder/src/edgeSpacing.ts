// 평행 간격(B-20261006-06 결정 I-c). 같은 두 장비 사이 엣지 여러 개가 smoothstep의 세로 구간을 한 x에 겹쳐
// 한 줄로 보이지 않게 띄운다. 화면에만 쓰고 파일에는 남지 않는다.
// - 앞으로 가는 엣지(도착이 출발보다 오른쪽): 꺾이는 위치(stepPosition)를 순서대로 띄운다
// - 뒤로 가는 엣지(도착이 왼쪽): smoothstep이 stepPosition을 쓰지 않고 양 끝에서 offset만큼 나가 꺾는다. offset을 띄운다
// 구 Builder 평행선 알고리즘(edgeProcessing) 이식은 다음 작업에서 이 함수를 바꾼다.
import type { DiagramEdge, DiagramNode } from './engine';
import { anchorOf } from './proximity';

export const PARALLEL_GAP = 12;
// React Flow smoothstep 기본 offset(핸들에서 처음 꺾이기까지)
export const STEP_OFFSET = 20;

export interface PathSpacing { stepPosition?: number; offset?: number }

// 엣지 ID → smoothstep pathOptions. 두 개 이상 묶인 엣지만 돌려준다
export function pathSpacing(nodes: DiagramNode[], edges: DiagramEdge[]): Map<string, PathSpacing> {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const groups = new Map<string, { id: string; sy: number; ty: number; dx: number }[]>();
  for (const edge of edges) {
    const source = anchorOf(byId.get(edge.source), edge.sourceHandle);
    const target = anchorOf(byId.get(edge.target), edge.targetHandle);
    if (!source || !target) continue;
    const key = `${edge.source}->${edge.target}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ id: edge.id, sy: source.ay, ty: target.ay, dx: target.ax - source.ax });
  }
  const result = new Map<string, PathSpacing>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => (a.sy - b.sy) || (a.ty - b.ty) || (a.id < b.id ? -1 : 1));
    // 아래로 내려가는 묶음은 위의 선이 바깥(도착 쪽·먼 쪽)에서 꺾여야 서로 건너지 않는다. 올라가면 반대다
    const down = group.reduce((sum, item) => sum + (item.ty - item.sy), 0) >= 0;
    const order = (index: number) => (down ? group.length - 1 - index : index);
    const span = Math.min(...group.map(item => item.dx));
    if (span > 2 * STEP_OFFSET) {
      const gap = Math.min(PARALLEL_GAP, (span * 0.8) / group.length) / span;
      const middle = (group.length - 1) / 2;
      group.forEach((item, index) => result.set(item.id, { stepPosition: Math.min(0.95, Math.max(0.05, 0.5 + (order(index) - middle) * gap)) }));
    } else {
      group.forEach((item, index) => result.set(item.id, { offset: STEP_OFFSET + order(index) * PARALLEL_GAP }));
    }
  }
  return result;
}
