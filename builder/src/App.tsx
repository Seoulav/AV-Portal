import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { createLibraryIndex, type Library } from './engine';
import { loadSaved, startAutosave } from './state/autosave';
import { builderStore, useBuilder } from './state/useBuilder';
import { Canvas } from './components/Canvas';
import { EdgePanel } from './components/EdgePanel';
import { IssuesPanel } from './components/IssuesPanel';
import { LibraryPanel } from './components/LibraryPanel';
import { NotePanel } from './components/NotePanel';
import { Toolbar } from './components/Toolbar';
import { lineFilter } from './lineFilter';

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

// 오른쪽 패널: 연결을 하나만 골랐으면 연결 편집, 아니면 이슈 목록(결정 H-a).
// 선 종류 필터로 숨긴 장비의 선택은 세지 않는다(보이지 않는 선택이 패널을 막지 않게)
function SidePanel() {
  const edgeId = useBuilder(state => {
    if (state.selectedEdgeIds.length !== 1) return null;
    const hidden = lineFilter(state.diagram, state.hiddenLineTypes).hiddenNodes;
    return state.diagram.nodes.some(node => node.selected && !hidden.has(node.id)) ? null : state.selectedEdgeIds[0];
  });
  // 메모·영역 하나만 골랐으면 서식 편집(B-20261006-09, 결정 L-b)
  const noteId = useBuilder(state => {
    if (state.selectedEdgeIds.length) return null;
    const selected = state.diagram.nodes.filter(node => node.selected);
    return selected.length === 1 && selected[0].type !== 'equipment' ? selected[0].id : null;
  });
  if (edgeId) return <EdgePanel edgeId={edgeId} />;
  return noteId ? <NotePanel key={noteId} nodeId={noteId} /> : <IssuesPanel />;
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
          <SidePanel />
        </div>
        <Notice />
      </div>
    </ReactFlowProvider>
  );
}
