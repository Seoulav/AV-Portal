import { describe, expect, it } from 'vitest';
import type { NodeChange } from '@xyflow/react';
import { ANNOTATION_DATA_KEYS, SHAPE_DATA_KEYS, createIdFactory, validateDiagram } from '../src/engine';
import { noteDraftToData } from '../src/components/NotePanel';
import { createBuilderStore } from '../src/state/store';
import { THEME_KEY, loadTheme, startTheme } from '../src/state/theme';

const setup = () => {
  const store = createBuilderStore({ ids: createIdFactory({ seed: 4, now: 0 }) });
  store.getState().addAnnotation({ x: 10, y: 20 });
  store.getState().addShape({ x: 300, y: 20 });
  const [note, zone] = store.getState().diagram.nodes;
  const node = (id: string) => store.getState().diagram.nodes.find(item => item.id === id)!;
  return { store, note: note.id, zone: zone.id, node };
};
const exported = (store: ReturnType<typeof setup>['store']) => JSON.parse(store.getState().exportText());

describe('note and zone formatting (old Builder EditAnnotationModal)', () => {
  it('applies only the 1.1 format keys in one undo step and records nothing when nothing changes', () => {
    const { store, note, node } = setup();
    const past = store.getState().past.length;
    expect(store.getState().updateNoteData(note, { label: '랙 앞', fontColor: '#fef08a', bgOpacity: 0.9, made: 'up', shapeType: 'circle' })).toBe(true);
    expect(store.getState().past.length).toBe(past + 1);
    expect(node(note).data).toMatchObject({ label: '랙 앞', fontColor: '#fef08a', bgOpacity: 0.9 });
    // 메모에 없는 키(shapeType)와 모르는 키는 넣지 않는다
    expect(node(note).data).not.toHaveProperty('made');
    expect(node(note).data).not.toHaveProperty('shapeType');
    expect(store.getState().updateNoteData(note, { label: '랙 앞' })).toBe(false);
    expect(store.getState().past.length).toBe(past + 1);
    store.getState().undo();
    expect(node(note).data.label).toBe('New note (Double-click to edit)');
  });

  it('turns panel values into clean format data: numbers clamped, defaults filled, lock off removes the key', () => {
    expect(noteDraftToData('annotation', { label: 'a', fontSize: 999, bgOpacity: -1, borderRadius: Number.NaN, locked: false })).toEqual({
      label: 'a', fontSize: 60, fontColor: '#ffffff', bgColor: '#1e293b', bgOpacity: 0, borderColor: '#38bdf8', borderStyle: 'dashed', locked: undefined, borderRadius: 8, textAlign: 'center',
    });
    const zone = noteDraftToData('shape', { label: 'z', shapeType: 'circle', borderWidth: 0, locked: true });
    expect(zone).toMatchObject({ shapeType: 'circle', borderWidth: 1, locked: true });
    expect(Object.keys(zone).every(key => SHAPE_DATA_KEYS.includes(key))).toBe(true);
    expect(Object.keys(noteDraftToData('annotation', {})).every(key => ANNOTATION_DATA_KEYS.includes(key))).toBe(true);
  });

  it('a formatted and locked note exports cleanly and passes the validator', () => {
    const { store, note, zone } = setup();
    store.getState().updateNoteData(note, noteDraftToData('annotation', { label: '주의', fontSize: 18, locked: true }) as Record<string, unknown>);
    store.getState().updateNoteData(zone, noteDraftToData('shape', { label: '메인 랙', shapeType: 'rounded-rectangle', borderWidth: 4 }) as Record<string, unknown>);
    const file = exported(store);
    expect(validateDiagram(file).errors).toEqual([]);
    const saved = (id: string) => file.nodes.find((item: { id: string }) => item.id === id);
    expect(saved(note).data).toMatchObject({ label: '주의', fontSize: 18, locked: true });
    expect(saved(zone).data).toMatchObject({ label: '메인 랙', shapeType: 'rounded-rectangle', borderWidth: 4 });
    expect(saved(zone).data).not.toHaveProperty('locked');
  });
});

describe('resizing notes and zones (NodeResizer)', () => {
  it('writes the size into style, drops React Flow view fields, and undoes one drag in one step', () => {
    const { store, zone, node } = setup();
    const before = { position: node(zone).position, style: node(zone).style };
    const past = store.getState().past.length;
    const send = (changes: NodeChange[]) => store.getState().onNodesChange(changes);
    // 왼쪽 위 손잡이를 끈 것처럼: 위치와 크기가 함께 바뀌고, 끝에 resizing false가 온다
    send([{ id: zone, type: 'position', position: { x: 290, y: 10 } }, { id: zone, type: 'dimensions', resizing: true, setAttributes: true, dimensions: { width: 360, height: 260 } }]);
    send([{ id: zone, type: 'position', position: { x: 280, y: 0 } }, { id: zone, type: 'dimensions', resizing: true, setAttributes: true, dimensions: { width: 370, height: 270 } }]);
    send([{ id: zone, type: 'dimensions', resizing: false, dimensions: { width: 370, height: 270 } }]);
    expect(store.getState().past.length).toBe(past + 1);
    expect(store.getState().resizing).toBe(false);
    expect(node(zone).style).toEqual({ width: 370, height: 270 });
    expect(node(zone).position).toEqual({ x: 280, y: 0 });
    expect(node(zone)).not.toHaveProperty('width');
    expect(node(zone)).not.toHaveProperty('height');
    expect(node(zone)).not.toHaveProperty('resizing');
    expect(exported(store).nodes.find((item: { id: string }) => item.id === zone).style).toEqual({ width: 370, height: 270 });
    store.getState().undo();
    expect({ position: node(zone).position, style: node(zone).style }).toEqual(before);
  });

  it('measurement updates without a resize gesture are not recorded', () => {
    const { store, note } = setup();
    const past = store.getState().past.length;
    store.getState().onNodesChange([{ id: note, type: 'dimensions', dimensions: { width: 200, height: 60 } }]);
    expect(store.getState().past.length).toBe(past);
  });
});

describe('double-click and theme', () => {
  it('double-click selects only that note and asks the panel to focus its text', () => {
    const { store, note, zone } = setup();
    store.getState().focusTarget({ node: zone });
    store.getState().editNote(note);
    expect(store.getState().diagram.nodes.filter(item => item.selected).map(item => item.id)).toEqual([note]);
    expect(store.getState().noteFocus?.nodeId).toBe(note);
  });

  it('keeps the theme in the browser only: not in the file, not in undo history', () => {
    const { store } = setup();
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    const root = { dataset: {} as Record<string, string> } as unknown as HTMLElement;
    expect(loadTheme(storage)).toBe('light');
    const stop = startTheme(store, storage, root);
    expect(root.dataset.theme).toBe('light');
    const text = store.getState().exportText();
    const past = store.getState().past.length;
    store.getState().toggleTheme();
    expect(root.dataset.theme).toBe('dark');
    expect(data.get(THEME_KEY)).toBe('dark');
    expect(store.getState().exportText()).toBe(text);
    expect(store.getState().past.length).toBe(past);
    stop();
    // 다시 열면 저장한 테마로 시작한다
    const again = createBuilderStore();
    startTheme(again, storage, root);
    expect(again.getState().theme).toBe('dark');
    expect(loadTheme({ getItem: () => { throw new Error('blocked'); }, setItem: () => {} })).toBe('light');
  });
});
