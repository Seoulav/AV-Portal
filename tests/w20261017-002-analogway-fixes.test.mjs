import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { prepareProductDetail } from '../beta/site/detail/product-detail-model.mjs';
import { beforeW20261017_002Product, w20261017_002Fixture } from './w20261017-002-history.mjs';

const readProduct = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const brochureUrl = 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Common/Brochure/brochure-Aquilon-april2026-web.pdf';
const expectedQuickLabels = ['매뉴얼', '시방서', '사양서', '브로슈어'];
const qsgUrls = {
  'aquilon-rsalpha': 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Products/Aquilon+RS+alpha/Quick+Start+Guide/aquilon-RS-alpha-quick-start-guide.pdf',
  'aquilon-rs2': 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Products/Aquilon+RS2/Quick+Start+Guide/Aquilon-RS2-quick-start-guide.pdf',
  'aquilon-rs4': 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Products/Aquilon+RS4/Quick+Start+Guide/Aquilon-RS4-quick-start-guide.pdf',
  'aquilon-rs5': 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Products/Aquilon+RS5/Quick+Start+Guide/Aquilon-RS5-quick-start-guide.pdf',
  'aquilon-rs6': 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Products/Aquilon+RS6/Quick+Start+Guide/Aquilon-RS6-quick-start-guide.pdf',
  rc400t: 'https://dwn01.analogway.com/Site+Internet/Consoles+%26+Controllers/RC400T/Quick+Start+Guide/RC400T-quick-start-guide.pdf'
};

test('Analog Way QSG additions stay outside the fixed four quick-document slots', () => {
  for (const [slug, url] of Object.entries(qsgUrls)) {
    const product = readProduct(slug);
    const view = prepareProductDetail(product);
    const qsg = product.documents.find(item => item.type === 'Quick Start Guide');
    assert.ok(qsg, `${slug} must have a separate Quick Start Guide document`);
    assert.equal(qsg.url, url);
    assert.equal(view.quickDocuments.length, 4);
    assert.equal(view.additionalDocuments.some(item => item === qsg), true);
  }

  for (const slug of ['aquilon-rsalpha', 'aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6']) {
    const product = readProduct(slug);
    const brochure = product.documents.find(item => item.type === 'Brochure' && item.quickSlot === 'technical');
    assert.ok(brochure, `${slug} must keep the W-010 brochure slot data-driven`);
    assert.equal(brochure.url, brochureUrl);
    const quick = prepareProductDetail(product).quickDocuments;
    assert.deepEqual(quick.map(item => item.label), expectedQuickLabels);
    assert.equal(quick[3].resource.url, brochureUrl);
  }

  const rs1Product = readProduct('aquilon-rs1');
  const rs1Qsg = rs1Product.documents.find(item => item.type === 'Quick Start Guide');
  assert.ok(rs1Qsg);
  assert.equal(rs1Qsg.url, 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Products/Aquilon+RS1/Quick+Start+Guide/Aquilon-RS1-quick-start-guide.pdf');
  const rs1 = prepareProductDetail(rs1Product).quickDocuments;
  assert.equal(rs1[0].resource.title, 'Aquilon User Manual v6.2');
  assert.deepEqual(rs1.map(item => item.label), expectedQuickLabels);
  assert.equal(rs1[3].resource.url, brochureUrl);
});

test('Pulse 4K preserves both official livestreaming values with page conditions', () => {
  const pulse = readProduct('pulse-4k');
  const statement = pulse.features.map(item => item.text).join(' ') + ' ' + pulse.overview;
  assert.match(statement, /1080p30/);
  assert.match(statement, /720p30/);
  assert.match(statement, /1·5쪽/);
  assert.match(statement, /6쪽/);
  const datasource = pulse.documents.find(item => item.type === 'Specification');
  assert.match(datasource.note, /1080p30/);
  assert.match(datasource.note, /720p30/);
});


test('W-002 history inverse restores only approved documents and Pulse text', () => {
  for (const slug of ['aquilon-rs1', 'aquilon-rsalpha', 'aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6', 'rc400t']) {
    const current = readProduct(slug);
    const restored = beforeW20261017_002Product(current, slug);
    assert.deepEqual(restored.documents, w20261017_002Fixture[slug].documents.prior, slug);
    assert.deepEqual(restored.io, current.io, 'unapproved fields remain unchanged');
    const bad = structuredClone(current);
    if (slug === 'aquilon-rs1') bad.documents.find(item => item.url === 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Common/User+Manual/Aquilon_User_Manual_v6.2.pdf').title += ' unexpected';
    else if (slug === 'rc400t') bad.documents.find(item => item.type === 'Quick Start Guide').title += ' unexpected';
    else bad.documents.find(item => item.type === 'Brochure').note += ' unexpected';
    assert.throws(() => beforeW20261017_002Product(bad, slug), /unexpected W-20261017-002/);
  }
  const pulse = readProduct('pulse-4k');
  const rewound = beforeW20261017_002Product(pulse, 'pulse-4k');
  assert.equal(rewound.features[4].text, w20261017_002Fixture['pulse-4k'].fields.feature5.prior.text);
  assert.notEqual(rewound, pulse);
  const laterPulse = structuredClone(pulse);
  laterPulse.overview += ' independent later edit';
  const afterRewind = beforeW20261017_002Product(laterPulse, 'pulse-4k');
  assert.match(afterRewind.overview, /independent later edit$/);
  assert.doesNotMatch(afterRewind.overview, /720p30/);
});
