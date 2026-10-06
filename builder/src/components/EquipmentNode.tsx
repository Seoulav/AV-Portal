// 장비 노드. 치수는 엔진 geometry(구 Builder와 같은 값)를 그대로 쓴다. 높이 계산과 그림이 어긋나면 선이 단자에서 벗어난다.
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { geometry as G, type EquipmentData, type Port } from '../engine';
import { useBuilder } from '../state/useBuilder';

const ACCEPTED = new Set(['VERIFIED', 'FOUND']);
const handleStyle = (color: string) => ({ width: 8, height: 8, background: color, border: '1.5px solid #ffffff' });

function PortRow({ port, side, color }: { port: Port; side: 'left' | 'right' | 'both'; color: string }) {
  const title = `${port.label} · ${port.connector} · ${port.signals.join(', ')}${port.verification ? ` · ${port.verification}` : ''}`;
  const review = !ACCEPTED.has(port.verification ?? '');
  return (
    <div className={`port-row port-${side}`} style={{ height: G.PORT_ROW_HEIGHT }} title={title}>
      {side !== 'right' && <Handle type="target" position={Position.Left} id={side === 'both' ? `target_${port.id}` : port.id} style={{ ...handleStyle(color), left: -16 }} />}
      <span className="port-dot" style={{ background: color }} />
      <span className="port-label">{port.label}</span>
      {review && <span className="port-badge" title="Portal에서 확인 중인 단자 정보">확인</span>}
      {side !== 'left' && <Handle type="source" position={Position.Right} id={side === 'both' ? `source_${port.id}` : port.id} style={{ ...handleStyle(color), right: -16 }} />}
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
  return (
    <div className={`equipment-node${selected ? ' selected' : ''}${equipment.isReused ? ' reused' : ''}`} style={{ width: G.NODE_WIDTH, padding: `${G.NODE_PADDING}px 0` }}>
      <div className="node-header" style={{ height: G.NODE_HEADER_HEIGHT }}>
        <div className="node-brand">{equipment.manufacturer}{tag && <span className="node-tag">{tag}</span>}{equipment.isReused && <span className="node-tag reused">재사용</span>}</div>
        <div className="node-model">{equipment.model}</div>
        <div className="node-name">{equipment.name}</div>
      </div>
      {equipment.imageUrl && (
        <div className="node-image" style={{ height: G.NODE_IMAGE_HEIGHT }}>
          <img src={equipment.imageUrl} alt="" loading="lazy" draggable={false} />
        </div>
      )}
      {hasIO && <div className="port-columns">{column(equipment.inputs, 'left')}{column(equipment.outputs, 'right')}</div>}
      {equipment.bidirectional.length > 0 && (
        <div style={{ marginTop: hasIO ? G.IO_BIDI_GAP : 0 }}>
          <div className="bidi-label" style={{ height: G.BIDI_LABEL_HEIGHT }}>양방향</div>
          <div className="port-column" style={{ gap: G.PORT_ROW_GAP }}>
            {equipment.bidirectional.map(port => <PortRow key={port.id} port={port} side="both" color={colorOf(port.type)} />)}
          </div>
        </div>
      )}
      {!hasIO && equipment.bidirectional.length === 0 && <div className="node-empty">Portal에 단자 정보가 없습니다</div>}
    </div>
  );
}

export const EquipmentNode = memo(EquipmentNodeView);
