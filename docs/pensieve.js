// One continuous inward-facing photo sphere, populated only by verified memories.
export function memorySlots(photosFor, state) {
  const cells = [[1,0],[1,1],[0,0],[0,1],[1,2],[1,3],[0,2],[0,3],[2,0],[2,1],[2,2]];
  return state.quests.flatMap((quest, group) => photosFor(group, state).map(photo => ({photo, group, unlocked: quest.verified})))
    .map((slot, index) => ({...slot, index, row: cells[index][0], column: cells[index][1], yaw: cells[index][1]*Math.PI/2, latitude: [1.01,0,-1.01][cells[index][0]]}));
}

export async function createPensieve({dialog, options, isCurrent, reduced}) {
  const THREE = await import('./vendor/three.module.js');
  if (!isCurrent()) return () => {};
  const host = dialog.querySelector('.pensieve-webgl');
  const caption = dialog.querySelector('.pensieve-caption');
  const status = dialog.querySelector('.hardware-status');
  const slots = memorySlots(options.photosFor, options.state);
  const unlocked = slots.filter(slot => slot.unlocked);
  const geometries = new Set(), materials = new Set(), textures = new Set(), listeners = [];
  let renderer, frame = 0, observer, disposed = false, mode = 'basin', dive = null;
  let yaw = 0, pitch = 0, selected = unlocked.at(-1)?.index ?? -1, focus = null, touring = false, tourAt = 0;
  let sensor = false, sensorBaseline = null, sensorAnchor = null, sensorTimer, pointerMoved = false, orientationHandler = null;
  const pointers = new Map();
  const trackGeometry = geometry => (geometries.add(geometry), geometry);
  const trackMaterial = material => (materials.add(material), material);
  const on = (element, event, handler, config) => {element.addEventListener(event, handler, config);listeners.push(() => element.removeEventListener(event, handler, config));};
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const cleanup = () => {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); clearTimeout(sensorTimer); observer?.disconnect();
    if (sensor && orientationHandler) window.removeEventListener('deviceorientation', orientationHandler);
    sensor = false;
    listeners.forEach(remove => remove());
    textures.forEach(texture => texture.dispose()); materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose());
    renderer?.dispose(); renderer?.forceContextLoss();
    if (document.fullscreenElement === dialog) document.exitFullscreen?.().catch(() => {});
  };

  try {
    renderer = new THREE.WebGLRenderer({antialias: innerWidth > 600, alpha: false, powerPreference: 'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x06121c);
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-label', '球面记忆空间，可拖动环顾；点击照片放大');
    canvas.tabIndex = 0; host.prepend(canvas);
    host.insertAdjacentHTML('beforeend', `<div class="sphere-hud" hidden><span class="sphere-count">${unlocked.length}<small> / ${slots.length} 段时光已显影</small></span><button class="sphere-dial" aria-label="展开球面照片导航" aria-expanded="false"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43"/><circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="17"/><path class="sphere-needle" d="M46 52L50 8L54 52Z"/>${slots.map(slot=>`<circle class="sphere-dot ${slot.unlocked?'lit':''}" data-orbit="${slot.index}" cx="${50+Math.sin(slot.yaw)*[30,43,17][slot.row]}" cy="${50-Math.cos(slot.yaw)*[30,43,17][slot.row]}" r="3"/>`).join('')}</svg><span>记忆星盘</span></button></div><div class="sphere-actions" hidden><button data-sphere-prev aria-label="转向上一张照片">‹</button><button data-photo-open>轻触照片放大</button><button data-sphere-next aria-label="转向下一张照片">›</button></div><div class="sphere-light" aria-hidden="true"></div><section class="sphere-viewer" hidden aria-label="回忆照片详情"><header><span></span><button class="button quiet" data-photo-close>返回星空</button></header><img alt=""><h3></h3><p></p><nav><button class="button secondary" data-viewer-prev>上一张</button><button class="button secondary" data-viewer-next>下一张</button></nav></section>`);
    const hud = host.querySelector('.sphere-hud'), actions = host.querySelector('.sphere-actions'), viewer = host.querySelector('.sphere-viewer');
    const filmstrip = document.createElement('div'); filmstrip.className = 'sphere-filmstrip'; filmstrip.hidden = true;
    filmstrip.innerHTML = slots.map(slot=>`<button data-sphere-photo="${slot.index}" ${slot.unlocked?'':'disabled'} aria-label="${slot.unlocked?esc(slot.photo.caption):`尚未解封的时光 ${slot.index+1}`}">${slot.unlocked?`<img src="./assets/${esc(slot.photo.file)}.webp" alt="">`:'<span>◇</span>'}<small>${slot.index+1}</small></button>`).join('');
    host.after(filmstrip);
    const tourButton = document.createElement('button'); tourButton.className = 'button secondary'; tourButton.textContent = '星光漫游'; tourButton.dataset.sphereTour = ''; tourButton.setAttribute('aria-pressed', 'false');
    const resetButton = document.createElement('button'); resetButton.className = 'button quiet'; resetButton.textContent = '视角归位'; resetButton.dataset.sphereReset = '';
    dialog.querySelector('.hardware-controls').append(tourButton, resetButton);
    const sensorButton = dialog.querySelector('[data-sensor]'), enterButton = dialog.querySelector('[data-enter-sphere]');
    enterButton.disabled = !unlocked.length;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, host.clientWidth/host.clientHeight, .05, 100);
    const basin = new THREE.Group(), sphere = new THREE.Group(); scene.add(basin, sphere); sphere.visible = false;
    scene.add(new THREE.AmbientLight(0xb4dcea, 1.3));
    const light = new THREE.PointLight(0xc4f4ff, 70, 22); light.position.set(0,5,0); scene.add(light);
    const mesh = (geometry, material, parent=basin) => {const object = new THREE.Mesh(trackGeometry(geometry), trackMaterial(material));parent.add(object);return object;};
    const ring = mesh(new THREE.TorusGeometry(2.65,.2,12,80),new THREE.MeshStandardMaterial({color:0x8c988a,metalness:.8,roughness:.24}));ring.rotation.x = Math.PI/2;
    const base = mesh(new THREE.SphereGeometry(2.67,48,20,0,Math.PI*2,Math.PI/2,Math.PI/2),new THREE.MeshStandardMaterial({color:0x3e6570,metalness:.7,roughness:.28,side:THREE.DoubleSide}));base.scale.y = .35;
    const waterMaterial = new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,uniforms:{uTime:{value:0},uTouch:{value:new THREE.Vector2()},uRipple:{value:-100}},vertexShader:`uniform float uTime;uniform vec2 uTouch;uniform float uRipple;varying vec3 vPos;varying float vWave;void main(){vec3 p=position;float d=distance(p.xy,uTouch);float age=uTime-uRipple;float ring=sin(d*14.-age*7.)*exp(-d*.55)*exp(-max(age,0.)*.75)*step(0.,age);vWave=sin(p.x*4.+uTime*.7)*cos(p.y*5.-uTime*.5)*.025+ring*.075;p.z+=vWave;vPos=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float uTime;varying vec3 vPos;varying float vWave;void main(){float r=length(vPos.xy);if(r>2.52)discard;float swirl=sin(r*16.+atan(vPos.y,vPos.x)*4.-uTime*.6+vWave*22.);float glint=pow(max(0.,swirl),12.);vec3 c=mix(vec3(.05,.19,.26),vec3(.45,.7,.77),.48+vWave*3.);c+=glint*.3;float glow=pow(max(0.,1.-r/2.7),2.);gl_FragColor=vec4(c+glow*.12,.92);}`});
    const water = mesh(new THREE.PlaneGeometry(5.04,5.04,64,64),waterMaterial);water.rotation.x = -Math.PI/2;water.position.y = .04;
    const threads = [];
    options.state.quests.forEach((quest,index)=>{
      const angle = index/6*Math.PI*2, x = Math.cos(angle)*1.45, z = Math.sin(angle)*1.45;
      const points = Array.from({length:20},(_,j)=>new THREE.Vector3(x+Math.sin(j*.6)*.12,.18+j*.055,z+Math.cos(j*.5)*.09));
      const thread = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.028,6,false),new THREE.MeshBasicMaterial({color:quest.verified?0xd9f8ff:0x384c5c}));
      thread.userData.group = index; threads.push(thread);
    });
    const position = (azimuth,latitude,radius=8) => new THREE.Vector3(Math.sin(azimuth)*Math.cos(latitude)*radius,Math.sin(latitude)*radius,-Math.cos(azimuth)*Math.cos(latitude)*radius);
    // Curved UV patches face inward. U grows rightward, so photographs are not mirrored.
    const patch = slot => {
      const vertices=[],uvs=[],indices=[], columns=24, rows=18;
      for(let y=0;y<=rows;y++) for(let x=0;x<=columns;x++) {
        const p=position(slot.yaw+(x/columns-.5)*1.49,slot.latitude+(.5-y/rows)*.91);
        vertices.push(p.x,p.y,p.z);uvs.push(x/columns,1-y/rows);
        if(x<columns&&y<rows){const a=y*(columns+1)+x,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
    };
    const makeCard = (slot, image) => {
      const card=document.createElement('canvas');
      card.width=slot.row===1?1024:720;card.height=slot.row===1?660:840;
      const c=card.getContext('2d'),w=card.width,h=card.height;
      const gradient=c.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#203b48');gradient.addColorStop(.55,'#102533');gradient.addColorStop(1,'#0b1c2b');c.fillStyle=gradient;c.fillRect(0,0,w,h);
      c.strokeStyle=image?'#b7d2d0':'#426372';c.lineWidth=2;c.strokeRect(14,14,w-28,h-28);c.strokeStyle='#a3cbd53b';c.strokeRect(22,22,w-44,h-44);
      c.textAlign='center';
      if(image){
        // Soft photographic colour extends into the silver seams; the foreground keeps the complete photo.
        c.save();const cover=Math.max(w/image.width,h/image.height);c.filter='blur(24px)';c.globalAlpha=.4;c.drawImage(image,(w-image.width*cover)/2,(h-image.height*cover)/2,image.width*cover,image.height*cover);c.restore();
        c.fillStyle='#091e2b66';c.fillRect(0,0,w,h);c.fillStyle='#09202cbc';c.fillRect(0,0,w,60);c.fillRect(0,h-80,w,80);c.strokeStyle='#b7d2d0';c.strokeRect(14,14,w-28,h-28);
        const bounds={x:38,y:62,w:w-76,h:h-155};const scale=Math.min(bounds.w/image.width,bounds.h/image.height);
        c.drawImage(image,bounds.x+(bounds.w-image.width*scale)/2,bounds.y+(bounds.h-image.height*scale)/2,image.width*scale,image.height*scale);
        c.fillStyle='#d8e6df';c.font='26px Cormorant, Georgia, serif';c.fillText(`For Iris · Memory ${slot.index+1}`,w/2,46);
        c.font='22px "Microsoft YaHei", sans-serif';c.fillStyle='#c1d6d8';c.fillText(slot.photo.caption,w/2,h-47,w-75);
      }else{
        c.strokeStyle='#729baa55';c.beginPath();c.arc(w/2,h/2,80,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(w/2,h/2-58);c.lineTo(w/2+44,h/2);c.lineTo(w/2,h/2+58);c.lineTo(w/2-44,h/2);c.closePath();c.stroke();
        c.fillStyle='#8aabb5';c.font='26px Cormorant, Georgia, serif';c.fillText('A memory yet to bloom.',w/2,h/2+120);c.font='22px "Microsoft YaHei", sans-serif';c.fillText(`等待第 ${slot.group+1} 枚封印`,w/2,h-55);
      }
      const texture=new THREE.CanvasTexture(card);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.add(texture);return texture;
    };
    const tiles = slots.map(slot=>{
      const material=new THREE.MeshBasicMaterial({map:makeCard(slot),side:THREE.DoubleSide,transparent:true,opacity:slot.unlocked?.8:.48});
      const tile=mesh(patch(slot),material,sphere);tile.userData.slot=slot;return tile;
    });
    // The remaining twelfth panel is a dedication, not a duplicated photograph.
    const dedication={row:2,yaw:3*Math.PI/2,latitude:-1.01,group:5};
    const dedicationMap=makeCard(dedication),dedicationCanvas=dedicationMap.image,dc=dedicationCanvas.getContext('2d');dc.fillStyle='#102330';dc.fillRect(28,28,dedicationCanvas.width-56,dedicationCanvas.height-56);dc.fillStyle='#cce7e7';dc.textAlign='center';dc.font='italic 52px Cormorant, Georgia, serif';dc.fillText('For you.',360,360);dc.fillText('Always.',360,440);dc.font='25px "Microsoft YaHei", sans-serif';dc.fillText('我们的故事，会一直有下一页。',360,565);dedicationMap.needsUpdate=true;
    mesh(patch(dedication),new THREE.MeshBasicMaterial({map:dedicationMap,side:THREE.DoubleSide}),sphere);
    const revealStarts=new Map();let loaded=0;
    const imageLoads=unlocked.map(async slot=>{
      const image=new Image();image.src=`./assets/${slot.photo.file}.webp`;
      try{
        await image.decode();if(disposed||!isCurrent())return;
        const material=tiles[slot.index].material,old=material.map;material.map=makeCard(slot,image);material.needsUpdate=true;old.dispose();textures.delete(old);
        revealStarts.set(slot.index,performance.now());loaded++;host.dataset.loadedPhotos=String(loaded);
      }catch{if(!disposed){tiles[slot.index].userData.failed=true;status.textContent='有一张照片还没加载好。可收起后重开；已经显影的回忆仍可查看。';}}
    });
    host.dataset.unlockedPhotos=String(unlocked.length);host.dataset.totalPhotos=String(slots.length);
    // Faint silver paths join the unlocked patches into one constellation.
    for(let i=1;i<unlocked.length;i++){
      const a=position(unlocked[i-1].yaw,unlocked[i-1].latitude,7.8),b=position(unlocked[i].yaw,unlocked[i].latitude,7.8),points=[];
      for(let j=0;j<=40;j++){const p=a.clone().lerp(b,j/40);if(p.length()<.1)p.y=.1;p.normalize().multiplyScalar(7.75);points.push(p);}
      const line=new THREE.Line(trackGeometry(new THREE.BufferGeometry().setFromPoints(points)),trackMaterial(new THREE.LineBasicMaterial({color:0xb0dce4,transparent:true,opacity:.12})));sphere.add(line);
    }
    const starPositions=[];
    for(let i=0;i<420;i++){const az=Math.random()*Math.PI*2,lat=Math.asin(Math.random()*2-1),p=position(az,lat,15);starPositions.push(p.x,p.y,p.z);}
    const starGeo=trackGeometry(new THREE.BufferGeometry());starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
    const stars=new THREE.Points(starGeo,trackMaterial(new THREE.PointsMaterial({color:0xd1e9ee,size:.05,transparent:true,opacity:.7})));scene.add(stars);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),direction=new THREE.Vector3();
    const lookQuaternion=(az,lat)=>new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(),position(az,lat,1),new THREE.Vector3(0,1,0)));
    const resetSensor=()=>{sensorBaseline=null;sensorAnchor=camera.quaternion.clone();};
    const setBasin=()=>{camera.position.set(Math.sin(yaw)*6.8,5.7,Math.cos(yaw)*6.8);camera.lookAt(0,0,0);};setBasin();
    const syncAngles=()=>{camera.getWorldDirection(direction);yaw=Math.atan2(direction.x,-direction.z);pitch=Math.asin(Math.max(-1,Math.min(1,direction.y)));};
    const updateSelection=index=>{
      selected=index;const slot=slots[index];if(!slot)return;
      filmstrip.querySelectorAll('[data-sphere-photo]').forEach(b=>{const active=Number(b.dataset.spherePhoto)===index;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
      dialog.querySelectorAll('[data-memory-thread]').forEach(b=>b.classList.toggle('active',Number(b.dataset.memoryThread)===slot.group));
      host.querySelectorAll('[data-orbit]').forEach(dot=>dot.classList.toggle('selected',Number(dot.dataset.orbit)===index));
      caption.textContent=`${slot.photo.caption} · 第 ${slot.group+1} 枚记忆`;
      host.querySelector('[data-photo-open]').textContent='放大这张回忆';
    };
    const stopTour=()=>{touring=false;tourButton.textContent='星光漫游';tourButton.setAttribute('aria-pressed','false');};
    const showRoom=()=>{
      mode='room';host.dataset.mode=mode;basin.visible=false;sphere.visible=true;camera.position.set(0,0,0);camera.fov=104;camera.updateProjectionMatrix();hud.hidden=false;actions.hidden=false;enterButton.hidden=true;
      status.textContent='所有已显影照片都在同一球面。拖动或转动手机环顾；轻触照片放大，双指捏合调整视野。';
    };
    const moveTo=(index,animate=true)=>{
      const slot=slots[index];if(!slot?.unlocked)return;
      updateSelection(index);const target=lookQuaternion(slot.yaw,slot.latitude);
      if(animate&&!reduced()){focus={start:performance.now(),from:camera.quaternion.clone(),to:target};}
      else{camera.quaternion.copy(target);focus=null;syncAngles();resetSensor();}
    };
    const enter=index=>{
      if(!slots[index]?.unlocked){status.textContent='先找到实体碎片，让第一段时光显影。';return;}
      stopTour();viewer.hidden=true;options.effect();window.Immersion?.haptic([20,40,20]);
      if(mode==='basin'&&!reduced()){
        dive={start:performance.now(),from:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov,index};caption.textContent='穿过银光，潜入我们的记忆星球……';
      }else{showRoom();moveTo(index,mode==='room');}
    };
    const step=delta=>{
      if(!unlocked.length)return;const current=unlocked.findIndex(slot=>slot.index===selected);const index=unlocked[(current+delta+unlocked.length)%unlocked.length].index;
      stopTour();moveTo(index);if(!viewer.hidden)showPhoto(index);
    };
    let previousFocus=null;
    function showPhoto(index=selected){
      const slot=slots[index];if(!slot?.unlocked)return;
      stopTour();previousFocus=document.activeElement;viewer.hidden=false;updateSelection(index);
      const image=viewer.querySelector('img');image.src=`./assets/${slot.photo.file}.webp`;image.alt=slot.photo.caption;
      viewer.querySelector('header span').textContent=`${index+1} / ${slots.length} · 第 ${slot.group+1} 枚记忆`;
      viewer.querySelector('h3').textContent=slot.photo.caption;viewer.querySelector('p').textContent=window.BirthdayContent.wishes[slot.group].text;
      viewer.querySelector('[data-photo-close]').focus();window.Immersion?.haptic();
    }
    const closePhoto=()=>{viewer.hidden=true;previousFocus?.focus();};
    on(host.querySelector('[data-photo-close]'),'click',closePhoto);
    on(host.querySelector('[data-photo-open]'),'click',()=>showPhoto());
    on(host.querySelector('[data-sphere-prev]'),'click',()=>step(-1));on(host.querySelector('[data-sphere-next]'),'click',()=>step(1));
    on(viewer.querySelector('[data-viewer-prev]'),'click',()=>step(-1));on(viewer.querySelector('[data-viewer-next]'),'click',()=>step(1));
    on(dialog,'keydown',event=>{if(event.key==='Escape'&&!viewer.hidden){event.preventDefault();event.stopPropagation();closePhoto();}});
    on(host.querySelector('.sphere-dial'),'click',()=>{filmstrip.hidden=!filmstrip.hidden;host.querySelector('.sphere-dial').setAttribute('aria-expanded',String(!filmstrip.hidden));});
    filmstrip.querySelectorAll('[data-sphere-photo]').forEach(button=>on(button,'click',()=>{stopTour();moveTo(Number(button.dataset.spherePhoto));}));
    dialog.querySelectorAll('[data-memory-thread]').forEach(button=>on(button,'click',()=>enter(unlocked.find(slot=>slot.group===Number(button.dataset.memoryThread))?.index)));
    on(enterButton,'click',()=>enter(selected));
    on(dialog.querySelector('[data-return-basin]'),'click',()=>{
      stopTour();mode='basin';host.dataset.mode=mode;dive=null;focus=null;viewer.hidden=true;basin.visible=true;sphere.visible=false;hud.hidden=true;actions.hidden=true;filmstrip.hidden=true;enterButton.hidden=false;yaw=0;pitch=0;camera.fov=48;camera.updateProjectionMatrix();setBasin();
      caption.textContent='六根银丝，通往同一个记忆星球。';status.textContent='已显影的照片会一直留在球面上。点击任一银丝，回到那组时光。';
    });
    on(resetButton,'click',()=>{stopTour();if(mode==='basin'){yaw=0;setBasin();}else moveTo(selected);camera.fov=mode==='basin'?48:104;camera.updateProjectionMatrix();status.textContent='视角已归位。转动感应会从这里重新校准。';resetSensor();});
    on(tourButton,'click',()=>{
      if(touring){stopTour();return;}
      if(!unlocked.length)return;
      disableSensor();if(mode==='basin'){showRoom();moveTo(unlocked[0].index,false);}
      touring=true;tourAt=performance.now()+4000;tourButton.textContent='停下漫游';tourButton.setAttribute('aria-pressed','true');
      status.textContent='银光会逐张带你看已经显影的照片。触摸星空，漫游就会停下。';
    });
    const pick=event=>{const box=canvas.getBoundingClientRect();pointer.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster;};
    const ripple=event=>{const hit=pick(event).intersectObject(water)[0];if(hit){const p=water.worldToLocal(hit.point.clone());waterMaterial.uniforms.uTouch.value.set(p.x,p.y);waterMaterial.uniforms.uRipple.value=waterMaterial.uniforms.uTime.value;}};
    const lightPulse=event=>{
      if(reduced())return;const box=host.getBoundingClientRect(),light=host.querySelector('.sphere-light');light.style.left=`${event.clientX-box.left}px`;light.style.top=`${event.clientY-box.top}px`;light.classList.remove('bloom');void light.offsetWidth;light.classList.add('bloom');
    };
    on(canvas,'pointerdown',event=>{
      if(dive)return;canvas.setPointerCapture(event.pointerId);canvas.focus();stopTour();focus=null;if(mode==='room')syncAngles();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY});pointerMoved=false;
      if(mode==='basin')ripple(event);else lightPulse(event);
    });
    on(canvas,'pointermove',event=>{
      if(mode==='basin')ripple(event);
      const old=pointers.get(event.pointerId);if(!old)return;
      const next={x:event.clientX,y:event.clientY,startX:old.startX,startY:old.startY},dx=next.x-old.x,dy=next.y-old.y;
      if(Math.hypot(next.x-old.startX,next.y-old.startY)>5)pointerMoved=true;
      if(pointers.size===2&&mode==='room'){
        const other=[...pointers.entries()].find(([id])=>id!==event.pointerId)[1],before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);
        camera.fov=Math.max(38,Math.min(118,camera.fov+(before-after)*.1));camera.updateProjectionMatrix();pointerMoved=true;
      }else{
        yaw-=dx*.006;pitch=Math.max(-1.43,Math.min(1.43,pitch+dy*.006));
        if(mode==='room'){camera.quaternion.copy(lookQuaternion(yaw,pitch));resetSensor();}else setBasin();
      }
      pointers.set(event.pointerId,next);
    });
    on(canvas,'pointerup',event=>{
      if(!pointers.has(event.pointerId))return;pointers.delete(event.pointerId);if(pointerMoved||pointers.size||dive)return;
      if(mode==='basin'){const hit=pick(event).intersectObjects(threads)[0];if(hit){const index=unlocked.find(slot=>slot.group===hit.object.userData.group)?.index;enter(index);}}
      else{const hit=pick(event).intersectObjects(tiles)[0];if(hit){const slot=hit.object.userData.slot;if(slot.unlocked){moveTo(slot.index);showPhoto(slot.index);}else{lightPulse(event);status.textContent=`这段时光等待第 ${slot.group+1} 枚实体封印。找到它，再回来让照片显影。`;}}}
    });
    on(canvas,'pointercancel',event=>{pointers.delete(event.pointerId);pointerMoved=true;});
    on(canvas,'wheel',event=>{if(mode!=='room')return;event.preventDefault();camera.fov=Math.max(38,Math.min(118,camera.fov+event.deltaY*.035));camera.updateProjectionMatrix();},{passive:false});
    on(canvas,'keydown',event=>{
      if(mode!=='room')return;
      if(event.key==='Enter'){event.preventDefault();showPhoto();return;}
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();stopTour();focus=null;syncAngles();yaw+=event.key==='ArrowRight'?.18:event.key==='ArrowLeft'?-.18:0;pitch=Math.max(-1.43,Math.min(1.43,pitch+(event.key==='ArrowUp'?.16:event.key==='ArrowDown'?-.16:0)));camera.quaternion.copy(lookQuaternion(yaw,pitch));resetSensor();
    });

    const sensorQuaternion = new THREE.Quaternion(), sensorEuler = new THREE.Euler(), screenQuaternion = new THREE.Quaternion();
    const sensorCorrection = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2), zAxis=new THREE.Vector3(0,0,1);
    let sensorEvents=0;
    function orientation(event){
      if(disposed||!sensor||mode!=='room'||focus||dive||pointers.size||!viewer.hidden)return;
      if(![event.alpha,event.beta,event.gamma].every(Number.isFinite))return;
      clearTimeout(sensorTimer);sensorEvents++;
      const screenAngle=(window.screen.orientation?.angle??window.orientation??0)*Math.PI/180;
      sensorEuler.set(event.beta*Math.PI/180,event.alpha*Math.PI/180,-event.gamma*Math.PI/180,'YXZ');sensorQuaternion.setFromEuler(sensorEuler).multiply(sensorCorrection).multiply(screenQuaternion.setFromAxisAngle(zAxis,-screenAngle));
      if(!sensorBaseline){sensorBaseline=sensorQuaternion.clone().invert();sensorAnchor=camera.quaternion.clone();}
      const target=sensorAnchor.clone().multiply(sensorBaseline).multiply(sensorQuaternion);
      camera.quaternion.slerp(target,.35);syncAngles();host.dataset.sensorEvents=String(sensorEvents);
    }
    orientationHandler = orientation;
    function disableSensor(){
      if(sensor)window.removeEventListener('deviceorientation',orientation);sensor=false;clearTimeout(sensorTimer);sensorBaseline=null;sensorButton.textContent='开启转动手机';sensorButton.setAttribute('aria-pressed','false');
    }
    on(sensorButton,'click',async()=>{
      if(sensor){disableSensor();status.textContent='转动感应已关闭，仍可拖动环顾。';return;}
      if(!window.DeviceOrientationEvent){status.textContent='没有可用的方向传感器，请拖动环顾。';return;}
      try{
        const granted=typeof DeviceOrientationEvent.requestPermission==='function'?await DeviceOrientationEvent.requestPermission():'granted';
        if(disposed||!isCurrent())return;
        if(granted!=='granted'){status.textContent='未允许转动感应，请拖动环顾。';return;}
        stopTour();if(mode==='basin'&&unlocked.length){showRoom();moveTo(selected,false);}
        sensor=true;resetSensor();window.addEventListener('deviceorientation',orientation);sensorButton.textContent='关闭转动感应';sensorButton.setAttribute('aria-pressed','true');
        status.textContent='以现在的握持方向为起点，慢慢左右转身、抬头或低头，看球面的其他回忆。';
        sensorTimer=setTimeout(()=>{if(sensor&&!disposed)status.textContent='还没有收到转动信号。可拖动查看；换手机浏览器后再试感应。';},5000);
      }catch{if(!disposed)status.textContent='转动感应没有开启，请拖动环顾。';}
    });
    on(window.screen.orientation||window,window.screen.orientation?'change':'orientationchange',()=>{if(sensor)resetSensor();});
    on(dialog.querySelector('[data-fullscreen]'),'click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(dialog.requestFullscreen)await dialog.requestFullscreen();else status.textContent='浏览器不支持全屏，可以继续在窗口里探索。';}catch{if(!disposed)status.textContent='无法进入全屏，可以继续在窗口里探索。';}});
    let last=0;
    const draw=time=>{
      if(disposed||!isCurrent())return;
      frame=requestAnimationFrame(draw);if(time-last<33)return;last=time;
      if(!reduced())waterMaterial.uniforms.uTime.value=time*.001;
      if(dive){
        const progress=Math.min(1,(time-dive.start)/1000),ease=progress*progress*(3-2*progress);
        camera.position.copy(dive.from).lerp(new THREE.Vector3(0,0,0),ease);camera.quaternion.copy(dive.quaternion).slerp(lookQuaternion(slots[dive.index].yaw,slots[dive.index].latitude),ease);
        camera.fov=dive.fov+(104-dive.fov)*ease;camera.updateProjectionMatrix();
        host.style.setProperty('--dive-glow',String(Math.sin(progress*Math.PI)*.7));
        if(progress===1){const index=dive.index;dive=null;host.style.setProperty('--dive-glow','0');showRoom();moveTo(index,false);}
      }
      if(focus){const progress=Math.min(1,(time-focus.start)/1100),ease=progress*progress*(3-2*progress);camera.quaternion.copy(focus.from).slerp(focus.to,ease);if(progress===1){focus=null;syncAngles();resetSensor();}}
      if(touring&&time>=tourAt){const index=unlocked.findIndex(slot=>slot.index===selected);moveTo(unlocked[(index+1)%unlocked.length].index);tourAt=time+4500;}
      revealStarts.forEach((start,index)=>{tiles[index].material.opacity=reduced()?1:Math.min(1,.4+(time-start)/1500);if(time-start>1500)revealStarts.delete(index);});
      if(mode==='room'){
        camera.getWorldDirection(direction);host.querySelector('.sphere-needle').style.transform=`rotate(${Math.atan2(direction.x,-direction.z)*180/Math.PI}deg)`;
        if(!focus&&!dive&&viewer.hidden){
          const nearest=slots.reduce((best,slot)=>{const score=direction.dot(position(slot.yaw,slot.latitude,1));return score>best.score?{slot,score}:best;},{slot:null,score:-2}).slot;
          const button=host.querySelector('[data-photo-open]');button.disabled=!nearest.unlocked;
          if(nearest.unlocked){if(nearest.index!==selected||button.textContent!=='放大这张回忆')updateSelection(nearest.index);}
          else{caption.textContent=`这片球面等待第 ${nearest.group+1} 枚封印`;button.textContent='这段时光尚未显影';}
        }
      }
      renderer.render(scene,camera);
    };
    observer=new ResizeObserver(()=>{if(disposed)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();});observer.observe(host);
    on(canvas,'webglcontextlost',event=>{event.preventDefault();if(disposed)return;cleanup();status.textContent='星空暂时休息了。收起此页，在普通相册继续看已经解封的照片。';});
    host.dataset.mode='basin';caption.textContent='六根银丝，通往同一个记忆星球。';
    frame=requestAnimationFrame(draw);
    Promise.allSettled(imageLoads).then(()=>{if(!disposed&&loaded===unlocked.length)host.dataset.photosReady='true';});
    return cleanup;
  }catch(error){cleanup();throw error;}
}
