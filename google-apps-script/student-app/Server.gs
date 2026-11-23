/** Vocab Farm Island v0.42: official student web app.
 * Deploy as: Web app; Execute as: Me; Who has access: Anyone.
 * Keep Script Properties: SHEET_ID (private teacher Sheet),
 * ASSET_BASE_URL (https://USERNAME.github.io/REPO/ including trailing slash).
 * NEVER paste a password, teacher PIN, or OAuth token into this file.
 * WARNING: This classroom prototype does not provide tamper-proof grading/economy.
 */
const ACCOUNTS_TAB = '_Students';
const PROGRESS_TAB = '_Progress';
const HISTORY_TAB = '_History';
const MAGIC_LEDGER_TAB = '_MagicLedger';
const MAGIC_COST = 300;
const MAGIC_CHARACTERS = ['itadori_yuji','monkey_d_luffy','sakura_kinomoto','doraemon','pikachu','shin_chan','rudo','sakura_haruka','hoshina_soshiro','kamado_tanjiro','saitama','asuna_yuuki','himmel','frieren','krixi','veera','rouie','dolia','bijan','conan_edogawa','himekawa_yoshino','killua_zoldyck'];
const VOCAB_PREFIX = 'Vocab_';
const SESSION_TTL = 21600;  // 6 hours, CacheService maximum

function include(filename) { return HtmlService.createTemplateFromFile(filename).getRawContent(); }
function doGet() {
  const tpl = HtmlService.createTemplateFromFile('StudentGame');
  let base = PropertiesService.getScriptProperties().getProperty('ASSET_BASE_URL') || '';
  if (!/^https:\/\//.test(base)) return HtmlService.createHtmlOutput('<h2>Teacher setup needed</h2><p>Set ASSET_BASE_URL in Script Properties to the GitHub Pages URL for your game assets.</p>');
  // Keep the existing Script Property and deployment URL so older versions can roll back unchanged.
  tpl.assetBaseUrl = base.replace(/\/*$/, '/') + 'staging/v0.42/';
  return tpl.evaluate().setTitle('Vocab Farm Island');
}
function data_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Teacher has not configured SHEET_ID.');
  return SpreadsheetApp.openById(id);
}
function tab_(ss, name) {
  const t = ss.getSheetByName(name);
  if (!t) throw new Error('Missing sheet: '+name+'. Run Setup Sheets from the teacher dashboard.');
  return t;
}

function findAccount_(sheet,id){
  const rows=sheet.getDataRange().getValues();
  for(let i=1;i<rows.length;i++) if(String(rows[i][0]).padStart(2,'0')===id)return {row:i+1,v:rows[i]};
  throw new Error('Student ID was not found.');
}

function hashPin_(salt,pin) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(salt)+':'+String(pin))
    .map(x=>('0'+((x+256)%256).toString(16)).slice(-2)).join('');
}

function sessionKey_(token) { return 'sess_'+hashPin_('vf3',token); }

function requireSession_(token) {
  if(!token||typeof token!=='string'||token.length<45)throw Error('Please log in again.');
  const raw=CacheService.getScriptCache().get(sessionKey_(token));
  if(!raw)throw Error('Session expired. Please log in again.');
  const [id,version]=raw.split('|');
  const account=findAccount_(tab_(data_(),ACCOUNTS_TAB),id);
  if(String(account.v[6])!==version)throw Error('Your passcode was changed. Please log in again.');
  CacheService.getScriptCache().put(sessionKey_(token),raw,SESSION_TTL);
  return {id,name:String(account.v[1]),account};
}

function readWords_(ss,id) {
  const sh=tab_(ss,VOCAB_PREFIX+id);const rows=sh.getDataRange().getDisplayValues();
  const out=[],taken={};
  for(let i=1;i<rows.length;i++){
    const [en,ipa,pos0,meaning,example]=rows[i].map(x=>String(x).trim());
    const rawPos=pos0.toLowerCase().replace(/[().\s]/g,'');
    // Classroom lists also use "phr.v", "phr" and "n/v". Map them to the
    // game's four question categories without discarding otherwise valid words.
    const pos=rawPos==='phrv'||rawPos==='phr'?'v':rawPos==='n/v'?'n':rawPos;
    if(!en||!ipa||!meaning||!example||!['n','v','adj','adv'].includes(pos))continue;
    const base=en.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+pos;
    const key='sheet_'+id+'_'+base;
    if(taken[key])continue; taken[key]=true;
    out.push({id:key,english:en,ipa,pos,meaning,example});
  }
  return out.slice(0,1000);
}

function freshProfile_(id,name){
  return {version:2,saveSchemaVersion:1,id,name,gold:30,level:1,xp:0,xpTotal:0,seeds:{carrot:2},harvest:{},
    companions:[],discovered:[],fences:[],fenceStock:0,decorations:[],decorStock:{},specialSeedLastPurchase:'',
    plots:Array.from({length:10},(_,i)=>({unlocked:i<2,crop:null})),orders:[],ordersExpire:0,
    lastWords:[],history:[],sales:[],badges:[],daily:{day:'',answers:{},correct:0},weekly:{week:'',answers:{},correct:0},
    position:{x:880,y:495},settings:{fastDemo:false},savedAt:Date.now()};
}

/** Additive migration for v0.13 classroom saves. Do not silently replace any account. */
function normalizeOnlineProfile_(saved,id,name){
  if(!saved || typeof saved!=='object' || Array.isArray(saved)) throw Error('Saved profile is unreadable. Teacher recovery required.');
  if(Number(saved.version)!==2 || Number(saved.saveSchemaVersion||0)>1) throw Error('Unsupported saved profile version. Teacher recovery required; no data was replaced.');
  if(String(saved.id===undefined?id:saved.id).padStart(2,'0')!==id) throw Error('Saved student ID mismatch. Teacher recovery required.');
  if(!Array.isArray(saved.plots)||saved.plots.length!==10) throw Error('Unexpected plot layout. Teacher recovery required; no data was replaced.');
  const p=JSON.parse(JSON.stringify(saved));
  p.id=id;p.name=name;p.saveSchemaVersion=1;
  for(const k of ['companions','discovered','fences','decorations']) if(p[k]===undefined)p[k]=[];
  for(const k of ['seeds','harvest','decorStock']) if(p[k]===undefined)p[k]={};
  if(p.fenceStock===undefined)p.fenceStock=0;
  if(p.specialSeedLastPurchase===undefined)p.specialSeedLastPurchase='';
  if(p.xpTotal===undefined)p.xpTotal=Number(p.xp)||0;
  if(p.settings===undefined)p.settings={fastDemo:false};
  return p;
}

function readProgress_(ss,id,name){
 const sh=tab_(ss,PROGRESS_TAB),data=sh.getDataRange().getValues();
 for(let i=1;i<data.length;i++)if(String(data[i][0]).padStart(2,'0')===id){
  const profile=JSON.parse(String(data[i][2]||'{}'));
  const migrated=normalizeOnlineProfile_(profile,id,name);delete migrated.landTax;
  return {row:i+1,revision:Number(data[i][1])||0,profile:migrated,seen:JSON.parse(String(data[i][4]||'[]'))};
 }
 return {row:null,revision:0,profile:freshProfile_(id,name),seen:[]};
}

function studentLogin(studentId,pin){
 const id=String(studentId||'').padStart(2,'0');
 if(!/^\d{2}$/.test(id)||!/^\d{4}$/.test(String(pin)))throw Error('Enter a valid student ID and four-digit passcode.');
 const ss=data_(),acSheet=tab_(ss,ACCOUNTS_TAB),acct=findAccount_(acSheet,id),v=acct.v;
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
  const latest=findAccount_(acSheet,id).v;
  if(Number(latest[5])>Date.now())throw Error('Too many wrong codes. Try again after 15 minutes.');
  if(hashPin_(String(latest[2]),String(pin))!==String(latest[3])){
   const failed=Number(latest[4]||0)+1;
   acSheet.getRange(acct.row,5,1,2).setValues([[failed>=6?0:failed,failed>=6?Date.now()+15*60000:0]]);
   throw Error('Incorrect passcode. You can ask your teacher to reset it.');
  }
  acSheet.getRange(acct.row,5,1,2).setValues([[0,0]]);
 }finally{lock.releaseLock();}
 const prof=readProgress_(ss,id,String(v[1]));
 const session=Utilities.getUuid()+Utilities.getUuid();
 CacheService.getScriptCache().put(sessionKey_(session),id+'|'+String(v[6]),SESSION_TTL);
 return {session,revision:prof.revision,profile:prof.profile,words:readWords_(ss,id)};
}

function studentWords(session){
 const user=requireSession_(session);return {name:user.name,words:readWords_(data_(),user.id)};
}

function verifyProfile_(profile,id){
 if(!profile||profile.id!==id||profile.version!==2||!Array.isArray(profile.plots)||profile.plots.length!==10)throw Error('Invalid progress data.');
 delete profile.landTax;
 if(!Number.isFinite(profile.gold)||profile.gold<0||profile.gold>1e9||!Number.isFinite(profile.level)||profile.level<1||profile.level>1e8)throw Error('Invalid economy values.');
 if(!profile.seeds||!profile.harvest||!Array.isArray(profile.history))throw Error('Invalid inventory or history.');
 profile.history=profile.history.slice(-40);
 profile.sales=(profile.sales||[]).slice(-35);
 profile.lastWords=(profile.lastWords||[]).slice(-20);
 if(!profile.settings)profile.settings={fastDemo:false};
 if(JSON.stringify(profile).length>49000)throw Error('Saved state is too large. Please contact the teacher.');
 return profile;
}
function studentSave(session,profileJson,events,expectedRevision){
 const user=requireSession_(session),id=user.id;
 if(typeof profileJson!=='string'||profileJson.length>49000)throw Error('Save is too large.');
 const proposed=verifyProfile_(JSON.parse(profileJson),id);proposed.name=user.name;
 const ss=data_(),lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  requireSession_(session);
  const p=readProgress_(ss,id,user.name);
  if(Number(expectedRevision)!==p.revision)return {conflict:true,revision:p.revision};
  // These fields may only be changed by the two authenticated server methods.
  if(String(proposed.specialSeedLastPurchase||'')!==String(p.profile.specialSeedLastPurchase||''))throw Error('Special Seed purchase must be confirmed by the server.');
  if(Number(proposed.seeds.special||0)>Number(p.profile.seeds?.special||0))throw Error('Unconfirmed Special Seed inventory increase.');
  for(let i=0;i<10;i++){
   const before=p.profile.plots?.[i]?.crop,after=proposed.plots?.[i]?.crop;
   if(after?.type==='special'&&after.characterId){
    if(!before||before.type!=='special'||before.characterId!==after.characterId||Number(before.rarity)!==Number(after.rarity))throw Error('Unconfirmed companion identity or rarity change.');
   }
  }
  // Planting must consume server-recorded Special Seed stock, including if
  // the student plants multiple plots before the next automatic save.
  const newPlantings=proposed.plots.reduce((n,slot,i)=>n+(slot.crop?.type==='special'&&p.profile.plots?.[i]?.crop?.type!=='special'?1:0),0);
  if(newPlantings>Number(p.profile.seeds?.special||0)-Number(proposed.seeds.special||0))throw Error('Special Seed planting requires owned inventory.');
  const oldPets=new Map((p.profile.companions||[]).map(x=>[String(x.id),x]));
  const newPets=(proposed.companions||[]).filter(x=>!oldPets.has(String(x.id)));
  for(const pet of proposed.companions||[]){const old=oldPets.get(String(pet.id));if(old&&(old.characterId!==pet.characterId||Number(old.rarity)!==Number(pet.rarity)))throw Error('Companion identity or rarity cannot be edited.');}
  const availableHarvests=p.profile.plots.map((x,i)=>({i,c:x.crop})).filter(x=>x.c?.type==='special'&&x.c.stage===4);
  for(const pet of newPets){
   const matching=availableHarvests.findIndex(x=>x.c.characterId===pet.characterId&&Number(x.c.rarity)===Number(pet.rarity)&&Number(x.c.nextDueAt||0)<=Date.now()&&!proposed.plots?.[x.i]?.crop);
   if(matching<0)throw Error('No ready, harvested Special Seed supports this companion.');
   availableHarvests.splice(matching,1); // one harvested plot cannot mint multiple pets
  }
  const history=tab_(ss,HISTORY_TAB),seen=new Set(p.seen||[]);
  const dict={};for(const w of readWords_(ss,id))dict[w.id]=w;
  const toSave=[];
  for(const e of (Array.isArray(events)?events:[]).slice(0,75)){
   if(!e||!/^ev_[\w-]{8,}$/.test(String(e.eventId||''))||seen.has(e.eventId))continue;
   seen.add(e.eventId);
   // Verify the submitted answer against the teacher's current word sheet.
   // This improves log accuracy but is not an anti-cheat/secure-exam solution.
   const w=dict[String(e.wordId)];const stage=String(e.stage||'');
   const answer=String(e.answer||'').trim(),normalize=x=>String(x||'').trim().toLowerCase();
   const expected=w?((e.source==='Daily challenge'||e.source==='Weekly challenge'||stage==='Tend'||stage==='English → Vietnamese')?w.meaning:stage==='Water'?w.pos:w.english):String(e.expected||'');
   const result=w?(normalize(answer)===normalize(expected)?'Correct':'Wrong'):'Unverified';
   toSave.push([e.eventId,new Date(Number(e.time)||Date.now()),id,user.name,
      String(e.source||'').slice(0,48),stage.slice(0,48),
      String(w?`${w.english} (${w.pos})`:(e.word||'')).slice(0,120),answer.slice(0,200),
      String(expected).slice(0,200),result,
      Math.max(1,Math.min(100,Number(e.attempt)||1))]);
  }
  if(toSave.length)history.getRange(history.getLastRow()+1,1,toSave.length,11).setValues(toSave);
  const rec=[id,p.revision+1,JSON.stringify(proposed),new Date(),JSON.stringify(Array.from(seen).slice(-300))];
  const progressSheet=tab_(ss,PROGRESS_TAB);
  if(p.row)progressSheet.getRange(p.row,1,1,5).setValues([rec]);
  else progressSheet.appendRow(rec);
  return {ok:true,revision:p.revision+1,logged:toSave.length};
 }finally{lock.releaseLock();}
}


/** Server decisions for the online Special Seed. This ledger is separate from
 * client-submitted progress and is only written by server methods. The rest of
 * the game economy is still a trust-based classroom prototype. */
function magicDay_(){return Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','yyyy-MM-dd');}
function magicLedger_(ss){
 let sh=ss.getSheetByName(MAGIC_LEDGER_TAB);
 if(!sh){sh=ss.insertSheet(MAGIC_LEDGER_TAB);sh.appendRow(['Time','Student ID','Type','Vietnam day','Plot','Character','Rarity','Revision']);sh.setFrozenRows(1);}
 return sh;
}
function hasMagicPurchase_(sh,id,day){
 const rows=sh.getDataRange().getValues();
 for(let i=rows.length-1;i>=1;i--){const r=rows[i];const recordedDay=r[3] instanceof Date?Utilities.formatDate(r[3],'Asia/Ho_Chi_Minh','yyyy-MM-dd'):String(r[3]).slice(0,10);if(String(r[1]).padStart(2,'0')===id&&String(r[2])==='purchase'&&recordedDay===day)return true;}
 return false;
}
function writeMagicProgress_(ss,p,id,profile){
 const row=[id,p.revision+1,JSON.stringify(profile),new Date(),JSON.stringify(p.seen||[])];
 const sh=tab_(ss,PROGRESS_TAB);
 if(p.row)sh.getRange(p.row,1,1,5).setValues([row]);else sh.appendRow(row);
 return p.revision+1;
}
function studentSpecialBuy(session,expectedRevision){
 const user=requireSession_(session),ss=data_();
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  requireSession_(session);
  const p=readProgress_(ss,user.id,user.name);
  if(Number(expectedRevision)!==p.revision)return {conflict:true,revision:p.revision};
  const day=magicDay_(),profile=p.profile;
  if(profile.version!==2||Number(profile.level)<5||Number(profile.gold)<MAGIC_COST)throw Error('Level 5 and 300 gold are required.');
  const ledger=magicLedger_(ss);
  // Purchases are no longer limited to one per day. Revision and lock checks still apply.
  profile.gold-=MAGIC_COST;
  if(!profile.seeds||typeof profile.seeds!=='object')profile.seeds={};
  profile.seeds.special=(Number(profile.seeds.special)||0)+1;
  profile.specialSeedLastPurchase=day;profile.savedAt=Date.now();
  const rev=writeMagicProgress_(ss,p,user.id,profile);
  ledger.appendRow([new Date(),user.id,'purchase',day,'','',0,rev]);
  return {ok:true,revision:rev,day,gold:profile.gold,specialSeeds:profile.seeds.special};
 }finally{lock.releaseLock();}
}
function studentSpecialReveal(session,plotIndex,expectedRevision){
 const user=requireSession_(session),ss=data_(),idx=Number(plotIndex);
 if(!Number.isInteger(idx)||idx<0||idx>9)throw Error('Invalid planting plot.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  requireSession_(session);
  const p=readProgress_(ss,user.id,user.name);
  if(Number(expectedRevision)!==p.revision)return {conflict:true,revision:p.revision};
  const crop=p.profile.plots?.[idx]?.crop;
  if(!crop||crop.type!=='special')throw Error('This plot does not contain a Special Seed.');
  if(crop.stage===1&&crop.characterId&&[1,2,3].includes(Number(crop.rarity)))return {ok:true,revision:p.revision,crop};
  if(crop.stage!==0||crop.pendingReveal!==true)throw Error('Complete the Water question before revealing a character.');
  const chance=Math.floor(Math.random()*100);
  crop.rarity=chance<5?3:chance<30?2:1;
  crop.characterId=MAGIC_CHARACTERS[Math.floor(Math.random()*MAGIC_CHARACTERS.length)];
  crop.stage=1;crop.retryAfter=0;crop.wrong=0;crop.nextDueAt=Date.now()+60*1000;
  delete crop.pendingReveal;
  p.profile.savedAt=Date.now();
  const rev=writeMagicProgress_(ss,p,user.id,p.profile);
  magicLedger_(ss).appendRow([new Date(),user.id,'reveal',magicDay_(),idx+1,crop.characterId,crop.rarity,rev]);
  return {ok:true,revision:rev,crop};
 }finally{lock.releaseLock();}
}
