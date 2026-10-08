// PDF 내보내기(B-20261006-10). 도면 SVG(diagramSvg)를 벡터 그대로 PDF로 옮긴다(결정 M-a: jspdf + svg2pdf.js).
// 이 모듈은 PDF를 누를 때 불러온다(첫 화면 번들에 넣지 않는다). 한글 글꼴은 Pretendard Regular 원본(SIL OFL 1.1,
// public/fonts/OFL.txt)을 고치지 않고 넣는다(결정 M-e). 예약 글꼴 이름이 있어 글자를 줄인 사본은 만들지 않는다.
// 굵은 글자도 같은 글꼴로 쓴다(굵은 글꼴 파일을 따로 받지 않는다).
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import type { DiagramSvg } from './diagramSvg';

export const PDF_FONT_FILE = 'Pretendard-Regular.ttf';
// PDF 쪽 크기 한계(Acrobat 기준 200인치 = 14,400pt). 도면이 더 크면 비율을 지켜 줄인다
export const PDF_MAX_SIDE = 14400;

let fontData: Promise<string> | null = null;
const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
// 글꼴은 한 번만 받는다. 실패하면 다음에 다시 받을 수 있게 비운다
function loadFont(url: string) {
  fontData ??= fetch(url).then(response => {
    if (!response.ok) throw new Error(`글꼴을 받지 못했습니다(HTTP ${response.status})`);
    return response.arrayBuffer();
  }).then(toBase64).catch(error => { fontData = null; throw error; });
  return fontData;
}

export async function diagramPdf(drawing: DiagramSvg, { fontUrl = `${import.meta.env.BASE_URL}fonts/${PDF_FONT_FILE}` } = {}): Promise<Blob> {
  const scale = Math.min(1, PDF_MAX_SIDE / Math.max(drawing.width, drawing.height));
  const width = drawing.width * scale;
  const height = drawing.height * scale;
  // 결정 M-b: 도면 크기 그대로 한 쪽(1px = 1pt)
  const doc = new jsPDF({ orientation: width >= height ? 'landscape' : 'portrait', unit: 'pt', format: [width, height], compress: true });
  doc.addFileToVFS(PDF_FONT_FILE, await loadFont(fontUrl));
  doc.addFont(PDF_FONT_FILE, 'Pretendard', 'normal');
  doc.addFont(PDF_FONT_FILE, 'Pretendard', 'bold');
  doc.setFont('Pretendard', 'normal');
  doc.setProperties({ title: 'AV System Builder 구성도', creator: 'AV Portal Builder' });
  const element = new DOMParser().parseFromString(drawing.svg, 'image/svg+xml').documentElement;
  // svg2pdf는 글자 폭 등을 문서 안의 요소에서 읽으므로 화면 밖에 잠깐 붙였다가 뗀다
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-100000px;top:0;width:0;height:0;overflow:hidden';
  holder.appendChild(element);
  document.body.appendChild(holder);
  try {
    await svg2pdf(element, doc, { x: 0, y: 0, width, height });
  } finally {
    holder.remove();
  }
  return doc.output('blob');
}
