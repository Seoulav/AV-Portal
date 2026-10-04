import assert from 'node:assert/strict';
import { getDocument, GlobalWorkerOptions, PasswordResponses } from './site/vendor/pdfjs/pdf.min.mjs';

GlobalWorkerOptions.workerSrc = new URL('./site/vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;

export async function verifyPdfLock(file, listedLocked, bytes) {
  const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, disableFontFace: true });
  let encrypted = false;
  try {
    await task.promise;
  } catch (error) {
    if (error?.name !== 'PasswordException' || error.code !== PasswordResponses.NEED_PASSWORD) throw error;
    encrypted = true;
  } finally {
    await task.destroy();
  }
  assert.equal(listedLocked === true, encrypted, `${file}: locked 표시와 실제 PDF 암호 상태가 다릅니다`);
}
