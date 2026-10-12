import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { adaptRtcomDetail } from '../beta/site/shared/rtcom-adapter.mjs';
import { prepareEnhancements, enhancementErrors } from '../beta/site/detail/detail-enhancements.mjs';

const root = new URL('../beta/site/rtcom/raw/products/', import.meta.url);
const read = id => JSON.parse(readFileSync(new URL(`${id}.json`, root), 'utf8'));

test('RTCOM adapter preserves every source map and binds each to its exact image', () => {
  let mapped = 0;
  for (const filename of readdirSync(root).filter(name => name.endsWith('.json'))) {
    const raw = read(filename.slice(0, -5));
    const original = raw.portMap ? (Array.isArray(raw.portMap) ? raw.portMap : [raw.portMap]) : [];
    const detail = adaptRtcomDetail(raw);
    assert.equal(detail.portMaps?.length ?? 0, original.length, raw.id);
    assert.deepEqual(enhancementErrors(detail), [], raw.id);
    if (!original.length) continue;
    assert.deepEqual(detail.portMap, detail.portMaps[0], raw.id);
    assert.equal(prepareEnhancements(detail).portMaps.length, original.length, raw.id);
    for (const [index, map] of detail.portMaps.entries()) {
      const source = original[index];
      assert.deepEqual(map.items, source.items.map(item => ({ ...item, side: item.side ?? 'top' })), `${raw.id} marker values`);
      assert.equal(map.image, source.image, raw.id);
      assert.equal(map.imageFile, source.file ?? raw.images.find(image => image.role === source.image)?.file, raw.id);
      assert.ok(detail.images.some(image => image.file === map.imageFile), raw.id);
      mapped++;
    }
  }
  assert.ok(mapped > 25);
});

test('QMS-88UX preserves video mode details, audio route and official product link', () => {
  const raw = read('qms-88ux');
  const detail = adaptRtcomDetail(raw);
  assert.deepEqual(detail.settings[0].items.map(item => item.name), raw.videoModes.modes.map(mode => mode.name));
  for (const mode of raw.videoModes.modes) {
    const rendered = detail.settings[0].items.find(item => item.name === mode.name);
    for (const value of [mode.summary, mode.detail, mode.page, ...(mode.layouts ?? [])].filter(Boolean)) {
      assert.ok(JSON.stringify(rendered).includes(value), value);
    }
  }
  assert.ok(JSON.stringify(detail.settings).includes(raw.audioOutFlow.tag));
  assert.ok(JSON.stringify(detail.settings).includes(raw.audioOutFlow.caption));
  assert.ok(JSON.stringify(detail.settings).includes(raw.audioOutFlow.source));
  assert.ok(detail.documents.some(document => document.url === raw.officialLinks[0].url));
  assert.deepEqual(enhancementErrors(detail), []);
});

test('XDM keeps its configurator product link and adds only the source official link', () => {
  const raw = read('xdm');
  const detail = adaptRtcomDetail(raw);
  assert.equal(detail.documents[0].url, 'https://seoulav.github.io/rtcom-configurator/#products/xdm');
  assert.ok(detail.documents.some(document => document.url === raw.officialLinks[0].url));
  assert.equal(detail.portMap, undefined);
  assert.equal(detail.settings.length, 1);
});

test('RTCOM series lineup keeps every mainframe and card entry without inventing models', () => {
  for (const id of ['xdm', 'spx', 'vdm']) {
    const raw = read(id);
    const detail = adaptRtcomDetail(raw);
    const table = detail.settings.find(item => item.title === '제품군 구성');
    assert.ok(table, id);
    assert.deepEqual(table.rows, raw.lineup.map(item => [item.model, item.kind, item.summary, item.rackUnits == null ? '—' : String(item.rackUnits)]), id);
    assert.deepEqual(enhancementErrors(detail), [], id);
    assert.equal(prepareEnhancements(detail).settings.length, 1, id);
  }
});


test('RTCOM source-only links and maps reject untrusted hosts or missing image bindings', () => {
  const raw = read('qms-88ux');
  assert.throws(() => adaptRtcomDetail({ ...raw, officialLinks: [{ label: 'wrong', url: 'http://example.com/a' }] }), /RTCOM 공식 링크/);
  assert.throws(() => adaptRtcomDetail({ ...raw, portMap: { ...raw.portMap, image: 'Main' } }), /Port Map 이미지 불일치|이미지 크기 누락/);
});
