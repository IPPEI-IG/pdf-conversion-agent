# freee人事労務 データエクスポート 作業メモ

## 概要
freee人事労務のデータをCSVで自動エクスポートするスクリプト群。
VDI（Windows）のタスクスケジューラで毎日自動実行。

---

## 環境
- **作業ディレクトリ**: `C:\Users\usr0107111\claude-work\`
- **出力先**: `C:\Users\usr0107111\GMOインターネットグループ株式会社\G人事部 - ドキュメント（freee人事データ）\最新\`
- **Node.js** で実装
- **認証**: `workcert/freeeAuth.js`（OAuth2.0トークン管理、自動リフレッシュ）

## 環境変数（PowerShell起動時に毎回設定が必要）
```powershell
$env:FREEE_CLIENT_ID = "747144291436838"
$env:FREEE_CLIENT_SECRET = "2ayB6NQYnGifAtum8UEVV6uxo7W3-LsLPvl5gt13aMhdEJJsrhYQc2SfGB2-cJmvs_NV7OP3YkvqJuiijPDLfA"
```

---

## スクリプト一覧

### freee_export_full.js
- **内容**: 従業員マスタCSV出力
- **出力**: `freee_employees_YYYYMMDD.csv`
- **項目**: 基本情報・本人情報・健康保険・厚生年金・銀行口座・給与・扶養家族（展開済み）
- **ヘッダー**: 日本語
- **実行**: `node freee_export_full.js`

### freee_attendance_export.js
- **内容**: 勤怠データCSV出力
- **出力①**: `freee_timeclocks_YYYYMMDD.csv`（日次打刻）
- **出力②**: `freee_worksummaries_YYYYMM.csv`（月次サマリ）
- **実行**: `node freee_attendance_export.js`

### freee_update_email.js
- **内容**: 従業員の本人情報メールアドレスを一括登録
- **参照**: `email_map.json`（社員番号→メールアドレス）
- **ドライラン**: `node freee_update_email.js --dry`
- **実績**: 228件登録済み（2026/06/26）

---

## タスクスケジューラ

| タスク名 | 実行時刻 | BATファイル | 対象 |
|---------|---------|-----------|------|
| FreeeExportFull | 毎日 20:00 | `freee_export_full.bat` | 人事労務 |
| FreeeAttendanceExport | 毎日 6:00 | `freee_attendance_export.bat` | 勤怠管理Plus |

BATファイルに環境変数（CLIENT_ID/SECRET）を直接記載済み。

---

## 認証トークンの更新方法
トークンは6時間で期限切れ。期限切れの場合：

```powershell
cd C:\Users\usr0107111\claude-work
$env:FREEE_CLIENT_ID = "747144291436838"
$env:FREEE_CLIENT_SECRET = "2ayB6NQYnGifAtum8UEVV6uxo7W3-LsLPvl5gt13aMhdEJJsrhYQc2SfGB2-cJmvs_NV7OP3YkvqJuiijPDLfA"
node -e "const {printAuthUrl}=require('./workcert/freeeAuth');printAuthUrl()"
# ブラウザでURLを開き、表示されたcodeを使って：
node -e "const {exchangeCode}=require('./workcert/freeeAuth');exchangeCode('ここにcode').then(console.log)"
```

---

## 未対応・課題

### メールアドレス登録でのOAuthスコープ問題（解決済み）
- PUT APIに `scope=read+write` が必要
- `freeeAuth.js` の `printAuthUrl()` に `scope=read+write` を追加して再認証することで解決

### 緊急連絡先
- freee HR APIのレスポンスに緊急連絡先フィールドなし（API非公開）
- freee管理画面の手動エクスポートで取得できるか要確認

### TXT未照合 9件
- `パートナーデータ更新_20260619.txt` に社員番号が見つからなかった9名
- 役員（6桁番号）等の可能性あり

---

## freee API情報
- **会社ID**: `12566555`
- **BASE_URL**: `https://api.freee.co.jp/hr/api/v1`
- **ログインメールアドレス**: APIで取得不可（`/users` エンドポイントは404）
- **本人情報メールアドレス**: `profile_rule.email` で取得可能
