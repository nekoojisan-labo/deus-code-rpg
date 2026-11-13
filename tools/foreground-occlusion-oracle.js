const fs = require('fs');
const assert = require('assert');
const s = fs.readFileSync('map-system.js', 'utf8');
const body = s.slice(s.indexOf('    drawWorldEntities('), s.indexOf('    // Render after world entities', s.indexOf('    drawWorldEntities(')));
const proto = Function('return ({' + body + '})')();
function probe(x,y,z,objectLayer=true) {
 const seen=[]; const stack=[]; const ctx={globalAlpha:1,save(){stack.push(this.globalAlpha)},restore(){this.globalAlpha=stack.pop()}};
 const ms={currentMap:'m', maps:{m:{objects:[{x,y,z,w:40,h:100}],npcs:[]}},isObjectLayerMap:()=>objectLayer,getMapScale:()=>1,drawObject(c){seen.push(c.globalAlpha)},drawNPCs(){},drawSingleNPC(){},isNPCHidden:()=>false};
 proto.drawWorldEntities.call(ms,ctx,{x:100,y:100},{},()=>assert.equal(ctx.globalAlpha,1));
 assert.equal(ctx.globalAlpha,1); return seen;
}
assert.deepEqual(probe(100,130),[.45]);
assert.deepEqual(probe(200,130),[1]);
assert.deepEqual(probe(100,80),[1]);
assert.deepEqual(probe(138,130),[1]);
assert.deepEqual(probe(100,130,50),[1]);
assert.deepEqual(probe(100,130,undefined,false),[]);
console.log('PASS: overlap, no overlap, behind, edge, explicit depth, legacy map; alpha restored');