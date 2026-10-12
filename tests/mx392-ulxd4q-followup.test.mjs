import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';
import { beforeMx392Ulxd4qFollowupProduct } from './mx392-ulxd4q-followup-history.mjs';

const detail = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));

test('MX392/C publishes audio and two distinct logic routes from the Shure guide', () => {
  const product = detail('mx392-c');
  assert.equal(product.io[0].quantity, '1');
  assert.match(product.io[0].connector, /나사식 단자/);
  assert.match(product.io[0].condition, /무단말/);
  assert.match(product.io[0].condition, /오디오 3단자\(\+·−·실드\)/);
  assert.match(product.io[0].condition, /로직 3단자\(LED IN·SWITCH OUT·접지\)/);
  const led = product.io.find(row => row.signal === 'LED IN');
  const switchOut = product.io.find(row => row.signal === 'SWITCH OUT');
  assert.equal(led?.direction, 'IN');
  assert.equal(switchOut?.direction, 'OUT');
  assert.equal(led?.source, 'D, M');
  assert.equal(switchOut?.source, 'D, M');
  assert.match(led?.condition, /Logic Connections\(로직\/GPIO 성격의 외부 제어선\)/);
  assert.match(led?.condition, /LED IN: 외부 장치가 마이크 LED를 제어하는 입력/);
  assert.match(switchOut?.condition, /SWITCH OUT: 마이크 스위치 상태를 외부 장치에 전달하는 출력\(GPO\)/);
  assert.match(product.overview, /Logic Connections\(LED IN 입력·SWITCH OUT 출력, GPIO 성격의 외부 제어선\)/);
  assert.match(product.features[2].text, /Logic Connections\(LED IN 입력·SWITCH OUT 출력, GPIO 성격의 외부 제어선\)/);
});

test('MX392/C and MX418D/C have one Builder audio output each, without phantom power ports', async () => {
  assert.equal(detail('mx418d-c').io[0].quantity, '1');
  const library = await expectedBuilderLibrary();
  for (const slug of ['mx392-c', 'mx418d-c']) {
    const entry = library.products.find(product => product.productId === slug);
    assert.ok(entry, slug);
    const equipment = entry.units[0].equipment;
    assert.equal(equipment.outputs.filter(port => port.signals.includes('MIC-AUDIO')).length, 1, slug);
    assert.equal([...equipment.inputs, ...equipment.outputs, ...equipment.bidirectional]
      .filter(port => port.signals.includes('POWER')).length, 0, slug);
  }
});

test('ULXD4Q MIC/LINE switches have one grouped label with sequential marker numbers', () => {
  const items = detail('ulxd4q').portMap.items;
  assert.deepEqual(items.map(item => item.n), Array.from({ length: 13 }, (_, index) => index + 1));
  const switches = items.filter(item => item.label.includes('MIC/LINE'));
  assert.deepEqual(switches.map(item => item.label), ['MIC/LINE 스위치 1–2', 'MIC/LINE 스위치 3–4']);
  assert.deepEqual(switches.map(item => [item.x1, item.x2]), [[1330, 1547], [656, 872]]);
  assert.ok(switches.every(item => item.desc === '출력 레벨 선택 · MIC 위치에서 30dB 감쇠' && item.side === 'bottom'));
});

test('historical inverse rejects an unapproved field edit but keeps unrelated live data', () => {
  for (const [slug, field] of [['mx392-c', 'io'], ['mx418d-c', 'io'], ['ulxd4q', 'portMap']]) {
    const current=detail(slug);
    const restored=beforeMx392Ulxd4qFollowupProduct(current,slug);
    assert.notDeepEqual(restored[field],current[field],slug);
    const unrelated=structuredClone(current);
    unrelated.model='INVALID MODEL';
    assert.equal(beforeMx392Ulxd4qFollowupProduct(unrelated,slug).model,'INVALID MODEL',slug);
    const changed=structuredClone(current);
    if(field==='portMap')changed.portMap.items[0].label='INVALID';
    else changed.io[0].quantity='99';
    assert.throws(()=>beforeMx392Ulxd4qFollowupProduct(changed,slug),/unexpected MX392\/ULXD4Q followup/,slug);
  }
});
