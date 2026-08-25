(function () {
  "use strict";

  const STORAGE_KEY = "six-faced-life.autosave.v1";
  const SLOT_KEY = "six-faced-life.slots.v1";
  const $ = (id) => document.getElementById(id);
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const deepCopy = (value) => JSON.parse(JSON.stringify(value));

  const goalCopy = {
    magic: ["穷尽魔术之道", "研习魔术、理解世界，也别忘了魔力之外的人生。"],
    sword: ["成为剑术强者", "挑战更强的对手，让每一次挥剑都比昨天更坚定。"],
    adventure: ["看遍六面世界", "踏上道路、接受委托，把未知写进人生书页。"],
    bonds: ["守护重要的人", "羁绊不是数值；你如何回应他人，会改变彼此的命运。"],
    quiet: ["平静而充实地生活", "不必成为传奇。认真对待每个寻常日子，也是一种胜利。"]
  };

  const startAge = { childhood: 36, transfer: 108, youth: 180, academy: 192, if: 144 };
  const startChapter = { childhood: "幼年篇", transfer: "转移前夕", youth: "冒险者篇", academy: "魔法大学篇", if: "自由 IF 线" };
  const mapPositions = {
    "布艾纳村": [23, 45], "罗亚城": [31, 52], "魔大陆": [72, 72], "拉诺亚魔法都市": [48, 22],
    "大森林": [66, 41], "米里斯": [79, 30], "冒险者公会": [56, 58], "中央大陆北部": [48, 35]
  };

  const baseStats = {
    identity: {
      "转生者": { wisdom: 8, mana: 4 }, "原住民": { vitality: 5, charm: 3 }, "贵族子弟": { charm: 8, money: 24 },
      "冒险者后裔": { sword: 7, vitality: 4 }, "平民": { vitality: 3, wisdom: 3, money: 4 }
    },
    race: {
      "人族": { charm: 3, wisdom: 3 }, "魔族": { mana: 8, vitality: 2 }, "兽族": { vitality: 8, sword: 3 },
      "米格尔德族": { mana: 7, wisdom: 4 }, "矮人族": { vitality: 5, wisdom: 6 }, "混血": { charm: 4, mana: 4, sword: 2 }
    }
  };

  const events = [
    {
      id: "old_grimoire", kicker: "童年的发现", title: "阁楼里的旧魔术书",
      text: "雨水敲打木窗。你在积灰的箱底翻出一本残缺魔术书，书页描绘着水球术的魔力回路。大人说你还太小，可身体里的某种感觉正在回应这些文字。",
      when: s => s.ageMonths < 144 && ["布艾纳村", "罗亚城"].includes(s.location),
      choices: [
        { label: "偷偷练习无咏唱魔术", hint: "魔力 +8 · 学识 +3", months: 8, effects: { mana: 8, wisdom: 3 }, result: "第一团水在掌心失控炸开。你浑身湿透，却记住了魔力流过身体的感觉。" },
        { label: "请教家中的长辈", hint: "学识 +6 · 羁绊：家人 +4", months: 6, effects: { wisdom: 6 }, relation: ["家人", 4], result: "你没有隐藏好奇心。耐心的讲解让晦涩文字有了轮廓，也让家人看见了你的认真。" },
        { label: "把书放回去，先锻炼身体", hint: "体魄 +7", months: 6, effects: { vitality: 7 }, result: "你决定先打好基础。日复一日的跑步与搬运，让小小的身体更结实了。" }
      ]
    },
    {
      id: "blue_teacher", kicker: "命运的来客", title: "蓝发魔术师来到村庄",
      text: "一位身材娇小、神情认真的蓝发魔术师来到家门前。她将担任附近天才少年的家庭教师，也愿意让你好好听完第一堂课。",
      when: s => s.ageMonths < 156 && s.location === "布艾纳村" && s.stats.mana >= 12,
      choices: [
        { label: "展示自己练会的水球术", hint: "魔力 +6 · 洛琪希 +8", months: 5, effects: { mana: 6 }, relation: ["洛琪希", 8], result: "她先是惊讶，随后认真纠正你的魔力回路。你得到的不是夸奖，而是一份真正的学习计划。" },
        { label: "安静旁听并记下每个细节", hint: "学识 +8 · 洛琪希 +4", months: 5, effects: { wisdom: 8 }, relation: ["洛琪希", 4], result: "你把疑问留到课后。那几个问题让她意识到，你并非只是在凑热闹。" },
        { label: "坦白自己害怕走出家门", hint: "魅力 +4 · 获得印记", months: 3, effects: { charm: 4 }, achievement: "迈出门槛", relation: ["洛琪希", 5], result: "她没有嘲笑，只约你到村外完成一次魔术练习。跨过门槛时，你发现天空比记忆中更广阔。" }
      ]
    },
    {
      id: "green_friend", kicker: "相遇", title: "被欺负的绿发孩子",
      text: "村口传来争执声。几个孩子围住一名有着淡绿色头发的瘦小孩子，因为发色说着难听的话。对方低着头，指尖却有微弱的风在盘旋。",
      when: s => s.ageMonths < 156 && s.location === "布艾纳村",
      choices: [
        { label: "站到对方身前", hint: "体魄 +3 · 希露菲 +10", months: 3, effects: { vitality: 3, fame: 1 }, relation: ["希露菲", 10], result: "你挨了几下推搡，却没有退开。人群散去后，对方小声告诉了你名字。" },
        { label: "用魔术吓跑他们", hint: "需要魔力 18 · 魔力 +4", requires: s => s.stats.mana >= 18, lockText: "魔力达到 18", months: 3, effects: { mana: 4, fame: 2 }, relation: ["希露菲", 7], result: "水花精准落在欺负人的孩子脚边。没有人受伤，但他们已经懂了警告。" },
        { label: "去叫可靠的大人", hint: "学识 +3 · 希露菲 +5", months: 2, effects: { wisdom: 3 }, relation: ["希露菲", 5], result: "你选择了更稳妥的方法。事情被制止，而对方仍记得你愿意为陌生人跑这一趟。" }
      ]
    },
    {
      id: "sword_yard", kicker: "修行", title: "木剑与晨雾",
      text: "天刚蒙亮，练武场已有木剑破风的声音。一位独眼兽族剑士只看了你一眼，便把另一柄木剑扔到脚边：想学，就先站稳。",
      when: s => s.ageMonths < 220 && ["罗亚城", "布艾纳村"].includes(s.location),
      choices: [
        { label: "练一千次基础挥剑", hint: "剑术 +8 · 体魄 +4", months: 8, effects: { sword: 8, vitality: 4 }, result: "手掌磨破又结痂。没有华丽招式，但你的脚步和剑尖不再摇晃。" },
        { label: "观察她的步法再模仿", hint: "剑术 +5 · 学识 +5", months: 6, effects: { sword: 5, wisdom: 5 }, result: "你看见力量之外的重心、距离与时机。模仿很笨拙，却走在正确方向。" },
        { label: "请求一场实战", hint: "需要体魄 20 · 剑术 +10", requires: s => s.stats.vitality >= 20, lockText: "体魄达到 20", months: 4, effects: { sword: 10, vitality: -3 }, achievement: "第一次倒下", result: "你在第三招就倒下。她等你重新站稳，才点头说：至少眼睛没有闭上。" }
      ]
    },
    {
      id: "roa_heir", kicker: "罗亚城", title: "红发大小姐的第一课",
      text: "博雷亚斯家的红发大小姐把课本摔在桌上，认定任何新老师都撑不过一天。门外的侍从对你投来同情的目光。",
      when: s => s.location === "罗亚城" && s.ageMonths < 240,
      choices: [
        { label: "不讲道理，先用实力赢得尊重", hint: "剑术 +5 · 艾莉丝 +8", months: 5, effects: { sword: 5 }, relation: ["艾莉丝", 8], result: "一场混乱的较量后，桌椅倒了大半。她仍不服气，却第一次愿意坐下听你说完。" },
        { label: "把算术变成冒险者经营游戏", hint: "学识 +7 · 艾莉丝 +6", months: 5, effects: { wisdom: 7, money: 5 }, relation: ["艾莉丝", 6], result: "当数字变成委托报酬和补给，她很快理解了规则，还嚷着要再玩一局。" },
        { label: "坦率承认自己也并不完美", hint: "魅力 +7 · 艾莉丝 +5", months: 4, effects: { charm: 7 }, relation: ["艾莉丝", 5], result: "你的坦白让她愣了片刻。她没道歉，只把课本重新摆回桌上。" }
      ]
    },
    {
      id: "transfer_calamity", kicker: "命运巨变", title: "天空裂开了",
      text: "白昼被吞进耀眼光芒，庞大的魔力在菲托亚领上空聚集。风停止，影子倒转。你只来得及抓住身边最近的东西，世界便被撕成碎片。",
      when: s => s.ageMonths >= 120 && s.ageMonths < 230 && ["布艾纳村", "罗亚城"].includes(s.location), priority: 10,
      choices: [
        { label: "拼命抓住身边的人", hint: "体魄 -4 · 羁绊提升", months: 1, effects: { vitality: -4 }, relation: ["同行者", 8], move: "魔大陆", achievement: "跨越转移事件", result: "失重结束时，红色荒野铺满视野。至少，你握住的那只手还在。" },
        { label: "用魔力包裹身体", hint: "需要魔力 24 · 魔力 +7", requires: s => s.stats.mana >= 24, lockText: "魔力达到 24", months: 1, effects: { mana: 7, vitality: -1 }, move: "魔大陆", achievement: "跨越转移事件", result: "仓促构筑的魔力层在落地前碎裂，却替你挡下致命冲击。远方传来魔物吼声。" },
        { label: "观察魔力流向并记住坐标", hint: "学识 +8 · 体魄 -6", months: 1, effects: { wisdom: 8, vitality: -6 }, move: "魔大陆", achievement: "跨越转移事件", result: "剧痛中，你记住了空间扭曲的纹理。也许多年后，这份记忆会成为归乡的钥匙。" }
      ]
    },
    {
      id: "demon_warrior", kicker: "魔大陆", title: "额前红宝石的战士",
      text: "荒野尽头出现高大身影：绿发、额前有红色宝石，背负长枪。童谣把他的种族描述成灾厄，但他只是把水袋放到你面前，沉默等待。",
      when: s => s.location === "魔大陆",
      choices: [
        { label: "压下恐惧，接受善意", hint: "魅力 +6 · 瑞杰路德 +10", months: 2, effects: { charm: 6 }, relation: ["瑞杰路德", 10], result: "水很苦，却救了命。他告诉你最近城镇的方向，并决定护送一段路。" },
        { label: "先询问他的名字和目的", hint: "学识 +5 · 瑞杰路德 +6", months: 2, effects: { wisdom: 5 }, relation: ["瑞杰路德", 6], result: "谨慎没有冒犯他。简短交谈后，你发现传言与眼前的人相距甚远。" },
        { label: "保持距离独自离开", hint: "体魄 +5 · 瑞杰路德 -2", months: 3, effects: { vitality: 5 }, relation: ["瑞杰路德", -2], result: "你独自走进荒原。几次险情后，才真正明白这片大陆为何需要同伴。" }
      ]
    },
    {
      id: "guild_register", kicker: "冒险者公会", title: "第一枚冒险者牌",
      text: "喧闹大厅里，委托、谣言与酒杯碰撞。柜台职员将一张空白登记表推到你面前：名字、擅长领域，以及愿意承担的风险。",
      when: s => s.ageMonths >= 150 && !["布艾纳村", "罗亚城"].includes(s.location),
      choices: [
        { label: "登记为魔术师", hint: "魔力 +5 · 声望 +2", months: 2, effects: { mana: 5, fame: 2, money: -2 }, move: "冒险者公会", achievement: "冒险者入门", result: "冰冷金属牌刻下名字。从今天起，你可以凭自己的能力换取旅费。" },
        { label: "登记为剑士", hint: "剑术 +5 · 声望 +2", months: 2, effects: { sword: 5, fame: 2, money: -2 }, move: "冒险者公会", achievement: "冒险者入门", result: "柜台后的印章重重落下。第一柄真正属于你的铁剑也耗尽了大半盘缠。" },
        { label: "登记为支援与谈判者", hint: "魅力 +6 · 学识 +3", months: 2, effects: { charm: 6, wisdom: 3, fame: 1 }, move: "冒险者公会", achievement: "冒险者入门", result: "不是每支队伍都缺攻击者。你的观察力与交涉能力很快收到第一份邀请。" }
      ]
    },
    {
      id: "first_quest", kicker: "公会委托", title: "失踪的草药采集队",
      text: "低等级委托原本只是寻找迟归的采集队，现场却留下大型魔物脚印。天色正在变暗，你听见峡谷深处传来呼救。",
      when: s => s.location === "冒险者公会",
      choices: [
        { label: "循着脚印正面追击", hint: "体魄 +6 · 剑术 +5 · 钱币 +12", months: 4, effects: { vitality: 6, sword: 5, money: 12, fame: 4 }, result: "战斗比预计艰难。你带着伤把最后一名采集者背回公会，名字第一次出现在公告板上。" },
        { label: "用魔术制造诱饵", hint: "需要魔力 26 · 魔力 +7 · 钱币 +14", requires: s => s.stats.mana >= 26, lockText: "魔力达到 26", months: 3, effects: { mana: 7, wisdom: 3, money: 14, fame: 5 }, result: "魔物被光与气味引离巢穴。你没有逞强，却用更少代价救回了所有人。" },
        { label: "先召集可靠队友", hint: "魅力 +5 · 同行者 +7", months: 3, effects: { charm: 5, money: 9, fame: 3 }, relation: ["同行者", 7], result: "报酬需要分配，但没有人重伤。回程的篝火旁，你们开始真正像一支队伍。" }
      ]
    },
    {
      id: "academy_gate", kicker: "魔法大学", title: "刻满术式的校门",
      text: "拉诺亚魔法大学的尖塔穿过雪云。入学考官允许你选择展示项目：魔力量、术式理解，或一项足以说服他的特别才能。",
      when: s => s.location === "拉诺亚魔法都市" && s.ageMonths >= 168,
      choices: [
        { label: "释放最大威力的魔术", hint: "需要魔力 28 · 魔力 +8", requires: s => s.stats.mana >= 28, lockText: "魔力达到 28", months: 5, effects: { mana: 8, fame: 4, money: -8 }, achievement: "魔法大学入学", result: "训练场的防壁亮到刺眼。考官推了推眼镜，在你的申请书上盖下印章。" },
        { label: "解析一道残缺术式", hint: "需要学识 25 · 学识 +9", requires: s => s.stats.wisdom >= 25, lockText: "学识达到 25", months: 5, effects: { wisdom: 9, fame: 3, money: -6 }, achievement: "魔法大学入学", result: "你没有展示声势，只补上了术式中被忽略的回路。考官沉默片刻，示意你明天来上课。" },
        { label: "申请旁听并勤工俭学", hint: "魅力 +5 · 钱币 +4", months: 7, effects: { charm: 5, wisdom: 4, money: 4 }, achievement: "学院旁听生", result: "你从图书馆整理员做起。能听的课不多，但每一页书都向你开放。" }
      ]
    },
    {
      id: "forest_plague", kicker: "大森林", title: "雨季中的高烧",
      text: "兽族村落被漫长雨季困住，孩子们接连高烧。药材长在被魔物占据的湿地，而通往米里斯的商路已经断了。",
      when: s => s.location === "大森林",
      choices: [
        { label: "独自去湿地采药", hint: "体魄 +7 · 声望 +5", months: 4, effects: { vitality: 7, fame: 5 }, relation: ["兽族村落", 8], result: "泥水没过膝盖，毒虫爬进衣领。你最终带回足够药草，雨声中响起久违的笑声。" },
        { label: "改良净水与降温魔术", hint: "需要学识 24 · 学识 +7", requires: s => s.stats.wisdom >= 24, lockText: "学识达到 24", months: 4, effects: { wisdom: 7, mana: 5, fame: 6 }, relation: ["兽族村落", 9], result: "你无法立刻治愈疾病，却阻止了它继续传播。村里的长老把一枚木雕护符交给你。" },
        { label: "冒雨打通求援道路", hint: "剑术 +5 · 钱币 +8", months: 5, effects: { sword: 5, vitality: 3, money: 8 }, relation: ["兽族村落", 5], result: "倒木与魔物都没能让队伍停下。米里斯医师抵达时，最危险的夜晚终于过去。" }
      ]
    },
    {
      id: "millis_dispute", kicker: "圣都米里斯", title: "神殿前的争论",
      text: "神殿广场上，一名魔族商人与守卫发生争执。围观者只相信自己的成见，而丢失的货物可能正被真正的窃贼带离城市。",
      when: s => s.location === "米里斯",
      choices: [
        { label: "调查沿途留下的痕迹", hint: "学识 +6 · 声望 +4", months: 3, effects: { wisdom: 6, fame: 4, money: 7 }, relation: ["魔族商人", 6], result: "车轮印和撕裂的布条指向城外仓库。证据让喧闹的人群安静下来。" },
        { label: "当众为商人担保", hint: "需要魅力 25 · 魅力 +7", requires: s => s.stats.charm >= 25, lockText: "魅力达到 25", months: 2, effects: { charm: 7, fame: 5 }, relation: ["魔族商人", 8], result: "你的声誉让守卫愿意多听一分钟，而这一分钟足够真正的证人赶到。" },
        { label: "先追窃贼，之后再解释", hint: "剑术 +6 · 体魄 +3", months: 2, effects: { sword: 6, vitality: 3, money: 9 }, relation: ["魔族商人", 4], result: "你在城门前拦住马车。过程并不优雅，好在失物和真相一起回来了。" }
      ]
    },
    {
      id: "dream_whisper", kicker: "梦境", title: "白色世界里的忠告",
      text: "梦里没有天空与地面，只有一个模糊白影笑着向你招手。它说自己知道捷径：只要前往北方，就能得到你最渴望的答案。",
      when: s => s.turn >= 7,
      choices: [
        { label: "表面答应，醒后独立求证", hint: "学识 +7", months: 1, effects: { wisdom: 7 }, achievement: "不盲信神谕", result: "你记下每句话，却不把判断交给它。醒来后，窗外正是北方吹来的风。" },
        { label: "直接拒绝来历不明的指引", hint: "体魄 +3 · 魅力 +3", months: 1, effects: { vitality: 3, charm: 3 }, result: "白影仍在笑。梦境破碎前，它提醒你：拒绝也是一种选择，而选择总有代价。" },
        { label: "追问它真正想改变什么", hint: "需要学识 30 · 学识 +5 · 解锁印记", requires: s => s.stats.wisdom >= 30, lockText: "学识达到 30", months: 1, effects: { wisdom: 5, fame: 2 }, achievement: "向命运追问", result: "笑容短暂地消失了。它没有回答，但那一瞬间的沉默比任何忠告更有价值。" }
      ]
    },
    {
      id: "crossroads", kicker: "旅途", title: "六面世界的岔路",
      text: "商队在道路分叉处扎营。北方通往雪中的魔法都市，东方是米里斯的白色城墙，南方的船则驶向危机四伏的大森林。你可以改变旅途方向。",
      when: s => s.turn >= 4 && s.ageMonths >= 156,
      choices: [
        { label: "北上拉诺亚魔法都市", hint: "魔力 +3 · 花费 6 钱币", months: 5, effects: { mana: 3, money: -6 }, move: "拉诺亚魔法都市", result: "道路越来越冷，远方的魔法塔却像一簇不会熄灭的灯。" },
        { label: "前往圣都米里斯", hint: "魅力 +3 · 花费 5 钱币", months: 4, effects: { charm: 3, money: -5 }, move: "米里斯", result: "白色城墙在平原尽头升起。商旅和朝圣者让道路从未真正安静。" },
        { label: "乘船去大森林", hint: "体魄 +4 · 花费 4 钱币", months: 5, effects: { vitality: 4, money: -4 }, move: "大森林", result: "潮湿季风扑面而来。树冠在海岸后方连成一片没有尽头的绿色。" }
      ]
    }
  ];

  const routineTemplates = [
    {
      kicker: "寻常日子", title: "一段没有传奇的时光",
      text: "世界并不总用巨变推动人生。你在 {location} 度过一段踏实日子，旧技能逐渐熟练，也有时间想清楚下一步。",
      choices: [
        { label: "专注魔术练习", hint: "魔力 +5", months: 5, effects: { mana: 5 }, result: "日复一日的练习没有观众，但魔力回应得越来越自然。" },
        { label: "磨炼剑术和体魄", hint: "剑术 +4 · 体魄 +3", months: 5, effects: { sword: 4, vitality: 3 }, result: "汗水浸透衣服。简单动作被重复到几乎成为本能。" },
        { label: "打工、读书并结识邻里", hint: "钱币 +8 · 魅力 +3", months: 5, effects: { money: 8, charm: 3, wisdom: 2 }, result: "收入不算丰厚，但你在闲谈和书页里认识了生活的另一面。" }
      ]
    },
    {
      kicker: "临时委托", title: "商路上的护送请求",
      text: "一支小商队缺少最后一名护卫。路程不远，但最近出现魔物活动的传言。队长愿意支付合理报酬。",
      choices: [
        { label: "走在队伍最前方", hint: "体魄 +4 · 钱币 +9", months: 3, effects: { vitality: 4, money: 9 }, result: "传言并非空穴来风。好在你及时发现踪迹，队伍绕开了巢穴。" },
        { label: "负责侦察和路线规划", hint: "学识 +4 · 钱币 +8", months: 3, effects: { wisdom: 4, money: 8 }, result: "旧地图有误，你凭地形找到了更安全的溪谷道路。" },
        { label: "沿途与商人交换见闻", hint: "魅力 +4 · 声望 +2", months: 3, effects: { charm: 4, fame: 2, money: 6 }, result: "没有惊险战斗，却有许多消息随商路流动。以后会有人记得你的名字。" }
      ]
    }
  ];

  let state = null;
  let toastTimer = null;

  function blankState(profile) {
    const initial = { vitality: 10, mana: 10, sword: 8, wisdom: 10, charm: 10 };
    const identityBoost = baseStats.identity[profile.identity] || {};
    const raceBoost = baseStats.race[profile.race] || {};
    const resourceBoost = { money: 12, fame: 0 };
    [identityBoost, raceBoost].forEach(boost => Object.entries(boost).forEach(([key, value]) => {
      if (key === "money" || key === "fame") resourceBoost[key] = (resourceBoost[key] || 0) + value;
      else initial[key] = (initial[key] || 0) + value;
    }));
    return {
      version: 1, profile, ageMonths: startAge[profile.timeline] || 144, location: profile.location,
      chapter: startChapter[profile.timeline] || "自由人生", stats: initial, money: resourceBoost.money, fame: resourceBoost.fame,
      turn: 0, relations: {}, history: [], seen: [], achievements: [], currentEventId: "opening", phase: "event",
      lastResult: "", lastChoice: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
  }

  function openingEvent() {
    const p = state.profile;
    const textByTimeline = {
      childhood: `意识自黑暗中浮起。你在${p.location}的摇篮里睁开双眼，前世的记忆并未消失。剑、魔术与从未见过的天空都在门外，而这一次，你叫${p.name}。`,
      transfer: `你在${p.location}生活多年，却无法忽略天空日益异常的魔力。所有人都说那只是罕见天象，只有你感到命运正在逼近。`,
      youth: `成年礼后的清晨，你背起并不沉重的行囊。${p.location}的道路通往所有未知，而你终于可以为自己的人生做决定。`,
      academy: `雪落在${p.location}的尖塔之间。入学季带来数千张陌生面孔，你握着推荐信，准备敲响魔法大学的门。`,
      if: `命运没有替你规定主线。你以${p.race}${p.identity}的身份站在${p.location}，只记得今生的愿望：${goalCopy[p.goal][0]}。`
    };
    return {
      id: "opening", kicker: "新的生命", title: "意识自黑暗中浮起", text: textByTimeline[p.timeline],
      choices: [
        { label: "感受体内流动的魔力", hint: "魔力 +4 · 学识 +2", months: 3, effects: { mana: 4, wisdom: 2 }, result: "你闭上眼，第一次主动触碰这个世界无处不在的魔力。它像水，也像呼吸。" },
        { label: "观察身边的人与环境", hint: "学识 +3 · 魅力 +3", months: 3, effects: { wisdom: 3, charm: 3 }, result: "你没有急着改变什么，而是认真记住这里的语言、习惯和每一张面孔。" },
        { label: "告诉自己：这次绝不留下遗憾", hint: "体魄 +4 · 获得人生印记", months: 2, effects: { vitality: 4 }, achievement: "第二人生", result: "誓言没有立刻带来力量，但它成为今后每次跌倒时，支撑你站起来的理由。" }
      ]
    };
  }

  function getEventById(id) {
    if (id === "opening") return openingEvent();
    if (id === "life_folio") return finaleEvent();
    if (id && id.startsWith("routine-")) return makeRoutine(Number(id.split("-")[1]) || 0);
    return events.find(event => event.id === id) || openingEvent();
  }

  function makeRoutine(index = Math.floor(Math.random() * routineTemplates.length)) {
    const template = deepCopy(routineTemplates[index % routineTemplates.length]);
    template.id = `routine-${index % routineTemplates.length}`;
    template.text = template.text.replace("{location}", state.location);
    return template;
  }

  function selectNextEvent() {
    if (state.turn >= 25 && !state.seen.includes("life_folio")) return finaleEvent();
    const eligible = events.filter(event => !state.seen.includes(event.id) && (!event.when || event.when(state)));
    if (eligible.length) {
      const maxPriority = Math.max(...eligible.map(event => event.priority || 0));
      const pool = eligible.filter(event => (event.priority || 0) === maxPriority);
      return pick(pool);
    }
    return makeRoutine();
  }

  function finaleEvent() {
    const best = Object.entries(state.stats).sort((a, b) => b[1] - a[1])[0][0];
    const bestLabels = { vitality: "不屈体魄", mana: "魔术之道", sword: "剑之道路", wisdom: "求知之心", charm: "人与人的羁绊" };
    return {
      id: "life_folio", kicker: "人生阶段结算", title: "写到这里，却并非终点",
      text: `许多年后，你在旅店窗边翻阅旧日记录。最清晰的一条道路是“${bestLabels[best]}”，但真正塑造你的，是每一次无人替你完成的选择。门外仍有新的旅程。`,
      choices: [
        { label: "继续旅行，让人生自然延伸", hint: "所有属性 +2 · 游戏继续", months: 12, effects: { vitality: 2, mana: 2, sword: 2, wisdom: 2, charm: 2, fame: 5 }, achievement: "活成自己的故事", result: "你合上书页，推门走入晨光。所谓结局，不过是下一章的页首。" },
        { label: "回到故乡，守护重要的人", hint: "羁绊提升 · 声望 +4", months: 12, effects: { charm: 5, fame: 4 }, relation: ["家人", 10], achievement: "归乡者", result: "熟悉的道路已经改变，等待你的人也有了岁月痕迹。你终于懂得，归来同样需要勇气。" },
        { label: "把经历写成一本传记", hint: "学识 +6 · 获得人生印记", months: 12, effects: { wisdom: 6, fame: 8 }, achievement: "六面世界的讲述者", result: "你没有把自己写成无败英雄。正因书里保留了软弱、错误和重来，它才被许多人珍藏。" }
      ]
    };
  }

  function formatAge(months = state.ageMonths) {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    return rest ? `${years}岁${rest}个月` : `${years}岁`;
  }

  function chapterForAge() {
    const age = Math.floor(state.ageMonths / 12);
    if (age < 8) return "幼年篇";
    if (age < 15) return "少年篇";
    if (age < 22) return state.achievements.includes("魔法大学入学") ? "魔法大学篇" : "冒险者篇";
    return "第二人生篇";
  }

  function currentEvent() { return getEventById(state.currentEventId); }

  function applyEffects(effects = {}) {
    Object.entries(effects).forEach(([key, value]) => {
      if (key in state.stats) state.stats[key] = clamp(state.stats[key] + value);
      else if (key === "money") state.money = Math.max(0, state.money + value);
      else if (key === "fame") state.fame = Math.max(0, state.fame + value);
    });
  }

  function updateRelation([name, delta] = []) {
    if (!name) return;
    state.relations[name] = clamp((state.relations[name] || 0) + delta, -20, 100);
  }

  function unlock(achievement) {
    if (achievement && !state.achievements.includes(achievement)) {
      state.achievements.push(achievement);
      showToast(`获得人生印记：${achievement}`);
    }
  }

  function checkMilestones() {
    if (state.stats.mana >= 50) unlock("上级魔术师");
    if (state.stats.sword >= 50) unlock("剑术求道者");
    if (state.stats.wisdom >= 50) unlock("博闻者");
    if (state.fame >= 25) unlock("小有名气");
    if (Object.values(state.relations).some(value => value >= 40)) unlock("不可替代的羁绊");
  }

  function resolveChoice(choice, index) {
    if (choice.requires && !choice.requires(state)) return;
    const event = currentEvent();
    applyEffects(choice.effects);
    if (choice.relation) updateRelation(choice.relation);
    if (choice.move) state.location = choice.move;
    if (choice.achievement) unlock(choice.achievement);
    state.ageMonths += choice.months || 3;
    state.turn += 1;
    state.chapter = chapterForAge();
    if (!state.seen.includes(event.id) && !event.id.startsWith("routine-")) state.seen.push(event.id);
    state.lastChoice = choice.label;
    state.lastResult = choice.result;
    state.phase = "result";
    state.history.unshift({ age: formatAge(), location: state.location, title: event.title, choice: choice.label, result: choice.result });
    state.history = state.history.slice(0, 40);
    checkMilestones();
    autoSave();
    render();
    $("storyCard").focus({ preventScroll: true });
  }

  function continueStory() {
    const next = selectNextEvent();
    state.currentEventId = next.id;
    state.phase = "event";
    state.lastResult = "";
    state.updatedAt = new Date().toISOString();
    autoSave();
    render();
    $("storyCard").focus({ preventScroll: true });
  }

  function destinyScore() {
    const stats = Object.values(state.stats).reduce((a, b) => a + b, 0);
    const bonds = Object.values(state.relations).reduce((a, b) => a + Math.max(0, b), 0);
    return Math.round(stats + state.fame * 2 + bonds * .5 + state.achievements.length * 8);
  }

  function rank() {
    const score = destinyScore();
    if (score >= 420) return "传说行者";
    if (score >= 300) return "资深冒险者";
    if (score >= 210) return "远行者";
    if (score >= 150) return "成长者";
    return "初心者";
  }

  function render() {
    if (!state) return;
    const p = state.profile;
    $("characterTitle").textContent = p.name;
    $("characterOrigin").textContent = `${p.race} · ${p.identity}`;
    $("characterGoal").textContent = goalCopy[p.goal][0];
    $("portrait").querySelector("span").textContent = p.name.slice(0, 1);
    $("rankSeal").textContent = rank();
    [["Vitality", "vitality"], ["Mana", "mana"], ["Sword", "sword"], ["Wisdom", "wisdom"], ["Charm", "charm"]].forEach(([id, key]) => {
      $(`stat${id}`).textContent = state.stats[key];
      $(`bar${id}`).style.width = `${state.stats[key]}%`;
    });
    $("moneyValue").textContent = state.money;
    $("fameValue").textContent = state.fame;
    $("turnValue").textContent = state.turn;
    $("chapterLabel").textContent = `${state.chapter} · ${rank()}`;
    $("locationLabel").textContent = state.location;
    $("ageLabel").textContent = formatAge();
    $("mapLocation").textContent = state.location;
    $("destinyScore").textContent = destinyScore();
    $("goalCardTitle").textContent = goalCopy[p.goal][0];
    $("goalCardText").textContent = goalCopy[p.goal][1];
    renderMap();
    renderRelations();
    renderAchievements();
    renderHistory();
    renderStory();
  }

  function renderStory() {
    const event = currentEvent();
    $("eventKicker").textContent = state.phase === "result" ? "选择的回响" : event.kicker;
    $("eventTitle").textContent = state.phase === "result" ? state.lastChoice : event.title;
    $("storyIcon").textContent = state.phase === "result" ? "◇" : "✦";
    $("eventText").innerHTML = state.phase === "result"
      ? `<p class="result">${escapeHtml(state.lastResult)}</p><p>时间向前流动。现在你是 ${escapeHtml(formatAge())}，身处${escapeHtml(state.location)}。</p>`
      : `<p>${escapeHtml(event.text)}</p>`;
    const list = $("choiceList");
    list.innerHTML = "";
    if (state.phase === "result") {
      const button = document.createElement("button");
      button.className = "choice-button";
      button.innerHTML = "<b>翻到下一页</b><small>继续这段人生</small>";
      button.addEventListener("click", continueStory);
      list.appendChild(button);
      return;
    }
    event.choices.forEach((choice, index) => {
      const allowed = !choice.requires || choice.requires(state);
      const button = document.createElement("button");
      button.className = `choice-button${allowed ? "" : " locked"}`;
      button.disabled = !allowed;
      button.innerHTML = `<b>${escapeHtml(choice.label)}</b><small>${escapeHtml(allowed ? choice.hint : `未解锁：${choice.lockText}`)}</small>`;
      button.addEventListener("click", () => resolveChoice(choice, index));
      list.appendChild(button);
    });
  }

  function renderRelations() {
    const entries = Object.entries(state.relations).sort((a, b) => b[1] - a[1]);
    $("relationCount").textContent = entries.length;
    const container = $("relationsList");
    if (!entries.length) { container.innerHTML = '<p class="empty-note">命运尚未让你与谁相遇。</p>'; return; }
    container.innerHTML = entries.slice(0, 5).map(([name, value]) => {
      const label = value >= 40 ? "深厚羁绊" : value >= 20 ? "彼此信任" : value >= 5 ? "初识" : value < 0 ? "戒备" : "一面之缘";
      return `<div class="relation-item"><span class="relation-avatar">${escapeHtml(name.slice(0, 1))}</span><div><strong>${escapeHtml(name)}</strong><small>${label}</small></div><span class="relation-heart">◆ ${value}</span></div>`;
    }).join("");
  }

  function renderAchievements() {
    const list = $("achievementList");
    list.innerHTML = state.achievements.length
      ? state.achievements.slice(-6).reverse().map(item => `<li>✦ ${escapeHtml(item)}</li>`).join("")
      : '<li class="locked">尚未获得人生印记</li>';
  }

  function renderHistory() {
    $("historyList").innerHTML = state.history.length
      ? state.history.map(item => `<li><time>${escapeHtml(item.age)} · ${escapeHtml(item.location)}</time><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.choice)}</li>`).join("")
      : '<li><time>此刻</time>空白书页正在等待第一个选择。</li>';
  }

  function renderMap() {
    const position = mapPositions[state.location] || [50, 50];
    $("mapPin").style.left = `${position[0]}%`;
    $("mapPin").style.top = `${position[1]}%`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  function autoSave() {
    if (!state) return;
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $("saveIndicator").innerHTML = "<i></i> 已自动存档";
  }

  function loadState(saved) {
    if (!saved || !saved.profile || !saved.stats) return false;
    state = saved;
    state.phase = state.phase || "event";
    state.achievements = state.achievements || [];
    state.relations = state.relations || {};
    state.history = state.history || [];
    state.seen = state.seen || [];
    state.currentEventId = state.currentEventId || "opening";
    $("startModal").close();
    render();
    showToast("已继续上次人生");
    return true;
  }

  function slots() { return safeParse(localStorage.getItem(SLOT_KEY)) || [null, null, null]; }
  function writeSlots(items) { localStorage.setItem(SLOT_KEY, JSON.stringify(items)); }

  function renderSlots() {
    const items = slots();
    $("saveSlots").innerHTML = items.map((item, index) => {
      const summary = item ? `${item.profile.name} · ${formatSavedAge(item.ageMonths)} · ${item.location} · ${new Date(item.updatedAt).toLocaleString("zh-CN")}` : "空存档位";
      return `<div class="save-slot"><div><h3>命运书页 ${index + 1}</h3><p>${escapeHtml(summary)}</p></div><div class="slot-actions"><button data-save-slot="${index}">${item ? "覆盖" : "保存"}</button>${item ? `<button data-load-slot="${index}">读取</button><button class="delete-slot" data-delete-slot="${index}">删除</button>` : ""}</div></div>`;
    }).join("");
    document.querySelectorAll("[data-save-slot]").forEach(button => button.addEventListener("click", () => saveSlot(Number(button.dataset.saveSlot))));
    document.querySelectorAll("[data-load-slot]").forEach(button => button.addEventListener("click", () => loadSlot(Number(button.dataset.loadSlot))));
    document.querySelectorAll("[data-delete-slot]").forEach(button => button.addEventListener("click", () => deleteSlot(Number(button.dataset.deleteSlot))));
  }

  function formatSavedAge(months) {
    const years = Math.floor(months / 12), rest = months % 12;
    return rest ? `${years}岁${rest}个月` : `${years}岁`;
  }

  function saveSlot(index) {
    const items = slots();
    items[index] = deepCopy(state);
    items[index].updatedAt = new Date().toISOString();
    writeSlots(items);
    renderSlots();
    showToast(`已保存到命运书页 ${index + 1}`);
  }

  function loadSlot(index) {
    const saved = slots()[index];
    if (!saved) return;
    state = deepCopy(saved);
    autoSave();
    render();
    $("saveModal").close();
    showToast(`已读取命运书页 ${index + 1}`);
  }

  function deleteSlot(index) {
    const items = slots();
    items[index] = null;
    writeSlots(items);
    renderSlots();
    showToast(`已删除命运书页 ${index + 1}`);
  }

  function randomizeForm() {
    const names = ["伊诺", "米娅", "诺亚", "莱恩", "芙蕾", "旅人", "艾文", "露娜"];
    $("nameInput").value = pick(names);
    ["identityInput", "raceInput", "timelineInput", "locationInput", "goalInput"].forEach(id => {
      const select = $(id);
      select.selectedIndex = Math.floor(Math.random() * select.options.length);
    });
  }

  function startFromForm(event) {
    event.preventDefault();
    const profile = {
      name: $("nameInput").value.trim() || "旅人", identity: $("identityInput").value, race: $("raceInput").value,
      timeline: $("timelineInput").value, location: $("locationInput").value, goal: $("goalInput").value
    };
    state = blankState(profile);
    autoSave();
    $("startModal").close();
    render();
    showToast("第二人生已经开始");
  }

  function exportChronicle() {
    if (!state) return;
    const lines = [
      "《六面世界：第二人生》人生传记", "", `姓名：${state.profile.name}`, `身份：${state.profile.race} · ${state.profile.identity}`,
      `愿望：${goalCopy[state.profile.goal][0]}`, `当前：${formatAge()} · ${state.location}`, `人生回响：${destinyScore()}`, "", "人生书页：",
      ...state.history.slice().reverse().map(item => `${item.age}｜${item.location}｜${item.title}\n选择：${item.choice}\n结果：${item.result}\n`),
      "人生印记：", state.achievements.length ? state.achievements.join("、") : "尚无", "", "由《六面世界：第二人生》本地生成"
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${state.profile.name}-六面世界传记.txt`; link.click();
    URL.revokeObjectURL(url);
    showToast("传记已导出");
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function openStart() {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    $("continueButton").classList.toggle("hidden", !saved);
    if (!$("startModal").open) $("startModal").showModal();
  }

  $("startForm").addEventListener("submit", startFromForm);
  $("randomizeButton").addEventListener("click", randomizeForm);
  $("continueButton").addEventListener("click", () => loadState(safeParse(localStorage.getItem(STORAGE_KEY))));
  $("saveButton").addEventListener("click", () => { renderSlots(); $("saveModal").showModal(); });
  $("helpButton").addEventListener("click", () => $("helpModal").showModal());
  $("restartButton").addEventListener("click", () => $("restartModal").showModal());
  $("confirmRestart").addEventListener("click", () => { $("restartModal").close(); state = null; openStart(); });
  $("exportButton").addEventListener("click", exportChronicle);
  $("brandButton").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => $(button.dataset.close).close()));
  document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => {
    if (event.target === dialog && dialog.id !== "startModal") dialog.close();
  }));
  $("startModal").addEventListener("cancel", event => {
    if (!state) event.preventDefault();
  });

  openStart();
})();
