// map-asset-oracle.js — Runtime map asset coverage check.
// Fails when visible map NPCs, enemies, object-layer props, or save points would
// fall back to emoji/text instead of an in-world rendered asset.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const noop = () => {};

function fakeEl() {
  return {
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    classList: { add: noop, remove: noop, contains: () => false, toggle: noop },
    setAttribute: noop,
    getAttribute: () => null,
    appendChild: noop,
    querySelector: () => null
  };
}

class FakeImage {
  constructor() {
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
  }
}

const document = {
  getElementById: () => fakeEl(),
  querySelector: () => null,
  createElement: () => fakeEl(),
  addEventListener: noop,
  removeEventListener: noop
};

const sb = {
  console,
  window: {},
  document,
  Image: FakeImage,
  performance: { now: () => 1000 },
  setTimeout: noop,
  clearTimeout: noop,
  requestAnimationFrame: noop,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  Math,
  JSON,
  Object,
  Array,
  Number,
  String,
  Boolean,
  Map,
  Set,
  isNaN,
  parseInt,
  parseFloat,
  Date
};
sb.window.location = { search: '' };
sb.globalThis = sb;
vm.createContext(sb);

['object-catalog.js', 'map-objects-data.js', 'map-system.js'].forEach(file => {
  vm.runInContext(read(file), sb, { filename: file });
});

const ms = new sb.window.MapSystem();

function existsAsset(assetPath) {
  return typeof assetPath === 'string' && fs.existsSync(path.join(root, assetPath.split('?')[0]));
}

function isVisibleNpc(npc) {
  return npc && npc.visible !== false && npc.hidden !== true;
}

const missingNpc = [];
const missingObject = [];
const missingSave = [];
const objectFallbacks = [];
const mapSummary = [];

Object.entries(ms.maps).forEach(([mapId, map]) => {
  if (!map) return;
  ms.prepareScrollableMap(map);
  const npcs = Array.isArray(map.npcs) ? map.npcs.filter(isVisibleNpc) : [];
  const objects = Array.isArray(map.objects) ? map.objects.filter(o => o && o.visible !== false) : [];
  mapSummary.push(`${mapId}: npcs=${npcs.length} objects=${objects.length} objectLayer=${map.objectLayer === true}`);

  npcs.forEach(npc => {
    const spritePath = ms.getNPCSpritePath(npc);
    if (!existsAsset(spritePath)) {
      missingNpc.push({
        mapId,
        name: npc.name || '(unnamed)',
        emoji: npc.emoji || '',
        hostile: !!npc.hostile,
        spritePath: spritePath || ''
      });
    }
  });

  objects.forEach(object => {
    if (!object.sprite && object.visible !== false) {
      objectFallbacks.push({ mapId, kind: object.kind || '', id: object.id || '' });
      return;
    }
    if (object.sprite && !existsAsset(object.sprite)) {
      missingObject.push({ mapId, kind: object.kind || '', id: object.id || '', sprite: object.sprite });
    }
  });

  if (map.savePoint) {
    const spritePath = typeof ms.getSavePointSpritePath === 'function'
      ? ms.getSavePointSpritePath(map.savePoint)
      : '';
    if (!existsAsset(spritePath)) {
      missingSave.push({
        mapId,
        name: map.savePoint.name || '(save point)',
        emoji: map.savePoint.emoji || '',
        spritePath: spritePath || ''
      });
    }
  }
});

const mapSystemSource = read('map-system.js');
const emojiFillTextLines = mapSystemSource
  .split('\n')
  .map((line, index) => ({ line: index + 1, text: line }))
  .filter(entry => (
    /ctx\.fillText\(['"`][\p{Extended_Pictographic}]/u.test(entry.text) ||
    /ctx\.fillText\([^)]*\.emoji\b/.test(entry.text)
  ));

console.log('\n=== Map Asset Oracle ===\n');
console.log(mapSummary.join('\n'));
console.log('');

let pass = true;
function report(label, items) {
  if (items.length === 0) {
    console.log(`✅ ${label}: 0`);
    return;
  }
  pass = false;
  console.log(`❌ ${label}: ${items.length}`);
  items.slice(0, 30).forEach(item => console.log(`  - ${JSON.stringify(item)}`));
  if (items.length > 30) console.log(`  ... and ${items.length - 30} more`);
}

report('NPC/enemy sprite missing', missingNpc);
report('object sprite missing', missingObject);
report('visible object without sprite', objectFallbacks);
report('save point sprite missing', missingSave);
report('map ctx.fillText emoji fallback lines', emojiFillTextLines);

console.log(`\n${pass ? '✅ PASS: map runtime has no emoji/text asset fallback for visible entities' : '❌ FAIL: map asset fallback remains'}`);
process.exit(pass ? 0 : 1);
