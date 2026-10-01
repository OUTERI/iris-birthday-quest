(function(root){
  'use strict';
  let options,session=0,activeCleanup=()=>{},voice=null,voiceTimer,handModel=null;
  const dialog=document.createElement('dialog');dialog.id='hardware-dialog';dialog.setAttribute('aria-label','可选硬件魔法');document.body.append(dialog);
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const safe=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function stopVoice(){clearTimeout(voiceTimer);if(voice){voice.onend=null;voice.onresult=null;voice.onerror=null;voice.abort();voice=null;}document.querySelectorAll('[data-hardware="voice"]').forEach(b=>b.disabled=false);}
  function cleanup(){session++;activeCleanup();activeCleanup=()=>{};stopVoice();}
  function close(){cleanup();if(dialog.open)dialog.close();}
  function open(title,body){cleanup();dialog.innerHTML=`<div class="modal-heading"><h2>${title}</h2><button class="button quiet" data-hardware="close">收起魔法</button></div><div class="hardware-content">${body}</div>`;if(!dialog.open)dialog.showModal();return session;}
  dialog.addEventListener('close',cleanup);dialog.addEventListener('cancel',cleanup);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});root.addEventListener('pagehide',close);

  async function pensieve(){
    const ticket=open('The Pensieve · 记忆冥想盆',`<p>滑过银色水面，点一根已解封的银丝潜入记忆。进入后可左右拖动环顾。</p><div class="pensieve-webgl"><div class="pensieve-caption">正在唤醒银色水面……</div></div><div class="memory-selector">${options.state.quests.map((q,i)=>`<button data-memory-thread="${i}" ${q.verified?'':'disabled'}>记忆 ${i+1}${q.verified?' ✦':' ◇'}</button>`).join('')}</div><div class="hardware-controls"><button class="button secondary" data-sensor>开启转动手机看回忆</button><button class="button secondary" data-return-basin>返回水面</button><button class="button quiet" data-fullscreen>全屏沉浸</button></div><p class="hardware-status" role="status">未解封的银丝不会展示照片。无需开启传感器也能拖动查看。</p>`);
    const host=dialog.querySelector('.pensieve-webgl'),caption=dialog.querySelector('.pensieve-caption'),status=dialog.querySelector('.hardware-status');
    let renderer=null,frame=0,observer,orientationHandler=null,textures=[],objects=[],disposed=false;
    let sensorEnabled=false,mode='basin',chosen=-1,angle=0,pitch=0,drag=null,moved=false,diveStart=0,baseline=null;
    activeCleanup=()=>{
      disposed=true;cancelAnimationFrame(frame);observer?.disconnect();if(orientationHandler)root.removeEventListener('deviceorientation',orientationHandler);
      objects.forEach(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});textures.forEach(t=>t.dispose());renderer?.dispose();renderer?.forceContextLoss();
      if(document.fullscreenElement===dialog)document.exitFullscreen?.().catch(()=>{});
    };
    try{
      const THREE=await import('./vendor/three.module.js');if(ticket!==session)return;
      renderer=new THREE.WebGLRenderer({antialias:innerWidth>600,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;host.prepend(renderer.domElement);
      const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x091923,.025);const camera=new THREE.PerspectiveCamera(48,host.clientWidth/host.clientHeight,.05,80);
      const basin=new THREE.Group(),room=new THREE.Group();scene.add(basin,room);room.visible=false;
      scene.add(new THREE.AmbientLight(0xb4dcea,1.3));const light=new THREE.PointLight(0xc4f4ff,70,22);light.position.set(0,5,0);scene.add(light);
      const add=(geometry,material,parent=basin)=>{const mesh=new THREE.Mesh(geometry,material);objects.push(mesh);parent.add(mesh);return mesh;};
      const ring=add(new THREE.TorusGeometry(2.65,.2,12,80),new THREE.MeshStandardMaterial({color:0x8c988a,metalness:.8,roughness:.24}));ring.rotation.x=Math.PI/2;
      const base=add(new THREE.SphereGeometry(2.67,48,20,0,Math.PI*2,Math.PI/2,Math.PI/2),new THREE.MeshStandardMaterial({color:0x3e6570,metalness:.7,roughness:.28,side:THREE.DoubleSide}));base.scale.y=.35;
      const waterMaterial=new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,uniforms:{uTime:{value:0},uTouch:{value:new THREE.Vector2(0,0)},uRipple:{value:-100}},vertexShader:`uniform float uTime;uniform vec2 uTouch;uniform float uRipple;varying vec3 vPos;varying float vWave;void main(){vec3 p=position;float d=distance(p.xy,uTouch);float age=uTime-uRipple;float ring=sin(d*14.-age*7.)*exp(-d*.55)*exp(-max(age,0.)*.75)*step(0.,age);vWave=sin(p.x*4.+uTime*.7)*cos(p.y*5.-uTime*.5)*.025+ring*.075;p.z+=vWave;vPos=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float uTime;varying vec3 vPos;varying float vWave;void main(){float r=length(vPos.xy);float swirl=sin(r*16.+atan(vPos.y,vPos.x)*4.-uTime*.6+vWave*22.);float glint=pow(max(0.,swirl),12.);vec3 c=mix(vec3(.05,.19,.26),vec3(.45,.7,.77),.48+vWave*3.);c+=glint*.3;float glow=pow(max(0.,1.-r/2.7),2.);gl_FragColor=vec4(c+glow*.12,.92);}`});
      waterMaterial.fragmentShader=waterMaterial.fragmentShader.replace('float r=length(vPos.xy);','float r=length(vPos.xy);if(r>2.52)discard;');
      const water=add(new THREE.PlaneGeometry(5.04,5.04,64,64),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=.04;
      const threads=[];
      for(let i=0;i<6;i++){
        const a=i/6*Math.PI*2,x=Math.cos(a)*1.45,z=Math.sin(a)*1.45,points=[];
        for(let j=0;j<20;j++)points.push(new THREE.Vector3(x+Math.sin(j*.6)*.12,.18+j*.055,z+Math.cos(j*.5)*.09));
        const thread=add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.019,6,false),new THREE.MeshBasicMaterial({color:options.state.quests[i].verified?0xd9f8ff:0x486071}));thread.userData.memory=i;threads.push(thread);
      }
      // A real 3D room: photographic planes sit around the viewer inside a star sphere.
      const starPositions=[];for(let i=0;i<350;i++){const az=Math.random()*Math.PI*2,el=Math.acos(Math.random()*2-1);starPositions.push(Math.sin(el)*Math.cos(az)*14,Math.cos(el)*14,Math.sin(el)*Math.sin(az)*14);}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));const stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xc2e5ef,size:.055,transparent:true,opacity:.7}));objects.push(stars);scene.add(stars);
      const photoGroup=new THREE.Group();room.add(photoGroup);const loader=new THREE.TextureLoader(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
      const setView=()=>{
        if(mode==='basin'){camera.position.set(Math.sin(angle)*6.8,5.7,Math.cos(angle)*6.8);camera.lookAt(0,0,0);}
        else{camera.position.set(0,.1,0);camera.lookAt(Math.sin(angle)*5,Math.sin(pitch)*3,-Math.cos(angle)*5);}
      };setView();
      let lastRender=0;
      const draw=time=>{if(disposed)return;if(time-lastRender<33){frame=requestAnimationFrame(draw);return;}lastRender=time;const t=time*.001;if(!reduced())waterMaterial.uniforms.uTime.value=t;
        if(diveStart){const p=Math.min(1,(time-diveStart)/850);camera.position.lerp(new THREE.Vector3(0,.1,0),p*.22);camera.lookAt(0,-2,-1);if(p===1){diveStart=0;mode='room';basin.visible=false;room.visible=true;angle=0;pitch=0;setView();caption.textContent='拖动环顾照片，或开启转动手机。';}}
        renderer.render(scene,camera);frame=requestAnimationFrame(draw);
      };frame=requestAnimationFrame(draw);
      observer=new ResizeObserver(()=>{if(disposed)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();});observer.observe(host);
      const enter=index=>{
        if(!options.state.quests[index]?.verified){status.textContent='这根银丝仍被封印。先找到实体碎片。';return;}
        chosen=index;const pictures=options.photosFor(index,options.state);photoGroup.children.slice().forEach(m=>{photoGroup.remove(m);m.geometry.dispose();m.material.map?.dispose();m.material.dispose();});
        for(let i=0;i<4;i++){
          const photo=pictures[i%pictures.length],texture=loader.load(`./assets/${photo.file}.webp`,()=>{if(disposed)texture.dispose();else renderer.render(scene,camera);});texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
          const plane=add(new THREE.PlaneGeometry(3.4,2.55),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}),photoGroup);const a=i*Math.PI/2;plane.position.set(Math.sin(a)*4,0,-Math.cos(a)*4);plane.lookAt(0,0,0);
          // Preserve the complete image rather than cropping either face.
          texture.onUpdate=()=>{if(texture.image){const ratio=texture.image.width/texture.image.height;plane.scale.set(ratio>1?1:ratio/1.333,ratio>1?1.333/ratio:1,1);texture.onUpdate=null;}};
        }
        status.textContent=`记忆 ${index+1}：${pictures.map(p=>p.caption).join(' / ')}`;options.effect();
        dialog.querySelectorAll('[data-memory-thread]').forEach(b=>b.classList.toggle('active',Number(b.dataset.memoryThread)===index));
        if(mode==='basin'&&!reduced()){diveStart=performance.now();caption.textContent='穿过银光，潜入这一段回忆……';}else{mode='room';basin.visible=false;room.visible=true;angle=0;pitch=0;setView();caption.textContent='拖动环顾照片，或开启转动手机。';}
      };
      dialog.querySelectorAll('[data-memory-thread]').forEach(b=>b.onclick=()=>enter(Number(b.dataset.memoryThread)));
      dialog.querySelector('[data-return-basin]').onclick=()=>{mode='basin';diveStart=0;basin.visible=true;room.visible=false;angle=0;setView();caption.textContent='六根银丝，藏着属于我们的时刻。';};
      host.onpointerdown=e=>{host.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};moved=false;};
      host.onpointermove=e=>{
        const rect=host.getBoundingClientRect();waterMaterial.uniforms.uTouch.value.set((e.clientX-rect.left)/rect.width*5-2.5,2.5-(e.clientY-rect.top)/rect.height*5);waterMaterial.uniforms.uRipple.value=waterMaterial.uniforms.uTime.value;
        if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;angle-=dx*.008;pitch=Math.max(-.8,Math.min(.8,pitch+dy*.006));drag={x:e.clientX,y:e.clientY};setView();}
      };
      host.onpointerup=e=>{drag=null;if(moved||mode!=='basin')return;const rect=host.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(threads);if(hits.length)enter(hits[0].object.userData.memory);};host.onpointercancel=()=>drag=null;
      dialog.querySelector('[data-sensor]').onclick=async()=>{
        const button=dialog.querySelector('[data-sensor]');
        if(sensorEnabled){root.removeEventListener('deviceorientation',orientationHandler);sensorEnabled=false;baseline=null;button.textContent='开启转动手机看回忆';status.textContent='转动感应已关闭。可以继续拖动。';return;}
        if(!root.DeviceOrientationEvent){status.textContent='没有可用的方向传感器，请拖动查看。';return;}
        try{
          const result=typeof DeviceOrientationEvent.requestPermission==='function'?await DeviceOrientationEvent.requestPermission():'granted';if(ticket!==session)return;
          if(result!=='granted'){status.textContent='未允许方向感应，拖动查看同样可用。';return;}
          orientationHandler=e=>{if(e.alpha===null||e.beta===null||e.gamma===null)return;if(!baseline)baseline={alpha:e.alpha,beta:e.beta};if(mode==='room'){let delta=e.alpha-baseline.alpha;delta=((delta+540)%360)-180;angle=-delta*Math.PI/180;pitch=Math.max(-.8,Math.min(.8,(e.beta-baseline.beta)*Math.PI/180));setView();}};
          root.addEventListener('deviceorientation',orientationHandler);sensorEnabled=true;button.textContent='关闭转动感应';status.textContent='慢慢转动手机；若视角没有变化，请继续拖动。';
        }catch{status.textContent='方向感应没有开启，请拖动查看。';}
      };
      dialog.querySelector('[data-fullscreen]').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(dialog.requestFullscreen)await dialog.requestFullscreen();else status.textContent='这个浏览器不支持全屏，可以继续在窗口中探索。';}catch{status.textContent='无法进入全屏，可以继续在窗口中探索。';}};
      caption.textContent='六根银丝，藏着属于我们的时刻。';
      renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();status.textContent='银色水面暂时休息了。收起此页，仍可在相册中查看全部已解封照片。';cancelAnimationFrame(frame);});
    }catch{if(ticket===session){activeCleanup();status.textContent='这台设备暂时无法开启 3D 水面。收起此页，在记忆相册中查看照片即可。';caption.textContent='照片已经保存在记忆相册里。';}}
  }

  async function camera(){
    const ticket=open('摄像头魔杖 · 食指画符',`<p>追踪食指指尖。点击“开始记录”后，在空中画一个大 V 或一个圈，再结束记录施咒。</p><div class="camera-stage"><video autoplay muted playsinline></video><canvas></canvas><span class="camera-tip">画面和识别留在这台设备中</span></div><div class="hardware-controls"><button class="button primary" data-record disabled>开始记录轨迹</button><button class="button secondary" data-check-hand disabled>结束记录并施咒</button><button class="button quiet" data-hardware="close">关闭摄像头</button></div><p class="hardware-status" role="status">正在加载本地手势模型。首次需要下载约 18 MB，随后浏览器可缓存。</p>`);
    const video=dialog.querySelector('video'),canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),status=dialog.querySelector('.hardware-status');
    let stream=null,frame=0,recording=false,points=[],last=null,lastDetect=0,oldTime=-1,recordTimer;
    activeCleanup=()=>{cancelAnimationFrame(frame);clearTimeout(recordTimer);stream?.getTracks().forEach(t=>t.stop());video.pause();video.srcObject=null;};
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw Error('unsupported');
      const vision=await import('./vendor/mediapipe/vision_bundle.mjs');if(ticket!==session)return;
      if(!handModel){const files=await vision.FilesetResolver.forVisionTasks('./vendor/mediapipe/wasm');if(ticket!==session)return;handModel=await vision.HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./vendor/mediapipe/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.55,minTrackingConfidence:.5});}
      if(ticket!==session)return;
      const granted=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
      if(ticket!==session){granted.getTracks().forEach(t=>t.stop());return;}stream=granted;video.srcObject=stream;await video.play();if(ticket!==session)return;
      canvas.width=640;canvas.height=480;ctx.lineWidth=3;ctx.strokeStyle='#f5d992';ctx.lineCap='round';
      const record=dialog.querySelector('[data-record]'),check=dialog.querySelector('[data-check-hand]');record.disabled=false;
      record.onclick=()=>{points=[];last=null;recording=true;ctx.clearRect(0,0,640,480);record.disabled=true;check.disabled=false;status.textContent='轨迹记录中……缓慢画一个 V 或圈，完成后点击施咒。';recordTimer=setTimeout(()=>{recording=false;record.disabled=false;status.textContent='记录已暂停。点击结束记录施咒，或重新记录。';},10000);};
      check.onclick=()=>{
        recording=false;clearTimeout(recordTimer);record.disabled=false;check.disabled=true;
        if(options.recognize(points)){options.light();options.effect();status.textContent='Lumos！食指轨迹唤醒了灯光。';root.Immersion.haptic([20,40,20]);setTimeout(()=>{if(ticket===session)close();},900);}
        else status.textContent='这次轨迹还不清晰。可以再画大一点，或关闭摄像头，用屏幕画符。';
      };
      status.textContent='摄像头已开启。让整只手进入画面，点击开始记录，用食指画符。';
      const detect=time=>{
        if(ticket!==session)return;
        if(time-lastDetect>80&&video.currentTime!==oldTime){lastDetect=time;oldTime=video.currentTime;
          try{
            const result=handModel.detectForVideo(video,performance.now()),finger=result.landmarks[0]?.[8];
            if(finger){const p={x:(1-finger.x)*640,y:finger.y*480};if(recording&&(!last||Math.hypot(p.x-last.x,p.y-last.y)>3)){points.push(p);if(last){ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();}last=p;}}else last=null;
          }catch{recording=false;status.textContent='指尖追踪暂停了，可以重新记录，或改用屏幕画符。';}
        }
        frame=requestAnimationFrame(detect);
      };frame=requestAnimationFrame(detect);
    }catch{if(ticket===session){activeCleanup();status.textContent='摄像头或手势模型没有开启。关闭此页，直接在屏幕上画符即可。';}}
  }
  function voiceSpell(button){
    const Recognition=root.SpeechRecognition||root.webkitSpeechRecognition,status=button.parentElement.nextElementSibling;
    const say=text=>{if(status)status.textContent=text;};
    if(!Recognition){say('这台浏览器不支持语音施咒，请使用画符、长按或按钮。');return;}
    stopVoice();const recognition=new Recognition();voice=recognition;recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=3;button.disabled=true;
    say(button.dataset.spell==='patronus'?'正在倾听：Expecto Patronum（呼神护卫）':'正在倾听：Alohomora（阿拉霍洞开）');
    recognition.onresult=event=>{
      const alternatives=Array.from(event.results[event.results.length-1]).map(r=>r.transcript.toLowerCase().replace(/[^a-z\u4e00-\u9fff]/g,''));
      const matched=alternatives.some(t=>button.dataset.spell==='patronus'?t.includes('expectopatronum')||t.includes('呼神护卫'):t.includes('alohomora')||t.includes('阿拉霍洞开'));
      stopVoice();if(matched){say('咒语回应了你。');options.effect();if(button.dataset.spell==='patronus')options.cast();else{document.querySelector('.spell-lock')?.classList.add('open');root.Immersion.haptic([20,40,20]);}}
      else say('没有听清这道咒语。可以重新念一次，或用按钮继续。');
    };
    recognition.onerror=()=>{stopVoice();say('语音服务没有开启。可以用画符、长按或按钮继续。');};
    recognition.onend=()=>{clearTimeout(voiceTimer);voice=null;button.disabled=false;};
    try{recognition.start();voiceTimer=setTimeout(()=>{stopVoice();say('倾听已结束，可以重试或用按钮。');},10000);}catch{stopVoice();say('未能开始倾听，请用按钮继续。');}
  }
  function mount(o){cleanup();if(dialog.open)dialog.close();options=o;
    const ritual=document.querySelector('.spell-ritual');if(ritual)ritual.insertAdjacentHTML('beforeend','<div class="hardware-buttons"><button class="button secondary" data-hardware="camera">用摄像头追踪食指施咒</button></div><p class="hardware-note">主动开启摄像头后，食指识别在设备本地进行；离开时关闭。</p>');
    const cast=document.querySelector('.patronus-scene');if(cast)cast.insertAdjacentHTML('beforeend','<div class="hardware-buttons"><button class="button secondary" data-hardware="voice" data-spell="patronus">念出 Expecto Patronum</button><button class="button quiet" data-hardware="stop-voice">停止倾听</button></div><p class="voice-status" role="status"></p><p class="hardware-note">语音识别可能使用浏览器的在线服务；也可直接施咒。</p>');
    if(o.state.phase==='mission'&&o.state.mission===4&&o.state.quests[4].solved){const discovered=document.querySelector('.discovery');discovered.insertAdjacentHTML('beforeend','<div class="spell-lock" aria-hidden="true"></div><div class="hardware-buttons"><button class="button quiet" data-hardware="voice" data-spell="lock">念出 Alohomora，唤醒箱锁</button><button class="button quiet" data-hardware="stop-voice">停止倾听</button></div><p class="voice-status" role="status"></p><p class="hardware-note">这是可选开锁仪式。仍需找到箱中碎片的实体印记。</p>');}
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-hardware]');if(!b)return;switch(b.dataset.hardware){case'pensieve':pensieve();break;case'camera':camera();break;case'voice':voiceSpell(b);break;case'stop-voice':stopVoice();break;case'close':close();break;}});
  root.MagicHardware={mount,close,cleanup};
})(window);
