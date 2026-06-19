// PDF → 画像（PNG）変換（pdf-to-img: pdfjs + napi-rs/canvas のプリビルド利用）
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pdf } from 'pdf-to-img';
import { log } from '../util/log.js';

// inPath: 入力PDF, outDir: 出力ディレクトリ, dpi: 解像度（既定150）
export async function pdfToImages(inPath, outDir, dpi = 150) {
  const dir = outDir || path.join(path.dirname(inPath), path.basename(inPath, path.extname(inPath)) + '_images');
  await mkdir(dir, { recursive: true });

  // pdfjs の viewport scale。72dpi = scale 1.0。
  const scale = Math.max(0.5, Number(dpi) / 72);
  const document = await pdf(inPath, { scale });

  const base = path.basename(inPath, path.extname(inPath));
  let i = 0;
  for await (const image of document) {
    i++;
    const file = path.join(dir, `${base}_p${String(i).padStart(3, '0')}.png`);
    await writeFile(file, image);
    log.step(`書き出し: ${path.basename(file)}`);
  }
  if (i === 0) throw new Error('PDF にページがありません');
  log.ok(`${i}ページを画像化: ${dir}（${dpi}dpi, PNG）`);
  return dir;
}
