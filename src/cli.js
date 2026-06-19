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
import { merge, split, extract, deletePages, reorder, rotate } from './pages/pageOps.js';

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

【ページ操作】(フェーズ2・実装済み)
  merge   <a.pdf> <b.pdf>... [-o out.pdf]        複数PDFを結合
  split   <in.pdf> [-o outdir] [--every N]       ページ毎に分割(既定)/Nページ毎
  extract <in.pdf> <pages>  [-o out.pdf]         指定ページを抽出  例: 1,3,5-7
  delete  <in.pdf> <pages>  [-o out.pdf]         指定ページを削除
  reorder <in.pdf> <order>  [-o out.pdf]         並べ替え  例: 3,1,2
  rotate  <in.pdf> <deg> [pages] [-o out.pdf]    回転 90/180/270（省略時全ページ）

  help                                           このヘルプ

例:
  pko img2pdf scan1.png scan2.png -o doc.pdf
  pko pdf2img report.pdf --dpi 200
  pko merge 表紙.pdf 本文.pdf 裏表紙.pdf -o 完成.pdf
  pko extract report.pdf 1,3,5-7 -o 抜粋.pdf
  pko rotate scan.pdf 90 2,4
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
      case 'merge':
        await merge(inputs, args.out);
        break;
      case 'split':
        requireOne(inputs, 'split');
        await split(inputs[0], args.out, args.every ? Number(args.every) : 1);
        break;
      case 'extract':
        requireTwo(inputs, 'extract', '<pages>（例: 1,3,5-7）');
        await extract(inputs[0], inputs[1], args.out);
        break;
      case 'delete':
        requireTwo(inputs, 'delete', '<pages>');
        await deletePages(inputs[0], inputs[1], args.out);
        break;
      case 'reorder':
        requireTwo(inputs, 'reorder', '<order>（例: 3,1,2）');
        await reorder(inputs[0], inputs[1], args.out);
        break;
      case 'rotate':
        requireTwo(inputs, 'rotate', '<deg>（90/180/270）');
        await rotate(inputs[0], inputs[1], inputs[2], args.out);
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

function requireTwo(inputs, cmd, secondLabel) {
  if (inputs.length < 2) throw new Error(`${cmd}: <in.pdf> ${secondLabel} を指定してください`);
}

main();
