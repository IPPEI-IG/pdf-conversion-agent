/**
 * PDF変換エージェント v1
 * LibreOfficeを使ってOfficeドキュメント(docx/xlsx/pptx)をPDFに変換する
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SOFFICE_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  'soffice',
];

const SUPPORTED_EXTS = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.odt', '.ods', '.odp'];

function findSoffice() {
  for (const p of SOFFICE_PATHS) {
    try {
      if (p === 'soffice') {
        execSync('soffice --version', { stdio: 'ignore' });
        return 'soffice';
      }
      if (fs.existsSync(p)) return `"${p}"`;
    } catch {}
  }
  throw new Error('LibreOfficeが見つかりません。インストール後に再試行してください。');
}

function convertToPdf(inputPath, outputDir, soffice) {
  const absInput = path.resolve(inputPath);
  const absOutput = outputDir ? path.resolve(outputDir) : path.dirname(absInput);
  if (!fs.existsSync(absOutput)) fs.mkdirSync(absOutput, { recursive: true });

  const cmd = `${soffice} --headless --convert-to pdf --outdir "${absOutput}" "${absInput}"`;
  console.log(`変換中: ${path.basename(inputPath)} → ${absOutput}`);
  execSync(cmd, { stdio: 'pipe' });
  const outFile = path.join(absOutput, path.basename(inputPath, path.extname(inputPath)) + '.pdf');
  console.log(`✅ 完了: ${outFile}`);
  return outFile;
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log('使い方: node pdf-agent.js <ファイルまたはフォルダ> [--output <出力先>] [--batch] [--overwrite]');
    process.exit(1);
  }

  const isBatch = args.includes('--batch');
  const outputIdx = args.indexOf('--output');
  const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : null;
  const overwrite = args.includes('--overwrite');
  const target = args.filter(a => !a.startsWith('--'))[0];

  const soffice = findSoffice();
  console.log(`LibreOffice: ${soffice}\n`);

  let files = [];
  if (isBatch) {
    if (!fs.statSync(target).isDirectory()) throw new Error(`フォルダを指定してください: ${target}`);
    files = fs.readdirSync(target)
      .filter(f => SUPPORTED_EXTS.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(target, f));
    console.log(`対象ファイル数: ${files.length}件\n`);
  } else {
    files = [target];
  }

  const results = { success: [], failed: [] };
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!SUPPORTED_EXTS.includes(ext)) {
      console.log(`⏭ スキップ（非対応形式）: ${file}`);
      continue;
    }
    const outPdf = path.join(
      outputDir || path.dirname(path.resolve(file)),
      path.basename(file, ext) + '.pdf'
    );
    if (!overwrite && fs.existsSync(outPdf)) {
      console.log(`⏭ スキップ（既存）: ${outPdf}`);
      continue;
    }
    try {
      convertToPdf(file, outputDir, soffice);
      results.success.push(file);
    } catch (e) {
      console.error(`❌ 失敗: ${file} — ${e.message}`);
      results.failed.push(file);
    }
  }

  if (files.length > 1) {
    console.log(`\n==============================`);
    console.log(`✅ 成功: ${results.success.length}件`);
    if (results.failed.length > 0) console.log(`❌ 失敗: ${results.failed.length}件`);
  }
}

main();
