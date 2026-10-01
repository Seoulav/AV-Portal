// Temporary, optional UI fields. Existing product values are never rewritten.
const text = value => typeof value === 'string' && value.trim().length > 0;
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const texts = value => Array.isArray(value) && value.every(text);
export const flowTypes = Object.freeze(['matrix', 'switcher', 'distribution', 'extender', 'converter', 'video-processor', 'processor-card', 'recorder', 'camera', 'camera-controller', 'amplifier-channel', 'audio-dsp', 'mixer', 'audio-interface', 'network-bridge', 'wireless-microphone', 'rf-distribution', 'loudspeaker', 'microphone', 'conferencing', 'network-switch', 'control', 'power']);
export const processKinds = Object.freeze(['matrix', 'select', 'split', 'convert', 'scale', 'encode', 'decode', 'record', 'capture', 'sense', 'control', 'amplify', 'dsp', 'mix', 'bridge', 'rf', 'transduce', 'conference', 'switch', 'power', 'module']);
export const signalKinds = Object.freeze(['video', 'audio', 'network', 'control', 'rf', 'power', 'usb', 'optical', 'acoustic']);
export const isDisplayProduct = product => product.categories?.some(c => /^(Display|Projector|Digital Signage|Hospitality TV|Video Wall|Interactive Display|프로젝터|사이니지)$/i.test(c)) ?? false;
const keys = (item, allowed) => Object.keys(item).every(key => allowed.includes(key));
const validFact = f => record(f) && keys(f, ['label', 'value', 'unit']) && text(f.label) && (text(f.value) || (typeof f.value === 'number' && Number.isFinite(f.value))) && typeof f.unit === 'string';
const validMarker = i => record(i) && keys(i, ['n', 'label', 'desc', 'x1', 'x2', 'y', 'side']) && Number.isInteger(i.n) && i.n > 0 && text(i.label) && typeof i.desc === 'string' && Number.isFinite(i.x1) && Number.isFinite(i.x2) && i.x1 >= 0 && i.x2 > i.x1 && (i.side === undefined || ['top', 'bottom'].includes(i.side));
function validMap(map, product) {
  const image = product.images?.find(i => i.role === map?.image && text(i.file));
  const size = dimensions(image?.resolution);
  return record(map) && keys(map, ['image', 'items', 'measuredImage', 'crop']) && ['Front', 'Rear'].includes(map.image) &&
    size && (map.crop === undefined || (record(map.crop) && keys(map.crop, ['top','bottom']) && Number.isFinite(map.crop.top) && Number.isFinite(map.crop.bottom) && map.crop.top >= 0 && map.crop.bottom >= 0 && map.crop.top + map.crop.bottom < size[1] && map.items?.every(i => Number.isFinite(i.y) && i.y >= map.crop.top && i.y <= size[1] - map.crop.bottom))) && portMapImageMatches(image, ...size, map) && Array.isArray(map.items) && map.items.length > 0 &&
    map.items.every(i => validMarker(i) && i.x2 <= size[0] && (i.y === undefined || (Number.isFinite(i.y) && i.y >= 0 && i.y <= size[1]))) && new Set(map.items.map(i => i.n)).size === map.items.length;
}
const dimensions = value => {
  const match = typeof value === 'string' && /^(\d+)\s*[x×]\s*(\d+)$/i.exec(value.trim());
  return match && Number(match[1]) > 0 && Number(match[2]) > 0 ? [Number(match[1]), Number(match[2])] : null;
};
export function portMapImageMatches(image, width, height, map) {
  const original = dimensions(image?.originalSize), published = dimensions(image?.resolution);
  if (map?.measuredImage !== undefined) {
    const m = map.measuredImage;
    return Boolean(record(m) && keys(m, ['file', 'width', 'height']) && m.file === image?.file &&
      Number.isInteger(m.width) && Number.isInteger(m.height) && m.width > 0 && m.height > 0 &&
      m.width === width && m.height === height && published && published[0] === width && published[1] === height);
  }
  return Boolean(original && published && original[0] === width && original[1] === height && published[0] === width && published[1] === height);
}
const identifier = s => typeof s === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(s);
const shortText = s => text(s) && s.length <= 160;
const optionalText = s => s === undefined || (typeof s === 'string' && s.length <= 240);
const list = (items, max, test, min = 0) => Array.isArray(items) && items.length >= min && items.length <= max && items.every(test);
function validEvidence(refs, product) {
  return list(refs, 12, r => {
    if (!record(r)) return false;
    if (r.kind === 'spec' || r.kind === 'io') {
      const row = (r.kind === 'io' ? product.io : product.specifications)?.[r.index];
      return keys(r, ['kind', 'index']) && Number.isInteger(r.index) && r.index >= 0 && row && ['VERIFIED', 'FOUND'].includes(row.verification);
    }
    // Files and PDF signatures are checked by verify-pages; browser validation never reads the filesystem.
    return r.kind === 'pdf' && keys(r, ['kind', 'source', 'file', 'page']) &&
      product.sources?.some(s => s.code === r.source) && /^(docs|manuals)\/[a-z0-9-]+\.pdf$/.test(r.file ?? '') && Number.isInteger(r.page) && r.page > 0;
  }, 1);
}
export function validFlow(flow, product) {
  if (isDisplayProduct(product) || !record(flow) || !keys(flow, ['type', 'description', 'inputs', 'outputs', 'processes', 'connections', 'auxiliary', 'groups', 'band', 'legend', 'notes']) || !flowTypes.includes(flow.type) || !shortText(flow.description)) return false;
  const evidence = value => validEvidence(value, product);
  const endpoint = n => record(n) && keys(n, ['id', 'label', 'signal', 'group', 'caption', 'tag', 'evidence']) && identifier(n.id) && shortText(n.label) && signalKinds.includes(n.signal) && optionalText(n.caption) && (n.tag === undefined || (shortText(n.tag) && n.tag.length <= 8)) && evidence(n.evidence);
  if (!list(flow.inputs, 32, endpoint, 1) || !list(flow.outputs, 32, endpoint, 1) || !list(flow.processes, 6, n => record(n) && keys(n, ['id', 'kind', 'label', 'caption', 'crosspoints', 'evidence']) && identifier(n.id) && processKinds.includes(n.kind) && shortText(n.label) && optionalText(n.caption) && evidence(n.evidence), 1)) return false;
  if (!list(flow.groups, 16, g => record(g) && keys(g, ['id', 'label', 'caption', 'evidence']) && identifier(g.id) && shortText(g.label) && optionalText(g.caption) && evidence(g.evidence))) return false;
  const nodes = [...flow.inputs, ...flow.processes, ...flow.outputs], ids = new Set(nodes.map(n => n.id)), groups = new Set(flow.groups.map(g => g.id));
  if (ids.size !== nodes.length || groups.size !== flow.groups.length || [...flow.inputs, ...flow.outputs].some(n => n.group !== undefined && !groups.has(n.group))) return false;
  const edge = e => record(e) && keys(e, ['from', 'to', 'signal', 'label', 'direction', 'evidence']) && ids.has(e.from) && ids.has(e.to) && e.from !== e.to && signalKinds.includes(e.signal) && optionalText(e.label) && (e.direction === undefined || e.direction === 'forward' || e.direction === 'both') && evidence(e.evidence);
  if (!list(flow.connections, 96, edge, 1) || !list(flow.auxiliary, 32, edge)) return false;
  const edges = [...flow.connections, ...flow.auxiliary];
  const inputs = new Set(flow.inputs.map(n => n.id)), outputs = new Set(flow.outputs.map(n => n.id));
  if (edges.some(e => outputs.has(e.from) || inputs.has(e.to))) return false;
  const stage = id => inputs.has(id) ? -1 : outputs.has(id) ? flow.processes.length : flow.processes.findIndex(p => p.id === id);
  if (edges.some(e => stage(e.from) >= stage(e.to))) return false;
  if (nodes.some(n => !edges.some(e => e.from === n.id || e.to === n.id))) return false;
  // A crosspoint layout owns the central lane. Mixed/multiple matrices need a
  // future layout contract; reject them rather than hiding overlapping blocks.
  if (flow.processes.some(p => p.kind === 'matrix') && flow.processes.length !== 1) return false;
  for (const p of flow.processes) {
    if (p.kind !== 'matrix') { if (p.crosspoints !== undefined) return false; continue; }
    const c = p.crosspoints;
    if (!record(c) || !keys(c, ['inputs', 'outputs', 'examples']) || !list(c.inputs, 16, id => inputs.has(id), 1) || !list(c.outputs, 16, id => outputs.has(id), 1) || new Set(c.inputs).size !== c.inputs.length || new Set(c.outputs).size !== c.outputs.length) return false;
    if (!c.inputs.every(id => flow.connections.some(e => e.from === id && e.to === p.id)) || !c.outputs.every(id => flow.connections.some(e => e.from === p.id && e.to === id))) return false;
    if (flow.connections.some(e => e.to === p.id && !c.inputs.includes(e.from) || e.from === p.id && !c.outputs.includes(e.to))) return false;
    if (!list(c.examples, 16, x => record(x) && keys(x, ['input', 'output']) && c.inputs.includes(x.input) && c.outputs.includes(x.output)) || new Set(c.examples.map(x => x.output)).size !== c.examples.length) return false;
  }
  if (flow.band !== undefined && (!record(flow.band) || !keys(flow.band, ['label', 'detail', 'evidence']) || !shortText(flow.band.label) || !optionalText(flow.band.detail) || !evidence(flow.band.evidence))) return false;
  return list(flow.legend, 9, l => record(l) && keys(l, ['signal', 'label']) && signalKinds.includes(l.signal) && shortText(l.label)) && list(flow.notes, 12, shortText);
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
    portMap: validMap(product.portMap, product), signalFlow: validFlow(product.signalFlow, product),
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

// Keep the measured coordinates fixed; enlarge only the scrollable display until
// numbered circles are separated. Bracket anchors use the same scale as the photo.
export function portMapDisplayWidth(map, naturalWidth, naturalHeight, viewportWidth = 390, cardWidth = 0) {
  if (viewportWidth > 720 && cardWidth > 0) return cardWidth;
  const separated = width => {
    const scale = width / naturalWidth;
    const points = map.items.map(i => ({x: (i.x1 + i.x2) / 2 * scale,
      y: (i.y ?? (i.side === 'top' ? 0 : naturalHeight)) * scale + (i.side === 'top' ? -28 : 28)}));
    return points.every((p, i) => points.slice(i + 1).every(q => Math.abs(p.x-q.x) >= 32 || Math.abs(p.y-q.y) >= 32));
  };
  for (let width = 560; width <= 4000; width += 20) if (separated(width)) return width;
  return 4000;
}
