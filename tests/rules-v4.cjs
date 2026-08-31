const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const elements = new Map(), storage = new Map();
const el = () => ({style:{},dataset:{},value:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},scrollIntoView(){},addEventListener(){},querySelector(){return el()},querySelectorAll(){return []},appendChild(){},focus(){},showModal(){this.open=true},close(){this.open=false}});
const context = {document:{getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},querySelector:el,querySelectorAll(){return []},createElement:el},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout(){},clearTimeout(){},Date,Math,console};
vm.createContext(context);
const expose = 'globalThis.game={blankState,migrateState,loadState,saveSlot,loadSlot,trainSkill,performInteraction,continueStory,resolveChoice,selectNextEvent,mainEventReady,openPractice,combatTurn,events,skillCatalog,mainSideRequirements,skillAvailable,getEventById,runFreeAction,travelTo,dailyAction,buyItem,shopPrice,learnTalent,talentPoints,travelFoodCost,addRegionalReputation,updateRelation,tutorialGoals,get state(){return state},set state(v){state=v}};';
vm.runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8').replace(/  openStart\(\);\r?\n\}\)\(\);/,expose+'\n})();'),context);
const g = context.game, profile = {name:'规则测试',identity:'转生者',race:'人族',timeline:'childhood',location:'布艾纳村',goal:'magic'};
const fresh = () => (g.state=g.blankState({...profile}));
const clone = x => JSON.parse(JSON.stringify(x));
const key = 'six-faced-life.autosave.v1';
let s;
for (const version of [1,2,3]) {
  const old=clone(fresh()); old.version=version;old.turn=17;old.relations={'洛琪希':24};old.seen=['transfer_calamity'];
  for (const field of ['survival','equipment','inventory','talents','regionalReputation','tutorial','encounterCount','progression','story']) delete old[field];
  g.loadState(old);s=g.state;
  assert.equal(s.version,4);assert.equal(s.relations['洛琪希'],24);assert.equal(s.turn,17);assert.equal(s.story.mainCompleted,1);assert.equal(s.survival.food,8);assert.equal(s.equipment.durability,100);assert.equal(JSON.parse(storage.get(key)).version,4);
}
s=fresh();s.survival.food=2;s.talents=['mana_control'];s.progression.xp=120;g.loadState(clone(s));assert.equal(g.state.survival.food,2);assert.equal(g.state.talents.length,1);
s=fresh();g.trainSkill('water_ball','magic');assert.equal(s.skills.water_ball,27);assert.equal(s.money,11);assert.equal(s.survival.food,7);assert.equal(s.equipment.durability,97);assert.equal(s.resumeEventId,'opening');g.continueStory();assert.equal(s.currentEventId,'opening');
s.money=0;const before=clone(s);g.trainSkill('water_ball','magic');assert.deepEqual(clone(s),before);
g.dailyAction('work');assert(s.money>=8);g.buyItem('rations');assert(s.survival.food>=9);
s.survival.fatigue=100;const oldSkill=s.skills.water_ball;g.trainSkill('water_ball','magic');assert.equal(s.skills.water_ball,oldSkill);g.dailyAction('rest');assert.equal(s.survival.fatigue,75);
// No bankruptcy soft-lock: recovery stays available even with all resources exhausted.
s.money=0;s.survival.food=0;s.stats.vitality=0;g.dailyAction('work');assert(s.money>0);g.dailyAction('forage');assert(s.survival.food>0);g.dailyAction('rest');assert(s.stats.vitality>0);
s=fresh();s.money=100;g.buyItem('iron_sword');assert.equal(s.equipment.bonuses.weapon,3);const balance=s.money;g.buyItem('iron_sword');assert.equal(s.money,balance);s.equipment.durability=0;g.buyItem('repair');assert.equal(s.equipment.durability,100);assert.equal(s.money,balance-4);
s.survival.food=30;const fullBalance=s.money;g.buyItem('rations');assert.equal(s.money,fullBalance);
g.buyItem('medicine');s.survival.fatigue=60;g.runFreeAction('使用药品');assert.equal(s.inventory.medicine,0);assert.equal(s.survival.fatigue,35);
s=fresh();s.money=100;g.buyItem('leather_armor');g.buyItem('travel_cloak');const swapBalance=s.money;g.buyItem('leather_armor');assert.equal(s.money,swapBalance);assert.equal(s.equipment.armor,'轻皮甲');
const priceBefore=g.shopPrice({cost:20});s.regionalReputation['阿斯拉']=30;assert(g.shopPrice({cost:20})<priceBefore);
s=fresh();s.progression.xp=180;g.learnTalent('silent_cast');assert.equal(s.talents.length,0);g.learnTalent('mana_control');g.learnTalent('element_fire');g.learnTalent('silent_cast');assert.equal(g.talentPoints(),0);assert.equal(s.skills.fire_ball,10);g.learnTalent('field_lore');assert.equal(s.talents.length,3);
s=fresh();s.progression.magicXp=100;g.trainSkill('fire_ball','magic');assert.equal(s.skills.fire_ball,undefined);g.runFreeAction('练习火魔法');assert.equal(s.skills.fire_ball,undefined);assert(s.lastResult.includes('火系研究'));
s=fresh();g.runFreeAction('练习水神流格挡');assert.equal(s.progression.swordStyles.waterGod,6);assert.equal(s.progression.swordStyles.swordGod,16);assert.equal(s.money,11);
s.progression.swordStyles.waterGod=100;g.trainSkill('flow','sword');assert.equal(s.skills.flow,undefined);s.progression.xp=120;g.learnTalent('sword_foundation');g.learnTalent('water_god_path');g.trainSkill('flow','sword');assert(s.skills.flow>0);
s=fresh();s.skills.flow=8;s.progression.swordStyles.waterGod=50;g.trainSkill('flow','sword');assert(s.skills.flow>8,'legacy learned technique retained');
s=fresh();const mana=s.stats.mana;g.runFreeAction('休息并练习火魔法');assert.equal(s.stats.mana,mana);assert.equal(s.money,12);assert.equal(s.survival.food,8);
assert(!g.tutorialGoals[0].done(s),'rest is not a story choice');g.resolveChoice(g.getEventById('opening').choices[0],0);assert(g.tutorialGoals[0].done(s));
s=fresh();s.skills.healing=10;s.equipment.bonuses.focus=3;g.openPractice();const enemy=s.combat.enemy;g.combatTurn('healing');assert.equal(s.combat.enemy,enemy,'healing must never deal equipment damage');
s=fresh();s.talents=['mana_control','element_fire','silent_cast'];s.skills.fire_ball=10;g.openPractice();s.combat.mana=9;g.combatTurn('fire_ball');assert.equal(s.combat.mana,0);assert.equal(s.combat.round,1);g.loadState(clone(s));assert.equal(g.state.combat.round,1);
s=fresh();g.openPractice();const food=s.survival.food;g.openPractice();assert.equal(s.survival.food,food,'resuming practice does not double-charge');s.combat.enemy=1;g.combatTurn('arm_drop');assert.equal(s.survival.food,7);assert.equal(s.combat,null);g.continueStory();assert.equal(s.currentEventId,'opening');
s=fresh();s.money=100;s.unlockedLocations.push('魔大陆');g.travelTo('魔大陆');assert.equal(s.location,'魔大陆');assert.equal(s.survival.food,5);assert.equal(s.encounterCount,1);assert(s.lastResult.includes('地点遭遇'));assert(s.regionalReputation['魔大陆']>0);
s.talents=['field_lore'];s.equipment.armor='防雨旅行斗篷';assert.equal(g.travelFoodCost(10),2);s.equipment.durability=0;assert.equal(g.travelFoodCost(10),3);
s=fresh();s.profile.race='魔族';g.updateRelation(['洛琪希',8]);assert.equal(s.relations['洛琪希'],6);s.location='魔大陆';g.addRegionalReputation(5);assert.equal(s.regionalReputation['阿斯拉'],0);assert.equal(s.regionalReputation['魔大陆'],5);
s=fresh();g.saveSlot(0);assert(g.tutorialGoals.find(x=>x.id==='save').done(s));g.dailyAction('work');g.loadSlot(0);assert.equal(g.state.money,12);assert.equal(g.state.version,4);
for(const [id,need] of Object.entries(g.mainSideRequirements)) {s=fresh();const e=g.events.find(e=>e.id===id);s.story.sideSinceMain=need-1;assert(!g.mainEventReady(e));s.story.sideSinceMain++;assert(g.mainEventReady(e));}
s=fresh();s.profile.timeline='transfer';s.turn=2;assert(g.events.find(e=>e.id==='pre_transfer_alarm').when(s));
// Long simulation covers clamping, main-event eligibility and the recovery loop.
s=fresh();for(let i=0;i<300;i++){
 if(s.survival.food<2)g.dailyAction('forage');else if(s.survival.fatigue>65)g.dailyAction('rest');else if(s.money<3)g.dailyAction('work');else if(i%3===0)g.trainSkill('water_ball','magic');else {g.continueStory();const event=g.getEventById(s.currentEventId);g.resolveChoice(event.choices.find(c=>!c.requires||c.requires(s)),0);}
 assert(s.money>=0);assert(s.survival.food>=0 && s.survival.food<=30);assert(s.survival.fatigue>=0 && s.survival.fatigue<=100);assert(Object.values(s.stats).every(n=>Number.isFinite(n)&&n>=0&&n<=100));
}
console.log('PASS v4: migration v1/v2/v3, durable economy, recovery, talent gates, legacy skills, parser, combat, travel, reputation, saves, story gates and 300-turn simulation');
