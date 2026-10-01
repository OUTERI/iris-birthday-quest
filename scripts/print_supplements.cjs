const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function(D,root){
  const sandbox={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'docs/birthday-content.js'),'utf8'),sandbox);
  const C=sandbox.window.BirthdayContent;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const page=(title,body)=>`<section class="sheet supplement"><header><span>Iris · Birthday field notes</span><b>${title}</b></header>${body}</section>`;
  const list=items=>`<ul class="checks">${items.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  const table=(head,rows)=>`<table class="guide-table"><thead><tr>${head.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const answers=['B→D→A→C；星→钥匙→月亮→心；猫头鹰。','A=2/B=1/C=4/D=3；投入 A→C→B。','北猫头鹰/月，东狐狸/叶，南鹿/火，西鬼魂/空杯；取字台面下。','月亮+2=钥匙；钥匙-1=星；星+3=火；镜面倒序：火→星→钥匙。','上排①/A/③，下排④/②/B，全正向。岔路火→星→钥匙，点 9¾。','正向、取消镜像；依次 (20,55)/(50,20)/(65,45)/(80,65)，得到 IRIS，点天文塔。'];
  const printing=[['1','入学内页与正式二维码，放入入户信封。'],['2','1002 小卡、地点标签与封签；车票/登车码在箱外。'],['3-5','六张双面碎片；印记 20 / 05 / 10 / 02 / 24 / 11。'],['6-9','邮件、魔药记录/杯垫、桌垫/杯签、密室卡/天文学笔记。'],['10','可选地图与探索手札，可作地图第一层；①封签的第二折另装。'],['11','互动小卡，Lumos 随密室课卡带走，其余夹入手札。'],['12','可选六张祝福卡，随对应编号礼物藏好，不遮挡原碎片。'],['13-15','可选 11 张照片卡与题词卡，可任意藏入礼物或留作终局相册。']];
  const hardware=[
    ['魔药','长按药剂拖入坩埚，顺序 A→C→B。','改为逐杯点击。实体饮品无需混合。'],
    ['Lumos','屏幕画大 V 或圈，移动光圈读方法。','直接点亮并阅读全文；纸卡数字仍需现场灯照。'],
    ['食指追踪','整手入镜，开始记录后食指画 V/圈，再结束施咒。','收起摄像头，改屏幕画符；独立笔尖不追踪。'],
    ['3D / 转动','点已解封银丝，拖动环顾；可主动开启转动感应。','普通相册可看照片；方向感应失败时用拖动。'],
    ['Alohomora','第五课解题后可选念英文开锁咒。','跳过仪式，开实体箱找碎片印记 24。'],
    ['守护神','读完手写信后长按约 1.5 秒，或念 Expecto Patronum。','直接施咒；语音可能联网，可停止倾听。'],
    ['吹蜡烛','许愿；开启麦克风，安静半秒，再吹气约半秒。','蛋糕上向上滑动或点按钮；音乐调低，避免大声误触。']
  ];
  const scripts=[
    '六枚记忆归位：“这些小小的魔法，最后会组成一句只属于我们的咒语。按编号排好纸片，想想故事开始的那一天。”',
    '拿到手写信：“这一封，留给你慢慢读。我会在这里等你。”',
    '守护神与许愿：“把今晚最开心的一个瞬间放在心里。让它变成光，再许一个只属于你的愿望。”',
    '祝福信结束：“生日快乐，媛宝。现在把手机放下，我们一起切蛋糕。”'
  ];
  const rehearsal=[
    '扫纸信二维码 → 接受邀请 → 箱外登车码 1002 → 五题分院 → 人像 → 逐件领取袍/杖/徽章。',
    '邮局排序/印章 → 猫头鹰 → 地图第二折 → 20 → 解封照片/祝福 → 继续。',
    '魔药药力 → 拖动或点 A/C/B → 蓝色杯垫 → 05 → 照片 → 第一幕过场。',
    '酒馆座位/饮品 → 杯签台面下 → 10 → 照片 → 继续。',
    '密室画符/可选摄像头 → 灯照纸卡 → 火/星/钥匙 → 镜角 → 02 → 照片。',
    '地图拼图/三个岔路 → 9¾ → 可选 Alohomora → 音乐盒 → 24 → 照片。',
    '天文学正向不镜像 → 四星 → IRIS → 天文塔信封 → 11 → 照片 → 六枚齐集。',
    '排实体句子 → 1111 → 电视柜礼物/手写信 → 我读完了这封信。',
    '长按/直接施咒 → 银猫 → 许愿 → 上滑/按钮/可选麦克风 → 祝福信 → 切真实蛋糕。',
    '题解中间、已解题待找片、记忆页各刷新一次，确认原位续玩；05/02 前导零有效。',
    '试 3D、转动、摄像头、语音与吹气，确认关闭后不再使用设备；备用操作均可走通。',
    '预演完成后，正式开始前重置一次；随后保持同一浏览器，不再重置或清理站点数据。'
  ];
  const setup=[
    '入户：已购信封和印章内放入学内页/二维码。',
    '中下卧室 / 9¾：车票、1002 卡在箱外；箱内音乐盒、碎片⑤/24，箱外⑤封签。',
    '左下卧室 / 分院大厅：椅子、3D 分院帽、袍、杖、徽章。',
    '客厅 / 邮局：地图第一层、四封邮件、递送附记公开；第二折①封签后藏 OWL POST 信封，装海德薇、碎片①/20、天文学笔记。',
    '上中卧室 / 魔药：左→右 A可乐/B蓝色芬达/C橙色芬达/D雪碧；记录卡公开，蓝色杯垫下②/05；桌旁密室卡、Lumos 卡和灯，第二课后携带。',
    '隐形笔在密室卡月亮/钥匙/星框内分别写 +2、-1、+3。不要再写“门背后”或“卫生间”。',
    '厨房 / 酒馆：桌垫公开；月2/台、叶5/面、火8/下杯签打乱。靠入口台面下干燥处③/10。',
    '窄卫生间 / 密室：镜子右下角干燥处④/02。',
    '阳台 / 天文塔：靠客厅门一侧金色信封，飞贼手链与⑥/11；不要靠近栏杆。',
    '客厅电视柜：化妆品、手写信；终局准备真实蛋糕、蜡烛和点火器。'
  ];
  const player=[page('魔法地图与探索手札',`<p class="note">沿虚线裁下，可作为实体地图第一层。①号封签后的第二折需另行装入信封，第一课解开后才展开。</p><div class="cut field-map"><p class="script map-title">I solemnly swear…</p>${D.mapSVG()}<p>地图描绘相对方位，请用魔法名字认路。</p></div><div class="cut quest-passport"><h2>Iris 的六枚记忆封印</h2><div class="passport-grid">${D.missions.map((m,i)=>`<div><b>○ ${i+1}</b><span>${m.name}</span></div>`).join('')}</div><p>手机解题 → 找到纸片 → 输入纸背印记 → 解封照片 → 继续。</p><p class="note">想休息时，魔法会等你。手机“收藏”中可回看已解封的照片。</p></div>`),
  page('魔法互动小卡',`<p class="note">沿虚线剪下。Lumos 卡随密室课卡带走，其余夹入手札。互动是可选的，原有按钮也能继续。</p><div class="ritual-grid">${[
    ['Lumos · 荧光闪烁','V　◯','手指画一个大 V 或圈，点亮屏幕阅读灯。也可主动开启摄像头，让食指在空中画符。','纸卡隐形数字仍用现场的灯照；备用：直接点亮并阅读全文。'],
    ['The Pensieve · 冥想盆','≈　✦　≈','一枚实体印记，唤醒一组照片。收藏中点“潜入 3D 冥想盆”，点已解封银丝，拖动环顾。','可主动开启转动手机；备用：普通相册回看。'],
    ['Alohomora · 阿拉霍洞开','⚿','地图找到行李终点后，可对手机念 Alohomora，为打开⑤号封签的箱子加一道仪式。','语音不是通关条件；仍要找箱内实体印记。'],
    ['Expecto Patronum · 呼神护卫','✧','读完最后手写信，长按魔杖约 1.5 秒召唤银猫。也可念 Expecto Patronum，或直接施咒。','许愿后，上滑或按钮熄灭网页蜡烛；麦克风吹气可选。']
  ].map(([title,glyph,text,note])=>`<article class="cut ritual-card"><h2>${title}</h2><div class="ritual-glyph">${glyph}</div><p>${text}</p><small>${note}</small></article>`).join('')}</div><div class="gentle-note"><h2>A little magic, at your own pace.</h2><p>摄像头、麦克风和转动感应只会在主动开启后使用。魔法暂时没回应时，换一种操作，也能走到结尾。</p></div>`),
  page('六枚封印的生日祝福',`<p class="note">可选附加卡：剪下后按编号随六枚碎片一起藏好。不要覆盖碎片句子、残图或印记。</p><div class="wish-grid">${C.wishes.map((w,i)=>`<article class="cut wish-card"><span>✦ ${i+1}</span><h2>${esc(w.title)}</h2><p>${esc(w.text)}</p><small>For Iris, with love.</small></article>`).join('')}</div>`)
  ];
  for(let n=0;n<3;n++){const photos=C.photos.slice(n*4,n*4+4);player.push(page(`可选回忆照片卡 ${n+1} / 3`,`<p class="note">沿虚线剪下，可任意分配到礼物信封，或留作终局小相册。纸质分配不影响手机固定保存的随机顺序。</p><div class="photo-print-grid">${photos.map((p,j)=>`<figure class="cut photo-print"><img src="../docs/assets/${esc(p.file)}.webp" alt="${esc(p.caption)}"><figcaption><small>Memory ${String(n*4+j+1).padStart(2,'0')}</small>${esc(p.caption)}</figcaption></figure>`).join('')}${photos.length===3?'<article class="cut photo-print photo-dedication"><p class="script">For you.<br>Always.</p><p>照片里的故事，<br>会一直有下一页。</p><small>Iris · 02 October</small></article>':''}</div>`));}
  const host=[page('主持人 · 印刷与新增准备',`<h1>十五页玩家包，按用途取用。</h1>${table(['页码','用途与摆放'],printing)}<h2>新增准备，不需购买机关</h2>${list(['实际游玩手机充满电，保持同一浏览器；备充电器。','预先试开 3D 和摄像头以缓存资源；摄像头首开约 18 MB，用稳定网络。','备支架或能稳放手机的位置；摄像头前留一只手距离与足够光线。','音乐默认关闭，可主动打开；音量调低，给语音与吹气留安静环境。','11 张照片随机分配：前五枚各两张，最后一枚一张。同次旅程刷新不变，无需手工配对实物。','预演后正式开场前重置一次；正式开始后不再重置或清理浏览器数据。'])}<p class="note">A4 单面、100% 比例、开启背景图形、关闭页眉页脚。双面碎片/杯签用折叠制作。第 10-15 页是新增可选材料。</p>`)];
  for(let n=0;n<3;n++)host.push(page(`主持人 · 第 ${n*2+1}-${n*2+2} 课递进提示`,`<h1>一次给一级，留下发现的快乐。</h1><p class="note">主动求助时先给一级；仍卡住再给下一层。手机提示内容相同，符文小游戏可跳过。</p>${[n*2,n*2+1].map(i=>`<article class="host-hint"><h2>${i+1} ${D.missions[i].name}<span>印记 ${D.missions[i].seal}</span></h2>${D.missions[i].hints.map((h,j)=>`<div><b>提示 ${j+1}</b><p>${esc(h)}</p></div>`).join('')}<p class="hint-reveal"><b>解题后藏点：</b>${esc(D.missions[i].reveal)}</p><p class="hint-reveal"><b>验证后：</b>读照片祝福，再点“${i===5?'让六枚碎片相聚':'收好祝福，继续旅程'}”。</p></article>`).join('')}`));
  host.push(page('主持人 · 硬件备用与终局台词',`<h1>让仪式继续，不让设备卡住。</h1>${table(['互动','当前操作','没有回应时'],hardware)}<h2>终局可照着说</h2><div class="host-script">${scripts.map(x=>`<p>${x}</p>`).join('')}</div><p class="note">震动依设备支持。摄像头、麦克风、传感器主动开启；完成、关闭或离开会清理。网页蜡烛熄灭后，仍可一起吹真实蜡烛。</p>`));
  host.push(page('主持人 · 全程彩排与应急',`<h1>从纸信走到真实蛋糕。</h1><ol class="rehearsal-list">${rehearsal.map(x=>`<li>□ ${x}</li>`).join('')}</ol>${table(['情况','处理'],[['有求必应屋','1002 在终局日期框是彩蛋；收起后输入纪念日 1111，不会越关。'],['照片与预演不同','重置会重新分配。正式开始后保持同一浏览器，不清理数据。'],['网页好像旧版','开场前刷新或重开同一网址；途中勿清除站点数据。'],['硬件 / 网络失败','用屏幕画符、普通相册、手动施咒和按钮吹蜡烛；保持页面打开并恢复网络。'],['漏拿纸片','陪她回当前藏点拿实体碎片，不提前用主持人答案推进。']])}<p class="note">盲测耗时仍需现场确认，不为动画催促。所有纸片干燥、安全可取；天文塔礼物靠客厅门放。</p>`));
  const css=`body{counter-reset:folio}.sheet{counter-increment:folio}.sheet:after{content:'Iris · 02 October · ' counter(folio);position:absolute;bottom:2.5mm;right:7mm;font:7pt Cormorant,serif;color:#987a54}.supplement{padding-bottom:10mm}.field-map{padding:4mm}.map-title{text-align:center;font-size:24pt;margin:0 0 2mm}.field-map .home-map{display:block;width:100%;height:116mm}.field-map .map-room rect{fill:#ead8b7;stroke:#aa8a62;stroke-width:2}.field-map .map-room text{fill:#765536;font:21px Cormorant,'SimSun',serif}.field-map>p:not(.map-title){font-size:8pt;text-align:center}.quest-passport{margin-top:6mm;padding:5mm}.passport-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin:5mm 0}.passport-grid div{display:flex;gap:3mm;align-items:center;font-size:9pt}.passport-grid b{font:15pt Cormorant,serif}.quest-passport>p{font-size:9pt}.ritual-grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.ritual-card{height:101mm;padding:5mm;display:flex;flex-direction:column}.ritual-card h2{font-size:14pt;line-height:1.35;min-height:11mm}.ritual-card p{font-size:9pt;line-height:1.8}.ritual-card small{margin-top:auto;font-size:8pt;color:#865e46}.ritual-glyph{text-align:center;font:25pt Cormorant,serif;color:#8b6447;line-height:1.2;margin:2mm 0}.gentle-note{text-align:center;border-top:1px solid #b59b76;padding-top:4mm;margin-top:5mm}.gentle-note h2{font:italic 18pt Cormorant,serif}.gentle-note p{font-size:8.5pt}.wish-grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:5mm}.wish-card{height:73mm;padding:4mm;position:relative;background:linear-gradient(135deg,#f4e6c8,#e7d1ab)}.wish-card>span{font:18pt Cormorant,serif;color:#895047}.wish-card h2{font-size:13pt;margin:2mm 0}.wish-card p{font-size:8.7pt;line-height:1.8}.wish-card small{position:absolute;bottom:4mm;right:4mm;font:italic 10pt Cormorant,serif;color:#927453}.photo-print-grid{display:grid;grid-template-columns:1fr 1fr;gap:7mm;margin-top:5mm}.photo-print{height:111mm;margin:0;padding:4mm;background:#fff8e9;display:flex;flex-direction:column}.photo-print img{width:100%;height:85mm;object-fit:contain;background:#ede4d4}.photo-print figcaption{text-align:center;font-size:9pt;line-height:1.45;padding-top:3mm}.photo-print figcaption small{font:10pt Cormorant,serif;display:block;color:#8e694c}.photo-dedication{justify-content:center;align-items:center;text-align:center;border:3px double #a68a66}.photo-dedication .script{font-size:43pt;line-height:1.2;color:#824b4b}.photo-dedication>p:not(.script){font-size:13pt;line-height:2}.photo-dedication small{font:13pt Cormorant,serif;margin-top:6mm}.guide-table{width:100%;border-collapse:collapse;font-size:8.7pt;line-height:1.65}.guide-table td,.guide-table th{border:1px solid #c7af8c;padding:2.2mm;text-align:left;vertical-align:top}.guide-table th{background:#ead8b9}.guide-table td:first-child{white-space:nowrap}.supplement>h1{margin:4mm 0;font-size:21pt}.supplement>h2{margin-top:5mm}.host-hint{margin:6mm 0;padding:5mm;border:1px solid #b99d76;background:#f4e8ce}.host-hint h2{font-size:17pt;display:flex;justify-content:space-between}.host-hint h2 span{font:12pt Cormorant,serif;color:#875246}.host-hint>div{display:grid;grid-template-columns:16mm 1fr;gap:3mm;border-top:1px dashed #c3ab8b;padding:2.5mm 0;font-size:9.5pt;line-height:1.8}.host-hint>div>b{font-size:8.5pt;padding-top:1mm;color:#875a41}.host-hint p{margin:0}.hint-reveal{font-size:8.5pt!important;line-height:1.7;padding-top:2mm}.host-script{border-left:2px solid #8a5b48;padding-left:4mm;font-size:9pt;line-height:1.75}.host-script p{margin-bottom:3mm}.rehearsal-list{padding-left:5mm;font-size:9pt;line-height:1.75}.rehearsal-list li{margin-bottom:2.3mm}`;
  const mdTable=(heads,rows)=>`| ${heads.join(' | ')} |\n| ${heads.map(()=>'---').join(' | ')} |\n${rows.map(r=>'| '+r.join(' | ')+' |').join('\n')}\n`;
  const markdown=`# Iris 生日现场布置与递进提示\n\n2026-10-01 沉浸版；仅供布置者，勿摆入玩家道具。\n\n## 打印与准备\n\n玩家包 15 页，主持人指南 8 页。A4 单面、100% 比例、背景图形开启、页眉页脚关闭。虚线裁、点线折。\n\n${mdTable(['玩家页码','用途'],printing)}\n准备已购道具与礼物、四种饮品、纸/打印机/剪刀/胶、隐形笔及灯、手机/充电器、真实蛋糕/蜡烛/点火器；支架可选。试开 3D/摄像头缓存资源，摄像头首开约 18 MB。纸信二维码正式网址：https://outeri.github.io/iris-birthday-quest/ 。\n\n## 写什么、放哪里\n\n${setup.map(x=>'- '+x).join('\n')}\n\n## 完整答案与记忆页\n\n- 登车 1002；五题分院任意选，固定格兰芬多；领取袍/杖/徽章。\n${D.missions.map((m,i)=>`- ${i+1} ${m.name}：${answers[i]} 印记 ${m.seal}。`).join('\n')}\n- 每课题解后揭藏点；找实体片、验证两位印记后读照片与祝福，再点继续。第②/④关后有分幕。\n- 六片句子：${D.fragments.join(' / ')}。输入纪念日 1111，找电视柜礼物/手写信；读信后进入银猫/许愿/网页蜡烛/祝福信/真实蛋糕。\n- 第 12 页祝福按编号随礼物藏好，不遮原碎片。11 张纸质照片可随意分配；不需和手机随机顺序对应。手机前五枚各两张、最后一枚一张，同次旅程固定；重置会重分配。\n\n## 每课三级提示\n\n${D.missions.map((m,i)=>`### ${i+1} ${m.name} / ${m.seal}\n\n${m.hints.map((h,j)=>`${j+1}. ${h}`).join('\n')}\n\n解题后藏点：${m.reveal}\n`).join('\n')}\n## 硬件与备用\n\n${mdTable(['互动','当前操作','备用'],hardware)}\n语音服务可能联网；摄像头识别在本地。设备权限仅主动开启，关闭/完成/离开会清理；震动依支持而定。网页蜡烛后仍可吹真实蜡烛。\n\n## 可照读的终局台词\n\n${scripts.map(x=>'- '+x).join('\n')}\n\n## 全程彩排\n\n${rehearsal.map(x=>'- [ ] '+x).join('\n')}\n- [ ] 主持人答案不放现场；隐形数能照出；纸片干燥可取，阳台礼物靠客厅门。\n\n1002 在终局日期框只打开有求必应屋，收起后用 1111；地图位置是最后确认位置，不是实时定位。硬件失败改用普通相册和按钮，保持页面打开并恢复网络；勿清理数据。\n`;
  return{player,host,css,markdown};
};
