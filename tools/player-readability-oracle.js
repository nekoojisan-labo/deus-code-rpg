const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'),'utf8');
const source = html.slice(html.indexOf('        function drawPlayer() {'), html.indexOf('        function updatePlayer() {'));
for(const facing of ['up','down','left','right']) for(const moving of [false,true]) {
 const calls=[]; const stack=[];
 const ctx={globalAlpha:.37,globalCompositeOperation:'multiply',imageSmoothingEnabled:true,shadowBlur:0,shadowColor:'transparent',shadowOffsetX:0,shadowOffsetY:0,
 save(){stack.push(Object.fromEntries(Object.entries(this).filter(([k,v])=>typeof v!=='function')))},restore(){Object.assign(this,stack.pop())},beginPath(){},ellipse(){},fill(){},drawImage(...args){calls.push({alpha:this.globalAlpha,op:this.globalCompositeOperation,args,blur:this.shadowBlur})}};
 const sandbox={ctx,player:{x:400,y:300,facing,isMoving:moving,animTime:200},playerSpriteLoaded:true,playerSprite:{},mapSystem:{worldToScreenPoint:(x,y)=>({x,y}),computeWalkFrame:()=>({sx:0,sy:0,sw:72,sh:92})}};
 vm.createContext(sandbox);vm.runInContext(source+';drawPlayer();',sandbox);
 assert.equal(calls.length,2); for(const call of calls){assert.equal(call.alpha,1);assert.equal(call.op,'source-over');assert.deepEqual(call.args.slice(-4),[374,240,52,66]);}
 assert.equal(ctx.globalAlpha,.37);assert.equal(ctx.globalCompositeOperation,'multiply');assert.equal(ctx.imageSmoothingEnabled,true);assert.equal(ctx.shadowBlur,0);assert.equal(stack.length,0);
}
console.log('PASS: 8 facing/motion cases; opaque body, unchanged footprint, restored canvas state. Visual contrast not measured by this mock test.');
