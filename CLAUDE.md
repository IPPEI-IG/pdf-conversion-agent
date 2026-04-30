# PDF変換エージェント (PDF Conversion Agent)

## 概要
WordやExcelなどのOfficeドキュメントをPDFに変換するCLIエージェント。
LibreOfficeをバックエンドに使用し、単一ファイルおよびフォルダ一括変換に対応する。

## セットアップ
```bash
npm install
```

### 前提条件
- Node.js 18+
- LibreOffice（インストール済みであること）
  - Windows: `C:\Program Files\LibreOffice\program\soffice.exe`
  - macOS: `/Applications/LibreOffice.app/Contents/MacOS/soffice`

## 使い方

### 単一ファイル変換
```bash
node pdf-agent.js "report.docx"
node pdf-agent.js "data.xlsx" --output ./out
```

### フォルダ一括変換
```bash
node pdf-agent.js "./documents" --batch
node pdf-agent.js "./documents" --batch --output ./pdf_output
```

### オプション
| オプション | 説明 | デフォルト |
|-----------|------|----------|
| `--output <dir>` | 出力先ディレクトリ | 入力ファイルと同じ場所 |
| `--batch` | フォルダ内を一括変換 | false |
| `--overwrite` | 既存PDFを上書き | false |

## ファイル構成
```
pdf-conversion-agent/
├── pdf-agent.js     # メインスクリプト
├── package.json     # 依存関係
├── .gitignore
└── CLAUDE.md
```

## 対応フォーマット
- `.docx` / `.doc` — Word文書
- `.xlsx` / `.xls` — Excelスプレッドシート
- `.pptx` / `.ppt` — PowerPointプレゼンテーション
- `.odt` / `.ods` / `.odp` — OpenDocument形式
