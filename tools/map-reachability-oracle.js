// 全マップの到着スポーンから、そのマップ内の全出入口へ歩いて到達できるかを検査する。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const noop = () => {};
const fakeEl = () => ({
  style: {}, dataset: {},
  classList: { add: noop, remove: noop, contains: () => false, toggle: noop },
  appendChild: noop, remove: noop, querySelector: () => null, querySelectorAll: () => [],
  addEventListener: noop, removeEventListener: noop, setAttribute: noop, getAttribute: () => null
});

const sb = {
  console: { log: noop, warn: noop, error: noop },
  window: { location: { search: '' } },
  document: {
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    createElement: fakeEl, body: fakeEl()
  },
  Image: class { set src(_) {} set onload(_) {} set onerror(_) {} },
  performance: { now: () => 1000 }, setTimeout: noop, clearTimeout: noop,
  requestAnimationFrame: noop,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Map, Set, URLSearchParams
};
sb.globalThis = sb;
vm.createContext(sb);
['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'map-system.js']
  .forEach((file) => vm.runInContext(read(file), sb, { filename: file }));

const ms = new sb.window.MapSystem();
const STEP = 10;
const BODY = 24;
const DIRS = [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP], [STEP, STEP], [STEP, -STEP], [-STEP, STEP], [-STEP, -STEP]];

function touchesExit(x, y, exit, map) {
  const scale = map.worldScale || 1;
  const left = exit.x;
  const right = exit.x + (exit.width || 0);
  const top = exit.y;
  const bottom = exit.y + (exit.height || 0);

  if (exit.autoEnter) {
    const reach = Math.round(28 * scale);
    const lateral = Math.round(14 * scale);
    const facing = exit.requireFacing || ({ north: 'up', south: 'down', west: 'left', east: 'right' }[exit.direction]);
    if (facing === 'up') return x >= left - lateral && x <= right + lateral && y >= top && y <= bottom + reach;
    if (facing === 'down') return x >= left - lateral && x <= right + lateral && y <= bottom && y >= top - reach;
    if (facing === 'left') return y >= top - lateral && y <= bottom + lateral && x >= left && x <= right + reach;
    if (facing === 'right') return y >= top - lateral && y <= bottom + lateral && x <= right && x >= left - reach;
  }

  if (exit.visible === false) {
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    const range = 34 * scale;
    return Math.hypot(x - cx, y - cy) <= range || (x >= left && x <= right && y >= top && y <= bottom);
  }

  const margin = Math.max(8, Math.round(8 * scale));
  const half = BODY / 2;
  return x + half + margin >= left && x - half - margin <= right &&
    y + half + margin >= top && y - half - margin <= bottom;
}

function reachableExitIndexes(map, spawn) {
  const exits = (map.exits || []).filter(exit => exit && exit.to);
  const reached = new Set();
  const queue = [{ x: spawn.x, y: spawn.y }];
  const seen = new Set([`${Math.round(spawn.x)},${Math.round(spawn.y)}`]);
  let cursor = 0;

  while (cursor < queue.length && reached.size < exits.length) {
    const point = queue[cursor++];
    exits.forEach((exit, index) => {
      if (!reached.has(index) && touchesExit(point.x, point.y, exit, map)) reached.add(index);
    });

    for (const [dx, dy] of DIRS) {
      const x = Math.round(point.x + dx);
      const y = Math.round(point.y + dy);
      const key = `${x},${y}`;
      if (seen.has(key) || !ms.isMapPositionWalkable(map, x, y, BODY)) continue;
      seen.add(key);
      queue.push({ x, y });
    }
  }

  return { reached, exits, visited: seen.size };
}

const incoming = new Map();
for (const [from, map] of Object.entries(ms.maps)) {
  for (const exit of (map.exits || [])) {
    if (!exit || !exit.to) continue;
    const to = ms.normalizeMapId(exit.to);
    if (!incoming.has(to)) incoming.set(to, []);
    incoming.get(to).push({ from, exit });
  }
}

const failures = [];
let checks = 0;
for (const [mapId, map] of Object.entries(ms.maps)) {
  const arrivals = incoming.get(mapId) || [];
  for (const arrival of arrivals) {
    ms.previousMap = arrival.from;
    ms._pendingSpawnFrom = arrival.from;
    ms._pendingSpawnTo = mapId;
    const spawn = ms.getSpawnPoint({ ...arrival.exit, to: mapId }, null);
    const result = reachableExitIndexes(map, spawn);
    checks++;
    const missing = result.exits
      .map((exit, index) => ({ exit, index }))
      .filter(entry => !result.reached.has(entry.index));
    if (missing.length) {
      failures.push({ mapId, from: arrival.from, spawn, visited: result.visited, missing });
    }
  }
}

console.log('\n=== 全マップ可動域・到達性検査 ===\n');
console.log(`到着経路=${checks} / 到達不能=${failures.length}`);
for (const failure of failures) {
  console.log(`  ${failure.from} -> ${failure.mapId} spawn=${failure.spawn.x},${failure.spawn.y} visited=${failure.visited}`);
  for (const { exit } of failure.missing) console.log(`    未到達: ${failure.mapId} -> ${ms.normalizeMapId(exit.to)}`);
}

const pass = checks > 0 && failures.length === 0;
console.log(`\n${pass ? 'PASS: すべての到着スポーンから同一マップ内の全出入口へ到達可能' : 'FAIL: 分断された可動域あり'}`);
process.exit(pass ? 0 : 1);
