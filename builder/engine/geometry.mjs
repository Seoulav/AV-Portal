// 노드 치수. 구 Builder store.ts의 상수와 calculateNodeHeight 식을 옮겼다(기반명세 §9).
// 좌표 계산·노드 높이·렌더링이 모두 이 모듈을 쓴다. 렌더링 쪽 값을 바꾸면 여기도 같이 바꾼다.

export const NODE_WIDTH = 220;
export const NODE_HEADER_HEIGHT = 54;
export const NODE_PADDING = 12;
export const NODE_IMAGE_HEIGHT = 68;
export const PORT_ROW_HEIGHT = 24;
export const PORT_ROW_GAP = 4;
export const PORT_ROW_PITCH = PORT_ROW_HEIGHT + PORT_ROW_GAP;
export const IO_BIDI_GAP = 8;
export const BIDI_LABEL_HEIGHT = 13;
export const MIN_NODE_HEIGHT = 100;

// 단자 행 높이 합. 입력·출력 열이 나란히 서고, 양방향 단자는 그 아래 따로 놓인다
export function portsHeight(data) {
  const maxIO = Math.max(data.inputs?.length ?? 0, data.outputs?.length ?? 0);
  const bidi = data.bidirectional?.length ?? 0;
  if (maxIO > 0 && bidi > 0) return (maxIO * PORT_ROW_PITCH - PORT_ROW_GAP) + IO_BIDI_GAP + BIDI_LABEL_HEIGHT + (bidi * PORT_ROW_PITCH - PORT_ROW_GAP);
  if (maxIO > 0) return maxIO * PORT_ROW_PITCH - PORT_ROW_GAP;
  if (bidi > 0) return bidi * PORT_ROW_PITCH - PORT_ROW_GAP + BIDI_LABEL_HEIGHT;
  return 0;
}

// 1.2의 measured.height. 사진이 없으면(imageUrl 없음) 사진 영역을 빼고 계산한다
export function nodeHeight(data) {
  const total = NODE_PADDING + NODE_HEADER_HEIGHT + (data.imageUrl ? NODE_IMAGE_HEIGHT : 0) + portsHeight(data) + NODE_PADDING;
  return Math.max(MIN_NODE_HEIGHT, total);
}
