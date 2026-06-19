// ページ指定パーサ。"1,3,5-7" や "all"、降順 "5-1" に対応。
// 戻り値は 1始まりのページ番号配列（順序・重複は指定通り保持）。
export function parsePageSpec(spec, total) {
  if (spec === undefined || spec === null || spec === 'all' || spec === true) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out = [];
  for (const part of String(spec).split(',')) {
    const t = part.trim();
    if (!t) continue;
    const m = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      const step = a <= b ? 1 : -1;
      for (let i = a; step > 0 ? i <= b : i >= b; i += step) out.push(i);
    } else if (/^\d+$/.test(t)) {
      out.push(Number(t));
    } else {
      throw new Error(`ページ指定が不正です: "${t}"（例: 1,3,5-7）`);
    }
  }
  if (!out.length) throw new Error('ページが1つも指定されていません');
  for (const p of out) {
    if (p < 1 || p > total) throw new Error(`ページ番号が範囲外です: ${p}（このPDFは1〜${total}ページ）`);
  }
  return out;
}

// 出力パスの既定値を組み立てる（入力名にサフィックスを付ける）。
import path from 'node:path';
export function defaultOut(inPath, suffix, ext = '.pdf') {
  const dir = path.dirname(inPath);
  const base = path.basename(inPath, path.extname(inPath));
  return path.join(dir, `${base}${suffix}${ext}`);
}
