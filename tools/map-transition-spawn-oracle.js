// map-transition-spawn-oracle.js
// 全マップ出口の戻り関係・設定スポーンの再現性・安全性・薄すぎるトリガーを検査する。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const noop = () => {};
function fakeEl() {
  return {
    style: {},
    classList: { add: noop, remove: noop, contains: () => false },
    appendChild: noop,
    remove: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: noop,
    removeEventListener: noop,
    setAttribute: noop,
    getAttribute: () => null
  };
}

const sb = {
  console: { log: noop, warn: noop, error: noop },
  window: {},
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => fakeEl(),
    body: fakeEl()
  },
  Image: class { set src(_) {} set onload(_) {} set onerror(_) {} },
  performance: { now: () => 1000 },
  setTimeout: noop,
  clearTimeout: noop,
  requestAnimationFrame: noop,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Map, Set, URLSearchParams
};
sb.window.location = { search: '' };
sb.window.localStorage = sb.localStorage;
sb.globalThis = sb;
vm.createContext(sb);

['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'map-system.js']
  .forEach((file) => vm.runInContext(read(file), sb, { filename: file }));

const MapSystem = sb.window.MapSystem;
const ms = new MapSystem();

const rows = [];
const faceForDirection = { north: 'up', south: 'down', west: 'left', east: 'right' };
for (const [from, map] of Object.entries(ms.maps)) {
  for (const exit of (map.exits || [])) {
    if (!exit.to) continue;
    const to = ms.normalizeMapId(exit.to);
    const target = ms.maps[to];
    const row = { from, to, auto: !!exit.autoEnter, visible: exit.visible !== false, exit };
    if (!target) {
      row.problem = 'missing target';
      rows.push(row);
      continue;
    }
    const reverse = (target.exits || []).find((candidate) => ms.normalizeMapId(candidate.to) === from);
    row.hasReverse = !!reverse;
    if (!reverse) {
      row.problem = 'no reverse';
      rows.push(row);
      continue;
    }

    row.hasConfiguredSpawn = Number.isFinite(exit.spawnX) && Number.isFinite(exit.spawnY);
    if (!row.hasConfiguredSpawn) {
      row.problem = 'missing configured spawn';
      rows.push(row);
      continue;
    }

    const scale = target.worldScale || 1;
    const raw = {
      x: Math.round(exit.spawnX * scale),
      y: Math.round(exit.spawnY * scale)
    };
    const expected = ms.findSafeSpawnPoint(target, raw.x, raw.y, 24);

    // transitionToMap を通った通常遷移と同じ pending 状態で実測する。
    ms.previousMap = from;
    ms._pendingSpawnFrom = from;
    ms._pendingSpawnTo = to;
    const spawn = ms.getSpawnPoint({ ...exit, to }, null);
    row.spawn = spawn;
    row.expected = expected;
    row.raw = raw;
    row.matchesConfigured = spawn.x === expected.x && spawn.y === expected.y;
    row.correctionDistance = Math.round(Math.hypot(expected.x - raw.x, expected.y - raw.y));
    row.safe = ms.isSafeSpawnPoint(target, spawn.x, spawn.y, 24);
    row.free = ms.spawnFreeDirections(target, spawn.x, spawn.y, 24);
    row.expectedFacing = exit.spawnFace || faceForDirection[exit.direction] || null;
    row.facingMatches = !row.expectedFacing || spawn.facing === row.expectedFacing;
    rows.push(row);
  }
}

const problems = rows.filter((row) => row.problem || !row.hasReverse || !row.matchesConfigured || !row.safe || row.free < 2 || !row.facingMatches);
const corrected = rows.filter((row) => row.correctionDistance > 2);
const thinTriggers = rows.filter((row) => {
  const min = Math.min(row.exit.width || 0, row.exit.height || 0);
  const max = Math.max(row.exit.width || 0, row.exit.height || 0);
  return row.visible && !row.auto && min < 28 && max < 96;
});

console.log('\n=== 全マップ遷移スポーン計器 ===\n');
console.log(`出口: ${rows.length}`);
console.log(`設定座標なし/座標不一致/危険スポーン/向き不一致: ${problems.length}`);
console.log(`設定値から安全補正された座標: ${corrected.length}`);
console.log(`薄すぎる可視トリガー: ${thinTriggers.length}`);

if (problems.length) {
  console.log('\n[問題]');
  problems.forEach((row) => {
    const why = row.problem || [
      !row.matchesConfigured ? `configured=${row.expected && `${row.expected.x},${row.expected.y}`}` : '',
      !row.safe ? 'not-safe' : '',
      row.free < 2 ? `free=${row.free}` : '',
      !row.facingMatches ? `facing=${row.spawn && row.spawn.facing} expected=${row.expectedFacing}` : ''
    ].filter(Boolean).join(',');
    const sp = row.spawn ? ` spawn=${row.spawn.x},${row.spawn.y}` : '';
    console.log(`  ${row.from} -> ${row.to}: ${why}${sp}`);
  });
}

if (corrected.length) {
  console.log('\n[安全補正]');
  corrected.forEach((row) => {
    console.log(`  ${row.from} -> ${row.to}: raw=${row.raw.x},${row.raw.y} safe=${row.expected.x},${row.expected.y} delta=${row.correctionDistance}`);
  });
}

if (thinTriggers.length) {
  console.log('\n[薄いトリガー]');
  thinTriggers.forEach((row) => {
    console.log(`  ${row.from} -> ${row.to}: ${Math.round(row.exit.width)}x${Math.round(row.exit.height)} @${Math.round(row.exit.x)},${Math.round(row.exit.y)}`);
  });
}

const pass = problems.length === 0 && corrected.length === 0 && thinTriggers.length === 0;
console.log(`\n${pass ? '✅ 全PASS: 全出口が設定済み座標・向きを再現し、安全に移動できる' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
