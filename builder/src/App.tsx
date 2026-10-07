import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { createLibraryIndex, type Library } from './engine';
import { loadSaved, startAutosave } from './state/autosave';
import { builderStore, useBuilder } from './state/useBuilder';
import { Canvas } from './components/Canvas';
import { EdgePanel } from './components/EdgePanel';
import { LibraryPanel } from './components/LibraryPanel';
import { Toolbar } from './components/Toolbar';

// 배포에서는 /AV-Portal/builder/ 옆의 /AV-Portal/builder-library.json(Pages가 만든다)
const LIBRARY_URL = new URL('../builder-library.json', document.baseURI).href;

function Notice() {
  const notice = useBuilder(state => state.notice);
  const notify = useBuilder(state => state.notify);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => notify(null), notice.tone === 'error' ? 8000 : 4000);
    return () => clearTimeout(timer);
  }, [notice, notify]);
  if (!notice) return null;
  return <div className={`notice notice-${notice.tone}`} role="status" onClick={() => notify(null)}>{notice.text}</div>;
}

export function App() {
  const libraryReady = useBuilder(state => Boolean(state.library));
  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(LIBRARY_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const library = createLibraryIndex(await response.json() as Library);
        if (cancelled) return;
        const state = builderStore.getState();
        state.setLibrary(library);
        const saved = loadSaved(window.localStorage, library);
        if (saved.diagram) builderStore.setState({ diagram: saved.diagram });
        if (saved.error) state.notify({ text: saved.error, tone: 'error' });
        stop = startAutosave(builderStore, window.localStorage);
      } catch (error) {
        builderStore.getState().notify({ text: `장비 라이브러리를 불러오지 못했습니다: ${(error as Error).message}`, tone: 'error' });
      }
    })();
    return () => { cancelled = true; stop?.(); };
  }, []);
  return (
    <ReactFlowProvider>
      <div className="app">
        <Toolbar />
        <div className="workspace">
          <LibraryPanel />
          {libraryReady ? <Canvas /> : <div className="canvas canvas-loading">장비 라이브러리를 불러오는 중입니다…</div>}
          <EdgePanel />
        </div>
        <Notice />
      </div>
    </ReactFlowProvider>
  );
}
