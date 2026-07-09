// enemy-asset-oracle.js — Battle enemy art coverage.
// Fails when an enemy database entry cannot resolve to an existing image or
// battle rendering can fall back to emoji/text placeholders.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const noop = () => {};

class El {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.className = '';
    this.id = '';
    this.textContent = '';
    this.innerHTML = '';
  }
  setAttribute() {}
  appendChild(child) { this.children.push(child); return child; }
  classList = { add: noop, remove: noop, contains: () => false };
  querySelector() { return null; }
}

const sb = {
  console: { log: noop, warn: noop, error: noop },
  window: {},
  document: {
    getElementById: () => null,
    querySelector: () => null,
    createElement: tag => new El(tag)
  },
  Image: class { set src(_) {} },
  URLSearchParams,
  setTimeout: () => 0,
  clearTimeout: noop,
  requestAnimationFrame: () => 0,
  performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy
};

sb.window.location = { search: '' };
sb.globalThis = sb;
vm.createContext(sb);
vm.runInContext(read('battle-system.js'), sb, { filename: 'battle-system.js' });

const battle = new sb.window.BattleSystem();

function cleanAsset(assetPath) {
  return String(assetPath || '').split('?')[0];
}

function existsAsset(assetPath) {
  const clean = cleanAsset(assetPath);
  return !!clean && fs.existsSync(path.join(root, clean));
}

const missing = [];
Object.entries(battle.enemyDatabase || {}).forEach(([id, enemy]) => {
  const resolved = battle.getEnemyImagePath({ id, ...enemy });
  if (!existsAsset(resolved)) {
    missing.push({ id, name: enemy?.name || '', resolved: resolved || '' });
  }
});

const src = read('battle-system.js');
const forbiddenRuntimeFallbacks = src
  .split('\n')
  .map((text, i) => ({ line: i + 1, text }))
  .filter(entry => (
    /enemySprite\.textContent\s*=\s*enemy\?\./.test(entry.text) ||
    /sprite\.textContent\s*=\s*enemy\?\./.test(entry.text) ||
    /enemySprite\.textContent\s*=\s*['"`][?\p{Extended_Pictographic}]/u.test(entry.text) ||
    /sprite\.textContent\s*=\s*['"`][?\p{Extended_Pictographic}]/u.test(entry.text)
  ));

let pass = true;
function report(label, items) {
  if (!items.length) {
    console.log(`✅ ${label}: 0`);
    return;
  }
  pass = false;
  console.log(`❌ ${label}: ${items.length}`);
  items.slice(0, 40).forEach(item => console.log(`  - ${JSON.stringify(item)}`));
  if (items.length > 40) console.log(`  ... and ${items.length - 40} more`);
}

console.log('\n=== Enemy Asset Oracle ===\n');
console.log(`enemyDatabase entries: ${Object.keys(battle.enemyDatabase || {}).length}`);
report('enemy image missing', missing);
report('battle emoji/text fallback lines', forbiddenRuntimeFallbacks);
console.log(`\n${pass ? '✅ PASS: battle enemies resolve to image assets' : '❌ FAIL: battle enemy asset coverage is incomplete'}`);
process.exit(pass ? 0 : 1);
