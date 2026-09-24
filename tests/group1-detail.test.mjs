import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGroup1Package, buildPreviewCatalog } from '../prototype/group1/group1-data.mjs';

const sample = `# Demo Product Detail Data
- Product ID: \`AVP-0100\`
- Package status: \`READY WITH REVIEW FLAGS\`
## A. Product Header
| Field | Value | Status / Source |
|---|---|---|
| Manufacturer | Demo | VERIFIED |
| Product Name | Mixer One | VERIFIED |
| Model | M1 | VERIFIED |
| Category | 오디오 · 믹서 | VERIFIED |
| Item Type | PRODUCT | VERIFIED |
| Short English Description | A mixer. | VERIFIED |
| Korean Description | 믹서 설명. | VERIFIED |
| Verification Summary | 일부 검토. | READY WITH REVIEW FLAGS |
| Official Product Page | https://example.com/m1 | VERIFIED |
## B. Image Gallery
| Role | Status | Source | Model Match | Resolution | Publication / Reuse Status |
|---|---|---|---|---|---|
| Rear | FOUND | https://example.com/rear.jpg | VERIFIED | 1000×1000 | REVIEW REQUIRED |
| Front | REVIEW REQUIRED | https://example.com/m1 | VERIFIED | MISSING | REVIEW REQUIRED |
## C. Quick Documents
| Type | Status | Document Title | Source | Language | Revision / Version | Applicability | Notes |
|---|---|---|---|---|---|---|---|
| Manual | FOUND | Manual 1 | https://example.com/manual | ko | v1 | VERIFIED | — |
| 시방서 | MISSING | — | — | — | — | — | — |
| 사양서 | REVIEW REQUIRED | Spec 1 | https://example.com/spec | en | — | REVIEW REQUIRED | — |
| 기술문서 | MISSING | — | — | — | — | — | — |
## Overview
설명 하나.
## Features
1. 기능 하나.
## Specifications
| Group | Name | Value | Unit | Condition | Source | Verification Status |
|---|---|---|---|---|---|---|
| Audio | Channels | 32 | channel | — | P | VERIFIED |
| Mixer | Mix | MISSING | — | 확인 전 | — | MISSING |
## I/O
| Group | Connector | Signal | Direction | Quantity | Protocol / Standard | Fixed / Optional | Condition | Source | Verification Status |
|---|---|---|---|---|---|---|---|---|---|
| Audio | XLR | Input | IN | 2 | Analog | Fixed | — | P | PARTIAL |
## Remaining Review
- 추가 자료 검토가 필요하다.
`;

test('Group 1 package preserves review states, groups and four document slots', () => {
  const data = parseGroup1Package(sample);
  assert.equal(data.manufacturer, 'Demo');
  assert.equal(data.model, 'M1');
  assert.equal(data.packageStatus, 'READY WITH REVIEW FLAGS');
  assert.deepEqual(data.categories, ['오디오', '믹서']);
  assert.deepEqual(data.imageStatuses.map(item => item.status), ['FOUND', 'REVIEW REQUIRED']);
  assert.deepEqual(data.images, []);
  assert.deepEqual(data.documents.map(item => item.status), ['FOUND', 'MISSING', 'REVIEW REQUIRED', 'MISSING', 'VERIFIED']);
  assert.equal(data.documents[1].url, undefined);
  assert.equal(data.specifications[1].verification, 'MISSING');
  assert.equal(data.io[0].verification, 'PARTIAL');
  assert.equal(data.io[0].group, 'Audio');
});

test('preview Library adds only missing Group 1 products without removing the public 25', () => {
  const base = [{ brand: 'Demo', product: 'M1', categories: ['오디오'], kind: 'equipment', official_links: ['https://example.com/m1'] }];
  const result = buildPreviewCatalog(base, [parseGroup1Package(sample)]);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], base[0]);
});
