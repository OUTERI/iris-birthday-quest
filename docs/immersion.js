(function(root){
  'use strict';
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const content=()=>root.BirthdayContent;
  const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const picture=(name,alt)=>`<img src="./assets/${escape(name)}.webp" alt="${escape(alt)}" decoding="async">`;
  let current=null,disposers=[],typeTimer,secretTaps=[],castTimer,castFrame,casting=false;
  const listen=(element,event,fn,options)=>{element.addEventListener(event,fn,options);disposers.push(()=>element.removeEventListener(event,fn,options));};
  function haptic(pattern=[20]){try{navigator.vibrate?.(pattern);}catch{}}

  // Original procedural ambience, music and effects: no movie audio or remote requests.
  const audio={context:null,master:null,enabled:false,loop:null,wind:null,scene:'castle',beat:0,
    async enable(value){
      this.enabled=value;
      if(!value){this.stop();return;}
      const Context=root.AudioContext||root.webkitAudioContext;
      if(!Context)return;
      try{
        if(!this.context){this.context=new Context();this.master=this.context.createGain();this.master.gain.value=.28;this.master.connect(this.context.destination);}
        await this.context.resume();
        if(!this.enabled||document.hidden||this.loop)return;
        this.startWind();this.note(523,.22,.1);this.tick();this.loop=setInterval(()=>this.tick(),1900);
      }catch{current?.toast('声音暂时无法播放，可以继续无声探索。');}
    },
    note(frequency,duration=.4,volume=.1,delay=0,type='sine'){
      if(!this.enabled||this.context?.state!=='running')return;
      const t=this.context.currentTime+delay,osc=this.context.createOscillator(),gain=this.context.createGain();
      osc.type=type;osc.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(this.master);osc.start(t);osc.stop(t+duration+.04);
    },
    noise(duration=.15,volume=.05,frequency=1600){
      if(!this.enabled||this.context?.state!=='running')return;
      const c=this.context,buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),d=buffer.getChannelData(0);
      for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
      const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start();
    },
    startWind(){
      const c=this.context,b=c.createBuffer(1,c.sampleRate*3,c.sampleRate),d=b.getChannelData(0);let last=0;
      for(let i=0;i<d.length;i++){last=(last+Math.random()*.08-.04)/1.02;d[i]=last;}
      const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;s.loop=true;f.type='lowpass';f.frequency.value=430;g.gain.value=.055;s.connect(f);f.connect(g);g.connect(this.master);s.start();this.wind=s;
    },
    tick(){
      const melodies={castle:[392,523,659,587,440,523,392,329],hall:[523,659,784,659,587,440,523,392],potion:[293,392,440,523,392,349,293,440],chamber:[261,311,392,349,293,392,311,261],stars:[523,784,659,880,784,587,659,523]};
      const notes=melodies[this.scene]||melodies.castle;
      this.note(notes[this.beat++%notes.length],1.5,.045);this.noise(.045,.025,650);
    },
    effect(kind='page'){
      if(kind==='page')this.noise(.16,.08,2000);
      else if(kind==='seal'){this.noise(.11,.16,850);this.note(392,.3,.1);}
      else if(kind==='pour'){this.noise(.35,.1,700);this.note(196,.3,.08);}
      else if(kind==='wrong')this.note(174,.18,.07);
      else{[523,659,784,1046].forEach((n,i)=>this.note(n,.7,.09,i*.12));this.noise(.35,.04,3000);}
    },
    stop(){clearInterval(this.loop);this.loop=null;if(this.wind){this.wind.stop();this.wind=null;}if(this.context?.state==='running')this.context.suspend().catch(()=>{});}
  };

  const canvas=document.getElementById('magic-particles'),ctx=canvas.getContext('2d');
  let particles=[],particleFrame=0,lastTrail=0;
  function resize(){const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*ratio);canvas.height=Math.round(innerHeight*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);}
  function animateParticles(){
    if(!ctx)return;ctx.clearRect(0,0,innerWidth,innerHeight);
    particles=particles.filter(p=>p.life>0);
    for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity;p.life-=.025;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;
      if(p.confetti){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.life*9);ctx.fillRect(-3,-2,6,4);ctx.restore();}
      else{ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
    }
    ctx.globalAlpha=1;particleFrame=particles.length?requestAnimationFrame(animateParticles):0;
  }
  function burst(x=innerWidth/2,y=innerHeight/2,kind='gold',count=55){
    if(reduced()||document.hidden||!ctx)return;
    const colors=kind==='silver'?['#d3f5ff','#a6cde8','#fff']:kind==='confetti'?['#ab334c','#e3bd72','#f1db9c']:['#e0b969','#fff2c0','#bc8144'];
    for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=Math.random()*4+1;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(kind==='confetti'?3:0),gravity:kind==='confetti'?.11:0,life:1,size:Math.random()*1.8+.6,color:colors[i%colors.length],confetti:kind==='confetti'});}
    particles=particles.slice(-160);if(!particleFrame)particleFrame=requestAnimationFrame(animateParticles);
  }
  resize();root.addEventListener('resize',resize);
  document.body.classList.add('wand-ready');
  document.addEventListener('pointermove',e=>{
    if(reduced()||e.pointerType==='touch'&&e.buttons===0)return;
    document.body.style.setProperty('--parallax-x',`${(e.clientX/innerWidth-.5)*18}px`);document.body.style.setProperty('--parallax-y',`${(e.clientY/innerHeight-.5)*12}px`);
    if(performance.now()-lastTrail>45){lastTrail=performance.now();burst(e.clientX,e.clientY,'gold',2);}
  },{passive:true});
  document.addEventListener('pointerdown',e=>{
    if(current?.state.sound&&audio.context?.state!=='running')audio.enable(true);
    if(e.target.closest('button,select,input'))haptic();
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.stop();stopMic();cancelCast();particles=[];cancelAnimationFrame(particleFrame);particleFrame=0;ctx?.clearRect(0,0,innerWidth,innerHeight);}});
  root.addEventListener('pagehide',()=>{stopMic();audio.stop();});

  function mosaicHTML(state){return `<div class="memory-mosaic ${state.quests.every(q=>q.verified)?'complete':''}" aria-label="六枚记忆拼合的合影">${state.quests.map((q,i)=>`<i class="${q.verified?'unlocked':''}" style="--col:${i%3};--row:${Math.floor(i/3)};background-image:${q.verified?`url('./assets/${escape(content().finalePhoto)}.webp')`:'none'}"></i>`).join('')}</div>`;}
  function photosFor(index,state){const start=index*2;return state.memoryOrder.slice(start,start+2).map(id=>content().photos[id-1]);}
  function photoHTML(photos){return `<div class="memory-photo-stack">${photos.map(p=>`<figure>${picture(p.file,p.caption)}<figcaption>${escape(p.caption)}</figcaption></figure>`).join('')}</div>`;}
  function memoryHTML(index,state){const w=content().wishes[index];return `<div class="memory-vessel artifact"><span class="memory-number">第 ${index+1} 枚记忆封印已解开</span><p class="script">A wish for you.</p>${photoHTML(photosFor(index,state))}<h2>${escape(w.title)}</h2><blockquote>${escape(w.text)}</blockquote><p class="memory-npc">猫头鹰信使：这些照片，已经留在你的冥想盆里。它们会一直等你回来翻阅。</p><div class="actions"><button class="button hold-spell" data-action="continue-memory">${index===5?'让六枚碎片相聚':'收好祝福，继续旅程'}</button><button class="button quiet" data-hardware="pensieve">潜入 3D 冥想盆</button></div></div>`;}
  function collectionHTML(state){return `${mosaicHTML(state)}<p class="final-memory-note">实体印记让记忆逐一显影。点一枚已点亮的封印，再看一次。</p><button class="button primary" data-hardware="pensieve">潜入 3D 冥想盆</button><div class="memory-gallery">${content().wishes.map((w,i)=>`<button class="memory-shard ${state.quests[i].verified?'unlocked':''}" data-memory="${i}" ${state.quests[i].verified?'':'disabled'}><span>${state.quests[i].verified?'✦':'◇'}</span>${state.quests[i].verified?escape(w.title):`封印 ${i+1}`}<small> ${state.quests[i].verified?'已解封':'尚未解封'}</small></button>`).join('')}</div><div id="memory-preview" class="memory-preview" hidden></div>`;}
  const ritualHTML=()=>`<section class="spell-ritual"><h3>Lumos</h3><p>在下方画一个 V 或一个圈，唤醒灯光。它会照亮阅读方法；纸卡上的隐形数字，仍需用现场的灯寻找。</p><canvas class="gesture-slate" aria-label="画符区域：画 V 或圆形"></canvas><div class="gesture-status" role="status">等待你的第一道咒语</div><div class="actions"><button class="button secondary" data-magic="clear-gesture">重新画符</button><button class="button quiet" data-magic="lumos-fallback">直接点亮并阅读全文</button></div><div class="lumos-paper"><div class="hidden-ink">让光停在纸卡的三个符文旁。先计算它们各自移动后的结果，再让镜子从右向左读。保留这个顺序，下一课也会需要它。</div><small>施咒后，移动手指或魔杖，让文字在光圈中显影。</small></div></section>`;
  function isGesture(points){
    if(points.length<8)return false;
    const xs=points.map(p=>p.x),ys=points.map(p=>p.y),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);
    if(w<40||h<28)return false;
    const first=points[0],last=points.at(-1),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const length=points.slice(1).reduce((s,p,i)=>s+dist(p,points[i]),0);
    if(dist(first,last)<Math.max(w,h)*.32&&w/h>.55&&w/h<1.9&&length>2.25*Math.max(w,h)){
      const center={x:(Math.max(...xs)+Math.min(...xs))/2,y:(Math.max(...ys)+Math.min(...ys))/2};
      const radii=points.map(p=>dist(p,center)),mean=radii.reduce((a,b)=>a+b,0)/radii.length;
      return radii.filter(r=>r>mean*.5&&r<mean*1.6).length/points.length>.85;
    }
    const bottom=ys.indexOf(Math.max(...ys)),tip=points[bottom];
    if(bottom<points.length*.2||bottom>points.length*.8||first.y>tip.y-h*.6||last.y>tip.y-h*.6||Math.abs(first.x-last.x)<w*.65)return false;
    const lineDistance=(p,a,b)=>Math.abs((b.y-a.y)*p.x-(b.x-a.x)*p.y+b.x*a.y-b.y*a.x)/dist(a,b);
    return points.filter((p,i)=>lineDistance(p,i<=bottom?first:tip,i<=bottom?tip:last)<Math.max(13,w*.18)).length/points.length>.85;
  }
  function initGesture(){
    const slate=document.querySelector('.gesture-slate');if(!slate)return;
    const c=slate.getContext('2d'),box=slate.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);slate.width=box.width*ratio;slate.height=box.height*ratio;c.scale(ratio,ratio);c.strokeStyle='#e0edf4';c.lineWidth=3;c.lineCap='round';
    let points=[],active=null;
    const status=document.querySelector('.gesture-status'),paper=document.querySelector('.lumos-paper');
    const clear=()=>{c.clearRect(0,0,box.width,box.height);points=[];};
    const point=e=>{const b=slate.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top};};
    const light=(readable=false)=>{paper.classList.add('lit');if(readable)paper.classList.add('readable');current.state.quests[3].lumos=readable?'readable':'lit';current.save();status.textContent='Lumos！灯光醒来了。';audio.effect('magic');haptic([25,40,25]);burst(box.left+box.width/2,box.top+box.height/2,'silver',35);};
    if(current.state.quests[3].lumos){paper.classList.add('lit');if(current.state.quests[3].lumos==='readable')paper.classList.add('readable');status.textContent='灯光已经点亮。';}
    listen(slate,'pointerdown',e=>{e.preventDefault();clear();active=e.pointerId;slate.setPointerCapture(active);points.push(point(e));});
    listen(slate,'pointermove',e=>{if(e.pointerId!==active)return;const p=point(e),last=points.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)<2)return;points.push(p);c.beginPath();c.moveTo(last.x,last.y);c.lineTo(p.x,p.y);c.stroke();});
    listen(slate,'pointerup',e=>{if(e.pointerId!==active)return;active=null;if(isGesture(points))light();else{status.textContent='再试一个大一些的 V 或圆；也可以直接点亮。';audio.effect('wrong');}});
    listen(slate,'pointercancel',()=>{active=null;clear();status.textContent='画符已取消，可以重新开始。';});
    listen(document.querySelector('[data-magic="clear-gesture"]'),'click',()=>{clear();status.textContent='重新画一个 V 或圆。';});
    listen(document.querySelector('[data-magic="lumos-fallback"]'),'click',()=>light(true));
    listen(paper,'pointermove',e=>{const b=paper.getBoundingClientRect();paper.style.setProperty('--light-x',`${e.clientX-b.left}px`);paper.style.setProperty('--light-y',`${e.clientY-b.top}px`);},{passive:true});
  }
  function typewrite(element){
    clearInterval(typeTimer);if(!element||reduced())return;
    const full=element.textContent,letters=Array.from(full);let i=0;element.setAttribute('aria-label',full);element.classList.add('typewriter-line');element.textContent='';
    typeTimer=setInterval(()=>{element.textContent=letters.slice(0,++i).join('');if(i>=letters.length){clearInterval(typeTimer);element.classList.add('finished');}},30);
    const finish=()=>{clearInterval(typeTimer);element.textContent=full;element.classList.add('finished');};
    listen(element,'click',finish);
  }
  function addFootprints(){
    document.querySelectorAll('#book-dialog .home-map').forEach(svg=>{
      const place=root.QuestData.places.find(p=>p.id===current.state.last);if(!place)return;
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','map-footprints');g.setAttribute('aria-hidden','true');
      g.innerHTML=Array.from({length:6},(_,i)=>`<g style="--foot-step:${i}" transform="translate(${place.x+26+i*Math.min(16,(place.w-40)/6)} ${place.y+place.h-18-(i%2)*9}) rotate(-35)"><ellipse rx="2.5" ry="5"/><circle cy="-7" r="2"/></g>`).join('');svg.append(g);
    });
  }
  function modalMount(){
    addFootprints();
    document.querySelectorAll('[data-memory]').forEach(b=>b.onclick=()=>{
      const i=Number(b.dataset.memory);if(!current.state.quests[i].verified)return;
      const w=content().wishes[i],preview=document.getElementById('memory-preview');preview.hidden=false;preview.innerHTML=`${photoHTML(photosFor(i,current.state))}<h3>${escape(w.title)}</h3><p>${escape(w.text)}</p>`;audio.effect('page');
    });
    const mischief=document.querySelector('[data-magic="mischief"]');if(mischief)mischief.onclick=()=>{
      const lines=['皮皮鬼在纸边写下：今天的生日主角，禁止不开心。','猫头鹰信使悄悄提醒：累了可以休息，所有星星都会等你。','一行新墨迹浮现：最好的冒险，可以牵着手一起走。'];
      document.getElementById('mischief-line').textContent=lines[Math.floor(Math.random()*lines.length)];audio.effect('page');haptic();
    };
  }
  function catSVG(){return `<svg class="patronus-cat" viewBox="0 0 420 260" role="img" aria-label="银色猫咪守护神"><path class="cat-aura" d="M66 176c-68-21-51-90-5-75 45 15 11 53 63 65 42-28 64-67 101-54l15-35 14 29 23-8 23 19-6 32-28 8-11 41-32 29-10-12 20-31-53 17-20 29-15-4 11-47-51 28-16-4 13-26"/><path d="M66 176c-68-21-51-90-5-75 45 15 11 53 63 65 42-28 64-67 101-54l15-35 14 29 23-8 23 19-6 32-28 8-11 41-32 29-10-12 20-31-53 17-20 29-15-4 11-47-51 28-16-4 13-26M249 126l7-2m26 0 7 4m-19 10 3 3m-51-1c-24 3-37 12-48 28M311 168c25-3 32-12 54-8M320 185c40 8 57-1 70-17"/><g class="cat-star"><circle cx="170" cy="121" r="2"/><circle cx="205" cy="145" r="2"/><circle cx="144" cy="175" r="2"/><circle cx="255" cy="167" r="2"/><circle cx="70" cy="125" r="2"/><circle cx="320" cy="86" r="2"/></g></svg>`;}
  function cakeSVG(){return `<svg class="cake-art" viewBox="0 0 420 350" role="img" aria-label="Iris 的生日蛋糕与三根蜡烛"><defs><linearGradient id="cake-body" x2="0" y2="1"><stop stop-color="#c89088"/><stop offset=".55" stop-color="#8a414d"/><stop offset="1" stop-color="#622b3a"/></linearGradient><radialGradient id="icing"><stop stop-color="#f3ddb9"/><stop offset="1" stop-color="#b79a78"/></radialGradient><radialGradient id="flame-glow"><stop stop-color="#fff5be"/><stop offset=".3" stop-color="#f1bc55"/><stop offset="1" stop-color="#f1bc5500"/></radialGradient></defs><ellipse cx="210" cy="292" rx="160" ry="26" fill="#b59a6d"/><ellipse cx="210" cy="289" rx="150" ry="20" fill="#ddc593"/><path d="M79 190v81c0 32 262 32 262 0v-81" fill="url(#cake-body)"/><ellipse cx="210" cy="190" rx="131" ry="41" fill="url(#icing)"/><path d="M80 190q3 34 20 34t14-14q10 25 22 12t16-7q7 42 22 24t14-19q18 30 34 3t17 6q14 15 26-10t17 6q21 4 30-16t12 5q12 4 17-24" fill="#e5c9a0"/><path d="M100 258q110 38 221 0" fill="none" stroke="#d6b785" stroke-width="2"/><text x="210" y="266" text-anchor="middle" font-family="Cormorant,Georgia,serif" font-size="27" fill="#f2d6a7">Iris</text>${[160,210,260].map((x,i)=>`<g><rect x="${x-4}" y="${100+i%2*10}" width="8" height="79" rx="2" fill="${i===1?'#c57e8d':'#efddb3'}"/><path d="M${x-3} ${110+i%2*10}l6 8m-6 10 6 8m-6 10 6 8" stroke="#ac7659" fill="none"/><path d="M${x} ${99+i%2*10}v-6" stroke="#3e3041"/><g class="flame"><ellipse cx="${x}" cy="${83+i%2*10}" rx="24" ry="35" fill="url(#flame-glow)"/><path d="M${x} ${61+i%2*10}c-17 23-7 35 0 34 9-2 11-17 0-34" fill="#f6d284"/><path d="M${x} ${78+i%2*10}q-9 15 0 16 9-4 0-16" fill="#fff7d4"/></g><path class="cake-smoke" d="M${x} ${90+i%2*10}c-20-17 19-18 0-40s12-20 0-32"/></g>`).join('')}<g fill="#e6c891"><circle cx="113" cy="190" r="3"/><circle cx="290" cy="175" r="3"/><circle cx="272" cy="198" r="3"/><circle cx="195" cy="202" r="3"/></g></svg>`;}
  function endHTML(state){
    if(state.endStage===0)return `<div class="patronus-scene artifact"><p class="coda-caption">Expecto Patronum</p><div class="patronus-sky">${catSVG()}</div><div class="spell-charge" aria-hidden="true">✦</div><h2>把你的快乐，变成一道光。</h2><p class="coda-copy">长按下方魔杖，约 1.5 秒后松开世界的黑暗。银色猫咪会替你带路。</p><button class="button hold-spell" id="hold-patronus">长按施放守护神咒</button><button class="button quiet" data-magic="cast-fallback">直接施咒</button><p class="gesture-status" id="cast-status" role="status">也可以用键盘按住空格或回车。</p></div>`;
    if(state.endStage===1)return `<div class="cake-scene artifact"><p class="coda-caption">Make a birthday wish.</p><h2>现在，许一个只属于你的愿望。</h2>${cakeSVG()}<p class="coda-copy">在蛋糕上向上滑动，或轻触按钮熄灭蜡烛。也可以开启麦克风，对着手机吹气。</p><div class="actions"><button class="button primary" data-magic="blow">许好愿了，熄灭蜡烛</button><button class="button secondary" data-magic="microphone">开启麦克风吹蜡烛</button><button class="button quiet" data-magic="stop-microphone" hidden>关闭麦克风</button></div><div class="mic-level" aria-hidden="true"><i></i></div><p class="mic-status" role="status">麦克风只在你主动开启后使用。</p></div>`;
    return `<article class="final-love-letter artifact">${picture(content().finalePhoto,'Iris 的生日肖像').replace('<img','<img class="ending-portrait"')}<p class="script">My dearest Iris,</p><p>媛宝，生日快乐。</p><p>今晚，你找到了六枚碎片，解开了好多小小的秘密。可我最想送给你的，还是一个很简单的愿望：愿你在被爱的时候安心，在追逐喜欢的事物时自由。</p><p>愿我们有很多一起出发的明天，也有很多安静相伴的今天。魔法手札会合上，属于我们的故事还会继续。</p><p class="letter-sign">For you. Always.</p><p>现在，把手机放下，一起切真正的生日蛋糕吧。♡</p><button class="button quiet" data-action="collection">再看看我的六枚祝福</button></article>`;
  }
  function cancelCast(){clearTimeout(castTimer);cancelAnimationFrame(castFrame);document.querySelector('.patronus-scene')?.classList.remove('charging');document.querySelector('.spell-charge')?.style.setProperty('--charge','0');}
  function completeCast(){
    if(casting||current?.state.phase!=='end'||current.state.endStage!==0)return;
    casting=true;cancelCast();audio.effect('magic');haptic([30,50,30]);const scene=document.querySelector('.patronus-scene');scene.classList.add('casting');document.getElementById('cast-status').textContent='银色猫咪回应了你的咒语。';burst(innerWidth/2,innerHeight*.45,'silver',100);
    // Persist immediately, so refreshing during the flight continues at the cake.
    current.state.endStage=1;current.save();castTimer=setTimeout(()=>{casting=false;current.render();},reduced()?0:1800);
  }
  function initCast(){
    const button=document.getElementById('hold-patronus');if(!button)return;
    let started=0,active=false;
    const progress=()=>{const amount=Math.min(1,(performance.now()-started)/1500);document.querySelector('.spell-charge')?.style.setProperty('--charge',amount);if(active)castFrame=requestAnimationFrame(progress);};
    const start=()=>{if(active||casting)return;active=true;started=performance.now();document.querySelector('.patronus-scene').classList.add('charging');document.getElementById('cast-status').textContent='快乐正在聚成光……';castTimer=setTimeout(()=>{if(active){active=false;completeCast();}},1500);if(!reduced())castFrame=requestAnimationFrame(progress);};
    const cancel=()=>{if(!active)return;active=false;cancelCast();document.getElementById('cast-status').textContent='光还在等你。再长按一次，或直接施咒。';};
    listen(button,'pointerdown',e=>{if(e.button!==0)return;e.preventDefault();button.setPointerCapture(e.pointerId);start();});listen(button,'pointerup',cancel);listen(button,'pointercancel',cancel);listen(button,'lostpointercapture',cancel);
    listen(button,'keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();start();}});listen(button,'keyup',e=>{if(e.key===' '||e.key==='Enter')cancel();});listen(button,'blur',cancel);
    listen(document.querySelector('[data-magic="cast-fallback"]'),'click',completeCast);
  }

  let micStream=null,micContext=null,micSource=null,micFrame=0,micRequest=0,blowing=false;
  function stopMic(){
    micRequest++;cancelAnimationFrame(micFrame);micFrame=0;micSource?.disconnect();micSource=null;micStream?.getTracks().forEach(t=>t.stop());micStream=null;micContext?.close().catch(()=>{});micContext=null;
    const button=document.querySelector('[data-magic="microphone"]');if(button)button.disabled=false;
    const stop=document.querySelector('[data-magic="stop-microphone"]');if(stop)stop.hidden=true;
    const level=document.querySelector('.mic-level i');if(level)level.style.width='0';
  }
  async function startMic(){
    const status=document.querySelector('.mic-status'),button=document.querySelector('[data-magic="microphone"]');
    const Context=root.AudioContext||root.webkitAudioContext;
    if(!navigator.mediaDevices?.getUserMedia||!Context){status.textContent='这个浏览器不支持吹气识别，请上滑或点击熄灭蜡烛。';return;}
    stopMic();const request=micRequest;button.disabled=true;status.textContent='等待麦克风许可；不想开启时，直接点击熄灭即可。';
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false},video:false});
      if(request!==micRequest||current.state.phase!=='end'||current.state.endStage!==1||document.hidden){stream.getTracks().forEach(t=>t.stop());return;}
      micStream=stream;micContext=new Context();await micContext.resume();
      if(request!==micRequest||!micContext)return;
      const analyser=micContext.createAnalyser();analyser.fftSize=1024;micSource=micContext.createMediaStreamSource(stream);micSource.connect(analyser);
      const samples=new Float32Array(analyser.fftSize),start=performance.now();let baseline=0,count=0,loudSince=0;
      status.textContent='先安静半秒，让魔杖听见房间；再靠近手机轻轻吹气。';document.querySelector('[data-magic="stop-microphone"]').hidden=false;
      const sample=()=>{
        analyser.getFloatTimeDomainData(samples);const rms=Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length),now=performance.now();
        if(now-start<700){baseline+=rms;count++;}else{
          const threshold=Math.max(.035,baseline/Math.max(1,count)*2.8);document.querySelector('.mic-level i').style.width=`${Math.min(100,rms/threshold*60)}%`;status.textContent='对着手机吹气约半秒，蜡烛就会熄灭。';
          if(rms>threshold){loudSince=loudSince||now;if(now-loudSince>450){blow();return;}}else loudSince=0;
        }
        micFrame=requestAnimationFrame(sample);
      };sample();
    }catch{stopMic();if(document.contains(status))status.textContent='未能开启麦克风。可以上滑，或点击按钮熄灭蜡烛。';}
  }
  function blow(){
    if(blowing||current?.state.phase!=='end'||current.state.endStage!==1)return;
    blowing=true;stopMic();document.querySelector('.cake-art').classList.add('extinguished');document.querySelector('.mic-status').textContent='愿望已经交给星星。媛宝，生日快乐！';document.querySelectorAll('.cake-scene button').forEach(b=>b.disabled=true);
    audio.effect('magic');haptic([30,50,30]);burst(innerWidth*.3,innerHeight*.4,'confetti',75);burst(innerWidth*.7,innerHeight*.4,'confetti',75);
    current.state.endStage=2;current.save();castTimer=setTimeout(()=>{blowing=false;current.render();},reduced()?0:2000);
  }
  function initCake(){
    const cake=document.querySelector('.cake-art');if(!cake)return;let startY=null;
    listen(cake,'pointerdown',e=>{startY=e.clientY;cake.setPointerCapture(e.pointerId);});listen(cake,'pointerup',e=>{if(startY!==null&&startY-e.clientY>50)blow();startY=null;});listen(cake,'pointercancel',()=>startY=null);
    listen(document.querySelector('[data-magic="blow"]'),'click',blow);listen(document.querySelector('[data-magic="microphone"]'),'click',startMic);
    listen(document.querySelector('[data-magic="stop-microphone"]'),'click',()=>{stopMic();document.querySelector('.mic-status').textContent='麦克风已关闭。仍然可以上滑或点击熄灭蜡烛。';});
  }
  function cleanup(){disposers.forEach(fn=>fn());disposers=[];clearInterval(typeTimer);clearTimeout(castTimer);cancelCast();stopMic();casting=false;blowing=false;}
  function mount(options){cleanup();current=options;audio.scene=document.body.dataset.theme;initGesture();initCast();initCake();
    if(options.state.phase==='response')typewrite(document.querySelector('.response blockquote'));
    if(options.state.phase==='reveal'){typewrite(document.querySelector('.scene-story'));audio.effect('magic');}
    root.MagicHardware?.mount({state:options.state,photosFor,cast:completeCast,toast:options.toast,light:()=>document.querySelector('[data-magic="lumos-fallback"]')?.click(),effect:()=>audio.effect('magic'),recognize:isGesture});
  }
  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-secret]'))return;const now=Date.now();secretTaps=secretTaps.filter(t=>now-t<1600);secretTaps.push(now);
    if(secretTaps.length>=3){secretTaps=[];current?.secret();}
  });
  root.Immersion={audio,haptic,burst,mount,modalMount,cleanup,pauseInputs:()=>{stopMic();cancelCast();root.MagicHardware?.close();},isGesture,photosFor,memoryHTML,mosaicHTML,collectionHTML,ritualHTML,endHTML,
    secretHTML:()=>'<div class="secret-letter"><h3>Room of Requirement</h3><p>如果今晚你只想安静地坐一会儿，这间屋子也会为你出现。</p><p>媛宝，你不用解开所有谜题才值得被爱。今天，所有小小的魔法，都只是想让你开心。</p><p>♡ 这份留言会陪着你，任务也会在原来的地方等你。</p></div>',
    mapExtras:()=>'<div class="map-mischief"><button class="button quiet" data-magic="mischief">听听纸边的悄悄话</button><p id="mischief-line" role="status"></p></div>'};
})(window);
