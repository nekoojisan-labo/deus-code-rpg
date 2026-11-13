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

const assert = require('assert');
function inspect() {
 const stack=[], labels=[], boxes=[];
 const ctx={globalAlpha:.73,font:'original',textAlign:'left',textBaseline:'top',
 save(){stack.push({globalAlpha:this.globalAlpha,font:this.font,textAlign:this.textAlign,textBaseline:this.textBaseline})},
 restore(){Object.assign(this,stack.pop())},measureText(t){return {width:t.length*12}},
 fillRect(...r){boxes.push(r)},strokeRect(){},fillText(...a){labels.push(a)}};
 ms.drawExitGuides(ctx,{width:800,height:450});
 assert.equal(stack.length,0); assert.equal(ctx.globalAlpha,.73); assert.equal(ctx.font,'original');
 for(const [label,x,y,w] of labels){assert.equal(typeof label,'string');assert(label.length);assert([x,y,w].every(Number.isFinite));}
 for(const [x,y,w,h] of boxes){assert([x,y,w,h].every(Number.isFinite));assert(x>=0&&y>=0&&x+w<=800&&y+h<=450);}
 return labels;
}
const maps=ms.maps;
ms.camera={x:0,y:0}; ms.maps={test:{exits:[]},target:{name:'Target'}}; ms.currentMap='test';
const e={x:0,y:0,width:20,height:20,to:'target',direction:'north'};
function one(extra={}){ms.maps.test.exits=[{...e,...extra}];return inspect().length;}
assert.equal(one(),1);
assert.equal(one({locked:true}),0);
assert.equal(one({requiredFlag:'unlocked'}),0);
sb.window.storyFlags={unlocked:true};assert.equal(one({requiredFlag:'unlocked'}),1);
assert.equal(one({visible:false}),0);
assert.equal(one({visible:false,autoEnter:true}),1);
assert.equal(one({x:780,y:430}),1);
assert.equal(one({x:-100}),0);
ms.maps=maps;
let count=0,labels=0;
for(const [id,map] of Object.entries(maps)) {
 ms.currentMap=id;
 sb.window.storyFlags=Object.fromEntries((map.exits||[]).filter(e=>e.requiredFlag).map(e=>[e.requiredFlag,true]));
 // Center each actual exit in the viewport to exercise all map coordinate ranges.
 for(const exit of (map.exits||[])) {
  ms.camera={x:exit.x+exit.width/2-400,y:exit.y+exit.height/2-225};
  labels+=inspect().length; count++;
 }
}
console.log(`PASS: gate, hidden, camera clipping, state restoration; ${Object.keys(maps).length} maps / ${count} exit-centered views / ${labels} labels checked`);