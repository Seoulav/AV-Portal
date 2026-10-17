import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW20261015_006Product, beforeW20261015_006Raw } from './w20261015-006-history.mjs';
import { beforeW20261015_006LabelsProduct, beforeW20261015_006LabelsRaw } from './w20261015-006-labels-history.mjs';
import { beforeW010AquilonProduct, beforeW010AquilonRaw } from './w20261016-010-aquilon-history.mjs';
import { beforeW014AnalogWayProduct, beforeW014AnalogWayRaw } from './w014-analogway-history.mjs';

const expected = {
  'aquilon-rsalpha': 'a1e3611332bc7b1fd5ae4127a94f5fb9e54b9e21bb5de468fc4c80e955501024',
  'aquilon-rs1': '0f5dd02c464c5da296fa481bf3e9edbd0bd6a0455aa9c562d7bcaa45fcadc1db',
  'aquilon-rs2': 'c9a21345a784f3e6faea7829444308d0f707a7aa2134730f34d2ad2d38b7359d',
  'aquilon-rs3': '7a59a3646126739ae0f3684eb02ff972d6fb8ff2e6533650214f768f974b1ecd',
  'aquilon-rs4': '3c2e8109dbd8add3442884519b18ea9d7a24852532757458e11f996d40a12e11',
  'aquilon-rs5': 'ee5fd7a3eabf645b6419d3f2843b0c485da6e1a7a92756f2b6904f5e25b9c5d7',
  'aquilon-rs6': '335d53ff1f2d990c5b2677409bca4fa8be0ee2fc7c33fc9e5dbf13e3f91f5688',
  'eikos-4k': '50b2985f2a6abb86a00e31cc37f81ef7456f3bf105f41e5d494040c464d8d778',
  'pulse-4k': '771d789b3cf599e9645416d894ec677e9037bf673df0004342ee0caae6483d54',
  'zenith-100': '2cccebebe1d0d9da786b8c26d1b42b38ee57b708e1d136ddac81ef8e411455f6',
  'zenith-200': 'c9706993a474585bd182f7031d2ecd656fd474075bb8588fddc3576037216fa6',
};
const sha = raw => createHash('sha256').update(raw).digest('hex');

test('eleven Analog Way selective inverses restore exact prior product bytes', () => {
  for (const [slug, priorHash] of Object.entries(expected)) {
    const raw = readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8');
    assert.equal(sha(beforeW20261015_006Raw(beforeW20261015_006LabelsRaw(beforeW010AquilonRaw(beforeW014AnalogWayRaw(raw, slug), slug, { w002Undone: true }), slug, { w002Undone: true }), slug)), priorHash, slug);
    const product = JSON.parse(raw);
    product.overview += ' independent later edit';
    assert.match(beforeW20261015_006Product(beforeW20261015_006LabelsProduct(beforeW010AquilonProduct(beforeW014AnalogWayProduct(product, slug), slug, { w002Undone: true }), slug, { w002Undone: true }), slug).overview, /independent later edit/);
    product.portMap.items[0].x2--;
    assert.throws(() => beforeW20261015_006Product(beforeW20261015_006LabelsProduct(beforeW010AquilonProduct(beforeW014AnalogWayProduct(product, slug), slug, { w002Undone: true }), slug), slug), /unexpected W-20261017-011 map change|unexpected W-015 Midra\/Zenith Port Map layout|unexpected W-014 Port Map changes|approved marker offsets changed|approved Analog Way map changed/);
  }
});
