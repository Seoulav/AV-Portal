// PDF 내보내기(B-20261006-10). 도면 SVG(diagramSvg)를 벡터 그대로 PDF로 옮긴다(결정 M-a: jspdf + svg2pdf.js).
// 이 모듈은 PDF를 누를 때 불러온다(첫 화면 번들에 넣지 않는다). 한글 글꼴은 Pretendard Regular 원본(SIL OFL 1.1,
// public/fonts/OFL.txt)을 고치지 않고 넣는다(결정 M-e). 예약 글꼴 이름이 있어 글자를 줄인 사본은 만들지 않는다.
// 굵은 글자도 같은 글꼴로 쓴다(diagramSvg가 얇은 외곽선으로 굵기를 낸다).
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import type { DiagramSvg } from './diagramSvg';

export const PDF_FONT_FILE = 'Pretendard-Regular.ttf';
// PDF 안에서 쓰는 글꼴 별칭. svg2pdf는 가운데·오른쪽 맞춤 글자의 폭을 브라우저에서 잰다.
// 같은 글꼴 바이트를 이 이름으로 브라우저에도 올려, 사용자 PC에 Pretendard가 없어도 잰 폭과 그린 폭이 같게 한다.
// 화면 CSS가 쓰는 이름(Pretendard)과 달라 화면 글꼴은 바뀌지 않는다
export const PDF_FONT_NAME = 'BuilderPdfFont';
// PDF 쪽 크기 한계(Acrobat 기준 200인치 = 14,400pt). 도면이 더 크면 비율을 지켜 줄인다
export const PDF_MAX_SIDE = 14400;

export interface DiagramPdf { blob: Blob; missing: string[] }

interface LoadedFont { base64: string }
let loaded: Promise<LoadedFont> | null = null;
const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
// 글꼴은 한 번만 받는다. 실패하면 다음에 다시 받을 수 있게 비운다
function loadFont(url: string) {
  loaded ??= (async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`글꼴을 받지 못했습니다(HTTP ${response.status})`);
    const buffer = await response.arrayBuffer();
    // 보통 굵기와 굵게(같은 바이트) 둘 다 올린다. 굵게를 따로 올리지 않으면 브라우저가 흉내 낸 굵은 폭으로 잰다
    for (const weight of ['400', '700']) {
      const face = new FontFace(PDF_FONT_NAME, buffer, { weight });
      await face.load();
      document.fonts.add(face);
    }
    return { base64: toBase64(buffer) };
  })().catch(error => { loaded = null; throw error; });
  return loaded;
}

export async function diagramPdf(drawing: DiagramSvg, { fontUrl = `${import.meta.env.BASE_URL}fonts/${PDF_FONT_FILE}` } = {}): Promise<DiagramPdf> {
  const parsed = new DOMParser().parseFromString(drawing.svg, 'image/svg+xml');
  // 읽지 못한 SVG를 그대로 넘기면 일부만 그린 PDF가 아무 말 없이 나온다
  if (parsed.querySelector('parsererror')) throw new Error('도면 SVG를 읽지 못했습니다');
  const element = parsed.documentElement;
  element.setAttribute('font-family', PDF_FONT_NAME);

  const scale = Math.min(1, PDF_MAX_SIDE / Math.max(drawing.width, drawing.height));
  const width = drawing.width * scale;
  const height = drawing.height * scale;
  // 결정 M-b: 도면 크기 그대로 한 쪽(1px = 1pt)
  const doc = new jsPDF({ orientation: width >= height ? 'landscape' : 'portrait', unit: 'pt', format: [width, height], compress: true });
  doc.addFileToVFS(PDF_FONT_FILE, (await loadFont(fontUrl)).base64);
  doc.addFont(PDF_FONT_FILE, PDF_FONT_NAME, 'normal');
  doc.addFont(PDF_FONT_FILE, PDF_FONT_NAME, 'bold');
  doc.setFont(PDF_FONT_NAME, 'normal');
  doc.setProperties({ title: 'AV System Builder 구성도', creator: 'AV Portal Builder' });

  // 글꼴에 없는 글자(한자·이모지 등)는 PDF에서 빠진다. 미리 찾아 알린다
  // 바로 위 setFont로 정한 지금 글꼴(PDF_FONT_NAME normal)
  const font = doc.getFont() as unknown as { metadata?: { characterToGlyph(code: number): number } };
  const missing = new Set<string>();
  for (const node of element.querySelectorAll('text')) {
    const content = node.textContent ?? '';
    for (let i = 0; i < content.length; i += 1) {
      const code = content.charCodeAt(i);
      if (code <= 0x20) continue;
      if (font.metadata && !font.metadata.characterToGlyph(code)) missing.add(String.fromCodePoint(content.codePointAt(i)!));
      if (code >= 0xd800 && code <= 0xdbff) i += 1;
    }
  }

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
  return { blob: doc.output('blob'), missing: [...missing].sort() };
}
