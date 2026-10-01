// 국내 총판 페이지를 브라우저로 직접 열어 모델명이 정확히 일치한 항목만 공개한다.
// 제품 JSON과 catalog.json에는 총판별 운영 링크를 섞지 않는다.
export const HARMAN_MANUFACTURERS = Object.freeze([
  'AKG', 'AMX', 'BSS Audio', 'Crown', 'dbx', 'JBL', 'Lexicon', 'Martin', 'Soundcraft'
]);

export const distributorLinks = Object.freeze([
  { slug: 'nx-1200', model: 'NX-1200', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=944', checkedAt: '2026-10-01', pageTitle: 'NX-1200' },
  { slug: 'nx-2200', model: 'NX-2200', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=945', checkedAt: '2026-10-01', pageTitle: 'NX-2200' },
  { slug: 'nx-3200', model: 'NX-3200', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=946', checkedAt: '2026-10-01', pageTitle: 'NX-3200' },
  { slug: 'varia-100', model: 'VARIA-100', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2655', checkedAt: '2026-10-01', pageTitle: 'VARIA-100' },
  { slug: 'varia-80', model: 'VARIA-80', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2654', checkedAt: '2026-10-01', pageTitle: 'VARIA-80' },
  { slug: 'varia-sl50', model: 'VARIA-SL50', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2649', checkedAt: '2026-10-01', pageTitle: 'VARIA-SL50' },
  { slug: 'varia-sl80', model: 'VARIA-SL80', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2653', checkedAt: '2026-10-01', pageTitle: 'VARIA-SL80' },
  { slug: 'blu-100', model: 'BLU-100', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=45', checkedAt: '2026-10-01', pageTitle: 'BLU-100' },
  { slug: 'blu-101', model: 'BLU-101', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=46', checkedAt: '2026-10-01', pageTitle: 'BLU-101' },
  { slug: 'blu-160', model: 'BLU-160', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=43', checkedAt: '2026-10-01', pageTitle: 'BLU-160' },
  { slug: 'ec-4bv', model: 'EC-4BV', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=528', checkedAt: '2026-10-01', pageTitle: 'EC-4BV' },
  { slug: 'cdi-2-300', model: 'Crown CDi 2|300', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=92', checkedAt: '2026-10-01', pageTitle: 'CDi 2|300' },
  { slug: 'cdi-2-300bl', model: 'Crown CDi 2|300BL', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=93', checkedAt: '2026-10-01', pageTitle: 'CDi 2|300BL' },
  { slug: 'cdi-2-600', model: 'Crown CDi 2|600', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=94', checkedAt: '2026-10-01', pageTitle: 'CDi 2|600' },
  { slug: 'cdi-2-600bl', model: 'Crown CDi 2|600BL', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=95', checkedAt: '2026-10-01', pageTitle: 'CDi 2|600BL' },
  { slug: 'cdi-2-1200', model: 'Crown CDi 2|1200', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=1491', checkedAt: '2026-10-01', pageTitle: 'CDi 2|1200' },
  { slug: 'cdi-2-1200bl', model: 'Crown CDi 2|1200BL', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=1495', checkedAt: '2026-10-01', pageTitle: 'CDi 2|1200BL' },
  { slug: 'cdi-4-300', model: 'Crown CDi 4|300', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=97', checkedAt: '2026-10-01', pageTitle: 'CDi 4|300' },
  { slug: 'cdi-4-300bl', model: 'Crown CDi 4|300BL', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=98', checkedAt: '2026-10-01', pageTitle: 'CDi 4|300BL' },
  { slug: 'cdi-4-600', model: 'Crown CDi 4|600', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=1496', checkedAt: '2026-10-01', pageTitle: 'CDi 4|600' },
  { slug: 'cdi-4-600bl', model: 'Crown CDi 4|600BL', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=1494', checkedAt: '2026-10-01', pageTitle: 'CDi 4|600BL' },
  { slug: 'cdi-4-1200', model: 'Crown CDi 4|1200', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=1493', checkedAt: '2026-10-01', pageTitle: 'CDi 4|1200' },
  { slug: 'cdi-4-1200bl', model: 'Crown CDi 4|1200BL', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=1492', checkedAt: '2026-10-01', pageTitle: 'CDi 4|1200BL' },
  { slug: 'dci-2-300', model: 'Crown DCi 2|300', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=71', checkedAt: '2026-10-01', pageTitle: 'DCi 2|300' },
  { slug: 'dci-2-300n', model: 'Crown DCi 2|300N', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=105', checkedAt: '2026-10-01', pageTitle: 'DCi 2|300N' },
  { slug: 'dci-2-600', model: 'Crown DCi 2|600', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=72', checkedAt: '2026-10-01', pageTitle: 'DCi 2|600' },
  { slug: 'dci-2-600n', model: 'Crown DCi 2|600N', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=106', checkedAt: '2026-10-01', pageTitle: 'DCi 2|600N' },
  { slug: 'dci-4-300', model: 'Crown DCi 4|300', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=74', checkedAt: '2026-10-01', pageTitle: 'DCi 4|300' },
  { slug: 'dci-4-300n', model: 'Crown DCi 4|300N', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=111', checkedAt: '2026-10-01', pageTitle: 'DCi 4|300N' },
  { slug: 'dci-4-600', model: 'Crown DCi 4|600', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=75', checkedAt: '2026-10-01', pageTitle: 'DCi 4|600' },
  { slug: 'dci-4-600n', model: 'Crown DCi 4|600N', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=112', checkedAt: '2026-10-01', pageTitle: 'DCi 4|600N' },
  { slug: 'i-tech-4x3500hd', model: 'Crown I-Tech 4x3500HD', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=124', checkedAt: '2026-10-01', pageTitle: 'I-Tech 4x3500HD' },
  { slug: 'ac18-26', model: 'AC18/26', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=155', checkedAt: '2026-10-01', pageTitle: 'AC18/26' },
  { slug: 'ac18-95', model: 'AC18/95', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2557', checkedAt: '2026-10-01', pageTitle: 'AC18/95' },
  { slug: 'control-23-1', model: 'Control 23-1', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=641', checkedAt: '2026-10-01', pageTitle: 'CONTROL 23-1' },
  { slug: 'control-25-1', model: 'Control 25-1', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=650', checkedAt: '2026-10-01', pageTitle: 'Control 25-1' },
  { slug: 'control-28-1', model: 'Control 28-1', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=656', checkedAt: '2026-10-01', pageTitle: 'Control 28-1' },
  { slug: 'control-412ct', model: 'Control 412C/T', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2728', checkedAt: '2026-10-01', pageTitle: 'Control 412C/T' },
  { slug: 'control-414ct', model: 'Control 414C/T', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2730', checkedAt: '2026-10-01', pageTitle: 'Control 414C/T' },
  { slug: 'control-416ct', model: 'Control 416C/T', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2732', checkedAt: '2026-10-01', pageTitle: 'Control 416C/T' },
  { slug: 'control-418ct', model: 'Control 418C/T', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2734', checkedAt: '2026-10-01', pageTitle: 'Control 418C/T' },
  { slug: 'control-419cst', model: 'Control 419CS/T', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2686', checkedAt: '2026-10-01', pageTitle: 'Control 419CS/T' },
  { slug: 'control-424ct', model: 'Control 424C/T', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2680', checkedAt: '2026-10-01', pageTitle: 'Control 424C/T' },
  { slug: 'control-424lp', model: 'Control 424LP', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2681', checkedAt: '2026-10-01', pageTitle: 'Control 424LP' },
  { slug: 'control-426ct', model: 'Control 426C/T', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2682', checkedAt: '2026-10-01', pageTitle: 'Control 426C/T' },
  { slug: 'control-426lp', model: 'Control 426LP', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2683', checkedAt: '2026-10-01', pageTitle: 'Control 426LP' },
  { slug: 'control-440cst', model: 'Control 440CS/T', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2742', checkedAt: '2026-10-01', pageTitle: 'Control 440CS/T' },
  { slug: 'control-447ct', model: 'Control 447C/T', distributor: '테크데이타피에스', url: 'https://techdata-ps.com/m21_view.php?idx=2739', checkedAt: '2026-10-01', pageTitle: 'Control 447C/T' }
]);

const harmanManufacturers = new Set(HARMAN_MANUFACTURERS);
const linksBySlug = new Map(distributorLinks.map(item => [item.slug, item]));

export function isHarmanManufacturer(manufacturer) {
  return harmanManufacturers.has(manufacturer);
}

export function distributorLinkFor(slug, manufacturer) {
  if (!isHarmanManufacturer(manufacturer)) return null;
  return linksBySlug.get(slug) ?? null;
}
