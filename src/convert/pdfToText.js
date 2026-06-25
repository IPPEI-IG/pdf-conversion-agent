// PDF → テキスト抽出（pdfjs-dist / 純JS）
// 注意: 画像スキャンPDFには文字情報が無いため空になる（その場合はOCRが必要）。
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { log } from '../util/log.js';

export async function pdfToText(inPath, outPath) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(await readFile(inPath));
  const doc = await getDocument({ data, useSystemFonts: true }).promise;

  const parts = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map((it) => ('str' in it ? it.str : '')).join(' ');
    parts.push(text);
    log.step(`抽出: ${p}/${doc.numPages}ページ`);
  }

  const joined = parts.join('\n\n');
  const out = outPath || path.join(path.dirname(inPath), path.basename(inPath, path.extname(inPath)) + '.txt');
  await writeFile(out, joined, 'utf8');
  log.ok(`テキストを書き出し: ${out}（${doc.numPages}ページ）`);
  if (joined.trim().length === 0) {
    log.warn('抽出テキストが空でした。スキャン画像PDFの可能性があります（OCRが必要）。');
  }
  return out;
}
