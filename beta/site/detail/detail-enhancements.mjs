// Temporary, optional UI fields. Existing product values are never rewritten.
const text = value => typeof value === 'string' && value.trim().length > 0;
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const texts = value => Array.isArray(value) && value.every(text);
const flowTypes = new Set(['distribution', 'matrix', 'switcher', 'extender', 'amplifier-channel', 'projector-display-input']);
const keys = (item, allowed) => Object.keys(item).every(key => allowed.includes(key));
const validFact = f => record(f) && keys(f, ['label', 'value', 'unit']) && text(f.label) && (text(f.value) || (typeof f.value === 'number' && Number.isFinite(f.value))) && typeof f.unit === 'string';
const validMarker = i => record(i) && keys(i, ['n', 'label', 'desc', 'x1', 'x2', 'side']) && Number.isInteger(i.n) && i.n > 0 && text(i.label) && typeof i.desc === 'string' && Number.isFinite(i.x1) && Number.isFinite(i.x2) && i.x1 >= 0 && i.x2 > i.x1 && (i.side === undefined || ['top', 'bottom'].includes(i.side));
function validMap(map, product) {
  const image = product.images?.find(i => i.role === map?.image && text(i.file));
  const size = dimensions(image?.resolution);
  return record(map) && keys(map, ['image', 'items']) && ['Front', 'Rear'].includes(map.image) &&
    size && portMapImageMatches(image, ...size) && Array.isArray(map.items) && map.items.length > 0 &&
    map.items.every(i => validMarker(i) && i.x2 <= size[0]) && new Set(map.items.map(i => i.n)).size === map.items.length;
}
const dimensions = value => {
  const match = typeof value === 'string' && /^(\d+)\s*[x×]\s*(\d+)$/i.exec(value.trim());
  return match && Number(match[1]) > 0 && Number(match[2]) > 0 ? [Number(match[1]), Number(match[2])] : null;
};
export function portMapImageMatches(image, width, height) {
  const original = dimensions(image?.originalSize), published = dimensions(image?.resolution);
  return Boolean(original && published && original[0] === width && original[1] === height && published[0] === width && published[1] === height);
}
function validFlow(flow) {
  return record(flow) && keys(flow, ['type', 'inputs', 'outputs', 'notes']) && flowTypes.has(flow.type) &&
    texts(flow.inputs) && flow.inputs.length > 0 && texts(flow.outputs) && flow.outputs.length > 0 && texts(flow.notes);
}
function validSetting(s) {
  if (!record(s) || !text(s.title)) return false;
  if (s.kind === 'modes') return keys(s, ['kind', 'title', 'items']) && Array.isArray(s.items) && s.items.length > 0 && s.items.every(i => record(i) && keys(i, ['name', 'summary', 'detail']) && text(i.name) && text(i.summary) && (i.detail === undefined || typeof i.detail === 'string'));
  return ['edid', 'dip', 'table'].includes(s.kind) && keys(s, ['kind', 'title', 'columns', 'rows']) && texts(s.columns) && s.columns.length > 0 && Array.isArray(s.rows) && s.rows.length > 0 && s.rows.every(r => texts(r) && r.length === s.columns.length);
}
function validity(product) {
  return {
    lead: typeof product.lead === 'string', subtitle: typeof product.subtitle === 'string',
    keyFacts: Array.isArray(product.keyFacts) && product.keyFacts.length <= 4 && product.keyFacts.every(validFact),
    portMap: validMap(product.portMap, product), signalFlow: validFlow(product.signalFlow),
    settings: Array.isArray(product.settings) && product.settings.length <= 2 && product.settings.every(validSetting)
  };
}
export function enhancementErrors(product) {
  return Object.entries(validity(product)).filter(([key, valid]) => Object.hasOwn(product, key) && !valid).map(([key]) => `Invalid optional detail field: ${key}`);
}
export function prepareEnhancements(product) {
  const valid = validity(product);
  return {
    lead: valid.lead && text(product.lead) ? product.lead : null,
    subtitle: valid.subtitle && text(product.subtitle) ? product.subtitle : null,
    keyFacts: valid.keyFacts && product.keyFacts.length >= 2 ? product.keyFacts : [],
    portMap: valid.portMap ? product.portMap : null,
    signalFlow: valid.signalFlow ? product.signalFlow : null,
    settings: valid.settings ? product.settings : []
  };
}
export function selectCardModes(product, enhancements) {
  return { gallery: enhancements.portMap ? 'port-map' : product.images?.length ? 'gallery' : null,
    io: enhancements.signalFlow ? 'signal-flow' : product.io?.length ? 'io' : null };
}
export function portMarkerPercent(item, naturalWidth) {
  if (!Number.isFinite(naturalWidth) || naturalWidth <= 0 || !Number.isFinite(item.x1) || !Number.isFinite(item.x2) || item.x1 < 0 || item.x2 <= item.x1 || item.x2 > naturalWidth) return null;
  return { left: item.x1 / naturalWidth * 100, width: (item.x2 - item.x1) / naturalWidth * 100 };
}
