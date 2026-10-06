// 메모·영역 노드. 서식 필드는 구 Builder 1.1과 같다.
import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

interface NoteData { label?: string; fontSize?: number; fontColor?: string; bgColor?: string; bgOpacity?: number; borderColor?: string; borderStyle?: string; borderRadius?: number; borderWidth?: number; textAlign?: 'left' | 'center' | 'right' }

// 배경색에 투명도를 입힌다(#rrggbb + 0~1)
const withOpacity = (color = '#ffffff', opacity = 1) => {
  const hex = color.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return color;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

function AnnotationView({ data, width, height }: NodeProps) {
  const note = data as NoteData;
  return (
    <div
      className="annotation-node"
      style={{
        width, height,
        fontSize: note.fontSize, color: note.fontColor, textAlign: note.textAlign,
        background: withOpacity(note.bgColor, note.bgOpacity),
        border: `1.5px ${note.borderStyle ?? 'dashed'} ${note.borderColor ?? '#38bdf8'}`,
        borderRadius: note.borderRadius,
      }}
    >
      {note.label}
    </div>
  );
}

function ShapeView({ data, width, height }: NodeProps) {
  const zone = data as NoteData;
  return (
    <div
      className="shape-node"
      style={{
        width, height,
        background: withOpacity(zone.bgColor, zone.bgOpacity),
        border: `${zone.borderWidth ?? 2}px ${zone.borderStyle ?? 'solid'} ${zone.borderColor ?? '#475569'}`,
      }}
    >
      {/* 영역은 제목 띠로만 잡는다. 안쪽은 클릭이 통과한다(기반명세 §9) */}
      <div className="shape-title" style={{ fontSize: zone.fontSize, color: zone.fontColor }}>{zone.label}</div>
    </div>
  );
}

export const AnnotationNode = memo(AnnotationView);
export const ShapeNode = memo(ShapeView);
