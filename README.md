# P子 — PDF加工エージェント (`pdf-conversion-agent`)

iLovePDF / Adobe Acrobat 有料版 相当の PDF 加工機能を、**ローカルで実行**する Node.js 製の CLI ツールです。

外部サービスにファイルをアップロードせず、手元で完結させることを目的にしています。

---

## セットアップ

必要環境: **Node.js 18 以上**（推奨 v20+）

```bash
npm install
```

一部の機能（Office ⇄ PDF）は **LibreOffice** を使います。未インストールの場合のみ導入してください。

- Windows: <https://ja.libreoffice.org/> からインストール（既定の `C:\Program Files\LibreOffice\program\soffice.exe` を自動検出）
- PATH 上に `soffice` があればそれも自動で使います

---

## 使い方

```bash
node src/cli.js <コマンド> [入力...] [オプション]
# もしくは npm link / npx 後に:  pko <コマンド> ...
```

ヘルプ:

```bash
node src/cli.js help
```

---

## 機能一覧

### フェーズ1：変換（実装済み）

| コマンド | 内容 | 依存 | 状態 |
|---|---|---|---|
| `img2pdf <img...> [-o out.pdf]` | 画像(PNG/JPG) → PDF（複数画像を1PDFに） | 純JS | ✅ 検証済み |
| `pdf2img <in.pdf> [-o outdir] [--dpi 150]` | PDF → 画像(PNG, ページ毎) | 純JS | ✅ 検証済み |
| `pdf2txt <in.pdf> [-o out.txt]` | PDF → テキスト抽出 | 純JS | ✅ 検証済み |
| `office2pdf <file...> [-o outdir]` | Word/Excel/PowerPoint/ODF → PDF | LibreOffice | ⚠ 要LibreOffice実機 |
| `pdf2docx <in.pdf> [-o outdir]` | PDF → Word(docx)（ベストエフォート） | LibreOffice | ⚠ 要LibreOffice実機 |

> **注意（office2pdf / pdf2docx）**: 開発用のサンドボックス環境では LibreOffice が
> 入力を読み込めず動作検証ができませんでした。コードは標準的な
> `soffice --headless --convert-to` 方式で、実機の LibreOffice では動作する想定です。
> 変換失敗時は**出力ファイルの有無を検証して明確にエラー**を返します（成功を偽装しません）。
> まずはお手元の Windows + LibreOffice で `office2pdf` をお試しください。
>
> `pdf2docx` は LibreOffice の PDF インポートに依存するため、PDFの作りによっては
> 失敗します。テキスト主体のPDF向けです（高忠実度が必要なら今後の拡張で対応予定）。

### フェーズ2：ページ操作（実装済み・検証済み）

| コマンド | 内容 | 依存 | 状態 |
|---|---|---|---|
| `merge <a.pdf> <b.pdf>... [-o out.pdf]` | 複数PDFを結合 | 純JS | ✅ 検証済み |
| `split <in.pdf> [-o outdir] [--every N]` | ページ毎に分割（既定）/ Nページ毎 | 純JS | ✅ 検証済み |
| `extract <in.pdf> <pages> [-o out.pdf]` | 指定ページを抽出（例: `1,3,5-7`） | 純JS | ✅ 検証済み |
| `delete <in.pdf> <pages> [-o out.pdf]` | 指定ページを削除 | 純JS | ✅ 検証済み |
| `reorder <in.pdf> <order> [-o out.pdf]` | 並べ替え（例: `3,1,2`） | 純JS | ✅ 検証済み |
| `rotate <in.pdf> <deg> [pages] [-o out.pdf]` | 回転 90/180/270（省略時全ページ） | 純JS | ✅ 検証済み |

ページ指定 `<pages>` は `1,3,5-7` のようにカンマ・範囲で記述します（`all` で全ページ、`5-1` で降順も可）。

### フェーズ3：保護（実装済み・検証済み）

| コマンド | 内容 | 依存 | 状態 |
|---|---|---|---|
| `encrypt <in.pdf> --password <pw> [--owner <pw>]` | パスワードを設定して暗号化 | muhammara | ✅ 検証済み |
| `decrypt <in.pdf> --password <pw>` | パスワードを解除 | muhammara | ✅ 検証済み |
| `watermark <in.pdf> <text> [--opacity 0.3] [--size 48]` | 斜めの透かしを全ページに | 純JS | ✅ 検証済み |
| `pagenum <in.pdf> [--start 1] [--size 10]` | ページ番号（`n / total`）を付与 | 純JS | ✅ 検証済み |

> **日本語対応**: `watermark` / `pagenum` は日本語にも対応しました。非ASCII文字を含む場合、
> `--font` で指定した TTF/OTF、なければOS既定の日本語フォントを自動検出して埋め込みます
> （サブセット埋め込みでファイルは肥大化しません）。
> Windowsで自動検出に失敗する場合は `--font C:\Windows\Fonts\YuGothR.ttc` のように指定してください。
> `decrypt` は誤ったパスワードの場合は明確にエラーを返します。

### フェーズ4：その他

| コマンド | 内容 | 依存 | 状態 |
|---|---|---|---|
| `compress <in.pdf> [--level low\|medium\|high]` | PDFを圧縮（既定 medium） | Ghostscript | ⚠ 要Ghostscript実機 |

> **注意（compress）**: Ghostscript が必要です（Windows: 公式サイトからインストール）。
> 開発サンドボックスにGhostscriptが無いため未検証ですが、標準的な `-sDEVICE=pdfwrite` 方式で、
> 未インストール時は導入を促すエラーを返します。圧縮後はファイルサイズの削減率を表示します。
>
> OCR（スキャンPDFの文字認識）は外部エンジン（Tesseract等）が必要なため、今後の対応予定です。

### 使用例

```bash
# スキャン画像をまとめて1つのPDFに
node src/cli.js img2pdf scan1.png scan2.png scan3.jpg -o 契約書.pdf

# 表紙・本文・裏表紙を結合
node src/cli.js merge 表紙.pdf 本文.pdf 裏表紙.pdf -o 完成.pdf

# 1,3,5〜7ページだけ抜き出す
node src/cli.js extract report.pdf 1,3,5-7 -o 抜粋.pdf

# 2,4ページだけ90°回転
node src/cli.js rotate scan.pdf 90 2,4

# PDFを200dpiでページ毎のPNGに
node src/cli.js pdf2img report.pdf --dpi 200 -o ./pages

# 見積書(Excel)をPDF化（要LibreOffice）
node src/cli.js office2pdf 見積書.xlsx

# PDFから本文テキストを抽出
node src/cli.js pdf2txt 契約書.pdf -o 契約書.txt

# パスワードを設定 / 解除
node src/cli.js encrypt 機密.pdf --password himitsu
node src/cli.js decrypt 機密_encrypted.pdf --password himitsu

# 透かし・ページ番号（日本語可）
node src/cli.js watermark draft.pdf CONFIDENTIAL --opacity 0.2
node src/cli.js watermark 契約書.pdf 社外秘
node src/cli.js pagenum report.pdf

# 圧縮（要Ghostscript）
node src/cli.js compress 大きい.pdf --level medium
```

---

## ロードマップ

- ~~**フェーズ1：変換**~~ ✅ 実装済み
- ~~**フェーズ2：ページ操作**~~ ✅ 実装済み
- ~~**フェーズ3：保護**~~ ✅ 実装済み
- **フェーズ4：その他** — ✅ 透かしの日本語対応 / ✅ `compress`（圧縮, 要Ghostscript） / ⏳ `ocr`（スキャンPDFの文字認識, 要Tesseract）

---

## 構成

```
src/
├── cli.js                コマンド振り分け
├── util/
│   ├── args.js           引数パーサ
│   ├── log.js            ログ出力
│   ├── pages.js          ページ指定パーサ
│   ├── font.js           フォント解決（日本語埋め込み）
│   └── external.js       LibreOffice/Ghostscript検出・子プロセス実行
├── convert/              フェーズ1：変換
│   ├── imagesToPdf.js
│   ├── pdfToImages.js
│   ├── pdfToText.js
│   └── office.js
├── pages/                フェーズ2：ページ操作
│   └── pageOps.js
├── protect/              フェーズ3：保護
│   └── protect.js
└── other/                フェーズ4：その他
    └── compress.js
```
