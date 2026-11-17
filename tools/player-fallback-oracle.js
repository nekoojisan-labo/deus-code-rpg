// player-fallback-oracle.js — 主人公の歩行画像が webp も png も読めない時に、
// drawPlayer が影だけを描いて主人公が消える穴を塞いだことを確かめる。
// 契約: 画像が読めていない時は絵文字を1回だけ描き、足元(影の位置)に合わせ、Canvas の状態を戻す。
//       画像が読めている時は絵文字を描かない(縁取りの drawImage 2回だけ)。
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const source = html.slice(html.indexOf('        function drawPlayer() {'), html.indexOf('        function updatePlayer() {'));

function run(loaded) {
  const texts = [], images = [], stack = [];
  const ctx = {
    globalAlpha: 0.37, font: '10px serif', textAlign: 'start', textBaseline: 'alphabetic', fillStyle: '#123',
    imageSmoothingEnabled: true, shadowBlur: 0, shadowColor: 'transparent', shadowOffsetX: 0, shadowOffsetY: 0, globalCompositeOperation: 'multiply',
    save() { stack.push(Object.fromEntries(Object.entries(this).filter(([, v]) => typeof v !== 'function'))); },
    restore() { Object.assign(this, stack.pop()); },
    beginPath() {}, ellipse() {}, fill() {},
    fillText(t, x, y) { texts.push({ t, x, y, align: this.textAlign, base: this.textBaseline, alpha: this.globalAlpha }); },
    drawImage(...a) { images.push(a); }
  };
  const mapSystem = {
    worldToScreenPoint: (x, y) => ({ x, y }), getAnimClockMs: () => 0,
    computeWalkFrame: () => ({ sx: 0, sy: 0, sw: 72, sh: 92 }),
    selectCharacterFrame: (walk) => ({ image: walk, sx: 0, sy: 0, sw: 72, sh: 92 })
  };
  const sandbox = { ctx, player: { x: 400, y: 300, facing: 'down', isMoving: false, animTime: 0 },
    playerSpriteLoaded: loaded, playerSprite: {}, playerIdleSprite: {}, mapSystem };
  vm.createContext(sandbox);
  vm.runInContext(source + ';drawPlayer();', sandbox);
  return { texts, images, ctx, stack };
}

// 画像が読めない時: 絵文字で主人公を描く
const failed = run(false);
assert.equal(failed.images.length, 0, '画像が無い時は drawImage しない');
assert.equal(failed.texts.length, 1, '画像が無い時は絵文字を1回描く(影だけで主人公が消えない)');
assert.ok(failed.texts[0].t.length > 0, '描く文字は空でない');
assert.equal(failed.texts[0].x, 400, '左右は足元の中心');
assert.equal(failed.texts[0].y, 306, '下端は画像を描く時と同じ足元(y+6)');
assert.equal(failed.texts[0].align, 'center');
assert.equal(failed.texts[0].base, 'bottom');
assert.equal(failed.texts[0].alpha, 1, '不透明で描く');
assert.equal(failed.ctx.font, '10px serif', 'Canvas の書体設定を戻す');
assert.equal(failed.ctx.textAlign, 'start');
assert.equal(failed.ctx.textBaseline, 'alphabetic');
assert.equal(failed.ctx.globalAlpha, 0.37);
assert.equal(failed.stack.length, 0);

// 画像が読めている時: 絵文字は描かない
const ok = run(true);
assert.equal(ok.texts.length, 0, '画像がある時は絵文字を描かない');
assert.equal(ok.images.length, 2, '画像がある時は縁取りの2回だけ');

console.log('PASS: 歩行画像が読めない時は足元に絵文字で主人公を描き、読めている時は描かない。Canvas の状態は元に戻る。');
