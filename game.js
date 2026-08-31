(function () {
  "use strict";

  const STORAGE_KEY = "six-faced-life.autosave.v1";
  const SLOT_KEY = "six-faced-life.slots.v1";
  const REST_FATIGUE_RECOVERY = 60;
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
    "大森林": [66, 41], "米里斯": [79, 30], "冒险者公会": [56, 58], "中央大陆北部": [48, 35],
    "菲托亚难民营": [29, 49], "利卡里斯城": [76, 35], "风之港": [69, 49], "阿斯拉王都": [18, 62],
    "剑之圣地": [50, 16], "拉庞城": [48, 86], "转移迷宫": [54, 91]
  };

  const worldLocations = {
    "布艾纳村": { x: 27, y: 55, region: "中央大陆 · 阿斯拉王国菲托亚领", danger: "低", months: 2, cost: 2, text: "麦田与牧场环绕的小村，也是许多命运最初交汇的地方。转移事件发生后，这里只剩遗迹。" },
    "罗亚城": { x: 32, y: 59, region: "中央大陆 · 菲托亚领", danger: "低", months: 3, cost: 3, text: "博雷亚斯家治理的要塞都市。剑术、贵族教育与商队让这里比村庄繁忙得多。" },
    "菲托亚难民营": { x: 30, y: 49, region: "中央大陆 · 菲托亚遗址", danger: "中", months: 3, cost: 2, text: "转移事件后的临时聚居地。失踪者名单不断更新，搜救者从世界各地带回消息。" },
    "阿斯拉王都": { x: 17, y: 64, region: "中央大陆西部 · 阿斯拉王国", danger: "中", months: 6, cost: 12, text: "世界上最富庶王国的中心。宫廷、骑士团与贵族派系让这里的危险不只来自刀剑。" },
    "拉诺亚魔法都市": { x: 44, y: 25, region: "中央大陆北部 · 魔法三国", danger: "低", months: 6, cost: 9, text: "魔法大学所在的学术都市。研究者、特别生与来自各族的学生在雪国尖塔间生活。" },
    "剑之圣地": { x: 51, y: 14, region: "中央大陆北端", danger: "高", months: 7, cost: 10, text: "剑神流总道场所在之地。严寒、训练与实力至上的规矩筛选着每一位求道者。" },
    "中央大陆北部": { x: 52, y: 35, region: "中央大陆北方诸国", danger: "中", months: 5, cost: 7, text: "贫瘠、多雪且战争频发的区域，佣兵、冒险者和小国势力在此交错。" },
    "冒险者公会": { x: 57, y: 52, region: "各大陆的公会网络", danger: "中", months: 2, cost: 1, text: "委托、队伍与情报的交汇点。这里代表你当前所在城市的冒险者公会。" },
    "魔大陆": { x: 78, y: 32, region: "魔大陆", danger: "极高", months: 9, cost: 14, text: "土地贫瘠、魔物强大，各地由不同魔王统治。环境严酷，却并不意味着所有居民都残暴。" },
    "利卡里斯城": { x: 75, y: 40, region: "魔大陆 · 旧魔帝城", danger: "高", months: 4, cost: 4, text: "位于巨大陨石坑中的城市。原著归乡队伍曾在这里登记为冒险者并使用“Dead End”之名。" },
    "风之港": { x: 69, y: 50, region: "魔大陆南端", danger: "中", months: 5, cost: 8, text: "连接魔大陆与米里斯大陆的海港。通行许可、船费与种族偏见都可能成为旅途障碍。" },
    "大森林": { x: 74, y: 58, region: "米里斯大陆北部", danger: "高", months: 5, cost: 7, text: "兽族聚居的广大森林，雨季会封锁道路。德路迪亚村落守护着森林深处的传统。" },
    "米里斯": { x: 76, y: 69, region: "米里斯大陆南部", danger: "中", months: 5, cost: 8, text: "圣都与冒险者往来的繁华区域。转移事件后，寻找失踪家人的队伍曾在这里汇集情报。" },
    "拉庞城": { x: 47, y: 85, region: "贝卡利特大陆", danger: "极高", months: 10, cost: 18, text: "沙漠中的迷宫都市。强力冒险者聚集于此，城外遍布危险魔物和古老迷宫。" },
    "转移迷宫": { x: 54, y: 91, region: "贝卡利特大陆 · 迷宫深处", danger: "致命", months: 2, cost: 6, text: "结构会借转移陷阱改变探索路线的高难迷宫。没有充分准备与可靠队伍，不应贸然进入。" }
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

  const masteryTiers = [
    { name: "初级", xp: 0 }, { name: "中级", xp: 40 }, { name: "上级", xp: 100 }, { name: "圣级", xp: 200 },
    { name: "王级", xp: 360 }, { name: "帝级", xp: 600 }, { name: "神级", xp: 1000 }
  ];
  const adventureTiers = [
    { name: "F级", xp: 0 }, { name: "E级", xp: 40 }, { name: "D级", xp: 100 }, { name: "C级", xp: 200 },
    { name: "B级", xp: 360 }, { name: "A级", xp: 600 }, { name: "S级", xp: 950 }
  ];
  const skillCatalog = {
    magic: [
      { id: "water_ball", name: "水球术", tier: 0, mark: "水", description: "初级水魔术。训练魔力塑形、速度与无咏唱控制。" },
      { id: "healing", name: "治愈术", tier: 0, mark: "愈", description: "处理擦伤与轻伤的基础治愈魔术。" },
      { id: "stone_cannon", name: "岩炮弹", tier: 1, mark: "岩", description: "压缩岩石并高速射出的中级攻击魔术，可继续强化旋转与硬度。" },
      { id: "fire_ball", name: "火球术", tier: 1, mark: "火", description: "技能树解锁的火系攻击术。持续燃烧适合压制，但在森林与城镇必须谨慎。" },
      { id: "sonic_boom", name: "音速冲击", tier: 2, mark: "风", description: "利用风压改变距离与敌人姿态的上级魔术。" },
      { id: "disturb_magic", name: "乱魔", tier: 2, mark: "乱", description: "干扰对方正在构筑的魔术，需要细致的魔力感知。" },
      { id: "cumulonimbus", name: "豪雷积层云", tier: 3, mark: "雷", description: "改变局部天气的圣级水魔术，消耗巨大且需要长时间准备。" }
    ],
    sword: [
      { id: "arm_drop", name: "剑神流·初击", tier: 0, style: "swordGod", mark: "剑", description: "以抢先出手和破坏对方架势为目标的基础攻击。" },
      { id: "water_guard", name: "水神流·基础守势", tier: 0, style: "waterGod", mark: "守", description: "本作基础练习：保持中线与重心，积累水神流经验。" },
      { id: "north_feint", name: "北神流·基础佯动", tier: 0, style: "northGod", mark: "步", description: "本作基础练习：利用假动作和距离，积累北神流经验。" },
      { id: "flow", name: "水神流·流", tier: 1, style: "waterGod", mark: "流", description: "读取攻击轨迹，以格挡与反击夺回主动。" },
      { id: "north_step", name: "北神流·应变步", tier: 1, style: "northGod", mark: "北", description: "利用地形、假动作与不规则步法改变战局。" },
      { id: "silent_sword", name: "无音之太刀", tier: 2, style: "swordGod", mark: "音", description: "剑神流上级高速斩击，是通往更高境界的门槛。" },
      { id: "light_reversal", name: "光返", tier: 3, style: "swordGod", mark: "返", description: "针对高速先制斩击的极限反制，需要圣级反应与判断。" },
      { id: "longsword_light", name: "光之太刀", tier: 3, style: "swordGod", mark: "光", description: "剑神流奥义，将斗气、速度与意志集中于决定胜负的一击。" }
    ],
    life: [
      { id: "human_language", name: "人类语", tier: 0, mark: "文", description: "中央大陆通用语言，影响阅读、交涉与教学。" },
      { id: "demon_language", name: "魔神语", tier: 1, mark: "魔", description: "魔大陆常用语言，能减少旅行中的误解与隔阂。" },
      { id: "beast_language", name: "兽神语", tier: 1, mark: "兽", description: "大森林各族交流所需的语言能力。" },
      { id: "cooking", name: "野外料理", tier: 0, mark: "食", description: "提高队伍恢复效果，也让同行生活不再只是赶路。" },
      { id: "first_aid", name: "急救与药草", tier: 1, mark: "药", description: "在治愈魔术之外处理伤势、疾病与补给。" },
      { id: "crafting", name: "魔道具制作", tier: 2, mark: "工", description: "将术式、材料与结构知识组合为稳定器具。" }
    ]
  };
  // 同人原创互动；不复述原文台词。远处的熟人以书信、训练笔记保持联系。
  const characterDialogue = {
    "洛琪希": { talk: "洛琪希翻看你的练习笔记，先问你哪一次失败最值得记录。她提起独自在外求学的经历：老师也会迷路，只是学会了继续提问。", train: "洛琪希让你用同样的魔力做出三种大小的水球。你急着施展大魔术，她却把课题改成了不打湿桌面的控制练习。", travel: "你帮洛琪希整理借来的书与教学材料。几封旧学生的来信夹在书中，她停下来一封封读完，然后才继续赶路。", trust: "她把一份写满更正的旧教案交给你，承认上面的错误都是自己犯过的。你决定保留失败记录。", promise: "你们约好每到一处新地方就交换一页见闻；下一次重逢，不只比较学会了多大的魔术。" },
    "希露菲": { talk: "希露菲问起村口那条小路。你没有替她决定该忘掉什么，而是听她说完曾经被孤立的日子，和后来敢于主动认识新朋友的理由。", train: "你们交替操纵细小水流。希露菲不用长篇咏唱，却坚持先确认旁边有没有人；控制比炫耀更让她安心。", travel: "你们把药草分装给邻里，忙完后坐下来吃一顿普通晚饭。希露菲谈起自己的打算，不再只是顺着你的决定。", trust: "她说希望自己也能成为别人依靠的人。你让她负责下一次行动安排，第一次认真做她的助手。", promise: "你们约好，担心和不满都不要留给猜测；即使道路不同，也要把自己的选择说清楚。" },
    "艾莉丝": { talk: "艾莉丝不耐烦地翻过礼仪练习，却主动问你能否再解释一次旅费的账目。你不嘲笑她的计算，她也耐着性子听完。", train: "艾莉丝连续抢攻，逼你正视距离的差距。休息时她仍在练那一步起手；你第一次看清骄傲背后重复过多少次失败。", travel: "你们一起核对补给。艾莉丝想把好吃的都装上，你指出水和绷带更重要；争执后，她自己背起了更重的那一包。", trust: "一次失手后她没有发脾气，而是请你指出破绽。你们定下不留情指出错误、但不羞辱彼此的规矩。", promise: "她决定继续磨炼剑术，你答应不拿共同的未来阻拦她成长。下次见面，用一场公平对练检验进步。" },
    "瑞杰路德": { talk: "瑞杰路德检查营地时提起斯佩路德族承受的恐惧与误解。他不要求陌生人立即相信自己，只问今天是否保护好了眼前的人。", train: "他用练习长杆指出你视野外的空隙。你学到的应变步是游戏化的战场训练，不代表他是北神流师范。", travel: "你们轮流守夜并给落后的旅人留下一份食物。他把警戒交给你一会儿，这份安静的托付比赞扬更郑重。", trust: "他讲起一次没能挽回的失误。你们重新写下撤退信号，约好保护同伴先于证明勇敢。", promise: "你决定在自己的旅途中留下真实的斯佩路德见闻，不替他夸大战绩，也不让谣言成为唯一的记录。" },
    "七星": { talk: "七星把闲聊引回转移研究。你问起实验之外的生活，她沉默片刻，提到一种这里找不到的食物；今天你们没有急着给思念找答案。", train: "你按七星的要求记录每次供魔量。失败的召唤阵被保留编号，排除一个错误假设也是可以复验的进展。", travel: "你们停下实验，核对材料采购和账目，再给彼此安排休息。研究没有突破，但第二天终于不用从疲惫和混乱开始。", trust: "她让你保管一份备份记录。你们讨论如果一次实验失败，怎样保证人和资料都安全。", promise: "你承诺帮助她寻找回去的路，却不保证无法保证的成功；她接受了这份有边界的约定。" },
    "菲兹": { talk: "菲兹认真听你讲过去，却在熟悉的细节前欲言又止。你没有追问身份，只表示等对方准备好再谈。", train: "菲兹模拟护卫中的突发攻击，你练习在保护目标与施法视线之间换位。无咏唱也不能替代判断。", travel: "你们整理大学借阅资料，顺路送还一副遗失的手套。对方难得笑了，谈话不再只剩任务。", trust: "你们互相指出最怕被误解的地方，约好不以沉默代替解释。", promise: "身份仍有未揭开的部分，但你表示信任来自相处，不是服饰与称呼。后续重逢仍由学院主线展开。" },
    "扎诺巴": { talk: "扎诺巴兴奋地解释人偶关节与表情的差异。你把话题从收藏价值引向制作者付出的劳动，他认真记下了这个问题。", train: "你们反复测试同一个关节。扎诺巴负责观察，你负责记录材料的变形，失败品终于变成可用的样本。", travel: "你陪他逛材料铺，约定每项采购先写用途。回去时没有多一堆昂贵摆设，却多了一份可执行的制作计划。", trust: "他承认精细工作不是靠力量就能完成。你们分清职责，让每个人都有真正的贡献。", promise: "你们决定把制作步骤也保存下来，让下一位学徒不必重复全部错误。" },
    "保罗": { talk: "保罗起初急着谈失踪者消息，后来承认自己也会焦躁。你们把责怪暂时放下，先核对每个人到底知道什么。", train: "保罗示范抢攻、格挡与随机应变的差别。这次他只教你守住中线，再用轻微偏转反击，不让三种思路混在一起。", travel: "你与保罗整理搜救名单。划掉重复名字时，他终于肯坐下来吃东西；事情依然困难，但不再由一个人扛着。", trust: "他为一次失控的态度道歉。你也说清自己的难处，双方约定先交换事实再判断。", promise: "你们把寻找失踪者的任务分区，各自带着明确线索出发，而不是用冲动抵消担心。" },
    "基列奴": { talk: "基列奴直截了当地问你今天有没有练习。你帮她核对文字与账目，她承认剑解决不了所有旅途问题。", train: "她用一记极短的示范纠正你的起手。训练目标不是模仿剑王速度，而是出剑时不闭眼、不失去重心。", travel: "你们检查装备与干粮，你负责记录，她负责判断磨损。看似琐碎的准备救下的体力并不比招式少。", trust: "你们交换各自不擅长的事：她接受你的讲解，你也停止掩饰训练中的害怕。", promise: "她要你记住剑应保护什么。你在训练笔记首页写下自己的回答，以后每次升级都回来核对。" },
    "索尔达特": { talk: "索尔达特看穿你故作轻松的样子，却没有逼问。他谈起冒险者队伍的争吵，让你知道低落并不需要靠逞强掩盖。", train: "索尔达特安排你重复队伍换位，提醒你别为了独自出风头破坏前后排配合。", travel: "你们清点一次普通委托的收入。分账后他邀你留下吃饭，话题终于不再围绕失败。", trust: "你承认最近状态不好，他调整了任务分工。求助没有让你被赶出队伍。", promise: "你们约好失意时先找人谈谈，不独自接下超过能力的危险委托。" }
  };
  const characterProfiles = {
    "洛琪希": { specialty: "magic", description: "认真负责的魔术师。向她请教会提升魔术理解，也需要尊重教师与弟子之间的距离。" },
    "希露菲": { specialty: "magic", description: "温柔而坚韧的无咏唱魔术使。共同练习和坦率交流比华丽礼物更重要。" },
    "艾莉丝": { specialty: "sword", description: "行动直接的剑士。她重视实力、诚实和一起经历过的困难。" },
    "瑞杰路德": { specialty: "sword", description: "经验丰富的斯佩路德战士。训练严厉，但会认真保护仍在成长的人。" },
    "七星": { specialty: "life", description: "专注召唤与转移研究的假面少女。她更看重可靠实验与兑现约定。" },
    "菲兹": { specialty: "magic", description: "沉默的白发魔术师，擅长无咏唱与护卫。似乎对你的过去格外在意。" },
    "扎诺巴": { specialty: "life", description: "对人偶与制作技术怀有惊人热情的特别生。" },
    "保罗": { specialty: "sword", description: "掌握多种剑术流派的冒险者。家人与责任让他既坚强又容易失去余裕。" },
    "基列奴": { specialty: "sword", description: "剑王级兽族剑士。只认可持续训练和战斗中不闭眼的人。" },
    "索尔达特": { specialty: "sword", description: "北方冒险者，重视队伍配合，表达关心的方式往往直截了当。" },
    "同行者": { specialty: "life", description: "与你共同承担旅途风险的伙伴。关系会被每一次分工和选择塑造。" }
  };
  const mainEventIds = new Set(["transfer_calamity", "dead_end_crossing", "paul_reunion", "orsted_crossing", "fittoa_homecoming", "academy_reunion", "begaritt_request", "teleport_labyrinth_entry"]);
  const mainSideRequirements = { transfer_calamity: 8, dead_end_crossing: 5, paul_reunion: 5, orsted_crossing: 6, fittoa_homecoming: 5, academy_reunion: 8, begaritt_request: 8, teleport_labyrinth_entry: 6 };
  const regionLabels = ["阿斯拉", "北方诸国", "米里斯", "魔大陆", "贝卡利特"];
  const equipmentCatalog = [
    { id: "novice_sword", name: "旅人练习剑", type: "weapon", cost: 0, bonus: 2, rewardOnly: true, description: "新手任务奖励。装备时剑技伤害+2；已购装备不会消失，可随时换回。" },
    { id: "medicine", name: "药草与绷带", type: "supply", cost: 7, item: "medicine", description: "获得1份药品；可在自由行动中输入“使用药品”。" },
    { id: "iron_sword", name: "平衡铁剑", type: "weapon", cost: 18, bonus: 3, description: "剑术训练收益+1，对练剑技伤害+3。" },
    { id: "mage_staff", name: "青辉法杖", type: "focus", cost: 20, bonus: 3, description: "魔术训练收益+1，对练魔术伤害+3。" },
    { id: "leather_armor", name: "轻皮甲", type: "armor", cost: 24, bonus: 3, description: "旅行遭遇受到的体魄损失减少3。" },
    { id: "travel_cloak", name: "防雨旅行斗篷", type: "armor", cost: 14, bonus: 1, description: "旅行基础疲劳减少2；旧装备保留并自动使用新效果。" }
    ,{ id: "repair", name: "保养全套行装", type: "service", cost: 4, description: "装备耐久恢复至100。耐久为0时装备加成失效。" }
  ];
  const talentNodes = [
    { id: "mana_control", branch: "魔术", name: "魔力精控", description: "魔术训练额外获得3领域经验。", requires: [] },
    { id: "element_fire", branch: "魔术", name: "火系研究", description: "自由行动可准确识别火魔术，并领悟火球术。", requires: ["mana_control"] },
    { id: "silent_cast", branch: "魔术", name: "无咏唱构筑", description: "对练魔术消耗减少2，最低1。", requires: ["element_fire"] },
    { id: "sword_foundation", branch: "剑术", name: "稳固架势", description: "剑术训练额外获得3流派经验。", requires: [] },
    { id: "sword_god_path", branch: "剑术", name: "剑神流·先手", description: "解锁上级剑神流修炼；剑神流招式伤害+3。", requires: ["sword_foundation"] },
    { id: "water_god_path", branch: "剑术", name: "水神流·反击", description: "解锁“流”的修炼；水神流招式伤害+3。", requires: ["sword_foundation"] },
    { id: "north_god_path", branch: "剑术", name: "北神流·奇策", description: "解锁应变步修炼；北神流招式伤害+3。", requires: ["sword_foundation"] },
    { id: "battle_reading", branch: "剑术", name: "战场识读", description: "对练格挡伤害由25%降至15%。", requires: ["sword_foundation"] },
    { id: "finishing_strike", branch: "剑术", name: "决胜一击", description: "对练剑技伤害+5。", requires: ["battle_reading"] },
    { id: "field_lore", branch: "生存", name: "野外知识", description: "旅行基础疲劳减少2，药草采集收入+2。", requires: [] },
    { id: "caravan_network", branch: "生存", name: "商路人脉", description: "工作收入+3，商店价格降低10%。", requires: ["field_lore"] },
    { id: "trusted_face", branch: "生存", name: "可信之人", description: "人物互动额外获得1点羁绊，地区声望获取+1。", requires: ["caravan_network"] }
  ];
  const locationEncounters = {
    "布艾纳村": ["你帮农户赶回走失的羊，得到一份干粮。", "骤雨冲坏小路，你绕行并记下安全渡口。"],
    "罗亚城": ["城门盘查比平时严格，你的身份让守卫多问了几句。", "商队缺少搬运人手，你帮忙后得到小费。"],
    "魔大陆": ["岩甲魔兽从风蚀柱后冲出，你在恶战后保住补给。", "当地魔族猎人提醒你避开红色菌毯，省下一场中毒。"],
    "利卡里斯城": ["公会里有人拿斯佩路德传闻吓唬新人，你听到两种完全不同的说法。", "坑底集市物价混乱，你核对三家摊位才买到合理补给。"],
    "风之港": ["海风卷走通行文件，你和码头工追了半条栈桥。", "船员分享潮汐表，下一段航程更安全。"],
    "大森林": ["雨季水位突然上涨，你放弃近路才保住行装。", "兽族猎人发现你的足迹，确认来意后指出安全营地。"],
    "米里斯": ["圣骑士盘问队伍中的魔族成员，你必须谨慎说明来意。", "失踪者公告旁有人认出一个名字，新的线索被记入册中。"],
    "中央大陆北部": ["佣兵冲突封住道路，你在雪地里多绕了一天。", "索尔达特一类的冒险者提醒你别独自接下高危委托。"],
    "拉诺亚魔法都市": ["失控的练习魔术击碎路灯，你协助学生安全停止术式。", "研究者交换材料目录，你获得一条便宜采购渠道。"],
    "剑之圣地": ["严寒让握剑的手失去知觉，你被迫重新学习热身。", "道场旁观者只记录你是否在失误后继续练习。"],
    "拉庞城": ["沙暴掩埋路标，队伍依靠前一晚的记录返回营地。", "迷宫商人高价兜售假地图，你识破了重复涂改的路线。"],
    "转移迷宫": ["地面术式突然发光，队伍立刻后撤才没被分散。", "旧标记与现实错位，你们花时间重新确认出口。"],
    "菲托亚难民营": ["新一批名册送到营地，你帮忙合并重复记录。", "废墟里找到一枚旧徽章，家属终于得到确切消息。"],
    "阿斯拉王都": ["贵族车队要求让路，你的身份决定了卫兵的语气。", "宫廷流言在酒馆里变了三个版本，你没有轻易下注。"],
    "冒险者公会": ["一张报酬异常高的委托缺少关键细节，你选择先追问。", "新人队伍争执分工，你用自己的经历提出折中方案。"]
  };
  const tutorialGoals = [
    { id: "choice", label: "完成第一个剧情选择", done: s => s.tutorial.actions.includes("choice") || s.seen.length > 0, reward: {xp:12,money:8} },
    { id: "train", label: "修炼或领悟一次技能", done: s => s.tutorial.actions.includes("train"), reward: {xp:18,equipment:"novice_sword"} },
    { id: "bond", label: "与已相遇的人物互动", done: s => s.tutorial.actions.includes("bond"), reward: {xp:18,medicine:2} },
    { id: "travel", label: "打开地图并完成一次旅行", done: s => s.tutorial.actions.includes("travel"), reward: {xp:25,money:12} },
    { id: "save", label: "建立一个手动存档", done: s => s.tutorial.actions.includes("save"), reward: {xp:15,medicine:1} }
  ];
  const sideQuests = [
    {id:"herb_garden",name:"药师的小药圃",text:"药师想补齐安全草药。接取后完成2次药草采集，不需要远行。",counter:"forage",need:2,reward:{xp:20,medicine:2,money:6}},
    {id:"steady_practice",name:"不是天才也能前进",text:"教员希望看到持续练习的记录。接取后修炼3次技能或完成对练。",counter:"train",need:3,reward:{xp:30,money:12}},
    {id:"guild_helper",name:"公会的临时帮手",text:"委托不只有讨伐。接取后做2次日常工作，替公会解决杂务。",counter:"work",need:2,reward:{xp:20,money:15}},
    {id:"road_notes",name:"商路见闻录",text:"商队需要新路况。接取后在地图完成2次旅行，记录沿途遭遇。",counter:"travel",need:2,reward:{xp:30,equipment:"travel_cloak"}},
    {id:"listen_first",name:"听完别人的故事",text:"接取后与已认识的人完成2次互动。熟人也值得被重新认识。",counter:"bond",need:2,reward:{xp:25,medicine:2}},
    {id:"practice_victory",name:"训练场的毕业考",text:"接取后赢得1场技能对练。失败可重试，也可以先提升技能。",counter:"victory",need:1,reward:{xp:40,equipment:"iron_sword"}}
  ];

  const events = [
    {
      id: "pre_transfer_alarm", kicker: "时代专属 · 转移前夕", title: "不肯散去的空中光点",
      text: "天空中的魔力团持续扩大。村民争论着是否只是罕见天象，家人把问题交给你：今天先准备什么？这不是灾难倒计时，你仍能选择如何生活。",
      when: s => s.profile.timeline === "transfer" && !s.seen.includes("transfer_calamity") && ["布艾纳村", "罗亚城"].includes(s.location) && s.turn >= 2,
      priority: 11,
      choices: [
        {label:"准备一份家庭应急包",hint:"药品 +1 · 钱币 -2",months:1,effects:{money:-2,wisdom:2},medicine:1,requires:s=>s.money>=2,lockText:"需要2钱币",result:"你把姓名记录和绷带放在固定位置。准备不能阻止异变，但至少让家人知道慌乱时先拿什么。"},
        {label:"记录魔力团的变化",hint:"学识 +4 · 魔力 +2",months:1,effects:{wisdom:4,mana:2},result:"你把观测日期与光点位置写进笔记，没有用无法验证的猜测吓唬邻里。"},
        {label:"约好失散后的联络方式",hint:"家人 +5 · 魅力 +2",months:1,effects:{charm:2},relation:["家人",5],result:"你们写下姓名、熟人的住处和公会位置；家人终于不再只围着天空争论。"}
      ]
    },
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
      id: "roxy_graduation", kicker: "原著支线 · 师徒", title: "村外的毕业试炼",
      text: "洛琪希认为单纯记住术式不等于成为魔术师。她把毕业试炼安排在村外空地：控制范围、保护农田，并在魔力耗尽前让天气产生可以观测的变化。",
      when: s => s.location === "布艾纳村" && s.ageMonths < 108 && (s.seen.includes("blue_teacher") || (s.relations["洛琪希"] || 0) >= 4),
      choices: [
        { label: "分阶段构筑积雨云", hint: "魔术经验 +18 · 洛琪希 +8", months: 8, effects: { mana: 7, wisdom: 5 }, relation: ["洛琪希", 8], result: "第一次云层散得太快，第二次雨落偏了。直到第三次，你才在不伤害农田的前提下完成变化。她承认你已经能够独立学习。" },
        { label: "缩小范围，追求精确控制", hint: "魔力 +5 · 学识 +7", months: 6, effects: { mana: 5, wisdom: 7 }, relation: ["洛琪希", 6], result: "场面没有传说般壮观，但雨只落在划定区域。洛琪希更满意这种知道自己能力边界的选择。" },
        { label: "承认准备不足，再训练一个月", hint: "魔力 +8 · 羁绊 +4", months: 9, effects: { mana: 8, vitality: 2 }, relation: ["洛琪希", 4], result: "延期并不等于失败。一个月后，你的魔力输出终于不再依靠侥幸，试炼也安全完成。" }
      ]
    },
    {
      id: "eris_kidnapping", kicker: "原著支线 · 罗亚", title: "并非演习的绑架事件",
      text: "原定的“模拟绑架教学”出了问题。仓库外出现陌生脚步，负责演戏的人迟迟没有回应。艾莉丝仍想正面冲出去，而你意识到真正的绑匪已经接管现场。",
      when: s => s.location === "罗亚城" && s.ageMonths >= 84 && s.ageMonths < 144 && s.seen.includes("roa_heir"),
      choices: [
        { label: "用土魔术制造出口并留下记号", hint: "岩炮弹熟练度 +10 · 艾莉丝 +8", months: 2, effects: { mana: 6, wisdom: 4, fame: 3 }, relation: ["艾莉丝", 8], unlockSkill: "stone_cannon", result: "你没有和人数不明的敌人硬拼，而是改变地形、带着艾莉丝脱离包围。追兵仍在，至少主动权回到你们手中。" },
        { label: "配合艾莉丝近身突破", hint: "剑术 +7 · 体魄 -3", months: 2, effects: { sword: 7, vitality: -3, fame: 4 }, relation: ["艾莉丝", 10], result: "你负责制造空隙，她负责毫不犹豫地冲开道路。两人的配合还很粗糙，却第一次真正建立在信任上。" },
        { label: "拖延时间并观察绑匪关系", hint: "学识 +8 · 魅力 +4", months: 2, effects: { wisdom: 8, charm: 4 }, relation: ["艾莉丝", 6], result: "争执暴露了绑匪并非铁板一块。你用利益和疑心让他们互相牵制，等到了外部救援。" }
      ]
    },
    {
      id: "eris_birthday", kicker: "原著日常 · 十岁生日", title: "舞会之前的六个月",
      text: "艾莉丝的生日舞会临近，她宁可连续挥剑也不愿练习舞步。礼仪老师已经放弃，你需要在不打击她自尊的情况下，让她至少愿意完成一支舞。",
      when: s => s.location === "罗亚城" && s.ageMonths >= 108 && s.ageMonths < 144 && (s.relations["艾莉丝"] || 0) >= 6,
      choices: [
        { label: "把舞步拆成剑术步法", hint: "艾莉丝 +9 · 魅力 +5", months: 8, effects: { charm: 5, sword: 2 }, relation: ["艾莉丝", 9], result: "当节拍被解释成距离与重心，她终于不再踩你的脚。舞会当天仍谈不上优雅，却完成得堂堂正正。" },
        { label: "每天只练十五分钟", hint: "羁绊 +7 · 学识 +4", months: 7, effects: { wisdom: 4, charm: 3 }, relation: ["艾莉丝", 7], result: "短时间训练减少了争吵。六个月里你们也谈了许多与课程无关的事，关系不再只是教师与学生。" },
        { label: "请基列奴一起示范", hint: "剑神流经验 +10 · 两人羁绊", months: 6, effects: { sword: 5, charm: 2 }, relation: ["基列奴", 6], result: "基列奴的舞步同样生硬，却让艾莉丝第一次觉得出错并不可耻。训练场笑成一团。" }
      ]
    },
    {
      id: "rikarisu_pet_scheme", kicker: "原著支线 · 冒险者", title: "失踪宠物与公会规则",
      text: "利卡里斯的低等级委托几乎被一支队伍垄断。失踪宠物、可疑饲料与夜间出现的魔物痕迹彼此吻合。同行者提出利用规则漏洞快速提升等级，但一旦出错，所有人都会被驱逐。",
      when: s => ["利卡里斯城", "魔大陆"].includes(s.location) && s.seen.includes("dead_end_crossing"),
      choices: [
        { label: "调查真相并阻止绑架宠物", hint: "学识 +6 · 声望 +5", months: 4, effects: { wisdom: 6, fame: 5, money: 8 }, relation: ["瑞杰路德", 5], result: "你们救回宠物，也得罪了垄断委托的人。公会没有立刻感谢，但普通居民开始用不同目光看待队伍。" },
        { label: "与对方谈判共享低级委托", hint: "魅力 +8 · 钱币 +7", months: 4, effects: { charm: 8, money: 7, fame: 2 }, result: "谈判保住了双方生计，却要求持续监督。你学到公会规则背后还有一整套脆弱的地方经济。" },
        { label: "公开证据，请公会正式裁决", hint: "冒险者经验 +12", months: 3, effects: { wisdom: 4, charm: 3, fame: 6 }, result: "证据链经得起质疑，违规队伍受到处罚。你们没有因此一步升到高等级，但信誉变成了真正资产。" }
      ]
    },
    {
      id: "beast_rainy_season", kicker: "原著支线 · 大森林", title: "雨季、牢房与圣兽幼崽",
      text: "横穿大森林时，你们被误认为绑架兽族孩童的走私者。雨季封住道路，解释又因语言差异不断失败。牢房外，一只白色圣兽幼崽似乎认出了真正敌人的气味。",
      when: s => s.location === "大森林" && s.seen.includes("dead_end_crossing"),
      choices: [
        { label: "用兽神语逐条解释经过", hint: "兽神语熟练度 +12 · 学识 +5", months: 5, effects: { wisdom: 5, charm: 4 }, unlockSkill: "beast_language", relation: ["兽族村落", 8], result: "发音仍不标准，但完整证词终于被记录。误会没有瞬间消失，村中战士愿意重新调查。" },
        { label: "跟随圣兽追踪真正走私者", hint: "体魄 +5 · 剑术 +5", months: 4, effects: { vitality: 5, sword: 5, fame: 5 }, relation: ["兽族村落", 10], result: "泥泞与暴雨拖慢追踪，圣兽却没有跟丢气味。孩子被救回后，牢门终于真正打开。" },
        { label: "等待瑞杰路德和艾莉丝从外部交涉", hint: "同行者羁绊 +8", months: 5, effects: { charm: 4, wisdom: 3 }, relation: ["同行者", 8], result: "你没有独自解决所有问题。队友带回证人和证物，让村落看见这是一支会彼此负责的队伍。" }
      ]
    },
    {
      id: "paul_reunion", kicker: "主线 · 米里斯重逢", title: "父亲与孩子都没能说对的话",
      text: "米里斯酒馆里，保罗终于认出归来的孩子。喜悦只维持了短暂片刻：他听见的冒险故事轻快得像旅行，而你尚不知道他带领寻人队见过多少失踪、伤亡与绝望。",
      when: s => s.location === "米里斯" && s.seen.includes("dead_end_crossing") && !s.seen.includes("paul_reunion"),
      choices: [
        { label: "先听完保罗这几年的经历", hint: "保罗 +10 · 魅力 +5", months: 2, effects: { charm: 5, wisdom: 4 }, relation: ["保罗", 10], result: "争吵没有完全避免，但你终于听见每张寻人告示背后的重量。保罗也意识到，归途并不像讲述时那么轻松。" },
        { label: "坦白旅途中隐去的恐惧与错误", hint: "保罗 +12 · 获得印记", months: 2, effects: { charm: 6, vitality: 2 }, relation: ["保罗", 12], achievement: "并不完美的重逢", result: "你没有证明自己更辛苦，只把没能说出口的部分说完。父子都道了歉，问题仍在，却不再彼此攻击。" },
        { label: "暂时离开，冷静后再回来", hint: "学识 +5 · 保罗 +6", months: 3, effects: { wisdom: 5 }, relation: ["保罗", 6], result: "当晚的谈话依然艰难，但少了酒气和围观者。你们开始讨论具体的家人线索，而不是争论谁更失败。" }
      ]
    },
    {
      id: "orsted_crossing", kicker: "主线 · 赤龙下颚", title: "被世界恐惧的龙神",
      text: "穿越赤龙山脉附近时，一名白发男子迎面走来。同行者本能地恐惧，瑞杰路德握紧武器。他似乎认识你身边每个人，却唯独对不该出现的名字产生杀意。",
      when: s => s.location === "中央大陆北部" && s.seen.includes("paul_reunion"),
      choices: [
        { label: "阻止队友先动手并谨慎回答", hint: "学识 +8 · 体魄 -5", months: 1, effects: { wisdom: 8, vitality: -5 }, achievement: "龙神遭遇", result: "你避免了最初的误判，却仍感到压倒性的实力差。活下来不是胜利，而是一条必须多年后才能理解的疑问。" },
        { label: "用岩炮弹制造撤退距离", hint: "需要岩炮弹 · 魔力 +7", requires: s => (s.skills.stone_cannon || 0) >= 10, lockText: "掌握岩炮弹", months: 1, effects: { mana: 7, vitality: -8 }, result: "强化岩炮弹只换来一瞬间。你第一次直观明白，招式威力和真正的等级差距不是一回事。" },
        { label: "记住他的动作，不做无意义追击", hint: "学识 +10 · 解锁长期课题", months: 1, effects: { wisdom: 10, vitality: -4 }, achievement: "七大列强的距离", result: "你把恐惧转化为观察：步法、视线、魔力流动，以及对方为何停手。这些记录多年后仍有价值。" }
      ]
    },
    {
      id: "fittoa_homecoming", kicker: "主线 · 归乡", title: "罗亚已经不在原来的地方",
      text: "漫长旅途终于回到菲托亚。麦田、宅邸和熟悉街道都已从地图上消失，难民营建立在废墟旁。名单告诉你哪些人活着，也告诉你有些等待不会得到圆满回答。",
      when: s => s.location === "菲托亚难民营" && s.seen.includes("orsted_crossing"),
      choices: [
        { label: "陪艾莉丝确认家族消息", hint: "艾莉丝 +12 · 魅力 +4", months: 4, effects: { charm: 4, vitality: 2 }, relation: ["艾莉丝", 12], result: "你没有用安慰覆盖事实，只陪她一项项确认。她最终选择离开修行，不是因为旅途毫无意义，而是因为终于看见自己的不足。" },
        { label: "加入难民营重建工作", hint: "体魄 +5 · 声望 +8", months: 8, effects: { vitality: 5, fame: 8, money: 5 }, relation: ["菲托亚难民", 10], result: "重建不如冒险传奇醒目。几个月后，新仓库、井和名册保管室却真实留在土地上。" },
        { label: "整理归乡旅程并寻找下一条线索", hint: "学识 +8 · 解锁北方篇", months: 5, effects: { wisdom: 8, fame: 5 }, unlock: "中央大陆北部", achievement: "归乡之人", result: "你把已知家人去向、未确认名单和转移现象记录成册。阶段结束了，寻找塞妮丝的道路仍未结束。" }
      ]
    },
    {
      id: "northern_soldat", kicker: "原著支线 · 北方冒险者", title: "泥沼与反感你的前辈",
      text: "北方城市的冒险者称你为“泥沼”，既因为你惯用的魔术，也因为你总像隔着一层什么与人相处。队长索尔达特直言不讳地说，他讨厌你那副礼貌却不信任任何人的样子。",
      when: s => s.location === "中央大陆北部" && (s.seen.includes("fittoa_homecoming") || s.profile.timeline === "youth"),
      choices: [
        { label: "接受他的队伍邀约共同委托", hint: "冒险者经验 +15 · 索尔达特 +8", months: 5, effects: { mana: 4, vitality: 4, fame: 5, money: 12 }, relation: ["索尔达特", 8], result: "他没有突然变得温柔，却在你失误时守住了侧翼。可靠有时不是好听的话，而是危险中站在正确位置。" },
        { label: "承认自己确实在逃避关系", hint: "魅力 +7 · 索尔达特 +6", months: 3, effects: { charm: 7, wisdom: 3 }, relation: ["索尔达特", 6], result: "坦白没有治好一切，但结束了虚假的客套。此后他的批评仍尖锐，却不再只是敌意。" },
        { label: "用强化岩炮弹证明战斗能力", hint: "岩炮弹熟练度 +12 · 声望 +4", months: 4, effects: { mana: 6, fame: 4 }, unlockSkill: "stone_cannon", result: "威力足以让队伍重新评估你，但索尔达特仍提醒：单人火力不能替代配合和撤退判断。" }
      ]
    },
    {
      id: "academy_reunion", kicker: "主线 · 魔法大学", title: "沉默菲兹与没有说出的名字",
      text: "在拉诺亚魔法大学，白发护卫菲兹多次帮助你熟悉校园与无咏唱训练。对方明明知道许多童年细节，却始终没有说出真正身份，似乎也在等待你主动看见。",
      when: s => s.location === "拉诺亚魔法都市" && s.ageMonths >= 180 && (s.profile.timeline === "academy" || s.seen.includes("fittoa_homecoming") || s.seen.includes("northern_soldat")),
      choices: [
        { label: "从共同记忆询问真实身份", hint: "菲兹 +12 · 希露菲关系继承", months: 3, effects: { charm: 7, wisdom: 4 }, relation: ["菲兹", 12], revealFitz: true, achievement: "白色面具之后", result: "你没有逼问，而是说起村庄、魔术和那段被转移事件切断的童年。沉默很久后，真正的名字终于被说出。" },
        { label: "继续相处，等对方愿意开口", hint: "菲兹 +9 · 魅力 +5", months: 5, effects: { charm: 5, mana: 3 }, relation: ["菲兹", 9], result: "等待不是忽视。你在图书馆、训练场和餐桌上逐渐拼回熟悉感，对方也终于有勇气准备坦白。" },
        { label: "邀请菲兹共同研究转移事件", hint: "学识 +8 · 解锁乱魔", months: 4, effects: { wisdom: 8, mana: 5 }, relation: ["菲兹", 7], unlockSkill: "disturb_magic", result: "研究让你们谈到各自被转移后的经历。术式取得进展，真正重要的却是终于不再独自背负记忆。" }
      ]
    },
    {
      id: "fittoa_missing_list", kicker: "原著交汇 · 菲托亚", title: "写满名字的失踪者名册",
      text: "菲托亚领已变成大片空地与废墟。难民营把生还、失踪和遇难者分册记录，公会不断向各大陆发送副本。你在名册旁看见熟悉姓氏，也听说保罗组织的搜救队正在米里斯追查家人去向。",
      when: s => s.location === "菲托亚难民营" && s.seen.includes("transfer_calamity"),
      choices: [
        { label: "留下来整理跨大陆线索", hint: "学识 +7 · 声望 +5", months: 5, effects: { wisdom: 7, fame: 5 }, relation: ["菲托亚难民", 8], achievement: "菲托亚记录者", result: "你把重复、矛盾和过期消息逐条核对。几户家庭因此得到亲人的确切下落。" },
        { label: "加入废墟搜救队", hint: "体魄 +6 · 剑术 +3", months: 5, effects: { vitality: 6, sword: 3, fame: 4 }, relation: ["菲托亚难民", 7], result: "废墟没有奇迹般恢复，但你找回的信物、文书与物资让幸存者能够重新开始。" },
        { label: "带一份名册前往米里斯", hint: "解锁米里斯 · 魅力 +4", months: 6, effects: { charm: 4, money: -5 }, move: "米里斯", unlock: "米里斯", achievement: "跨大陆寻人", result: "你将名册贴身收好，沿商路向米里斯出发。那里可能有搜救队尚未掌握的名字。" }
      ]
    },
    {
      id: "dead_end_crossing", kicker: "原著交汇 · 归乡旅途", title: "名为“Dead End”的队伍",
      text: "利卡里斯公会里，关于一支奇怪队伍的议论从未停过：年少魔术师、红发剑士，以及被世人恐惧的斯佩路德战士瑞杰路德。他们正尝试一边接取委托，一边筹集横穿魔大陆的旅费。",
      when: s => ["利卡里斯城", "魔大陆"].includes(s.location) && s.turn >= 3 && (s.seen.includes("transfer_calamity") || s.profile.timeline === "if"),
      choices: [
        { label: "与他们共同完成一次委托", hint: "魔力 +4 · 剑术 +4 · 瑞杰路德 +8", months: 4, effects: { mana: 4, sword: 4, money: 9 }, relation: ["瑞杰路德", 8], achievement: "与 Dead End 并肩", result: "队伍中的三人各有脾气，却在战斗时彼此补足。你亲眼看见传闻之外的真实。" },
        { label: "帮助解释斯佩路德族的真相", hint: "魅力 +7 · 声望 +3", months: 3, effects: { charm: 7, fame: 3 }, relation: ["瑞杰路德", 6], result: "一次说明无法抹去数百年的恐惧，但至少有几个被救下的人愿意讲述不同版本。" },
        { label: "交换路线情报后独自前往风之港", hint: "解锁风之港 · 学识 +4", months: 4, effects: { wisdom: 4, money: -4 }, move: "风之港", unlock: "风之港", result: "你们在城门处分开。向南的道路漫长，沿途仍能听到那支队伍留下的新传闻。" }
      ]
    },
    {
      id: "paul_search_group", kicker: "原著交汇 · 家人", title: "米里斯的寻人队",
      text: "酒馆墙上贴满菲托亚失踪者画像。保罗带领的寻人队把冒险者分散到各地，既寻找格雷拉特家人，也尽力帮助所有受灾者。疲惫和坏消息正在消磨每个人。",
      when: s => s.location === "米里斯" && (s.seen.includes("transfer_calamity") || s.turn >= 9),
      choices: [
        { label: "提供自己沿途收集的消息", hint: "学识 +5 · 寻人队 +8", months: 2, effects: { wisdom: 5, fame: 3 }, relation: ["菲托亚寻人队", 8], result: "零散见闻拼成了新的搜索方向。不是所有消息都令人安心，但不确定终于少了一些。" },
        { label: "陪保罗完成一次危险搜救", hint: "体魄 +5 · 剑术 +5", months: 5, effects: { vitality: 5, sword: 5, fame: 5 }, relation: ["菲托亚寻人队", 10], achievement: "寻人队同伴", result: "这次找到的是另一户人家的孩子。保罗沉默很久，随后仍亲自把好消息送到难民家属手中。" },
        { label: "前往公会联络更多大陆分部", hint: "魅力 +7 · 钱币 -5", months: 4, effects: { charm: 7, money: -5, fame: 4 }, unlock: "菲托亚难民营", relation: ["菲托亚寻人队", 6], result: "新的通告通过商船和公会网络传播。等待依然漫长，但名单终于跨越了大陆。" }
      ]
    },
    {
      id: "ranoa_special_students", kicker: "原著交汇 · 魔法大学", title: "特别生们的研究课题",
      text: "拉诺亚魔法大学聚集着许多不按常理行事的特别生：沉默的白发护卫菲兹、醉心人偶制作的扎诺巴，以及研究召唤与转移现象的假面少女七星。你的课题意外与他们产生交集。",
      when: s => s.location === "拉诺亚魔法都市" && s.ageMonths >= 180 && s.turn >= 6,
      choices: [
        { label: "协助七星校准召唤术式", hint: "需要学识 28 · 学识 +9", requires: s => s.stats.wisdom >= 28, lockText: "学识达到 28", months: 6, effects: { wisdom: 9, mana: 5 }, relation: ["七星", 7], achievement: "转移现象研究者", result: "实验没有打开归乡之门，却排除了一个错误假设。对研究而言，这同样是可靠进展。" },
        { label: "和扎诺巴改良魔导人偶关节", hint: "学识 +6 · 钱币 +5", months: 5, effects: { wisdom: 6, money: 5 }, relation: ["扎诺巴", 7], result: "材料又报废了几批，新的关节结构却终于能承受魔力驱动。扎诺巴兴奋得忘了时间。" },
        { label: "邀请菲兹进行无咏唱魔术对练", hint: "魔力 +7 · 菲兹 +7", months: 4, effects: { mana: 7, charm: 2 }, relation: ["菲兹", 7], result: "对方的施法速度让你不得不改变习惯。训练结束时，帽檐下露出一个像是怀念什么的微笑。" }
      ]
    },
    {
      id: "begaritt_request", kicker: "原著交汇 · 远方来信", title: "来自贝卡利特的求援",
      text: "一封辗转多地的信抵达北方。信中提到菲托亚失踪者塞妮丝的线索指向贝卡利特大陆迷宫都市拉庞，而先行探索队在一座异常迷宫前受阻。",
      when: s => s.location === "拉诺亚魔法都市" && s.turn >= 20 && s.seen.includes("academy_reunion"),
      choices: [
        { label: "研究资料，筹备远征", hint: "学识 +8 · 解锁拉庞城", months: 8, effects: { wisdom: 8, money: -8 }, unlock: "拉庞城", achievement: "贝卡利特远征准备", result: "你借阅迷宫记录、准备抗热装备并学习当地语言。危险不会因此消失，但至少不再完全未知。" },
        { label: "联络可靠队友共同出发", hint: "魅力 +6 · 解锁拉庞城", months: 7, effects: { charm: 6, money: -10 }, unlock: "拉庞城", relation: ["远征队", 8], result: "一个人无法应付高难迷宫。你把治疗、前卫、侦察和补给逐一落实后，才在地图上画下路线。" },
        { label: "暂缓出发，继续确认情报", hint: "学识 +4 · 记录拉庞路线但不出发", months: 4, effects: { wisdom: 4 }, unlock: "拉庞城", result: "谨慎不是怯懦。你记下拉庞路线，但继续等待可靠消息、积攒资源。将来是否出发，仍由你在地图上决定。" }
      ]
    },
    {
      id: "teleport_labyrinth_entry", kicker: "原著交汇 · 转移迷宫", title: "不断改变位置的阶梯",
      text: "迷宫前几层像巨大的蚁穴，岔路、死路与转移陷阱让地图迅速失效。先行者留下的探索记录只能提供部分帮助，队伍必须为每一次深入保留退路。",
      when: s => s.location === "转移迷宫",
      choices: [
        { label: "用记录与标记稳步探索", hint: "学识 +9 · 体魄 -3", months: 5, effects: { wisdom: 9, vitality: -3, fame: 6 }, achievement: "迷宫测绘者", result: "你们没有追求速度，而是确认每一个转移点的对应关系。撤退路线因此真正可靠起来。" },
        { label: "以强力魔术突破魔物群", hint: "需要魔力 48 · 魔力 +8", requires: s => s.stats.mana >= 48, lockText: "魔力达到 48", months: 4, effects: { mana: 8, vitality: -5, fame: 8 }, achievement: "迷宫破阵", result: "密集魔物被一次压制，但魔力消耗远超预期。你坚持在深入前先让全队休整。" },
        { label: "承认准备不足，安全撤回拉庞", hint: "体魄 +3 · 保全队伍", months: 2, effects: { vitality: 3 }, move: "拉庞城", result: "没有宝物，也没有英雄事迹，但所有人都活着回到地面。你已经知道下次必须补足什么。" }
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

  routineTemplates.push(...[
    ["雨后的药草圃", "雨水冲坏了药草标签，有人急着把相似的叶片混在一起。药师请你在送药前重新检查。", ["逐株核对图鉴", "帮忙修复药圃", "向药师请教处理伤口"], [{ wisdom: 4 }, { vitality: 3, money: 5 }, { mana: 3, wisdom: 2 }], ["你发现两种相似的叶片用途完全不同，把差别补进标签。", "排水沟重新畅通，这次劳动换来了药师的谢礼。", "药师先教你清洁伤口，再解释哪些问题不能只依赖魔术。"]],
    ["借书人的空白批注", "你在借来的书里发现前人提出却未解答的问题。书馆即将闭门，你要怎样利用剩下的时间？", ["亲手验证术式", "寻找另一份文献", "组织小型读书会"], [{ mana: 4 }, { wisdom: 5 }, { charm: 4 }], ["试验推翻了一个看似合理的步骤，你把安全条件写在旁边。", "第二份记录给出了不同的解释，疑问变成了新的课题。", "不同经历的人读出不同含义，你们约好下次互换笔记。"]],
    ["练习场的失手", "一位初学者在众人面前连续失误，把练习剑扔到地上。旁观者的笑声让局面更加僵硬。", ["陪他从慢动作开始", "请围观者留出空间", "一起检查训练器材"], [{ sword: 4, charm: 1 }, { charm: 4 }, { wisdom: 3, money: 3 }], ["动作被拆开后，他终于看清自己失去重心的位置。", "没有观众催促，他愿意重新捡起练习剑。", "不合适的握柄被换掉；意志并不是所有问题的答案。"]],
    ["晚饭前的分歧", "临时队伍为一笔补给费争执。有人认为前卫应该多分，也有人说侦察没有得到认可。", ["公开账目重新协商", "补做一份采购清单", "轮换职责理解彼此"], [{ charm: 4, wisdom: 1 }, { money: 6, wisdom: 2 }, { vitality: 3, sword: 2 }], ["没有人完全满意，但分配规则终于在出发前说清楚。", "你找到了重复购买的物资，节省的钱缓解了争执。", "体验过彼此的工作后，抱怨变成更具体的建议。"]],
    ["夜路上的灯火", "晚归时你看见路边一盏摇晃的灯。迷路的旅人拿着旧地图，不敢判断岔路方向。", ["观察地形辨认道路", "用微弱魔术照亮路标", "护送到最近的驿站"], [{ wisdom: 4 }, { mana: 3, charm: 2 }, { vitality: 3, fame: 1 }], ["旧桥已毁，你标出新的绕行路，避免更多人走错。", "你控制亮度与方向，没有用耀眼的魔术惊动林中魔物。", "驿站老板记下你的提醒，准备明早修补指路牌。"]],
    ["没有委托的休息日", "公告栏暂时没有适合你的工作。难得的空闲不必立刻填满，你可以整理生活中被忽略的部分。", ["保养装备", "练习野外料理", "给旧友写信"], [{ sword: 3, money: 3 }, { vitality: 4, wisdom: 2 }, { charm: 4, wisdom: 1 }], ["你及时发现皮带的裂口，免去下次在路上修补的狼狈。", "简单的食材变得可口，队伍恢复体力也有了盼头。", "你没有只报喜，也坦诚写下困惑。等回信成为旅途的小小期待。"]]
  ].map(([title, text, labels, effects, results]) => ({ kicker: "生活支线", title, text, choices: labels.map((label, i) => ({ label, hint: Object.entries(effects[i]).map(([k, v]) => `${({mana:"魔力",sword:"剑术",vitality:"体魄",wisdom:"学识",charm:"魅力",money:"钱币",fame:"声望"})[k]} +${v}`).join(" · "), months: 3, effects: effects[i], result: results[i] })) })));

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
      version: 5, profile, ageMonths: startAge[profile.timeline] || 144, ageDays: 0, location: profile.location,
      chapter: startChapter[profile.timeline] || "自由人生", stats: initial, money: resourceBoost.money, fame: resourceBoost.fame,
      turn: 0, relations: {}, bondMemories: [], history: [], seen: [], achievements: [], currentEventId: "opening", phase: "event",
      unlockedLocations: [profile.location], visitedLocations: [profile.location], freeActionCount: 0,
      progression: { xp: 0, magicXp: initial.mana * 2, swordStyles: { swordGod: initial.sword * 2, waterGod: 0, northGod: 0 }, lifeXp: 0 },
      skills: { water_ball: 15, healing: 5, arm_drop: 10, human_language: 25 },
      story: { sideSinceMain: 0, mainCompleted: 0 },
      survival: { fatigue: 0, morale: 70 },
      equipment: { weapon: "练习木剑", focus: "学徒法杖", armor: "旅行斗篷", durability: 100, bonuses: { weapon: 0, focus: 0, armor: 0 } },
      inventory: { medicine: 0, ownedEquipment: [] }, talents: [], regionalReputation: Object.fromEntries(regionLabels.map(name => [name, 0])),
      tutorial: { actions: [], claimed: [] }, quests: { counters: {train:0,work:0,forage:0,travel:0,bond:0,victory:0}, records: {} }, encounterCount: 0,
      lastResult: "", lastChoice: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
  }

  function unlockLocation(name, announce = true) {
    if (!worldLocations[name] || state.unlockedLocations.includes(name)) return false;
    state.unlockedLocations.push(name);
    if (announce) showToast(`地图已解锁：${name}`);
    return true;
  }

  function refreshUnlockedLocations() {
    if (!state) return;
    unlockLocation(state.location, false);
    if (!state.seen.includes("transfer_calamity") && ["布艾纳村", "罗亚城"].includes(state.location)) {
      unlockLocation("布艾纳村", false); unlockLocation("罗亚城", false);
    }
    if (state.turn >= 2 || state.ageMonths >= 144) unlockLocation("冒险者公会", false);
    if (state.turn >= 5) unlockLocation("中央大陆北部", false);
    if (state.seen.includes("transfer_calamity")) {
      unlockLocation("菲托亚难民营", false);
      unlockLocation("魔大陆", false);
      unlockLocation("利卡里斯城", false);
    }
    if (["魔大陆", "利卡里斯城"].includes(state.location) || state.seen.includes("dead_end_crossing")) unlockLocation("利卡里斯城", false);
    if (state.seen.includes("dead_end_crossing") || state.location === "风之港") unlockLocation("风之港", false);
    if (state.location === "风之港" || state.turn >= 8) unlockLocation("大森林", false);
    if (["大森林", "米里斯"].includes(state.location) || state.turn >= 10) unlockLocation("米里斯", false);
    if (state.profile.timeline === "academy" || state.turn >= 7 || state.achievements.includes("魔法大学入学")) unlockLocation("拉诺亚魔法都市", false);
    if (state.fame >= 18 && state.turn >= 10) unlockLocation("阿斯拉王都", false);
    if (state.stats.sword >= 35) unlockLocation("剑之圣地", false);
    if (state.unlockedLocations.includes("拉庞城") && state.stats.wisdom >= 35) unlockLocation("转移迷宫", false);
  }

  function tierForXp(xp, table = masteryTiers) {
    return table.reduce((current, tier) => xp >= tier.xp ? tier : current, table[0]);
  }

  function nextTier(xp, table = masteryTiers) {
    return table.find(tier => tier.xp > xp) || table[table.length - 1];
  }

  function bestSwordXp() {
    return Math.max(...Object.values(state.progression.swordStyles));
  }

  function playerLevel() {
    return Math.min(50, 1 + Math.floor(state.progression.xp / 30));
  }

  function addProgress({ xp = 0, magic = 0, sword = 0, style = "swordGod", life = 0 } = {}) {
    state.progression.xp += xp;
    state.progression.magicXp += magic;
    state.progression.swordStyles[style] = (state.progression.swordStyles[style] || 0) + sword;
    state.progression.lifeXp += life;
  }

  function currentRegion(location = state.location) {
    const region = (worldLocations[location] || {}).region || "";
    if (/魔大陆/.test(region)) return "魔大陆";
    if (/米里斯|大森林/.test(region)) return "米里斯";
    if (/贝卡利特|迷宫/.test(region)) return "贝卡利特";
    if (/北|魔法三国|剑之圣地/.test(region)) return "北方诸国";
    return "阿斯拉";
  }

  function markTutorial(action) {
    if (!state.tutorial.actions.includes(action)) state.tutorial.actions.push(action);
    if (action in state.quests.counters) state.quests.counters[action]++;
  }

  function talentPoints() {
    return Math.max(0, Math.floor(state.progression.xp / 60) - state.talents.length);
  }

  function hasTalent(id) { return state.talents.includes(id); }

  function equipmentBonus(slot) { return state.equipment.durability > 0 ? (state.equipment.bonuses[slot] || 0) : 0; }

  function addRegionalReputation(amount, region = currentRegion()) {
    const bonus = hasTalent("trusted_face") && amount > 0 ? 1 : 0;
    state.regionalReputation[region] = clamp((state.regionalReputation[region] || 0) + amount + bonus, -20, 100);
  }

  function applyLivingCost(months = 1, intensity = 1, mode = "normal") {
    if (mode === "travel") intensity = Math.max(0, intensity - (hasTalent("field_lore") ? 2 : 0) - (state.equipment.durability > 0 && state.equipment.armor === "防雨旅行斗篷" ? 2 : 0));
    state.survival.fatigue = clamp(state.survival.fatigue + intensity);
    if (mode === "travel" || mode === "training") state.equipment.durability = clamp(state.equipment.durability - (mode === "travel" ? 5 : 3));
  }

  function resolveTravelEncounter(name) {
    const pool = locationEncounters[name] || [`你平安抵达${name}，沿途记下了道路与补给点。`];
    const index = Math.floor(Math.random() * pool.length);
    state.encounterCount += 1;
    let consequence = "";
    if (index === 0) {
      const danger = ({ "低": 1, "中": 3, "高": 5, "极高": 7, "致命": 9 }[(worldLocations[name] || {}).danger] || 2);
      const loss = danger <= 3 ? 0 : Math.max(0, danger - equipmentBonus("armor"));
      state.stats.vitality = clamp(state.stats.vitality - loss);
      state.survival.fatigue = clamp(state.survival.fatigue + 5);
      addRegionalReputation(2);
      consequence = loss ? `你承受${loss}点体魄损失；装备抵消了${danger - loss}点风险。` : "你花时间处理了这件事，没有受伤。";
    } else {
      state.money += 2; state.stats.wisdom = clamp(state.stats.wisdom + 1); addRegionalReputation(1);
      consequence = "你获得2钱币与1点学识。";
    }
    return `${pool[index]} ${consequence}`;
  }

  function environmentalFeedback() {
    const region = currentRegion();
    const rep = state.regionalReputation[region] || 0;
    const race = state.profile.race;
    const humanRegion = ["阿斯拉", "米里斯"].includes(region);
    let attitude = rep >= 25 ? `你在${region}已颇受信任，商人与公会愿意透露更重要的消息。` : rep < 0 ? `你在${region}留下了负面印象，交易和盘查都更困难。` : `你在${region}仍是普通旅人，需要用行动建立名声。`;
    if (humanRegion && ["魔族", "米格尔德族"].includes(race) && rep < 20) attitude += " 部分居民因魔族外貌保持距离，初次交涉更谨慎。";
    if (region === "魔大陆" && race === "人族" && rep < 15) attitude += " 人族面孔在这里同样显眼，当地人会先观察你是否尊重他们的规矩。";
    if (state.profile.identity === "贵族子弟" && region === "阿斯拉") attitude += " 贵族出身让守卫更客气，也让政治对手更容易注意到你。";
    if (state.profile.timeline === "transfer" && !state.seen.includes("transfer_calamity")) attitude += " 天空中的魔力团正在扩大，危机感一天比一天明确。";
    return attitude;
  }

  function renderTutorial() {
    const done = tutorialGoals.filter(goal => goal.done(state)).length;
    $("tutorialProgress").textContent = `${done}/${tutorialGoals.length}`;
    $("tutorialList").innerHTML = tutorialGoals.map((goal, index) => `<li class="${goal.done(state) ? "done" : ""}"><span>${goal.done(state) ? "✓" : index + 1}</span><div><button type="button" data-guide="${goal.id}">${escapeHtml(goal.label)}</button><small>${rewardText(goal.reward)}</small></div><button class="claim-button" data-tutorial-claim="${goal.id}" ${!goal.done(state) || state.tutorial.claimed.includes(goal.id) ? "disabled" : ""}>${state.tutorial.claimed.includes(goal.id) ? "已领取" : "领奖"}</button></li>`).join("");
    $("tutorialList").querySelectorAll("[data-guide]").forEach(button => button.addEventListener("click", () => navigateGame(({choice:"story",train:"skills",bond:"character",travel:"map",save:"save"})[button.dataset.guide])));
    $("tutorialList").querySelectorAll("[data-tutorial-claim]").forEach(button => button.addEventListener("click", () => claimTutorial(button.dataset.tutorialClaim)));
    $("tutorialBonus").textContent = state.tutorial.claimed.includes("graduation") ? "毕业礼已领取：40经验 + 青辉法杖" : "领完五项目标奖励，自动获得毕业礼：40经验 + 青辉法杖。";
  }

  function rewardText(reward) {
    return [reward.xp ? `${reward.xp}经验` : "", reward.money ? `${reward.money}钱币` : "", reward.medicine ? `药品×${reward.medicine}` : "", reward.equipment ? equipmentCatalog.find(item => item.id === reward.equipment).name : ""].filter(Boolean).join(" · ");
  }

  function grantReward(reward) {
    addProgress({xp:reward.xp || 0}); state.money += reward.money || 0; state.inventory.medicine += reward.medicine || 0;
    if (reward.equipment) {
      const item = equipmentCatalog.find(entry => entry.id === reward.equipment);
      if (!state.inventory.ownedEquipment.includes(item.id)) state.inventory.ownedEquipment.push(item.id);
      if ((state.equipment.bonuses[item.type] || 0) < item.bonus) { state.equipment[item.type] = item.name; state.equipment.bonuses[item.type] = item.bonus; }
    }
  }

  function logReward(title, reward) {
    state.history.unshift({age:formatAge(),location:state.location,title,choice:"领取奖励",result:rewardText(reward)});
    state.history = state.history.slice(0,40);
  }

  function claimTutorial(id) {
    const goal = tutorialGoals.find(item => item.id === id);
    if (!goal || !goal.done(state) || state.tutorial.claimed.includes(id)) return false;
    state.tutorial.claimed.push(id); grantReward(goal.reward); logReward(goal.label,goal.reward);
    if (tutorialGoals.every(item => state.tutorial.claimed.includes(item.id)) && !state.tutorial.claimed.includes("graduation")) {
      state.tutorial.claimed.push("graduation"); const gift = {xp:40,equipment:"mage_staff"}; grantReward(gift); logReward("新手毕业礼",gift);
    }
    checkMilestones(); autoSave(); render(); showToast(`已领取：${rewardText(goal.reward)}`); return true;
  }

  function sideQuestsUnlocked() { return state.tutorial.claimed.includes("choice"); }

  function questProgress(quest) {
    const record = state.quests.records[quest.id];
    return record ? Math.min(quest.need, Math.max(0,state.quests.counters[quest.counter]-record.start)) : 0;
  }

  function renderSideQuests() {
    const unlocked = sideQuestsUnlocked();
    $("sideQuestStatus").textContent = unlocked ? "自由接取，接取后的行动才计数。无需完成支线也能继续主线。" : "先完成并领取第一个新手目标奖励，开启可选支线。";
    $("sideQuestList").innerHTML = sideQuests.map(quest => {
      const record = state.quests.records[quest.id]; const done = record?.claimed; const ready = record && questProgress(quest) >= quest.need;
      return `<article class="side-quest"><h3>${quest.name}</h3><p>${quest.text}</p><small>奖励：${rewardText(quest.reward)}</small><p>${record ? `进度 ${questProgress(quest)}/${quest.need}` : "尚未接取"}</p><div><button data-quest="${quest.id}" data-quest-action="${record ? "claim" : "accept"}" ${!unlocked || done || (record && !ready) ? "disabled" : ""}>${done ? "已领取" : !record ? "接取任务" : ready ? "领取奖励" : "进行中"}</button>${record && !done ? `<button data-quest="${quest.id}" data-quest-action="abandon">暂时放下</button>` : ""}</div></article>`;
    }).join("");
    $("sideQuestList").querySelectorAll("[data-quest]").forEach(button => button.addEventListener("click", () => questAction(button.dataset.quest,button.dataset.questAction)));
  }

  function questAction(id, action) {
    const quest = sideQuests.find(item => item.id === id); const record = state.quests.records[id];
    if (!quest || !sideQuestsUnlocked() || record?.claimed) return false;
    if (action === "accept" && !record) state.quests.records[id] = {start:state.quests.counters[quest.counter],claimed:false};
    else if (action === "abandon" && record) delete state.quests.records[id];
    else if (action === "claim" && record && questProgress(quest)>=quest.need) { record.claimed = true; grantReward(quest.reward); logReward(quest.name,quest.reward); showToast(`支线奖励：${rewardText(quest.reward)}`); }
    else return false;
    checkMilestones(); autoSave(); render(); renderSideQuests(); return true;
  }

  function renderTalents() {
    $("talentPoints").textContent = `${talentPoints()} 可用点数`;
    $("talentTree").innerHTML = ["魔术", "剑术", "生存"].map(branch => `<div class="talent-branch"><h4>${branch}路线</h4>${talentNodes.filter(node => node.branch === branch).map(node => {
      const learned = hasTalent(node.id);
      const ready = node.requires.every(hasTalent) && talentPoints() > 0;
      return `<button type="button" class="talent-node${learned ? " learned" : ""}" data-talent="${node.id}" ${learned || !ready ? "disabled" : ""}><b>${learned ? "✓ " : ""}${node.name}</b><small>${node.description}</small>${!learned && node.requires.length && !node.requires.every(hasTalent) ? "<em>需要上一节点</em>" : ""}</button>`;
    }).join("")}</div>`).join("");
    $("talentTree").querySelectorAll("[data-talent]").forEach(button => button.addEventListener("click", () => learnTalent(button.dataset.talent)));
  }

  function learnTalent(id) {
    const node = talentNodes.find(item => item.id === id);
    if (!node || hasTalent(id) || talentPoints() < 1 || !node.requires.every(hasTalent)) return;
    state.talents.push(id);
    if (id === "element_fire") state.skills.fire_ball = Math.max(state.skills.fire_ball || 0, 10);
    autoSave(); renderSkills(); render(); showToast(`已解锁成长路线：${node.name}`);
  }

  function shopPrice(item) {
    const rep = state.regionalReputation[currentRegion()] || 0;
    const discount = (hasTalent("caravan_network") ? .1 : 0) + (rep >= 30 ? .1 : rep < 0 ? -.15 : 0);
    return Math.max(1, Math.ceil(item.cost * (1 - discount)));
  }

  function openShop() { renderShop(); $("shopModal").showModal(); }

  function renderShop() {
    const region = currentRegion();
    $("shopContext").textContent = `${state.location} · ${region}声望 ${state.regionalReputation[region] || 0}。声望30可再减价10%；负声望会涨价。当前钱币 ${state.money}。`;
    $("reputationList").innerHTML = regionLabels.map(name => `<span class="${name === region ? "current" : ""}">${name}<b>${state.regionalReputation[name] || 0}</b></span>`).join("");
    $("shopList").innerHTML = equipmentCatalog.filter(item => !item.rewardOnly || state.inventory.ownedEquipment.includes(item.id)).map(item => {
      const price = shopPrice(item);
      const owned = item.type === "service" ? state.equipment.durability >= 100 : item.type !== "supply" && [state.equipment.weapon, state.equipment.focus, state.equipment.armor].includes(item.name);
      const canSwap = !owned && state.inventory.ownedEquipment.includes(item.id);
      return `<article><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></div><button type="button" data-buy="${item.id}" ${owned || (!canSwap && state.money < price) ? "disabled" : ""}>${owned ? item.type === "service" ? "耐久完好" : "已装备" : canSwap ? "免费换装" : `${price} 钱币`}</button></article>`;
    }).join("");
    $("shopList").querySelectorAll("[data-buy]").forEach(button => button.addEventListener("click", () => buyItem(button.dataset.buy)));
  }

  function buyItem(id) {
    const item = equipmentCatalog.find(entry => entry.id === id);
    if (!item) return;
    const canSwap = state.inventory.ownedEquipment.includes(item.id);
    if (item.rewardOnly && !canSwap) return;
    const price = canSwap ? 0 : shopPrice(item);
    if (state.money < price) return;
    if (item.type === "service" && state.equipment.durability >= 100) return;
    if (["weapon", "focus", "armor"].includes(item.type) && state.equipment[item.type] === item.name) return;
    state.money -= price;
    if (item.item) state.inventory[item.item] = (state.inventory[item.item] || 0) + 1;
    else if (item.type === "service") state.equipment.durability = 100;
    else { state.equipment[item.type] = item.name; state.equipment.bonuses[item.type] = item.bonus || 0; if (!canSwap) state.inventory.ownedEquipment.push(item.id); }
    autoSave(); renderShop(); render(); showToast(`已购买：${item.name}`);
  }

  function isMainEvent(event) {
    return mainEventIds.has(event.id);
  }

  function mainEventReady(event) {
    return !isMainEvent(event) || state.story.sideSinceMain >= (mainSideRequirements[event.id] || 5);
  }

  function mainQuestInfo() {
    const side = state.story.sideSinceMain;
    if (state.seen.includes("teleport_labyrinth_entry")) return { index: "IF", name: "迷宫之后，自由人生", text: "已完成本作八个主线交汇节点。继续探索、修炼与人物相处；本作没有收录后期小说结局。", current: 1, need: 1, requirement: "主线交汇完成 · 可继续游玩或重开不同路线" };
    if (state.seen.includes("begaritt_request")) return { index: "08", name: "贝卡利特远征", text: "在地图前往拉庞城，学识达到35后解锁转移迷宫。可以继续准备，也可以选择不去。", current: Math.min(side, 6), need: 6, requirement: `远征准备 ${Math.min(side, 6)}/6 · 学识 ${state.stats.wisdom}/35 · 目标：转移迷宫` };
    if (state.seen.includes("academy_reunion")) return { index: "07", name: "学院生活与远方来信", text: "留在拉诺亚继续学习、研究与相处。远征来信需要至少20个总回合，不会在重逢后立刻到来。", current: Math.min(side, 8), need: 8, requirement: `学院日常 ${Math.min(side, 8)}/8 · 总回合 ${state.turn}/20 · 目标：拉诺亚` };
    if (!state.seen.includes("transfer_calamity") && ["childhood", "transfer"].includes(state.profile.timeline)) {
      const ageReady = state.ageMonths >= 120;
      return { index: "01", name: "在菲托亚成长", text: "学习魔术、剑术并经营身边的关系。天空的异变不会在你准备好之前成为唯一内容。", current: Math.min(side, 8), need: 8, requirement: `${ageReady ? "年龄条件已满足" : `成长至10岁（当前${formatAge()}）`} · 日常/人物事件 ${Math.min(side, 8)}/8` };
    }
    if (state.seen.includes("transfer_calamity") && !state.seen.includes("dead_end_crossing")) return { index: "02", name: "魔大陆生存篇", text: "学习语言、认识当地居民并准备可靠的归乡路线，而不是立刻跳过整片大陆。", current: Math.min(side, 5), need: 5, requirement: `完成魔大陆支线与互动 ${Math.min(side, 5)}/5` };
    if (state.seen.includes("dead_end_crossing") && !state.seen.includes("paul_reunion")) return { index: "03", name: "跨越米里斯大陆", text: "与同行者磨合、度过大森林雨季，并追查菲托亚失踪者消息。", current: Math.min(side, 5), need: 5, requirement: `旅途与羁绊事件 ${Math.min(side, 5)}/5` };
    if (state.seen.includes("paul_reunion") && !state.seen.includes("orsted_crossing")) return { index: "04", name: "中央大陆归途", text: "重逢没有立刻解决伤痛。继续寻找家人，并准备面对归途上的强敌。", current: Math.min(side, 6), need: 6, requirement: `修整、调查与同行事件 ${Math.min(side, 6)}/6` };
    if (state.seen.includes("orsted_crossing") && !state.seen.includes("fittoa_homecoming")) return { index: "05", name: "回到菲托亚", text: "确认故乡与家人的命运，为长久旅程写下阶段结尾。", current: Math.min(side, 5), need: 5, requirement: `归乡准备 ${Math.min(side, 5)}/5` };
    if (["academy", "youth"].includes(state.profile.timeline) || state.location === "拉诺亚魔法都市" || state.seen.includes("fittoa_homecoming")) {
      return { index: "06", name: "北方与魔法大学篇", text: "以冒险者身份生活、研究转移事件，并重新认识那些改变了身份的故人。", current: Math.min(side, 8), need: 8, requirement: `学习、委托与人物事件 ${Math.min(side, 8)}/8` };
    }
    return { index: "IF", name: "自由人生线", text: "你的道路没有被原著时间线完全规定。提升实力、建立羁绊并探索已解锁地区。", current: Math.min(side, 8), need: 8, requirement: `自由行动与支线 ${Math.min(side, 8)}/8` };
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
    if (id === "travel_arrival") return { id, kicker: "地图旅行", title: "踏上新的道路", text: "旅途正在继续。", choices: [] };
    if (id === "free_action") return { id, kicker: "自由行动", title: "自己的选择", text: "你选择了既定选项之外的道路。", choices: [] };
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
    if (state.turn >= 60 && state.story.mainCompleted >= 4 && !state.seen.includes("life_folio")) return finaleEvent();
    const eligible = events.filter(event => !state.seen.includes(event.id) && (!event.when || event.when(state)) && mainEventReady(event));
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

  function formatAge(months = state.ageMonths, days = state.ageDays || 0) {
    return formatSavedAge(months,days);
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
    let initial = 0;
    if (!(name in state.relations)) {
      const region = currentRegion();
      if (["阿斯拉", "米里斯"].includes(region) && ["魔族", "米格尔德族"].includes(state.profile.race) && (state.regionalReputation[region] || 0) < 20) initial = -2;
      if (region === "阿斯拉" && state.profile.identity === "贵族子弟") initial += 2;
    }
    state.relations[name] = clamp((state.relations[name] || initial) + delta, -20, 100);
  }

  function unlock(achievement) {
    if (achievement && !state.achievements.includes(achievement)) {
      state.achievements.push(achievement);
      showToast(`获得人生印记：${achievement}`);
    }
  }

  function checkMilestones() {
    if (tutorialGoals.every(goal => goal.done(state))) unlock("独立踏上旅程");
    if (state.progression.magicXp >= 100) unlock("上级魔术师");
    if (state.stats.sword >= 50) unlock("剑术求道者");
    if (state.stats.wisdom >= 50) unlock("博闻者");
    if (state.fame >= 25) unlock("小有名气");
    if (Object.values(state.relations).some(value => value >= 40)) unlock("不可替代的羁绊");
    if (state.freeActionCount >= 5) unlock("不走既定道路");
    if (state.freeActionCount >= 12) unlock("自由人生");
    const magicTier = tierForXp(state.progression.magicXp).name;
    const swordTier = tierForXp(bestSwordXp()).name;
    if (["圣级", "王级", "帝级", "神级"].includes(magicTier)) unlock(`${magicTier}魔术师`);
    if (["圣级", "王级", "帝级", "神级"].includes(swordTier)) unlock(`${swordTier}剑士`);
    refreshUnlockedLocations();
  }

  function resolveChoice(choice, index) {
    if (choice.requires && !choice.requires(state)) return;
    const event = currentEvent();
    applyEffects(choice.effects);
    if (choice.medicine) state.inventory.medicine += choice.medicine;
    if (choice.relation) updateRelation(choice.relation);
    if (choice.revealFitz) state.relations["希露菲"] = Math.max(state.relations["希露菲"] || 0, state.relations["菲兹"] || 0);
    if (choice.unlock) unlockLocation(choice.unlock);
    if (choice.move) {
      unlockLocation(choice.move, false);
      state.location = choice.move;
      if (!state.visitedLocations.includes(choice.move)) state.visitedLocations.push(choice.move);
    }
    if (choice.achievement) unlock(choice.achievement);
    const elapsedMonths = isMainEvent(event) ? Math.max(1, Math.ceil((choice.months || 3) * .65)) : Math.max(1, Math.ceil((choice.months || 3) * .42));
    state.ageMonths += elapsedMonths;
    state.turn += 1;
    applyLivingCost(elapsedMonths, 2); markTutorial("choice");
    const effects = choice.effects || {};
    addProgress({ xp: 6 + Math.max(0, effects.fame || 0), magic: Math.max(0, effects.mana || 0) * 2, sword: Math.max(0, effects.sword || 0) * 2, life: Math.max(0, (effects.wisdom || 0) + (effects.charm || 0)) });
    if (effects.mana > 0) state.skills.water_ball = clamp((state.skills.water_ball || 0) + Math.max(2, effects.mana));
    if (effects.sword > 0) state.skills.arm_drop = clamp((state.skills.arm_drop || 0) + Math.max(2, effects.sword));
    if (effects.fame > 0) addRegionalReputation(Math.max(1, Math.ceil(effects.fame / 3)));
    if (choice.achievement) state.survival.morale = clamp(state.survival.morale + 6);
    if (choice.unlockSkill) state.skills[choice.unlockSkill] = Math.max(state.skills[choice.unlockSkill] || 0, 10);
    if (isMainEvent(event)) { state.story.sideSinceMain = 0; state.story.mainCompleted += 1; }
    else state.story.sideSinceMain += 1;
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
    const next = state.resumeEventId ? getEventById(state.resumeEventId) : selectNextEvent();
    state.resumeEventId = null;
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
    refreshUnlockedLocations();
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
    $("medicineValue").textContent = state.inventory.medicine;
    $("fatigueValue").textContent = state.survival.fatigue;
    $("moraleValue").textContent = state.survival.morale;
    $("fameValue").textContent = state.fame;
    $("turnValue").textContent = state.turn;
    $("chapterLabel").textContent = `${state.chapter} · ${rank()}`;
    $("locationLabel").textContent = state.location;
    $("ageLabel").textContent = formatAge();
    $("mapLocation").textContent = state.location;
    $("destinyScore").textContent = destinyScore();
    $("goalCardTitle").textContent = goalCopy[p.goal][0];
    $("goalCardText").textContent = goalCopy[p.goal][1];
    $("equipmentSummary").textContent = `${state.equipment.weapon} · ${state.equipment.focus} · ${state.equipment.armor} · 耐久 ${state.equipment.durability}/100`;
    $("survivalWarning").textContent = state.survival.fatigue >= 75 ? "疲劳偏高：可免费休息或使用药品。" : "无需准备口粮，放心安排训练、互动和旅行。";
    renderProgression();
    renderMainQuest();
    renderMap();
    renderRelations();
    renderAchievements();
    renderHistory();
    renderStory();
    renderTutorial();
  }

  function renderStory() {
    const event = currentEvent();
    $("eventKicker").textContent = state.phase === "result" ? "选择的回响" : event.kicker;
    $("eventTitle").textContent = state.phase === "result" ? state.lastChoice : event.title;
    $("storyIcon").textContent = state.phase === "result" ? "◇" : "✦";
    $("eventText").innerHTML = state.phase === "result"
      ? `<p class="result">${escapeHtml(state.lastResult)}</p><p>时间向前流动。现在你是 ${escapeHtml(formatAge())}，身处${escapeHtml(state.location)}。</p>`
      : `<p>${escapeHtml(event.text)}</p><p class="world-feedback"><b>世界反馈：</b>${escapeHtml(environmentalFeedback())}</p>`;
    const list = $("choiceList");
    $("freeActionForm").classList.toggle("hidden", state.phase === "result");
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
    container.innerHTML = entries.map(([name, value]) => {
      const label = value >= 40 ? "深厚羁绊" : value >= 20 ? "彼此信任" : value >= 5 ? "初识" : value < 0 ? "戒备" : "一面之缘";
      return `<button type="button" class="relation-item" data-character="${escapeHtml(name)}"><span class="relation-avatar">${escapeHtml(name.slice(0, 1))}</span><span><strong>${escapeHtml(name)}</strong><small>${label} · 点击互动</small></span><span class="relation-heart">◆ ${value}</span></button>`;
    }).join("");
    container.querySelectorAll("[data-character]").forEach(button => button.addEventListener("click", () => openInteraction(button.dataset.character)));
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

  function renderProgression() {
    const level = playerLevel();
    const adventure = tierForXp(state.progression.xp, adventureTiers);
    const nextAdventure = nextTier(state.progression.xp, adventureTiers);
    const range = Math.max(1, nextAdventure.xp - adventure.xp);
    const progress = nextAdventure === adventure ? 100 : clamp((state.progression.xp - adventure.xp) / range * 100);
    $("playerLevel").textContent = `Lv.${level}`;
    $("adventureRank").textContent = adventure.name;
    $("xpBar").style.width = `${progress}%`;
    $("magicRank").textContent = tierForXp(state.progression.magicXp).name;
    $("swordRank").textContent = tierForXp(bestSwordXp()).name;
  }

  function renderMainQuest() {
    const quest = mainQuestInfo();
    $("mainChapterIndex").textContent = quest.index;
    $("mainQuestName").textContent = quest.name;
    $("mainQuestText").textContent = quest.text;
    $("mainQuestRequirement").textContent = quest.requirement;
    $("mainQuestBar").style.width = `${clamp(quest.current / quest.need * 100)}%`;
  }

  let currentSkillTab = "magic";

  function skillXp(skill, domain) {
    return domain === "magic" ? state.progression.magicXp : domain === "sword" ? (state.progression.swordStyles[skill.style] || 0) : state.progression.lifeXp;
  }

  function skillAvailable(skill, domain) {
    const route = skillRoute(skill);
    return skillXp(skill, domain) >= masteryTiers[skill.tier].xp && (!route || hasTalent(route) || (state.skills[skill.id] || 0) > 0);
  }

  function skillRoute(skill) {
    if (skill.id === "fire_ball") return "element_fire";
    if (skill.style && skill.tier >= (skill.style === "swordGod" ? 2 : 1)) return ({swordGod:"sword_god_path", waterGod:"water_god_path", northGod:"north_god_path"})[skill.style];
    return null;
  }

  function preservePendingEvent() {
    if (state.phase === "event") state.resumeEventId = state.currentEventId;
  }

  function openSkills(tab = "magic") {
    currentSkillTab = tab;
    renderSkills();
    if (!$("skillsModal").open) $("skillsModal").showModal();
  }

  function renderSkills() {
    const adventure = tierForXp(state.progression.xp, adventureTiers).name;
    $("skillOverview").innerHTML = [
      [playerLevel(), "人物等级"], [adventure, "冒险者等级"], [tierForXp(state.progression.magicXp).name, "最高魔术等级"], [tierForXp(bestSwordXp()).name, "最高剑术等级"]
    ].map(([value, label]) => `<div><strong>${value}</strong><small>${label}</small></div>`).join("");
    renderTalents();
    document.querySelectorAll("[data-skill-tab]").forEach(button => button.classList.toggle("active", button.dataset.skillTab === currentSkillTab));
    $("rankGuide").textContent = `领域经验门槛：${masteryTiers.map(t => `${t.name} ${t.xp}`).join(" → ")}。剑神流 ${state.progression.swordStyles.swordGod} / 水神流 ${state.progression.swordStyles.waterGod} / 北神流 ${state.progression.swordStyles.northGod}。这是游戏内简化评定，不等于获得原著唯一的神级称号。人物每30经验升1级（上限50）；冒险者：${adventureTiers.map(t => `${t.name} ${t.xp}`).join(" / ")}。`;
    $("skillList").innerHTML = skillCatalog[currentSkillTab].map(skill => {
      const required = masteryTiers[skill.tier];
      const canLearn = skillAvailable(skill, currentSkillTab);
      const proficiency = clamp(state.skills[skill.id] || 0);
      const known = proficiency > 0;
      const route = talentNodes.find(node => node.id === skillRoute(skill));
      return `<article class="skill-item${canLearn ? "" : " locked"}"><span class="skill-rank-icon">${escapeHtml(skill.mark)}</span><div><h3>${escapeHtml(skill.name)} · ${masteryTiers[skill.tier].name}</h3><p>${escapeHtml(skill.description)}</p><div class="skill-progress"><i style="width:${proficiency}%"></i></div><p>${known ? `熟练度 ${proficiency}/100` : canLearn ? "已达到领悟条件" : `需要${required.name}领域等级${route ? `和${route.name}路线` : ""}`} · 1钱币 / 疲劳+5</p></div><button type="button" data-train-skill="${skill.id}" data-domain="${currentSkillTab}" ${canLearn ? "" : "disabled"}>${known ? "修炼招式" : "尝试领悟"}</button></article>`;
    }).join("");
    $("skillList").querySelectorAll("[data-train-skill]").forEach(button => button.addEventListener("click", () => trainSkill(button.dataset.trainSkill, button.dataset.domain)));
  }

  function trainSkill(skillId, domain) {
    const skill = skillCatalog[domain].find(item => item.id === skillId);
    if (!skill || !skillAvailable(skill, domain)) return;
    if (state.money < 1) { showToast("修炼需要1钱币，可先工作或领取新手奖励"); return; }
    if (state.survival.fatigue >= 85) { showToast("疲劳达到85，请先休息再训练"); return; }
    preservePendingEvent();
    state.money -= 1;
    const old = state.skills[skillId] || 0;
    state.skills[skillId] = clamp(old + (old ? 12 : 10));
    if (domain === "magic") { addProgress({ xp: 5, magic: 10 + (hasTalent("mana_control") ? 3 : 0) + (equipmentBonus("focus") ? 1 : 0) }); state.stats.mana = clamp(state.stats.mana + 2); }
    else if (domain === "sword") { addProgress({ xp: 5, sword: 10 + (hasTalent("sword_foundation") ? 3 : 0) + (equipmentBonus("weapon") ? 1 : 0), style: skill.style || "swordGod" }); state.stats.sword = clamp(state.stats.sword + 2); state.stats.vitality = clamp(state.stats.vitality + 1); }
    else { addProgress({ xp: 5, life: 10 }); state.stats.wisdom = clamp(state.stats.wisdom + 2); }
    state.turn += 1;
    state.ageMonths += 1;
    state.story.sideSinceMain += 1;
    applyLivingCost(1, 5, "training"); markTutorial("train");
    state.currentEventId = "free_action";
    state.lastChoice = `${old ? "修炼" : "领悟"}${skill.name}`;
    state.lastResult = old ? `你把${skill.name}拆成更小的动作反复练习，熟练度提升到 ${state.skills[skillId]}/100。真正可靠的招式来自长期重复。` : `你第一次完成了${skill.name}的基本结构。它还不能在危险战斗中随意使用，需要继续提高熟练度。`;
    state.phase = "result";
    state.history.unshift({ age: formatAge(), location: state.location, title: "技能修炼", choice: state.lastChoice, result: state.lastResult });
    state.history = state.history.slice(0, 40);
    checkMilestones(); autoSave(); $("skillsModal").close(); render();
  }

  let selectedCharacter = null;

  const combatMoves = {
    water_ball: { cost: 6, damage: 11 }, healing: { cost: 9, heal: 18 },
    stone_cannon: { cost: 10, damage: 20 }, fire_ball: { cost: 11, damage: 22 }, sonic_boom: { cost: 12, damage: 14, guard: true },
    disturb_magic: { cost: 8, damage: 3, interrupt: true }, cumulonimbus: { cost: 25, damage: 36 },
    arm_drop: { cost: 5, damage: 12 }, water_guard: { cost: 5, damage: 3, guard: true }, north_feint: { cost: 5, damage: 5, guard: true }, flow: { cost: 8, damage: 8, guard: true },
    north_step: { cost: 6, damage: 7, guard: true }, silent_sword: { cost: 11, damage: 22 },
    light_reversal: { cost: 13, damage: 18, guard: true }, longsword_light: { cost: 18, damage: 30 }
  };

  function openPractice() {
    if (!state.combat) {
      if (state.survival.fatigue >= 85) { showToast("疲劳达到85，请先免费休息"); return; }
      applyLivingCost(1, 5, "training");
      state.combat = { hp: 70, enemy: 75 + Math.min(playerLevel(), 20), mana: 40, stamina: 35, round: 0, log: ["练习傀儡启动。先观察它的动作。"], used: [] };
      autoSave();
    }
    $("skillsModal").close(); renderCombat(); $("combatModal").showModal();
  }

  function renderCombat() {
    const c = state.combat;
    $("combatStatus").textContent = `第 ${c.round + 1} 回合 · 生命 ${c.hp}/70 · 魔力 ${c.mana}/40 · 体力 ${c.stamina}/35 · 傀儡 ${c.enemy}`;
    $("combatIntent").textContent = ["预兆：傀儡举起武器，准备普通攻击（10伤害）。", "预兆：傀儡构筑魔术，乱魔可打断（18伤害）。", "预兆：傀儡蓄力重击，格挡可减伤（24伤害）。"][c.round % 3];
    const buttons = Object.entries(combatMoves).filter(([id]) => state.skills[id] > 0).map(([id, move]) => {
      const skill = [...skillCatalog.magic, ...skillCatalog.sword].find(s => s.id === id);
      const resource = skill.style ? "stamina" : "mana";
      const actualCost = Math.max(1, move.cost - (resource === "mana" && hasTalent("silent_cast") ? 2 : 0));
      return `<button type="button" data-combat="${id}" ${c[resource] < actualCost ? "disabled" : ""}><b>${skill.name}</b><small>${actualCost}${resource === "mana" ? "魔力" : "体力"} · ${move.heal ? "治疗" : move.interrupt ? "打断魔术" : move.guard ? "攻防兼备" : "攻击"}</small></button>`;
    });
    buttons.push(`<button type="button" data-combat="guard"><b>格挡调息</b><small>减伤${hasTalent("battle_reading") ? 85 : 75}% · 恢复10体力</small></button>`, '<button type="button" data-combat="rest"><b>集中恢复</b><small>恢复15魔力 · 承受攻击</small></button>', '<button type="button" data-combat="retreat"><b>结束练习</b><small>不获得结算奖励</small></button>');
    $("combatActions").innerHTML = buttons.join("");
    $("combatActions").querySelectorAll("[data-combat]").forEach(button => button.addEventListener("click", () => combatTurn(button.dataset.combat)));
    $("combatLog").innerHTML = c.log.slice(-6).map(line => `<li>${escapeHtml(line)}</li>`).join("");
  }

  function combatTurn(id) {
    const c = state.combat;
    if (!c) return;
    if (id === "retreat") { state.combat = null; autoSave(); $("combatModal").close(); showToast("已结束练习，没有结算奖励"); return; }
    let guarded = id === "guard", interrupted = false, damage = 0;
    if (id === "guard") c.stamina = Math.min(35, c.stamina + 10);
    else if (id === "rest") c.mana = Math.min(40, c.mana + 15);
    else {
      const move = combatMoves[id];
      if (!move || !state.skills[id]) return;
      const isSword = skillCatalog.sword.some(s => s.id === id);
      const resource = isSword ? "stamina" : "mana";
      const actualCost = Math.max(1, move.cost - (!isSword && hasTalent("silent_cast") ? 2 : 0));
      if (c[resource] < actualCost) return;
      c[resource] -= actualCost;
      damage = move.damage ? move.damage + Math.floor(clamp(state.skills[id]) / 20) + equipmentBonus(isSword ? "weapon" : "focus") + (isSword && hasTalent("finishing_strike") ? 5 : 0) : 0;
      const swordSkill = skillCatalog.sword.find(skill => skill.id === id);
      if (swordSkill && hasTalent(({swordGod:"sword_god_path",waterGod:"water_god_path",northGod:"north_god_path"})[swordSkill.style])) damage += 3;
      c.enemy = Math.max(0, c.enemy - damage);
      c.hp = Math.min(70, c.hp + (move.heal || 0));
      guarded = move.guard; interrupted = move.interrupt && c.round % 3 === 1;
      if (!c.used.includes(id)) c.used.push(id);
    }
    const guardedRatio = hasTalent("battle_reading") ? .15 : .25;
    const incoming = c.enemy === 0 || interrupted ? 0 : Math.ceil([10, 18, 24][c.round % 3] * (guarded ? guardedRatio : 1));
    c.hp = Math.max(0, c.hp - incoming);
    c.round += 1;
    c.log.push(`回合${c.round}：${id === "guard" ? "格挡调息" : id === "rest" ? "集中恢复" : [...skillCatalog.magic, ...skillCatalog.sword].find(s => s.id === id).name}，造成${damage}伤害，受到${incoming}伤害${interrupted ? "（成功打断）" : ""}。`);
    c.log = c.log.slice(-6);
    if (c.hp === 0 || c.enemy === 0 || c.round >= 30) {
      const won = c.enemy === 0;
      if (won) state.quests.counters.victory++;
      preservePendingEvent();
      for (const skill of c.used) state.skills[skill] = clamp(state.skills[skill] + (won ? 6 : 2));
      addProgress({ xp: won ? 12 : 4 });
      state.turn++; state.ageMonths++; state.story.sideSinceMain++;
      markTutorial("train");
      state.lastChoice = won ? "对练胜利" : "对练复盘";
      state.lastResult = `${won ? "你成功击倒了练习傀儡。" : "教官停止练习，与你复盘资源和出手时机。"}用过的招式熟练度 +${won ? 6 : 2}，人物经验 +${won ? 12 : 4}。一轮训练周期为一个月；原来的剧情仍在等待你。`;
      state.history.unshift({ age: formatAge(), location: state.location, title: "技能对练", choice: state.lastChoice, result: state.lastResult });
      state.history = state.history.slice(0, 40);
      state.currentEventId = "free_action"; state.phase = "result"; state.combat = null;
      checkMilestones(); autoSave(); $("combatModal").close(); render();
    } else { autoSave(); renderCombat(); }
  }

  function openInteraction(name) {
    selectedCharacter = name;
    const profile = characterProfiles[name] || { specialty: "life", description: "你们已经相遇，但仍需要通过相处了解彼此。" };
    const relation = state.relations[name] || 0;
    const stage = relation >= 60 ? "生死之交" : relation >= 40 ? "深厚羁绊" : relation >= 20 ? "彼此信任" : relation >= 5 ? "初识" : relation < 0 ? "戒备" : "一面之缘";
    $("interactionTitle").textContent = `与${name}互动`;
    $("interactionAvatar").textContent = name.slice(0, 1);
    $("interactionName").textContent = name;
    $("interactionRelation").textContent = `${stage} · ${relation}`;
    $("interactionDescription").textContent = profile.description;
    $("interactionActions").innerHTML = [
      ["talk", "深入交谈", "羁绊 +3 · 魅力 +1 · 一个月"], ["train", "共同训练", `${profile.specialty === "magic" ? "魔术" : profile.specialty === "sword" ? "剑术" : "学识"}成长 · 一个月`], ["travel", "一段共同生活", "羁绊 +5 · 两个月"]
    ].map(([id, label, hint]) => `<button type="button" data-interaction="${id}"><b>${label}</b><small>${hint}</small></button>`).join("");
    $("interactionActions").querySelectorAll("[data-interaction]").forEach(button => button.addEventListener("click", () => performInteraction(name, button.dataset.interaction)));
    $("interactionModal").showModal();
  }

  function performInteraction(name, action) {
    if (!(name in state.relations) || !["talk", "train", "travel"].includes(action)) return;
    preservePendingEvent();
    const profile = characterProfiles[name] || { specialty: "life" };
    let result = "";
    if (action === "talk") { updateRelation([name, 3]); state.stats.charm = clamp(state.stats.charm + 1); addProgress({ xp: 4, life: 3 }); result = `你没有只谈自己的目标，也认真听完了${name}的想法。某些分歧仍在，但理解比之前更多。`; }
    if (action === "train") {
      updateRelation([name, 2]);
      if (profile.specialty === "magic") { state.stats.mana = clamp(state.stats.mana + 2); addProgress({ xp: 5, magic: 9 }); state.skills.water_ball = clamp((state.skills.water_ball || 0) + 6); result = `${name}指出了你魔力控制中最浪费的一段。修正并不华丽，却让施法更稳定。`; }
      else if (profile.specialty === "sword") { state.stats.sword = clamp(state.stats.sword + 2); const style = name === "瑞杰路德" ? "northGod" : name === "保罗" ? "waterGod" : "swordGod"; addProgress({ xp: 5, sword: 9, style }); const skillId = style === "northGod" ? "north_feint" : style === "waterGod" ? "water_guard" : "arm_drop"; state.skills[skillId] = clamp((state.skills[skillId] || 0) + 6); result = `${name}没有让你盲目增加次数，而是纠正了站姿、距离和出手时机。`; }
      else { state.stats.wisdom = clamp(state.stats.wisdom + 2); addProgress({ xp: 5, life: 9 }); result = `你和${name}把问题拆成记录、假设和验证，得到了一项可复现的进展。`; }
    }
    if (action === "travel") { updateRelation([name, 5]); state.stats.vitality = clamp(state.stats.vitality + 1); addProgress({ xp: 6, life: 4 }); result = `你与${name}一起处理了补给、闲谈和一件不起眼的小麻烦。关系往往就在这些非主线时刻里变得真实。`; }
    const dialogue = characterDialogue[name];
    if (dialogue) result = dialogue[action];
    state.bondMemories = state.bondMemories || [];
    for (const threshold of [20, 40]) {
      const key = `${name}:${threshold}`;
      if ((state.relations[name] || 0) >= threshold && !state.bondMemories.includes(key)) {
        state.bondMemories.push(key);
        result += `\n【羁绊篇章·${threshold === 20 ? "信任" : "约定"}】${dialogue ? dialogue[threshold === 20 ? "trust" : "promise"] : `${name}愿意与你分享私人烦恼，并约好在需要帮助时坦率开口。`}`;
        addProgress({ xp: 10, life: 5 });
        unlock(`${name}·${threshold === 20 ? "相互理解" : "共同约定"}`);
      }
    }
    if (hasTalent("trusted_face")) updateRelation([name, 1]);
    state.turn += 1; state.ageMonths += action === "travel" ? 2 : 1; state.story.sideSinceMain += 1;
    applyLivingCost(action === "travel" ? 2 : 1, action === "train" ? 4 : 1); markTutorial("bond");
    if (action !== "train") state.survival.morale = clamp(state.survival.morale + 5);
    state.currentEventId = "free_action"; state.lastChoice = `${action === "talk" ? "交谈" : action === "train" ? "训练" : "同行"}：${name}`; state.lastResult = result; state.phase = "result";
    state.history.unshift({ age: formatAge(), location: state.location, title: "人物互动", choice: state.lastChoice, result }); state.history = state.history.slice(0, 40);
    checkMilestones(); autoSave(); $("interactionModal").close(); render();
  }

  const unlockRequirements = {
    "菲托亚难民营": "经历转移事件后解锁", "阿斯拉王都": "声望达到 18 且完成 10 回合", "拉诺亚魔法都市": "完成 7 回合或从魔法大学篇开局",
    "剑之圣地": "剑术达到 35", "利卡里斯城": "抵达魔大陆或经历转移事件", "风之港": "推进魔大陆归乡路线",
    "大森林": "抵达风之港或完成 8 回合", "米里斯": "抵达大森林或完成 10 回合", "拉庞城": "获得贝卡利特远征线索",
    "转移迷宫": "解锁拉庞城且学识达到 35", "中央大陆北部": "完成 5 回合",
    "冒险者公会": "年龄达到 12 岁或完成 2 回合"
  };
  let selectedMapLocation = null;

  function openMap() {
    refreshUnlockedLocations();
    renderFullMap();
    if (!$("mapModal").open) $("mapModal").showModal();
  }

  function renderFullMap() {
    const canvas = $("fullMapCanvas");
    canvas.innerHTML = "";
    Object.entries(worldLocations).forEach(([name, info]) => {
      const isUnlocked = state.unlockedLocations.includes(name);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `map-node${isUnlocked ? "" : " locked"}${state.location === name ? " current" : ""}`;
      button.style.left = `${info.x}%`;
      button.style.top = `${info.y}%`;
      button.dataset.location = name;
      button.setAttribute("aria-label", `${name}，${isUnlocked ? "已解锁" : "未解锁"}${state.location === name ? "，当前位置" : ""}`);
      button.innerHTML = `<i></i><span>${escapeHtml(name)}</span>`;
      button.addEventListener("click", () => selectMapLocation(name));
      canvas.appendChild(button);
    });
    selectMapLocation(selectedMapLocation && worldLocations[selectedMapLocation] ? selectedMapLocation : state.location);
  }

  function selectMapLocation(name) {
    selectedMapLocation = name;
    const info = worldLocations[name];
    const unlocked = state.unlockedLocations.includes(name);
    $("mapDetailTitle").textContent = `${unlocked ? "◆" : "◇"} ${name}`;
    $("mapDetailRegion").textContent = info.region;
    $("mapDetailText").textContent = unlocked ? info.text : `尚未解锁：${unlockRequirements[name] || "继续探索世界并推进人生"}。`;
    $("mapDetailDanger").textContent = info.danger;
    $("mapDetailTime").textContent = `${info.months} 个月 · ${info.cost} 钱币`;
    const button = $("travelButton");
    const current = state.location === name;
    const affordable = state.money >= info.cost;
    button.disabled = !unlocked || current || !affordable;
    button.textContent = current ? "当前位置" : !unlocked ? "地点未解锁" : state.money < info.cost ? `钱币不足（需要 ${info.cost}）` : `前往 ${name}`;
    document.querySelectorAll(".map-node").forEach(node => node.classList.toggle("selected", node.dataset.location === name));
  }

  function travelTo(name) {
    const info = worldLocations[name];
    if (!info || !state.unlockedLocations.includes(name) || state.location === name || state.money < info.cost) return;
    const from = state.location;
    state.resumeEventId = null;
    state.money -= info.cost;
    state.ageMonths += info.months;
    state.turn += 1;
    state.story.sideSinceMain += 1;
    applyLivingCost(info.months, 4, "travel"); markTutorial("travel");
    addProgress({ xp: 4, life: 2 });
    state.location = name;
    if (!state.visitedLocations.includes(name)) state.visitedLocations.push(name);
    state.currentEventId = "travel_arrival";
    state.lastChoice = `从${from}前往${name}`;
    state.lastResult = `你整理行装，从${from}出发。旅途耗时${info.months}个月、花费${info.cost}钱币。\n【地点遭遇】${resolveTravelEncounter(name)}`;
    state.phase = "result";
    state.chapter = chapterForAge();
    state.history.unshift({ age: formatAge(), location: name, title: "地图旅行", choice: state.lastChoice, result: state.lastResult });
    state.history = state.history.slice(0, 40);
    checkMilestones();
    autoSave();
    $("mapModal").close();
    render();
    showToast(`已抵达：${name}`);
  }

  function runFreeAction(action) {
    const text = action.trim();
    if (!text) { $("freeActionHint").textContent = "请先写下想做的事情。"; return; }
    // Each input resolves one primary intent; recovery cannot be combined with free training.
    if (/(休息|睡觉|放松|静养)/.test(text)) return dailyAction("rest");
    if (/(工作|赚钱|经商|售卖|打工)/.test(text)) return dailyAction("work");
    if (/(采集|找食物|寻找食物|觅食)/.test(text)) return dailyAction("forage");
    if (/(使用|服用).*(药|绷带)|疗伤药/.test(text)) {
      if (!state.inventory.medicine) { $("freeActionHint").textContent = "没有药品，可在商店购买药草与绷带。"; return; }
      preservePendingEvent(); state.inventory.medicine -= 1; state.survival.fatigue = clamp(state.survival.fatigue - 25); state.stats.vitality = clamp(state.stats.vitality + 8); state.survival.morale = clamp(state.survival.morale + 4);
      state.turn++; state.ageMonths++; state.story.sideSinceMain++; state.currentEventId = "free_action"; state.lastChoice = text; state.lastResult = "你清理伤口、重新包扎并真正休息下来。疲劳降低25，体魄恢复8；药品已消耗。"; state.phase = "result";
      state.history.unshift({ age: formatAge(), location: state.location, title: "使用物品", choice: text, result: state.lastResult }); state.history = state.history.slice(0,40); state.chapter = chapterForAge(); checkMilestones(); autoSave(); render(); return;
    }
    const namedDestination = Object.keys(worldLocations).find(name => text.includes(name));
    if (namedDestination && /(去|前往|旅行|出发|赶往|回到)/.test(text)) {
      if (state.unlockedLocations.includes(namedDestination)) {
        travelTo(namedDestination);
        $("freeActionInput").value = "";
      } else {
        $("freeActionHint").textContent = `${namedDestination}尚未解锁，可打开完整地图查看条件。`;
        showToast("目的地尚未解锁");
      }
      return;
    }

    const effects = {};
    const outcomes = [];
    let months = 3;
    let actionSwordStyle = "swordGod";
    const training = /(练|魔法|魔术|咏唱|挥砍|跑步|体能|格挡|反击|佯攻)/.test(text);
    if (training && (state.money < 1 || state.survival.fatigue >= 85)) { $("freeActionHint").textContent = "训练需要1钱币且疲劳低于85；可先工作或免费休息。"; return; }
    if (training) { state.money--; markTutorial("train"); }
    const add = (key, value) => { effects[key] = (effects[key] || 0) + value; };
    if (/(火魔法|火魔术|火球|火焰)/.test(text)) {
      if (hasTalent("element_fire")) { add("mana", 5); add("wisdom", 2); state.skills.fire_ball = clamp((state.skills.fire_ball || 0) + 8); outcomes.push("你控制火球的温度、落点与熄灭方式，没有把火系练习当成单纯增大威力"); }
      else { add("wisdom", 3); outcomes.push("你理解了火系术式轮廓，但缺少“火系研究”路线，无法稳定构筑火球"); }
      months += 1;
    } else if (/(水魔法|水魔术|水球|水流)/.test(text)) { add("mana", 4); add("wisdom", 1); state.skills.water_ball = clamp((state.skills.water_ball || 0) + 6); outcomes.push("你分别练习水量、速度与形状，水球控制更加准确"); months += 1; }
    else if (/(治愈|治疗魔术|回复魔法)/.test(text)) { add("mana", 3); add("wisdom", 2); state.skills.healing = clamp((state.skills.healing || 0) + 6); outcomes.push("你先判断伤势再构筑治愈术，避免用魔力掩盖真正的病因"); months += 1; }
    else if (/(岩炮|土魔法|土魔术)/.test(text)) { add("mana", 3); add("wisdom", 2); if (state.skills.stone_cannon > 0) state.skills.stone_cannon = clamp(state.skills.stone_cannon + 4); outcomes.push("你研究岩石密度与旋转；尚未领悟岩炮弹时这里只积累理论经验"); months += 1; }
    else if (/(风魔法|风魔术|风压)/.test(text)) { add("mana", 3); add("wisdom", 2); outcomes.push("你用轻微风压移动标记物，逐步理解距离与方向"); months += 1; }
    else if (/(魔术|魔法|咏唱|术式|魔力)/.test(text)) { add("mana", 3); add("wisdom", 1); outcomes.push("指令没有指定元素，你进行通用魔力控制练习；写明火、水、土或治愈会得到更具体反馈"); months += 1; }
    if (/(水神流|格挡|反击)/.test(text)) { actionSwordStyle = "waterGod"; add("sword", 3); add("vitality", 2); outcomes.push("你练习守住中线并在接触瞬间偏转攻击，水神流经验增加"); months += 1; }
    else if (/(北神流|佯攻|应变|假动作)/.test(text)) { actionSwordStyle = "northGod"; add("sword", 3); add("wisdom", 2); outcomes.push("你借障碍和假动作改变距离，北神流经验增加"); months += 1; }
    else if (/(剑神流|拔剑|先制|挥砍|练剑|剑术)/.test(text)) { add("sword", 3); add("vitality", 3); outcomes.push("你专注起手、距离与先制，剑神流经验增加"); months += 1; }
    else if (/(战斗|锻炼|跑步|体能)/.test(text)) { add("vitality", 4); outcomes.push("你完成了体能与移动训练，没有把所有锻炼都混成剑术经验"); months += 1; }
    if (/(调查|研究|阅读|学习|图书|打听|记录)/.test(text)) { add("wisdom", 5); outcomes.push("你核对多方信息，没有把第一条传闻当成答案"); }
    if (/(交谈|拜访|帮助|说服|结识|道歉|陪伴)/.test(text)) { add("charm", 4); updateRelation(["当地居民", 3]); outcomes.push("对方记住了你的态度，关系也有了继续发展的可能"); }
    if (/(工作|赚钱|委托|经商|售卖|制作|打工)/.test(text)) { add("money", 8 + (hasTalent("caravan_network") ? 3 : 0)); add("charm", 1); addRegionalReputation(1); outcomes.push("你付出时间完成工作，得到可靠收入，也让当地人开始记住你的做事方式"); months += 1; }
    const resting = /(休息|睡觉|疗伤|放松|静养)/.test(text);
    if (resting) { add("vitality", 6); state.survival.fatigue = clamp(state.survival.fatigue - 22); state.survival.morale = clamp(state.survival.morale + 6); outcomes.push("你允许身体真正恢复，而不是带着疲惫继续逞强"); months = 2; }
    if (/(探索|寻找|巡逻|冒险|追踪)/.test(text)) { add(pick(["vitality", "wisdom", "charm"]), 4); add("fame", 1); outcomes.push(`你在${state.location}发现了平时容易忽略的道路与消息`); }
    const knownName = ["洛琪希", "希露菲", "艾莉丝", "瑞杰路德", "七星", "菲兹", "扎诺巴", "保罗"].find(name => text.includes(name));
    if (knownName && knownName in state.relations) { updateRelation([knownName, 4]); add("charm", 2); outcomes.push(`你与${knownName}的这次互动被彼此记住`); }
    else if (knownName) outcomes.push(`你打听了${knownName}的消息，但尚未相遇，无法直接增加羁绊`);
    if (!outcomes.length) { add("wisdom", 2); add("charm", 2); outcomes.push("事情没有按照预设选项发展，但你认真尝试，并从结果中得到新的认识"); }

    preservePendingEvent();
    months = Math.max(1, Math.ceil(months / 3));
    applyEffects(effects);
    state.freeActionCount += 1;
    state.turn += 1;
    state.story.sideSinceMain += 1;
    applyLivingCost(months, resting ? 0 : training ? 5 : 2, resting ? "rest" : training ? "training" : "normal");
    addProgress({ xp: 5 + Math.max(0, effects.fame || 0), magic: Math.max(0, effects.mana || 0) * 2, sword: Math.max(0, effects.sword || 0) * 2, style: actionSwordStyle, life: Math.max(0, (effects.wisdom || 0) + (effects.charm || 0)) });
    state.ageMonths += Math.min(months, 7);
    state.currentEventId = "free_action";
    state.lastChoice = text;
    state.lastResult = `${outcomes.join("；")}。这次自由行动由你的描述触发，世界为它推进了${Math.min(months, 7)}个月。`;
    state.phase = "result";
    state.chapter = chapterForAge();
    state.history.unshift({ age: formatAge(), location: state.location, title: "自由行动", choice: text, result: state.lastResult });
    state.history = state.history.slice(0, 40);
    checkMilestones();
    autoSave();
    $("freeActionInput").value = "";
    render();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function dailyAction(action) {
    if (!state || !["work", "rest", "forage"].includes(action)) return;
    preservePendingEvent();
    let title, result;
    if (action === "work") {
      const income = 8 + (hasTalent("caravan_network") ? 3 : 0) - (state.survival.fatigue >= 75 ? 3 : 0);
      state.money += income;
      markTutorial("work");
      applyLivingCost(1, 7);
      addProgress({xp:4,life:2}); addRegionalReputation(1);
      title = "完成日常工作"; result = `你完成适合自己年龄的帮工，得到${income}钱币。工作疲劳+7；没有预付费用，身无分文也可接取。`;
    } else if (action === "forage") {
      const income = hasTalent("field_lore") ? 5 : 3;
      state.money += income; state.inventory.medicine++; markTutorial("forage");
      applyLivingCost(1, 5); addProgress({xp:3,life:3});
      title = "采集药草"; result = `你学习辨认药草，并在药师协助下处理成可用的药品。获得1份药品及${income}钱币，疲劳+5。可在自由行动输入“使用药品”。`;
    } else {
      const recovered = Math.min(state.survival.fatigue, REST_FATIGUE_RECOVERY);
      state.survival.fatigue = clamp(state.survival.fatigue - REST_FATIGUE_RECOVERY); state.survival.morale = clamp(state.survival.morale + 8); state.stats.vitality = clamp(state.stats.vitality + 5);
      title = "安心休息一天"; result = `你睡了一个好觉，第二天精神明显恢复。疲劳降低${recovered}（每天最多恢复${REST_FATIGUE_RECOVERY}）、士气+8、体魄+5。只经过1天，免费；不获得经验，也不增加主线准备进度。`;
    }
    state.turn++; state.freeActionCount++;
    if (action === "rest") {
      // Game calendar: 30 days per month. Recovery never adds a main-story step.
      state.ageDays = (state.ageDays || 0) + 1;
      state.ageMonths += Math.floor(state.ageDays / 30); state.ageDays %= 30;
    } else { state.ageMonths++; state.story.sideSinceMain++; }
    state.currentEventId = "free_action"; state.lastChoice = title; state.lastResult = result; state.phase = "result"; state.chapter = chapterForAge();
    state.history.unshift({age:formatAge(), location:state.location, title:"生计与休整", choice:title, result}); state.history = state.history.slice(0,40);
    checkMilestones(); autoSave(); render();
  }

  function navigateGame(target) {
    if (!state) return;
    if (target === "skills") return openSkills();
    if (target === "map") return openMap();
    if (target === "save") { renderSlots(); $("saveModal").showModal(); return; }
    if (target === "character") {
      document.querySelector(".character-panel").classList.remove("mobile-collapsed");
      $("mobilePanelToggle").setAttribute("aria-expanded", "true"); $("mobilePanelToggle").textContent = "收起角色详情 ⌃";
      document.querySelector(".character-panel").scrollIntoView({block:"start"});
    } else $(target === "choices" ? "choiceList" : "storyCard").scrollIntoView({block:"start"});
  }

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  const RECOVERY_KEY = "six-faced-life.before-import.v1";
  let pendingImport = null, pendingUpload = null, accountBusy = false;

  function validateSave(input) {
    const fail = () => { throw new Error("存档格式无效或版本不受支持，当前人生未改变。"); };
    const scan = (value, depth = 0) => {
      if (depth > 12) fail();
      if (typeof value === "number" && (!Number.isFinite(value) || Math.abs(value) > 1e9)) fail();
      if (typeof value === "string" && value.length > 10000) fail();
      if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) {
        if (["__proto__", "constructor", "prototype"].includes(key)) fail();
        scan(child, depth + 1);
      }
    };
    scan(input);
    if (!input || typeof input !== "object" || !input.profile || !input.stats || (input.version && (![1,2,3,4,5].includes(input.version)))) fail();
    const p = input.profile;
    if (typeof p.name !== "string" || !p.name.trim() || p.name.length > 40 || !Object.hasOwn(baseStats.identity,p.identity) || !Object.hasOwn(baseStats.race,p.race) || !Object.hasOwn(startAge,p.timeline) || !Object.hasOwn(worldLocations,p.location) || !Object.hasOwn(goalCopy,p.goal) || !Object.hasOwn(worldLocations,input.location)) fail();
    const shape = blankState(p);
    shape.profile = {name:"",identity:"",race:"",timeline:"",location:"",goal:""};
    const checkTypes = (value, sample) => {
      if (value === undefined) return;
      if (Array.isArray(sample)) { if (!Array.isArray(value)) fail(); return; }
      if (sample && typeof sample === "object") {
        if (!value || typeof value !== "object" || Array.isArray(value)) fail();
        for (const [key,child] of Object.entries(sample)) checkTypes(value[key],child);
      } else if (typeof value !== typeof sample) fail();
    };
    checkTypes(input,shape);
    const saved = migrateState(deepCopy(input));
    // Whitelist structural fields. Unknown data (including credentials) is never exported.
    const project = (value, sample) => {
      if (Array.isArray(sample)) { if (!Array.isArray(value)) fail(); return value; }
      if (sample && typeof sample === "object") {
        if (!value || typeof value !== "object" || Array.isArray(value)) fail();
        return Object.fromEntries(Object.entries(sample).map(([key, child]) => [key, project(value[key], child)]));
      }
      if (typeof value !== typeof sample) fail();
      return value;
    };
    const clean = project(saved,shape);
    const stringArray = (value, limit = 1000) => { if (!Array.isArray(value) || value.length > limit || value.some(item => typeof item !== "string")) fail(); return value; };
    for (const key of ["seen","achievements","talents","unlockedLocations","visitedLocations","bondMemories"]) clean[key] = stringArray(saved[key]);
    if ([...clean.unlockedLocations,...clean.visitedLocations].some(name => !Object.hasOwn(worldLocations,name))) fail();
    const numberMap = (value, min = 0, max = 1e9) => {
      if (!value || typeof value !== "object" || Array.isArray(value) || Object.values(value).some(n => typeof n !== "number" || !Number.isFinite(n) || n < min || n > max)) fail();
      return {...value};
    };
    clean.relations = numberMap(saved.relations,-100,100);
    clean.skills = numberMap(saved.skills,0,100);
    numberMap(clean.stats,0,100); numberMap(clean.survival,0,100); numberMap(clean.quests.counters);
    if (clean.money < 0 || clean.ageMonths < 0 || clean.turn < 0 || clean.inventory.medicine < 0 || clean.progression.xp < 0 || !["event","result"].includes(clean.phase)) fail();
    if (!Number.isInteger(clean.ageDays) || clean.ageDays < 0 || clean.ageDays >= 30) fail();
    clean.tutorial.actions = stringArray(saved.tutorial.actions);
    clean.tutorial.claimed = stringArray(saved.tutorial.claimed);
    clean.inventory.ownedEquipment = stringArray(saved.inventory.ownedEquipment);
    if (!Array.isArray(saved.history) || saved.history.length > 100) fail();
    clean.history = saved.history.map(item => project(item,{age:"",location:"",title:"",choice:"",result:""}));
    clean.quests.records = {};
    for (const quest of sideQuests) if (saved.quests.records[quest.id]) {
      const record = saved.quests.records[quest.id];
      if (!Number.isInteger(record.start) || record.start < 0 || record.start > clean.quests.counters[quest.counter] || (record.claimed !== undefined && typeof record.claimed !== "boolean")) fail();
      clean.quests.records[quest.id] = {start:record.start,claimed:!!record.claimed};
    }
    if (saved.resumeEventId) { if (typeof saved.resumeEventId !== "string") fail(); clean.resumeEventId = saved.resumeEventId; }
    const validEvent = id => ["opening","life_folio","travel_arrival","free_action"].includes(id) || events.some(event => event.id === id) || (/^routine-\d+$/.test(id) && Number(id.slice(8)) < routineTemplates.length);
    if (!validEvent(clean.currentEventId) || (clean.resumeEventId && !validEvent(clean.resumeEventId))) fail();
    if (saved.combat) {
      clean.combat = project(saved.combat,{hp:0,enemy:0,mana:0,stamina:0,round:0,log:[],used:[]});
      stringArray(clean.combat.log); stringArray(clean.combat.used);
    }
    return clean;
  }

  function saveEnvelope() {
    if (!state) throw new Error("请先开始或读取一轮人生。");
    return {format:"six-faced-life-save",version:1,exportedAt:new Date().toISOString(),state:validateSave(state)};
  }

  function previewImport(payload, source) {
    if (!payload || payload.format !== "six-faced-life-save" || payload.version !== 1) throw new Error("请选择本游戏导出的 JSON 存档，不是 TXT 传记。");
    pendingImport = validateSave(payload.state);
    $("importSummary").textContent = `${source}：${pendingImport.profile.name} · ${formatSavedAge(pendingImport.ageMonths,pendingImport.ageDays)} · ${pendingImport.location} · ${pendingImport.turn}回合`;
    $("importModal").showModal();
  }

  function confirmImport() {
    if (!pendingImport) return false;
    try {
      const next = validateSave(pendingImport);
      const previous = state || safeParse(localStorage.getItem(STORAGE_KEY));
      if (previous) localStorage.setItem(RECOVERY_KEY, JSON.stringify({format:"six-faced-life-save",version:1,state:validateSave(previous)}));
      localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
      state = next; pendingImport = null; refreshUnlockedLocations();
      ["importModal","saveModal","accountModal","startModal"].forEach(id => $(id).close());
      render(); autoSave(); showToast("已读取存档；原人生可从导入前备份恢复"); return true;
    } catch (error) { showToast(error.message || "读取失败，本机存档未替换"); return false; }
  }

  function exportSave() {
    try {
      const blob = new Blob([JSON.stringify(saveEnvelope(),null,2)],{type:"application/json"});
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = `六面世界-存档-${new Date().toISOString().slice(0,10)}.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url),1000); showToast("已生成可恢复的 JSON 存档");
    } catch (error) { showToast(error.message); }
  }

  function renderAccount(message) {
    const cloud = window.SixFacedCloud, user = cloud?.currentUser();
    $("accountStatus").textContent = message || (!cloud?.configured ? "尚未配置云服务：登录和云存档未启用。本机自动存档、手动存档和 JSON 备份可以正常使用。" : user ? `已登录：${user.email}。本机与云端不会自动互相覆盖。` : "云服务已配置，请登录。跨设备需先上传，再在另一设备登录并读取。");
    ["loginButton","signupButton","accountEmail","accountPassword"].forEach(id => $(id).disabled = !cloud?.configured || accountBusy || !!user);
    ["logoutButton","uploadCloudButton","downloadCloudButton"].forEach(id => $(id).disabled = !user || accountBusy || (id === "uploadCloudButton" && !state));
  }

  async function accountAction(action) {
    if (accountBusy) return;
    accountBusy = true; renderAccount("正在连接云服务……");
    try { const message = await action(); renderAccount(message); }
    catch (error) { renderAccount(error.message); }
    finally { accountBusy = false; const message = $("accountStatus").textContent; renderAccount(message); }
  }

  function login(signup = false) {
    if (!$("accountForm").reportValidity()) return;
    const email = $("accountEmail").value.trim(), password = $("accountPassword").value;
    $("accountPassword").value = "";
    return accountAction(async () => {
      const user = await window.SixFacedCloud.authenticate(email,password,signup);
      return user ? `已登录：${user.email}；当前本机人生未改变。` : "注册请求已受理。请查收验证邮件；若已有账号，请直接登录。";
    });
  }

  function autoSave() {
    if (!state) return;
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $("saveIndicator").innerHTML = "<i></i> 已自动存档";
      return true;
    } catch { $("saveIndicator").textContent = "保存失败，请导出备份"; showToast("浏览器无法写入存档，请立即导出 JSON 备份"); return false; }
  }

  function migrateState(saved) {
    if (!saved || !saved.profile || !saved.stats) return null;
    saved.phase = saved.phase || "event";
    saved.achievements = saved.achievements || [];
    saved.relations = saved.relations || {};
    saved.bondMemories = saved.bondMemories || [];
    saved.ageDays = saved.ageDays ?? 0;
    saved.history = saved.history || [];
    saved.seen = saved.seen || [];
    saved.currentEventId = saved.currentEventId || "opening";
    saved.unlockedLocations = saved.unlockedLocations || [saved.location, saved.profile.location].filter(Boolean);
    saved.visitedLocations = saved.visitedLocations || [saved.location].filter(Boolean);
    saved.freeActionCount = saved.freeActionCount || 0;
    saved.progression = saved.progression || { xp: Math.max(0, (saved.turn || 0) * 6), magicXp: (saved.stats.mana || 10) * 2, swordStyles: { swordGod: (saved.stats.sword || 8) * 2, waterGod: 0, northGod: 0 }, lifeXp: 0 };
    saved.progression.swordStyles = saved.progression.swordStyles || { swordGod: (saved.stats.sword || 8) * 2, waterGod: 0, northGod: 0 };
    saved.skills = saved.skills || { water_ball: 15, healing: 5, arm_drop: 10, human_language: 25 };
    saved.story = saved.story || { sideSinceMain: 0, mainCompleted: saved.seen.filter(id => mainEventIds.has(id)).length };
    const defaults = blankState(saved.profile);
    saved.survival = { ...defaults.survival, ...saved.survival };
    delete saved.survival.food;
    saved.equipment = { ...defaults.equipment, ...saved.equipment, bonuses: { ...defaults.equipment.bonuses, ...(saved.equipment || {}).bonuses } };
    saved.inventory = { ...defaults.inventory, ...saved.inventory };
    saved.inventory.ownedEquipment = [...new Set([...(Array.isArray(saved.inventory.ownedEquipment) ? saved.inventory.ownedEquipment : []), ...equipmentCatalog.filter(item => ["weapon", "focus", "armor"].includes(item.type) && saved.equipment[item.type] === item.name).map(item => item.id)])];
    saved.talents = Array.isArray(saved.talents) ? [...new Set(saved.talents)].filter(id => talentNodes.some(node => node.id === id)) : [];
    saved.regionalReputation = { ...defaults.regionalReputation, ...saved.regionalReputation };
    saved.tutorial = { actions: Array.isArray(saved.tutorial?.actions) ? saved.tutorial.actions : [], claimed: Array.isArray(saved.tutorial?.claimed) ? saved.tutorial.claimed.filter(id => id === "graduation" || tutorialGoals.some(goal => goal.id === id)) : [] };
    saved.quests = { counters: { ...defaults.quests.counters, ...saved.quests?.counters }, records: { ...saved.quests?.records } };
    saved.encounterCount = saved.encounterCount || 0;
    saved.version = 5;
    return saved;
  }

  function loadState(saved) {
    state = migrateState(saved);
    if (!state) return false;
    refreshUnlockedLocations();
    autoSave();
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
      const summary = item ? `${item.profile.name} · ${formatSavedAge(item.ageMonths,item.ageDays)} · ${item.location} · ${new Date(item.updatedAt).toLocaleString("zh-CN")}` : "空存档位";
      return `<div class="save-slot"><div><h3>命运书页 ${index + 1}</h3><p>${escapeHtml(summary)}</p></div><div class="slot-actions"><button data-save-slot="${index}">${item ? "覆盖" : "保存"}</button>${item ? `<button data-load-slot="${index}">读取</button><button class="delete-slot" data-delete-slot="${index}">删除</button>` : ""}</div></div>`;
    }).join("");
    document.querySelectorAll("[data-save-slot]").forEach(button => button.addEventListener("click", () => saveSlot(Number(button.dataset.saveSlot))));
    document.querySelectorAll("[data-load-slot]").forEach(button => button.addEventListener("click", () => loadSlot(Number(button.dataset.loadSlot))));
    document.querySelectorAll("[data-delete-slot]").forEach(button => button.addEventListener("click", () => deleteSlot(Number(button.dataset.deleteSlot))));
  }

  function formatSavedAge(months, days = 0) {
    const years = Math.floor(months / 12), rest = months % 12;
    return (rest ? `${years}岁${rest}个月` : `${years}岁`) + (days ? `${days}天` : "");
  }

  function saveSlot(index) {
    const items = slots();
    items[index] = deepCopy(state);
    if (!items[index].tutorial.actions.includes("save")) items[index].tutorial.actions.push("save");
    items[index].updatedAt = new Date().toISOString();
    try { writeSlots(items); } catch { showToast("存档位保存失败，请导出备份"); return; }
    markTutorial("save"); checkMilestones(); autoSave(); renderTutorial();
    renderSlots();
    showToast(`已保存到命运书页 ${index + 1}`);
  }

  function loadSlot(index) {
    const saved = slots()[index];
    if (!saved) return;
    state = migrateState(deepCopy(saved));
    refreshUnlockedLocations();
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
  $("exportSaveButton").addEventListener("click", exportSave);
  document.querySelectorAll("[data-import-save]").forEach(button => button.addEventListener("click", () => $("importSaveInput").click()));
  $("importSaveInput").addEventListener("change", async event => {
    const file = event.target.files[0]; event.target.value = ""; if (!file) return;
    try { if (file.size > 524288) throw new Error("存档超过512KB，请选择本游戏导出的文件。"); previewImport(JSON.parse(await file.text()),"文件存档"); }
    catch (error) { showToast(error instanceof SyntaxError ? "JSON 文件损坏，当前存档未变" : error.message); }
  });
  $("confirmImport").addEventListener("click", confirmImport);
  $("recoverSaveButton").addEventListener("click", () => {
    try { const backup = safeParse(localStorage.getItem(RECOVERY_KEY)); if (!backup) return showToast("还没有导入前备份"); previewImport(backup,"导入前备份"); } catch (error) { showToast(error.message); }
  });
  document.querySelectorAll("[data-open-account]").forEach(button => button.addEventListener("click", () => { renderAccount(); $("accountModal").showModal(); }));
  $("accountForm").addEventListener("submit", event => { event.preventDefault(); login(); });
  $("signupButton").addEventListener("click", () => login(true));
  $("logoutButton").addEventListener("click", () => accountAction(async () => { await window.SixFacedCloud.logout(); return "已退出登录；本机存档保留。"; }));
  $("downloadCloudButton").addEventListener("click", () => accountAction(async () => {
    const row = await window.SixFacedCloud.read(); if (!row) return "云端暂无存档，可先上传当前人生。";
    previewImport(row.payload,`云端版本 ${row.revision}`); return "云档已读取，请检查确认后替换本机。";
  }));
  $("uploadCloudButton").addEventListener("click", () => accountAction(async () => {
    const payload = saveEnvelope(), row = await window.SixFacedCloud.read();
    pendingUpload = {payload,revision:row?.revision || 0,userId:window.SixFacedCloud.currentUser().id};
    $("uploadSummary").textContent = `即将上传：${payload.state.profile.name} · ${formatSavedAge(payload.state.ageMonths,payload.state.ageDays)}。${row ? `替换云端版本${row.revision}（${new Date(row.updated_at).toLocaleString("zh-CN")}）` : "云端尚无存档，将新建一份"}。`;
    $("confirmUpload").disabled = false; $("uploadModal").showModal(); return "已检查云端，请确认上传。";
  }));
  $("confirmUpload").addEventListener("click", () => accountAction(async () => {
    const upload = pendingUpload; pendingUpload = null; $("confirmUpload").disabled = true;
    if (!upload || upload.userId !== window.SixFacedCloud.currentUser()?.id) throw new Error("登录状态已改变，请重新检查云端。");
    $("uploadModal").close(); await window.SixFacedCloud.write(upload.payload,upload.revision); return "云端上传成功。换设备登录后可读取这份人生。";
  }));
  $("accountModal").addEventListener("close", () => { $("accountPassword").value = ""; });
  $("importModal").addEventListener("close", () => { pendingImport = null; });
  $("uploadModal").addEventListener("close", () => { pendingUpload = null; });
  $("questsButton").addEventListener("click", () => { renderSideQuests(); $("sideQuestModal").showModal(); });
  $("shopButton").addEventListener("click", openShop);
  $("mobilePanelToggle").addEventListener("click", () => {
    const collapsed = document.querySelector(".character-panel").classList.toggle("mobile-collapsed");
    $("mobilePanelToggle").setAttribute("aria-expanded", String(!collapsed));
    $("mobilePanelToggle").textContent = collapsed ? "展开角色详情 ⌄" : "收起角色详情 ⌃";
  });
  document.querySelectorAll("[data-mobile-target]").forEach(button => button.addEventListener("click", () => navigateGame(button.dataset.mobileTarget)));
  document.querySelectorAll("[data-daily]").forEach(button => button.addEventListener("click", () => dailyAction(button.dataset.daily)));
  $("randomizeButton").addEventListener("click", randomizeForm);
  $("continueButton").addEventListener("click", () => loadState(safeParse(localStorage.getItem(STORAGE_KEY))));
  $("saveButton").addEventListener("click", () => { renderSlots(); $("saveModal").showModal(); });
  $("openSkillsButton").addEventListener("click", () => openSkills("magic"));
  $("practiceButton").addEventListener("click", openPractice);
  document.querySelectorAll("[data-skill-tab]").forEach(button => button.addEventListener("click", () => { currentSkillTab = button.dataset.skillTab; renderSkills(); }));
  $("mapTopButton").addEventListener("click", openMap);
  $("openMapButton").addEventListener("click", openMap);
  $("miniMapButton").addEventListener("click", openMap);
  $("travelButton").addEventListener("click", () => selectedMapLocation && travelTo(selectedMapLocation));
  $("freeActionForm").addEventListener("submit", event => { event.preventDefault(); runFreeAction($("freeActionInput").value); });
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
