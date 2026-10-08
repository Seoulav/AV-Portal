// 상단 막대: 새 구성도·열기·내보내기(JSON·SVG·PDF)·실행 취소·메모·영역·케이블 보기, 편집 도구(오토 레이아웃·잠금·격자·미니맵).
// 단축키: Ctrl+Z·Y 실행 취소·다시 실행, Ctrl+C·V 복사·붙여넣기(앱 안 클립보드, 구 Builder와 같다).
import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { version as APP_VERSION } from '../../package.json';
import { DEFAULT_RULES } from '../engine';
import { diagramSvg } from '../export/diagramSvg';
import { freePosition } from '../state/store';
import { useBuilder } from '../state/useBuilder';
import { FIT_VIEW, keepFocus } from './Canvas';

// 화면의 글을 캔버스 밖(이슈 패널 등)에서 골라 두었으면 Ctrl+C는 브라우저 복사로 둔다(리뷰 6)
const textSelectedOutsideCanvas = () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString()) return false;
  const anchor = selection.anchorNode;
  const element = anchor instanceof Element ? anchor : anchor?.parentElement;
  return !element?.closest('.react-flow');
};

const stamp = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};

export function Toolbar() {
  const fileInput = useRef<HTMLInputElement>(null);
  const flow = useReactFlow();
  const state = useBuilder(s => s);
  const center = () => {
    const bounds = document.querySelector('.canvas')?.getBoundingClientRect();
    return freePosition(state.diagram.nodes, flow.screenToFlowPosition(bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 } : { x: 400, y: 300 }));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) { event.preventDefault(); state.undo(); }
      if (key === 'y' || (key === 'z' && event.shiftKey)) { event.preventDefault(); state.redo(); }
      if (key === 'c' && !textSelectedOutsideCanvas() && state.copySelection()) event.preventDefault();
      if (key === 'v' && state.clipboard) { event.preventDefault(); state.paste(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  const download = (blob: Blob, name: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const exportFile = () => download(new Blob([state.exportText()], { type: 'application/json' }), `구성도-${stamp()}.diagram.json`);
  // 도면(B-20261006-10): 구성도 데이터로 그린 SVG. 화면 상태와 무관하다. 단자 색은 라이브러리 선 종류를 먼저 쓴다
  const drawing = () => {
    const lineTypes = [...state.diagram.lineTypes, ...(state.library?.rules ?? DEFAULT_RULES).lineTypes];
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return diagramSvg(state.diagram, { lineTypes, stamp: { version: APP_VERSION, date } });
  };
  const exportSvg = () => download(new Blob([drawing().svg], { type: 'image/svg+xml' }), `구성도-${stamp()}.svg`);
  // PDF는 라이브러리·한글 글꼴을 누를 때 불러온다(결정 M-a·M-e)
  const [makingPdf, setMakingPdf] = useState(false);
  const exportPdf = async () => {
    setMakingPdf(true);
    try {
      const { diagramPdf } = await import('../export/diagramPdf');
      download(await diagramPdf(drawing()), `구성도-${stamp()}.pdf`);
    } catch (error) {
      state.notify({ text: `PDF를 만들지 못했습니다: ${(error as Error).message}. 페이지를 새로 고친 뒤 다시 눌러 주세요.`, tone: 'error' });
    } finally {
      setMakingPdf(false);
    }
  };
  const openFile = async (file: File | undefined) => {
    if (!file) return;
    const result = state.importText(await file.text());
    if (result.ok) {
      state.notify({ text: `${file.name}을 열었습니다.`, tone: 'info' });
      setTimeout(() => flow.fitView(FIT_VIEW), 0);
    } else {
      const [first] = result.errors;
      const more = result.errors.length > 1 ? ` 외 ${result.errors.length - 1}건` : '';
      state.notify({ text: `열 수 없습니다: ${first.detail ?? first.code}${first.path ? ` (${first.path})` : ''}${more}`, tone: 'error' });
    }
  };
  // 오토 레이아웃: Dagre(dagre@0.8.5, 결정 K-a)는 누를 때 불러온다. 첫 화면 번들에 넣지 않는다
  const [laying, setLaying] = useState(false);
  const autoLayout = async () => {
    setLaying(true);
    let dagre;
    try {
      ({ default: dagre } = await import('dagre'));
    } catch {
      // 배포가 바뀐 뒤 열려 있던 화면은 예전 파일을 찾는다. 브라우저가 실패를 기억하므로 새로 고쳐야 한다(리뷰 8)
      state.notify({ text: '오토 레이아웃을 불러오지 못했습니다. 페이지를 새로 고친 뒤 다시 눌러 주세요.', tone: 'error' });
      setLaying(false);
      return;
    }
    try {
      if (state.applyLayout(dagre)) requestAnimationFrame(() => void flow.fitView({ ...FIT_VIEW, duration: 300 }));
    } finally {
      setLaying(false);
    }
  };
  const confirmNew = () => {
    if (state.diagram.nodes.length && !window.confirm('지금 구성도를 비우고 새로 시작할까요? 실행 취소로 되돌릴 수 있습니다.')) return;
    state.newDiagram();
  };

  // 라이브러리와 자동 저장본을 읽기 전에는 편집을 막는다. 읽는 중에 만든 내용이 저장본에 덮이지 않게 한다
  const ready = Boolean(state.library);
  const equipmentCount = state.diagram.nodes.filter(node => node.type === 'equipment').length;
  return (
    <header className="toolbar" onMouseDown={keepFocus}>
      <a className="brand" href="../">AV Portal</a>
      <span className="app-name">AV System Builder <span className="beta">베타</span></span>
      <div className="toolbar-actions">
        <button type="button" onClick={confirmNew} disabled={!ready}>새 구성도</button>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={!ready}>열기</button>
        <button type="button" className="primary" onClick={exportFile} disabled={!ready} title="구성도 JSON(1.2) 파일">내보내기</button>
        <button type="button" onClick={exportSvg} disabled={!ready || !state.diagram.nodes.length} title="도면을 벡터 SVG로 받는다">SVG</button>
        <button type="button" onClick={() => void exportPdf()} disabled={!ready || !state.diagram.nodes.length || makingPdf} title="도면을 벡터 PDF로 받는다(한글 글꼴 포함)">{makingPdf ? 'PDF 만드는 중…' : 'PDF'}</button>
        <span className="divider" />
        <button type="button" onClick={state.undo} disabled={!state.past.length} title="Ctrl+Z">실행 취소</button>
        <button type="button" onClick={state.redo} disabled={!state.future.length} title="Ctrl+Y">다시 실행</button>
        <span className="divider" />
        <button type="button" onClick={() => state.addAnnotation(center())} disabled={!ready}>메모</button>
        <button type="button" onClick={() => state.addShape(center())} disabled={!ready}>영역</button>
        <span className="divider" />
        <button type="button" className={state.cableView ? 'active' : ''} aria-pressed={state.cableView} onClick={state.toggleCableView} title="엣지 라벨에 케이블 요약을 보인다(구 Builder BOM 모드)">케이블 보기</button>
        <span className="divider" />
        <button type="button" onClick={() => void autoLayout()} disabled={!ready || laying || equipmentCount === 0} title="신호 흐름을 왼쪽에서 오른쪽으로 놓는다. 실행 취소로 되돌릴 수 있다">오토 레이아웃</button>
        <button type="button" className={state.locked ? 'active lock' : ''} aria-pressed={state.locked} onClick={state.toggleLock} title="장비를 끌어 옮기지 못하게 한다. 연결은 그대로 할 수 있다">잠금</button>
        <button type="button" className={state.snapToGrid ? 'active' : ''} aria-pressed={state.snapToGrid} onClick={state.toggleSnapToGrid} title="장비를 15px 격자에 맞춰 놓는다">격자</button>
        <button type="button" className={state.showMiniMap ? 'active' : ''} aria-pressed={state.showMiniMap} onClick={state.toggleMiniMap} title="오른쪽 아래에 전체 도면을 작게 보인다">미니맵</button>
        <span className="divider" />
        <button type="button" className={state.theme === 'dark' ? 'active' : ''} aria-pressed={state.theme === 'dark'} onClick={state.toggleTheme} title="어두운 화면과 밝은 화면을 바꾼다. 이 브라우저에 남는다">어두운 테마</button>
      </div>
      <span className="toolbar-status">장비 {equipmentCount} · 연결 {state.diagram.edges.length}</span>
      <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={event => { void openFile(event.target.files?.[0]); event.target.value = ''; }} />
    </header>
  );
}
