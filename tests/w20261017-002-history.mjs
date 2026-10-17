import { readFileSync } from 'node:fs';

export const w20261017_002Fixture = JSON.parse(readFileSync(new URL('./fixtures/w20261017-002-history.json', import.meta.url), 'utf8'));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function rewindDocuments(current, slug, record) {
  if (!Array.isArray(current.documents)) return current;
  let documents = current.documents;
  const clone = () => { if (documents === current.documents) documents = structuredClone(current.documents); return documents; };
  const locateByUrl = url => documents.findIndex(item => item.url === url);
  const findPrior = predicate => record.documents.prior.find(predicate);

  for (const approved of record.documents.approved.filter(doc => doc.type === 'Quick Start Guide')) {
    const index = locateByUrl(approved.url);
    if (index < 0) continue;
    const item = documents[index];
    const prior = findPrior(doc => doc.url === approved.url);
    if (prior && equal(item, prior)) continue;
    if (!equal(item, approved)) throw new Error(`${slug}: unexpected W-20261017-002 Quick Start Guide change`);
    documents = clone(); documents.splice(index, 1);
  }

  if (slug === 'aquilon-rs1') {
    const commonUrl = 'https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Common/User+Manual/Aquilon_User_Manual_v6.2.pdf';
    const manualIndex = locateByUrl(commonUrl);
    if (manualIndex >= 0) {
      const item = documents[manualIndex];
      const approved = record.documents.approved.find(doc => doc.url === commonUrl);
      if (!approved || !equal(item, approved)) throw new Error(`${slug}: unexpected W-20261017-002 User Manual change`);
      const prior = findPrior(doc => doc.type === 'User Manual');
      documents = clone(); documents[manualIndex] = structuredClone(prior);
    }
  }

  if (slug === 'pulse-4k') {
    const specPrior = findPrior(doc => doc.type === 'Specification');
    const specApproved = record.documents.approved.find(doc => doc.type === 'Specification');
    const index = documents.findIndex(doc => doc.url === specApproved?.url && doc.type === 'Specification');
    if (index >= 0 && specPrior && specPrior.note !== specApproved.note) {
      const item = documents[index];
      if (item.note !== specPrior.note && item.note !== specApproved.note) throw new Error('pulse-4k: unexpected W-20261017-002 datasheet note change');
      if (item.note === specApproved.note) { const next = structuredClone(item); next.note = specPrior.note; documents = clone(); documents[index] = next; }
    }
  }

  const brochurePrior = findPrior(doc => doc.type === 'Brochure');
  const brochureApproved = record.documents.approved.find(doc => doc.type === 'Brochure');
  if (brochurePrior && brochureApproved?.url) {
    const index = documents.findIndex(doc => doc.file === brochureApproved.file && doc.type === 'Brochure');
    if (index >= 0) {
      const item = documents[index];
      const next = structuredClone(item);
      let changed = false;
      for (const key of ['url', 'note']) {
        if (brochurePrior[key] === brochureApproved[key]) continue;
        if (item[key] === brochureApproved[key]) {
          if (Object.hasOwn(brochurePrior, key)) next[key] = brochurePrior[key];
          else delete next[key];
          changed = true;
        } else if (item[key] !== brochurePrior[key]) {
          throw new Error(`${slug}: unexpected W-20261017-002 brochure ${key} change`);
        }
      }
      if (changed) { documents = clone(); documents[index] = next; }
    }
  }
  return documents === current.documents ? current : { ...current, documents };
}

export function beforeW20261017_002Product(current, slug) {
  const record = w20261017_002Fixture[slug];
  if (!record) return current;
  let result = rewindDocuments(current, slug, record);
  if (slug === 'pulse-4k') {
    const overviewValues = record.fields.overview;
    const overviewDelta = overviewValues.approved.startsWith(overviewValues.prior)
      ? overviewValues.approved.slice(overviewValues.prior.length) : '';
    const featureValues = record.fields.feature5;
    const actualFeature = result.features?.[4];
    if (!equal(actualFeature, featureValues.prior) && !equal(actualFeature, featureValues.approved)) {
      throw new Error('pulse-4k: unexpected W-20261017-002 feature5 change');
    }
    const actualOverview = result.overview;
    const overviewAllowed = equal(actualOverview, overviewValues.prior)
      || equal(actualOverview, overviewValues.approved)
      || Boolean(overviewDelta && actualOverview.split(overviewDelta).length === 2);
    if (!overviewAllowed) throw new Error('pulse-4k: unexpected W-20261017-002 overview change');
    const featureChanged = !equal(actualFeature, featureValues.prior);
    const overviewChanged = !equal(actualOverview, overviewValues.prior);
    if (featureChanged || overviewChanged) {
      result = structuredClone(result);
      if (featureChanged) result.features[4] = structuredClone(featureValues.prior);
      if (overviewChanged) result.overview = equal(actualOverview, overviewValues.approved)
        ? overviewValues.prior : actualOverview.replace(overviewDelta, '');
    }
  }
  return result;
}
function parseRaw(raw) { return JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw); }
function replaceRootArray(raw, key, value) {
  let match = new RegExp('^( {0,2})"' + key + '"\\s*:\\s*', 'm').exec(raw);
  if (!match) {
    const property = raw.indexOf('"' + key + '"');
    if (property < 0) throw new Error('missing raw root array: ' + key);
    const colon = raw.indexOf(':', property + key.length + 2);
    if (colon < 0) throw new Error('missing raw root colon: ' + key);
    const suffix = /^\s*/.exec(raw.slice(colon + 1))[0];
    const startValue = colon + 1 + suffix.length;
    match = { index: property, 0: raw.slice(property, startValue), 1: '' };
  }
  const start = match.index + match[0].length;
  const baseIndent = match[1] ?? '';
  if (raw[start] !== '[') throw new Error('expected raw array: ' + key);
  let depth = 0, inString = false, escaped = false, end = -1;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') inString = false; continue; }
    if (ch === '"') inString = true;
    else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) { end = i + 1; break; }
  }
  if (end < 0) throw new Error('unterminated raw array: ' + key);
  const newline = raw.includes('\r\n') ? '\r\n' : '\n';
  const rendered = JSON.stringify(value, null, 2).split('\n').map((line, i) => i ? baseIndent + '  ' + line : line).join(newline);
  return raw.slice(0, start) + rendered + raw.slice(end);
}
function replaceRawString(raw, key, prior, approved, label) {
  const from = '"' + key + '": ' + JSON.stringify(approved);
  const to = '"' + key + '": ' + JSON.stringify(prior);
  const count = raw.split(from).length - 1;
  if (!count) return raw;
  if (count !== 1) throw new Error('ambiguous raw W-002 ' + label);
  return raw.replace(from, to);
}
export function beforeW20261017_002Raw(raw, slug) {
  const current = parseRaw(raw);
  const restored = beforeW20261017_002Product(current, slug);
  if (restored === current) return raw;
  let output = raw;
  if (!equal(current.documents, restored.documents)) output = replaceRootArray(output, 'documents', restored.documents);
  if (slug === 'pulse-4k') {
    if (!equal(current.overview, restored.overview)) output = replaceRawString(output, 'overview', restored.overview, current.overview, 'overview');
    if (!equal(current.features[4], restored.features[4])) output = replaceRawString(output, 'text', restored.features[4].text, current.features[4].text, 'feature');
  }
  return output;
}
