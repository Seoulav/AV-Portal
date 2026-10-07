// 이슈 패널(B-20261006-05 결정 H-a). 연결을 하나 고르지 않았을 때 오른쪽에 보인다.
// 목록은 내보내기와 같은 normalizeDiagram으로 계산해 내보낸 파일의 issues와 같다. 누르면 대상 장비·연결을 고르고 화면을 옮긴다.
import { useMemo, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { normalizeDiagram, type Diagram, type Equipment, type Issue } from '../engine';
import { useBuilder } from '../state/useBuilder';

// 기반명세 §8.5의 이슈 코드
export const ISSUE_LABELS: Record<string, string> = {
  'connector-adapter': '커넥터 변환 필요',
  'connector-unknown': '커넥터를 알 수 없음',
  'signal-level': '신호 레벨이 다름',
  'unverified-port': '확인 중인 단자에 연결',
  'cable-unspecified': '케이블 미지정',
  'no-ports': '단자 정보 없는 장비',
  'series-config-pending': '시리즈 구성 미정',
  'product-removed': 'Portal에서 빠진 장비',
  'library-drift': 'Portal 정보가 바뀐 장비',
};
const SEVERITIES: [Issue['severity'], string][] = [['warning', '주의'], ['info', '안내']];

// 이슈는 장비 정보와 엣지에서만 나온다. 위치·선택만 바뀐 구성도(끌기 중 매 순간)는 앞의 구성도를 그대로 돌려줘 다시 계산하지 않는다
function useIssueInput(diagram: Diagram): Diagram {
  const last = useRef<Diagram | null>(null);
  const previous = last.current;
  const same = previous !== null && previous.edges === diagram.edges && previous.nodes.length === diagram.nodes.length
    && previous.nodes.every((node, i) => node.id === diagram.nodes[i].id && node.type === diagram.nodes[i].type && node.data === diagram.nodes[i].data);
  if (!same) last.current = diagram;
  return last.current!;
}

export function IssuesPanel() {
  const diagram = useBuilder(state => state.diagram);
  const library = useBuilder(state => state.library);
  const focusTarget = useBuilder(state => state.focusTarget);
  const flow = useReactFlow();
  const input = useIssueInput(diagram);
  const issues = useMemo(() => normalizeDiagram(input, { library }).issues ?? [], [input, library]);

  const modelOf = (nodeId: string | undefined) => {
    const node = diagram.nodes.find(item => item.id === nodeId);
    return node ? (node.data as unknown as Equipment).model : '?';
  };
  const describe = (issue: Issue) => {
    if (issue.target.edge) {
      const edge = diagram.edges.find(item => item.id === issue.target.edge);
      return edge ? `${modelOf(edge.source)} → ${modelOf(edge.target)}` : issue.target.edge;
    }
    return modelOf(issue.target.node);
  };
  const focus = (issue: Issue) => {
    focusTarget(issue.target);
    const edge = issue.target.edge ? diagram.edges.find(item => item.id === issue.target.edge) : null;
    const ids = edge ? [edge.source, edge.target] : issue.target.node ? [issue.target.node] : [];
    if (ids.length) void flow.fitView({ nodes: ids.map(id => ({ id })), duration: 300, maxZoom: 1, padding: 0.4 });
  };

  return (
    <aside className="side-panel issues-panel">
      <div className="panel-title">이슈 <span className="group-count">{issues.length}</span></div>
      {issues.length === 0 && <div className="panel-note">확인할 이슈가 없습니다.</div>}
      {SEVERITIES.map(([severity, title]) => {
        const list = issues.filter(issue => issue.severity === severity);
        if (!list.length) return null;
        return (
          <section key={severity} className="issue-group">
            <div className="panel-subtitle">{title} {list.length}</div>
            <ul className="issue-list">
              {list.map((issue, index) => (
                <li key={`${issue.code}-${issue.target.node ?? ''}-${issue.target.edge ?? ''}-${issue.target.port ?? ''}-${index}`}>
                  <button type="button" className={`issue-item issue-${severity}`} onClick={() => focus(issue)} title={issue.detail}>
                    <span className="issue-code">{ISSUE_LABELS[issue.code] ?? issue.code}</span>
                    <span className="issue-target">{describe(issue)}</span>
                    {issue.detail && <span className="issue-detail">{issue.detail}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <div className="panel-foot">이슈는 저장을 막지 않습니다. 내보낸 파일의 issues에 그대로 남습니다.</div>
    </aside>
  );
}
