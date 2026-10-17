/**
 * 회의실 타입으로 시작 — 세 번째 입구 (B-20261016-07 2단계).
 *
 * 회의실 견적 샘플 39종에서 뽑은 타입 템플릿(`room-templates.json`)을
 * 타입별로 묶어 보여주고, 고르면 그 품목·수량으로 견적을 만든다. 변환은
 * `roomTemplateToQuote`가 한다 — 단가는 공개 단가에서 붙고, 단가표에 없는
 * 품목은 '단가표 미등록'으로 막는다(지어내지 않는다).
 */
import { useState } from 'react';
import type { Catalog } from '../../data/catalog/load';
import { defaultHeader } from '../../app/defaultHeader';
import type { LoadedDocument } from '../../app/workspace';
import type { RoomTemplate, RoomTemplatesFile } from '../../import/room/templates';
import { roomTemplateToQuote, unresolvedItemCounts } from '../../import/room/toQuote';

function itemCount(template: RoomTemplate): number {
  return template.systems.reduce((sum, system) => sum + system.items.length, 0);
}

/** 집계표 순서를 지키며 타입 이름으로 묶는다. */
function groupByType(templates: readonly RoomTemplate[]): Array<{ typeName: string; variants: RoomTemplate[] }> {
  const groups: Array<{ typeName: string; variants: RoomTemplate[] }> = [];
  for (const template of templates) {
    const last = groups[groups.length - 1];
    if (last !== undefined && last.typeName === template.typeName) last.variants.push(template);
    else groups.push({ typeName: template.typeName, variants: [template] });
  }
  return groups;
}

export function RoomTemplatePicker({
  templates,
  catalog,
  onLoaded,
  onClose,
}: {
  templates: RoomTemplatesFile;
  catalog: Catalog;
  onLoaded(input: LoadedDocument): boolean;
  onClose(): void;
}) {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const selected = templates.templates.find((t) => t.id === selectedId);

  function start(template: RoomTemplate): void {
    const result = roomTemplateToQuote(template, catalog, defaultHeader(`ROOM-${template.id}-${Date.now()}`));
    onLoaded({ document: result.document, importWarnings: result.warnings });
  }

  return (
    <div className="q-card q-room-picker">
      <h3>회의실 타입으로 시작</h3>
      <p className="q-muted">
        회의실 견적 샘플 {templates.templates.length}종의 품목·수량으로 견적을 시작합니다. 단가는 단가표에서
        붙고, 단가표에 없는 품목은 <strong>단가표 미등록</strong>으로 표시합니다 — 값을 지어내지 않습니다.
      </p>
      {groupByType(templates.templates).map((group) => (
        <section key={group.typeName} aria-label={`회의실 타입 ${group.typeName}`}>
          <h4>{group.typeName}</h4>
          <ul className="q-room-variants">
            {group.variants.map((template) => {
              const { unregistered, ambiguous } = unresolvedItemCounts(template);
              return (
                <li key={template.id}>
                  <label className="q-room-variant">
                    <input
                      type="radio"
                      name="room-template"
                      value={template.id}
                      checked={selectedId === template.id}
                      onChange={() => setSelectedId(template.id)}
                    />
                    <span>
                      <strong>{template.id}</strong>
                      <span className="q-muted">
                        {' '}
                        품목 {itemCount(template)}건
                        {unregistered > 0 && ` · 단가표 미등록 ${unregistered}건`}
                        {ambiguous > 0 && ` · 대응 모호(확인 필요) ${ambiguous}건`}
                        {template.sheetTitle !== undefined && template.sheetTitle !== template.typeName && (
                          <> · 샘플 시트 이름 '{template.sheetTitle}' (집계표와 다름 — 확인 필요)</>
                        )}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <div className="q-room-picker-actions">
        <button
          type="button"
          className="q-button q-primary"
          disabled={selected === undefined}
          onClick={() => selected !== undefined && start(selected)}
        >
          이 구성으로 견적 만들기
        </button>
        <button type="button" className="q-button" onClick={onClose}>
          회의실 타입 닫기
        </button>
      </div>
    </div>
  );
}
