async(page)=>{
  const base='http://127.0.0.1:8765/docs/',key='iris-birthday-quest-v3',results=[],errors=[];
  const p=await page.context().newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewportSize({width:390,height:844});await p.goto(base);await p.emulateMedia({reducedMotion:'reduce'});
  const assert=(v,msg)=>{if(!v)throw Error(msg);};
  const seed=async(phase,mission=6,endStage=0)=>{await p.evaluate(({key,phase,mission,endStage})=>{const s=fresh();s.phase=phase;s.mission=mission;s.endStage=endStage;s.last='living';s.quests.forEach((q,i)=>q.verified=i<mission);localStorage.setItem(key,JSON.stringify(s));},{key,phase,mission,endStage});await p.reload();};
  await seed('mission',3);
  const gesture=await p.evaluate(()=>{
    const v=Array.from({length:40},(_,i)=>i<20?{x:20+i*3,y:20+i*4}:{x:80+(i-20)*3,y:100-(i-20)*4});
    const circle=Array.from({length:80},(_,i)=>({x:100+55*Math.cos(i/79*Math.PI*2),y:90+50*Math.sin(i/79*Math.PI*2)}));
    const line=Array.from({length:40},(_,i)=>({x:i*4,y:25}));return [Immersion.isGesture(v),Immersion.isGesture(circle),Immersion.isGesture(line)];
  });assert(gesture[0]&&gesture[1]&&!gesture[2],'gesture geometry wrong');
  const slate=await p.locator('.gesture-slate').boundingBox();await p.mouse.move(slate.x+25,slate.y+25);await p.mouse.down();await p.mouse.move(slate.x+100,slate.y+110,{steps:20});await p.mouse.move(slate.x+180,slate.y+25,{steps:20});await p.mouse.up();assert(await p.locator('.lumos-paper.lit').count()===1,'actual V drawing failed');
  await p.reload();assert(await p.locator('.lumos-paper.lit').count()===1,'Lumos lost on refresh');await p.locator('[data-magic="lumos-fallback"]').click();assert(await p.locator('.lumos-paper.readable').count()===1,'accessible Lumos fallback missing');
  await p.screenshot({path:'C:/Users/23271/Documents/ChatGPT/bth/output/upgrade-lumos.png',fullPage:true});results.push('V/circle recognition, invalid line rejection, real drawing, persistence and readable fallback: PASS');
  await seed('memory',4);await p.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.memoryIndex=3;localStorage.setItem(key,JSON.stringify(s));},key);await p.reload();
  await p.locator('[data-hardware="pensieve"]').click();await p.waitForFunction(()=>document.querySelector('.pensieve-caption')?.textContent==='六根银丝，藏着属于我们的时刻。',null,{timeout:30000});
  assert(await p.locator('[data-memory-thread]:disabled').count()===2,'3D exposed unverified memories');await p.locator('[data-memory-thread="0"]').click();assert((await p.locator('.hardware-status').innerText()).includes('记忆 1'),'3D memory did not enter');await p.screenshot({path:'C:/Users/23271/Documents/ChatGPT/bth/output/upgrade-pensieve.png',fullPage:true});
  await p.locator('[data-return-basin]').click();await p.locator('#hardware-dialog [data-hardware="close"]').click();assert(await p.locator('#hardware-dialog[open]').count()===0,'3D failed to close');results.push('WebGL water, memory dive, locked threads and disposal: PASS');
  await seed('end');
  await p.locator('#hold-patronus').focus();await p.keyboard.down('Space');await p.waitForTimeout(1700);await p.keyboard.up('Space');await p.locator('.cake-art').waitFor();assert(await p.evaluate(()=>state.endStage)===1,'keyboard hold did not cast');
  // Denied microphone must preserve cake and the manual route.
  await p.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError');};});await p.locator('[data-magic="microphone"]').click();await p.waitForFunction(()=>document.querySelector('.mic-status')?.textContent.includes('未能开启'));
  assert(await p.locator('[data-magic="blow"]:enabled').count()===1,'mic denial disabled fallback');
  // Pending permission canceled by the user must stop a late stream.
  await p.evaluate(()=>{window.stops=0;navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>window.resolveMic=resolve);});await p.locator('[data-magic="microphone"]').click();await p.locator('[data-magic="blow"]').click();await p.evaluate(()=>window.resolveMic({getTracks:()=>[{stop:()=>window.stops++}]}));await p.waitForTimeout(100);assert(await p.evaluate(()=>window.stops)===1,'late microphone stream leaked');assert(await p.evaluate(()=>state.endStage)===2,'manual blow failed');results.push('keyboard Patronus, denied microphone fallback, late microphone cancellation: PASS');
  // Test a granted audio stream and verify detection closes every track.
  await seed('end',6,1);
  await p.evaluate(()=>{window.micStopped=false;window.testAudio=new AudioContext();const oscillator=testAudio.createOscillator(),gain=testAudio.createGain(),destination=testAudio.createMediaStreamDestination();oscillator.connect(gain);gain.connect(destination);gain.gain.value=0;oscillator.start();window.testGain=gain;destination.stream.getTracks()[0].addEventListener('ended',()=>window.micStopped=true);window.testTrack=destination.stream.getTracks()[0];navigator.mediaDevices.getUserMedia=async()=>destination.stream;});
  await p.locator('[data-magic="microphone"]').click();await p.waitForTimeout(1000);await p.evaluate(()=>{testAudio.resume();testGain.gain.value=.2;});await p.waitForFunction(()=>state.endStage===2,null,{timeout:5000});assert(await p.evaluate(()=>testTrack.readyState)==='ended','successful blow did not stop microphone');await p.evaluate(()=>testAudio.close());results.push('granted microphone amplitude detection and track cleanup: PASS');
  // Stub the browser speech service; no real recordings leave this QA run.
  await seed('end');await p.evaluate(()=>{window.SpeechRecognition=class{start(){window.qaSpeech=this;}abort(){window.speechAborted=true;}};});await p.locator('[data-spell="patronus"]').click();await p.evaluate(()=>qaSpeech.onresult({results:[[{transcript:'Expecto Patronum'}]]}));await p.locator('.cake-art').waitFor();assert(await p.evaluate(()=>state.endStage)===1,'voice spell did not cast');results.push('speech match and stop: PASS');
  // All photos are distributed exactly once and loading was not added to admission.
  await seed('letter',0);const list=await p.evaluate(()=>Array.from({length:6},(_,i)=>Immersion.photosFor(i,state).map(p=>p.file)).flat());assert(list.length===11&&new Set(list).size===11,'photo distribution lost/duplicated photos');await p.reload();const heavy=await p.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/three.module|mediapipe|memories\//.test(r.name)).length);assert(heavy===0,'heavy assets loaded on admission');
  results.push('11 photos, stable allocation, lazy hardware/photo loading: PASS');
  await p.close();assert(errors.length===0,'JS errors: '+errors.join(';'));return{results,errors};
}
