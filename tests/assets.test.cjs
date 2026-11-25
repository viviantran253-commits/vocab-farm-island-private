const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root='assets/companions';
const registry=JSON.parse(fs.readFileSync(path.join(root,'registry.json'),'utf8'));
const server=fs.readFileSync('google-apps-script/student-app/Server.gs','utf8');
const game=fs.readFileSync('google-apps-script/student-app/GameCode.html','utf8');
const html=fs.readFileSync('google-apps-script/student-app/StudentGame.html','utf8');

test('registry entries validate on the server and have complete public sprite sets',()=>{
 const context=vm.createContext({});vm.runInContext(server,context);
 const clean=context.normalizeCompanionRegistry_(registry);
 assert.equal(clean.characters.length,22);
 assert.ok(clean.characters.every(c=>c.enabled));
 for(const {id} of clean.characters)for(const name of ['growth/01_newborn.png','growth/02_baby.png','growth/03_young.png','growth/04_final.png','idle/idle_down.png','idle/idle_up.png','idle/idle_left.png','idle/idle_right.png','sheets/walk_down.png','sheets/walk_up.png','sheets/walk_left.png','sheets/walk_right.png'])assert.ok(fs.statSync(path.join(root,id,name)).size>0,`${id}/${name}`);
 const extra=structuredClone(registry);extra.characters.push({id:'new_companion',name:'New Companion',enabled:true,phrases:[{en:'Hello!',vi:'Xin chào!'}]});
 assert.equal(context.normalizeCompanionRegistry_(extra).characters.at(-1).id,'new_companion');
 extra.characters.at(-1).id='../unsafe';assert.throws(()=>context.normalizeCompanionRegistry_(extra),/Invalid companion entry/);
});

test('production UI loads the registry and keeps classroom controls',()=>{
 assert.match(html,/<input id="studentSelect" type="text" inputmode="numeric"/);
 assert.match(html,/<label for="passcode">Passcode<\/label>/);
 assert.match(game,/setCompanionRegistry\(resp\.companionRegistry\)/);
 assert.match(game,/const BUILD_ID='v0\.50'/);
 assert.doesNotMatch(game,/const CHARACTER_DATA=\[/);
 assert.doesNotMatch(html,/id="zoomFollow"|id="zoomFit"|id="wordsButton"/);
 assert.match(html,/include\("WalkMask"\)/);
 assert.match(game,/const ONLINE = true;/);
 assert.doesNotMatch(server,/STAGING_MODE|STAGING_SHEET_ID|MAGIC_CHARACTERS/);
});
