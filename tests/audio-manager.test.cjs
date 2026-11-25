const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function audioHarness(){
 const players=[],stored=new Map(),map=JSON.parse(fs.readFileSync('assets/audio/action_map.json','utf8'));
 class FakeAudio{
  constructor(){this.src='';this.volume=1;this.loop=false;this.paused=true;this.playCount=0;this.listeners={};players.push(this);}
  addEventListener(name,fn){this.listeners[name]=fn;}
  play(){this.paused=false;this.playCount++;return Promise.resolve();}
  pause(){this.paused=true;}
  finish(){this.paused=true;this.listeners.ended?.();}
 }
 let tick=1000;
 const context=vm.createContext({
  Audio:FakeAudio,URL,performance:{now:()=>tick},console,
  document:{baseURI:'https://example.github.io/game/',hidden:false},
  localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},
  fetch:async()=>({ok:true,json:async()=>map}),window:{speechSynthesis:{cancel(){}}},
 });
 vm.runInContext(fs.readFileSync('google-apps-script/student-app/AudioManager.html','utf8'),context);
 return {audio:context.window.VFIAudio,players,stored,advance:ms=>{tick+=ms;}};
}

test('music loops at 25%, effects start at 60%, and environment stays off',async()=>{
 const {audio,players}=audioHarness();await audio.ready;
 assert.equal(audio.getPreferences().musicVolume,.25);
 assert.equal(audio.getPreferences().effectsVolume,.6);
 assert.equal(audio.getPreferences().environment,false);
 audio.start();await Promise.resolve();
 assert.equal(players[0].loop,true);
 assert.match(players[0].src,/flowerbed_fields\.mp3$/);
 assert.equal(players[0].volume,.25);
 assert.equal(players[0].paused,false);
 audio.setNearHarbour(true);assert.equal(players[1].paused,true);
 audio.setPreference('environment',true);assert.equal(players[1].paused,false);
 assert.equal(players[1].volume,.1);
});

test('effects are mapped, deduplicated, serialized, and mute persists',async()=>{
 const {audio,players,stored,advance}=audioHarness();await audio.ready;audio.start();await Promise.resolve();
 audio.play('seed_purchase',{confirmed:true});await Promise.resolve();
 assert.equal(players[2].playCount,1);assert.match(players[2].src,/coin_01\.wav$/);assert.equal(players[2].volume,.6);
 audio.play('seed_purchase',{confirmed:true});audio.play('correct_answer',{confirmed:true});await Promise.resolve();
 assert.equal(players[2].playCount,1);
 players[2].finish();assert.equal(players[2].playCount,2);assert.match(players[2].src,/correct_answer\.wav$/);
 advance(200);audio.play('give_milk',{confirmed:true});await Promise.resolve();assert.equal(players[2].playCount,2);
 audio.setMuted(true);assert.equal(players[0].paused,true);assert.equal(players[2].paused,true);
 assert.equal(JSON.parse(stored.get('vfi_audio_preferences_v1')).muted,true);
 audio.play('seed_purchase',{confirmed:true});await Promise.resolve();assert.equal(players[2].playCount,2);
});

test('speech ducking restores music and preferences are independent',async()=>{
 const {audio,players}=audioHarness();await audio.ready;audio.start();await Promise.resolve();
 const release=audio.voiceStarted();assert.equal(players[0].volume,.0625);
 release();release();assert.equal(players[0].volume,.25);
 audio.setPreference('effectsVolume',.35);assert.equal(players[2].volume,.35);assert.equal(players[0].volume,.25);
 audio.setPreference('music',false);assert.equal(players[0].paused,true);
 assert.equal(audio.getPreferences().effects,true);
});

test('online reward effects wait for confirmed action IDs',()=>{
 const source=fs.readFileSync('google-apps-script/student-app/GameCode.html','utf8');
 const section=source.slice(source.indexOf('const pendingActionAudio='),source.indexOf('function stopOnlineSession('));
 const played=[];
 const context=vm.createContext({ONLINE:true,onlineToken:'test-session',onlinePendingActions:[],now:()=>1000,
  Math,performance:{now:()=>1000},audio:{play:event=>played.push(event)},rankForLevel:level=>({index:Math.floor((level-1)/5)})});
 vm.runInContext(section,context);
 vm.runInContext("recordOnlineAction('buy-seed',{crop:'carrot'})",context);
 assert.deepEqual(played,[]);
 context.actions=context.onlinePendingActions.slice();
 vm.runInContext('confirmActionAudio(actions)',context);
 assert.deepEqual(played,['seed_purchase']);
 vm.runInContext('confirmActionAudio(actions)',context);
 assert.deepEqual(played,['seed_purchase']);
});
