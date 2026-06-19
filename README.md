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

### 使用例

```bash
# スキャン画像をまとめて1つのPDFに
node src/cli.js img2pdf scan1.png scan2.png scan3.jpg -o 契約書.pdf

# PDFを200dpiでページ毎のPNGに
node src/cli.js pdf2img report.pdf --dpi 200 -o ./pages

# 見積書(Excel)をPDF化（要LibreOffice）
node src/cli.js office2pdf 見積書.xlsx

# PDFから本文テキストを抽出
node src/cli.js pdf2txt 契約書.pdf -o 契約書.txt
```

---

## ロードマップ

- **フェーズ2：ページ操作** — `merge`（結合）/ `split`（分割）/ `extract`（抽出）/ `rotate`（回転）/ `delete`（ページ削除）/ `reorder`（並べ替え）
- **フェーズ3：保護** — `encrypt`（パスワード設定）/ `decrypt`（解除）/ `watermark`（透かし）/ ページ番号付与
- **フェーズ4：その他** — `compress`（圧縮）/ `ocr`（スキャンPDFの文字認識）など

---

## 構成

```
src/
├── cli.js                コマンド振り分け
├── util/
│   ├── args.js           引数パーサ
│   ├── log.js            ログ出力
│   └── external.js       LibreOffice検出・子プロセス実行
└── convert/              フェーズ1：変換
    ├── imagesToPdf.js
    ├── pdfToImages.js
    ├── pdfToText.js
    └── office.js
```
