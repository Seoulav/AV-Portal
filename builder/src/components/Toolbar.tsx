// 상단 막대: 새 구성도·열기·내보내기·실행 취소·메모·영역.
import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { freePosition } from '../state/store';
import { useBuilder } from '../state/useBuilder';
import { FIT_VIEW } from './Canvas';

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
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) { event.preventDefault(); state.undo(); }
      if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) { event.preventDefault(); state.redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  const exportFile = () => {
    const blob = new Blob([state.exportText()], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `구성도-${stamp()}.diagram.json`;
    link.click();
    URL.revokeObjectURL(link.href);
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
  const confirmNew = () => {
    if (state.diagram.nodes.length && !window.confirm('지금 구성도를 비우고 새로 시작할까요? 실행 취소로 되돌릴 수 있습니다.')) return;
    state.newDiagram();
  };

  // 라이브러리와 자동 저장본을 읽기 전에는 편집을 막는다. 읽는 중에 만든 내용이 저장본에 덮이지 않게 한다
  const ready = Boolean(state.library);
  const equipmentCount = state.diagram.nodes.filter(node => node.type === 'equipment').length;
  return (
    <header className="toolbar">
      <a className="brand" href="../">AV Portal</a>
      <span className="app-name">AV System Builder <span className="beta">베타</span></span>
      <div className="toolbar-actions">
        <button type="button" onClick={confirmNew} disabled={!ready}>새 구성도</button>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={!ready}>열기</button>
        <button type="button" className="primary" onClick={exportFile} disabled={!ready}>내보내기</button>
        <span className="divider" />
        <button type="button" onClick={state.undo} disabled={!state.past.length} title="Ctrl+Z">실행 취소</button>
        <button type="button" onClick={state.redo} disabled={!state.future.length} title="Ctrl+Y">다시 실행</button>
        <span className="divider" />
        <button type="button" onClick={() => state.addAnnotation(center())} disabled={!ready}>메모</button>
        <button type="button" onClick={() => state.addShape(center())} disabled={!ready}>영역</button>
      </div>
      <span className="toolbar-status">장비 {equipmentCount} · 연결 {state.diagram.edges.length}</span>
      <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={event => { void openFile(event.target.files?.[0]); event.target.value = ''; }} />
    </header>
  );
}
