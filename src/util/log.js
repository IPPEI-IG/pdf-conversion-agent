// 小さなログユーティリティ（他エージェントと同じ絵文字スタイル）
export const log = {
  info: (...a) => console.log(...a),
  ok: (...a) => console.log('✅', ...a),
  warn: (...a) => console.log('⚠ ', ...a),
  step: (...a) => console.log('📄', ...a),
  error: (...a) => console.error('❌', ...a),
};
