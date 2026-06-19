// Office ⇄ PDF 変換（LibreOffice headless 利用）
// 注意: LibreOffice は変換失敗時も終了コード0を返すことがあるため、
//       出力ファイルの存在と "Error:" 出力を必ず検証する。
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { findSoffice, run, profileArg } from '../util/external.js';
import { log } from '../util/log.js';

const OFFICE_EXT = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.odt', '.ods', '.odp', '.rtf', '.txt'];

// 変換を実行し、期待する出力ファイルの生成を検証する。
async function convertWithSoffice({ inPath, outDir, targetFilter, infilter, expectedOut }) {
  if (!existsSync(inPath)) throw new Error(`ファイルが見つかりません: ${inPath}`);
  const dir = outDir || path.dirname(path.resolve(inPath));
  await mkdir(dir, { recursive: true });

  const soffice = findSoffice();
  const args = ['--headless', '--norestore', '--nolockcheck', profileArg()];
  if (infilter) args.push(`--infilter=${infilter}`);
  args.push('--convert-to', targetFilter, '--outdir', dir, path.resolve(inPath));

  log.step(`LibreOffice 変換中: ${path.basename(inPath)} → ${targetFilter.split(':')[0]}`);
  const { stdout, stderr } = await run(soffice, args);

  const combined = `${stdout}\n${stderr}`;
  const errLine = combined.split('\n').find((l) => /^\s*Error:/.test(l));
  const out = path.join(dir, expectedOut);
  if (!existsSync(out)) {
    const detail = errLine ? `\nLibreOffice: ${errLine.trim()}` : `\n${combined.trim()}`;
    throw new Error(`変換に失敗しました（出力が生成されませんでした）${detail}`);
  }
  return out;
}

// Office文書 → PDF（高品質）
export async function officeToPdf(inPath, outDir) {
  const ext = path.extname(inPath).toLowerCase();
  if (!OFFICE_EXT.includes(ext)) {
    throw new Error(`未対応の入力形式です: ${inPath}（対応: Word/Excel/PowerPoint/ODF）`);
  }
  const out = await convertWithSoffice({
    inPath, outDir,
    targetFilter: 'pdf',
    expectedOut: path.basename(inPath, ext) + '.pdf',
  });
  log.ok(`PDF を作成: ${out}`);
  return out;
}

// PDF → Word(docx)。LibreOfficeのPDFインポートに依存し、環境・PDFの作りにより
// 失敗することがある（ベストエフォート）。失敗時は明確にエラーを返す。
export async function pdfToDocx(inPath, outDir) {
  if (path.extname(inPath).toLowerCase() !== '.pdf') {
    throw new Error('入力は PDF を指定してください');
  }
  log.warn('PDF→Word はベストエフォートです（テキスト主体のPDF向け／環境依存）。');
  try {
    const out = await convertWithSoffice({
      inPath, outDir,
      targetFilter: 'docx:MS Word 2007 XML',
      infilter: 'writer_pdf_import',
      expectedOut: path.basename(inPath, '.pdf') + '.docx',
    });
    log.ok(`Word を作成: ${out}`);
    return out;
  } catch (e) {
    throw new Error(
      `${e.message}\n` +
      'ヒント: このPDFはWord変換に対応できませんでした。' +
      'テキスト抽出のみなら "pko pdf2txt" を、画像化なら "pko pdf2img" をお試しください。',
    );
  }
}
