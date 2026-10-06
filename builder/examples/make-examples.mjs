// 1.2 예제 3종을 엔진 API로 만든다(가상 현장, 실제 Portal 제품).
//   node builder/examples/make-examples.mjs
// 예제는 만든 시점의 스냅샷이다. Portal 데이터가 바뀌어도 다시 만들 필요는 없다(파일만으로 검증된다).
// 테스트는 이 스크립트를 실행하지 않는다. 예제를 의도적으로 바꿀 때만 실행한다.
import { writeFile } from 'node:fs/promises';
import { expectedBuilderLibrary } from '../../beta/build-builder-library.mjs';
import { addAnnotationNode, addEquipmentNode, addShapeNode, connectPorts, createDiagram, createIdFactory, setEdgeCable, setEdgeLabel } from '../engine/diagram.mjs';
import { createLibraryIndex, unitEquipment } from '../engine/library.mjs';
import { serializeDiagram } from '../engine/serialize.mjs';

const library = createLibraryIndex(await expectedBuilderLibrary());
const NOW = Date.UTC(2026, 9, 7, 0, 0, 0);

function builder(seed) {
  const ids = createIdFactory({ seed, now: NOW });
  const diagram = createDiagram({ library });
  const place = (unitId, x, y) => addEquipmentNode(diagram, unitEquipment(library, unitId), { position: { x, y }, ids });
  const link = (a, aPort, b, bPort, bomRows) => {
    const result = connectPorts(diagram, { nodeId: a.id, portId: aPort }, { nodeId: b.id, portId: bPort }, { ids, rules: library.rules });
    if (!result.ok) throw new Error(`연결 실패 ${a.data.id}.${aPort} → ${b.data.id}.${bPort}: ${result.code}`);
    if (bomRows) setEdgeCable(diagram, result.edge.id, bomRows);
    return result.edge;
  };
  return { diagram, ids, place, link };
}

// 1) 소회의실 영상: 카메라 HDMI → 사이니지, 두 장비 LAN → 스위치
function smallRoom() {
  const { diagram, ids, place, link } = builder(101);
  addShapeNode(diagram, { position: { x: -40, y: -80 }, width: 960, height: 520, label: '회의실 A (가상 예제)', ids });
  const camera = place('srg-x40uh', 0, 0);
  const display = place('lh43qmcebgcxkr', 600, 0);
  const sw = place('gs108pp', 300, 260);
  link(camera, 'out-hdmi-1', display, 'in-hdmi-1', [{ cableType: 'ready-made', productName: 'HDMI 케이블 5m', lineTypeId: 'video', quantity: 1 }]);
  link(camera, 'both-ethernet-1', sw, 'both-ethernet-1', [{ cableType: 'manufactured', productName: 'UTP CAT6', lineTypeId: 'network', length: 20 }]);
  link(display, 'both-ethernet-1', sw, 'both-ethernet-2');
  addAnnotationNode(diagram, { position: { x: 0, y: 470 }, width: 420, label: '사이니지 LAN은 케이블을 아직 정하지 않았다(cable-unspecified 예시)', ids });
  return diagram;
}

// 2) 중강당 오디오: 무선 수신기 → 앰프 → 천장 스피커 4대, 수신기 Dante → 스위치
function auditorium() {
  const { diagram, ids, place, link } = builder(202);
  addShapeNode(diagram, { position: { x: -40, y: -80 }, width: 1300, height: 1000, label: '중강당 (가상 예제)', ids });
  const receiver = place('ulxd4d', 0, 0);
  const amp = place('comtech-d-8125', 420, 0);
  const sw = place('gs108pp', 0, 560);
  link(receiver, 'out-line-audio-1', amp, 'in-line-audio-1', [{ cableType: 'manufactured', productName: '2C 실드 오디오 케이블', lineTypeId: 'audio', length: 3 }]);
  link(receiver, 'out-line-audio-2', amp, 'in-line-audio-2', [{ cableType: 'manufactured', productName: '2C 실드 오디오 케이블', lineTypeId: 'audio', length: 3 }]);
  link(receiver, 'both-dante-1', sw, 'both-ethernet-1', [{ cableType: 'manufactured', productName: 'UTP CAT6', lineTypeId: 'network', length: 5 }]);
  for (let i = 1; i <= 4; i += 1) {
    const speaker = place('control-412ct', 900, (i - 1) * 220);
    link(amp, `out-speaker-${i}`, speaker, 'in-speaker-1', [{ cableType: 'manufactured', productName: '스피커 케이블 2.5SQ', lineTypeId: 'speaker', length: 30 }]);
  }
  addAnnotationNode(diagram, { position: { x: 420, y: 760 }, width: 420, label: '스피커 4대는 노드 4개다(노드 1개 = 1대)', ids });
  return diagram;
}

// 3) RTCOM 연장기: 카메라 → CT101-U(TX) → HDBaseT → CR101-U(RX) → 사이니지. 단자 정보가 없는 XDM-12도 둔다
function extender() {
  const { diagram, ids, place, link } = builder(303);
  const camera = place('srg-x40uh', 0, 0);
  const tx = place('rtcom-ct101-u-cr101-u:tx', 420, 0);
  const rx = place('rtcom-ct101-u-cr101-u:rx', 840, 0);
  const display = place('lh43qmcebgcxkr', 1260, 0);
  link(camera, 'out-hdmi-1', tx, 'in-hdmi-1', [{ cableType: 'ready-made', productName: 'HDMI 케이블 1m', lineTypeId: 'video', quantity: 1 }]);
  const run = link(tx, 'out-hdbaset-1', rx, 'in-hdbaset-1', [{ cableType: 'manufactured', productName: 'STP CAT6A', lineTypeId: 'network', length: 70 }]);
  setEdgeLabel(diagram, run.id, 'HDBaseT 70m 구간');
  link(rx, 'out-hdmi-1', display, 'in-hdmi-1', [{ cableType: 'ready-made', productName: 'HDMI 케이블 2m', lineTypeId: 'video', quantity: 1 }]);
  place('rtcom-xdm:xdm-12', 420, 420);
  addAnnotationNode(diagram, { position: { x: 840, y: 420 }, width: 420, label: 'XDM-12는 카드 단위 단자 정보가 없어 단자 없이 놓인다(no-ports·series-config-pending 예시)', ids });
  return diagram;
}

const examples = { 'small-room.diagram.json': smallRoom(), 'auditorium-audio.diagram.json': auditorium(), 'rtcom-extender.diagram.json': extender() };
for (const [name, diagram] of Object.entries(examples)) {
  await writeFile(new URL(name, import.meta.url), serializeDiagram(diagram, { library }));
  console.log(`예제 생성: builder/examples/${name}`);
}
