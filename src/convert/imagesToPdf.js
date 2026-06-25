// 画像 → PDF 変換（pdf-lib / 純JS・外部ツール不要）
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { log } from '../util/log.js';

const SUPPORTED = ['.png', '.jpg', '.jpeg'];

// images: 画像ファイルパスの配列, outPath: 出力PDFパス
export async function imagesToPdf(images, outPath) {
  if (!images.length) throw new Error('画像ファイルを1つ以上指定してください');
  const pdf = await PDFDocument.create();

  for (const img of images) {
    const ext = path.extname(img).toLowerCase();
    if (!SUPPORTED.includes(ext)) {
      throw new Error(`未対応の画像形式です: ${img}（対応: png / jpg）`);
    }
    const bytes = await readFile(img);
    const embedded = ext === '.png'
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
    // 画像の実寸でページを作成
    const page = pdf.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    log.step(`追加: ${path.basename(img)} (${embedded.width}x${embedded.height})`);
  }

  const out = outPath || 'output.pdf';
  await writeFile(out, await pdf.save());
  log.ok(`PDF を作成: ${out}（${images.length}ページ）`);
  return out;
}
