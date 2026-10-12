import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeUltritouchFollowupProduct } from './w12005-ultritouch-history.mjs';

const slug = 'ultritouch-2-hr';
const product = () => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const record = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-005-ultritouch-prior.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('official side photo exposes the three independently labelled rear sockets', () => {
  const current = product();
  const rear = current.images.find(image => image.role === 'Rear');
  assert.equal(rear.sourceUrl, 'https://www.rossvideo.com/wp-content/uploads/2018/08/Ultritouch-Back-Angled.jpg');
  assert.equal(createHash('sha256').update(readFileSync(new URL(`../beta/site/detail/images/${rear.file}`, import.meta.url))).digest('hex'), record.approvedImageSha256);
  assert.ok(prepareEnhancements(current).portMap);
  assert.deepEqual(current.portMap.measuredImage, { file: rear.file, width: 1600, height: 800 });
  assert.deepEqual(current.portMap.items.map(({ n, label, desc }) => ({ n, label, desc })),
    record.prior.portMap.items.map(({ n, label, desc }) => ({ n, label, desc })));
  assert.ok(current.portMap.items.every(item => item.side === 'right' && item.y1 < item.y2));
  assert.ok(current.portMap.items[1].y2 < current.portMap.items[2].y1);
  assert.ok(current.portMap.items[2].y2 < current.portMap.items[0].y1);
});

test('historical inverse accepts only approved fields and preserves unrelated current changes', () => {
  const current = product();
  const restored = beforeUltritouchFollowupProduct(current, slug);
  for (const field of ['images', 'imageStatuses', 'portMap']) assert.deepEqual(restored[field], record.prior[field]);
  const core = structuredClone(current);
  for (const field of ['images', 'imageStatuses', 'portMap']) delete core[field];
  assert.equal(hash(core), record.priorCoreSha256);
  const changedIo = structuredClone(current);
  changedIo.io = [];
  assert.deepEqual(beforeUltritouchFollowupProduct(changedIo, slug).io, []);
  const changedMap = structuredClone(current);
  changedMap.portMap.items[0].label = 'WRONG';
  assert.throws(() => beforeUltritouchFollowupProduct(changedMap, slug), /unexpected Ultritouch follow-up/);
});
