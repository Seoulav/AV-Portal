/**
 * 빌더 전용 일반 장비(PC·노트북, B-20261016-02).
 *
 * `data.portal.source === 'builder'`인 노드는 장비 행을 만들지 않고
 * 카탈로그 미등록 경고도 세우지 않는다. 연결선의 케이블은 그대로 나온다.
 */
import { describe, expect, it } from 'vitest';

import { buildDeviceLines } from '@/import/diagram/devices';
import { buildCableLines } from '@/import/diagram/cables';
import { cat, diagram, edge, node } from '../fixtures/diagram';

const pc = () => node('pc', '소스 기기', 'PC (HDMI)', { portal: { productId: 'generic-pc', source: 'builder', detailUrl: '' } });
const matrix = () => node('m1', '매트릭스', 'XDM-12');

describe('빌더 전용 일반 장비', () => {
  it('장비 행과 미등록 경고를 만들지 않는다', () => {
    const built = buildDeviceLines(diagram([pc(), matrix()]), cat());

    expect(built.lines.map((l) => l.specification)).toEqual(['XDM-12']);
    expect(built.warnings.filter((w) => w.nodeId === 'pc')).toHaveLength(0);
  });

  it('일반 장비에 이어진 연결선의 케이블은 그대로 산정한다', () => {
    const built = buildCableLines(diagram([pc(), matrix()], [edge('e1', 'pc', 'm1', 'video', { bomRows: [] })]), cat());

    expect(built.lines).toHaveLength(1);
    expect(built.lines[0]!.sourceEdgeIds).toEqual(['e1']);
  });

  it('Portal 출처 장비는 그대로 행을 만든다', () => {
    const portalNode = node('m2', '매트릭스', 'XDM-12', { portal: { productId: 'xdm-12', source: 'rtcom', detailUrl: '' } });
    const built = buildDeviceLines(diagram([portalNode]), cat());

    expect(built.lines).toHaveLength(1);
  });
});
