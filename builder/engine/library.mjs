// builder-library.json을 읽어 배치 단위·제품 색인을 만든다.
import { rulesFromLibrary } from './defaults.mjs';

export const LIBRARY_SCHEMA = 'av-portal.builder-library';

export function createLibraryIndex(library) {
  if (!library || library.schema !== LIBRARY_SCHEMA) throw new Error(`라이브러리 schema가 ${LIBRARY_SCHEMA}가 아니다`);
  const units = new Map();
  const products = new Map();
  for (const product of library.products) {
    products.set(product.productId, product);
    for (const unit of product.units) units.set(unit.unitId, { product, unit, equipment: unit.equipment });
  }
  return Object.freeze({
    library,
    schemaVersion: library.schemaVersion,
    source: library.source,
    units,
    products,
    rules: rulesFromLibrary(library),
  });
}

// 배치 단위 ID로 장비 객체(1.1 Equipment 모양)를 찾는다
export function unitEquipment(index, unitId) {
  const entry = index.units.get(unitId);
  if (!entry) throw new Error(`라이브러리에 없는 배치 단위: ${unitId}`);
  return entry.equipment;
}

export const equipmentPorts = data => [...(data.inputs ?? []), ...(data.outputs ?? []), ...(data.bidirectional ?? [])];
export const findPort = (data, portId) => equipmentPorts(data).find(port => port.id === portId) ?? null;
