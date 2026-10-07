// 엣지(구 Builder CustomSmoothstepEdge 이식). React Flow의 smoothstep 대신 직교 경로를 그린다.
// - splitOffset(edgeProcessing)만큼 세로 구간을 옮긴다. 뒤로 가는 엣지는 아래로 U자 우회한다
// - 교차 점프: Canvas가 모든 엣지 경로를 구성도 좌표로 한 번에 계산해 data.jumps로 넘긴다(edgeJumps).
//   구 Builder는 엣지마다 React Flow 스토어를 읽어 다른 엣지 전체와 견주었다. 엣지 600개에서 한 프레임 100ms가 넘어 바꿨다
// - 라벨은 줌아웃해도 읽히게 역으로 키운다. 케이블 보기(구 BOM 모드)에서는 케이블 요약을 보인다
// 파일의 type: "smoothstep"은 그대로 두고 edgeTypes의 smoothstep 자리에 이 컴포넌트를 둔다.
import { memo, useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer, useStore, type EdgeProps } from '@xyflow/react';
import type { BomRow } from '../engine';
import { buildOrthogonalPath, getEdgePoints, type XY } from '../edges/edgeGeometry';

export interface BuilderEdgeData { splitOffset?: number; jumps?: XY[]; label?: string; bomRows?: BomRow[]; cableView?: boolean }

export const CABLE_MISSING = '⚠ 미입력';

// 케이블 요약(구 Builder buildBomLabel): 한 종류면 이름, 여럿이면 "N종". 제작만이면 총 길이, 기성만이면 총 수량
export function cableLabel(rows: BomRow[] = []): string {
  const filled = rows.filter(row => row.productName?.trim());
  if (!filled.length) return CABLE_MISSING;
  const names = [...new Set(filled.map(row => row.productName.trim()))];
  const name = names.length === 1 ? names[0] : `${names.length}종`;
  const manufactured = filled.some(row => row.cableType === 'manufactured');
  const readyMade = filled.some(row => row.cableType === 'ready-made');
  if (manufactured && !readyMade) {
    const total = filled.reduce((sum, row) => sum + (row.length ?? 0), 0);
    return `${name}  ${Number.isInteger(total) ? total : total.toFixed(1)}m`;
  }
  if (readyMade && !manufactured) return `${name}  ×${filled.reduce((sum, row) => sum + (row.quantity ?? 1), 0)}`;
  return name;
}

function BuilderEdgeView({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, data }: EdgeProps) {
  const edgeData = (data ?? {}) as BuilderEdgeData;
  const splitOffset = edgeData.splitOffset ?? 0;
  // 줌아웃 때 라벨을 역으로 키워 작게 봐도 알아볼 수 있게 한다(구 Builder와 같은 식)
  const zoom = useStore(state => state.transform[2]);
  const labelScale = Math.min(3.2, Math.max(1, 0.85 / zoom));

  const points = useMemo(() => getEdgePoints({ sourceX, sourceY, targetX, targetY, splitOffset }), [sourceX, sourceY, targetX, targetY, splitOffset]);
  const path = useMemo(() => buildOrthogonalPath(points, edgeData.jumps ?? []), [points, edgeData.jumps]);

  const cableView = Boolean(edgeData.cableView);
  const summary = cableView ? cableLabel(edgeData.bomRows) : '';
  const missing = cableView && summary === CABLE_MISSING;
  const text = cableView ? summary : edgeData.label ?? '';
  const labelX = (sourceX + targetX) / 2 + splitOffset * 0.5;
  const labelY = (sourceY + targetY) / 2;
  const color = (style?.stroke as string) || '#94a3b8';
  return (
    <>
      <BaseEdge id={id} path={path} style={missing ? { ...style, opacity: 0.4 } : style} markerEnd={markerEnd} />
      {text && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label nodrag nopan${missing ? ' missing' : ''}${cableView ? ' cable' : ''}`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) scale(${labelScale})`, color: missing ? undefined : color, borderColor: missing ? undefined : `${color}66` }}
          >
            {text}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const BuilderEdge = memo(BuilderEdgeView);
