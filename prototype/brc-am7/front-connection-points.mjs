// Optional installation-position guide, measured against each model's own Main image.
import { frontConnectionPointMaps } from './front-connection-points-data.mjs';
const dimensions = value => {
  const match = /^(\d+)x(\d+)$/.exec(value ?? '');
  return match ? [Number(match[1]), Number(match[2])] : null;
};

export function frontConnectionPointsFor(product) {
  const map = frontConnectionPointMaps[product.model];
  return validFrontConnectionPoints(map, product) ? map : null;
}

export function validFrontConnectionPoints(map, product) {
  const main = product.images?.find(image => image.role === 'Main');
  const measured = map?.measuredImage;
  const size = dimensions(main?.resolution);
  if (!map || !main || !size || !measured || measured.file !== main.file ||
      measured.width !== size[0] || measured.height !== size[1] ||
      !/^https:\/\/www\.samsung\.com\/sec\//.test(map.sourceUrl ?? '') ||
      !map.sourceUrl.endsWith(`/${product.model}/`) ||
      !Array.isArray(map.items) || map.items.length !== 2 ||
      map.items.map(item => item.label).join('|') !== '전원|신호 단자') return false;
  for (const item of map.items) {
    if (![item.x1, item.y1, item.x2, item.y2].every(Number.isFinite) ||
        item.x1 < 0 || item.y1 < 0 || item.x2 <= item.x1 || item.y2 <= item.y1 ||
        item.x2 > measured.width || item.y2 > measured.height) return false;
  }
  return true;
}

export function frontPointPercent(item, measuredImage) {
  return {
    left: item.x1 / measuredImage.width * 100,
    top: item.y1 / measuredImage.height * 100,
    right: item.x2 / measuredImage.width * 100,
    bottom: item.y2 / measuredImage.height * 100,
  };
}
