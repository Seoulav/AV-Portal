import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enhancementErrors, prepareEnhancements, validLayerPlan } from '../beta/site/detail/detail-enhancements.mjs';
import { prepareProductDetail } from '../beta/site/detail/product-detail-model.mjs';
import { documentCardVisible, resolveDocumentAction, uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { beforeW010AquilonProduct } from './w20261016-010-aquilon-history.mjs';

const readProduct = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const slugs = ['aquilon-rsalpha', 'aquilon-rs1', 'aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6'];

test('Aquilon layer plans expose the seven model rows and current product values', () => {
  const expected = [
    [8, 4, 4, 1, 4, 8, 4, 8, 1], [16, 8, 4, 1, 4, 8, 4, 8, 1],
    [16, 12, 8, 2, 4, 8, 8, 16, 2], [24, 12, 8, 2, 4, 8, 8, 16, 2],
    [24, 16, 12, 3, 4, 8, 12, 24, 3], [32, 16, 12, 3, 4, 8, 12, 24, 3],
    [32, 20, 16, 4, 4, 8, 16, 32, 4]
  ];
  const allModels = readProduct('aquilon-rs1').layerPlan.models;
  assert.deepEqual(allModels.map(row => [row.inputs4k, row.outputConnectors4k, row.programOutputs4k, row.screens2x2, row.mixingLayers4kPerScreen, row.splitLayers2kPerScreen, row.mixingLayers4k, row.splitLayers2k, row.vpus]), expected);
  for (const slug of slugs) {
    const product = readProduct(slug);
    const plan = product.layerPlan;
    assert.equal(validLayerPlan(plan, product), true, slug);
    assert.equal(plan.models.length, 7, slug);
    assert.ok(plan.models.some(row => row.slug === slug), slug);
    assert.equal(enhancementErrors(product).some(error => error.includes('layerPlan')), false, slug);
  }
});

test('the 2x2 4K example derives four mixing layers and eight split layers from one VPU', () => {
  const product = readProduct('aquilon-rs1');
  const example = product.layerPlan.example;
  assert.equal(example.outputs, 4);
  assert.equal(example.outputCapacity, 2);
  assert.equal(example.outputLinks, 8);
  assert.equal(example.sourceLinksPerVpu, 8);
  assert.equal(example.layerLinksPerMixer, 2);
  assert.equal(example.mixingLayersPerScreen, 4);
  assert.equal(example.splitLayersPerScreen, 8);
  assert.equal(example.vpusForScreen, 1);
  assert.equal(validLayerPlan({ ...product.layerPlan, example: { ...example, mixingLayersPerScreen: 5 } }, product), false);
  assert.equal(Object.hasOwn(example, 'layerLinkWidth'), false);
});

test('Aquilon comparison contains only XDM-WOS100 facts present in RTCOM raw data', () => {
  const product = readProduct('aquilon-rs1');
  const raw = JSON.parse(readFileSync(new URL('../beta/site/rtcom/raw/products/xdm.json', import.meta.url), 'utf8'));
  const wos = raw.lineup.find(row => row.model === 'XDM-WOS100');
  const comparison = product.layerPlan.xdmComparison.xdmWos100;
  assert.equal(comparison.outputPorts, 4);
  assert.equal(comparison.allPortsSameScreenWithLayers, true);
  assert.equal(comparison.sourceCondition, wos.io[0].condition);
  assert.equal(Object.hasOwn(comparison, 'layers4kPerOutput'), false);
  assert.equal(Object.hasOwn(comparison, 'cardCount'), false);
});

test('model table leads with screen counts and screen-layer totals, with cited distinct output sources', () => {
  const plan = readProduct('aquilon-rs1').layerPlan;
  assert.deepEqual(plan.models.map(row => row.screens2x2), [1, 1, 2, 2, 3, 3, 4]);
  assert.ok(plan.notes.some(note => /좌우로 밀어/.test(note)));
  assert.ok(plan.notes.some(note => /배경은 출력과 용량을 맞춰야 하며 확대·축소되지 않습니다/.test(note)));
  assert.ok(plan.notes.some(note => /용량 1.*미확인/.test(note)));
  assert.ok(plan.notes.some(note => /8개 이하.*VPU 2개.*미확인/.test(note)));
  assert.ok(plan.evidence.manualPages.includes(79));
  assert.ok(plan.evidence.manualPages.includes(101));
  assert.equal(plan.evidence.programOutputsManualPage, 71);
  assert.equal(plan.evidence.outputConnectorsBrochurePage, 7);
});

test('products without Aquilon layer data retain the existing detail behavior', () => {
  const product = { manufacturer: 'Example', model: 'Example device' };
  assert.equal(prepareEnhancements(product).layerPlan, null);
  assert.deepEqual(enhancementErrors(product), []);
});

test('a brochure replaces the fourth quick document label only when technical document is absent', () => {
  const base = { manufacturer: 'Analog Way', model: 'Aquilon RS1', specifications: [], io: [], documents: [
    { type: 'Brochure', quickSlot: 'technical', status: 'FOUND', title: 'Aquilon brochure', language: 'en', file: 'manuals/analog-way-aquilon-brochure-april-2026.pdf' }
  ] };
  const withBrochure = prepareProductDetail(base);
  assert.equal(withBrochure.quickDocuments[3].label, '브로슈어');
  assert.equal(withBrochure.quickDocuments[3].resource.type, 'Brochure');
  assert.equal(withBrochure.quickDocuments[3].available, true);
  const withTechnicalDocument = prepareProductDetail({ ...base, documents: [...base.documents,
    { type: 'Technical Document', status: 'FOUND', title: 'Technical note', language: 'en', url: 'https://example.com/technical.pdf' }
  ] });
  assert.equal(withTechnicalDocument.quickDocuments[3].label, '기술문서');
  assert.equal(withTechnicalDocument.additionalDocuments.some(item => item.type === 'Brochure'), true);
  const genericBrochure = prepareProductDetail({ ...base, manufacturer: 'Example', documents: [{ ...base.documents[0], quickSlot: undefined }] });
  assert.equal(genericBrochure.quickDocuments[3].label, '기술문서');
  assert.equal(genericBrochure.additionalDocuments.some(item => item.type === 'Brochure'), true);
});

test('uploaded brochure opens from the quick slot and does not appear twice as an extra reference', () => {
  const product = readProduct('aquilon-rs1');
  const manifest = JSON.parse(readFileSync(new URL('../beta/site/docs/manifest.json', import.meta.url), 'utf8'));
  const resource = product.documents.find(item => item.type === 'Brochure');
  const action = resolveDocumentAction(resource, manifest);
  assert.deepEqual(action, { kind: 'local', file: '../manuals/analog-way-aquilon-brochure-april-2026.pdf', sourceUrl: '../manuals/analog-way-aquilon-brochure-april-2026.pdf' });
  const uploaded = uploadedDocumentsFor('aquilon-rs1', manifest, [resource.file]);
  assert.equal(uploaded.length, 0);
  assert.equal(documentCardVisible([resource], uploaded), true);
  for (const slug of slugs) assert.equal(manifest.uploads.filter(entry => entry.slug === slug && entry.file === resource.file && entry.kind === 'reference').length, 1, slug);
});

test('history rewind restores only approved Aquilon fields and rejects unexpected edits', () => {
  for (const slug of slugs) {
    const current = readProduct(slug);
    const restored = beforeW010AquilonProduct(current, slug);
    assert.notEqual(restored, current, slug);
    assert.equal(Object.hasOwn(restored, 'layerPlan'), false, slug);
    const unexpected = structuredClone(current);
    unexpected.layerPlan.notes[0] += ' altered';
    assert.throws(() => beforeW010AquilonProduct(unexpected, slug), /unexpected layerPlan change/);
  }
});
