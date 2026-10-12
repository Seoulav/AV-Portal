import { PROTOCOL, isHandoffMessage, toQuotePayload } from '../../shared/quote-handoff';
let quoteWindow: Window | null = null;
let cancelPrevious: (() => void) | undefined;
// Keep only the current transfer in memory. The URL contains no diagram, price or customer data.
export function openQuote(raw: unknown, notify: (message: string) => void): void {
 const payload=toQuotePayload(raw);
 cancelPrevious?.();
 const id=crypto.randomUUID();
 if(!quoteWindow || quoteWindow.closed) quoteWindow=window.open(new URL('../cpq/', location.href), '_blank');
 const target=quoteWindow;
 if(!target) { notify('팝업이 차단됐습니다. 팝업을 허용하거나 JSON 내보내기 후 견적에서 파일을 열어 주세요.'); return; }
 target.focus();
 const origin=location.origin;
 let sent=false;
 const cleanup=() => { clearInterval(ticker); clearTimeout(timeout); window.removeEventListener('message', receive); cancelPrevious=undefined; };
 const receive=(event: MessageEvent) => {
  if(event.origin!==origin || event.source!==target || !isHandoffMessage(event.data) || event.data.id!==id) return;
  if(event.data.kind==='ready' && !sent) { sent=true; target.postMessage({protocol:PROTOCOL,kind:'diagram',id,payload},origin); }
  if(event.data.kind==='result') { cleanup(); notify(event.data.accepted ? '견적 화면으로 구성도를 전달했습니다.' : '견적 교체를 취소했거나 구성도를 받지 못했습니다. 기존 견적은 유지됩니다.'); }
 };
 const hello=() => {
  if(target.closed) { cleanup(); notify('견적 창이 닫혀 전달을 취소했습니다.'); return; }
  if(!sent) target.postMessage({protocol:PROTOCOL,kind:'hello',id},origin);
 };
 window.addEventListener('message',receive);
 const ticker=setInterval(hello,300);
 const timeout=setTimeout(()=>{cleanup();notify('견적 전달 시간이 지났습니다. 다시 시도하거나 구성도 JSON을 열어 주세요.');},30000);
 cancelPrevious=cleanup;
 hello();
}
