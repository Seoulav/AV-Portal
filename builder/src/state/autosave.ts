// 브라우저 자동 저장. 같은 출처(seoulav.github.io)의 다른 앱과 겹치지 않게 접두어를 둔다.
import { validateDiagram, type Diagram, type LibraryIndex } from '../engine';
import type { BuilderStore } from './store';

export const AUTOSAVE_KEY = 'av-portal-builder:current';

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

// 저장된 구성도를 읽는다. 검증 오류가 있으면 불러오지 않고 이유를 돌려준다
export function loadSaved(storage: StorageLike, library: LibraryIndex | null): { diagram?: Diagram; error?: string } {
  const text = storage.getItem(AUTOSAVE_KEY);
  if (!text) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: '저장된 작업을 읽을 수 없습니다(JSON 형식 아님).' };
  }
  const { errors } = validateDiagram(parsed, { library });
  if (errors.length) return { error: `저장된 작업에 오류가 있어 불러오지 않았습니다: ${errors.slice(0, 3).map(error => error.code).join(', ')}` };
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
