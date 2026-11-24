const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('retry after a progress write failure does not duplicate answer history',()=>{
 const c=vm.createContext({});
 vm.runInContext(fs.readFileSync('google-apps-script/student-app/Server.gs','utf8'),c);
 const history=[['Event ID']],progress=[['ID','Revision','JSON','Saved at','Seen'],['01',0,'{}',null,'[]']];
 let fail=true;
 const sheet=(rows,name)=>({
  getLastRow:()=>rows.length,
  getRange:(start,col,height,width)=>({
   getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[start+i-1]?.[col+j-1])),
   setValues:values=>{if(name==='_Progress'&&fail){fail=false;throw Error('temporary write failure');}values.forEach((row,i)=>{rows[start+i-1]=row.slice();});}
  })
 });
 c.tab_=(_,name)=>name==='_History'?sheet(history,name):sheet(progress,name);
 const prepared={profile:{id:'01',gold:30},seen:['act_one'],toSave:[['act_one',new Date(),'01','An','Farm','Water','carrot','n','n','Correct',1]]};
 const p={row:2,revision:0};
 assert.throws(()=>c.commitStudentProgress_({}, {id:'01'},p,prepared),/temporary/);
 assert.equal(history.length,2);
 const result=c.commitStudentProgress_({}, {id:'01'},p,prepared);
 assert.equal(result.logged,0);
 assert.equal(history.length,2);
 assert.equal(progress[1][1],1);
});
