import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { enhancementErrors, prepareEnhancements, selectCardModes } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW12004Product } from './w12004-history.mjs';
import { beforeKiprogo2Mx395Product } from './w12005-kiprogo2-mx395-history.mjs';
import { beforeAverW12009Product } from './aver-w12009-history.mjs';
import { beforeW20261015_008Product } from './w20261015-008-history.mjs';

const read = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const targets = ['srg-x40uh', 'tr335', 'tr315'];
const prior = {
  'srg-x40uh': '698935e5feb3dddfa1a5564c7da2e509532e2038a68ed1bfb45dd39ec8c58698',
  tr335: 'fb62f120303bc0959a17d0b01f65e5728cddc1b7f891e099125c132fde12a529',
  tr315: 'c5bdcd73546d69c9d23dfffbb579d5b68cffd7e44d8e10ab3fe8fd504c0e67cb'
};
const untouched = {
  'brc-am7': '1838b87a944770ca0e0a4ddbbddbb91c9620b82d7468e1fb99334c0e928f4040',
  'srg-a40': '193a0fb2bc9d1bab5def7d58d4454eea6b2657e16d808749926e6c803f887ca4',
  cl01: '87b481d6dcca2e08e7ff0f7717762ddb86e85dce104d4665349ad4f1f453b4b9',
  'rm-ip10': '549fe1e03d328f669ee0af44fb272765f54ee555f456e62d67ef80dc3c937faa',
  'rm-ip500': '7e7b87826189b777597d849026f18e338a61ab65ba2872f8b0a059869ea208df'
};
const ioRefs = node => node.evidence.filter(ref => ref.kind === 'io').map(ref => ref.index);

test('three camera flows render section 03 and cite only real I/O or specifications', () => {
  for (const slug of targets) {
    const product = read(slug);
    assert.deepEqual(enhancementErrors(product), [], slug);
    const enhancements = prepareEnhancements(product);
    assert.equal(enhancements.signalFlow?.type, 'camera', slug);
    assert.equal(selectCardModes(product, enhancements).io, 'signal-flow', slug);
    for (const node of [...product.signalFlow.inputs, ...product.signalFlow.outputs, ...product.signalFlow.processes, ...product.signalFlow.connections, ...product.signalFlow.auxiliary]) {
      for (const ref of node.evidence) {
        const row = (ref.kind === 'io' ? product.io : product.specifications)[ref.index];
        assert.ok(row && ['VERIFIED', 'FOUND'].includes(row.verification), `${slug}: ${node.id} ${ref.kind}[${ref.index}]`);
      }
    }
  }
});

test('SRG-X40UH excludes unverified IP video while preserving proven HDMI, UVC and VISCA paths', () => {
  const flow = read('srg-x40uh').signalFlow;
  assert.deepEqual(flow.outputs.flatMap(ioRefs), [0, 1, 3]);
  assert.ok(flow.inputs.some(node => ioRefs(node).includes(2)));
  assert.ok(flow.inputs.some(node => ioRefs(node).includes(4)));
  assert.ok(flow.outputs.every(node => !ioRefs(node).includes(4)));
  assert.ok(!flow.outputs.some(node => /IP 스트리밍/.test(node.label)));
  assert.ok(!flow.connections.some(edge => edge.evidence.some(ref => ref.kind === 'io' && ref.index === 4)));
  assert.ok(![...flow.inputs, ...flow.outputs].some(node => ioRefs(node).some(index => index === 5 || index === 6)));
});

test('TR335 and TR315 group four output media without treating USB UVC as a fifth medium', () => {
  const flows = ['tr335', 'tr315'].map(slug => read(slug).signalFlow);
  assert.deepEqual(flows[0], flows[1]);
  for (const flow of flows) {
    assert.equal(flow.outputs.length, 1);
    assert.deepEqual(ioRefs(flow.outputs[0]), [0, 1]);
    assert.match(flow.outputs[0].label, /3G-SDI.*HDMI.*IP.*USB/);
    assert.ok(flow.inputs.some(node => ioRefs(node).includes(2)));
    assert.ok(flow.inputs.some(node => ioRefs(node).includes(3)));
    assert.match(flow.notes.join(' '), /1080p60/);
  }
});

test('only signalFlow is added to the three products; existing flows and controllers stay byte-for-byte fixed', () => {
  for (const slug of targets) {
    const product = read(slug);
    assert.equal(sha(beforeW12004Product(beforeKiprogo2Mx395Product(beforeAverW12009Product(product, slug), slug), slug)), prior[slug], slug);
  }
  for (const [slug, expected] of Object.entries(untouched)) assert.equal(sha(beforeAverW12009Product(beforeW20261015_008Product(read(slug), slug), slug)), expected, slug);
});

test('historical inverse rejects changed flows and exposes unrelated current changes', () => {
  const alteredFlow = read('srg-x40uh');
  alteredFlow.signalFlow.outputs[0].label = 'invented output';
  assert.throws(() => beforeW12004Product(alteredFlow, 'srg-x40uh'), /unexpected W-004/);
  const alteredIo = read('tr335');
  alteredIo.io[0].quantity = '99';
  assert.equal(beforeW12004Product(alteredIo, 'tr335').io[0].quantity, '99');
  assert.notEqual(sha(beforeW12004Product(alteredIo, 'tr335')), prior.tr335);
});
