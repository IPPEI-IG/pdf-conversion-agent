// テキスト描画用フォントの解決。
// ASCIIのみのテキストはPDF標準フォント、日本語等を含む場合は
// TTF/OTFを埋め込む（明示指定 --font、なければOS既定の日本語フォントを自動探索）。
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// OS別の日本語フォント候補（先に見つかったものを使用）
const JP_FONT_CANDIDATES = {
  linux: [
    '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf',
    '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/truetype/noto/NotoSansCJKjp-Regular.otf',
  ],
  win32: [
    'C:\\Windows\\Fonts\\YuGothR.ttc',
    'C:\\Windows\\Fonts\\meiryo.ttc',
    'C:\\Windows\\Fonts\\msgothic.ttc',
    'C:\\Windows\\Fonts\\BIZ-UDGothicR.ttc',
  ],
  darwin: [
    '/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc',
    '/Library/Fonts/Arial Unicode.ttf',
  ],
};

function autoDetectJpFont() {
  const list = JP_FONT_CANDIDATES[process.platform] || [];
  return list.find((p) => existsSync(p)) || null;
}

const isAscii = (s) => !/[^\x00-\x7F]/.test(s);

// pdf: PDFDocument, opts: { text, fontPath, bold }
// 戻り値: 埋め込み済みフォント
export async function resolveTextFont(pdf, { text = '', fontPath, bold = false } = {}) {
  const needsCustom = Boolean(fontPath) || !isAscii(text);

  if (!needsCustom) {
    return pdf.embedFont(bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
  }

  const file = fontPath || autoDetectJpFont();
  if (!file) {
    throw new Error(
      '日本語等の非ASCII文字には埋め込みフォントが必要です。\n' +
      '  --font <フォントパス> で TTF/OTF を指定してください' +
      '（例: --font C:\\Windows\\Fonts\\YuGothR.ttc）',
    );
  }
  if (!existsSync(file)) throw new Error(`フォントが見つかりません: ${file}`);

  pdf.registerFontkit(fontkit);
  try {
    return await pdf.embedFont(await readFile(file), { subset: true });
  } catch (e) {
    throw new Error(
      `フォントの埋め込みに失敗しました: ${file}\n` +
      `  ${e.message}\n` +
      '  TTF または OTF 形式のフォントを --font で指定してください。',
    );
  }
}
