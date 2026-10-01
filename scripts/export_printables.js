async(page)=>{
  const report=[];
  for(const [file,expected,out] of [['printables.html',15,'iris-birthday-printables-immersive.pdf'],['organizer.html',8,'iris-birthday-organizer-immersive.pdf']]){
    const p=await page.context().newPage();await p.goto('http://127.0.0.1:8765/print/'+file);await p.emulateMedia({media:'print'});
    await p.evaluate(()=>document.fonts.ready);await p.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
    const layout=await p.evaluate(()=>({pages:document.querySelectorAll('.sheet').length,clipped:[...document.querySelectorAll('.sheet,.cut')].map((e,i)=>({index:i,kind:e.className,overflow:e.scrollHeight-e.clientHeight})).filter(e=>e.overflow>2)}));
    if(layout.pages!==expected||layout.clipped.length)throw Error(JSON.stringify({file,...layout}));
    await p.pdf({path:'C:/Users/23271/Documents/ChatGPT/bth/print/'+out,printBackground:true,preferCSSPageSize:true});report.push({file,...layout});await p.close();
  }
  return report;
}
