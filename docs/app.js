"use strict";

const STORAGE_KEY = "iris-birthday-quest-v2";
const app = document.getElementById("app");
const resetButton = document.getElementById("reset-button");
const resetDialog = document.getElementById("reset-dialog");

const questions = [
  {
    prompt: "一扇从未见过的门忽然打开，你会？",
    options: ["先看看门后有什么", "拉着我一起进去"],
    response: "有趣。你愿意向未知迈出一步。"
  },
  {
    prompt: "如果朋友遇到了难题，你会先？",
    options: ["站到她身边", "寻找解决办法"],
    response: "我听见了你对重要之人的在意。"
  },
  {
    prompt: "新魔杖只能先学会一种魔法，你选？",
    options: ["照亮黑暗", "让快乐停久一点"],
    response: "这根魔杖记住了你的愿望。"
  },
  {
    prompt: "你觉得勇气更像什么？",
    options: ["害怕时仍向前一步", "愿意向重要的人求助"],
    response: "勇气的样子，原来不止一种。"
  },
  {
    prompt: "今晚登上列车，你最想带走什么？",
    options: ["下一段冒险的车票", "身边人的手"],
    response: "我已经知道该把你送去哪里了。"
  }
];

const equipment = [
  { name: "魔法袍", line: "请领取魔法袍。今晚，你已是霍格沃茨的学生。", button: "我已穿上魔法袍" },
  { name: "魔杖", line: "The wand chooses the witch. 请领取属于你的魔杖。", button: "我已拿到魔杖" },
  { name: "学院徽章", line: "最后，佩戴格兰芬多学院徽章。", button: "我已佩戴徽章" }
];

const missions = [
  {
    name: "猫头鹰邮局", english: "OWL POST", room: "客厅",
    prompt: "白日安静，夜里替远方的人捎信；没有邮票，却从不迷路。它是谁？",
    hint: "想想会飞的魔法邮差。",
    reveal: "看看刚展开的活点地图第二道折页。信使留下了一只小挂件和第一枚碎片。",
    asset: "owl", seal: "20", answers: ["猫头鹰", "海德薇", "owl"], input: "text", placeholder: "写下信使的名字"
  },
  {
    name: "魔药课", english: "POTIONS CLASS", room: "上中卧室",
    prompt: "夜色是深褐，夕阳是橙，清泉透明。月光在夜色之后、夕阳之前。看看现场从左到右排好的四杯，它是哪一杯？",
    hint: "请看桌上四只杯子的实际颜色与左右顺序。",
    reveal: "月光杯的秘密压在它脚下。看看蓝色饮料的纸杯垫。",
    asset: "potion", seal: "05", answers: ["蓝色", "蓝", "blue"], input: "color"
  },
  {
    name: "三把扫帚", english: "THREE BROOMSTICKS", room: "厨房",
    prompt: "老板把三张杯签弄乱了。按价钱从低到高排列，再读杯签背面的字。藏处是哪三个字？",
    hint: "找标着 2、5、8 的杯签；看背面，不看饮料名字。",
    reveal: "靠近厨房入口的一侧，摸摸台面下方。找到碎片后，不妨休息片刻，喝点东西。",
    asset: "inn", seal: "10", answers: ["台面下", "柜台下"], input: "text", placeholder: "写下三个字"
  },
  {
    name: "密室", english: "CHAMBER OF SECRETS", room: "上中卧室与相邻卫生间",
    prompt: "魔药课桌旁还留着一张看似空白的卡。用隐形笔的光照亮它。卡上写着要去的地方是哪三个字？",
    hint: "回上中卧室找空白卡；按下隐形笔的灯，照亮纸面。",
    reveal: "去上中卧室旁的窄卫生间，查看镜子右下角的干燥位置。",
    asset: "chamber", seal: "02", answers: ["卫生间", "洗手间", "厕所"], input: "text", placeholder: "写下卡上的地点"
  },
  {
    name: "活点地图", english: "MARAUDER'S MAP", room: "全屋",
    prompt: "从分院大厅出发，回到第一次穿越魔法世界的地方。尚未开启的行李留在哪间房？请点地图。",
    hint: "车票最初放在哪间卧室？看地图下方中间的位置。",
    reveal: "回到 9¾ 站台。现在可以打开贴有⑤号封印的行李箱。",
    asset: "map", seal: "24", answers: ["station"], input: "map"
  },
  {
    name: "金色飞贼", english: "GOLDEN SNITCH", room: "阳台",
    prompt: "它很小、金色、不愿落地；在家里最接近天空的地方找它。你要去哪里？",
    hint: "看地图最下方，客厅外连接着哪里？",
    reveal: "去阳台靠客厅门的一侧，找金色信封；不用靠近栏杆。",
    asset: "snitch", seal: "11", answers: ["阳台", "客厅阳台", "露台"], input: "text", placeholder: "写下地点"
  }
];

const fragmentText = [
  "真正的咒语",
  "不在魔法书里",
  "它藏在",
  "我们的故事",
  "开始的那一天",
  "用月日四位写下它"
];

const initialState = () => ({
  phase: "letter",
  question: 0,
  choices: [],
  gear: 0,
  mission: 0,
  solved: false
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const validPhases = ["letter", "ticket", "train", "sorting", "sorting-response", "reveal", "gear", "map-intro", "mission", "interlude", "finale", "gift", "end"];
    if (saved && validPhases.includes(saved.phase)
        && Number.isInteger(saved.question) && saved.question >= 0 && saved.question <= questions.length
        && Number.isInteger(saved.gear) && saved.gear >= 0 && saved.gear <= equipment.length
        && Number.isInteger(saved.mission) && saved.mission >= 0 && saved.mission <= missions.length
        && typeof saved.solved === "boolean" && Array.isArray(saved.choices)) {
      return saved;
    }
  } catch (_) {
    // A fresh letter is safe when stored progress is unavailable.
  }
  return initialState();
}

let state = loadState();
let trainTimer;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

function update(changes) {
  state = { ...state, ...changes };
  save();
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s　，。,.·\-_/]/g, "");
}

function asset(name, alt) {
  return `<img src="./assets/${name}.svg" alt="${alt}">`;
}

function scene(copy, art = "", options = {}) {
  const classes = [
    "scene", "magic-in",
    options.single ? "scene--single" : "",
    options.letter ? "scene--letter" : "",
    options.night ? "scene--night" : "",
    options.theme ? "scene--mission" : "",
    options.theme ? `scene--${options.theme}` : ""
  ].filter(Boolean).join(" ");
  return `<section class="${classes}"><div class="scene-copy">${copy}</div>${art ? `<div class="scene-art ${options.smallArt ? "scene-art--small" : ""}">${art}</div>` : ""}</section>`;
}

function form(type, label, placeholder, short = false, extra = "") {
  const mode = type === "mission-answer" ? "riddle" : type;
  const quill = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M6 26c7-1 15-8 20-21-11 3-19 11-20 21Zm0 0 11-12M11 21l7 1M16 16l6 1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const icon = { ticket: "9¾", riddle: quill, seal: "✦", date: "♡" }[mode];
  const action = { ticket: "检票登车", riddle: "揭开线索", seal: "验证印记", date: "施放咒语" }[mode];
  return `<form class="spell-form spell-form--${mode}" data-form="${type}" novalidate>
    <label class="field-label" for="${type}-input">${label}</label>
    <div class="entry-line">
      <div class="entry-shell"><span class="entry-icon" aria-hidden="true">${icon}</span>
        <input id="${type}-input" class="text-input ${short ? "text-input--short" : ""}" name="answer" type="text" placeholder="${placeholder}" autocomplete="off" ${extra} required>
        ${mode === "date" ? '<span class="entry-suffix" aria-hidden="true">月 / 日</span>' : ""}
      </div>
      <button class="button button-primary" type="submit">${action}</button>
    </div>
    <p id="feedback" class="feedback" role="status"></p>
  </form>`;
}

function hint(text) {
  return `<button type="button" class="hint-button" data-action="hint">需要一点提示</button><p id="hint-text" class="hint-text" hidden>${text}</p>`;
}

function progress() {
  return `<div class="progress" aria-label="六项任务进度">
    <span class="progress-label">MAGICAL FRAGMENTS</span>
    ${missions.map((_, index) => `<span class="progress-dot ${index < state.mission ? "done" : index === state.mission ? "current" : ""}" aria-label="碎片${index + 1}${index < state.mission ? "已取得" : ""}"><span>${index < state.mission ? "✦" : index + 1}</span></span>`).join("")}
  </div>`;
}

function renderLetter() {
  return scene(`
    <div class="letter-head">HOGWARTS · SPECIAL ADMISSION</div>
    <p class="letter-address">TO IRIS · NO. IRIS-1002</p>
    <div class="seal" aria-hidden="true">H</div>
    <h1 class="scene-title">生日特别入学通知书</h1>
    <div class="letter-text">
      <p>致 Iris：</p>
      <p>我们很高兴通知你：10 月 2 日，你已获得霍格沃茨生日特别入学资格。</p>
      <p>通往魔法世界的入口，就藏在你熟悉的家里。请寻找那座位于九与十之间、却不属于任何整数的站台。</p>
      <p>收好这封信。列车正等着你。</p>
    </div>
    <p class="letter-sign">霍格沃茨生日特别任务办公室</p>
    <div class="button-row"><button class="button button-primary" data-action="accept-letter">接受邀请 · 寻找 9¾ 站台</button></div>
  `, "", { letter: true });
}

function renderTicket() {
  return scene(`
    <p class="eyebrow">CHAPTER 00 · PLATFORM 9¾</p>
    <h1 class="scene-title"><span class="english">FIND THE PLATFORM</span>九又四分之三站台</h1>
    <p class="lead">九与十之间的入口，藏在家中的一扇门后。</p>
    <p class="story">找到写着 9¾ 的房间。在那里拿到霍格沃茨特快车票，并查看随票小卡上的四位登车码。</p>
    ${form("ticket", "车票上的登车码", "四位数字", true, 'inputmode="numeric" maxlength="4"')}
    ${hint("站台是中下卧室；登车码就在车票旁的小卡上。")}
  `, asset("train", "霍格沃茨特快列车线描"));
}

function renderTrain() {
  return scene(`
    <p class="eyebrow">BOARD THE HOGWARTS EXPRESS</p>
    <h1 class="scene-title">列车已经出发</h1>
    <p class="lead">下一站，霍格沃茨。</p>
    <div class="train-motion">${asset("train", "驶向霍格沃茨的列车")}</div>
    <p class="story">抵达后，请前往左下卧室的分院大厅。</p>
  `, "", { single: true, night: true });
}

function renderSorting() {
  const q = questions[state.question];
  return scene(`
    <p class="eyebrow">THE SORTING CEREMONY · ${state.question + 1} / ${questions.length}</p>
    <h1 class="scene-title">分院帽正在倾听</h1>
    <p class="story">请坐在椅子上，轻触面前的分院帽，再回答它的问题。</p>
    <p class="lead">${q.prompt}</p>
    <div class="choice-list choice-list--sorting">${q.options.map((choice, index) => `<button type="button" class="choice sorting-choice" data-choice="${index}"><span class="choice-index" aria-hidden="true">0${index + 1}</span><span>${choice}</span><span class="choice-spark" aria-hidden="true">✦</span></button>`).join("")}</div>
  `, asset("hat", "分院帽线描"), { night: true, smallArt: true });
}

function renderSortingResponse() {
  const answered = state.question - 1;
  return scene(`
    <p class="eyebrow">THE HAT SPEAKS · ${state.question} / ${questions.length}</p>
    <h1 class="scene-title">嗯……</h1>
    <p class="lead">${questions[answered].response}</p>
    <div class="button-row"><button class="button button-gold" data-action="next-question">${state.question < questions.length ? "听下一个问题" : "听听分院结果"}</button></div>
  `, asset("hat", "正在思考的分院帽"), { night: true, smallArt: true });
}

function renderReveal() {
  return scene(`
    <p class="eyebrow">THE HAT HAS DECIDED</p>
    <p class="story">好奇……真诚……勇气……</p>
    <p class="lead">谨慎，也不妨碍你为重要的人向前一步。</p>
    <div class="reveal-house">GRYFFINDOR<span>格 兰 芬 多</span></div>
    <p class="story">欢迎你，Iris。你的学院，正在等你。</p>
    <div class="button-row"><button class="button button-gold" data-action="start-gear">领取属于你的装备</button></div>
  `, asset("crest", "原创红金狮子学院纹章"), { night: true });
}

function renderGear() {
  const item = equipment[state.gear];
  return scene(`
    <p class="eyebrow">BECOME A WITCH · ${state.gear + 1} / 3</p>
    <h1 class="scene-title">领取${item.name}</h1>
    <p class="lead">${item.line}</p>
    <div class="equipment-list">${equipment.map((step, index) => `<span class="equipment-step ${index < state.gear ? "done" : index === state.gear ? "active" : ""}">${step.name}</span>`).join("")}</div>
    <p class="story">装备都在分院大厅。领取后，再请手机带你前往下一步。</p>
    <div class="button-row"><button class="button button-primary" data-action="next-gear">${item.button}</button></div>
  `, asset("crest", "格兰芬多红金狮子纹章"), { smallArt: true });
}

function renderMapIntro() {
  return scene(`
    <p class="eyebrow">THE MARAUDER'S MAP</p>
    <h1 class="scene-title">活点地图已开启</h1>
    <p class="lead">I solemnly swear that I am up to no good.</p>
    <p class="story">请回到客厅，展开你手里的地图。六枚魔法碎片散落在这座小小的霍格沃茨里。</p>
    <div class="footsteps" aria-hidden="true"><span>⌁</span><span>⌁</span><span>⌁</span><span>⌁</span></div>
    <div class="button-row"><button class="button button-primary" data-action="start-missions">开始第一幕</button></div>
  `, asset("map", "以房间相对位置绘制的魔法地图"));
}

function answerControls(mission) {
  if (mission.input === "color") {
    return `<div class="potion-choices" role="group" aria-label="选择魔药杯颜色">
      ${["深褐色", "蓝色", "橙色", "透明"].map((value, index) => `<button type="button" class="potion-choice potion-choice--${index + 1}" data-mission-answer="${value}"><span class="potion-vial" aria-hidden="true"><i></i></span><span class="potion-label"><small>0${index + 1}</small>${value}</span></button>`).join("")}
    </div><p id="feedback" class="feedback" role="status"></p>`;
  }
  if (mission.input === "map") {
    return `<div class="map-frame"><div class="map-heading"><span>活点地图</span><span>轻触房间</span></div>
      <div class="map-board" role="group" aria-label="房间相对位置图：上排卫生间、魔药课、窄卫生间、厨房；下排分院厅、站台、客厅；最下方阳台">
        <button class="map-place map-place--bath" type="button" data-map-answer="bath" aria-label="左上卫生间">卫生间</button>
        <button class="map-place map-place--potion" type="button" data-map-answer="potion">魔药课<small>上中卧室</small></button>
        <button class="map-place map-place--chamber" type="button" data-map-answer="chamber" aria-label="上中窄卫生间">密室</button>
        <button class="map-place map-place--kitchen" type="button" data-map-answer="kitchen">厨房</button>
        <span class="map-corridor" aria-hidden="true">· · · ✦ · · ·</span>
        <button class="map-place map-place--sorting" type="button" data-map-answer="sorting">分院厅<small>左下卧室</small></button>
        <button class="map-place map-place--station" type="button" data-map-answer="station">9¾ 站台<small>中下卧室</small></button>
        <button class="map-place map-place--living" type="button" data-map-answer="living">客厅</button>
        <button class="map-place map-place--balcony" type="button" data-map-answer="balcony">阳台</button>
      </div>
    </div><p id="feedback" class="feedback" role="status"></p>`;
  }
  return form("mission-answer", "把解出的答案告诉手机", mission.placeholder || "输入答案");
}

function renderMission() {
  const mission = missions[state.mission];
  const chapter = Math.floor(state.mission / 2) + 1;
  const within = (state.mission % 2) + 1;
  const common = `${progress()}<p class="eyebrow">第${["一", "二", "三"][chapter - 1]}幕 · 第 ${within} 关 / 2 · ${mission.english}</p>`;
  if (!state.solved) {
    return scene(`
      ${common}
      <h1 class="scene-title">${mission.name}</h1>
      <p class="story">任务地点：${mission.room}</p>
      <p class="lead">${mission.prompt}</p>
      ${answerControls(mission)}
      ${hint(mission.hint)}
    `, mission.input === "map" ? "" : asset(mission.asset, `${mission.name}线描`), { single: mission.input === "map", theme: mission.asset });
  }
  return scene(`
    ${common}
    <h1 class="scene-title">线索已经显现</h1>
    <div class="quote">${mission.reveal}</div>
    <p class="story">找到礼物与第 ${state.mission + 1} 枚纸质碎片。碎片背面有两位魔法印记；输入它，地图才会继续展开。</p>
    ${form("seal", "碎片背面的两位魔法印记", "00", true, 'inputmode="numeric" maxlength="2"')}
  `, asset(mission.asset, `${mission.name}线描`), { smallArt: true, theme: mission.asset });
}

function renderInterlude() {
  const finished = state.mission;
  return scene(`
    <p class="eyebrow">ACT ${finished / 2} COMPLETE</p>
    <h1 class="scene-title">${finished} 枚魔法碎片已归位</h1>
    <p class="lead">${finished === 2 ? "脚印延伸到了厨房与密室。" : "地图上只剩最后两道金色痕迹。"}</p>
    <div class="stage-pair" aria-hidden="true"><span class="stage-seal">✦</span><span class="stage-seal">✦</span></div>
    <div class="button-row"><button class="button button-gold" data-action="next-act">开启下一幕</button></div>
  `, "", { single: true, night: true });
}

function renderFinale() {
  return scene(`
    ${progress()}
    <p class="eyebrow">THE FINAL SPELL</p>
    <h1 class="scene-title">真正的咒语</h1>
    <p class="lead">请回到客厅，把六张纸质碎片按编号排好，读出它们组成的句子。</p>
    <div class="fragment-line" aria-label="六枚碎片的位置">${fragmentText.map((_, index) => `<span>碎片 ${index + 1} · ✦</span>`).join("")}</div>
    <p class="story">将那个日子的月日写成四位数字。前两位是月份，后两位是日期。</p>
    ${form("date", "输入最后的咒语", "MMDD", true, 'inputmode="numeric" maxlength="4"')}
    ${hint("想想我们的故事是从哪一天开始的，不是今天的生日。")}
  `, asset("crest", "六枚碎片汇聚成的金色徽章"), { smallArt: true });
}

function renderGift() {
  return scene(`
    <p class="eyebrow">SPELL ACCEPTED · THE ROOM OF REQUIREMENT</p>
    <h1 class="scene-title">有求必应屋出现了</h1>
    <p class="lead">最后一次寻找，不需要新的密码。</p>
    <div class="gift-riddle"><p>它站在会发光的故事下方，<br>不替我们说话，却替我们收好许多秘密。<br>打开它，今天的礼物在等你。</p></div>
    <p class="story">礼物和一封手写信，正等你亲手发现。</p>
    <div class="button-row"><button class="button button-gold" data-action="finish-gift">找到礼物后，翻到最后一页</button></div>
  `, asset("snitch", "停在终点的金色飞贼"), { night: true, smallArt: true });
}

function renderEnd() {
  return scene(`
    <p class="eyebrow">MISCHIEF MANAGED</p>
    <h1 class="scene-title">媛宝，生日快乐。</h1>
    <p class="lead">从 11 月 11 日到每一个 10 月 2 日，愿我们一直有新的故事。</p>
    <div class="seal" aria-hidden="true">♥</div>
    <p class="story">魔法任务完成。现在，回客厅切蛋糕吧。🎂</p>
  `, "", { single: true, letter: true });
}

function render() {
  clearTimeout(trainTimer);
  const screens = {
    letter: renderLetter,
    ticket: renderTicket,
    train: renderTrain,
    sorting: renderSorting,
    "sorting-response": renderSortingResponse,
    reveal: renderReveal,
    gear: renderGear,
    "map-intro": renderMapIntro,
    mission: renderMission,
    interlude: renderInterlude,
    finale: renderFinale,
    gift: renderGift,
    end: renderEnd
  };
  app.innerHTML = screens[state.phase]();
  if (state.phase === "train") {
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 900 : 4600;
    trainTimer = window.setTimeout(() => update({ phase: "sorting" }), duration);
  }
}

function showFeedback(message) {
  const feedback = document.getElementById("feedback");
  if (feedback) feedback.textContent = message;
}

function verifyMissionAnswer(value) {
  const mission = missions[state.mission];
  const accepted = mission.answers.some(answer => normalize(answer) === normalize(value));
  if (accepted) update({ solved: true });
  else showFeedback("咒语暂时没有回应。再看看现场线索，或打开提示。");
}

app.addEventListener("click", event => {
  const choice = event.target.closest("[data-choice]");
  if (choice && state.phase === "sorting") {
    const selected = Number(choice.dataset.choice);
    update({
      choices: [...state.choices, selected],
      question: state.question + 1,
      phase: "sorting-response"
    });
    return;
  }

  const answer = event.target.closest("[data-mission-answer], [data-map-answer]");
  if (answer && state.phase === "mission" && !state.solved) {
    verifyMissionAnswer(answer.dataset.missionAnswer || answer.dataset.mapAnswer);
    return;
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  switch (action) {
    case "accept-letter": update({ phase: "ticket" }); break;
    case "next-question": update({ phase: state.question < questions.length ? "sorting" : "reveal" }); break;
    case "start-gear": update({ phase: "gear" }); break;
    case "next-gear": {
      const next = state.gear + 1;
      update(next < equipment.length ? { gear: next } : { gear: next, phase: "map-intro" });
      break;
    }
    case "start-missions": update({ phase: "mission" }); break;
    case "next-act": update({ phase: "mission" }); break;
    case "finish-gift": update({ phase: "end" }); break;
    case "hint": {
      const text = document.getElementById("hint-text");
      if (text) text.hidden = false;
      break;
    }
  }
});

app.addEventListener("submit", event => {
  const formElement = event.target.closest("form[data-form]");
  if (!formElement) return;
  event.preventDefault();
  const value = String(new FormData(formElement).get("answer") || "").trim();
  if (!value) {
    showFeedback("请先输入你找到的线索。");
    return;
  }
  switch (formElement.dataset.form) {
    case "ticket":
      if (normalize(value) === "1002") update({ phase: "train" });
      else showFeedback("登车码还不对，请看随票小卡。");
      break;
    case "mission-answer":
      verifyMissionAnswer(value);
      break;
    case "seal":
      if (/^\d{2}$/.test(value) && value === missions[state.mission].seal) {
        const next = state.mission + 1;
        update(next === missions.length
          ? { mission: next, solved: false, phase: "finale" }
          : { mission: next, solved: false, phase: next === 2 || next === 4 ? "interlude" : "mission" });
      } else {
        showFeedback("印记未被识别。请看当前碎片背面的两位数字。");
      }
      break;
    case "date":
      if (normalize(value) === "1111") update({ phase: "gift" });
      else showFeedback("咒语还没有生效。请按月日四位，再看看六张碎片。");
      break;
  }
});

resetButton.addEventListener("click", () => resetDialog.showModal());
resetDialog.addEventListener("close", () => {
  if (resetDialog.returnValue === "confirm") {
    state = initialState();
    save();
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }
});
render();
