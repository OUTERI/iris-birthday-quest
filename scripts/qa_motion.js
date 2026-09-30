async(page)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/docs/');
  await page.evaluate(()=>{const s=fresh();s.phase='mission';s.mission=3;s.last='kitchen';s.quests.slice(0,3).forEach(q=>q.verified=true);s.quests[3].runes=['flame','star','key'];localStorage.setItem('iris-birthday-quest-v3',JSON.stringify(s));});
  await page.reload();await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('[data-action="check-mirror"]').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('iris-birthday-quest-v3')).quests[3].solved);
  const motion=await page.locator('.artifact.is-enchanted').count();
  await page.reload();const restored=await page.locator('[data-form="seal"]').count();
  await page.locator('[data-action="hint"]').click();
  for(let i=0;i<3;i++)await page.locator('[data-action="next-hint"]').click();
  const levels=await page.locator('.hint-pages article').count();
  await page.locator('[data-action="close-modal"]').first().click();
  await page.locator('[data-action="reset"]').click();await page.locator('[data-action="close-modal"]').first().click();
  const kept=await page.locator('[data-form="seal"]').count();
  await page.locator('[data-action="reset"]').click();await page.locator('[data-action="confirm-reset"]').click();
  const reset=await page.locator('[data-action="open-letter"]').count();
  const report={normalMotion:motion===1,stateSavedBeforeAnimation:saved,refreshDuringSuccess:restored===1,threeHintLevels:levels===3,resetCancelKeepsState:kept===1,confirmedReset:reset===1};
  if(Object.values(report).some(value=>value!==true)||errors.length)throw Error(JSON.stringify({report,errors}));
  await page.reload();await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'C:/Users/23271/Documents/ChatGPT/bth/output/desktop-final.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'C:/Users/23271/Documents/ChatGPT/bth/output/mobile-final.png',fullPage:true});
  const bytes=await page.evaluate(()=>performance.getEntriesByType('resource').reduce((sum,r)=>sum+r.decodedBodySize,0));
  if(bytes>1.5*1024*1024)throw Error('Initial resources exceed budget: '+bytes);
  return {...report,initialBytes:bytes,errors};
}
