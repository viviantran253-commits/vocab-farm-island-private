const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('vocabulary cache avoids repeated Sheet reads and force reload reads new words',()=>{
 const saved=new Map(),cache={get:key=>saved.get(key),put:(key,value)=>saved.set(key,value)};
 const blob=bytes=>({getBytes:()=>bytes,getDataAsString:()=>Buffer.from(bytes).toString('utf8')});
 const c=vm.createContext({
  Buffer,
  CacheService:{getScriptCache:()=>cache},
  Utilities:{newBlob:value=>blob(typeof value==='string'?Buffer.from(value):value),gzip:x=>x,ungzip:x=>x,
   base64Encode:bytes=>Buffer.from(bytes).toString('base64'),base64Decode:text=>Buffer.from(text,'base64')}
 });
 vm.runInContext(fs.readFileSync('google-apps-script/student-app/Server.gs','utf8'),c);
 let reads=0,meaning='cà rốt';
 c.tab_=()=>({getLastRow:()=>2,getRange:()=>({getDisplayValues:()=>{reads++;return [['English','IPA','POS','Meaning','Example'],['carrot','/ˈkær.ət/','n',meaning,'A carrot.']];}})});
 assert.equal(c.readWords_({},'01')[0].meaning,'cà rốt');
 meaning='cà rốt mới';
 assert.equal(c.readWords_({},'01')[0].meaning,'cà rốt');
 assert.equal(reads,1);
 assert.equal(c.readWords_({},'01',true)[0].meaning,'cà rốt mới');
 assert.equal(reads,2);
});
