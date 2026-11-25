/** Vocab Farm Island v0.50: official student web app.
 * Deploy as: Web app; Execute as: Me; Who has access: Anyone.
 * Keep Script Properties: SHEET_ID (private teacher Sheet),
 * ASSET_BASE_URL (https://USERNAME.github.io/REPO/ including trailing slash).
 * NEVER paste a password, teacher PIN, or OAuth token into this file.
 * Server-owned action rules protect the online economy. Vocabulary answers remain visible to a signed-in student.
 */
const ACCOUNTS_TAB = '_Students';
const PROGRESS_TAB = '_Progress';
const HISTORY_TAB = '_History';
const MAGIC_LEDGER_TAB = '_MagicLedger';
const MAGIC_COST = 300;
const TEACHER_TEST_ID = '11';
const VOCAB_PREFIX = 'Vocab_';
const SESSION_TTL = 21600;  // 6 hours, CacheService maximum

function include(filename) { return HtmlService.createTemplateFromFile(filename).getRawContent(); }
function doGet(e) {
  // Public, read-only probe for the public GitHub companion catalog.
  if (e && e.parameter && e.parameter.health === 'companions') {
    let status;
    try {
      const registry = companionRegistry_();
      status = {ok:registry.source!=='fallback', source:registry.source||'live', assetVersion:registry.assetVersion,
        companions:registry.characters.length,
        enabled:registry.characters.filter(character => character.enabled).length};
    } catch (_error) {
      status = {ok:false, error:'Companion catalog unavailable'};
    }
    return ContentService.createTextOutput(JSON.stringify(status))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const tpl = HtmlService.createTemplateFromFile('StudentGame');
  let base = PropertiesService.getScriptProperties().getProperty('ASSET_BASE_URL') || '';
  if (!/^https:\/\//.test(base)) return HtmlService.createHtmlOutput('<h2>Teacher setup needed</h2><p>Set ASSET_BASE_URL in Script Properties to the GitHub Pages URL for your game assets.</p>');
  // Keep the existing Script Property and deployment URL so older versions can roll back unchanged.
  tpl.assetBaseUrl = base.replace(/\/*$/, '/');
  return tpl.evaluate().setTitle('Vocab Farm Island')
    .addMetaTag('viewport','width=device-width, initial-scale=1, viewport-fit=cover');
}
function normalizeCompanionRegistry_(input){
 if(!input||input.schemaVersion!==1||!Array.isArray(input.characters)||!input.characters.length||input.characters.length>100)throw Error('Invalid companion registry.');
 const version=String(input.assetVersion||'');
 if(!/^[A-Za-z0-9._-]{1,40}$/.test(version))throw Error('Invalid companion asset version.');
 const seen=new Set(),characters=input.characters.map(raw=>{
  const id=String(raw?.id||''),name=String(raw?.name||'').trim();
  if(!/^[a-z][a-z0-9_]{1,39}$/.test(id)||seen.has(id)||!name||name.length>80||typeof raw.enabled!=='boolean'||(raw.portrait!==undefined&&typeof raw.portrait!=='boolean'))throw Error('Invalid companion entry: '+id);
  seen.add(id);
  if(!Array.isArray(raw.phrases)||raw.phrases.length<1||raw.phrases.length>5)throw Error('Invalid companion phrases: '+id);
  const phrases=raw.phrases.map(phrase=>{
   const en=String(phrase?.en||'').trim(),vi=String(phrase?.vi||'').trim();
   if(!en||!vi||en.length>180||vi.length>180)throw Error('Invalid companion phrase: '+id);
   return {en,vi};
  });
  return {id,name,enabled:raw.enabled,portrait:raw.portrait===true,phrases};
 });
 if(!characters.some(x=>x.enabled))throw Error('No companions are enabled.');
 return {schemaVersion:1,assetVersion:version,characters};
}
function companionRegistry_(){
 const cache=CacheService.getScriptCache(),key='companion_registry_v1',cached=cache.get(key);
 if(cached)try{return JSON.parse(cached);}catch(error){console.warn('Companion cache invalid: '+error);}
 try{
  const base=PropertiesService.getScriptProperties().getProperty('ASSET_BASE_URL')||'';
  if(!/^https:\/\//.test(base))throw Error('Asset URL is not configured.');
  const url=base.replace(/\/*$/,'/')+'assets/companions/registry.json?minute='+Math.floor(Date.now()/60000);
  const response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,timeoutSeconds:10});
  if(response.getResponseCode()!==200)throw Error('HTTP '+response.getResponseCode());
  const body=response.getContentText();if(body.length>80000)throw Error('Companion registry is too large.');
  const registry=normalizeCompanionRegistry_(JSON.parse(body));registry.source='live';
  const json=JSON.stringify(registry);
  cache.put(key,json,60);cache.put(key+'_last',json,21600);
  return registry;
 }catch(error){
  const last=cache.get(key+'_last');if(last)try{return JSON.parse(last);}catch(_error){}
  console.error('Companion registry unavailable: '+error);
  if(typeof COMPANION_FALLBACK!=='undefined'){
   const fallback=normalizeCompanionRegistry_(COMPANION_FALLBACK);
   fallback.source='fallback';
   return fallback;
  }
  throw Error('The companion catalog is unavailable. Please try again shortly.');
 }
}
// Run once from the Apps Script editor as the deployment owner to grant UrlFetch access.
function authorizeCompanionRegistry(){
 ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
 const registry=companionRegistry_();
 return {assetVersion:registry.assetVersion,companions:registry.characters.length};
}
let openSheetCache_ = null;
function data_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Teacher has not configured SHEET_ID.');
  if(!openSheetCache_ || openSheetCache_.id!==id)openSheetCache_={id,sheet:SpreadsheetApp.openById(id)};
  return openSheetCache_.sheet;
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

// Column I is an editable login number. Column A remains the permanent account ID
// used by progress, vocabulary, history and sessions.
function canonicalLoginNumber_(value){
 const raw=String(value===null||value===undefined?'':value).trim();
 return /^\d{1,6}$/.test(raw)&&Number(raw)>0?String(Number(raw)):null;
}
function findAccountByLoginNumber_(sheet,number){
 const key=canonicalLoginNumber_(number);
 if(!key)throw Error('Enter your student number (1–6 digits).');
 const rows=sheet.getDataRange().getValues();let found=null;
 for(let i=1;i<rows.length;i++){
  const row=rows[i],id=String(row[0]).padStart(2,'0');
  const assigned=row[8]===undefined||String(row[8]).trim()===''?id:row[8];
  if(canonicalLoginNumber_(assigned)!==key)continue;
  if(found)throw Error('This student number is assigned twice. Please ask your teacher to fix column I in _Students.');
  found={row:i+1,v:row,id};
 }
 if(!found)throw Error('Student number was not found. Please ask your teacher.');
 return found;
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

function canonicalWordPos_(raw,english){
 const key=String(raw||'').trim().toLowerCase().replace(/[().\s_/-]+/g,'');
 const labels={n:'n',noun:'n',v:'v',verb:'v',adj:'adj',adjective:'adj',adv:'adv',adverb:'adv',
  nphr:'n.phr',nounphrase:'n.phr',vphr:'v.phr',verbphrase:'v.phr',phrv:'v.phr',phr:'v.phr',
  adjphr:'adj.phr',adjectivephrase:'adj.phr',advphr:'adv.phr',adverbphrase:'adv.phr',
  phrasalverb:'phrasal',phrasal:'phrasal',idiom:'idiom',collocation:'collocation',nv:'n/v',vn:'v/n',
  conj:'conj',conjunction:'conj'};
 const pos=labels[key]||null;
 return String(english||'').trim().toLowerCase()==='focus on'&&pos==='v'?'v.phr':pos;
}

function readWords_(ss,id,force=false) {
  const cache=typeof CacheService==='undefined'?null:CacheService.getScriptCache(),key='words_v2_'+id;
  if(cache&&!force){const packed=cache.get(key);if(packed)try{
    const bytes=Utilities.base64Decode(packed),json=Utilities.ungzip(Utilities.newBlob(bytes)).getDataAsString();
    return JSON.parse(json);
  }catch(error){console.warn('Vocabulary cache invalid: '+error);}}
  const sh=tab_(ss,VOCAB_PREFIX+id),last=sh.getLastRow(),rows=last?sh.getRange(1,1,last,5).getDisplayValues():[];
  const out=[],taken={};
  for(let i=1;i<rows.length;i++){
    const [en,ipa,pos0,meaning,example]=rows[i].map(x=>String(x).trim());
    const pos=canonicalWordPos_(pos0,en);
    if(!en||!ipa||!meaning||!example||!pos)continue;
    // Preserve IDs from older saves when a legacy phrase label is displayed correctly.
    const legacyPos=pos==='v.phr'||pos==='phrasal'||(pos==='collocation'&&en.toLowerCase()==='make a decision')?'v':
      pos==='n.phr'&&en.toLowerCase()==='communal house'?'n':pos==='n/v'?'n':pos==='v/n'?'v':pos.replace(/\W+/g,'');
    const key='sheet_'+id+'_'+en.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+legacyPos;
    if(taken[key])continue; taken[key]=true;
    out.push({id:key,english:en,ipa,pos,meaning,example});
  }
  const words=out.slice(0,1000);
  if(cache)try{const packed=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(words))).getBytes());if(packed.length<95000)cache.put(key,packed,60);}catch(error){console.warn('Vocabulary cache unavailable: '+error);}
  return words;
}

function freshProfile_(id,name){
  return {version:2,saveSchemaVersion:1,id,name,gold:30,level:1,xp:0,xpTotal:0,seeds:{carrot:2},harvest:{},
    companions:[],discovered:[],fences:[],fenceStock:0,decorations:[],decorStock:{},specialSeedLastPurchase:'',
    plots:Array.from({length:10},(_,i)=>({unlocked:i<2,crop:null})),orders:[],ordersExpire:0,
    lastWords:[],history:[],sales:[],badges:[],farmCorrectTotal:0,daily:{day:'',answers:{},correct:0},weekly:{week:'',answers:{},correct:0},
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
  for(const k of ['history','sales','badges','lastWords','orders']) if(p[k]===undefined)p[k]=[];
  for(const k of ['seeds','harvest','decorStock']) if(p[k]===undefined)p[k]={};
  if(p.fenceStock===undefined)p.fenceStock=0;
  if(p.specialSeedLastPurchase===undefined)p.specialSeedLastPurchase='';
  if(p.xpTotal===undefined)p.xpTotal=Number(p.xp)||0;
  if(p.farmCorrectTotal===undefined)p.farmCorrectTotal=p.history.filter(x=>x.source==='Farm'&&x.correct).length;
  if(p.settings===undefined)p.settings={fastDemo:false};
  return p;
}

function readProgress_(ss,id,name){
 const sh=tab_(ss,PROGRESS_TAB),last=sh.getLastRow(),data=last>1?sh.getRange(2,1,last-1,5).getValues():[];
 for(let i=0;i<data.length;i++)if(String(data[i][0]).padStart(2,'0')===id){
  const profile=JSON.parse(String(data[i][2]||'{}'));
  const migrated=normalizeOnlineProfile_(profile,id,name);delete migrated.landTax;
  return {row:i+2,revision:Number(data[i][1])||0,profile:migrated,seen:JSON.parse(String(data[i][4]||'[]'))};
 }
 return {row:null,revision:0,profile:freshProfile_(id,name),seen:[]};
}

function studentLogin(loginNumber,pin){
 if(!canonicalLoginNumber_(loginNumber)||!/^(?:\d{4}|\d{6})$/.test(String(pin)))throw Error('Enter your student number and passcode.');
 const ss=data_(),acSheet=tab_(ss,ACCOUNTS_TAB),acct=findAccountByLoginNumber_(acSheet,loginNumber),id=acct.id;
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 let accountName,accountVersion;
 try{
  const latest=acSheet.getRange(acct.row,1,1,9).getValues()[0];
  if(canonicalLoginNumber_(latest[8]===undefined||String(latest[8]).trim()===''?id:latest[8])!==canonicalLoginNumber_(loginNumber))throw Error('Student number changed. Please try again.');
  if(Number(latest[5])>Date.now())throw Error('Too many wrong codes. Try again after 15 minutes.');
  if(hashPin_(String(latest[2]),String(pin))!==String(latest[3])){
   const failed=Number(latest[4]||0)+1;
   acSheet.getRange(acct.row,5,1,2).setValues([[failed>=6?0:failed,failed>=6?Date.now()+15*60000:0]]);
   throw Error('Incorrect passcode. You can ask your teacher to reset it.');
  }
  acSheet.getRange(acct.row,5,1,2).setValues([[0,0]]);
  accountName=String(latest[1]);accountVersion=String(latest[6]);
 }finally{lock.releaseLock();}
 const prof=readProgress_(ss,id,accountName),registry=companionRegistry_();
 const session=Utilities.getUuid()+Utilities.getUuid();
 CacheService.getScriptCache().put(sessionKey_(session),id+'|'+accountVersion,SESSION_TTL);
 return {session,revision:prof.revision,profile:prof.profile,words:readWords_(ss,id,true),companionRegistry:registry,testMode:id===TEACHER_TEST_ID};
}

function studentLogout(session){
 if(typeof session==='string'&&session.length>=45)CacheService.getScriptCache().remove(sessionKey_(session));
 return {ok:true};
}

function studentWords(session){
 const user=requireSession_(session);return {name:user.name,words:readWords_(data_(),user.id,true)};
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
function prepareStudentSave_(ss,user,p,profileJson,events,actions){
 if(typeof profileJson!=='string'||profileJson.length>49000)throw Error('Save is too large.');
 const proposed=verifyProfile_(JSON.parse(profileJson),user.id),list=Array.isArray(actions)?actions:[];
 const words=list.some(x=>['plant','challenge'].includes(x?.type))?readWords_(ss,user.id):[];
 const replay=secureReplay_(p.profile,proposed,list,words,user.id,p.seen||[],Date.now());
 const rows=replay.logs.map(log=>[log.id,new Date(),user.id,user.name,log.source,log.stage,log.word.english+' ('+log.word.pos+')',log.answer.slice(0,200),String(log.expected).slice(0,200),log.correct?'Correct':'Wrong',log.attempt]);
 return {profile:replay.profile,seen:replay.seen,toSave:rows};
}
function commitStudentProgress_(ss,user,p,prepared){
  let appended=0;
  if(prepared.toSave.length){
    const history=tab_(ss,HISTORY_TAB),last=history.getLastRow();
    // A retry after a failed progress write must not duplicate answer rows.
    const start=Math.max(2,last-499),ids=new Set(last>1?history.getRange(start,1,last-start+1,1).getValues().map(row=>String(row[0])):[]);
    const missing=prepared.toSave.filter(row=>!ids.has(row[0]));
    if(missing.length){history.getRange(last+1,1,missing.length,11).setValues(missing);appended=missing.length;}
  }
  const rec=[user.id,p.revision+1,JSON.stringify(prepared.profile),new Date(),JSON.stringify(prepared.seen)];
  const progressSheet=tab_(ss,PROGRESS_TAB);
  if(p.row)progressSheet.getRange(p.row,1,1,5).setValues([rec]);
  else progressSheet.appendRow(rec);
  return {ok:true,revision:p.revision+1,logged:appended};
}
function studentSave(session,profileJson,events,expectedRevision,actions){
 const started=Date.now(),ss=data_(),lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const user=requireSession_(session);
  const p=readProgress_(ss,user.id,user.name);
  const readMs=Date.now()-started;
  let prepared;
  try{prepared=prepareStudentSave_(ss,user,p,profileJson,events,actions);}
  catch(error){console.warn('Rejected student save for '+user.id+': '+error);return {rejected:true,revision:p.revision};}
  const prepareMs=Date.now()-started-readMs;
  const result=commitStudentProgress_(ss,user,p,prepared);result.profile=prepared.profile;
  result.timing={readMs,prepareMs,commitMs:Date.now()-started-readMs-prepareMs,totalMs:Date.now()-started};return result;
 }finally{lock.releaseLock();}
}


/** Server decisions for the online Special Seed. The ledger is an audit trail. */
function magicDay_(){return Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','yyyy-MM-dd');}
function magicLedger_(ss){
 let sh=ss.getSheetByName(MAGIC_LEDGER_TAB);
 if(!sh){sh=ss.insertSheet(MAGIC_LEDGER_TAB);sh.appendRow(['Time','Student ID','Type','Vietnam day','Plot','Character','Rarity','Revision']);sh.setFrozenRows(1);}
 return sh;
}
function writeMagicProgress_(ss,p,id,profile){
 const row=[id,p.revision+1,JSON.stringify(profile),new Date(),JSON.stringify(p.seen||[])];
 const sh=tab_(ss,PROGRESS_TAB);
 if(p.row)sh.getRange(p.row,1,1,5).setValues([row]);else sh.appendRow(row);
 return p.revision+1;
}
/** Restricted test controls affect only the authenticated teacher test profile. */
function studentTestAction(session,action,value,expectedRevision){
 const user=requireSession_(session);
 if(user.id!==TEACHER_TEST_ID)throw Error('Teacher test controls are unavailable for this profile.');
 const ss=data_(),lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  requireSession_(session);
  const p=readProgress_(ss,user.id,user.name);
  if(Number(expectedRevision)!==p.revision)return {conflict:true,revision:p.revision};
  const profile=p.profile;
  switch(String(action)){
   case 'add-gold':profile.gold=Math.min(1000000000,Number(profile.gold)+100000);break;
   case 'set-level':{
    const level=Number(value);if(!Number.isInteger(level)||level<1||level>50)throw Error('Choose a level from 1 to 50.');
    profile.level=level;profile.xp=0;break;
   }
   case 'special-seeds':profile.seeds.special=(Number(profile.seeds.special)||0)+10;break;
   case 'fences':profile.fenceStock=(Number(profile.fenceStock)||0)+20;break;
   case 'plots':profile.plots.forEach(plot=>{plot.unlocked=true;});break;
   case 'ready':profile.plots.forEach(plot=>{if(plot.crop){plot.crop.nextDueAt=Date.now()-1000;plot.crop.retryAfter=0;}});break;
   case 'growth-seconds':{
    const seconds=Number(value);if(!Number.isInteger(seconds)||seconds<0||seconds>120)throw Error('Choose 0 to 120 seconds.');
    profile.settings=profile.settings||{};profile.settings.testGrowthSeconds=seconds;break;
   }
   default:throw Error('Unknown teacher test action.');
  }
  profile.savedAt=Date.now();
  const revision=writeMagicProgress_(ss,p,user.id,profile);
  return {ok:true,revision,profile};
 }finally{lock.releaseLock();}
}
function studentSpecialBuy(session,expectedRevision,profileJson,events,actions){
 const started=Date.now();
 const ss=data_();
 const openMs=Date.now()-started;
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const user=requireSession_(session);
  const lockAndSessionMs=Date.now()-started-openMs;
  const p=readProgress_(ss,user.id,user.name);
  const readMs=Date.now()-started-openMs-lockAndSessionMs;
  if(Number(expectedRevision)!==p.revision)return {conflict:true,revision:p.revision};
  let prepared=null;
  try{if(typeof profileJson==='string')prepared=prepareStudentSave_(ss,user,p,profileJson,events,actions);}
  catch(error){console.warn('Rejected Special Seed purchase for '+user.id+': '+error);return {rejected:true,revision:p.revision};}
  const prepareMs=Date.now()-started-openMs-lockAndSessionMs-readMs;
  const day=magicDay_(),profile=prepared?prepared.profile:p.profile;
  if(profile.version!==2||Number(profile.level)<5||Number(profile.gold)<MAGIC_COST)throw Error('Level 5 and 300 gold are required.');
  const ledger=magicLedger_(ss);
  // Purchases are no longer limited to one per day. Revision and lock checks still apply.
  profile.gold-=MAGIC_COST;
  if(!profile.seeds||typeof profile.seeds!=='object')profile.seeds={};
  profile.seeds.special=(Number(profile.seeds.special)||0)+1;
  profile.specialSeedLastPurchase=day;profile.savedAt=Date.now();
  const saved=prepared?commitStudentProgress_(ss,user,p,prepared):null;
  const rev=saved?saved.revision:writeMagicProgress_(ss,p,user.id,profile);
  const commitMs=Date.now()-started-openMs-lockAndSessionMs-readMs-prepareMs;
  try{ledger.appendRow([new Date(),user.id,'purchase',day,'','',0,rev]);}
  catch(error){console.error('Special Seed purchase saved at revision '+rev+'; ledger append failed: '+error);}
  return {ok:true,revision:rev,day,gold:profile.gold,specialSeeds:profile.seeds.special,profile,logged:saved?saved.logged:0,timing:{openMs,lockAndSessionMs,readMs,prepareMs,commitMs,totalMs:Date.now()-started}};
 }finally{lock.releaseLock();}
}
function studentSpecialReveal(session,plotIndex,expectedRevision,profileJson,events,actions){
 const started=Date.now();
 const ss=data_(),idx=Number(plotIndex);
 const openMs=Date.now()-started;
 if(!Number.isInteger(idx)||idx<0||idx>9)throw Error('Invalid planting plot.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const user=requireSession_(session);
  const lockAndSessionMs=Date.now()-started-openMs;
  const p=readProgress_(ss,user.id,user.name);
  const readMs=Date.now()-started-openMs-lockAndSessionMs;
  if(Number(expectedRevision)!==p.revision)return {conflict:true,revision:p.revision};
  let prepared=null;
  try{if(typeof profileJson==='string')prepared=prepareStudentSave_(ss,user,p,profileJson,events,actions);}
  catch(error){console.warn('Rejected Special Seed reveal for '+user.id+': '+error);return {rejected:true,revision:p.revision};}
  const prepareMs=Date.now()-started-openMs-lockAndSessionMs-readMs;
  const profile=prepared?prepared.profile:p.profile;
  const crop=profile.plots?.[idx]?.crop;
  if(!crop||crop.type!=='special')throw Error('This plot does not contain a Special Seed.');
  if(crop.stage===1&&crop.characterId&&[1,2,3].includes(Number(crop.rarity)))return {ok:true,revision:p.revision,crop};
  if(crop.stage!==0||crop.pendingReveal!==true)throw Error('Complete the Water question before revealing a character.');
  const chance=Math.floor(Math.random()*100);
  crop.rarity=chance<5?3:chance<30?2:1;
  const choices=companionRegistry_().characters.filter(c=>c.enabled);
  crop.characterId=choices[Math.floor(Math.random()*choices.length)].id;
  const testSeconds=user.id===TEACHER_TEST_ID?Number(profile.settings?.testGrowthSeconds)||0:0;
  crop.stage=1;crop.retryAfter=0;crop.wrong=0;crop.nextDueAt=Date.now()+(testSeconds>=1&&testSeconds<=120?testSeconds:60)*1000;
  delete crop.pendingReveal;
  profile.savedAt=Date.now();
  const ledger=magicLedger_(ss);
  const saved=prepared?commitStudentProgress_(ss,user,p,prepared):null;
  const rev=saved?saved.revision:writeMagicProgress_(ss,p,user.id,profile);
  const commitMs=Date.now()-started-openMs-lockAndSessionMs-readMs-prepareMs;
  try{ledger.appendRow([new Date(),user.id,'reveal',magicDay_(),idx+1,crop.characterId,crop.rarity,rev]);}
  catch(error){console.error('Special Seed reveal saved at revision '+rev+'; ledger append failed: '+error);}
  return {ok:true,revision:rev,crop,profile,logged:saved?saved.logged:0,timing:{openMs,lockAndSessionMs,readMs,prepareMs,commitMs,totalMs:Date.now()-started}};
 }finally{lock.releaseLock();}
}
