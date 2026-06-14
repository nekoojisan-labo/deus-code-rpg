// index.html のインライン <script>(src無し) を抽出して構文チェック
const fs = require('fs');
const html = fs.readFileSync(require('path').resolve(__dirname, '..', 'index.html'), 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let m, i = 0, bad = 0;
while ((m = re.exec(html))) {
  i++;
  const code = m[1];
  if (code.trim().length < 50) continue;
  try { new Function(code); }
  catch (e) { bad++; console.log('NG inline script #' + i + ': ' + e.message); }
}
console.log(bad === 0 ? ('OK インラインJS ' + i + 'ブロック 構文OK') : ('NG ' + bad + 'ブロックにエラー'));
