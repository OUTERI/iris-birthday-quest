async(page)=>{
  const results=[],errors=[],base='http://127.0.0.1:8765/docs/';
  page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw Error(message);};
  await page.goto(base);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1100,height:1000});
  const setup=async count=>{
    await page.evaluate(count=>{
      MagicHardware.close();const s=fresh();s.memoryOrder=Array.from({length:11},(_,i)=>i+1);s.quests.forEach((q,i)=>q.verified=i<count);
      MagicHardware.mount({state:s,photosFor:Immersion.photosFor,effect:()=>{},recognize:()=>false});
      if(!document.querySelector('#qa-open-pensieve')){const b=document.createElement('button');b.id='qa-open-pensieve';b.dataset.hardware='pensieve';b.textContent='QA 冥想盆';document.querySelector('#app').prepend(b);}
    },count);
    await page.locator('#qa-open-pensieve').click();await page.waitForFunction(()=>document.querySelector('.pensieve-webgl')?.dataset.photosReady==='true');
  };
  for(const count of [0,1,3,6]){
    const requests=[];const record=request=>{if(/memory-\d+\.webp/.test(request.url()))requests.push(request.url().split('/').at(-1));};page.on('request',record);
    await setup(count);page.off('request',record);
    const data=await page.locator('.pensieve-webgl').evaluate(e=>({...e.dataset}));assert(Number(data.totalPhotos)===11,'not eleven unique sphere slots');assert(Number(data.unlockedPhotos)===Math.min(11,count*2),'wrong unlocked count');assert(Number(data.loadedPhotos||0)===Math.min(11,count*2),'unlocked photograph did not load');
    assert(requests.every(name=>Number(name.match(/memory-(\d+)/)[1])<=Math.min(11,count*2)),`sealed photos downloaded at ${count}: ${JSON.stringify(requests)}`);
    assert(await page.locator('[data-memory-thread]:disabled').count()===6-count,'wrong silver-thread locking');
    if(!count){assert(await page.locator('[data-enter-sphere]').isDisabled(),'empty sphere can be entered');continue;}
    await page.locator('[data-memory-thread="0"]').click();assert(await page.locator('.pensieve-webgl').getAttribute('data-mode')==='room','sphere entry failed');
    const before=await page.locator('.pensieve-webgl').getAttribute('data-loaded-photos');
    await page.locator('[data-sphere-next]').click();await page.locator('[data-photo-open]').click();assert(await page.locator('.sphere-viewer').isVisible(),'photo inspector missing');assert(await page.locator('.sphere-viewer img').getAttribute('src')==='./assets/memories/memory-02.webp','wrong photo inspector');
    await page.locator('[data-viewer-next]').click();assert((await page.locator('.sphere-viewer img').getAttribute('src')).includes(count===1?'memory-01':'memory-03'),'viewer navigation failed');await page.keyboard.press('Escape');assert(await page.locator('.sphere-viewer').isHidden(),'Escape closed whole dialog instead of photo');
    await page.locator('.sphere-dial').click();assert(await page.locator('.sphere-filmstrip').isVisible(),'star dial did not expand');assert(await page.locator('.sphere-filmstrip button:enabled').count()===Math.min(11,count*2),'strip unlock mismatch');
    await page.locator('[data-return-basin]').click();await page.locator('[data-enter-sphere]').click();assert(await page.locator('.pensieve-webgl').getAttribute('data-loaded-photos')===before,'entry replaced cumulative photos');
    results.push(`${count} seals: cumulative ${Math.min(11,count*2)} / 11 photos, locked-resource gating, focus and navigation PASS`);
  }
  await page.evaluate(()=>{
    window.sensorRequests=0;window.sensorListeners=0;DeviceOrientationEvent.requestPermission=async()=>{sensorRequests++;return 'denied';};
    const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);window.addEventListener=(name,...args)=>{if(name==='deviceorientation')sensorListeners++;return add(name,...args);};window.removeEventListener=(name,...args)=>{if(name==='deviceorientation')sensorListeners--;return remove(name,...args);};
  });
  await page.locator('[data-sensor]').click();assert(await page.evaluate(()=>sensorRequests===1&&sensorListeners===0),'denied sensor listener attached');
  await page.evaluate(()=>DeviceOrientationEvent.requestPermission=async()=>{sensorRequests++;return 'granted';});await page.locator('[data-sensor]').click();
  assert(await page.evaluate(()=>sensorListeners)===1,'sensor listener missing');
  await page.evaluate(()=>{for(const alpha of [10,30,50,80,110,150,190,230,270,320,350,10]){const e=new Event('deviceorientation');Object.assign(e,{alpha,beta:70,gamma:0});dispatchEvent(e);}});
  assert(Number(await page.locator('.pensieve-webgl').getAttribute('data-sensor-events'))===12,'full-rotation events not consumed');
  await page.locator('[data-sensor]').click();assert(await page.evaluate(()=>sensorListeners)===0,'manual sensor cleanup failed');
  const tourBefore=await page.locator('[data-sphere-photo].active').getAttribute('data-sphere-photo');await page.locator('[data-sphere-tour]').click();assert(await page.locator('[data-sphere-tour]').getAttribute('aria-pressed')==='true','tour failed');await page.waitForFunction(index=>document.querySelector('[data-sphere-photo].active')?.dataset.spherePhoto!==index,tourBefore,{timeout:15000});
  const canvas=page.locator('.pensieve-webgl canvas'),box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6);await page.mouse.down();await page.mouse.move(box.x+box.width*.3,box.y+box.height*.5,{steps:30});await page.mouse.up();assert(await page.locator('[data-sphere-tour]').getAttribute('aria-pressed')==='false','touch did not pause tour');
  const touch=await page.context().newCDPSession(page),beforeZoom=await canvas.screenshot(),y=box.y+box.height*.5;
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.3,y,id:1},{x:box.x+box.width*.65,y,id:2}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.3,y,id:1},{x:box.x+box.width*.92,y,id:2}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);const afterZoom=await canvas.screenshot();assert(!beforeZoom.equals(afterZoom),'two-finger pinch did not change rendered field of view');assert(await page.locator('.sphere-viewer').isHidden(),'pinch accidentally opened a photo');await touch.detach();
  await page.locator('[data-sensor]').click();await page.locator('#hardware-dialog [data-hardware="close"]').click();assert(await page.evaluate(()=>sensorListeners)===0,'sensor leaked after dialog close');results.push('denied/granted sensor, quaternion rotation, tour, drag interruption and cleanup PASS');
  for(const width of [320,390,768,1200]){
    await page.setViewportSize({width,height:950});await setup(6);await page.locator('[data-memory-thread="0"]').click();
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),'document overflow');assert(!(await page.locator('#hardware-dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1)),`dialog overflow ${width}`);
    if(width===390){await page.screenshot({path:'C:/Users/23271/Documents/ChatGPT/bth/output/playwright/pensieve-sphere-mobile.png'});}
    if(width===1200){await page.screenshot({path:'C:/Users/23271/Documents/ChatGPT/bth/output/playwright/pensieve-sphere-desktop.png'});}
  }
  results.push('sphere mobile / tablet / desktop 320–1200px PASS');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('[data-return-basin]').click();await page.locator('[data-enter-sphere]').click();await page.waitForFunction(()=>document.querySelector('.pensieve-webgl')?.dataset.mode==='room');results.push('animated dive PASS');
  await page.locator('#hardware-dialog [data-hardware="close"]').click();assert(!errors.length,errors.join('; '));return{results,errors};
}
