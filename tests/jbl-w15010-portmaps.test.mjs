import {beforeJblW15010Product,jblW15010Slugs} from './jbl-w15010-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const get = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url)));
const visible = ['control-23-1','control-25-1','control-28-1'];
const covered = ['control-412ct','control-414ct','control-416ct','control-418ct','control-419cst','control-424ct','control-424lp','control-426ct','control-426lp','control-440cst','control-447ct'];

test('JBL Control visible terminals have one measured rear speaker-input marker each', () => {
  for (const slug of visible) {
    const p = get(slug);
    assert.equal(p.portMap?.image, 'Rear', slug);
    assert.equal(p.portMap?.items.length, 1, slug);
    assert.deepEqual(p.portMap.items.map(i=>i.n), [1], slug);
    assert.match(p.portMap.items[0].label, /스피커 입력/, slug);
    assert.equal(p.portMap.items[0].side, 'top', slug);
    assert.equal(p.portMap.measuredImage.file, p.images.find(i=>i.role==='Rear').file, slug);
    const i=p.portMap.items[0],m=p.portMap.measuredImage;
    assert.ok(i.x1>0 && i.x1<i.x2 && i.x2<m.width && i.y>0 && i.y<m.height,slug);
    assert.equal(p.io.length, 1, slug);
  }
});

test('JBL covered ceiling terminals remain unmarked without model-specific open views', () => {
  for (const slug of covered) assert.equal(get(slug).portMap, undefined, slug);
});

test('historical inverse restores only approved maps and rejects map drift', () => {
  assert.deepEqual([...jblW15010Slugs], visible);
  for (const slug of visible) {
    const current=get(slug);
    const old=beforeJblW15010Product(current,slug);
    assert.equal(old.portMap,undefined,slug);
    for(const key of Object.keys(current).filter(key=>key!=='portMap')) assert.deepEqual(old[key],current[key],`${slug}: ${key}`);
    const altered=structuredClone(current);altered.portMap.items[0].label='INVALID';
    assert.throws(()=>beforeJblW15010Product(altered,slug),/unexpected W-20261015-010 portMap change/);
    const unrelated=structuredClone(current);unrelated.model='INVALID';
    assert.equal(beforeJblW15010Product(unrelated,slug).model,'INVALID');
  }
});
