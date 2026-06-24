// フェーズ3：保護
//  - encrypt / decrypt : muhammara（パスワード設定・解除）
//  - watermark / pagenum : pdf-lib（純JS）
// 注意: watermark / pagenum のテキストは標準フォント（ASCII）です。
//       日本語など非ASCIIは現状未対応（フォント埋め込みは今後対応）。
import { readFile, writeFile } from 'node:fs/promises';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import muhammara from 'muhammara';
import { log } from '../util/log.js';
import { defaultOut } from '../util/pages.js';

const { createWriter } = muhammara;

// パスワードを設定して暗号化（既存PDFのページを暗号化ライターに追記）
export function encrypt(inPath, { password, owner, outPath } = {}) {
  if (!password) throw new Error('encrypt: --password <パスワード> を指定してください');
  const dest = outPath || defaultOut(inPath, '_encrypted');
  const writer = createWriter(dest, {
    userPassword: password,
    ownerPassword: owner || password,
    userProtectionFlag: 4, // 印刷を許可
  });
  writer.appendPDFPagesFromPDF(inPath);
  writer.end();
  log.ok(`暗号化完了: ${dest}（開くにはパスワードが必要）`);
  return dest;
}

// パスワードを解除（正しいパスワードで開き、暗号化なしで書き出す）
export function decrypt(inPath, { password, outPath } = {}) {
  if (!password) throw new Error('decrypt: --password <パスワード> を指定してください');
  const dest = outPath || defaultOut(inPath, '_decrypted');
  const writer = createWriter(dest);
  try {
    writer.appendPDFPagesFromPDF(inPath, { password });
  } catch (e) {
    throw new Error('パスワードが違うか、対応していない暗号化形式です');
  }
  writer.end();
  log.ok(`パスワード解除完了: ${dest}`);
  return dest;
}

// 全ページに斜めの透かしテキストを重ねる（ASCII）
export async function watermark(inPath, text, { opacity = 0.3, size = 48, outPath } = {}) {
  if (!text) throw new Error('watermark: 透かし文字を指定してください（ASCII）');
  if (/[^\x00-\x7F]/.test(text)) {
    log.warn('非ASCII文字は標準フォントで表示できません。英数字でお試しください。');
  }
  const pdf = await PDFDocument.load(await readFile(inPath));
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const op = Math.min(1, Math.max(0, Number(opacity)));
  const sz = Number(size);

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, sz);
    // ページ中央に45度で配置
    page.drawText(text, {
      x: width / 2 - (textWidth / 2) * Math.cos(Math.PI / 4),
      y: height / 2 - (textWidth / 2) * Math.sin(Math.PI / 4),
      size: sz,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: op,
      rotate: degrees(45),
    });
  }
  const dest = outPath || defaultOut(inPath, '_watermarked');
  await writeFile(dest, await pdf.save());
  log.ok(`透かし追加完了: ${dest}（"${text}", ${pdf.getPageCount()}ページ）`);
  return dest;
}

// 全ページにページ番号を付与（既定: 下中央 "n / total"）
export async function pageNumbers(inPath, { start = 1, size = 10, outPath } = {}) {
  const pdf = await PDFDocument.load(await readFile(inPath));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const total = pdf.getPageCount();
  const sz = Number(size);
  const startNum = Number(start);

  pdf.getPages().forEach((page, idx) => {
    const { width } = page.getSize();
    const label = `${startNum + idx} / ${startNum + total - 1}`;
    const textWidth = font.widthOfTextAtSize(label, sz);
    page.drawText(label, {
      x: width / 2 - textWidth / 2,
      y: 20,
      size: sz,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });
  const dest = outPath || defaultOut(inPath, '_numbered');
  await writeFile(dest, await pdf.save());
  log.ok(`ページ番号付与完了: ${dest}（${total}ページ）`);
  return dest;
}
