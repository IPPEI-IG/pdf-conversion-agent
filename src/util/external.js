// 外部バイナリ（LibreOffice）の検出と実行ヘルパー
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// LibreOffice (soffice) の実行パスを探す。
// PATH 上にあればそれを、無ければOS別の既定インストール先を探す。
export function findSoffice() {
  const isWin = process.platform === 'win32';
  const candidates = isWin
    ? [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      ]
    : ['/usr/bin/soffice', '/usr/bin/libreoffice', '/opt/libreoffice/program/soffice'];

  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // PATH 上にある想定でコマンド名を返す（spawn が解決する）
  return isWin ? 'soffice.exe' : 'soffice';
}

// 子プロセスを起動して終了を待つ。stdout/stderr を収集して返す。
export function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ...opts });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => (stdout += d.toString()));
    child.stderr?.on('data', (d) => (stderr += d.toString()));
    child.on('error', (e) => reject(e));
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${path.basename(cmd)} が終了コード ${code} で失敗しました\n${stderr || stdout}`));
    });
  });
}

// LibreOffice 用に、本体のプロファイルと干渉しない専用プロファイルを割り当てる。
// 毎回作り直すと遅いため、ユーザ単位で固定の場所を再利用する（--nolockcheck で競合回避）。
export function profileArg() {
  const dir = path.join(os.tmpdir(), 'pko-libreoffice-profile');
  // file:// URL 形式が必要
  const url = process.platform === 'win32'
    ? 'file:///' + dir.replace(/\\/g, '/')
    : 'file://' + dir;
  return `-env:UserInstallation=${url}`;
}
