const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('server refreshes companion registry from GitHub assets and retains last good copy',()=>{
 const stored=new Map();let requests=0,fail=false;
 const registry=JSON.parse(fs.readFileSync('assets/companions/registry.json','utf8'));
 const c=vm.createContext({
  CacheService:{getScriptCache:()=>({get:key=>stored.get(key)||null,put:(key,value)=>stored.set(key,value)})},
  PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'https://example.github.io/vocab-farm-island-private/'})},
  UrlFetchApp:{fetch:url=>{requests++;assert.match(url,/\/assets\/companions\/registry\.json\?minute=/);return {getResponseCode:()=>fail?503:200,getContentText:()=>JSON.stringify(registry)};}},
  console,
 });
 vm.runInContext(fs.readFileSync('google-apps-script/student-app/Server.gs','utf8'),c);
 assert.equal(c.companionRegistry_().characters.length,22);
 assert.equal(c.companionRegistry_().characters.length,22);
 assert.equal(requests,1);
 registry.characters.push({id:'new_character',name:'New Character',enabled:true,phrases:[{en:'Hello',vi:'Xin chào'}]});
 stored.delete('companion_registry_v1');
 assert.equal(c.companionRegistry_().characters.at(-1).id,'new_character');
 fail=true;stored.delete('companion_registry_v1');
 assert.equal(c.companionRegistry_().characters.at(-1).id,'new_character');
});

test('the baseline catalog keeps login usable when GitHub is unavailable',()=>{
 const c=vm.createContext({
  CacheService:{getScriptCache:()=>({get:()=>null})},
  PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'https://example.github.io/game/'})},
  UrlFetchApp:{fetch:()=>{throw Error('network unavailable');}},
  console:{error:()=>{}},
 });
 vm.runInContext(fs.readFileSync('google-apps-script/student-app/CompanionFallback.gs','utf8'),c);
 vm.runInContext(fs.readFileSync('google-apps-script/student-app/Server.gs','utf8'),c);
 const result=c.companionRegistry_();
 assert.equal(result.source,'fallback');
 assert.equal(result.characters.length,22);
});

test('renaming Rudo preserves owned pets, discoveries, and growing Special Seeds',()=>{
 const c=vm.createContext({});
 vm.runInContext(fs.readFileSync('google-apps-script/student-app/Server.gs','utf8'),c);
 const saved=c.freshProfile_('11','Teacher Test');
 saved.gold=900;saved.level=12;
 saved.companions=[{id:'pet-1',characterId:'rudo',rarity:3,x:90,y:100}];
 saved.discovered=['rudo','rudo_surebrec'];
 saved.plots[0].crop={type:'special',stage:2,characterId:'rudo',rarity:3};
 const migrated=c.normalizeOnlineProfile_(saved,'11','Teacher Test');
 assert.equal(migrated.companions[0].characterId,'rudo_surebrec');
 assert.deepEqual([...migrated.discovered],['rudo_surebrec']);
 assert.equal(migrated.plots[0].crop.characterId,'rudo_surebrec');
 assert.equal(migrated.gold,900);
 assert.equal(migrated.level,12);
 assert.equal(saved.companions[0].characterId,'rudo');
 assert.deepEqual([...c.normalizeOnlineProfile_(migrated,'11','Teacher Test').discovered],['rudo_surebrec']);
});
