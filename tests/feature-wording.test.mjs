import test from 'node:test';
import assert from 'node:assert/strict';
import {
  endingType, findTargets, readProducts, compareProducts,
  numberTokens, numericSymbols, englishTokens, parentheses,
} from '../scripts/check-feature-wording.mjs';

test('classifies verbal endings after trailing parentheticals', () => {
  assert.equal(endingType('Dante 64x64 채널 지원한다.'), 'HANDA');
  assert.equal(endingType('Epson iProjection 연동을 지원한다(무선 LAN 필요).'), 'HANDA');
  assert.equal(endingType('Dante 연결을 지원한다(2.4 GHz(ISM) 대역).'), 'HANDA');
  assert.equal(endingType('무선 대역은 2.4 GHz이다(최대 4채널(환경에 따라 다름)).'), 'COPULA');
  assert.equal(endingType('기기 제어할 수 있다.'), 'CAN');
  assert.equal(endingType('케이블이 포함되지 않는다.'), 'HANDA');
  assert.equal(endingType('모델별로 달라집니다.'), 'POLITE');
  assert.equal(endingType('1채널 수신기다.'), 'COPULA');
  assert.equal(endingType('최대 4K 영상 처리.'), 'PERIOD');
  assert.equal(endingType('12채널 입력 지원'), null);
  assert.equal(endingType('최대 12채널 처리(무선 LAN 필요)'), null);
  assert.equal(endingType('Intelligence Technologies — 환경 통합 기능(카메라·NFC 미지원)'), null);
});

test('findTargets covers both 05 features and 02 descriptions', () => {
  const products = {
    alpha: { manufacturer: 'Samsung', features: [{ text: '4K 출력을 지원한다.', source: 'P' }], portMap: { items: [{ n: 1, desc: 'USB 장치를 연결합니다.' }] } },
    beta: { manufacturer: 'JBL', features: [{ text: 'DSP 내장', source: 'P' }] },
  };
  assert.deepEqual(findTargets(products).map(x => [x.slug, x.field, x.type]),
    [['alpha', 'features', 'HANDA'], ['alpha', 'desc', 'POLITE']]);
  assert.equal(findTargets(products, { field: 'desc', manufacturer: 'samsung' }).length, 1);
  assert.equal(findTargets(products, { field: 'features', manufacturer: 'JBL' }).length, 0);
});

test('fact tokens retain order, model spelling, and exact parenthetical text', () => {
  const before = 'HDMI 2.0 신호를 최대 1100m(OM4 기준)까지 무압축 전송한다.';
  const after = 'HDMI 2.0 신호를 최대 1100m(OM4 기준)까지 무압축 전송';
  assert.deepEqual(numberTokens(before), numberTokens(after));
  assert.deepEqual(englishTokens(before), englishTokens(after));
  assert.deepEqual(parentheses(before), parentheses(after));
});

test('numeric signs, comparison operators, and degree marks cannot disappear or change', () => {
  const before = { features: [{ text: '틸트 -90°와 오차 <5%를 지원한다.', source: 'P' }] };
  const changed = ['틸트 +90°와 오차 <5% 지원', '틸트 90°와 오차 <5% 지원',
    '틸트 -90와 오차 <5% 지원', '틸트 -90°와 오차 >5% 지원'];
  assert.deepEqual(numericSymbols(before.features[0].text), ['-', '°', '<']);
  for (const text of changed) {
    const after = structuredClone(before);
    after.features[0].text = text;
    assert.ok(compareProducts(before, after, 'sample').errors.some(x => x.includes('numeric signs/comparison symbols changed')), text);
  }
  const unicodeMinus = { features: [{ text: '틸트 −30°~210°를 지원한다.', source: 'P' }] };
  const unsigned = { features: [{ text: '틸트 30°~210° 지원', source: 'P' }] };
  assert.ok(compareProducts(unicodeMinus, unsigned, 'sample').errors.some(x => x.includes('numeric signs/comparison symbols changed')));
});

test('diff accepts only approved text changes and rejects altered facts or marker geometry', () => {
  const before = {
    model: 'MODEL-4K',
    features: [{ text: 'HDMI 2.0 신호를 4K60p(보조 8K)로 전송한다.', source: 'P' }],
    portMap: { image: 'Rear', items: [{ n: 1, label: 'HDMI', desc: 'HDMI 2.0 신호를 출력합니다.', x1: 20, x2: 40, y: 30, side: 'top' }] },
  };
  const after = structuredClone(before);
  after.features[0].text = 'HDMI 2.0 신호를 4K60p(보조 8K)로 전송';
  after.portMap.items[0].desc = 'HDMI 2.0 신호 출력';
  assert.deepEqual(compareProducts(before, after, 'sample'), { changed: 2, errors: [] });

  const wrong = structuredClone(after);
  wrong.features[0].text = 'HDMI 2.0 신호를 8K60p(보조 8K)로 전송';
  wrong.portMap.items[0].x1 = 21;
  wrong.portMap.items[0].desc = 'DisplayPort 2.1 신호 출력';
  wrong.model = 'INVALID';
  wrong.features[0].source = 'U1';
  const { errors } = compareProducts(before, wrong, 'sample');
  assert.ok(errors.some(x => x.includes('number/unit tokens changed')));
  assert.ok(errors.some(x => x.includes('English/model tokens changed')));
  assert.ok(errors.some(x => x.includes('non-desc marker fields changed')));
  assert.ok(errors.some(x => x.includes('non-wording product fields changed')));
  assert.ok(errors.some(x => x.includes('source changed')));
  wrong.features[0].text = 'HDMI 2.0 신호를 4K60p(보조 4K)로 전송';
  assert.ok(compareProducts(before, wrong, 'sample').errors.some(x => x.includes('parenthetical content changed')));

  const moved = structuredClone(before);
  moved.portMap.items.push({ n: 2, label: 'LAN', desc: '네트워크 연결', x1: 50, x2: 70, y: 30, side: 'top' });
  assert.ok(compareProducts(before, moved, 'sample').errors.some(x => x.includes('Port Map item count changed')));
});

test('removing punctuation alone cannot conceal a verb before nested parentheses', () => {
  const before = { features: [{ text: 'AES-128 암호화를 지원한다(RF (무선 통신)).', source: 'P' }] };
  const after = { features: [{ text: 'AES-128 암호화를 지원한다(RF (무선 통신))', source: 'P' }] };
  assert.ok(compareProducts(before, after, 'sample').errors.some(x => x.includes('verbal ending remains')));
});

test('repository has no remaining verbal feature or Port Map descriptions', () => {
  const records = findTargets(readProducts());
  assert.equal(records.length, 0, records.slice(0, 20).map(x => `${x.slug}:${x.field === 'desc' ? `d${x.n}` : `f${x.index}`} ${x.type}`).join('\n'));
});
