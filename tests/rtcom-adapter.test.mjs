import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptRtcomCatalog,
  adaptRtcomDetail,
  combinePublicCatalog,
  combinedCatalogSource,
  rtcomSlug,
  validateRtcomIndex
} from '../beta/site/shared/rtcom-adapter.mjs';

const index = {
  schema: 'rtcom.products.v1',
  manufacturer: 'RTCOM',
  detailPath: 'data/products/{id}.json',
  imagePath: 'output/design/assets/products/{file}',
  products: [
    {
      id: 'xdm', group: 'series', productName: 'XDM Series', model: 'XDM Series',
      itemType: 'SERIES', categories: ['영상', 'Video', 'Modular Matrix'],
      korean: '모듈형 매트릭스', cardImage: 'xdm-main.webp'
    },
    {
      id: 'blocked', group: 'integrated', productName: 'HS-88MX', model: 'HS-88MX',
      itemType: 'PRODUCT', categories: ['영상', 'Video', 'Matrix Switcher'], cardImage: 'blocked.webp'
    }
  ]
};

test('RTCOM adapter derives dynamic products, exclusions and prefixed slugs', () => {
  const validated = validateRtcomIndex(index);
  assert.equal(validated.sourceCount, 2);
  assert.deepEqual(validated.products.map(item => item.id), ['xdm']);
  assert.deepEqual(validated.excluded.map(item => item.model), ['HS-88MX']);
  assert.equal(rtcomSlug('xdm'), 'rtcom-xdm');

  const [product] = adaptRtcomCatalog(index);
  assert.deepEqual(product, {
    brand: 'RTCOM',
    product: 'XDM Series',
    categories: ['영상', 'Video', 'Modular Matrix'],
    kind: 'equipment',
    official_links: ['https://seoulav.github.io/rtcom-configurator/#products/xdm'],
    link_scope: 'series',
    slug: 'rtcom-xdm',
    rtcomId: 'xdm',
    aliases: ['XDM Series'],
    cardSummary: '모듈형 매트릭스',
    cardImage: {
      src: './rtcom/images/xdm-main.webp',
      alt: 'RTCOM XDM Series',
      note: 'RTCOM 공개 제품 이미지'
    }
  });
});

test('RTCOM index rejects schema errors, duplicate IDs and existing slug collisions', () => {
  assert.throws(() => validateRtcomIndex({ ...index, schema: 'wrong' }), /schema/);
  assert.throws(() => validateRtcomIndex({ ...index, products: [index.products[0], index.products[0]] }), /중복/);
  assert.throws(() => validateRtcomIndex(index, { existingSlugs: ['rtcom-xdm'] }), /충돌/);
});

test('combined catalog keeps AV rows first and hashes LF/CRLF source bytes identically', () => {
  const av = [{ brand: 'Sony', product: 'BRC-AM7', categories: ['카메라'], kind: 'equipment', official_links: [], slug: 'brc-am7' }];
  const combined = combinePublicCatalog(av, index);
  assert.deepEqual(combined.map(item => item.slug), ['brc-am7', 'rtcom-xdm']);
  assert.equal(combinedCatalogSource('[\r\n]\r\n', '{\r\n}'), combinedCatalogSource('[\n]\n', '{\n}'));
});

test('RTCOM detail maps images, documents, source link and related products without mutating raw data', () => {
  const raw = {
    id: 'xdm', manufacturer: 'RTCOM', productName: 'XDM Series', model: 'XDM Series',
    series: 'eXtreme Digital Matrix', itemType: 'SERIES', categories: ['영상', 'Video', 'Modular Matrix'],
    english: 'Original English', korean: 'Original Korean', subtitle: 'RTCOM subtitle',
    lead: 'RTCOM **lead**', overview: 'Overview', packageStatus: 'VERIFIED', verificationSummary: 'Verified',
    images: [{ role: 'Main', file: 'xdm-main.webp', alt: 'XDM main' }],
    imageStatuses: [{ role: 'Main', status: 'FOUND' }],
    documents: [{ type: 'Manual', status: 'FOUND', title: 'XDM manual', file: 'xdm-manual.pdf' }],
    features: [{ text: '4K60' }], specifications: [{ group: 'Video', name: 'Resolution', value: '4K' }], io: [],
    related: [{ relation: 'PART_OF_SERIES', target: 'xdm-ctr100', note: '전송기' }], sources: [], issues: []
  };
  const before = structuredClone(raw);
  const detail = adaptRtcomDetail(raw);

  assert.deepEqual(raw, before);
  assert.equal(detail.korean, 'RTCOM lead');
  assert.equal(detail.english, 'RTCOM subtitle');
  assert.equal(detail.presentation.imageBase, '../rtcom/images/');
  assert.equal(detail.presentation.sourceProductLabel, '알티컴 제품정보에서 자세히 보기 ↗');
  assert.equal(detail.presentation.sourceProductUrl, 'https://seoulav.github.io/rtcom-configurator/#products/xdm');
  assert.equal(detail.images[0].sourceUrl, 'https://seoulav.github.io/rtcom-configurator/output/design/assets/products/xdm-main.webp');
  assert.deepEqual(detail.documents.map(item => [item.type, item.url]), [
    ['Official Product Page', 'https://seoulav.github.io/rtcom-configurator/#products/xdm'],
    ['User Manual', 'https://seoulav.github.io/rtcom-configurator/output/design/assets/docs/xdm-manual.pdf']
  ]);
  assert.equal(detail.related[0].url, '../detail/?product=rtcom-xdm-ctr100');
  assert.equal(detail.related[0].productName, 'xdm-ctr100');
  for (const field of ['portMap', 'signalFlow', 'edid', 'dipSwitch']) assert.equal(detail[field], undefined);
});
