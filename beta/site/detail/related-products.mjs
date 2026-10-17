const RELATIONSHIP_LABELS = Object.freeze({
  PART_OF_SERIES: '시리즈 구성품',
  WORKS_WITH: '함께 사용하는 제품'
});

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function relatedTargetIds(related) {
  return [related?.target, related?.slug, related?.productId, related?.id]
    .map(text)
    .filter(Boolean);
}

function catalogProductFor(target, catalog) {
  const normalized = target.replace(/^rtcom-/i, '');
  return catalog.find(item => [item.slug, item.id, item.rtcomId].some(value => {
    const key = text(value);
    return key === target || key === normalized || key === `rtcom-${normalized}`;
  }));
}

export function resolveRelatedProductName(related, catalog = [], rtcomIndex = null) {
  const targets = relatedTargetIds(related);
  for (const target of targets) {
    const catalogProduct = catalogProductFor(target, catalog);
    const catalogName = text(catalogProduct?.model) || text(catalogProduct?.product) || text(catalogProduct?.productName);
    if (catalogName) return catalogName;

    const rtcomId = target.replace(/^rtcom-/i, '');
    const rtcomProduct = rtcomIndex?.products?.find(item => text(item.id) === rtcomId);
    const rtcomName = text(rtcomProduct?.model) || text(rtcomProduct?.productName);
    if (rtcomName) return rtcomName;
  }

  const explicitName = text(related?.model) || text(related?.productName) || text(related?.name);
  if (explicitName && !targets.some(target => explicitName.toLowerCase() === target.toLowerCase())) return explicitName;

  const fallback = targets[0] || explicitName;
  return fallback ? fallback.toUpperCase() : '관련 제품';
}

export function relationshipLabel(value) {
  const key = text(value).toUpperCase();
  return RELATIONSHIP_LABELS[key] ?? (key ? '관련 제품' : '');
}
