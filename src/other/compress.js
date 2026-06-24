// フェーズ4：圧縮（Ghostscript 利用）
// 注意: Ghostscript が必要。未インストールなら導入を促す。
//       開発サンドボックスにはGhostscriptが無く未検証（実機での動作前提）。
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { findGhostscript, run } from '../util/external.js';
import { log } from '../util/log.js';
import { defaultOut } from '../util/pages.js';

// 品質プリセット → Ghostscript の -dPDFSETTINGS
const LEVELS = {
  low: '/screen',     // 最小（72dpi相当）
  medium: '/ebook',   // 標準（150dpi相当）
  high: '/printer',   // 高品質（300dpi相当）
};

function fmtSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

export async function compress(inPath, { level = 'medium', outPath } = {}) {
  if (!existsSync(inPath)) throw new Error(`ファイルが見つかりません: ${inPath}`);
  const setting = LEVELS[level];
  if (!setting) throw new Error(`--level は low / medium / high で指定してください（既定: medium）`);

  const dest = outPath || defaultOut(inPath, '_compressed');
  const gs = findGhostscript();
  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=${setting}`,
    '-dNOPAUSE', '-dQUIET', '-dBATCH',
    `-sOutputFile=${path.resolve(dest)}`,
    path.resolve(inPath),
  ];

  log.step(`圧縮中（${level} = ${setting}）: ${path.basename(inPath)}`);
  try {
    await run(gs, args);
  } catch (e) {
    if (/ENOENT/.test(e.message)) {
      throw new Error(
        'Ghostscript が見つかりません。圧縮には Ghostscript が必要です。\n' +
        '  Windows: https://www.ghostscript.com/releases/gsdnld.html からインストール\n' +
        `  詳細: ${e.message}`,
      );
    }
    throw e;
  }

  if (!existsSync(dest)) throw new Error('圧縮に失敗しました（出力が生成されませんでした）');
  const before = statSync(inPath).size;
  const after = statSync(dest).size;
  const ratio = before > 0 ? Math.round((1 - after / before) * 100) : 0;
  log.ok(`圧縮完了: ${dest}（${fmtSize(before)} → ${fmtSize(after)}, ${ratio}%削減）`);
  return dest;
}
