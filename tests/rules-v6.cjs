const filesystem = require('node:fs');
const virtualMachine = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const elements = new Map();
const storage = new Map();
let storageFailure = false;
const fakeElement = () => ({style:{},dataset:{},value:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},scrollIntoView(){},addEventListener(){},querySelector(){return fakeElement()},querySelectorAll(){return []},closest(){return fakeElement()},appendChild(){},focus(){},showModal(){this.open=true},close(){this.open=false}});
const context = {window:{},document:{getElementById(id){if(!elements.has(id))elements.set(id,fakeElement());return elements.get(id)},querySelector:fakeElement,querySelectorAll(){return []},createElement:fakeElement},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>{if(storageFailure)throw new Error('quota');storage.set(key,value)}},setTimeout(){},clearTimeout(){},Date,Math,console};
virtualMachine.createContext(context);
const root = path.join(__dirname,'..');
virtualMachine.runInContext(filesystem.readFileSync(path.join(root,'story-arcs.js'),'utf8'),context);
const source = filesystem.readFileSync(path.join(root,'game.js'),'utf8');
const expose = 'globalThis.game={blankState,loadState,migrateState,validateSave,saveEnvelope,previewImport,confirmImport,saveSlot,loadSlot,deleteSlot,confirmSlotChange,slots,storyArcs,startArc,openArc,resolveArc,claimArc,arcStatus,arcEnding,objectiveInfo,questAction,claimTutorial,dailyAction,trainSkill,travelTo,continueStory,useMedicine,buyItem,renderInventory,sideQuests,get state(){return state},set state(value){state=value}};';
virtualMachine.runInContext(source.replace(/  openStart\(\);\r?\n\}\)\(\);/,expose+'\n})();'),context);
const game = context.game;
const profile = {name:'委托测试',identity:'转生者',race:'人族',timeline:'childhood',location:'布艾纳村',goal:'magic'};
const clone = value => JSON.parse(JSON.stringify(value));
const fresh = () => (game.state=game.blankState({...profile}));
const autosaveKey = 'six-faced-life.autosave.v1';
const slotKey = 'six-faced-life.slots.v1';
const backupKey = 'six-faced-life.before-slot-change.v1';
const unlockBoard = () => {game.state.tutorial.actions=['choice'];game.claimTutorial('choice')};

assert.equal(game.storyArcs.length,3);
assert.equal(new Set(game.storyArcs.map(arc=>arc.id)).size,3);
for (const arc of game.storyArcs) {
  assert.equal(arc.stages.length,3);
  assert(arc.stages.every(stage=>stage.choices.length>=2));
  for (let route=0;route<8;route++) {
    fresh(); assert(!game.startArc(arc.id)); unlockBoard(); game.state.location=arc.locations[0];
    assert(game.startArc(arc.id)); assert(!game.startArc(arc.id)); assert.equal(game.objectiveInfo().title,arc.title);
    for (let step=0;step<3;step++) {
      const stage=arc.stages[step],record=game.state.journal.arcs[arc.id],choice=stage.choices[(route>>step)&1];
      if(stage.need){
        assert(!game.arcStatus(arc).ready);
        const before=clone(game.state);assert(!game.resolveArc(arc.id,step,choice.id));assert.deepEqual(clone(game.state),before);
        game.dailyAction('rest');assert(!game.arcStatus(arc).ready);
        for(let count=0;count<stage.need.count;count++){
          if(stage.need.counter==='work'||stage.need.counter==='forage') game.dailyAction(stage.need.counter);
          else if(stage.need.counter==='train') { game.state.money=100;game.state.survival.fatigue=0;game.trainSkill('water_ball','magic'); }
          else { game.state.money=100;game.state.unlockedLocations.push('罗亚城');game.travelTo('罗亚城'); }
        }
        assert(game.arcStatus(arc).ready);
      }
      game.openArc(arc.id);
      assert(game.resolveArc(arc.id,step,choice.id));
      assert.equal(record.step,step+1);
      assert(!game.resolveArc(arc.id,step,choice.id));
      assert(!game.resolveArc(arc.id,step+1,'invalid-choice'));
      assert.equal(game.saveEnvelope().state.journal.arcs[arc.id].choices[step],choice.id);
    }
    const expectedExperience=game.state.progression.xp,expectedMoney=game.state.money;
    assert(game.claimArc(arc.id));assert.equal(game.state.progression.xp,expectedExperience+arc.reward.xp);assert.equal(game.state.money,expectedMoney+(arc.reward.money||0));
    assert(!game.claimArc(arc.id));assert.equal(game.state.journal.tracked,'');
    assert(game.state.achievements.includes(game.arcEnding(arc,game.state.journal.arcs[arc.id])));
    assert(game.loadState(clone(game.state)));assert(!game.claimArc(arc.id));assert(!game.startArc(arc.id));game.validateSave(game.state);
  }
}
fresh();unlockBoard();assert(!game.startArc('academy_notes'));game.state.quests.counters.work=20;assert(game.startArc('village_letters'));assert(game.resolveArc('village_letters',0,'respect'));assert.equal(game.state.journal.arcs.village_letters.baseline,20);assert(!game.arcStatus(game.storyArcs[0]).ready);assert.equal(game.state.resumeEventId,'opening');
game.continueStory();assert.equal(game.state.currentEventId,'opening');
const partial=clone(game.saveEnvelope());game.previewImport(partial,'中途');assert(game.confirmImport());assert.equal(game.state.journal.arcs.village_letters.step,1);assert.equal(game.objectiveInfo().title,'没有寄出的家书');
for(const corrupt of [record=>record.step=9,record=>record.choices=['not-a-choice'],record=>record.claimed=true,record=>record.baseline=999]){const invalid=clone(partial.state);corrupt(invalid.journal.arcs.village_letters);assert.throws(()=>game.validateSave(invalid));}
for(const version of [1,2,3,4,5]){const legacy=clone(fresh());legacy.version=version;delete legacy.journal;assert(game.loadState(legacy));assert.equal(game.state.version,6);assert.deepEqual(clone(game.state.journal),{tracked:'',arcs:{}});}
fresh();const unmodified=clone(game.state);assert(!game.loadState({...unmodified,stats:{...unmodified.stats,mana:'broken'}}));assert.deepEqual(clone(game.state),unmodified);
fresh();game.state.survival.fatigue=100;const permanent=clone(game.state.stats);game.dailyAction('rest');game.dailyAction('rest');assert.equal(game.state.survival.fatigue,0);assert.equal(game.state.ageDays,2);assert.deepEqual(clone(game.state.stats),permanent);assert.equal(game.state.story.sideSinceMain,0);
game.state.inventory.medicine=2;assert(!game.useMedicine());assert.equal(game.state.inventory.medicine,2);game.state.survival.fatigue=10;const beforeMedicine=clone(game.state);assert(game.useMedicine());assert.equal(game.state.survival.fatigue,0);assert.equal(game.state.inventory.medicine,1);assert.equal(game.state.turn,beforeMedicine.turn);assert.equal(game.state.ageDays,beforeMedicine.ageDays);assert.equal(game.state.story.sideSinceMain,beforeMedicine.story.sideSinceMain);assert.deepEqual(clone(game.state.stats),permanent);
fresh();game.state.money=100;game.state.unlockedLocations.push('魔大陆');const beforeTravel=clone(game.state.stats);game.travelTo('魔大陆');assert.equal(game.state.stats.vitality,beforeTravel.vitality);assert(game.state.survival.fatigue>=4);
fresh();storage.delete(slotKey);assert(game.saveSlot(0));const originalSlot=storage.get(slotKey);game.dailyAction('work');assert(!game.saveSlot(0));assert.equal(storage.get(slotKey),originalSlot);assert(game.confirmSlotChange());assert.equal(JSON.parse(storage.get(backupKey)).state.money,12);assert.equal(game.slots()[0].money,game.state.money);
const occupied=storage.get(slotKey);assert(!game.deleteSlot(0));assert.equal(storage.get(slotKey),occupied);assert(game.confirmSlotChange());assert.equal(game.slots()[0],null);const deletedBackup=JSON.parse(storage.get(backupKey));game.previewImport(deletedBackup,'恢复删除');assert(game.confirmImport());assert.equal(game.state.money,deletedBackup.state.money);
assert(game.saveSlot(0));game.dailyAction('work');const beforeLoad=clone(game.state);assert(game.loadSlot(0));assert.equal(game.state.money,beforeLoad.money);assert(game.confirmImport());assert.notEqual(game.state.money,beforeLoad.money);
assert(!game.deleteSlot(0));const otherTab=game.slots();otherTab[0].money++;storage.set(slotKey,JSON.stringify(otherTab));assert(!game.confirmSlotChange());assert(game.slots()[0]);
assert(!game.deleteSlot(0));storageFailure=true;assert(!game.confirmSlotChange());storageFailure=false;assert(game.slots()[0]);assert(!game.saveSlot(4));assert(!game.deleteSlot(-1));
storage.set(slotKey,'broken-json');assert(!game.saveSlot(0));assert.equal(storage.get(slotKey),'broken-json');storage.delete(slotKey);
const html=filesystem.readFileSync(path.join(root,'index.html'),'utf8');assert(html.indexOf('story-arcs.js')<html.indexOf('game.js'));assert.equal(JSON.parse(storage.get(autosaveKey)).version,6);
console.log('PASS v6: all 24 story routes, stage gates, echoes/choices persistence, one-time endings, tracking, v1-v5 migration, medicine/rest balance, slot confirmation/recovery/failure/concurrency guards.');
