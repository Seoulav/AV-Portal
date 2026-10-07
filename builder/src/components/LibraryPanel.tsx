// 장비 목록. Portal 라이브러리를 분류별로 묶고 검색한다. 끌어다 놓거나 + 버튼으로 캔버스에 넣는다.
import { useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { LibraryProduct, LibraryUnit } from '../engine';
import { freePosition } from '../state/store';
import { builderStore, useBuilder } from '../state/useBuilder';

export const UNIT_MIME = 'application/x-av-portal-unit';

const CATEGORY_LABEL: Record<string, string> = { Audio: '오디오', Video: '영상', Display: '디스플레이', Conferencing: '회의·협업', Control: '제어', Network: '네트워크' };
const normalize = (text: string) => text.toLowerCase().replace(/[\s\-_/·]+/g, '');

// 검색: 브랜드·제품명·모델·분류. 공백으로 나눈 낱말이 모두 들어 있어야 한다
export function filterProducts(products: LibraryProduct[], query: string): LibraryProduct[] {
  const words = query.trim().split(/\s+/).filter(Boolean).map(normalize);
  return products.filter(product => {
    if (!product.placeable) return false;
    if (!words.length) return true;
    const haystack = normalize([product.brand, product.product, ...product.categories, ...product.units.map(unit => unit.equipment.model)].join(' '));
    return words.every(word => haystack.includes(word));
  });
}

export function groupProducts(products: LibraryProduct[]): [string, LibraryProduct[]][] {
  const groups = new Map<string, LibraryProduct[]>();
  for (const product of products) {
    const key = product.categories[1] ?? '기타';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(product);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, list]) => [key, list.sort((a, b) => `${a.brand} ${a.product}`.localeCompare(`${b.brand} ${b.product}`))]);
}

const unitLabel = (product: LibraryProduct, unit: LibraryUnit) => (product.units.length > 1 ? unit.equipment.model : product.product);

function UnitItem({ product, unit }: { product: LibraryProduct; unit: LibraryUnit }) {
  const addEquipment = useBuilder(state => state.addEquipment);
  const flow = useReactFlow();
  const ports = unit.equipment.inputs.length + unit.equipment.outputs.length + unit.equipment.bidirectional.length;
  const addAtCenter = () => {
    const bounds = document.querySelector('.canvas')?.getBoundingClientRect();
    const point = bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 3 } : { x: 400, y: 200 };
    addEquipment(unit.equipment, freePosition(builderStore.getState().diagram.nodes, flow.screenToFlowPosition(point)));
  };
  return (
    <li
      className="unit-item"
      draggable
      onDragStart={event => { event.dataTransfer.setData(UNIT_MIME, unit.unitId); event.dataTransfer.effectAllowed = 'copy'; }}
      title={`${product.brand} ${unit.equipment.model} · 단자 ${ports}개`}
    >
      <span className="unit-name">{unitLabel(product, unit)}{unit.unit && <span className="node-tag">{unit.unit.toUpperCase()}</span>}</span>
      {ports === 0 && <span className="lib-badge muted">단자 없음</span>}
      {ports > 0 && product.readiness.unresolvedRows > 0 && <span className="lib-badge" title="Portal에서 확인 중인 I/O 행이 있습니다">확인 {product.readiness.unresolvedRows}</span>}
      <button type="button" className="icon-button" onClick={addAtCenter} aria-label={`${unit.equipment.model} 추가`}>＋</button>
    </li>
  );
}

export function LibraryPanel() {
  const library = useBuilder(state => state.library);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const groups = useMemo(() => groupProducts(filterProducts(library?.library.products ?? [], query)), [library, query]);
  const searching = query.trim().length > 0;
  return (
    <aside className="library-panel">
      <div className="panel-title">장비 라이브러리</div>
      <input className="search" type="search" placeholder="브랜드·모델·분류 검색" value={query} onChange={event => setQuery(event.target.value)} />
      {!library && <div className="panel-note">라이브러리를 불러오는 중입니다…</div>}
      {library && groups.length === 0 && <div className="panel-note">검색 결과가 없습니다.</div>}
      <div className="library-groups">
        {groups.map(([category, products]) => {
          const expanded = searching || open[category];
          return (
            <section key={category} className="library-group">
              <button type="button" className="group-title" onClick={() => setOpen({ ...open, [category]: !open[category] })}>
                <span>{expanded ? '▾' : '▸'} {CATEGORY_LABEL[category] ?? category}</span>
                <span className="group-count">{products.length}</span>
              </button>
              {expanded && products.map(product => (
                <div key={product.productId} className="library-product">
                  <div className="product-brand">{product.brand} <span className="product-kind">{product.categories[2]}</span></div>
                  <ul>{product.units.map(unit => <UnitItem key={unit.unitId} product={product} unit={unit} />)}</ul>
                </div>
              ))}
            </section>
          );
        })}
      </div>
      {library && <div className="panel-foot">Portal 제품 {library.library.products.length}종 · 어휘 {library.source.vocabularyVersion}</div>}
    </aside>
  );
}
