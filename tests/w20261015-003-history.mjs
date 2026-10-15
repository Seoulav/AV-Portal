import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const changedFlowHash = '8bb65b9547c7da4b0bb61f027add6b222c0f381b771cd5fee6340b6a2a31c3e6';
const previousDescription = '두 시나리오는 매뉴얼의 연결 예시입니다. 허브/스위치는 이 제품에 포함되지 않는 외부 장비이며 표시 경로는 고정 결선이 아닙니다.';
const previousHubStep = '영상·USB는 SOURCE → DISPLAY, 허브의 PD 전원은 DISPLAY → SOURCE';

export function beforeW20261015_003Product(product, slug) {
  if (slug !== 'hdf-ccf') return product;
  assert.equal(createHash('sha256').update(JSON.stringify(product.signalFlow)).digest('hex'), changedFlowHash,
    'HDF-CCF revised PD flow changed');
  const copy = structuredClone(product);
  copy.signalFlow.description = previousDescription;
  copy.signalFlow.scenarios[1].steps[3] = previousHubStep;
  return copy;
}
