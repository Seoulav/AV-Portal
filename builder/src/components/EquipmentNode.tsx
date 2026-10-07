// 장비 노드. 치수는 엔진 geometry(구 Builder와 같은 값)를 그대로 쓴다. 높이 계산과 그림이 어긋나면 선이 단자에서 벗어난다.
// 근접 연결(기반명세 §9): 핸들이 단자 행 칸 전체를 덮어 행 어디서든 선을 끌고 놓을 수 있다.
// 핸들 상자의 바깥 끝이 단자 점의 바깥 끝(테두리 밖 HANDLE_OUTSET)이라 선은 점에 붙는다. 점은 핸들의 ::after로 그린다.
// 노드는 헤더와 사진 영역(.node-drag)으로만 옮긴다(E8). 단자 행은 선 긋기 영역이다.
// 단자를 누르면 그 단자만 고르고, Shift+누르면 더하거나 뺀다(평행선 한꺼번에 긋기, B-20261006-06).
// 핸들의 nokey: React Flow 선택 키(Shift)를 누른 채 단자를 눌러도 범위 선택이 시작되지 않게 한다.
// LOD 덮개(구 Builder): 줌아웃하면 장비 위에 모델명을 크게 덮는다. 보이기·글자 크기는 Canvas의 LodLevel이 CSS로 정한다.
// 덮개는 포인터를 받지 않아 단자 행의 핸들과 근접 연결은 그대로 동작한다.
import { memo, type CSSProperties, type MouseEvent } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { geometry as G, type EquipmentData, type Port } from '../engine';
import { portKey } from '../bundle';
import { justConnected } from '../state/gesture';
import { builderStore, useBuilder } from '../state/useBuilder';

const ACCEPTED = new Set(['VERIFIED', 'FOUND']);

function PortRow({ nodeId, port, side, color, picked }: { nodeId: string; port: Port; side: 'left' | 'right' | 'both'; color: string; picked: boolean }) {
  const title = `${port.label} · ${port.connector} · ${port.signals.join(', ')}${port.verification ? ` · ${port.verification}` : ''}`;
  const review = !ACCEPTED.has(port.verification ?? '');
  const style = { '--port-color': color } as CSSProperties;
  const selected = picked ? ' port-selected' : '';
  // 노드 선택으로 번지지 않게 막는다. 선 긋기가 이 단자에서 끝난 직후의 click은 무시한다(gesture.ts)
  const onClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (justConnected()) return;
    const key = portKey(nodeId, port.id);
    if (event.shiftKey) builderStore.getState().togglePort(key);
    else builderStore.getState().selectPorts([key]);
  };
  return (
    <div className={`port-row port-${side}${selected}`} style={{ height: G.PORT_ROW_HEIGHT }}>
      <span className="port-dot" style={{ background: color }} />
      <span className="port-label">{port.label}</span>
      {review && <span className="port-badge">확인</span>}
      {side === 'left' && <Handle type="target" position={Position.Left} id={port.id} className={`port-handle port-handle-in nokey${selected}`} style={style} title={title} onClick={onClick} />}
      {side === 'right' && <Handle type="source" position={Position.Right} id={port.id} className={`port-handle port-handle-out nokey${selected}`} style={style} title={title} onClick={onClick} />}
      {side === 'both' && <Handle type="target" position={Position.Left} id={`target_${port.id}`} className={`port-handle port-handle-in port-handle-half nokey${selected}`} style={style} title={title} onClick={onClick} />}
      {side === 'both' && <Handle type="source" position={Position.Right} id={`source_${port.id}`} className={`port-handle port-handle-out port-handle-half nokey${selected}`} style={style} title={title} onClick={onClick} />}
    </div>
  );
}

function EquipmentNodeView({ id, data, selected }: NodeProps) {
  const equipment = data as unknown as EquipmentData;
  const colors = useBuilder(state => state.library?.rules.lineTypes ?? []);
  // 이 노드의 고른 단자만 색인에서 문자열로 받는다. 다른 노드의 선택이 바뀌어도 다시 그리지 않는다
  const pickedText = useBuilder(state => state.selectedPortsByNode[id] ?? '');
  const picked = new Set(pickedText ? pickedText.split('\n') : []);
  const colorOf = (type: string) => colors.find(item => item.id === type)?.color ?? '#64748b';
  const column = (ports: Port[], side: 'left' | 'right') => (
    <div className="port-column" style={{ gap: G.PORT_ROW_GAP }}>
      {ports.map(port => <PortRow key={port.id} nodeId={id} port={port} side={side} color={colorOf(port.type)} picked={picked.has(port.id)} />)}
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
            {equipment.bidirectional.map(port => <PortRow key={port.id} nodeId={id} port={port} side="both" color={colorOf(port.type)} picked={picked.has(port.id)} />)}
          </div>
        </div>
      )}
      {!hasIO && equipment.bidirectional.length === 0 && <div className="node-empty node-drag">Portal에 단자 정보가 없습니다</div>}
      <div className="lod-overlay" aria-hidden="true">
        <div className="lod-model">{equipment.model}</div>
        <div className="lod-name">{equipment.name}</div>
      </div>
    </div>
  );
}

export const EquipmentNode = memo(EquipmentNodeView);
