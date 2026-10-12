// Display groups for brands with a dedicated series-choice stage. Keep the
// catalog's brandSort values intact; this module only maps them for navigation.
const SERIES = {
  Shure: {
    label: 'Shure',
    groups: [
      { id: 'ulx-d', label: 'ULX-D \uBB34\uC120 \uC2DC\uC2A4\uD15C', members: ['ULX-D'] },
      { id: 'qlx-d', label: 'QLX-D \uBB34\uC120 \uC2DC\uC2A4\uD15C', members: ['QLX-D'] },
      { id: 'slx-d-plus', label: 'SLX-D Plus \uBB34\uC120 \uC2DC\uC2A4\uD15C', members: ['SLX-D+'] },
      { id: 'mxc', label: '\uD68C\uC758\uC6A9 \uC7A5\uBE44 (MXC\u00B7MXCW)', members: ['MXC'] },
      { id: 'mx', label: 'Microflex \uC720\uC120 \uB9C8\uC774\uD06C', members: ['MX'] },
      { id: 'mxa', label: '\uCC9C\uC7A5 \uC5B4\uB808\uC774 (MXA)', members: ['MXA'] },
      { id: 'ua', label: '\uC548\uD14C\uB098\u00B7\uBD84\uBC30', members: ['UA'] }
    ]
  },
  Samsung: {
    label: '삼성전자',
    groups: [
      { id: 'qhc', label: '단독형 UHD H 시리즈 (QHC)', members: ['QHF', 'QHC'] },
      { id: 'qmc', label: '단독형 UHD M 시리즈 (QMC)', members: ['QMC'] },
      { id: 'video-wall', label: '비디오월', members: ['Video Wall'] },
      { id: 'hotel-tv', label: '호텔 TV HU8000F 시리즈', members: ['Hotel TV'] },
      { id: 'business-tv', label: '비즈니스TV', members: ['Business TV'] },
      { id: 'whiteboard', label: '전자칠판', members: ['Whiteboard'] },
      { id: 'led-signage', label: 'LED 사이니지', members: ['LED Signage'] }
    ]
  }
};

const configFor = brand => Object.hasOwn(SERIES, brand) ? SERIES[brand] : null;

export const seriesBrandLabelFor = brand => configFor(brand)?.label ?? brand;

export function seriesIdFor(item) {
  if (item.brand === 'RTCOM') return item.brandSort?.group ?? '';
  const group = item.brandSort?.group;
  return configFor(item.brand)?.groups.find(entry => entry.members.includes(group))?.id ?? '';
}

export function seriesGroupsFor(brand, items, rtcomGroups) {
  if (brand === 'RTCOM' && rtcomGroups) return Object.entries(rtcomGroups).map(([id, label], order) => {
    const match = item => item.brand === 'RTCOM' && seriesIdFor(item) === id;
    return { id, label, match, count: items.filter(match).length, order };
  });
  const config = configFor(brand);
  if (!config) return null;
  return config.groups.map(entry => {
    const match = item => item.brand === brand && entry.members.includes(item.brandSort?.group);
    const members = items.filter(match);
    return { id: entry.id, label: entry.label, match, count: members.length, order: Math.min(...members.map(item => item.brandSort?.order ?? Infinity)) };
  }).sort((a, b) => a.order - b.order);
}

export function normalizeSeriesFor(brand, series, items, rtcomGroups) {
  const groups = seriesGroupsFor(brand, items, rtcomGroups);
  return groups && (series === 'all' || groups.some(group => group.id === series)) ? series : '';
}
