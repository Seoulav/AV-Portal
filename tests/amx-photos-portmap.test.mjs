import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { prepareEnhancements } from '../prototype/brc-am7/detail-enhancements.mjs';
import { beforeAmxW008Product, beforeAmxW008Raw } from './amx-w008-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const imageDir = new URL('beta/site/detail/images/', root);
const immutable = {
  'nx-1200': 'cdeda9dee076b014ff7bfd4bcc8b9a81b9f362a85380f872ac37e5fe009d7bca',
  'nx-2200': '9e89fa11a78f4beea53a46195a2636fbb234ba5839eb082c0c9b078cae616a8b',
  'nx-3200': '2979e7dce90d6118c0cbbf318e0ecdc32e33d89ccc9fdd7bc67f09572cc51807',
  'varia-100': 'd7ca909e7a91ffe6ef228b92fc9b5a2710bb3d91f4e22c4e524b63039516805a',
  'varia-80': 'c796ceb409058c18c85482f52e0178071a046df506a9e12cbae89c0497145976',
  'varia-sl80': '80ee816de164066cd7995ae4f2eabd4ad546386bec0775bd8d2691e28b3f2d6b',
  'varia-sl50': '15cad397089cbfd947c45dca439515331eb6fe4855e2ad680e1823bb4c7a2b4a',
};
const mainHashes = {
  'nx-1200': '35a0abe5e6ff70be9d5f57c18880572a68202186034c98403b45e3820262d31a',
  'nx-2200': '40b934e5457ab232408e3c0db3e083e621ebd6bacd3529a58775660d3ed6cf01',
  'nx-3200': 'e829de0d3e0f49b60858f329a6f0b8ac051a4e9b3c23c523fddcab3111a9dbf9',
  'varia-100': '4e6ac5af9cb3b15acdb5256e46f34851aa127b87e0e006aff2f3236fada43cbb',
  'varia-80': 'c09fec0998926726e579445fac67d44f2e26519c5215469323afaf43a25012fd',
  'varia-sl80': '956c5a3adb562d7f63b89898920243529f5828e4eb73a1e5e95215508e69d5b8',
  'varia-sl50': '26eeaeea6d0b110ecc48bbe6b108588dd045a524614dd270431f5706ff351a0d',
};
const assets = {
  'nx-1200-rear.webp': [4096, 1306, 'd07d3f7e7cc579d278b6215d895d93a76f9ee76dafcb6197696914d38978290e', '/3640_1729008746/NX-1200_Rear_x_large_2x.webp'],
  'nx-2200-rear.webp': [4096, 789, 'ae5a0bc5a1e40e890bbfd227192f8a21bdebfcfc77c0e67ce3b69eb8914a2004', '/4408_1729010256/NX-2200_Rear_x_large_2x.webp'],
  'nx-3200-rear.webp': [4096, 769, '989e4c7045fa9d70fa6a95f75434ce8db48ad60a1100e54fc15ae3edf5cd01a1', '/4417_1729010306/NX-3200_Rear_x_large_2x.webp'],
  'varia-100-other-left-front.webp': [3145, 3072, '35e0522866ac4140a210bdc3a0f71a7b95d54f8e05674d90be9f034b45c404d5', '/11308_1728956292/05._AMX_VARIA100_LeftFront_3_4_x_large_2x.webp'],
  'varia-100-other-right-front.webp': [3620, 3072, '905edd1a96fcebba2982d9954bf5f06c7926325e58aeb99fb27057336db8f855', '/11309_1728956256/06._AMX_VARIA100_LeftRight_3_4_x_large_2x.webp'],
  'varia-100-rear.webp': [4096, 3070, 'b5e00f45ac3889fcf5b87323100fa9c0087d65e06c12b3e9b9d2faba4b0ccfac', '/11313_1728956225/10._AMX_VARIA100_Rear_%281%29_x_large_2x.webp'],
  'varia-80-other-left-front.webp': [3250, 3072, 'e282787d512de9a70f99552af8ae5cc9c014f3ad07040bd1fc5a5ea859223366', '/11273_1728956373/03._AMX_VARIA-80_FrontLeft_3-4_x_large_2x.webp'],
  'varia-80-other-right-front.webp': [2923, 3072, 'bd8d47f0abc8ff9e8c662d2c64389d7c9238b2d8162b5c0899940b7f4c49cf79', '/11342_1728956093/03._New_AMX_VARIA80_FrontRight_3_4_x_large_2x.webp'],
  'varia-80-rear.webp': [4096, 3071, '32a1a06dcc71ae20a4b44f94f17d36a3b8c685d8ee6cf41b30328619eb29c5c8', '/11347_1728956077/08._AMX_VARIA80_Rear_x_large_2x.webp'],
  'varia-sl80-other-left-front.webp': [3451, 3072, '214b2e43e330b41d9b16de0f0f4849af8a0017a266a6ade3175e84fbd402c25b', '/11289_1728956367/03._AMX_VARIA-SL80_FrontLeft_3-4_x_large_2x.webp'],
  'varia-sl80-other-left.webp': [1630, 3072, '1c24f807582ae74f17f0f54fec4db8d01634e5ca263103a372e2b85ae60470e6', '/11290_1728956349/04._AMX_VARIA-SL80_LeftSide_x_large_2x.webp'],
  'varia-sl80-other-right-front.webp': [3250, 3072, '704513df814d74ca7d9064c934564a12502c2ceefdbd52fb497c99f64eec66c2', '/11288_1728956367/02._AMX_VARIA-SL80_FrontRight_3-4_x_large_2x.webp'],
  'varia-sl80-other-right.webp': [2118, 3072, '6eb1d2a5fe283d337199f7a07dd1e81e0ba683e2388e47d4ac7f8e9fcd3bcacc', '/11303_1728956306/05._New_-_AMX_VARIA_SL80_RightSide_x_large_2x.webp'],
  'varia-sl80-rear.webp': [4087, 3072, '2300842da0a8def9d0420cf1583ee42a12fccd9978ba22cb6b6b4e4c55b339f7', '/11304_1728956296/06._New_-_AMX_VARIA_SL80_RearStraight_x_large_2x.webp'],
  'varia-sl50-other-left-front.webp': [1775, 3072, '62a66129784d7005fe03562262259345334f60096ea25f682fb0d1a5fbdb1785', '/11297_1728956327/03._AMX_VARIA-SL50_FrontLeft_3-4_x_large_2x.webp'],
  'varia-sl50-other-left.webp': [1231, 3072, 'ea4826554ef94f27a03a4e1d4f117e7478d3a79e2955dbc42b17568aaba3a288', '/11339_1728956127/04._New_-_AMX_VARIA_SL50_LeftSide_x_large_2x.webp'],
  'varia-sl50-other-right-front.webp': [2231, 3072, 'c9d75052d62de8050464431a2e57f736779f918a4666b94dce07281e983d466e', '/11296_1728956328/02._AMX_VARIA-SL50_FrontRight_3-4_x_large_2x.webp'],
  'varia-sl50-rear.webp': [2170, 3072, '18051ed99de610db347714fe1fc59705a3cee489ddcb15dde232a3f5964244d8', '/11350_1728956072/AMX_VARIA_SL50_RearStraight_x_large_2x.webp'],
};
const productAssets = {
  'nx-1200': ['nx-1200-rear.webp'],
  'nx-2200': ['nx-2200-rear.webp'],
  'nx-3200': ['nx-3200-rear.webp'],
  'varia-100': ['varia-100-other-left-front.webp', 'varia-100-other-right-front.webp', 'varia-100-rear.webp'],
  'varia-80': ['varia-80-other-left-front.webp', 'varia-80-other-right-front.webp', 'varia-80-rear.webp'],
  'varia-sl80': ['varia-sl80-other-left-front.webp', 'varia-sl80-other-left.webp', 'varia-sl80-other-right-front.webp', 'varia-sl80-other-right.webp', 'varia-sl80-rear.webp'],
  'varia-sl50': ['varia-sl50-other-left-front.webp', 'varia-sl50-other-left.webp', 'varia-sl50-other-right-front.webp', 'varia-sl50-rear.webp'],
};
const mapRows = {
  'nx-1200': [6, 4, 2, 3, 1, 0],
  'nx-2200': [4, 3, 7, 6, 5, 2, 1, 8, 0],
  'nx-3200': [4, 3, 7, 6, 5, 2, 1, 8, 0],
};

function dimensions(bytes) {
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
  assert.equal(bytes.subarray(12, 16).toString(), 'VP8X');
  return [bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1];
}

test('seven AMX products publish only their model-linked official standalone views', () => {
  for (const [slug, files] of Object.entries(productAssets)) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    assert.equal(sha(JSON.stringify(product.images[0])), mainHashes[slug], `${slug}: existing Main changed`);
    assert.deepEqual(product.images.slice(1).map(image => image.file), files, `${slug}: selected views`);
    for (const image of product.images.slice(1)) {
      const [width, height, expectedSha, urlTail] = assets[image.file];
      assert.equal(image.provider, 'AMX');
      assert.equal(image.officialSource, true);
      assert.ok(['FOUND', 'VERIFIED'].includes(image.verificationStatus));
      assert.equal(image.originalSize, `${width}x${height}`);
      assert.equal(image.resolution, `${width}x${height}`);
      assert.ok(image.sourceUrl.startsWith('https://adn.harmanpro.com/product_attachments/product_attachments/'));
      assert.ok(image.sourceUrl.endsWith(urlTail));
      assert.doesNotMatch(image.sourceUrl, /Disclaimer|ACS810A|ACS100F/i);
      const bytes = readFileSync(new URL(image.file, imageDir));
      assert.equal(sha(bytes), expectedSha, image.file);
      assert.deepEqual(dimensions(bytes), [width, height], image.file);
    }
  }
});

test('NX rear maps use only connectors that are visible in the matching drawings and photos', () => {
  for (const [slug, rows] of Object.entries(mapRows)) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    const rear = product.images.find(image => image.role === 'Rear');
    const map = prepareEnhancements(product).portMap;
    assert.ok(map, `${slug}: valid map`);
    assert.equal(map.image, 'Rear');
    assert.deepEqual(map.measuredImage, {
      file: rear.file,
      width: Number(rear.resolution.split('x')[0]),
      height: Number(rear.resolution.split('x')[1]),
    });
    assert.deepEqual(map.items.map(item => item.n), map.items.map((_, index) => index + 1));
    assert.equal(map.items.length, rows.length);
    rows.forEach((ioIndex, index) => {
      const io = product.io[ioIndex];
      const marker = map.items[index];
      assert.ok(io, `${slug}: io ${ioIndex}`);
      assert.ok(marker.label.includes(io.signal.split('(')[0].split(' ')[0]) || marker.desc.includes(io.signal.split('(')[0]), `${slug}: marker ${marker.n} backed by I/O row ${ioIndex}`);
    });
  }
  assert.deepEqual(mapRows['nx-1200'], [6, 4, 2, 3, 1, 0], 'rear photo excludes front USB host and IR receiver');
});

test('VARIA stays map-free and every non-image product field stays fixed', () => {
  for (const slug of Object.keys(productAssets)) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    if (slug.startsWith('varia-')) assert.equal(product.portMap, undefined, `${slug}: no Port Map`);
    const current = structuredClone(product);
    delete current.images;
    delete current.imageStatuses;
    delete current.portMap;
    assert.equal(sha(JSON.stringify(current)), immutable[slug], `${slug}: specifications, I/O, documents and presentation fields`);
  }
});

test('historical inverse keeps unrelated current changes visible and rejects changed approved fields', () => {
  for (const slug of Object.keys(productAssets)) {
    const current = read(`beta/site/detail/data/${slug}.json`);
    const baseline = beforeAmxW008Raw(JSON.stringify(current, null, 2) + '\n', slug);
    const altered = structuredClone(current);
    altered.io = [];
    assert.deepEqual(beforeAmxW008Product(altered, slug).io, [], `${slug}: current I/O passes through`);
    assert.notEqual(beforeAmxW008Raw(JSON.stringify(altered, null, 2) + '\n', slug), baseline, `${slug}: old hash catches I/O regression`);
    const changedImage = structuredClone(current);
    changedImage.images.at(-1).alt += ' altered';
    assert.throws(() => beforeAmxW008Product(changedImage, slug), /unexpected W-008 images change/);
    if (current.portMap) {
      const changedMap = structuredClone(current);
      changedMap.portMap.items[0].x1 += 1;
      assert.throws(() => beforeAmxW008Product(changedMap, slug), /unexpected W-008 portMap change/);
    }
  }
});
