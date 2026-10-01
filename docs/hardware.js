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
    const ticket=open('The Pensieve · 记忆星球',`<p class="pensieve-intro">每一枚封印，让新的时光在同一片星空里显影。滑过水面，潜入逐渐完整的记忆星球。</p><div class="pensieve-webgl"><div class="pensieve-caption">正在唤醒银色水面……</div></div><div class="memory-selector">${options.state.quests.map((q,i)=>`<button data-memory-thread="${i}" ${q.verified?'':'disabled'}>记忆 ${i+1}${q.verified?' ✦':' ◇'}</button>`).join('')}</div><div class="hardware-controls"><button class="button primary" data-enter-sphere>潜入记忆星球</button><button class="button secondary" data-sensor aria-pressed="false">开启转动手机</button><button class="button secondary" data-return-basin>返回水面</button><button class="button quiet" data-fullscreen>全屏沉浸</button></div><p class="hardware-status" role="status">照片会随着实体印记累计显影。未解封区域仍是银色封印。</p>`);
    try{
      const {createPensieve}=await import('./pensieve.js?v=1');if(ticket!==session)return;
      activeCleanup=await createPensieve({dialog,options,isCurrent:()=>ticket===session,reduced});
      if(ticket!==session){activeCleanup();activeCleanup=()=>{};}
    }catch{if(ticket===session){dialog.querySelector('.hardware-status').textContent='这台设备暂时无法开启 3D 星球。收起此页，在普通相册查看已解封照片。';dialog.querySelector('.pensieve-caption').textContent='照片仍在记忆相册里等你。';}}
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
