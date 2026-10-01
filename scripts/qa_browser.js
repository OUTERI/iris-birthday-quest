async (page) => {
  const base='http://127.0.0.1:8765/docs/',key='iris-birthday-quest-v3';
  const errors=[],results=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1'))errors.push(r.status()+' '+r.url());});
  const assert=(condition,message)=>{if(!condition)throw Error(message);};
  const get=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  const click=async action=>{await page.locator(`[data-action="${action}"]`).first().click();await page.waitForTimeout(30);};
  const submit=async(kind,value)=>{await page.locator(`[data-form="${kind}"] input`).fill(value);await page.locator(`[data-form="${kind}"] button[type="submit"]`).click();await page.waitForTimeout(30);if(kind==='seal'&&(await get()).phase==='memory'){await page.locator('.memory-photo-stack img').first().waitFor();assert(await page.locator('.memory-photo-stack img').count()>0,'verified fragment did not reveal photographs');await page.reload();assert((await get()).phase==='memory','memory reveal not restored');await click('continue-memory');}};
  const choose=async(field,index,value)=>page.locator(`[data-field="${field}"][data-index="${index}"]`).selectOption(String(value));
  const snapshot=async name=>page.screenshot({path:`C:/Users/23271/Documents/ChatGPT/bth/output/qa-${name}.png`,fullPage:true});
  await page.goto(base);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});
  await page.evaluate(k=>{localStorage.removeItem(k);localStorage.setItem('iris-birthday-quest-v2',JSON.stringify({legacy:'retained'}));},key);await page.reload();
  await click('open-letter');await snapshot('letter');await click('accept-letter');
  await submit('ticket','0000');assert((await get()).phase==='ticket','wrong ticket advanced');
  await submit('ticket','1002');await page.locator('[data-action="arrive"]').click({force:true});await page.waitForTimeout(30);
  for(let i=0;i<5;i++){
    await page.locator(`[data-action="choice"][data-value="${i%2}"]`).click();await page.waitForTimeout(20);
    const expected=await page.evaluate(({i,choice})=>QuestData.questions[i].responses[choice],{i,choice:i%2});
    assert((await page.locator('.response').innerText()).includes(expected),'sorting response mismatch');await click('next-question');
  }
  await snapshot('sorting-reveal');await click('start-gear');for(let i=0;i<3;i++)await click('next-gear');
  await click('map');assert(await page.locator('#book-dialog .map-room.is-last').getAttribute('class')!==null,'map lacks last confirmed');assert(await page.locator('#book-dialog .map-room.is-target').count()===1,'map target missing');await click('close-modal');await click('start-missions');
  await click('check-post');assert((await get()).quests[0].step===0,'unsolved post advanced');
  const desired=['B','D','A','C'];
  for(let i=0;i<4;i++){let s=await get();while(s.quests[0].order.indexOf(desired[i])>i){const j=s.quests[0].order.indexOf(desired[i])-1;await page.locator(`[data-action="mail-down"][data-value="${j}"]`).click();s=await get();}}
  for(const [i,v]of ['star','key','moon','heart'].entries())await choose('seals',i,v);
  await snapshot('postal');await click('check-post');await page.reload();assert((await get()).quests[0].step===1,'post step not restored');
  await submit('word','海德薇');await submit('seal','41');assert((await get()).mission===0,'wrong physical mark advanced');await page.reload();assert(await page.locator('[data-form="seal"]').count()===1,'solved but unfound state lost');await submit('seal','20');
  for(const [i,v]of [2,1,4,3].entries())await choose('powers',i,v);
  await page.reload();assert((await page.locator('[data-field="powers"][data-index="2"]').inputValue())==='4','potion partial state lost');
  await click('check-powers');for(const v of ['B','A','C']){await page.locator(`[data-action="pour"][data-value="${v}"]`).click();}
  await click('check-brew');assert(!(await get()).quests[1].solved,'wrong brew order accepted');await click('clear-brew');
  for(const v of ['A','C','B'])await page.locator(`[data-action="pour"][data-value="${v}"]`).click();
  await snapshot('potions');await click('check-brew');await submit('seal','5');assert((await get()).mission===1,'missing leading zero accepted');await submit('seal','05');assert((await get()).phase==='interlude','act I boundary missing');await click('next-act');
  await click('check-table');assert((await get()).quests[2].step===0,'empty table accepted');
  for(const [i,v]of ['owl','fox','deer','ghost'].entries())await choose('guests',i,v);
  for(const [i,v]of ['moon','leaf','flame','empty'].entries())await choose('drinks',i,v);
  await snapshot('tavern');await click('check-table');await submit('tavern','台面下');await submit('seal','10');
  assert(!(await page.locator('#app').innerText()).includes('卫生间'),'physical location exposed before solve');
  for(const [i,turns]of [5,2,3].entries())for(let n=0;n<turns;n++)await page.locator(`[data-action="turn-rune"][data-value="${i}"]`).click();
  await snapshot('chamber');await click('check-mirror');await submit('seal','02');await click('next-act');
  const layout=['1','A','3','4','2','B'];
  for(let i=0;i<6;i++){let s=await get();if(s.quests[4].slots[i]!==layout[i]){await page.locator(`[data-id="${s.quests[4].slots[i]}"]`).click();await page.locator(`[data-id="${layout[i]}"]`).click();}}
  for(const id of layout){let s=await get();await page.locator(`[data-id="${id}"]`).click();for(let n=0;n<(4-s.quests[4].rotations[id]/90)%4;n++)await click('rotate-tile');await page.locator(`[data-id="${id}"]`).click();}
  await snapshot('atlas');await click('check-tiles');await page.locator('[data-action="route"][data-value="star"]').click();assert((await get()).quests[4].route.length===0,'wrong route not reset');
  for(const id of ['flame','star','key']){await page.locator(`[data-action="route"][data-value="${id}"]`).click();await page.waitForTimeout(30);}
  await page.locator('[data-place="potion"]').click();assert(!(await get()).quests[4].solved,'wrong map target accepted');await page.locator('[data-place="station"]').click();await page.waitForTimeout(30);await submit('seal','24');
  await click('map');assert(await page.locator('#book-dialog .map-room.is-target').count()===0,'star target exposed early');await click('close-modal');
  for(let i=0;i<3;i++)await click('rotate-sky');await click('mirror-sky');await page.reload();assert((await get()).quests[5].rotation===0&&!(await get()).quests[5].mirror,'star alignment state lost');await click('check-sky');
  for(const id of ['I1','R','I2','S'])await page.locator(`[data-action="star"][data-value="${id}"]`).click();
  await snapshot('astronomy');await click('check-stars');await page.locator('[data-place="balcony"]').click();await page.waitForTimeout(30);await submit('seal','11');
  assert((await get()).phase==='finale','six marks did not unlock finale');await submit('date','1002');assert((await get()).phase==='finale','birthday accepted as anniversary');assert(await page.locator('.secret-letter').count()===1,'birthday Easter egg absent');await click('close-modal');await submit('date','1111');await click('finish');assert((await get()).phase==='end','full quest failed');await page.locator('[data-magic="cast-fallback"]').click();await page.waitForTimeout(30);assert((await get()).endStage===1,'patronus did not reach cake');await page.locator('[data-magic="blow"]').click();await page.waitForTimeout(30);assert((await get()).endStage===2,'cake did not reveal letter');
  assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('iris-birthday-quest-v2')).legacy==='retained'),'legacy state overwritten');
  const final=await get();results.push('full mobile flow, error gates, act boundaries, refresh, legacy retention: PASS');
  const widths=[320,390,430,768,1200],screens=[['letter',0,0],['ticket',0,0],['sorting',0,0],['reveal',0,0],['map-intro',0,0],...Array.from({length:6},(_,i)=>['mission',i,0]),['mission',1,1],['mission',4,1],['mission',5,1],['finale',6,0]];
  const tab=await page.context().newPage();tab.on('pageerror',e=>errors.push(e.message));await tab.goto(base);await tab.emulateMedia({reducedMotion:'reduce'});
  for(const width of widths){await tab.setViewportSize({width,height:900});for(const [phase,index,step]of screens){const s=structuredClone(final);s.phase=phase;s.question=0;s.letterOpen=true;s.mission=index;s.last='sorting';s.quests.forEach((q,i)=>{q.verified=i<index;q.solved=false;q.step=i===index?step:0;});await tab.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:key,s});await tab.reload();await tab.evaluate(()=>document.fonts.ready);const overflow=await tab.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!overflow,`overflow ${width} ${phase}/${index}/${step}`);}}
  results.push(`${widths.length*screens.length} responsive scenarios: PASS`);
  await tab.close();assert(errors.length===0,'browser errors: '+errors.join('; '));
  await page.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:key,s:final});await page.reload();
  return {results,errors,completed:final.quests.map(q=>q.verified)};
}
