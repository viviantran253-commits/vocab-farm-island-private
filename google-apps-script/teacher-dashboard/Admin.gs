/** PRIVATE teacher Sheet sidebar — install in Extensions → Apps Script of YOUR private sheet.
 * Do not deploy this project as a publicly accessible web app.
 * Only people with editor access to the private Sheet can use its custom menu.
 */
const STUDENTS='_Students',PROGRESS='_Progress',HISTORY='_History',HEADERS=['English word','UK IPA','Part of speech','Meaning','Example meaning'];
// Authentication is inside the PRIVATE, Google-account-restricted spreadsheet.
// The teacher sets a six-digit PIN in the dashboard; never put a PIN in GitHub source.
const TEACHER_PIN_KEY='VFI_TEACHER_PIN_HASH';
const TEACHER_SALT_KEY='VFI_TEACHER_PIN_SALT';
const TEACHER_VERSION_KEY='VFI_TEACHER_PIN_VERSION';
const TEACHER_CACHE_TTL=1800;
function onOpen(){SpreadsheetApp.getUi().createMenu('Vocab Farm').addItem('Open Teacher Dashboard','openTeacherDashboard').addToUi();}
function openTeacherDashboard(){SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile('TeacherDashboard').setTitle('Vocab Farm · Teacher').setWidth(390));}
function teacherPinStatus(){return {configured:!!PropertiesService.getScriptProperties().getProperty(TEACHER_PIN_KEY)};}
function teacherPinValid_(pin){
 const props=PropertiesService.getScriptProperties(),hash=props.getProperty(TEACHER_PIN_KEY),salt=props.getProperty(TEACHER_SALT_KEY);
 if(!hash||!salt||!/^[0-9]{6}$/.test(String(pin)))return false;
 const a=sha_(salt,String(pin));let diff=0;for(let i=0;i<hash.length;i++)diff|=hash.charCodeAt(i)^a.charCodeAt(i);return diff===0;
}
function configureTeacherPin(newPin,oldPin){
 newPin=String(newPin||'');if(!/^\d{6}$/.test(newPin))throw Error('Teacher PIN must be exactly 6 digits.');
 const props=PropertiesService.getScriptProperties();
 if(props.getProperty(TEACHER_PIN_KEY)&&!teacherPinValid_(oldPin))throw Error('Current teacher PIN is incorrect.');
 const salt=Utilities.getUuid()+Utilities.getUuid();
 props.setProperties({[TEACHER_SALT_KEY]:salt,[TEACHER_PIN_KEY]:sha_(salt,newPin),[TEACHER_VERSION_KEY]:Utilities.getUuid()});
 // Existing sidebar tokens are invalidated via the PIN version property.
 return {configured:true};
}
function authorizeTeacher(pin){
 const cache=CacheService.getUserCache(),until=Number(cache.get('teacher_lock_until')||0);
 if(until>Date.now())throw Error('Too many attempts. Try again in 15 minutes.');
 if(!teacherPinValid_(pin)){
  let attempts=Number(cache.get('teacher_failed')||0)+1;
  if(attempts>=6){cache.put('teacher_lock_until',String(Date.now()+15*60000),900);attempts=0;}
  cache.put('teacher_failed',String(attempts),900);
  throw Error('Incorrect teacher PIN.');
 }
 cache.remove('teacher_failed');cache.remove('teacher_lock_until');
 const token=Utilities.getUuid()+Utilities.getUuid();
 cache.put('teacher_auth_'+sha_('vfi_teacher',token),PropertiesService.getScriptProperties().getProperty(TEACHER_VERSION_KEY)||'initial',TEACHER_CACHE_TTL);
 return {token,expiresInSeconds:TEACHER_CACHE_TTL};
}
function requireTeacher_(token){
 if(!token||CacheService.getUserCache().get('teacher_auth_'+sha_('vfi_teacher',String(token)))!==(PropertiesService.getScriptProperties().getProperty(TEACHER_VERSION_KEY)||'initial'))throw Error('Teacher session expired. Re-enter your PIN.');
}
function createSheet_(ss,name,header){let s=ss.getSheetByName(name);if(!s){s=ss.insertSheet(name);s.appendRow(header);s.setFrozenRows(1);s.getRange(1,1,1,header.length).setFontWeight('bold').setBackground('#e3f1d9');}return s;}
function sha_(salt,pin){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,salt+':'+pin).map(x=>('0'+((x+256)%256).toString(16)).slice(-2)).join('');}
function setupVocabFarm(teacherToken){requireTeacher_(teacherToken);
 const ss=SpreadsheetApp.getActiveSpreadsheet();
 const accounts=createSheet_(ss,STUDENTS,['Student ID','Display name','PIN salt','PIN hash','Failed attempts','Locked until','PIN version','Updated']);
 createSheet_(ss,PROGRESS,['Student ID','Revision','Progress JSON','Updated','Seen history event IDs']);
 createSheet_(ss,HISTORY,['Event ID','Time','Student ID','Student name','Source','Activity','Word','Submitted answer','Correct answer','Result','Attempt']);
 const existing=accounts.getLastRow()>1?accounts.getRange(2,1,accounts.getLastRow()-1,1).getValues().flat().map(x=>String(x).padStart(2,'0')):[];
 const created=[];
 for(let i=1;i<=10;i++){
  const id=String(i).padStart(2,'0');
  const vocabulary=createSheet_(ss,'Vocab_'+id,HEADERS);
  vocabulary.setColumnWidths(1,5,170);
  if(!existing.includes(id)){
   const pin=String(Math.floor(Math.random()*9000)+1000);const salt=Utilities.getUuid();
   accounts.appendRow([id,'Student '+id,salt,sha_(salt,pin),0,0,1,new Date()]);
   created.push({id,pin});
  }
 }
 accounts.hideColumns(3,2);
 return {created,ready:true,studentCount:10,detail:'Passcodes are shown only once. Record them privately; reset if lost.'};
}
function ensureId_(id){id=String(id||'').padStart(2,'0');if(!/^0[1-9]$|^10$/.test(id))throw Error('Invalid student ID.');return id;}
function accountRow_(ss,id){const s=ss.getSheetByName(STUDENTS);if(!s)throw Error('Run setup first.');const all=s.getDataRange().getValues();for(let i=1;i<all.length;i++)if(String(all[i][0]).padStart(2,'0')===id)return {sheet:s,row:i+1,values:all[i]};throw Error('Student not found.');}
function studentSummary(teacherToken){requireTeacher_(teacherToken);
 const ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss.getSheetByName(STUDENTS))return {needsSetup:true,students:[]};
 const rows=ss.getSheetByName(STUDENTS).getDataRange().getValues().slice(1);
 const saves=ss.getSheetByName(PROGRESS).getDataRange().getValues().slice(1),saved={};for(const v of saves)try{saved[String(v[0]).padStart(2,'0')]=JSON.parse(String(v[2]));}catch(e){}
 const logs=ss.getSheetByName(HISTORY).getDataRange().getValues().slice(1),stats={};
 for(const r of logs){const id=String(r[2]).padStart(2,'0');if(!stats[id])stats[id]={total:0,correct:0,wrong:0,unverified:0};stats[id].total++;if(r[9]==='Correct')stats[id].correct++;else if(r[9]==='Wrong')stats[id].wrong++;else stats[id].unverified++;}
 return {students:rows.map(r=>{const id=String(r[0]).padStart(2,'0'),p=saved[id]||{},vocab=ss.getSheetByName('Vocab_'+id);return {id,name:String(r[1]),level:p.level||1,gold:p.gold||0,xp:p.xpTotal||0,words:vocab?Math.max(0,vocab.getLastRow()-1):0,plotsUnlocked:Array.isArray(p.plots)?p.plots.filter(x=>x.unlocked).length:2,cropsGrowing:Array.isArray(p.plots)?p.plots.filter(x=>!!x.crop).length:0,harvested:Object.values(p.harvest||{}).reduce((a,b)=>a+(Number(b)||0),0),badges:(p.badges||[]).length,...(stats[id]||{total:0,correct:0,wrong:0,unverified:0}),lastSaved:p.savedAt||0};})};
}
function studentHistory(teacherToken,id,max){requireTeacher_(teacherToken);id=ensureId_(id);const ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(HISTORY);if(!sh)return [];const rows=sh.getDataRange().getValues().slice(1).filter(r=>String(r[2]).padStart(2,'0')===id);return rows.slice(-Math.min(500,Number(max)||150)).reverse().map(r=>({time:r[1] instanceof Date?r[1].toISOString():String(r[1]),source:String(r[4]),stage:String(r[5]),word:String(r[6]),answer:String(r[7]),expected:String(r[8]),result:String(r[9]),attempt:Number(r[10])||1}));}
function changeStudentName(teacherToken,id,name){requireTeacher_(teacherToken);id=ensureId_(id);name=String(name||'').trim();if(!name||name.length>28)throw Error('Name must be 1–28 characters.');const ss=SpreadsheetApp.getActiveSpreadsheet(),a=accountRow_(ss,id);a.sheet.getRange(a.row,2).setValue(name);a.sheet.getRange(a.row,8).setValue(new Date());return {id,name};}
function resetStudentPIN(teacherToken,id,newPin){requireTeacher_(teacherToken);id=ensureId_(id);const pin=newPin?String(newPin):String(Math.floor(Math.random()*9000)+1000);if(!/^\d{4}$/.test(pin))throw Error('Passcode must be exactly four digits.');const ss=SpreadsheetApp.getActiveSpreadsheet(),a=accountRow_(ss,id),salt=Utilities.getUuid();a.sheet.getRange(a.row,3,1,6).setValues([[salt,sha_(salt,pin),0,0,Number(a.values[6]||1)+1,new Date()]]);return {id,pin,message:'Save this code privately. Existing student sessions have been invalidated.'};}

/** Reset one student's game state and answer log while keeping their name, PIN and vocabulary.
 * The private archive stores the original rows so the teacher can recover them manually.
 */
function resetStudentProgress(teacherToken,id,typedId){
 requireTeacher_(teacherToken);id=ensureId_(id);
 if(String(typedId||'').trim()!==id)throw Error('Type the selected student ID to confirm the reset.');
 const ss=SpreadsheetApp.getActiveSpreadsheet(),account=accountRow_(ss,id),name=String(account.values[1]);
 const progress=ss.getSheetByName(PROGRESS),history=ss.getSheetByName(HISTORY);
 if(!progress||!history)throw Error('Run Set up Sheets first.');
 const progressRows=progress.getDataRange().getValues();
 let progressRow=0,oldRevision=0,oldProgress=null;
 for(let i=1;i<progressRows.length;i++)if(String(progressRows[i][0]).padStart(2,'0')===id){progressRow=i+1;oldRevision=Number(progressRows[i][1])||0;oldProgress=progressRows[i];break;}
 const historyRows=history.getDataRange().getValues(),historyIndexes=[],oldHistory=[];
 for(let i=1;i<historyRows.length;i++)if(String(historyRows[i][2]).padStart(2,'0')===id){historyIndexes.push(i+1);oldHistory.push({row:i+1,values:historyRows[i]});}
 const archive=createSheet_(ss,'_ResetArchive',['Reset ID','Reset at','Student ID','Student name','Source sheet','Original row','A','B','C','D','E','F','G','H','I','J','K']);
 const resetId=Utilities.getUuid(),resetAt=new Date();
 const archived=[];
 if(oldProgress)archived.push([resetId,resetAt,id,name,PROGRESS,progressRow,...oldProgress,...Array(11-oldProgress.length).fill('')]);
 for(const entry of oldHistory)archived.push([resetId,resetAt,id,name,HISTORY,entry.row,...entry.values,...Array(11-entry.values.length).fill('')]);
 if(!archived.length)archived.push([resetId,resetAt,id,name,'No previous progress',0,...Array(11).fill('')]);
 for(let i=0;i<archived.length;i+=200)archive.getRange(archive.getLastRow()+1,1,Math.min(200,archived.length-i),17).setValues(archived.slice(i,i+200));
 // Invalidate open student sessions without changing the four-digit passcode.
 account.sheet.getRange(account.row,7,1,2).setValues([[Number(account.values[6]||1)+1,resetAt]]);
 const fresh={version:2,id,name,gold:30,level:1,xp:0,xpTotal:0,seeds:{carrot:2},harvest:{},
   plots:Array.from({length:10},(_,i)=>({unlocked:i<2,crop:null})),orders:[],ordersExpire:0,
   lastWords:[],history:[],sales:[],badges:[],daily:{day:'',answers:{},correct:0},weekly:{week:'',answers:{},correct:0},
   position:{x:880,y:495},settings:{fastDemo:false},savedAt:Date.now()};
 const record=[id,oldRevision+1,JSON.stringify(fresh),resetAt,'[]'];
 if(progressRow)progress.getRange(progressRow,1,1,5).setValues([record]);else progress.appendRow(record);
 for(let i=historyIndexes.length-1;i>=0;){let end=historyIndexes[i],start=end;i--;while(i>=0&&historyIndexes[i]===start-1){start=historyIndexes[i];i--;}history.deleteRows(start,end-start+1);}
 return {id,name,archivedAnswers:oldHistory.length,resetId};
}

/** Sidebar-only teacher controls. Both calls require the teacher PIN session. */
function teacherVocabSheetLink(teacherToken,id){
 requireTeacher_(teacherToken);id=ensureId_(id);
 const ss=SpreadsheetApp.getActiveSpreadsheet(),tab=ss.getSheetByName('Vocab_'+id);
 if(!tab)throw Error('Create the 10 student tabs first.');
 return {url:ss.getUrl()+'#gid='+tab.getSheetId(),tab:tab.getName()};
}
