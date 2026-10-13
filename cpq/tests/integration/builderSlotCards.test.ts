// B-20261013-04: Builder 슬롯 탭에서 장착한 카드가 견적 품목으로 들어오는지 확인한다.
// Builder는 카드마다 selectedOptionQuantities `portal-option:<카드 배치 단위 ID>` = 장착 장수와 최상위 options[] 정의를 남기고,
// 노드 data에 slotAssignments(추가 필드)를 둔다. 견적은 추가 필드를 무시하고 옵션 키로 카드 행을 만든다.
import { describe, expect, it } from 'vitest';
import { buildDeviceLines } from '@/import/diagram/devices';
import { parseDiagram } from '@/import/diagram/schema';
import { cat } from '../fixtures/diagram';

// Builder 1.2 구성도에서 필요한 부분만 그대로 옮긴 모양(RTCOM XDM-12 프레임에 HOS100 카드 2장)
const builderDiagram = () => ({
  version: '1.2',
  nodes: [{
    id: 'node_frame', type: 'equipment', position: { x: 0, y: 0 },
    data: {
      id: 'rtcom-xdm:xdm-12', category: 'video', name: 'Modular Matrix', model: 'XDM-12', manufacturer: 'RTCOM',
      inputs: [],
      outputs: [
        { id: 'opt-rtcom-xdm:xdm-hos100-OUT1-out-hdmi-1', label: 'OUT1 HDMI Out 1', type: 'video', direction: 'out', connector: 'HDMI', signals: ['HDMI'] },
        { id: 'opt-rtcom-xdm:xdm-hos100-OUT2-out-hdmi-1', label: 'OUT2 HDMI Out 1', type: 'video', direction: 'out', connector: 'HDMI', signals: ['HDMI'] },
      ],
      bidirectional: [],
      isReused: false,
      portal: { productId: 'rtcom-xdm', source: 'rtcom', variant: 'XDM-12', detailUrl: '' },
      selectedOptionQuantities: { 'portal-option:rtcom-xdm:xdm-hos100': 2 },
      optionPortIds: ['opt-rtcom-xdm:xdm-hos100-OUT1-out-hdmi-1', 'opt-rtcom-xdm:xdm-hos100-OUT2-out-hdmi-1'],
      slotAssignments: { OUT1: 'rtcom-xdm:xdm-hos100', OUT2: 'rtcom-xdm:xdm-hos100' },
    },
  }],
  edges: [],
  lineTypes: [{ id: 'video', name: 'Video', color: '#3b82f6' }],
  equipmentDB: [],
  options: [{ id: 'portal-option:rtcom-xdm:xdm-hos100', model: 'XDM-HOS100', name: 'XDM-HOS100', manufacturer: 'RTCOM' }],
});

describe('Builder 슬롯 카드 (B-20261013-04)', () => {
  it('slotAssignments가 있어도 읽고, 카드는 장착 장수만큼 옵션 행이 된다', () => {
    const parsed = parseDiagram(builderDiagram());
    const { lines, warnings } = buildDeviceLines(parsed, cat());
    const card = lines.find((line) => line.isAccessory);
    expect(card).toMatchObject({ sku: 'VID-0142', quantity: '2', isAccessory: true, optionId: 'portal-option:rtcom-xdm:xdm-hos100' });
    expect(warnings.some((w) => w.code === 'option-definition-missing')).toBe(false);
    // 프레임 본체는 한 행이다(카드는 노드가 아니다)
    expect(lines.filter((line) => !line.isAccessory).map((line) => line.specification)).toEqual(['XDM-12']);
  });
});
