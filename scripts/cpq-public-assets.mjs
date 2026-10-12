// Only the exact sanitized upstream templates approved for the Portal integration are exempt.
import {createHash} from 'node:crypto';
export const CPQ_TEMPLATES=Object.freeze({
  "cpq/templates/sanitized/guide-ds-won.xlsx": "9963d554a985d0498c7f924df140ae57ab332d53ed7c6cf97a95f030c0913798",
  "cpq/templates/sanitized/guide-ds.xlsx": "a50c1e1f65b25294f57a2e36b3f0575c4f076dcfc7a6455155fc639c63620182",
  "cpq/templates/sanitized/guide-pumsem.xlsx": "16fee2df516557fcd1bc156a78182dfedd2f8e1e9d3b19d4ae47891e7f17f1ed",
  "cpq/templates/sanitized/guide-won.xlsx": "dcdb28f80fd1860872dc229ee5f63cdd6cd68c2e379484de1de672681f619545",
  "cpq/templates/sanitized/quote-template.xlsx": "3fc80951035b522f7c01ac9e015687d1744e5bea1d66792dcd939125a646bda2"
});
export function isApprovedCpqTemplate(path, bytes) {
 return Object.hasOwn(CPQ_TEMPLATES,path) && createHash('sha256').update(bytes).digest('hex')===CPQ_TEMPLATES[path];
}
