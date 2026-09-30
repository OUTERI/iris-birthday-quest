(function (root) {
  'use strict';
  const runes = [
    {id:'sun',symbol:'☀',name:'太阳'}, {id:'moon',symbol:'☾',name:'月亮'},
    {id:'star',symbol:'✦',name:'星'}, {id:'key',symbol:'⚿',name:'钥匙'},
    {id:'leaf',symbol:'❧',name:'叶'}, {id:'flame',symbol:'♨',name:'火'},
    {id:'water',symbol:'≈',name:'水'}, {id:'eye',symbol:'◉',name:'眼'}
  ];
  const sealChoices = [{id:'star',symbol:'✦',name:'星'}, {id:'key',symbol:'⚿',name:'钥匙'}, {id:'moon',symbol:'☾',name:'月亮'}, {id:'heart',symbol:'♡',name:'心'}];
  const mailLetters = {
    A:['火','纸','鹰','南'], B:['猫','窗','页','灯'], C:['树','箱','夜','✦'], D:['门','头','杯','北']
  };
  const fragments = ['真正的咒语','不在魔法书里','它藏在','我们的故事','开始的那一天','用月日四位写下它'];
  const missions = [
    {name:'猫头鹰邮局',english:'The Owl Post',theme:'post',place:'living',seal:'20',gift:'海德薇',
      story:'四封来信迷失了顺序。让每一封信找到它的收件印章，再读出信使的名字。',
      reveal:'展开实体活点地图贴有①号封签的第二折。OWL POST 信封内有海德薇与碎片①；另有一张天文学笔记，请留到第六课。',
      hints:['观察邮局的 A、B、C、D 四张邮件卡；收件印章下各有一个字。','先固定 B 为第一封，再把 D、A 当作相邻的一组。心最后送达，钥匙紧接在月亮之前。','邮件 B→D→A→C；印章 星→钥匙→月亮→心。按纸卡取字得到“猫头鹰”与星形校验符。']},
    {name:'魔药课',english:'The Lunar Elixir',theme:'potion',place:'potion',seal:'05',gift:'月光碎片',
      story:'数字是药剂的脾气。先还原四杯的药力，再用两次升温和一次降温留住月光。',
      reveal:'最后使用的是蓝色月光杯。查看它的纸杯垫下方，取得碎片②。离开前，把桌旁“密室课程”卡与隐形笔的灯一起带上。',
      hints:['查看现场四杯与桌面药力记录。A/B/C/D 对应可乐、蓝色、橙色、透明。','药力是 1–4 且各用一次。A、C 升温，B、D 降温；先求 A+B 与 A+C、B+C 的关系。','A=2、B=1、C=4、D=3。依次投入 A→C→B，药力 0+2+4−1=5。']},
    {name:'三把扫帚',english:'A Table for Four',theme:'tavern',place:'kitchen',seal:'10',gift:'酒馆碎片',
      story:'客人离席，账单却留下了一条秘密。复原谁坐在哪里、喝了什么，再顺着灯光读出藏处。',
      reveal:'靠近厨房入口的一侧，摸摸台面下方的干燥处，取得碎片③。你也可以在这里喝点东西，休息片刻。',
      hints:['桌垫记录了三条线索，手机记录了另外三条。北侧有灯；三个饮品杯签背面有汉字。','猫头鹰在北、鬼魂在西；狐狸与鹿只能依次在东、南。叶与空杯相对。','北 猫头鹰/月；东 狐狸/叶；南 鹿/火；西 鬼魂/空杯。从北顺时针读付费饮品杯签背面：台面下。']},
    {name:'密室',english:'Behind the Silver Glass',theme:'chamber',place:'chamber',seal:'02',gift:'镜面碎片',
      story:'空白并不等于没有文字。照亮随身的镜面课卡，算出三个符文，再让镜子替你读一遍。',
      reveal:'去魔药教室东侧的窄卫生间，查看镜子右下角的干燥位置，取得碎片④。把“火、星、钥匙”的顺序记在手册里。',
      hints:['用隐形笔的灯照密室卡的三格；月亮、钥匙、星旁各藏着一个偏移数。','按环上的顺序移动：正数顺时针，负数逆时针。先算三格，最后把三格的读取顺序反过来。','月亮+2=钥匙；钥匙−1=星；星+3=火。镜面从右向左读取，答案 火→星→钥匙。']},
    {name:'活点地图',english:'Where the Ink Remembers',theme:'atlas',place:'living',seal:'24',gift:'音乐盒',
      story:'前四枚碎片背面藏着残图。接上电子残页 A、B；空白纸边在外，相同符号相接，北向罗盘朝上。再循密室留下的顺序走。',
      reveal:'回到中下卧室的 9¾ 站台。现在可以打开贴有⑤号封印的行李箱，取得音乐盒与碎片⑤。',
      hints:['翻看碎片①–④背面。电子残页 A、B 也参与拼图；北向罗盘必须朝上，相同接缝符号要相接。','拼成三列两行；先用纸边找四个角。地图复原后，使用上一课的“火→星→钥匙”。','上排 ①/A/③，下排 ④/②/B，全部朝正。三个岔路依次 火→星→钥匙，终点为 9¾ 站台。']},
    {name:'天文学',english:'A Constellation Called Iris',theme:'stars',place:null,seal:'11',gift:'飞贼手链',
      story:'今晚的星空把一个名字藏在坐标之间。找出观测笔记，校准星图，依记录连接四颗星。',
      reveal:'天文塔就在阳台。到靠客厅门的一侧找到金色信封，里面是飞贼手链与碎片⑥；无需靠近栏杆。',
      hints:['查看第一课信封中的天文学笔记。用北辰、银月、罗盘三个锚点确定星图的方向。','把星图调至正向、取消镜像，再按纸卡四条记录选星。“同子午线”指上下对齐；南侧在下方。','校准后依次选择 北辰南侧最远星、两锚点中点星、罗盘北侧最远星、银月南侧且比第三星更低的星。得到 IRIS。']}
  ];
  const questions = [
    {prompt:'一扇陌生的门打开，你会？',options:['先探索','拉着我一起进去'],responses:['你愿意先迈出一步。好奇，常常是勇气的开始。','你知道冒险也可以牵着手。信任是另一种勇气。']},
    {prompt:'朋友遇到难题，你会先？',options:['先陪伴','先找办法'],responses:['你先让她知道自己并不孤单。我记住这份温柔。','你愿意把在意变成行动。我看见你的认真。']},
    {prompt:'魔杖学会第一道咒语，你选？',options:['照亮黑暗','让快乐停久一点'],responses:['愿意为别人点灯的人，心里也藏着光。','你珍惜快乐，也愿意守护它。很好的愿望。']},
    {prompt:'你觉得勇气是什么？',options:['害怕仍向前','愿意求助'],responses:['害怕时仍然向前，这就是我寻找的勇气。','承认需要一个拥抱，同样需要勇气。']},
    {prompt:'登上列车，你最想带走？',options:['冒险的车票','身边人的手'],responses:['那么，去遇见还没有发生的故事吧。','那么，让你们把普通的日子也过成冒险吧。']}
  ];
  const equipment = ['魔法袍','魔杖','学院徽章'];
  const places = [
    {id:'sealed',name:'封印区域',x:25,y:28,w:180,h:100,quest:null},
    {id:'potion',name:'魔药课教室',x:224,y:28,w:210,h:138,quest:1},
    {id:'chamber',name:'密室',x:452,y:90,w:70,h:150,quest:3},
    {id:'kitchen',name:'三把扫帚',x:544,y:28,w:150,h:152,quest:2},
    {id:'sorting',name:'分院大厅',x:25,y:144,w:180,h:290,quest:-1},
    {id:'station',name:'9¾ 站台',x:224,y:268,w:210,h:166,quest:4},
    {id:'living',name:'猫头鹰邮局',x:452,y:256,w:242,h:178,quest:0},
    {id:'balcony',name:'天文塔',x:224,y:454,w:470,h:46,quest:5}
  ];
  const tiles = [
    {id:'1',label:'①',cell:0,edges:['','moon','star',''],rotation:90},
    {id:'A',label:'A',cell:1,edges:['','key','feather','moon'],rotation:180},
    {id:'3',label:'③',cell:2,edges:['','','leaf','key'],rotation:0},
    {id:'4',label:'④',cell:3,edges:['star','cup','',''],rotation:270},
    {id:'2',label:'②',cell:4,edges:['feather','eye','','cup'],rotation:180},
    {id:'B',label:'B',cell:5,edges:['leaf','','','eye'],rotation:90}
  ];
  const anchors = [{id:'north',name:'北辰',x:20,y:20,symbol:'✧'}, {id:'moon',name:'银月',x:80,y:20,symbol:'☾'}, {id:'compass',name:'罗盘',x:65,y:80,symbol:'⌖'}];
  const stars = [
    {id:'I1',x:20,y:55,letter:'I'}, {id:'R',x:50,y:20,letter:'R'},
    {id:'I2',x:65,y:45,letter:'I'}, {id:'S',x:80,y:65,letter:'S'},
    {id:'E',x:20,y:35,letter:'E'}, {id:'T',x:35,y:62,letter:'T'},
    {id:'N',x:65,y:65,letter:'N'}, {id:'A',x:80,y:35,letter:'A'}, {id:'H',x:45,y:80,letter:'H'}
  ];
  const observations = ['北辰南侧、与北辰同一子午线上最远的星。','北辰与银月正中间的星。','罗盘北侧、与罗盘同一子午线上最远的星。','银月南侧、与银月同一子午线，并位于第三颗星南侧的星。'];
  const glyphs = {moon:'☾',key:'⚿',star:'✦',feather:'❦',leaf:'❧',cup:'♜',eye:'◉'};

  function mapSVG(last='',target='',completed=[],interactive=false) {
    const rooms=places.map(p=>{
      const explored=p.quest===-1||p.id==='station'||completed.includes(p.quest);
      const cls=[last===p.id?'is-last':'',target===p.id?'is-target':'',explored?'is-explored':''].join(' ');
      const words=p.id==='chamber'?'<tspan x="487" dy="-8">密</tspan><tspan x="487" dy="26">室</tspan>':p.name;
      return `<g class="map-room ${cls}" ${interactive&&p.id!=='sealed'?`data-place="${p.id}" role="button" tabindex="0" aria-label="${p.name}"`:''}><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="3"/><text x="${p.x+p.w/2}" y="${p.y+p.h/2+6}" text-anchor="middle">${words}</text>${last===p.id?`<circle class="last-dot" cx="${p.x+18}" cy="${p.y+18}" r="6"/>`:''}${target===p.id?`<path class="target-star" d="m${p.x+p.w-20} ${p.y+10} 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/>`:''}</g>`;
    }).join('');
    return `<svg class="home-map" viewBox="0 0 720 520" xmlns="http://www.w3.org/2000/svg" aria-label="魔法地点相对位置图"><rect class="map-paper" x="0" y="0" width="720" height="520"/><path class="map-decoration" d="M16 16h688v488H16z M212 18v424 M440 18v424"/><text class="map-entrance" x="640" y="221">入学入口</text>${rooms}<text class="map-north" x="350" y="219">↑ 北</text><path class="map-decoration" d="M330 231h40"/></svg>`;
  }
  function tileSVG(id) {
    const t=tiles.find(t=>t.id===id), col=t.cell%3,row=Math.floor(t.cell/3);
    const base=mapSVG().replace(/<svg[^>]*>|<\/svg>/g,'');
    const edge=t.edges.map((g,i)=>g?`<circle cx="${[120,222,120,18][i]}" cy="${[18,130,242,130][i]}" r="16" fill="#ecdab6" stroke="#9c7747"/><text x="${[120,222,120,18][i]}" y="${[25,137,249,137][i]}" text-anchor="middle" font-size="23" fill="#6d372f">${glyphs[g]}</text>`:'').join('');
    return `<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg" class="tile-art" aria-hidden="true"><rect width="240" height="260" fill="#e8d6b6"/><g transform="translate(${-col*240},${-row*260})">${base}</g><path d="M8 8h224v244H8z" fill="none" stroke="#9c7747" stroke-width="2"/>${edge}${id==='1'?'<text x="52" y="224" font-size="26" fill="#693d30">↑ N</text>':''}</svg>`;
  }
  function paperSky() {
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" class="paper-sky"><rect x="1" y="1" width="398" height="398" rx="200" fill="#f4ead1" stroke="#806444"/><path d="M40 200h320M200 40v320" stroke="#cbb697" stroke-dasharray="3 7"/>${anchors.map(a=>`<text x="${a.x*4}" y="${a.y*4}" text-anchor="middle" font-size="23" fill="#75533d">${a.symbol}</text><text x="${a.x*4}" y="${a.y*4+22}" text-anchor="middle" font-size="12" fill="#75533d">${a.name}</text>`).join('')}${stars.map(s=>`<circle cx="${s.x*4}" cy="${s.y*4}" r="4" fill="#75533d"/>`).join('')}</svg>`;
  }
  const data={runes,sealChoices,mailLetters,fragments,missions,questions,equipment,places,tiles,anchors,stars,observations,mapSVG,tileSVG,paperSky};
  if(typeof module!=='undefined'&&module.exports) module.exports=data;
  else root.QuestData=data;
})(typeof globalThis!=='undefined'?globalThis:this);
