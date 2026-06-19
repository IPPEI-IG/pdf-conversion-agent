// フェーズ2：ページ操作（pdf-lib / 純JS・外部ツール不要）
// merge / split / extract / delete / reorder / rotate
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, degrees } from 'pdf-lib';
import { log } from '../util/log.js';
import { parsePageSpec, defaultOut } from '../util/pages.js';

async function load(p) {
  return PDFDocument.load(await readFile(p));
}

// 指定ページ（1始まり配列）を新規PDFにコピーして返す。
async function pickPages(srcDoc, pageNumbers) {
  const out = await PDFDocument.create();
  const indices = pageNumbers.map((n) => n - 1);
  const copied = await out.copyPages(srcDoc, indices);
  copied.forEach((pg) => out.addPage(pg));
  return out;
}

async function save(doc, outPath) {
  await writeFile(outPath, await doc.save());
  return outPath;
}

// 複数PDFを順に結合
export async function merge(inputs, outPath) {
  if (inputs.length < 2) throw new Error('結合するPDFを2つ以上指定してください');
  const out = await PDFDocument.create();
  let totalPages = 0;
  for (const f of inputs) {
    const src = await load(f);
    const copied = await out.copyPages(src, src.getPageIndices());
    copied.forEach((pg) => out.addPage(pg));
    totalPages += src.getPageCount();
    log.step(`結合: ${path.basename(f)}（${src.getPageCount()}ページ）`);
  }
  const dest = outPath || defaultOut(inputs[0], '_merged');
  await save(out, dest);
  log.ok(`結合完了: ${dest}（計${totalPages}ページ）`);
  return dest;
}

// PDFをページ毎に分割（既定）／ --every N でNページずつのチャンクに分割
export async function split(inPath, outDir, every = 1) {
  const src = await load(inPath);
  const total = src.getPageCount();
  const dir = outDir || path.join(path.dirname(inPath), path.basename(inPath, path.extname(inPath)) + '_split');
  await mkdir(dir, { recursive: true });
  const chunk = Math.max(1, Number(every) || 1);
  const base = path.basename(inPath, path.extname(inPath));

  let part = 0;
  for (let start = 0; start < total; start += chunk) {
    part++;
    const nums = [];
    for (let i = start; i < Math.min(start + chunk, total); i++) nums.push(i + 1);
    const out = await pickPages(src, nums);
    const file = path.join(dir, `${base}_${String(part).padStart(3, '0')}.pdf`);
    await save(out, file);
    log.step(`書き出し: ${path.basename(file)}（ページ ${nums[0]}${nums.length > 1 ? '-' + nums[nums.length - 1] : ''}）`);
  }
  log.ok(`分割完了: ${dir}（${part}ファイル）`);
  return dir;
}

// 指定ページのみを抽出して1つのPDFに
export async function extract(inPath, spec, outPath) {
  const src = await load(inPath);
  const nums = parsePageSpec(spec, src.getPageCount());
  const out = await pickPages(src, nums);
  const dest = outPath || defaultOut(inPath, '_extract');
  await save(out, dest);
  log.ok(`抽出完了: ${dest}（ページ ${nums.join(',')} → ${nums.length}ページ）`);
  return dest;
}

// 指定ページを削除（残りを保持）
export async function deletePages(inPath, spec, outPath) {
  const src = await load(inPath);
  const total = src.getPageCount();
  const remove = new Set(parsePageSpec(spec, total));
  const keep = [];
  for (let p = 1; p <= total; p++) if (!remove.has(p)) keep.push(p);
  if (!keep.length) throw new Error('全ページを削除しようとしています。1ページ以上残してください。');
  const out = await pickPages(src, keep);
  const dest = outPath || defaultOut(inPath, '_deleted');
  await save(out, dest);
  log.ok(`削除完了: ${dest}（${remove.size}ページ削除 → ${keep.length}ページ）`);
  return dest;
}

// 新しいページ順に並べ替え（例: "3,1,2"）。重複指定も可。
export async function reorder(inPath, spec, outPath) {
  const src = await load(inPath);
  const nums = parsePageSpec(spec, src.getPageCount());
  const out = await pickPages(src, nums);
  const dest = outPath || defaultOut(inPath, '_reordered');
  await save(out, dest);
  log.ok(`並べ替え完了: ${dest}（順序 ${nums.join(',')}）`);
  return dest;
}

// 指定ページを回転（90/180/270 の倍数）。pages省略時は全ページ。
export async function rotate(inPath, deg, spec, outPath) {
  const angle = Number(deg);
  if (![90, 180, 270, -90, -180, -270].includes(angle)) {
    throw new Error('回転角は 90 / 180 / 270（負値可）で指定してください');
  }
  const src = await load(inPath);
  const targets = new Set(parsePageSpec(spec ?? 'all', src.getPageCount()));
  const pages = src.getPages();
  pages.forEach((pg, idx) => {
    if (targets.has(idx + 1)) {
      const current = pg.getRotation().angle;
      pg.setRotation(degrees((current + angle + 360) % 360));
    }
  });
  const dest = outPath || defaultOut(inPath, '_rotated');
  await save(src, dest);
  log.ok(`回転完了: ${dest}（${angle}°, ${targets.size}ページ）`);
  return dest;
}
