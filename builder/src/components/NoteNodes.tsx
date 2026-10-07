// 메모·영역 노드. 서식 필드와 그리는 방식은 구 Builder(AnnotationNode·ShapeNode, 2fd568e)와 같다.
// - 바탕과 테두리를 한 겹에 그리고 그 겹에 투명도를 준다(테두리도 함께 옅어진다)
// - 고르면 테두리를 끌어 크기를 바꾼다(NodeResizer). 고정한 것(data.locked)과 전체 잠금 중에는 바꾸지 못한다
// - 영역은 제목 띠로만 잡는다. 안쪽은 클릭이 통과한다(기반명세 §9)
import { memo, type CSSProperties } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { useBuilder } from '../state/useBuilder';

export interface NoteData {
  label?: string; fontSize?: number; fontColor?: string; bgColor?: string; bgOpacity?: number; borderColor?: string; borderStyle?: string;
  borderRadius?: number; borderWidth?: number; textAlign?: 'left' | 'center' | 'right'; shapeType?: 'rectangle' | 'rounded-rectangle' | 'circle'; locked?: boolean;
}

// 구 Builder의 기본값(값이 없을 때)
export const ANNOTATION_DEFAULTS = { fontSize: 14, fontColor: '#ffffff', bgColor: '#1e293b', bgOpacity: 0.8, borderColor: '#38bdf8', borderStyle: 'dashed', borderRadius: 8, textAlign: 'center' } as const;
export const SHAPE_DEFAULTS = { shapeType: 'rectangle', fontSize: 14, fontColor: '#94a3b8', bgColor: '#1e293b', bgOpacity: 0.3, borderColor: '#475569', borderStyle: 'solid', borderWidth: 2 } as const;
export const ANNOTATION_MIN = { width: 60, height: 30 };
export const SHAPE_MIN = { width: 80, height: 80 };
const SHAPE_RADIUS = { rectangle: '0px', 'rounded-rectangle': '12px', circle: '50%' } as const;
// 크기 손잡이(구 Builder와 같다): 8px 사각형, 흰 테두리
const handleStyle = (color: string): CSSProperties => ({ width: 8, height: 8, background: color, border: '1px solid #fff' });
const NOTE_HANDLE = handleStyle('#38bdf8');
const ZONE_HANDLE = handleStyle('#10b981');
const NOTE_LINE = { borderColor: '#38bdf8' };
const ZONE_LINE = { borderColor: '#10b981' };

const layer = (bgColor: string, opacity: number, border: string, radius: string): CSSProperties => ({
  position: 'absolute', inset: 0, backgroundColor: bgColor, opacity, border, borderRadius: radius, boxSizing: 'border-box', pointerEvents: 'none',
});

function AnnotationView({ data, selected, width, height }: NodeProps) {
  const note = data as NoteData;
  const allLocked = useBuilder(state => state.locked);
  const radius = `${note.borderRadius ?? ANNOTATION_DEFAULTS.borderRadius}px`;
  const borderStyle = note.borderStyle ?? ANNOTATION_DEFAULTS.borderStyle;
  const border = borderStyle === 'none' ? 'none' : `1.5px ${borderStyle} ${note.borderColor ?? ANNOTATION_DEFAULTS.borderColor}`;
  return (
    <div className="annotation-node" style={{ width, height, borderRadius: radius }}>
      <div style={layer(note.bgColor ?? ANNOTATION_DEFAULTS.bgColor, note.bgOpacity ?? ANNOTATION_DEFAULTS.bgOpacity, border, radius)} />
      <NodeResizer isVisible={Boolean(selected) && !note.locked && !allLocked} minWidth={ANNOTATION_MIN.width} minHeight={ANNOTATION_MIN.height} handleStyle={NOTE_HANDLE} lineStyle={NOTE_LINE} />
      <div className="annotation-text" style={{ color: note.fontColor ?? ANNOTATION_DEFAULTS.fontColor, fontSize: note.fontSize ?? ANNOTATION_DEFAULTS.fontSize, textAlign: note.textAlign ?? ANNOTATION_DEFAULTS.textAlign }}>
        {note.label || '두 번 눌러 메모 편집'}
      </div>
    </div>
  );
}

function ShapeView({ data, selected, width, height }: NodeProps) {
  const zone = data as NoteData;
  const allLocked = useBuilder(state => state.locked);
  const radius = SHAPE_RADIUS[zone.shapeType ?? SHAPE_DEFAULTS.shapeType] ?? '0px';
  const borderStyle = zone.borderStyle ?? SHAPE_DEFAULTS.borderStyle;
  const border = borderStyle === 'none' ? 'none' : `${zone.borderWidth ?? SHAPE_DEFAULTS.borderWidth}px ${borderStyle} ${zone.borderColor ?? SHAPE_DEFAULTS.borderColor}`;
  return (
    <div className="shape-node" style={{ width, height, borderRadius: radius }}>
      <div style={layer(zone.bgColor ?? SHAPE_DEFAULTS.bgColor, zone.bgOpacity ?? SHAPE_DEFAULTS.bgOpacity, border, radius)} />
      <NodeResizer isVisible={Boolean(selected) && !zone.locked && !allLocked} minWidth={SHAPE_MIN.width} minHeight={SHAPE_MIN.height} handleStyle={ZONE_HANDLE} lineStyle={ZONE_LINE} />
      <div className="shape-title" style={{ fontSize: zone.fontSize ?? SHAPE_DEFAULTS.fontSize, color: zone.fontColor ?? SHAPE_DEFAULTS.fontColor }}>{zone.label}</div>
    </div>
  );
}

export const AnnotationNode = memo(AnnotationView);
export const ShapeNode = memo(ShapeView);
