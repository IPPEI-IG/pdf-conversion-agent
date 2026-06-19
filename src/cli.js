#!/usr/bin/env node
/**
 * P子 — PDF加工エージェント
 * iLovePDF / Adobe Acrobat 相当の機能をローカルで実行するCLI。
 *
 * 実装フェーズ:
 *   フェーズ1（変換）   ← 実装済み
 *   フェーズ2（ページ操作） ← 予定: merge / split / extract / rotate / delete / reorder
 *   フェーズ3（保護）    ← 予定: encrypt / decrypt / watermark
 *   フェーズ4（その他）  ← 予定: compress / OCR など
 */
import { parseArgs } from './util/args.js';
import { log } from './util/log.js';
import { imagesToPdf } from './convert/imagesToPdf.js';
import { pdfToImages } from './convert/pdfToImages.js';
import { pdfToText } from './convert/pdfToText.js';
import { officeToPdf, pdfToDocx } from './convert/office.js';

const HELP = `
P子 (pko) — PDF加工エージェント

使い方:
  pko <コマンド> [入力...] [オプション]

【変換】(フェーズ1・実装済み)
  img2pdf   <img...>   [-o out.pdf]              画像(png/jpg) → PDF
  pdf2img   <in.pdf>   [-o outdir] [--dpi 150]   PDF → 画像(PNG)
  office2pdf <file...> [-o outdir]               Word/Excel/PPT → PDF
  pdf2docx  <in.pdf>   [-o outdir]               PDF → Word(docx) ※簡易
  pdf2txt   <in.pdf>   [-o out.txt]              PDF → テキスト抽出

  help                                           このヘルプ

例:
  pko img2pdf scan1.png scan2.png -o doc.pdf
  pko pdf2img report.pdf --dpi 200
  pko office2pdf 見積書.xlsx
  pko pdf2txt 契約書.pdf
`;

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);
  const inputs = args._;

  try {
    switch (command) {
      case 'img2pdf':
        await imagesToPdf(inputs, args.out);
        break;
      case 'pdf2img':
        requireOne(inputs, 'pdf2img');
        await pdfToImages(inputs[0], args.out, args.dpi ? Number(args.dpi) : 150);
        break;
      case 'office2pdf':
        requireOne(inputs, 'office2pdf');
        for (const f of inputs) await officeToPdf(f, args.out);
        break;
      case 'pdf2docx':
        requireOne(inputs, 'pdf2docx');
        await pdfToDocx(inputs[0], args.out);
        break;
      case 'pdf2txt':
        requireOne(inputs, 'pdf2txt');
        await pdfToText(inputs[0], args.out);
        break;
      case 'help':
      case '--help':
      case '-h':
      case undefined:
        console.log(HELP);
        break;
      default:
        log.error(`不明なコマンド: ${command}`);
        console.log(HELP);
        process.exitCode = 1;
    }
  } catch (e) {
    log.error(e.message);
    process.exitCode = 1;
  }
}

function requireOne(inputs, cmd) {
  if (!inputs.length) throw new Error(`${cmd}: 入力ファイルを指定してください`);
}

main();
