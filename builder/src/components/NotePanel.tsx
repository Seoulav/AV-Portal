// 고른 메모·영역의 서식 편집(구 Builder EditAnnotationModal, 2fd568e). 구는 가운데 창이었고 여기서는 오른쪽 패널이다(결정 L-b).
// 색 프리셋·빠른 서식은 구 값 그대로다(결정 L-c). "적용"을 누를 때 한 번의 실행 취소 단위로 반영한다.
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useBuilder } from '../state/useBuilder';
import { ANNOTATION_DEFAULTS, SHAPE_DEFAULTS, type NoteData } from './NoteNodes';

export const BG_PRESETS = [
  ['투명', 'transparent'], ['짙은 슬레이트', '#1e293b'], ['밤하늘', '#0f172a'], ['강철 회색', '#334155'], ['따뜻한 호박', '#78350f'],
  ['숲 초록', '#064e3b'], ['남색', '#1e3a8a'], ['버건디', '#5c0606'], ['보라', '#4c1d95'], ['스티키 노랑', '#4d4615'],
] as const;
export const BORDER_PRESETS = [
  ['슬레이트 회색', '#475569'], ['하늘', '#38bdf8'], ['에메랄드', '#10b981'], ['호박', '#f59e0b'], ['빨강', '#ef4444'], ['흰색', '#ffffff'], ['없음', 'transparent'],
] as const;
export const QUICK_TEMPLATES: { name: string; style: Partial<NoteData> }[] = [
  { name: '📌 노란 메모', style: { bgColor: '#4d4615', bgOpacity: 0.9, fontColor: '#fef08a', borderColor: '#ca8a04', borderStyle: 'solid', borderRadius: 4 } },
  { name: 'ℹ️ 정보', style: { bgColor: '#1e3a8a', bgOpacity: 0.8, fontColor: '#93c5fd', borderColor: '#3b82f6', borderStyle: 'solid', borderRadius: 8 } },
  { name: '⚠️ 경고', style: { bgColor: '#5c0606', bgOpacity: 0.85, fontColor: '#fca5a5', borderColor: '#ef4444', borderStyle: 'dashed', borderRadius: 8 } },
  { name: '📄 깔끔한 카드', style: { bgColor: '#0f172a', bgOpacity: 0.95, fontColor: '#f8fafc', borderColor: '#334155', borderStyle: 'solid', borderRadius: 8 } },
];
const BORDER_STYLES = [['none', '없음'], ['solid', '실선'], ['dashed', '점선'], ['dotted', '점점선']] as const;
const ALIGNS = [['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']] as const;
const SHAPES = [['rectangle', '사각형'], ['rounded-rectangle', '둥근 사각형'], ['circle', '원']] as const;

// 숫자 칸: 범위 밖이나 빈 값은 범위 안으로 맞춘다(파일에 NaN이 들어가지 않게)
const clamp = (value: number, min: number, max: number, fallback: number) => (Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback);
const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

// 패널에서 고친 값을 저장할 서식 값으로 바꾼다(메모·영역마다 쓰는 키만)
export function noteDraftToData(type: 'annotation' | 'shape', draft: NoteData): Partial<NoteData> {
  const defaults = type === 'annotation' ? ANNOTATION_DEFAULTS : SHAPE_DEFAULTS;
  const common: Partial<NoteData> = {
    label: draft.label ?? '',
    fontSize: clamp(Number(draft.fontSize), 10, 60, defaults.fontSize),
    fontColor: draft.fontColor || defaults.fontColor,
    bgColor: draft.bgColor || defaults.bgColor,
    bgOpacity: clamp(Number(draft.bgOpacity), 0, 1, defaults.bgOpacity),
    borderColor: draft.borderColor || defaults.borderColor,
    borderStyle: draft.borderStyle || defaults.borderStyle,
    locked: draft.locked ? true : undefined,
  };
  if (type === 'annotation') return { ...common, borderRadius: clamp(Number(draft.borderRadius), 0, 30, ANNOTATION_DEFAULTS.borderRadius), textAlign: draft.textAlign ?? ANNOTATION_DEFAULTS.textAlign };
  return { ...common, shapeType: draft.shapeType ?? SHAPE_DEFAULTS.shapeType, borderWidth: clamp(Number(draft.borderWidth), 1, 10, SHAPE_DEFAULTS.borderWidth) };
}

function ColorField({ label, value, presets, onChange }: { label: string; value: string; presets: readonly (readonly [string, string])[]; onChange: (value: string) => void }) {
  return (
    <div className="field">
      {label}
      <div className="swatches">
        {presets.map(([name, color]) => (
          <button key={color} type="button" className={`swatch${value === color ? ' on' : ''}${color === 'transparent' ? ' clear' : ''}`} style={{ background: color }} title={name} aria-label={`${label} ${name}`} onClick={() => onChange(color)} />
        ))}
      </div>
      <div className="color-row">
        <input type="color" value={isHex(value) ? value : '#ffffff'} onChange={event => onChange(event.target.value)} aria-label={`${label} 직접 고르기`} />
        <input value={value} onChange={event => onChange(event.target.value)} aria-label={`${label} 값`} />
      </div>
    </div>
  );
}

export function NotePanel({ nodeId }: { nodeId: string }) {
  const node = useBuilder(state => state.diagram.nodes.find(item => item.id === nodeId) ?? null);
  const updateNoteData = useBuilder(state => state.updateNoteData);
  const removeElements = useBuilder(state => state.removeElements);
  const notify = useBuilder(state => state.notify);
  const focusRequest = useBuilder(state => state.noteFocus);
  const focusTarget = useBuilder(state => state.focusTarget);
  const [draft, setDraft] = useState<NoteData>({});
  const text = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const type = node?.type === 'shape' ? 'shape' : 'annotation';
  // 다른 메모를 고르거나 적용·실행 취소로 값이 바뀌면 입력란을 다시 채운다
  useEffect(() => {
    if (!node) return;
    setDraft({ ...(type === 'annotation' ? ANNOTATION_DEFAULTS : SHAPE_DEFAULTS), ...(node.data as NoteData) });
  }, [node?.id, node?.data, type]);
  // 두 번 누르면 글 칸으로 초점을 옮긴다
  useEffect(() => {
    if (focusRequest?.nodeId === nodeId) { text.current?.focus(); text.current?.select(); }
  }, [focusRequest, nodeId]);
  if (!node || node.type === 'equipment') return null;
  const set = (patch: Partial<NoteData>) => setDraft({ ...draft, ...patch });
  const value = (key: keyof NoteData) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set({ [key]: event.target.value } as Partial<NoteData>);
  const apply = () => {
    if (updateNoteData(node.id, noteDraftToData(type, draft) as Record<string, unknown>)) notify({ text: '서식을 적용했습니다.', tone: 'info' });
  };
  // 닫으면 선택을 풀어 이슈 목록으로 돌아간다
  const close = () => focusTarget({});
  return (
    <aside className="side-panel note-panel">
      <div className="panel-head">
        <span className="panel-title">{type === 'annotation' ? '메모 서식' : '영역 서식'}</span>
        <button type="button" className="icon-button" onClick={close} aria-label="서식 편집 닫기" title="닫고 이슈 목록 보기">✕</button>
      </div>
      <label className="field">{type === 'annotation' ? '메모 내용' : '영역 이름'}
        {type === 'annotation'
          ? <textarea ref={text} rows={3} value={draft.label ?? ''} onChange={value('label')} />
          : <input ref={text} value={draft.label ?? ''} onChange={value('label')} placeholder="예: 메인 랙" />}
      </label>
      {type === 'annotation' && (
        <div className="field">빠른 서식
          <div className="chip-row">{QUICK_TEMPLATES.map(template => <button key={template.name} type="button" onClick={() => set(template.style)}>{template.name}</button>)}</div>
        </div>
      )}
      {type === 'shape' && (
        <label className="field">모양
          <select value={draft.shapeType} onChange={value('shapeType')}>{SHAPES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        </label>
      )}
      <div className="field-pair">
        <label className="field">글자 크기(px)<input type="number" min={10} max={60} value={draft.fontSize ?? ''} onChange={value('fontSize')} /></label>
        <label className="field">글자 색
          <div className="color-row">
            <input type="color" value={isHex(draft.fontColor ?? '') ? draft.fontColor : '#ffffff'} onChange={value('fontColor')} aria-label="글자 색 직접 고르기" />
            <input value={draft.fontColor ?? ''} onChange={value('fontColor')} aria-label="글자 색 값" />
          </div>
        </label>
      </div>
      {type === 'annotation' && (
        <div className="field">정렬
          <div className="chip-row">{ALIGNS.map(([id, name]) => <button key={id} type="button" className={draft.textAlign === id ? 'active' : ''} aria-pressed={draft.textAlign === id} onClick={() => set({ textAlign: id })}>{name}</button>)}</div>
        </div>
      )}
      <ColorField label="바탕색" value={draft.bgColor ?? ''} presets={BG_PRESETS} onChange={bgColor => set({ bgColor })} />
      <label className="field">바탕 투명도 {Math.round(Number(draft.bgOpacity ?? 0) * 100)}%<input type="range" min={0} max={1} step={0.05} value={draft.bgOpacity ?? 0} onChange={value('bgOpacity')} /></label>
      <div className="field-pair">
        <label className="field">테두리 모양
          <select value={draft.borderStyle} onChange={value('borderStyle')}>{BORDER_STYLES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        </label>
        {type === 'annotation'
          ? <label className="field">모서리 둥글기(px)<input type="number" min={0} max={30} value={draft.borderRadius ?? ''} onChange={value('borderRadius')} /></label>
          : <label className="field">테두리 굵기(px)<input type="number" min={1} max={10} value={draft.borderWidth ?? ''} onChange={value('borderWidth')} /></label>}
      </div>
      <ColorField label="테두리 색" value={draft.borderColor ?? ''} presets={BORDER_PRESETS} onChange={borderColor => set({ borderColor })} />
      <label className="check"><input type="checkbox" checked={Boolean(draft.locked)} onChange={event => set({ locked: event.target.checked })} />고정(끌기·크기 바꾸기 막기)</label>
      <div className="panel-actions">
        <button type="button" className="primary" onClick={apply}>적용</button>
      </div>
      <button type="button" className="danger" onClick={() => removeElements([node.id], [])}>{type === 'annotation' ? '메모 삭제' : '영역 삭제'}</button>
    </aside>
  );
}
