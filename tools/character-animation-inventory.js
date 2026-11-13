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

const rows=[];
for(const [mapId,map] of Object.entries(ms.maps)) for(const [index,npc] of (map.npcs||[]).entries()) {
 const sprite=ms.getNPCSpritePath(npc);
 rows.push({map:mapId,mapName:map.name,index,id:npc.id||null,name:npc.name,emoji:npc.emoji||null,sprite,spriteExists:sprite?fs.existsSync(path.join(root,sprite.split('?')[0])):false,walkSprite:ms.isCharacterWalkSpritePath(sprite),hostile:!!npc.hostile,boss:!!npc.boss,static:!!npc.static,shop:!!npc.shop,motion:ms.getNPCMotionSpec(npc),classification:sprite&&sprite.includes('/objects/')?'object':(npc.hostile||npc.boss)?'enemy':sprite&&sprite.includes('/characters/')?'human':'nonhuman_npc',animationNeeds:{idle:true,walkFourDirections:!!ms.getNPCMotionSpec(npc),directionalIdle:ms.isCharacterWalkSpritePath(sprite)},basis:'Evaluated MapSystem constructor and getNPCSpritePath/getNPCMotionSpec; classification provisional for non-character sprites'});
}
const data={generatedAt:new Date().toISOString(),sourceRevision:'1286fb4 with local rendering edits',player:{name:'カイト',sprite:'assets/characters/sprites/kaito_walk.webp',animationNeeds:{idle:true,walkFourDirections:true,directionalIdle:true}},npcInstances:rows,summary:{maps:Object.keys(ms.maps).length,npcInstances:rows.length,uniqueResolvedSprites:[...new Set(rows.map(r=>r.sprite).filter(Boolean))],missingOrNonWalk:rows.filter(r=>!r.walkSprite).map(r=>({map:r.map,name:r.name,sprite:r.sprite,classification:r.classification}))}};
fs.writeFileSync(path.join(root,'docs/character-animation-inventory.json'),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify(data.summary,null,2));