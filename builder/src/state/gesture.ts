// 선 긋기를 막 끝낸 직후의 click은 단자 선택을 바꾸지 않는다.
// 끌기가 같은 단자 행에서 끝나면 브라우저가 그 단자에 click을 보낸다. 그때 고른 묶음이 하나로 줄지 않게 한다
let endedAt = Number.NEGATIVE_INFINITY;
export const markConnectEnd = () => { endedAt = performance.now(); };
export const justConnected = () => performance.now() - endedAt < 300;
