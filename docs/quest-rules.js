(function(root){
  'use strict';
  const rules={
    postal:(o,s)=>o.join('')==='BDAC'&&s.join(',')==='star,key,moon,heart',
    powers:v=>v.join(',')==='2,1,4,3', brew:v=>v.join(',')==='A,C,B',
    table:(g,d)=>g.join(',')==='owl,fox,deer,ghost'&&d.join(',')==='moon,leaf,flame,empty',
    mirror:v=>v.join(',')==='flame,star,key',
    tiles:(s,r)=>s.join(',')==='1,A,3,4,2,B'&&s.every(id=>r[id]===0),
    sky:(r,m)=>r===0&&m===false, stars:v=>v.join(',')==='I1,R,I2,S',
    normalize:v=>String(v||'').normalize('NFKC').trim().toLowerCase().replace(/[\s，。,.·\-_/]/g,'')
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=rules;else root.QuestRules=rules;
})(typeof globalThis!=='undefined'?globalThis:this);
