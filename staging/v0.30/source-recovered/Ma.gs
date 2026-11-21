/** Vocab Farm Island v0.13: PUBLIC STUDENT web app (separate Apps Script project).
 * Deploy as: Web app; Execute as: Me; Who has access: Anyone.
 * Set Script Properties: SHEET_ID (private Google Sheet ID),
 * ASSET_BASE_URL (https://USERNAME.github.io/REPO/ including trailing slash).
 * NEVER paste a password, teacher PIN, or OAuth token into this file.
 * WARNING: This classroom prototype does not provide tamper-proof grading/economy.
 */
const ACCOUNTS_TAB = '_Students';
const PROGRESS_TAB = '_Progress';
const HISTORY_TAB = '_History';
const VOCAB_PREFIX = 'Vocab_';
const SESSION_TTL = 21600;  // 6 hours, CacheService maximum

function include(filename) { return HtmlService.createTemplateFromFile(filename).getRawContent(); }
function doGet() {
  const tpl = HtmlService.createTemplateFromFile('StudentGame');
  let base = PropertiesService.getScriptProperties().getProperty('ASSET_BASE_URL') || '';
  if (!/^https:\/\//.test(base)) return HtmlService.createHtmlOutput('<h2>Teacher setup needed</h2><p>Set ASSET_BASE_URL in Script Properties to the GitHub Pages URL for your game assets.</p>');
  tpl.assetBaseUrl = base.replace(/\/*$/, '/');
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
  return {version:2,id,name,gold:30,level:1,xp:0,xpTotal:0,seeds:{carrot:2},harvest:{},
    plots:Array.from({length:10},(_,i)=>({unlocked:i<2,crop:null})),orders:[],ordersExpire:0,
    lastWords:[],history:[],sales:[],badges:[],daily:{day:'',answers:{},correct:0},weekly:{week:'',answers:{},correct:0},
    position:{x:880,y:495},settings:{fastDemo:false},savedAt:Date.now()};
}
function readProgress_(ss,id,name){
 const sh=tab_(ss,PROGRESS_TAB),data=sh.getDataRange().getValues();
 for(let i=1;i<data.length;i++)if(String(data[i][0]).padStart(2,'0')===id){
  const profile=JSON.parse(String(data[i][2]||'{}'));
  profile.name=name;profile.id=id;delete profile.landTax;
  return {row:i+1,revision:Number(data[i][1])||0,profile,seen:JSON.parse(String(data[i][4]||'[]'))};
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
  // A teacher reset can invalidate the session while a save is queued.
  requireSession_(session);
  const p=readProgress_(ss,id,user.name);
  if(Number(expectedRevision)!==p.revision)return {conflict:true,revision:p.revision};
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
      String(e.word||'').slice(0,120),answer.slice(0,200),
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