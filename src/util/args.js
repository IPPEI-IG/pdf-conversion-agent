// 最小限の引数パーサ
// 例: img2pdf a.png b.png -o out.pdf --dpi 150
// → { _: ['a.png','b.png'], out: 'out.pdf', dpi: '150' }
const ALIASES = { o: 'out', f: 'format', q: 'quality', p: 'password' };

export function parseArgs(argv) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('-')) {
        result[key] = true; // フラグ
      } else {
        result[key] = next;
        i++;
      }
    } else if (a.startsWith('-') && a.length > 1) {
      const key = ALIASES[a.slice(1)] || a.slice(1);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('-')) {
        result[key] = true;
      } else {
        result[key] = next;
        i++;
      }
    } else {
      result._.push(a);
    }
  }
  return result;
}
