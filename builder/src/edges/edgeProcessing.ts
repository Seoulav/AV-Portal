// 평행선 간격·채널 순서(구 Builder src/utils/edgeProcessing.ts 이식, seoul-visual-tech/av-system-builder 2fd568e).
// 엣지마다 splitOffset(세로 구간을 가운데에서 얼마나 옮길지)을 정해 평행선이 겹치지 않고, 되도록 서로 건너지 않게 한다.
// 좌표는 구 Builder의 따로 계산하던 포트 좌표 대신 엔진 geometry.portAnchors(선이 실제로 붙는 점)를 쓴다.
// 화면에서만 쓰는 값이다. 파일에는 남기지 않는다(1.1 엣지에도 없다).
import type { DiagramNode } from '../engine';
import { anchorOf } from '../proximity';

export interface EdgeLike { id: string; source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }

interface EdgeEndpoints { sourceX: number; sourceY: number; targetX: number; targetY: number; baseX: number; baseY: number }

export const SPACING = 20;

function getEdgeEndpoints(edge: EdgeLike, nodeMap: Map<string, DiagramNode>): EdgeEndpoints | null {
  const source = anchorOf(nodeMap.get(edge.source), edge.sourceHandle);
  const target = anchorOf(nodeMap.get(edge.target), edge.targetHandle);
  if (!source || !target) return null;
  return { sourceX: source.ax, sourceY: source.ay, targetX: target.ax, targetY: target.ay, baseX: (source.ax + target.ax) / 2, baseY: (source.ay + target.ay) / 2 };
}

// 두 엣지의 통로가 겹치는가(가운데 x가 80px 안이고 세로 범위가 12px 이상 맞닿음)
function edgesConflict(infoI: EdgeEndpoints, infoJ: EdgeEndpoints): boolean {
  if (Math.abs(infoI.baseX - infoJ.baseX) >= 80) return false;
  const minYI = Math.min(infoI.sourceY, infoI.targetY);
  const maxYI = Math.max(infoI.sourceY, infoI.targetY);
  const minYJ = Math.min(infoJ.sourceY, infoJ.targetY);
  const maxYJ = Math.max(infoJ.sourceY, infoJ.targetY);
  return Math.max(minYI, minYJ) <= Math.min(maxYI, maxYJ) + 12;
}

// 그룹(같은 출발·도착을 공유하는 엣지들)의 세로 통로 왼→오 순서를 실제 교차 수가 가장 적게 되도록 다시 정한다.
// 세로 범위가 겹치는 퍼짐(위 대상의 입력 y가 아래 출력 y보다 낮음)에서는 "먼 대상이 왼쪽 통로"여야 교차가 없다
// (구 Builder v1.19 실사용 버그). n ≤ 6이면 순열 전수, 그 이상은 이웃 교환. 동점이면 원래 순서를 지킨다
function optimizeChannelOrder(active: EdgeLike[], infoMap: Map<string, EdgeEndpoints | null>): EdgeLike[] {
  const n = active.length;
  if (n < 2) return active;
  const infos = active.map(edge => infoMap.get(edge.id)!);
  // 앞으로 가는 그룹만(뒤로 가는 U자 경로는 원래 순서)
  if (infos.some(info => info.targetX < info.sourceX - 20)) return active;
  const cost = (order: number[]): number => {
    const xByIdx: number[] = [];
    order.forEach((edgeIdx, pos) => { xByIdx[edgeIdx] = infos[edgeIdx].baseX + (pos - (n - 1) / 2) * SPACING; });
    let crossings = 0;
    for (let i = 0; i < n; i += 1) {
      const xi = xByIdx[i];
      const yLo = Math.min(infos[i].sourceY, infos[i].targetY) + 2;
      const yHi = Math.max(infos[i].sourceY, infos[i].targetY) - 2;
      for (let j = 0; j < n; j += 1) {
        if (i === j) continue;
        const vj = infos[j];
        const xj = xByIdx[j];
        // j의 출발 쪽 가로선(sourceX → 꺾이는 점, y = sourceY)과 i의 세로선
        if (vj.sourceY > yLo && vj.sourceY < yHi && xi > Math.min(vj.sourceX, xj) + 2 && xi < Math.max(vj.sourceX, xj) - 2) crossings += 1;
        // j의 도착 쪽 가로선(꺾이는 점 → targetX, y = targetY)과 i의 세로선
        if (vj.targetY > yLo && vj.targetY < yHi && xi > Math.min(xj, vj.targetX) + 2 && xi < Math.max(xj, vj.targetX) - 2) crossings += 1;
      }
    }
    return crossings;
  };
  const base = active.map((_, i) => i);
  let bestCost = cost(base);
  if (bestCost === 0) return active;
  let bestOrder = base;
  if (n <= 6) {
    const permute = (rest: number[], current: number[]) => {
      if (rest.length === 0) {
        const c = cost(current);
        if (c < bestCost) { bestCost = c; bestOrder = [...current]; }
        return;
      }
      for (let i = 0; i < rest.length; i += 1) {
        if (bestCost === 0) return;
        current.push(rest[i]);
        permute([...rest.slice(0, i), ...rest.slice(i + 1)], current);
        current.pop();
      }
    };
    permute(base, []);
  } else {
    const order = [...base];
    let improved = true;
    let guard = 0;
    while (improved && guard < 20) {
      guard += 1;
      improved = false;
      for (let i = 0; i + 1 < n; i += 1) {
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
        const c = cost(order);
        if (c < bestCost) { bestCost = c; improved = true; } else { [order[i], order[i + 1]] = [order[i + 1], order[i]]; }
      }
    }
    bestOrder = order;
  }
  return bestOrder.map(i => active[i]);
}

// 양쪽 끝이 모두 양방향 핸들인 엣지인가(양방향 핸들만 source_/target_ 접두어가 있다)
export const isBidiBidiEdge = (edge: EdgeLike) => Boolean(edge.sourceHandle?.startsWith('source_')) && Boolean(edge.targetHandle?.startsWith('target_'));

// 양방향↔양방향 엣지를 노드 좌우 위치에 맞게 왼→오로 뒤집어 그릴지. 양방향 단자는 방향이 없어
// 저장된 source·target은 연결할 때 끈 방향일 뿐이다. 노드 가로 중심은 폭 220 기준(장비 노드는 폭이 고정)
export function shouldFlipBidiEdge(edge: EdgeLike, nodeMap: Map<string, DiagramNode>): boolean {
  if (!isBidiBidiEdge(edge)) return false;
  const s = nodeMap.get(edge.source);
  const t = nodeMap.get(edge.target);
  return Boolean(s && t && s.position.x > t.position.x);
}

// 화면에만 쓰는 변환이다. 저장 데이터는 건드리지 않는다. 노드를 끌어 좌우가 바뀌면 다음 그림에서 바로 반대쪽 핸들에 붙는다
export function normalizeBidiEdges<T extends EdgeLike>(edges: T[], nodes: DiagramNode[]): T[] {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  return edges.map(edge => (shouldFlipBidiEdge(edge, nodeMap)
    ? { ...edge, source: edge.target, target: edge.source, sourceHandle: `source_${edge.targetHandle!.substring(7)}`, targetHandle: `target_${edge.sourceHandle!.substring(7)}` }
    : edge));
}

// 엣지마다 splitOffset을 정한다(구 Builder와 같은 단계)
// - Stage 0 같은 쌍(같은 출발·도착 장비): 내려가면 위 출발이 가장 바깥, 올라가면 반대
// - Stage 1 모임(여러 출발 → 같은 도착): 출발 y 순 → 채널 순서 최적화
// - Stage 2 퍼짐(같은 출발 → 여러 도착): 도착 y 순 → 채널 순서 최적화
// - Stage 3 그 밖의 겹침: 충돌 그래프의 묶음마다 가운데 y 순
// - Stage 4 전역 세로 통로: 다른 묶음의 세로선이 같은 x에 겹치면 옆으로 민다. 통로 제한을 먼저 적용한 뒤 민다
export function edgeOffsets(input: EdgeLike[], nodes: DiagramNode[]): Map<string, number> {
  // 같은 값끼리의 순서가 결과를 바꾼다(정렬이 안정적이고 Stage 3·4가 넣은 순서를 따른다). 저장·불러오기는 엣지를 id 순으로 쓰므로
  // 여기서도 id 순으로 맞춰, 같은 파일이 새로고침 전후로 다르게 그려지지 않게 한다
  const edges = [...input].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const infoMap = new Map<string, EdgeEndpoints | null>();
  for (const edge of edges) infoMap.set(edge.id, getEdgeEndpoints(edge, nodeMap));
  const hasSpan = (info: EdgeEndpoints) => Math.abs(info.sourceY - info.targetY) > 5;
  const offsets = new Map<string, number>();
  const handled = new Set<string>();
  const groupBy = (key: (edge: EdgeLike) => string) => {
    const groups = new Map<string, EdgeLike[]>();
    for (const edge of edges) {
      const k = key(edge);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(edge);
    }
    return groups;
  };
  const info = (edge: EdgeLike) => infoMap.get(edge.id)!;

  // Stage 0
  for (const group of groupBy(edge => `${edge.source}::${edge.target}`).values()) {
    const active = group.filter(edge => infoMap.get(edge.id) && hasSpan(info(edge)));
    if (active.length < 2) continue;
    const avgDy = active.reduce((sum, edge) => sum + (info(edge).targetY - info(edge).sourceY), 0) / active.length;
    active.sort((a, b) => (avgDy >= 0 ? info(b).sourceY - info(a).sourceY : info(a).sourceY - info(b).sourceY));
    active.forEach((edge, i) => { offsets.set(edge.id, (i - (active.length - 1) / 2) * SPACING); handled.add(edge.id); });
  }
  // Stage 1
  for (const group of groupBy(edge => edge.target).values()) {
    const active = group.filter(edge => infoMap.get(edge.id) && hasSpan(info(edge)) && !handled.has(edge.id));
    if (active.length < 2) continue;
    active.sort((a, b) => info(a).sourceY - info(b).sourceY);
    const ordered = optimizeChannelOrder(active, infoMap);
    ordered.forEach((edge, i) => { offsets.set(edge.id, (i - (ordered.length - 1) / 2) * SPACING); handled.add(edge.id); });
  }
  // Stage 2
  for (const group of groupBy(edge => edge.source).values()) {
    const active = group.filter(edge => infoMap.get(edge.id) && hasSpan(info(edge)) && !handled.has(edge.id) && !offsets.has(edge.id));
    if (active.length < 2) continue;
    active.sort((a, b) => info(a).targetY - info(b).targetY);
    const ordered = optimizeChannelOrder(active, infoMap);
    ordered.forEach((edge, i) => { offsets.set(edge.id, (i - (ordered.length - 1) / 2) * SPACING); });
  }
  // Stage 3
  const remaining = edges.filter(edge => infoMap.get(edge.id) && hasSpan(info(edge)) && !offsets.has(edge.id));
  if (remaining.length >= 2) {
    const n = remaining.length;
    const adj: number[][] = Array.from({ length: n }, () => []);
    // 충돌은 가운데 x가 80px 안일 때만 생긴다. 가운데 x로 정렬해 그 창 안만 비교한다(구 Builder는 모든 쌍).
    // 이웃 목록은 번호 순으로 정렬해 구 Builder와 같은 BFS 순서·같은 결과를 낸다
    const byBaseX = remaining.map((_, i) => i).sort((a, b) => info(remaining[a]).baseX - info(remaining[b]).baseX);
    for (let p = 0; p < n; p += 1) {
      const i = byBaseX[p];
      for (let q = p + 1; q < n; q += 1) {
        const j = byBaseX[q];
        if (info(remaining[j]).baseX - info(remaining[i]).baseX >= 80) break;
        if (edgesConflict(info(remaining[i]), info(remaining[j]))) { adj[i].push(j); adj[j].push(i); }
      }
    }
    for (const list of adj) list.sort((a, b) => a - b);
    const visited = new Set<number>();
    for (let i = 0; i < n; i += 1) {
      if (visited.has(i)) continue;
      const component: number[] = [];
      const queue = [i];
      visited.add(i);
      while (queue.length) {
        const u = queue.shift()!;
        component.push(u);
        for (const v of adj[u]) if (!visited.has(v)) { visited.add(v); queue.push(v); }
      }
      if (component.length < 2) continue;
      component.sort((a, b) => info(remaining[a]).baseY - info(remaining[b]).baseY);
      component.forEach((u, idx) => offsets.set(remaining[u].id, (idx - (component.length - 1) / 2) * SPACING));
    }
  }
  // Stage 4
  const MIN_V_GAP = 14;
  interface VSeg { id: string; splitX: number; yMin: number; yMax: number; minX: number; maxX: number }
  const vsegs: VSeg[] = [];
  for (const edge of edges) {
    const item = infoMap.get(edge.id);
    if (!item) continue;
    if (item.targetX < item.sourceX - 20) continue; // 뒤로 가는 엣지는 따로 U자 경로
    if (Math.abs(item.sourceY - item.targetY) < 8) continue; // 직선 — 세로 구간 없음
    const mid = (item.sourceX + item.targetX) / 2;
    vsegs.push({
      id: edge.id,
      splitX: mid + (offsets.get(edge.id) ?? 0),
      yMin: Math.min(item.sourceY, item.targetY),
      yMax: Math.max(item.sourceY, item.targetY),
      minX: Math.min(item.sourceX, item.targetX) + 20,
      // 세로선이 중간 열의 장비를 꿰뚫지 않도록 출발 열 가까운 통로로 제한한다
      maxX: Math.min(Math.max(item.sourceX, item.targetX) - 20, item.sourceX + 200),
    });
  }
  vsegs.sort((a, b) => a.splitX - b.splitX);
  const placed: VSeg[] = [];
  for (const seg of vsegs) {
    // 통로 제한을 먼저 적용하고 겹침을 민다. 순서를 바꾸면 제한이 이미 푼 겹침을 같은 x로 다시 모은다
    let x = Math.max(seg.minX, Math.min(seg.maxX, seg.splitX));
    let moved = true;
    let guard = 0;
    while (moved && guard < 32) {
      guard += 1;
      moved = false;
      for (const p of placed) {
        const yOverlap = Math.min(seg.yMax, p.yMax) - Math.max(seg.yMin, p.yMin);
        if (yOverlap > 4 && Math.abs(x - p.splitX) < MIN_V_GAP) { x = p.splitX + MIN_V_GAP; moved = true; }
      }
    }
    if (x !== seg.splitX) {
      const item = infoMap.get(seg.id)!;
      offsets.set(seg.id, x - (item.sourceX + item.targetX) / 2);
    }
    placed.push({ ...seg, splitX: x });
  }
  return offsets;
}
