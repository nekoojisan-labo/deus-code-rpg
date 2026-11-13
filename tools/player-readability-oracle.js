const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'),'utf8');
const source = html.slice(html.indexOf('        function drawPlayer() {'), html.indexOf('        function updatePlayer() {'));
// 契約: 縁取りのため drawImage を2回。2回とも「同じ画像・同じコマ」・不透明・同じ足元の描画先。
// 画像とコマは mapSystem.selectCharacterFrame が決める(歩行中=歩行シート / 停止中=待機シート)。
const walkSheet={name:'walk'}, idleSheet={name:'idle'};
let cases=0;
for(const facing of ['up','down','left','right']) for(const moving of [false,true]) {
 const calls=[]; const stack=[]; const asked=[];
 const ctx={globalAlpha:.37,globalCompositeOperation:'multiply',imageSmoothingEnabled:true,shadowBlur:0,shadowColor:'transparent',shadowOffsetX:0,shadowOffsetY:0,
 save(){stack.push(Object.fromEntries(Object.entries(this).filter(([k,v])=>typeof v!=='function')))},restore(){Object.assign(this,stack.pop())},beginPath(){},ellipse(){},fill(){},drawImage(...args){calls.push({alpha:this.globalAlpha,op:this.globalCompositeOperation,args,blur:this.shadowBlur})}};
 const mapSystem={worldToScreenPoint:(x,y)=>({x,y}),getAnimClockMs:()=>1234,
  computeWalkFrame:()=>({sx:0,sy:0,sw:72,sh:92}),
  selectCharacterFrame:(walk,idle,f,m,anim,clock)=>{asked.push({walk,idle,f,m,anim,clock});return m?{image:walk,sx:144,sy:0,sw:72,sh:92}:{image:idle,sx:72,sy:0,sw:72,sh:92};}};
 const sandbox={ctx,player:{x:400,y:300,facing,isMoving:moving,animTime:200},playerSpriteLoaded:true,playerSprite:walkSheet,playerIdleSprite:idleSheet,mapSystem};
 vm.createContext(sandbox);vm.runInContext(source+';drawPlayer();',sandbox);
 assert.equal(asked.length,1,'selectCharacterFrame called once per draw');
 assert.equal(asked[0].walk,walkSheet); assert.equal(asked[0].idle,idleSheet); assert.equal(asked[0].f,facing); assert.equal(asked[0].m,moving); assert.equal(asked[0].anim,200); assert.equal(asked[0].clock,1234);
 assert.equal(calls.length,2);
 const expectImg = moving ? walkSheet : idleSheet, expectSx = moving ? 144 : 72;
 for(const call of calls){assert.equal(call.alpha,1);assert.equal(call.op,'source-over');assert.equal(call.args[0],expectImg);assert.deepEqual(call.args.slice(1,5),[expectSx,0,72,92]);assert.deepEqual(call.args.slice(-4),[374,240,52,66]);}
 assert.deepEqual(calls[0].args,calls[1].args,'outline passes draw the same image and frame');
 assert.equal(ctx.globalAlpha,.37);assert.equal(ctx.globalCompositeOperation,'multiply');assert.equal(ctx.imageSmoothingEnabled,true);assert.equal(ctx.shadowBlur,0);assert.equal(stack.length,0);
 cases++;
}
console.log(`PASS: ${cases} facing/motion cases; frame chosen by selectCharacterFrame (walk sheet while moving, idle sheet while stopped), both outline passes share image+frame, opaque body, unchanged footprint, restored canvas state. Visual contrast not measured by this mock test.`);
