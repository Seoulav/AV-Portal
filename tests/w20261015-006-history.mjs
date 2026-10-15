import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const approved = {
  'aquilon-rsalpha': ['1c734fd4fe5f36c97942e3b6ecf9232c50f20c980a75ccd8f3422dbbe7498404'],
  'aquilon-rs1': ['297288ce9ae74c253d7303ab5e86348fcbbf6d0ede008a5b69a8a6c8954dfd9d', '5ef0f9a745390d55733a454921a4721898b4ef5bcb892894b80599db4a88402f'],
  'aquilon-rs2': ['73f878a30a5fc1a7061f2451f634b23dd5267131b03f139943d4ebc7490ad347', '147e97ecea52a20e85964357ab64f06c85ca78059892e3ea90e487cab7a27391'],
  'aquilon-rs3': ['3951663327c1b680bee2f18df1a212bb4f0d16f0ad0d5fbfcc7797c04325caeb'],
  'aquilon-rs4': ['d3e44f82314ebe645fc683b18fc236894c1f3bd50069cddd0ac39a262f0abe18'],
  'aquilon-rs5': ['dd7ed6453676399341f779d6cb595682f49547388b25bc9cb1fda697d87ddfb0'],
  'aquilon-rs6': ['7ae84ee0172b780309965aa8ade5b35c9456bb1a3871784426013e9d14db8fdf'],
  'eikos-4k': ['81ffe8fc0372abca6c74897586e4fbff872f7f340a2a17fc882090b3bd0b8450', 'df0efe2b0197f7e4973741ae88ae45b3ee1c33b23b8d5609b922a7b16d143ded'],
  'pulse-4k': ['1916a2ab7843d5fcf59754e870c0f3c2bc05d68392e5a153e1d0bf4d7632266a', 'f5a0bcf8e80ca9096192b830cbeec9eff31591e48ed62caed29206149b56b135'],
  'zenith-100': ['59eeb410c6b84a13727ef432ee38cbdc0b7d5a3a116f19fee91e18f8508bb419', '93fdeb9fb47a34e06132b0fbd2eeb6095cf085edee29a2db24de4eaccd8971f5'],
  'zenith-200': ['f0e8b968a54b32c861140f3fa05ae6c3fd48dba51b46bfa5940f27461e29db8b', '0a7d7447885e0ab0f450ed6853667885cba510db53542d41e79f33e0f513176b'],
};
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Undo only this task's map and, for the six products that lacked one, Rear
// photo metadata. Other product fields continue to reach older hash checks.
export function beforeW20261015_006Product(product, slug) {
  const hashes = approved[slug];
  if (!hashes || product.portMap === undefined) return product;
  assert.equal(sha(product.portMap), hashes[0], `${slug}: approved Analog Way map changed`);
  const prior = structuredClone(product);
  delete prior.portMap;
  if (hashes[1]) {
    const rearIndex = prior.images.findIndex(image => image.role === 'Rear');
    assert.ok(rearIndex >= 0, `${slug}: missing approved rear photo`);
    assert.equal(sha(prior.images[rearIndex]), hashes[1], `${slug}: approved rear photo metadata changed`);
    prior.images.splice(rearIndex, 1);
    const status = prior.imageStatuses.find(image => image.role === 'Rear');
    assert.ok(status && status.status === product.images.find(image => image.role === 'Rear').verificationStatus,
      `${slug}: approved rear image status changed`);
    status.status = 'MISSING';
  }
  return prior;
}

export function beforeW20261015_006Raw(raw, slug) {
  if (!approved[slug]) return raw;
  return JSON.stringify(beforeW20261015_006Product(JSON.parse(raw), slug), null, 2) + '\n';
}
