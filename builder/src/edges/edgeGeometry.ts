// 엣지 지오메트리(구 Builder src/utils/edgeGeometry.ts 이식, seoul-visual-tech/av-system-builder 2fd568e).
// 렌더러(BuilderEdge)와 교차 계산이 반드시 같은 경로 지점을 본다. 한쪽만 바꾸면 점프가 실제 교차 지점에서 어긋난다.
// 모든 엣지는 축 정렬(가로·세로) 세그먼트로만 이루어져 교차 판정이 정확하다.
// 이 앱의 장비 노드는 늘 왼쪽 입력·오른쪽 출력이라 가로 흐름만 옮겼다(구 Builder의 위→아래 흐름은 화면에서 쓰지 않았다).

export interface XY { x: number; y: number }

export interface EdgeGeomInput {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  splitOffset: number;
}

// 뒤로 가는 엣지 판정 기준(구 Builder와 같다)
export const BACK_EDGE_THRESHOLD = 20;

// 엣지의 직교 폴리라인 지점 목록
// - 앞으로 가는 엣지: 가로-세로-가로(source → splitX → target)
// - 뒤로 가는 엣지: 아래로 내려갔다 되돌아오는 U자 우회
export function getEdgePoints({ sourceX, sourceY, targetX, targetY, splitOffset }: EdgeGeomInput): XY[] {
  if (targetX < sourceX - BACK_EDGE_THRESHOLD) {
    const exitH = 50;
    const loopY = Math.max(sourceY, targetY) + 90 + Math.abs(splitOffset);
    const exitX = sourceX + exitH;
    const entryX = targetX - exitH;
    return [
      { x: sourceX, y: sourceY },
      { x: exitX, y: sourceY },
      { x: exitX, y: loopY },
      { x: entryX, y: loopY },
      { x: entryX, y: targetY },
      { x: targetX, y: targetY },
    ];
  }
  // 수평 직선에 가까우면(수 px 이내) 굴곡 없이 직결한다. 미세한 S자 꺾임을 막는다
  if (Math.abs(sourceY - targetY) < 8) {
    return [
      { x: sourceX, y: sourceY },
      { x: targetX, y: targetY },
    ];
  }
  const splitX = (sourceX + targetX) / 2 + splitOffset;
  return [
    { x: sourceX, y: sourceY },
    { x: splitX, y: sourceY },
    { x: splitX, y: targetY },
    { x: targetX, y: targetY },
  ];
}

const EPS = 0.5;
// 세그먼트 끝에서 이 거리 안의 교차는 점프로 그리지 않는다(코너 라운드와 충돌 방지)
const JUMP_END_MARGIN = 14;

// 이 엣지의 "가로" 세그먼트가 다른 엣지들의 "세로" 세그먼트를 가로지르는 지점 목록.
// 규칙: 가로 세그먼트를 가진 쪽이 점프한다. 모든 가로×세로 교차는 정확히 한 번, 가로 쪽에서 아치로 그린다
export function computeJumps(points: XY[], otherPolylines: XY[][]): XY[] {
  const jumps: XY[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (Math.abs(a.y - b.y) > EPS) continue;
    const y = a.y;
    const x1 = Math.min(a.x, b.x);
    const x2 = Math.max(a.x, b.x);
    for (const poly of otherPolylines) {
      for (let j = 0; j < poly.length - 1; j += 1) {
        const c = poly[j];
        const d = poly[j + 1];
        if (Math.abs(c.x - d.x) > EPS) continue;
        const x = c.x;
        const yy1 = Math.min(c.y, d.y);
        const yy2 = Math.max(c.y, d.y);
        if (x > x1 + JUMP_END_MARGIN && x < x2 - JUMP_END_MARGIN && y > yy1 + 4 && y < yy2 - 4) jumps.push({ x, y });
      }
    }
  }
  return jumps;
}

// 직교 폴리라인 → SVG path. 안쪽 코너는 반경 cornerR로 둥글리고(세그먼트가 짧으면 줄인다),
// 가로 세그먼트 위의 점프 지점에는 위로 볼록한 반원 아치를 그린다
export function buildOrthogonalPath(points: XY[], jumps: XY[], cornerR = 10, jumpR = 6): string {
  const pts: XY[] = [];
  for (const p of points) {
    const last = pts[pts.length - 1];
    if (!last || Math.abs(last.x - p.x) > EPS || Math.abs(last.y - p.y) > EPS) pts.push(p);
  }
  if (pts.length < 2) return '';
  const segLen = (i: number) => Math.abs(pts[i + 1].x - pts[i].x) + Math.abs(pts[i + 1].y - pts[i].y);
  const radii = pts.map((_, i) => (i === 0 || i === pts.length - 1 ? 0 : Math.min(cornerR, segLen(i - 1) / 2, segLen(i) / 2)));

  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const rA = radii[i];
    const rB = radii[i + 1];
    const horizontal = Math.abs(a.y - b.y) <= EPS;
    const dirX = Math.sign(b.x - a.x);
    const dirY = Math.sign(b.y - a.y);
    const bodyStart = horizontal ? { x: a.x + rA * dirX, y: a.y } : { x: a.x, y: a.y + rA * dirY };
    const bodyEnd = horizontal ? { x: b.x - rB * dirX, y: b.y } : { x: b.x, y: b.y - rB * dirY };
    if (horizontal) {
      // 점프 좌표와 세그먼트 좌표가 소수점 단위로 어긋날 수 있어 y는 느슨하게 맞춘다
      const JUMP_MATCH_TOLERANCE = 4;
      const lo = Math.min(bodyStart.x, bodyEnd.x);
      const hi = Math.max(bodyStart.x, bodyEnd.x);
      const segJumps = jumps
        .filter(j => Math.abs(j.y - a.y) <= JUMP_MATCH_TOLERANCE && j.x - jumpR > lo && j.x + jumpR < hi)
        .sort((p, q) => (dirX >= 0 ? p.x - q.x : q.x - p.x));
      for (const j of segJumps) {
        path += ` L ${j.x - jumpR * dirX} ${a.y}`;
        // 위로 볼록한 반원: 왼→오는 sweep 1, 오→왼은 sweep 0
        const sweep = dirX >= 0 ? 1 : 0;
        path += ` A ${jumpR} ${jumpR} 0 0 ${sweep} ${j.x + jumpR * dirX} ${a.y}`;
      }
    }
    path += ` L ${bodyEnd.x} ${bodyEnd.y}`;
    if (i < pts.length - 2 && rB > 0) {
      const c = pts[i + 2];
      const nDirX = Math.sign(c.x - b.x);
      const nDirY = Math.sign(c.y - b.y);
      const cornerExit = Math.abs(b.y - c.y) <= EPS ? { x: b.x + rB * nDirX, y: b.y } : { x: b.x, y: b.y + rB * nDirY };
      path += ` Q ${b.x} ${b.y} ${cornerExit.x} ${cornerExit.y}`;
    }
  }
  return path;
}

// 모든 엣지의 점프를 한 번에 구한다(computeJumps와 같은 결과). 다른 엣지의 세로 구간을 x 칸(64px)에 나눠 담아
// 가로 구간이 지나는 칸만 본다. 엣지 600개에서 쌍마다 보는 것보다 훨씬 빠르다
export function edgeJumps(lines: { id: string; points: XY[] }[]): Map<string, XY[]> {
  const BUCKET = 64;
  const buckets = new Map<number, { owner: number; x: number; y1: number; y2: number }[]>();
  lines.forEach((line, owner) => {
    for (let j = 0; j < line.points.length - 1; j += 1) {
      const c = line.points[j];
      const d = line.points[j + 1];
      if (Math.abs(c.x - d.x) > EPS) continue;
      const key = Math.floor(c.x / BUCKET);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push({ owner, x: c.x, y1: Math.min(c.y, d.y), y2: Math.max(c.y, d.y) });
    }
  });
  const result = new Map<string, XY[]>();
  lines.forEach((line, owner) => {
    const jumps: XY[] = [];
    for (let i = 0; i < line.points.length - 1; i += 1) {
      const a = line.points[i];
      const b = line.points[i + 1];
      if (Math.abs(a.y - b.y) > EPS) continue;
      const y = a.y;
      const x1 = Math.min(a.x, b.x) + JUMP_END_MARGIN;
      const x2 = Math.max(a.x, b.x) - JUMP_END_MARGIN;
      if (x2 <= x1) continue;
      for (let key = Math.floor(x1 / BUCKET); key <= Math.floor(x2 / BUCKET); key += 1) {
        for (const seg of buckets.get(key) ?? []) {
          if (seg.owner !== owner && seg.x > x1 && seg.x < x2 && y > seg.y1 + 4 && y < seg.y2 - 4) jumps.push({ x: seg.x, y });
        }
      }
    }
    if (jumps.length) result.set(line.id, jumps);
  });
  return result;
}
