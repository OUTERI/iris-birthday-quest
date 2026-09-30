const assert=require('node:assert/strict');
const D=require('../docs/quest-data.js'),R=require('../docs/quest-rules.js');
const perm=a=>a.length?a.flatMap((v,i)=>perm(a.filter((_,j)=>j!==i)).map(rest=>[v,...rest])):[[]];
const mails=[];
for(const order of perm(['A','B','C','D']))for(const seals of perm(['star','key','moon','heart'])){
  if(order[0]==='B'&&order.indexOf('D')+1===order.indexOf('A')&&!['heart','star'].includes(seals[order.indexOf('A')])&&seals[3]==='heart'&&seals.indexOf('key')+1===seals.indexOf('moon'))mails.push({order,seals});
}
assert.equal(mails.length,1);assert.ok(R.postal(mails[0].order,mails[0].seals));
const powers=perm([1,2,3,4]).filter(([a,b,c,d])=>a+b===3&&a+c===6&&b+c===5&&c+d===7);
assert.equal(powers.length,1);assert.ok(R.powers(powers[0]));
const brews=perm(['A','B','C','D']).map(p=>p.slice(0,3)).filter((p,i,a)=>a.findIndex(x=>x.join('')===p.join(''))===i).filter(([a,b,c])=>['A','C'].includes(a)&&['A','C'].includes(b)&&['B','D'].includes(c)&&powers[0][a.charCodeAt(0)-65]<powers[0][b.charCodeAt(0)-65]&&powers[0][a.charCodeAt(0)-65]+powers[0][b.charCodeAt(0)-65]-powers[0][c.charCodeAt(0)-65]===5);
assert.equal(brews.length,1);assert.ok(R.brew(brews[0]));
const tables=[];
for(const g of perm(['owl','fox','deer','ghost']))for(const d of perm(['moon','leaf','flame','empty'])){
  if(d[g.indexOf('ghost')]==='empty'&&g[0]==='owl'&&(g.indexOf('ghost')+1)%4===g.indexOf('owl')&&(g.indexOf('fox')+1)%4===g.indexOf('deer')&&(d.indexOf('empty')+2)%4===d.indexOf('leaf')&&!['leaf','flame'].includes(d[0]))tables.push({g,d});
}
assert.equal(tables.length,1);assert.ok(R.table(tables[0].g,tables[0].d));
const runeIds=D.runes.map(r=>r.id),offsets=[['moon',2],['key',-1],['star',3]];
const mirror=offsets.map(([id,n])=>runeIds[(runeIds.indexOf(id)+n+8)%8]).reverse();assert.ok(R.mirror(mirror));
let maps=[];
function search(board,used){if(board.length===6){maps.push(board);return;}const n=board.length,row=Math.floor(n/3),col=n%3;
  for(const t of D.tiles)if(!used.includes(t.id))for(let rotation=0;rotation<4;rotation++){
    if(t.id==='1'&&rotation!==0)continue;
    const e=Array.from({length:4},(_,dir)=>t.edges[(dir-rotation+4)%4]);
    if((row===0)!==(e[0]==='')||(col===2)!==(e[1]==='')||(row===1)!==(e[2]==='')||(col===0)!==(e[3]===''))continue;
    if(col>0&&board[n-1].e[1]!==e[3]||row>0&&board[n-3].e[2]!==e[0])continue;
    search([...board,{id:t.id,rotation:rotation*90,e}],[...used,t.id]);
  }
}
search([],[]);assert.equal(maps.length,1);assert.ok(R.tiles(maps[0].map(t=>t.id),Object.fromEntries(maps[0].map(t=>[t.id,t.rotation]))));
const alignments=[];
for(let r=0;r<4;r++)for(const m of [false,true]){
  if(D.anchors.every(a=>{let x=a.x-50,y=a.y-50;if(m)x=-x;for(let i=0;i<r;i++)[x,y]=[-y,x];return x+50===a.x&&y+50===a.y;}))alignments.push({r,m});
}
assert.equal(alignments.length,1);assert.ok(R.sky(alignments[0].r,alignments[0].m));
const s=D.stars;
const selected=[s.filter(s=>s.x===20&&s.y>20).sort((a,b)=>b.y-a.y)[0],s.find(s=>s.x===50&&s.y===20),s.filter(s=>s.x===65&&s.y<80).sort((a,b)=>a.y-b.y)[0],s.find(s=>s.x===80&&s.y>45)];
assert.ok(R.stars(selected.map(s=>s.id)));assert.equal(selected.map(s=>s.letter).join(''),'IRIS');
assert.deepEqual(D.missions.map(m=>m.seal),['20','05','10','02','24','11']);
assert.equal(R.normalize('０５'),'05');assert.ok(!R.powers([1,2,3,4]));
console.log('PASS: all six puzzle models have a unique solution; shared validators, symbols and marks agree.');
