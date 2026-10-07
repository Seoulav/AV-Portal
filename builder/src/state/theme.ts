// 화면 테마(구 Builder index.css의 data-theme). 브라우저에만 남기고 구성도 파일에는 넣지 않는다.
// 처음은 밝은 테마다(결정 L-a). 첫 화면이 깜빡이지 않게 그리기 전에 읽어 <html data-theme>에 단다
import type { BuilderStore } from './store';

export type Theme = 'light' | 'dark';
export const THEME_KEY = 'av-portal-builder:theme';

interface ThemeStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }

export function loadTheme(storage: ThemeStorage | null): Theme {
  try {
    return storage?.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

// 저장소의 theme을 <html>과 브라우저 저장에 맞춘다. 돌려주는 함수로 구독을 끝낸다
export function startTheme(store: BuilderStore, storage: ThemeStorage | null, root: HTMLElement) {
  const apply = (theme: Theme) => {
    root.dataset.theme = theme;
    try { storage?.setItem(THEME_KEY, theme); } catch { /* 저장이 막힌 브라우저에서도 화면은 바꾼다 */ }
  };
  store.setState({ theme: loadTheme(storage) });
  root.dataset.theme = store.getState().theme;
  return store.subscribe((state, previous) => { if (state.theme !== previous.theme) apply(state.theme); });
}
