// jsPDF의 선택 기능(html()·addSvgAsImage가 쓰는 html2canvas·dompurify·canvg) 자리. 도면 내보내기는 이 기능을 쓰지 않는다.
// vite.config.ts가 세 모듈을 이 파일로 바꿔 번들에서 뺀다. 누군가 그 기능을 부르면 조용히 깨지지 않고 바로 알린다
const unavailable = () => {
  throw new Error('이 PDF 기능은 Builder에 들어 있지 않습니다(html2canvas·dompurify·canvg를 뺐다)');
};
export default unavailable;
export const Canvg = { from: unavailable, fromString: unavailable };
