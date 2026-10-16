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
const validMarker = i => {
  if (!record(i) || !keys(i, ['n', 'label', 'desc', 'x1', 'x2', 'y', 'y1', 'y2', 'x', 'side', 'labelX']) ||
      !Number.isInteger(i.n) || i.n <= 0 || !text(i.label) || typeof i.desc !== 'string') return false;
  if (i.side === 'left' || i.side === 'right') {
    return i.x1 === undefined && i.x2 === undefined && i.y === undefined && i.labelX === undefined &&
      Number.isFinite(i.y1) && Number.isFinite(i.y2) && i.y1 >= 0 && i.y2 > i.y1 &&
      (i.x === undefined || (Number.isFinite(i.x) && i.x >= 0));
  }
  return (i.side === undefined || i.side === 'top' || i.side === 'bottom') &&
    i.y1 === undefined && i.y2 === undefined && i.x === undefined &&
    Number.isFinite(i.x1) && Number.isFinite(i.x2) && i.x1 >= 0 && i.x2 > i.x1 &&
    (i.y === undefined || (Number.isFinite(i.y) && i.y >= 0)) &&
    (i.labelX === undefined || (Number.isFinite(i.labelX) && i.labelX >= 0));
};
function validMap(map, product) {
  const rtcom = product.manufacturer === 'RTCOM';
  const image = product.images?.find(i => i.role === map?.image && text(i.file) &&
    (!rtcom || i.file === map?.imageFile));
  const size = dimensions(image?.resolution);
  return record(map) && keys(map, rtcom
    ? ['image', 'imageFile', 'items', 'measuredImage', 'crop', 'title', 'note', 'basis', 'displayWidth']
    : ['image', 'items', 'measuredImage', 'crop']) &&
    (rtcom ? ['Main', 'Front', 'Rear', 'Other', 'Perspective', 'Diagram'] : ['Front', 'Rear', 'Diagram']).includes(map.image) &&
    (!rtcom || (text(map.imageFile) && typeof map.title !== 'number' &&
      (map.displayWidth === undefined || Number.isFinite(map.displayWidth) && map.displayWidth > 0))) &&
    size && (map.crop === undefined || (record(map.crop) && keys(map.crop, ['top','bottom']) && Number.isFinite(map.crop.top) && Number.isFinite(map.crop.bottom) && map.crop.top >= 0 && map.crop.bottom >= 0 && map.crop.top + map.crop.bottom < size[1] && map.items?.every(i => i.side === 'left' || i.side === 'right'
      ? Number.isFinite(i.y1) && Number.isFinite(i.y2) && i.y1 >= map.crop.top && i.y2 <= size[1] - map.crop.bottom
      : i.y === undefined || (Number.isFinite(i.y) && i.y >= map.crop.top && i.y <= size[1] - map.crop.bottom)))) && portMapImageMatches(image, ...size, map) && Array.isArray(map.items) && map.items.length > 0 &&
    map.items.every(i => validMarker(i) && (i.side === 'left' || i.side === 'right'
      ? i.y2 <= size[1] && (i.x === undefined || i.x <= size[0])
      : i.x2 <= size[0] && (i.y === undefined || i.y <= size[1]) &&
        (i.labelX === undefined || i.labelX <= size[0]))) && new Set(map.items.map(i => i.n)).size === map.items.length;
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
  if (isDisplayProduct(product) || !record(flow) || !keys(flow, ['type', 'layout', 'scenarios', 'description', 'inputs', 'outputs', 'processes', 'connections', 'auxiliary', 'groups', 'band', 'legend', 'notes']) || !flowTypes.includes(flow.type) || !shortText(flow.description)) return false;
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
  if (flow.layout === undefined) {
    if (flow.scenarios !== undefined) return false;
  } else {
    if (flow.layout !== 'cable-scenarios' || flow.type !== 'extender') return false;
    const inputIds = new Set(flow.inputs.map(n => n.id)), processIds = new Set(flow.processes.map(n => n.id)),
      outputIds = new Set(flow.outputs.map(n => n.id));
    const scenario = s => record(s) && keys(s, ['id', 'title', 'mode', 'source', 'cable', 'sink', 'receiver', 'receiverLabel', 'displayLabel', 'outputLabel', 'peripherals', 'cableLabel', 'signalLabel', 'powerLabel', 'powerDirection', 'steps', 'evidence']) &&
      identifier(s.id) && shortText(s.title) && shortText(s.mode) &&
      inputIds.has(s.source) && processIds.has(s.cable) && outputIds.has(s.sink) &&
      ['monitor', 'hub'].includes(s.receiver) && shortText(s.receiverLabel) && shortText(s.displayLabel) && shortText(s.outputLabel) &&
      list(s.peripherals, 6, shortText) && shortText(s.cableLabel) && shortText(s.signalLabel) && shortText(s.powerLabel) &&
      s.powerDirection === 'reverse' && list(s.steps, 5, shortText, 3) && evidence(s.evidence) &&
      ['video', 'usb'].every(signal => flow.connections.some(e => e.from === s.source && e.to === s.cable && e.signal === signal) &&
        flow.connections.some(e => e.from === s.cable && e.to === s.sink && e.signal === signal));
    if (!list(flow.scenarios, 2, scenario, 2) ||
        new Set(flow.scenarios.map(s => s.id)).size !== 2 ||
        new Set(flow.scenarios.map(s => s.source)).size !== 2 ||
        new Set(flow.scenarios.map(s => s.cable)).size !== 2 ||
        new Set(flow.scenarios.map(s => s.sink)).size !== 2 ||
        flow.scenarios.map(s => s.receiver).sort().join(',') !== 'hub,monitor') return false;
  }
  return list(flow.legend, 9, l => record(l) && keys(l, ['signal', 'label']) && signalKinds.includes(l.signal) && shortText(l.label)) && list(flow.notes, 12, shortText);
}
function validScreenExample(item) {
  if (!record(item) || !keys(item, ['name', 'method', 'signal', 'signalType', 'signalWidth', 'signalHeight', 'outputWidth', 'outputHeight', 'activeWidth', 'activeHeight', 'masked', 'offsetX', 'offsetY', 'rightMargin', 'bottomMargin', 'areaLabel', 'note', 'placementHint']) ||
      !text(item.name) || !text(item.method) || !text(item.signal) || typeof item.masked !== 'boolean') return false;
  if (item.signalType === 'output') return item.masked === false && Number.isInteger(item.outputWidth) && item.outputWidth > 0 &&
    Number.isInteger(item.outputHeight) && item.outputHeight > 0 && item.activeWidth === item.outputWidth &&
    item.activeHeight === item.outputHeight && item.signal === `${item.outputWidth}×${item.outputHeight}` &&
    item.signalWidth === undefined && item.signalHeight === undefined && item.areaLabel === undefined &&
    item.offsetX === undefined && item.offsetY === undefined && item.rightMargin === undefined && item.bottomMargin === undefined && item.note === undefined && item.placementHint === undefined;
  if (item.signalType !== 'fixed' || item.outputWidth !== undefined || item.outputHeight !== undefined ||
      !Number.isInteger(item.signalWidth) || item.signalWidth <= 0 || !Number.isInteger(item.signalHeight) || item.signalHeight <= 0 ||
      item.signal !== `${item.signalWidth}×${item.signalHeight}`) return false;
  if (item.placementHint === 'illustrative-offset') return item.masked && text(item.areaLabel) && text(item.note) &&
    item.activeWidth === undefined && item.activeHeight === undefined && item.offsetX === undefined && item.offsetY === undefined &&
    item.rightMargin === undefined && item.bottomMargin === undefined;
  if (item.placementHint !== undefined || !Number.isInteger(item.activeWidth) || item.activeWidth <= 0 ||
      !Number.isInteger(item.activeHeight) || item.activeHeight <= 0) return false;
  if (item.masked) return Number.isInteger(item.offsetX) && item.offsetX >= 0 && Number.isInteger(item.offsetY) && item.offsetY >= 0 &&
    text(item.areaLabel) && Number.isInteger(item.rightMargin) && item.rightMargin >= 0 &&
    Number.isInteger(item.bottomMargin) && item.bottomMargin >= 0 &&
    item.offsetX + item.activeWidth + item.rightMargin === item.signalWidth &&
    item.offsetY + item.activeHeight + item.bottomMargin === item.signalHeight && item.note === undefined;
  return item.activeWidth === item.signalWidth && item.activeHeight === item.signalHeight && item.offsetX === undefined &&
    item.offsetY === undefined && item.rightMargin === undefined && item.bottomMargin === undefined &&
    item.areaLabel === undefined && typeof item.note === 'string';
}
function validComparison(comparison) {
  return record(comparison) && keys(comparison, ['title', 'columns', 'rows']) && text(comparison.title) &&
    texts(comparison.columns) && comparison.columns.length > 1 && Array.isArray(comparison.rows) && comparison.rows.length > 0 &&
    comparison.rows.every(row => texts(row) && row.length === comparison.columns.length);
}
export function validLayerPlan(plan, product) {
  if (!record(plan) || !keys(plan, ['type', 'title', 'currentSlug', 'models', 'sourceTypes', 'example', 'background', 'xdmComparison', 'notes', 'evidence']) ||
      plan.type !== 'aquilon' || !shortText(plan.title) || !identifier(plan.currentSlug)) return false;
  const model = row => record(row) && keys(row, ['slug', 'model', 'inputs4k', 'outputConnectors4k', 'programOutputs4k', 'mixingLayers4k', 'splitLayers2k', 'vpus']) &&
    identifier(row.slug) && shortText(row.model) && ['inputs4k', 'outputConnectors4k', 'programOutputs4k', 'mixingLayers4k', 'splitLayers2k', 'vpus'].every(key => Number.isInteger(row[key]) && row[key] > 0) &&
    row.splitLayers2k === row.mixingLayers4k * 2;
  const example = plan.example, background = plan.background, comparison = plan.xdmComparison, evidence = plan.evidence;
  if (!list(plan.models, 7, model, 7) || new Set(plan.models.map(row => row.slug)).size !== 7) return false;
  const current = plan.models.find(row => row.slug === plan.currentSlug);
  if (!current || current.model !== product.model) return false;
  if (!texts(plan.sourceTypes) || plan.sourceTypes.length < 3 || !record(example) ||
      !keys(example, ['title', 'outputs', 'outputCapacity', 'outputLinks', 'layerCapacity', 'layerLinkWidth', 'layerLinks']) ||
      !shortText(example.title) || !Number.isInteger(example.outputs) || example.outputs !== 4 || example.outputCapacity !== 2 ||
      example.outputLinks !== example.outputs * example.outputCapacity || example.layerCapacity !== 2 || example.layerLinkWidth !== 4 ||
      example.layerLinks !== Math.ceil(example.outputLinks / example.layerLinkWidth)) return false;
  if (!record(background) || !keys(background, ['setsPerScreen', 'noLayerScreenResources']) || background.setsPerScreen !== 8 || background.noLayerScreenResources !== 0) return false;
  if (!record(comparison) || !keys(comparison, ['xdmWos100']) || !record(comparison.xdmWos100) ||
      !keys(comparison.xdmWos100, ['cardCount', 'outputPorts', 'layers4kPerOutput', 'allPortsSameScreenWithLayers']) ||
      comparison.xdmWos100.cardCount !== 1 || comparison.xdmWos100.outputPorts !== 4 || comparison.xdmWos100.layers4kPerOutput !== 4 || comparison.xdmWos100.allPortsSameScreenWithLayers !== true) return false;
  if (!list(plan.notes, 12, shortText, 4) || !record(evidence) || !keys(evidence, ['manualPages', 'brochurePage', 'rtcomSource']) ||
      !list(evidence.manualPages, 16, page => Number.isInteger(page) && page > 0, 8) || !evidence.manualPages.includes(68) || !evidence.manualPages.includes(69) ||
      evidence.brochurePage !== 7 || !shortText(evidence.rtcomSource)) return false;
  return true;
}
function validSetting(s) {
  if (!record(s) || !text(s.title)) return false;
  if (s.kind === 'modes') return keys(s, ['kind', 'title', 'items', 'comparison']) && Array.isArray(s.items) && s.items.length > 0 && s.items.every(i => record(i) && keys(i, ['name', 'summary', 'detail']) && text(i.name) && text(i.summary) && (i.detail === undefined || typeof i.detail === 'string')) && (s.comparison === undefined || validComparison(s.comparison));
  if (s.kind === 'screen-examples') return keys(s, ['kind', 'title', 'items']) && list(s.items, 3, validScreenExample, 2);
  return ['edid', 'dip', 'table'].includes(s.kind) && keys(s, ['kind', 'title', 'columns', 'rows']) && texts(s.columns) && s.columns.length > 0 && Array.isArray(s.rows) && s.rows.length > 0 && s.rows.every(r => texts(r) && r.length === s.columns.length);
}
function validity(product) {
  return {
    lead: typeof product.lead === 'string', subtitle: typeof product.subtitle === 'string',
    keyFacts: Array.isArray(product.keyFacts) && product.keyFacts.length <= 4 && product.keyFacts.every(validFact),
    portMap: validMap(product.portMap, product),
    portMaps: product.manufacturer === 'RTCOM' && Array.isArray(product.portMaps) &&
      product.portMaps.length > 0 && product.portMaps.length <= 8 &&
      product.portMaps.every(map => validMap(map, product)) &&
      JSON.stringify(product.portMap) === JSON.stringify(product.portMaps[0]),
    signalFlow: validFlow(product.signalFlow, product),
    layerPlan: validLayerPlan(product.layerPlan, product),
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
    portMaps: valid.portMaps ? product.portMaps : [],
    signalFlow: valid.signalFlow ? product.signalFlow : null,
    layerPlan: valid.layerPlan ? product.layerPlan : null,
    settings: valid.settings ? product.settings : []
  };
}
// Section 03 can gain another content type (for example, a manual diagram)
// without tying card visibility to the presence of signalFlow itself.
export function selectSection03Content(enhancements = {}) {
  return enhancements.signalFlow ? { type: 'signal-flow', flow: enhancements.signalFlow } : null;
}
export function selectCardModes(product, enhancements) {
  const section03 = selectSection03Content(enhancements);
  return {
    gallery: enhancements.portMap ? 'port-map' : product.io?.length ? 'io-fallback' : product.images?.length ? 'gallery' : null,
    io: section03?.type ?? null
  };
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
