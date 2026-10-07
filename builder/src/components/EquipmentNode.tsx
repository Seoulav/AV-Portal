// 장비 노드. 치수는 엔진 geometry(구 Builder와 같은 값)를 그대로 쓴다. 높이 계산과 그림이 어긋나면 선이 단자에서 벗어난다.
// 근접 연결(기반명세 §9): 핸들이 단자 행 칸 전체를 덮어 행 어디서든 선을 끌고 놓을 수 있다.
// 핸들 상자의 바깥 끝이 단자 점의 바깥 끝(테두리 밖 HANDLE_OUTSET)이라 선은 점에 붙는다. 점은 핸들의 ::after로 그린다.
// 노드는 헤더와 사진 영역(.node-drag)으로만 옮긴다(E8). 단자 행은 선 긋기 영역이다.
import { memo, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { geometry as G, type EquipmentData, type Port } from '../engine';
import { useBuilder } from '../state/useBuilder';

const ACCEPTED = new Set(['VERIFIED', 'FOUND']);

function PortRow({ port, side, color }: { port: Port; side: 'left' | 'right' | 'both'; color: string }) {
  const title = `${port.label} · ${port.connector} · ${port.signals.join(', ')}${port.verification ? ` · ${port.verification}` : ''}`;
  const review = !ACCEPTED.has(port.verification ?? '');
  const style = { '--port-color': color } as CSSProperties;
  return (
    <div className={`port-row port-${side}`} style={{ height: G.PORT_ROW_HEIGHT }}>
      <span className="port-dot" style={{ background: color }} />
      <span className="port-label">{port.label}</span>
      {review && <span className="port-badge">확인</span>}
      {side === 'left' && <Handle type="target" position={Position.Left} id={port.id} className="port-handle port-handle-in" style={style} title={title} />}
      {side === 'right' && <Handle type="source" position={Position.Right} id={port.id} className="port-handle port-handle-out" style={style} title={title} />}
      {side === 'both' && <Handle type="target" position={Position.Left} id={`target_${port.id}`} className="port-handle port-handle-in port-handle-half" style={style} title={title} />}
      {side === 'both' && <Handle type="source" position={Position.Right} id={`source_${port.id}`} className="port-handle port-handle-out port-handle-half" style={style} title={title} />}
    </div>
  );
}

function EquipmentNodeView({ data, selected }: NodeProps) {
  const equipment = data as unknown as EquipmentData;
  const colors = useBuilder(state => state.library?.rules.lineTypes ?? []);
  const colorOf = (type: string) => colors.find(item => item.id === type)?.color ?? '#64748b';
  const column = (ports: Port[], side: 'left' | 'right') => (
    <div className="port-column" style={{ gap: G.PORT_ROW_GAP }}>
      {ports.map(port => <PortRow key={port.id} port={port} side={side} color={colorOf(port.type)} />)}
    </div>
  );
  const hasIO = equipment.inputs.length > 0 || equipment.outputs.length > 0;
  const tag = equipment.portal?.unit ? equipment.portal.unit.toUpperCase() : equipment.portal?.variant ? '모델' : null;
  // 핸들 크기·위치는 CSS 변수로 넘겨 geometry 한 곳에서 정한다
  const sizes = { width: G.NODE_WIDTH, padding: `${G.NODE_PADDING}px 0`, '--handle-size': `${G.HANDLE_SIZE}px`, '--handle-outset': `${G.HANDLE_OUTSET}px` } as CSSProperties;
  return (
    <div className={`equipment-node${selected ? ' selected' : ''}${equipment.isReused ? ' reused' : ''}`} style={sizes}>
      <div className="node-header node-drag" style={{ height: G.NODE_HEADER_HEIGHT }}>
        <div className="node-brand">{equipment.manufacturer}{tag && <span className="node-tag">{tag}</span>}{equipment.isReused && <span className="node-tag reused">재사용</span>}</div>
        <div className="node-model">{equipment.model}</div>
        <div className="node-name">{equipment.name}</div>
      </div>
      {equipment.imageUrl && (
        <div className="node-image node-drag" style={{ height: G.NODE_IMAGE_HEIGHT }}>
          <img src={equipment.imageUrl} alt="" loading="lazy" draggable={false} />
        </div>
      )}
      {hasIO && <div className="port-columns">{column(equipment.inputs, 'left')}{column(equipment.outputs, 'right')}</div>}
      {equipment.bidirectional.length > 0 && (
        <div style={{ marginTop: hasIO ? G.IO_BIDI_GAP : 0 }}>
          <div className="bidi-label node-drag" style={{ height: G.BIDI_LABEL_HEIGHT }}>양방향</div>
          <div className="port-column" style={{ gap: G.PORT_ROW_GAP }}>
            {equipment.bidirectional.map(port => <PortRow key={port.id} port={port} side="both" color={colorOf(port.type)} />)}
          </div>
        </div>
      )}
      {!hasIO && equipment.bidirectional.length === 0 && <div className="node-empty node-drag">Portal에 단자 정보가 없습니다</div>}
    </div>
  );
}

export const EquipmentNode = memo(EquipmentNodeView);
