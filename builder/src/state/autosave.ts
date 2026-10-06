// 브라우저 자동 저장. 같은 출처(seoulav.github.io)의 다른 앱과 겹치지 않게 접두어를 둔다.
import { validateDiagram, type Diagram, type LibraryIndex } from '../engine';
import type { BuilderStore } from './store';

export const AUTOSAVE_KEY = 'av-portal-builder:current';
// 불러오지 못한 자동 저장본. 다음 편집의 자동 저장이 덮어쓰기 전에 여기로 옮겨 둔다
export const REJECTED_KEY = 'av-portal-builder:rejected';

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

// 저장된 구성도를 읽는다. 검증 오류가 있으면 불러오지 않고, 원문을 REJECTED_KEY에 보관한 뒤 이유를 돌려준다
export function loadSaved(storage: StorageLike, library: LibraryIndex | null): { diagram?: Diagram; error?: string } {
  const text = storage.getItem(AUTOSAVE_KEY);
  if (!text) return {};
  const reject = (reason: string) => {
    try {
      storage.setItem(REJECTED_KEY, text);
      return { error: `${reason} 원문은 브라우저 저장소의 ${REJECTED_KEY}에 보관했습니다.` };
    } catch {
      return { error: `${reason} 원문을 따로 보관하지 못했습니다. 다음 편집 때 자동 저장이 덮어씁니다.` };
    }
  };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return reject('저장된 작업을 읽을 수 없어 불러오지 않았습니다(JSON 형식 아님).');
  }
  const { errors } = validateDiagram(parsed, { library });
  if (errors.length) {
    const [first] = errors;
    return reject(`저장된 작업에 오류가 있어 불러오지 않았습니다: ${first.detail ?? first.code}${errors.length > 1 ? ` 외 ${errors.length - 1}건` : ''}.`);
  }
  return { diagram: parsed as Diagram };
}

// 구성도가 바뀔 때마다(조금 기다렸다가) 1.2 형식으로 저장한다. 해제 함수를 돌려준다
export function startAutosave(store: BuilderStore, storage: StorageLike, delay = 400): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = store.subscribe((state, previous) => {
    if (state.diagram === previous.diagram) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      try {
        storage.setItem(AUTOSAVE_KEY, store.getState().exportText());
      } catch (error) {
        store.getState().notify({ text: `자동 저장에 실패했습니다: ${(error as Error).message}`, tone: 'error' });
      }
    }, delay);
  });
  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
