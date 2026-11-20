/* Vocab Farm Island v0.13
   Offline demo or optional Google Apps Script student server.
   Never place teacher privileges or Google credentials here. */
(() => {
'use strict';
const MAP = window.FARM_MAP;
const ASSET = 'assets/';
const ONLINE = !!(window.google && window.google.script && window.google.script.run);
const ACTION_DURATION_MS = 2000;
const CROP_DATA = [
  {id:'carrot', name:'Carrot', vi:'Cà rốt', seed:8, sale:18, xp:4, mins:6, level:1},
  {id:'lettuce', name:'Lettuce', vi:'Rau xà lách', seed:12, sale:24, xp:5, mins:7.5, level:1},
  {id:'wheat', name:'Wheat', vi:'Lúa mì', seed:16, sale:31, xp:6, mins:9, level:2},
  {id:'tomato', name:'Tomato', vi:'Cà chua', seed:24, sale:43, xp:7, mins:10.5, level:3},
  {id:'strawberry', name:'Strawberry', vi:'Dâu tây', seed:34, sale:56, xp:8, mins:12, level:4},
  {id:'corn', name:'Corn', vi:'Ngô', seed:43, sale:68, xp:9, mins:13.5, level:5},
  {id:'pumpkin', name:'Pumpkin', vi:'Bí ngô', seed:60, sale:90, xp:10, mins:15, level:7},
  {id:'watermelon', name:'Watermelon', vi:'Dưa hấu', seed:74, sale:109, xp:11, mins:16.5, level:9},
  {id:'pineapple', name:'Pineapple', vi:'Dứa', seed:90, sale:130, xp:12, mins:18, level:12}
];
const CROPS = Object.fromEntries(CROP_DATA.map(c => [c.id,c]));
const STAGES = ['planted','watered','tended','fertilized','mature'];
const ACTIONS = ['Water','Tend','Fertilize','Harvest'];
const ACTION_VI = ['Tưới cây','Chăm sóc cây','Bón phân','Thu hoạch'];
const POS = [{v:'n',label:'noun (n)'},{v:'v',label:'verb (v)'},{v:'adj',label:'adjective (adj)'},{v:'adv',label:'adverb (adv)'}];
// Levels and one-time purchase prices for the eight additional plots.
// Plots 1 and 2 are free. Open sequentially; no gold reserve is required.
const PLOT_UNLOCKS = [
  {level:1, price:0},{level:1, price:0},
  {level:2, price:100},{level:4, price:200},{level:6, price:300},
  {level:8, price:400},{level:10, price:500},{level:12, price:600},
  {level:15, price:700},{level:20, price:800}
];
const STORAGE_PREFIX = 'vocabFarmOffline_v2_';
const BANK_KEY = 'vocabFarmOffline_customBank_v1';
const DAY_MS = 86400000;
const ICT_OFFSET_MS = 7*3600000; // Vietnam UTC+07, no DST
const RANKS = [
 ['Novice','Tay mơ'],['Apprentice','Học việc'],['Junior Farmer','Nông dân tập sự'],
 ['Gardener','Người làm vườn'],['Skilled Farmer','Nông dân lành nghề'],
 ['Farm Expert','Chuyên gia nông trại'],['Master Farmer','Bậc thầy nông trại'],
 ['Harvest Champion','Nhà vô địch thu hoạch'],['Island Guardian','Người bảo vệ hòn đảo'],
 ['Island Legend','Huyền thoại đảo xanh']
];
const rankForLevel=level=>({index:Math.min(9,Math.max(0,Math.floor((level-1)/5))),name:RANKS[Math.min(9,Math.max(0,Math.floor((level-1)/5)))][0],vi:RANKS[Math.min(9,Math.max(0,Math.floor((level-1)/5)))][1]});
// Pin schedules to Vietnam time, not the clock time zone set by a student's device.
const ictDateKey=(ts=Date.now())=>new Date(ts+ICT_OFFSET_MS).toISOString().slice(0,10);
const ictMidnight=()=>Math.floor((Date.now()+ICT_OFFSET_MS)/DAY_MS)*DAY_MS-ICT_OFFSET_MS;
const nextDailyReset=()=>ictMidnight()+DAY_MS;
const ictWeekStart=()=>{const day=(new Date(Date.now()+ICT_OFFSET_MS).getUTCDay()+6)%7;return ictMidnight()-day*DAY_MS;};
const weekKey=()=>ictDateKey(ictWeekStart());
const nextWeeklyReset=()=>ictWeekStart()+7*DAY_MS;
const countdownLong=ms=>{const seconds=Math.max(0,Math.floor(ms/1000)),days=Math.floor(seconds/86400),h=Math.floor(seconds%86400/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return (days?days+'d ':'')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');};
const nextLockedPlot=()=>state.plots.findIndex(p=>!p.unlocked);
const canExpand=i=>i===nextLockedPlot()&&state.level>=PLOT_UNLOCKS[i].level&&state.gold>=PLOT_UNLOCKS[i].price;
const ORDER_MS = 45 * 60000;
const SAMPLE_WORDS = [
  ['planet','/ˈplæn.ɪt/','n','hành tinh','Earth is a planet. (Trái Đất là một hành tinh.)'],
  ['plane','/pleɪn/','n','máy bay','The plane is flying. (Máy bay đang bay.)'],
  ['plant','/plɑːnt/','n','cây','This plant needs water. (Cây này cần nước.)'],
  ['platform','/ˈplæt.fɔːm/','n','nền tảng','The platform helps students learn. (Nền tảng giúp học sinh học tập.)'],
  ['library','/ˈlaɪ.brər.i/','n','thư viện','I read books at the library. (Tôi đọc sách ở thư viện.)'],
  ['island','/ˈaɪ.lənd/','n','hòn đảo','We live on an island. (Chúng tôi sống trên một hòn đảo.)'],
  ['bridge','/brɪdʒ/','n','cây cầu','They walk across the bridge. (Họ đi qua cây cầu.)'],
  ['discover','/dɪˈskʌv.ə/','v','khám phá','We discover new places. (Chúng tôi khám phá những nơi mới.)'],
  ['beautiful','/ˈbjuː.tɪ.fəl/','adj','xinh đẹp','The garden is beautiful. (Khu vườn rất đẹp.)'],
  ['carefully','/ˈkeə.fəl.i/','adv','một cách cẩn thận','She listens carefully. (Cô ấy lắng nghe một cách cẩn thận.)'],
  ['invention','/ɪnˈven.ʃən/','n','phát minh','The telephone was an invention. (Điện thoại từng là một phát minh.)'],
  ['environment','/ɪnˈvaɪ.rən.mənt/','n','môi trường','We should protect the environment. (Chúng ta nên bảo vệ môi trường.)'],
  ['protect','/prəˈtekt/','v','bảo vệ','Trees protect the soil. (Cây cối bảo vệ đất.)'],
  ['knowledge','/ˈnɒl.ɪdʒ/','n','kiến thức','Reading gives us knowledge. (Đọc sách mang lại cho chúng ta kiến thức.)'],
  ['creative','/kriˈeɪ.tɪv/','adj','sáng tạo','My friend is creative. (Bạn tôi rất sáng tạo.)'],
  ['organise','/ˈɔː.ɡən.aɪz/','v','tổ chức','We organise a school event. (Chúng tôi tổ chức một sự kiện ở trường.)'],
  ['generous','/ˈdʒen.ər.əs/','adj','hào phóng','He is generous with his time. (Anh ấy hào phóng dành thời gian của mình.)'],
  ['quickly','/ˈkwɪk.li/','adv','một cách nhanh chóng','The girl walks quickly. (Cô bé đi nhanh.)'],
  ['friendly','/ˈfrend.li/','adj','thân thiện','Our neighbours are friendly. (Hàng xóm của chúng tôi rất thân thiện.)'],
  ['community','/kəˈmjuː.nɪ.ti/','n','cộng đồng','Our community is helpful. (Cộng đồng chúng tôi rất hay giúp đỡ.)'],
  ['solution','/səˈluː.ʃən/','n','giải pháp','We found a solution. (Chúng tôi đã tìm ra một giải pháp.)'],
  ['technology','/tekˈnɒl.ə.dʒi/','n','công nghệ','Technology can support education. (Công nghệ có thể hỗ trợ giáo dục.)'],
  ['interesting','/ˈɪn.trə.stɪŋ/','adj','thú vị','The story is interesting. (Câu chuyện thật thú vị.)'],
  ['practise','/ˈpræk.tɪs/','v','luyện tập','I practise English every day. (Tôi luyện tiếng Anh mỗi ngày.)'],
  ['culture','/ˈkʌl.tʃə/','n','văn hóa','We learn about local culture. (Chúng tôi tìm hiểu văn hóa địa phương.)'],
  ['adventure','/ədˈven.tʃə/','n','cuộc phiêu lưu','Our adventure begins today. (Cuộc phiêu lưu của chúng tôi bắt đầu hôm nay.)'],
  ['possible','/ˈpɒs.ə.bəl/','adj','có thể thực hiện được','It is possible to learn every day. (Có thể học mỗi ngày.)'],
  ['promise','/ˈprɒm.ɪs/','v','hứa','I promise to help you. (Tôi hứa sẽ giúp bạn.)'],
  ['improve','/ɪmˈpruːv/','v','cải thiện','Practice can improve your English. (Luyện tập có thể cải thiện tiếng Anh của bạn.)'],
  ['patiently','/ˈpeɪ.ʃənt.li/','adv','một cách kiên nhẫn','She waits patiently. (Cô ấy chờ đợi một cách kiên nhẫn.)']
].map((v,i)=>({id:`sample_${i}`,english:v[0],ipa:v[1],pos:v[2],meaning:v[3],example:v[4]}));
const SPECIAL_DISTRACTORS = {planet:{en:['plane','plant','platform'],meaning:['máy bay','cây','nền tảng']},library:{en:['liberty','laboratory','literary']},beautiful:{en:['bountiful','beauty','careful']},protect:{en:['project','protest','produce']}};
const $ = id => document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const formatSeconds=ms=> {const s=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const now=()=>Date.now();
const dateKey=(offset=0)=>ictDateKey(Date.now()+offset*DAY_MS);
const shuffled=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b};
const posText=code=>({'n':'noun (n)','v':'verb (v)','adj':'adjective (adj)','adv':'adverb (adv)'})[code]||code;
const slug=s=>String(s).trim().toLowerCase();
const img=(path,cls='',alt='')=>`<img ${cls?`class="${cls}"`:''} src="${escapeHTML(path)}" alt="${escapeHTML(alt)}">`;
const cropIcon=(id,kind='harvested')=>`${ASSET}items/${kind==='seed'?'seeds':'harvested'}/64/${id}_${kind==='seed'?'seeds':'harvest'}.png`;
const coinIcon=`${ASSET}items/currency/64/gold_coin.png`;
const goldIconHTML=()=>`<img class="coin-inline" src="${coinIcon}" alt="gold">`;
const xpNeed=level=>50+25*(level-1);
const CROP_PLOT=idx=>MAP.farm.plots[idx];
const DAY_SEED=(day,slot)=>{
  let h=2166136261;for(const c of `${day}-${slot}`)h=Math.imul(h ^ c.charCodeAt(0),16777619);return h>>>0;
};
const deterministicShuffle=(a,seed)=>{let x=seed>>>0;const arr=[...a];for(let i=arr.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;const j=(x>>>0)%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr};

let bank=[...SAMPLE_WORDS];
let state=null;
let playing=false;
let activeModal='';
let qContext=null;
let modalAction=null;
let images={};
let assetsLoading=0;
let player={x:880,y:495,dir:'down',moving:false,frame:0,animMs:0};
let camera={x:0,y:0};
let zoom=.9,zoomPreference=null,viewW=window.innerWidth,viewH=window.innerHeight,dpr=1;
let keys=new Set();let touchDirs=new Set();let path=[];let autoAction=null;
let lastTime=0,uiLast=0,saveLast=0;
let debugPath=false;
let visitorMessage='';
let actionMotion=null;
let onlineToken=null,onlineDirty=false,onlineBusy=false,onlineRevision=0,onlineSaveAt=0,onlineErrorAt=0;
let onlinePendingEvents=[];
function serverCall(method,...args){return new Promise((resolve,reject)=>{
  if(!ONLINE)return reject(Error('Not connected to Apps Script'));
  const runner=google.script.run.withSuccessHandler(resolve).withFailureHandler(reject);
  runner[method](...args);
});}
function makeHistoryId(){return 'ev_'+now()+'_'+Math.random().toString(36).slice(2,12);}
function queueOnlineSave(){if(!ONLINE||!onlineToken)return;onlineDirty=true;}
async function flushOnline(){
 if(!ONLINE||!onlineToken||!state||!onlineDirty||onlineBusy)return;
 onlineBusy=true;onlineDirty=false;
 const token=onlineToken,events=onlinePendingEvents.slice(0,50);
 const copy=JSON.parse(JSON.stringify(state));
 // Keep long-term answer history in the server's _History rows, not in one large Sheet cell.
 copy.history=copy.history.slice(-40);
 copy.sales=(copy.sales||[]).slice(-35);
 copy.lastWords=(copy.lastWords||[]).slice(-20);
 const rev=onlineRevision;
 try{
  const response=await serverCall('studentSave',token,JSON.stringify(copy),events,rev);
  if(response?.conflict){onlineDirty=true;toast('Another device changed this account. Log in again to avoid losing progress.',true);return;}
  onlineRevision=response.revision;
  onlinePendingEvents=onlinePendingEvents.filter(x=>!events.includes(x));
  // Never discard pending events that were not included in the current server batch.
  if(onlinePendingEvents.length)onlineDirty=true;
  onlineSaveAt=now();
 }catch(err){onlineDirty=true;if(now()-onlineErrorAt>10000){toast('Online save failed. Check your connection.',true);onlineErrorAt=now();}}
 finally{onlineBusy=false;}
}
const ACTION_ENTER_MS = 240;
const ACTION_EXIT_MS = 300;
function beginTimedAction(kind,onComplete,plotIndex=null){
 if(actionMotion)return;
 closeModal();player.moving=false;path=[];autoAction=null;keys.clear();touchDirs.clear();
 const text=({plant:'Planting · Đang gieo hạt',water:'Watering · Đang tưới cây',tend:'Tending · Đang chăm sóc',fertilize:'Fertilizing · Đang bón phân',harvest:'Harvesting · Đang thu hoạch'})[kind]||kind;
 const plot=plotIndex===null?null:CROP_PLOT(plotIndex);
 const center=plot?{x:plot.x+plot.width/2,y:plot.y+plot.height/2+7}:{x:player.x,y:player.y};
 const exit=plot?nearestValid({x:center.x,y:plot.y+plot.height+28}):{...center};
 // The player is already near the plot in normal play. Snap to the adjacent path
 // only if this action was opened from a remote menu; never walk across an ocean.
 const from={x:player.x,y:player.y};
 if(plot&&Math.hypot(from.x-center.x,from.y-center.y)>160){from.x=exit.x;from.y=exit.y;player.x=exit.x;player.y=exit.y;}
 const started=performance.now();
 actionMotion={kind,plotIndex,started,phase:'enter',from,center,exit,onComplete};
 const banner=$('farmActionBanner');banner.classList.remove('hidden');$('farmActionLabel').textContent=text;
 $('farmActionBar').style.width='0%';
}
function advanceFarmAction(t){
 const a=actionMotion;if(!a)return;
 const elapsed=t-a.started;
 const lerp=(from,to,r)=>from+(to-from)*r;
 if(elapsed<ACTION_ENTER_MS){
  const r=Math.min(1,elapsed/ACTION_ENTER_MS);
  a.phase='enter';player.x=lerp(a.from.x,a.center.x,r);player.y=lerp(a.from.y,a.center.y,r);
  player.dir='up';$('farmActionBar').style.width='0%';return;
 }
 if(elapsed<ACTION_ENTER_MS+ACTION_DURATION_MS){
  a.phase='work';player.x=a.center.x;player.y=a.center.y;player.moving=false;
  $('farmActionBar').style.width=Math.min(100,100*(elapsed-ACTION_ENTER_MS)/ACTION_DURATION_MS)+'%';return;
 }
 if(elapsed<ACTION_ENTER_MS+ACTION_DURATION_MS+ACTION_EXIT_MS){
  a.phase='exit';const r=(elapsed-ACTION_ENTER_MS-ACTION_DURATION_MS)/ACTION_EXIT_MS;
  player.x=lerp(a.center.x,a.exit.x,r);player.y=lerp(a.center.y,a.exit.y,r);
  player.dir='down';$('farmActionBar').style.width='100%';return;
 }
 player.x=a.exit.x;player.y=a.exit.y;player.moving=false;player.dir='down';
 actionMotion=null;$('farmActionBanner').classList.add('hidden');
 a.onComplete();
}


function loadBank(){
  try{let custom=JSON.parse(localStorage.getItem(BANK_KEY)||'[]');if(Array.isArray(custom))bank=[...SAMPLE_WORDS,...custom.filter(w=>w&&w.english&&w.meaning&&w.pos)];}catch(e){console.warn('Unable to read local vocabulary:',e);}
}
function newProfile(slot){return {
  version:2,id:slot,name:`Student ${slot}`,gold:30,level:1,xp:0,xpTotal:0,
  seeds:{carrot:2},harvest:{},plots:MAP.farm.plots.map((p,i)=>({unlocked:i<2,crop:null})),
  orders:[],ordersExpire:0,lastWords:[],history:[],sales:[],badges:[],
  daily:{day:dateKey(),answers:{},correct:0},weekly:{week:weekKey(),answers:{},correct:0},
  position:{x:880,y:495}, settings:{fastDemo:false}, savedAt:now()
};}
function readProfile(slot){
  try{let saved=JSON.parse(localStorage.getItem(STORAGE_PREFIX+slot)||'null');if(saved&&saved.id===slot&&saved.version===2&&Array.isArray(saved.plots)&&saved.plots.length===10){delete saved.landTax;return saved;}}
  catch(e){console.error('Invalid save file:',e)}
  return newProfile(slot);
}
function save(){if(!state)return;state.position={x:Math.round(player.x),y:Math.round(player.y)};state.savedAt=now();if(ONLINE){queueOnlineSave();return;}try{localStorage.setItem(STORAGE_PREFIX+state.id,JSON.stringify(state));}catch(e){toast('Browser storage is full. Please try another browser or back up this profile.',true)}}
function syncDaily(){
 if(!state)return false;
 let changed=false;
 const day=dateKey(),week=weekKey();
 // Expanded plots have no recurring charges.
 if(Object.prototype.hasOwnProperty.call(state,'landTax')){delete state.landTax;changed=true;}
 if(!state.daily||state.daily.day!==day){state.daily={day,answers:{},correct:0};changed=true;}
 if(!state.weekly||state.weekly.week!==week){state.weekly={week,answers:{},correct:0};changed=true;}
 if(changed)save();
 return changed;
}
function initOrders(){if(!state)return;if(!state.orders.length||now()>=state.ordersExpire){state.orders=Array.from({length:3},(_,i)=>makeOrder(i));state.ordersExpire=now()+ORDER_MS;save();}}
function makeOrder(i){const options=CROP_DATA.filter(c=>c.level<=state.level);const amount=Math.min(3,Math.max(1,options.length));const selected=shuffled(options).slice(0,Math.min(amount,1+(i%3)));return {id:`ord_${now()}_${i}_${Math.floor(Math.random()*10000)}`,items:selected.map((c,n)=>({id:c.id,qty:1+(Math.floor(Math.random()*3))})),fulfilled:false};}
function earnXP(n){state.xpTotal+=n;state.xp+=n;let lvls=0;while(state.xp>=xpNeed(state.level)&&lvls<10000){state.xp-=xpNeed(state.level);state.level++;lvls++;}if(lvls){toast(`⭐ Level up! You're now Level ${state.level}!`);checkBadges();}}
function checkBadges(){const earned=state.badges;const farmCorrect=state.history.filter(x=>x.source==='Farm'&&x.correct).length;
  const weekly=state.weekly?.correct||0;
  const awards=[['daily',state.daily.correct>=5,'Daily challenge badge earned!'],['weekly',weekly>=7,'Weekly challenge badge earned!'],['vocabulary',farmCorrect>=50,'Vocabulary mastery badge earned!'],['level',state.level>=5,'Level milestone badge earned!']];
  for(const [id,condition,msg] of awards){if(condition&&!earned.includes(id)){earned.push(id);toast('🏅 '+msg)}}
}
function chooseWord(){if(ONLINE&&!bank.length)return null;const recent=new Set(state.lastWords.slice(-7));const wrong=new Map();for(const h of state.history.slice(-150)){if(!h.correct)wrong.set(h.wordId,(wrong.get(h.wordId)||0)+1)}
 const pool=bank.map(w=>({w,weight:Math.max(.2,1+(wrong.get(w.id)||0)*.7-(recent.has(w.id)?1.5:0))}));let total=pool.reduce((t,p)=>t+p.weight,0),r=Math.random()*total;
 for(const p of pool){r-=p.weight;if(r<=0){state.lastWords.push(p.w.id);state.lastWords=state.lastWords.slice(-25);return p.w.id}}
 return bank[0].id;
}
function wordById(id){return bank.find(w=>w.id===id)||SAMPLE_WORDS.find(w=>w.id===id)||SAMPLE_WORDS[0]}
function logAnswer(word,source,stage,answer,correct,attempt){state.history.push({time:now(),source,stage,wordId:word.id,word:word.english,answer,expected:word.meaning,correct,attempt});if(state.history.length>3000)state.history=state.history.slice(-3000);checkBadges()}

function loadImage(path){if(images[path])return images[path];const i=new Image();images[path]=i;i.src=path;i.onload=()=>{assetsLoading++;};i.onerror=()=>{console.warn('Missing image',path)};return i;}
function asset(path){return loadImage(path)}
function drawImage(ctx,path,x,y,w,h){const im=asset(path);if(im.complete&&im.naturalWidth>0)ctx.drawImage(im,x,y,w,h)}
function preload(){const paths=[MAP.layers.background,...MAP.layers.buildings.map(b=>b.asset),...MAP.foreground_overlays.map(o=>o.asset),
 ...['girl_walk_down','girl_walk_up','girl_walk_left','girl_walk_right','girl_idle_4dir','girl_plant','girl_water','girl_tend','girl_fertilize','girl_harvest'].map(s=>`assets/characters/girl/${s}.png`),
 ...['plot_tilled','plot_seeded','plot_watered','plot_fertilized','plot_locked'].map(s=>`assets/plots/${s}.png`),
 ...CROP_DATA.flatMap(c=>STAGES.map((v,i)=>`assets/crops/${c.id}/${c.id}_0${i}_${v}.png`))];paths.forEach(loadImage);}

const canvas=$('gameCanvas');const ctx=canvas.getContext('2d',{alpha:false});
function resize(){const rc=canvas.getBoundingClientRect();viewW=Math.max(1,rc.width);viewH=Math.max(1,rc.height);dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(viewW*dpr);canvas.height=Math.round(viewH*dpr);
 const base=clamp(viewW/1450,.72,1.13);
 zoom=zoomPreference===null?Math.min(base,viewH<580?.84:base):clamp(zoomPreference,mapFitZoom(),2.3);
 updateZoomLabel();}
function mapFitZoom(){return Math.min(viewW/MAP.world.width,viewH/MAP.world.height);}
function centeredCamera(value,worldExtent,visibleExtent){
 const max=worldExtent-visibleExtent;
 return max<=0?max/2:clamp(value,0,max);
}
function setZoom(v){
 zoomPreference=clamp(v,mapFitZoom(),2.3);zoom=zoomPreference;
 // Fit snaps to the exact centered world, no drifting toward a clamped corner.
 if(Math.abs(zoom-mapFitZoom())<0.00001){
   camera.x=(MAP.world.width-viewW/zoom)/2;
   camera.y=(MAP.world.height-viewH/zoom)/2;
 }
 updateZoomLabel();
}
function updateZoomLabel(){const label=$('zoomValue');if(label)label.textContent=Math.round(zoom*100)+'%';}

function inPolygon(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
 const a=poly[i],b=poly[j];if((a[1]>p.y)!==(b[1]>p.y)&&(p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0]))inside=!inside;}return inside;}
function insideRect(x,y,r){return x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3]}
function walkable(x,y){if(x<15||y<15||x>MAP.world.width-15||y>MAP.world.height-15)return false;
 const land=inPolygon({x,y},MAP.land_regions.main_island.polygon)||inPolygon({x,y},MAP.land_regions.shop_island.polygon)||insideRect(x,y,[1294,415,240,146]);
 if(!land)return false;
 // Solid building footprints. The girl stops outside the door to interact.
 const blocks=[[762,175,202,204],[1645,282,241,217],[133,955,208,227]];
 return !blocks.some(([bx,by,bw,bh])=>x>bx&&x<bx+bw&&y>by&&y<by+bh);
}
function canStand(x,y){return [[-7,0],[7,0],[0,-4],[0,5]].every(([dx,dy])=>walkable(x+dx,y+dy));}
function nearestValid(pos){if(canStand(pos.x,pos.y))return pos;for(let r=16;r<=160;r+=16)for(let a=0;a<16;a++){const t=2*Math.PI*a/16,p={x:pos.x+Math.cos(t)*r,y:pos.y+Math.sin(t)*r};if(canStand(p.x,p.y))return p;}return {x:880,y:495};}
const cellSize=24;
function toCell(v){return Math.floor(v/cellSize)};
function cellPoint(cx,cy){return {x:cx*cellSize+cellSize/2,y:cy*cellSize+cellSize/2}};
function pathfind(start,end){const dest=nearestValid(end);const cols=Math.ceil(MAP.world.width/cellSize),rows=Math.ceil(MAP.world.height/cellSize);
 const sx=toCell(start.x),sy=toCell(start.y),gx=toCell(dest.x),gy=toCell(dest.y);
 const startN=sy*cols+sx,goalN=gy*cols+gx;let open=[{id:startN,x:sx,y:sy,g:0,f:0}],best=new Map([[startN,0]]),parents=new Map(),closed=new Set();const steps=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];let max=8000;
 while(open.length&&max-->0){let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;let cur=open.splice(bi,1)[0];if(closed.has(cur.id))continue;
 if(cur.id===goalN){let out=[dest];let id=goalN;while(id!==startN){const x=id%cols,y=Math.floor(id/cols);out.push(cellPoint(x,y));id=parents.get(id);if(id===undefined)break;}out.reverse();return compressPath(out);}
 closed.add(cur.id);for(const [dx,dy] of steps){const nx=cur.x+dx,ny=cur.y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const id=ny*cols+nx;if(closed.has(id))continue;const np=cellPoint(nx,ny);if(!canStand(np.x,np.y))continue;
 if(dx&&dy){const p1=cellPoint(cur.x+dx,cur.y),p2=cellPoint(cur.x,cur.y+dy);if(!canStand(p1.x,p1.y)||!canStand(p2.x,p2.y))continue;}
 const g=cur.g+(dx&&dy?1.414:1);if(g>=(best.get(id)??Infinity))continue;best.set(id,g);parents.set(id,cur.id);const h=Math.hypot(nx-gx,ny-gy);open.push({id,x:nx,y:ny,g,f:g+h*1.04});}
 }
 return null;
}
function lineClear(a,b){const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/12);for(let i=1;i<steps;i++){const p={x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps};if(!canStand(p.x,p.y))return false;}return true}
function compressPath(points){if(points.length<2)return points;const out=[points[0]];let from=0;while(from<points.length-1){let until=from+1;for(let j=from+2;j<points.length;j++){if(lineClear(points[from],points[j]))until=j;else break;}out.push(points[until]);from=until;}return out.slice(1)}
function goTo(pos,onArrival){if(!playing)return;const target=nearestValid(pos);const start={x:player.x,y:player.y};let route=null;
 // Guide travel across the wooden bridge instead of diagonally stepping onto water.
 const mainToShop=start.x<1440&&target.x>1550;
 const shopToMain=start.x>1550&&target.x<1440;
 if(mainToShop||shopToMain){
   const waypoints=mainToShop?[{x:1324,y:485},{x:1511,y:485}]:[{x:1511,y:485},{x:1324,y:485}];
   let sections=[...waypoints,target],from=start,combined=[],valid=true;
   for(const to of sections){const segment=pathfind(from,to);if(!segment){valid=false;break;}combined.push(...segment);from=to;}
   if(valid)route=combined;
 }
 if(!route)route=pathfind(start,target);
 if(route&&route.length){path=route;autoAction=onArrival||null;return true;}
 toast('No walking route found. Try a nearby spot.',true);return false;
}
function routeTo(what,idx=null){closeModal();let pos;
 if(what==='house')pos={x:880,y:470};
 if(what==='shop')pos={x:1760,y:565};
 if(what==='harbour')pos={x:402,y:933};
 if(what==='farm'){const selected=state.plots.findIndex((p,i)=>p.unlocked&&p.crop&&isDue(p.crop))>=0?state.plots.findIndex(p=>p.unlocked&&p.crop&&isDue(p.crop)):state.plots.findIndex(p=>p.unlocked&&!p.crop);idx=selected>=0?selected:0;what='plot';}
 if(what==='plot'){const p=CROP_PLOT(idx);pos={x:p.x+p.width/2,y:p.y+p.height+43};}
 if(!pos)return;
 goTo(pos,()=>{if(what==='plot')showPlot(idx);else if(what==='house')showHouse();else if(what==='shop')showShop();else if(what==='harbour')showHarbour();});
}
function nearbyTarget(){const targets=[{type:'house',x:880,y:432,label:'Open house'},{type:'shop',x:1760,y:539,label:'Open seed shop'},{type:'harbour',x:380,y:927,label:'Open harbour'}];
 MAP.farm.plots.forEach((p,i)=>targets.push({type:'plot',idx:i,x:p.x+p.width/2,y:p.y+p.height/2+34,label:`Farm plot ${i+1}`}));
 let best=null;for(const t of targets){const d=Math.hypot(t.x-player.x,t.y-player.y);if(d<(t.type==='plot'?108:137)&&(!best||d<best.distance))best={...t,distance:d};}return best;
}
function interact(){if(!playing||!$('modalOverlay').classList.contains('hidden'))return;const t=nearbyTarget();if(!t){toast('Move closer to a building or plot to interact.');return;}if(t.type==='plot')showPlot(t.idx);if(t.type==='shop')showShop();if(t.type==='house')showHouse();if(t.type==='harbour')showHarbour();}
function canvasTap(e){if(!playing||!$('modalOverlay').classList.contains('hidden'))return;const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)/zoom+camera.x,y=(e.clientY-rect.top)/zoom+camera.y;
 for(let i=0;i<MAP.farm.plots.length;i++){const p=MAP.farm.plots[i];if(x>p.x-8&&x<p.x+p.width+8&&y>p.y-25&&y<p.y+p.height+20){routeTo('plot',i);return;}}
 for(const b of MAP.layers.buildings){if(x>b.x-50&&x<b.x+b.width+50&&y>b.y-30&&y<b.y+b.height+40){routeTo(b.id);return;}}
 const target=nearestValid({x,y});goTo(target,null);
}
function updateMovement(dt){if(actionMotion)return;let vx=0,vy=0;const dirs=new Set([...keys,...touchDirs]);if(dirs.has('ArrowUp')||dirs.has('KeyW')||dirs.has('up'))vy--;if(dirs.has('ArrowDown')||dirs.has('KeyS')||dirs.has('down'))vy++;
 if(dirs.has('ArrowLeft')||dirs.has('KeyA')||dirs.has('left'))vx--;if(dirs.has('ArrowRight')||dirs.has('KeyD')||dirs.has('right'))vx++;
 let speed=390;if(vx||vy){path=[];autoAction=null;const len=Math.hypot(vx,vy);vx/=len;vy/=len;}
 else if(path.length){const target=path[0],dx=target.x-player.x,dy=target.y-player.y,dist=Math.hypot(dx,dy);
 if(dist<Math.max(10,dt*630)){player.x=target.x;player.y=target.y;path.shift();if(!path.length&&autoAction){const action=autoAction;autoAction=null;action();} }
 else{vx=dx/dist;vy=dy/dist;speed=630;}}
 player.moving=!!(vx||vy);
 if(player.moving){if(Math.abs(vx)>Math.abs(vy))player.dir=vx>0?'right':'left';else player.dir=vy>0?'down':'up';const nx=player.x+vx*speed*dt,ny=player.y+vy*speed*dt;
 if(canStand(nx,ny)){player.x=nx;player.y=ny;}else{if(canStand(nx,player.y))player.x=nx;else if(canStand(player.x,ny))player.y=ny;else if(path.length){path=[];autoAction=null;}}player.animMs+=dt*1000;player.frame=Math.floor(player.animMs/130)%4;}
 else{player.animMs=0;player.frame=0;}
}
function isDue(crop){return crop&&now()>=crop.nextDueAt}
function cropStage(crop){if(!crop)return 0;return crop.stage===3&&isDue(crop)?4:crop.stage}
function renderWorld(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#2698e0';ctx.fillRect(0,0,viewW,viewH);
 const targetX=player.x-viewW/(2*zoom),targetY=player.y-viewH/(2*zoom);
 const visibleW=viewW/zoom,visibleH=viewH/zoom;
 const goalX=centeredCamera(targetX,MAP.world.width,visibleW),goalY=centeredCamera(targetY,MAP.world.height,visibleH);
 camera.x=MAP.world.width<=visibleW?goalX:camera.x+(goalX-camera.x)*.13;
 camera.y=MAP.world.height<=visibleH?goalY:camera.y+(goalY-camera.y)*.13;
 ctx.save();ctx.scale(zoom,zoom);ctx.translate(-camera.x,-camera.y);ctx.imageSmoothingEnabled=false;
 drawImage(ctx,MAP.layers.background,0,0,MAP.world.width,MAP.world.height);
 for(const b of MAP.layers.buildings)drawImage(ctx,b.asset,b.x,b.y,b.width,b.height);
 const boat=ASSET+'environment/props/boat.png';drawImage(ctx,boat,265,1085,100,100);
 // All ten plot locations remain in a single 5 × 2 block.
 MAP.farm.plots.forEach((p,i)=>{const plot=state.plots[i];let s=plot.unlocked?'plot_tilled':'plot_locked';if(plot.crop){s=plot.crop.stage===0?'plot_seeded':plot.crop.stage===1?'plot_watered':'plot_fertilized'}
 drawImage(ctx,`assets/plots/${s}.png`,p.x,p.y,p.width,p.height);
 if(plot.crop){const c=plot.crop;const stage=cropStage(c);drawImage(ctx,`assets/crops/${c.type}/${c.type}_0${stage}_${STAGES[stage]}.png`,p.x+p.width/2-32,p.y-6,64,64);
 if(isDue(c)){drawWorldMarker(p.x+p.width/2,p.y-12,'!',true);}else drawWorldMarker(p.x+p.width/2,p.y-10,formatSeconds(c.nextDueAt-now()),false);}
 else if(!plot.unlocked){ctx.font='900 12px Trebuchet MS';ctx.textAlign='center';ctx.fillStyle='#fff8d5';ctx.strokeStyle='#6b4d29';ctx.lineWidth=3;ctx.strokeText(String(i+1),p.x+p.width/2,p.y+51);ctx.fillText(String(i+1),p.x+p.width/2,p.y+51);}
 });
 // Player with consistent 64x64 sprites, foot anchor at y=59.
 const working=actionMotion?.phase==='work';const stepping=actionMotion&&!working;
 const sheet=working?`girl_${actionMotion.kind}`:((stepping||player.moving)?`girl_walk_${player.dir}`:'girl_idle_4dir');const sprite=asset(`assets/characters/girl/${sheet}.png`);
 const directions=['down','up','left','right'];const fi=working?Math.min(3,Math.floor((performance.now()-actionMotion.started-ACTION_ENTER_MS)/500)):stepping?Math.min(3,Math.floor(performance.now()/100)%4):player.moving?player.frame:directions.indexOf(player.dir);
 if(sprite.complete&&sprite.naturalWidth)ctx.drawImage(sprite,fi*64,0,64,64,player.x-32,player.y-59,64,64);
 // Overlay canopy pixels from the same underlying map for occlusion.
 for(const f of MAP.foreground_overlays)drawImage(ctx,f.asset,f.x,f.y,f.width,f.height);
 if(playing){
  for(const [id,label] of [['house_entry','Home'],['shop_entry','Shop'],['harbour_trade','Harbour']]){
   const zone=MAP.interaction_zones.find(z=>z.id===id);
   if(zone)drawLocationPin(zone,label);
  }
 }
 if(debugPath&&path.length){ctx.strokeStyle='#fff077';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(player.x,player.y);for(const p of path)ctx.lineTo(p.x,p.y);ctx.stroke();}
 ctx.restore();}
function drawWorldMarker(x,y,label,urgent){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';const font=/^\d/.test(label)?'bold 12px Trebuchet MS':'bold 19px Trebuchet MS';ctx.font=font;const tw=ctx.measureText(label).width;
 ctx.fillStyle=urgent?'#f06b45ed':'#fff6d7ef';ctx.strokeStyle=urgent?'#ffe3a6':'#9f794c';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-tw/2-9,y-15,tw+18,27,9);ctx.fill();ctx.stroke();ctx.fillStyle=urgent?'#fff':'#53422b';ctx.fillText(label,x,y-1);ctx.restore();}
function drawLocationPin(zone,label){
 // Signs point to the actual door/pier, not to unrelated spots on the path.
 const harbour=zone.id==='harbour_trade';
 const cx=harbour?245:zone.x+zone.width/2;
 const tipY=harbour?1050:zone.y-13;
 ctx.save();ctx.font='bold 16px Trebuchet MS, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 const bw=Math.max(75,ctx.measureText(label).width+27),bh=31,by=harbour?tipY-53:tipY+12;
 ctx.fillStyle='#fff8e5f5';ctx.strokeStyle='#996b3d';ctx.lineWidth=2;
 ctx.beginPath();ctx.roundRect(cx-bw/2,by,bw,bh,10);ctx.fill();ctx.stroke();
 ctx.beginPath();
 if(harbour){ctx.moveTo(cx-7,by+bh);ctx.lineTo(cx+7,by+bh);ctx.lineTo(cx,tipY-3);}
 else{ctx.moveTo(cx-7,by);ctx.lineTo(cx+7,by);ctx.lineTo(cx,tipY+3);}
 ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#4e3824';ctx.fillText(label,cx,by+bh/2);ctx.restore();
}
function updateHUD(){if(!state)return;$('hudName').textContent=state.name;$('hudLevel').textContent='Lv '+state.level;$('hudRank').textContent=rankForLevel(state.level).name+' · '+rankForLevel(state.level).vi;$('hudGold').textContent=state.gold;
 $('hudXPLabel').textContent=`${state.xp} / ${xpNeed(state.level)}`;$('hudXPBar').style.width=(100*state.xp/xpNeed(state.level))+'%';
 $('areaName').textContent=player.x>1515?'Seed Shop Island':'Main Farm Island';const near=nearbyTarget();$('actionButton').textContent=near?'OPEN':'ACT';}
function toast(msg,bad=false){const el=document.createElement('div');el.className='toast'+(bad?' bad':'');el.textContent=msg;$('toastStack').append(el);setTimeout(()=>el.remove(),4100)}

// --------------------------- Interface ---------------------------
function openModal(title,html,kicker='VOCAB FARM ISLAND',id='generic'){
 activeModal=id;$('modalPanel').dataset.mode=id;$('modalTitle').textContent=title;$('modalEyebrow').textContent=kicker;$('modalBody').innerHTML=html;
 $('modalOverlay').classList.remove('hidden');$('modalPanel').scrollTop=0;$('modalBody').scrollTop=0;keys.clear();touchDirs.clear();path=[];autoAction=null;
 $('modalClose').focus({preventScroll:true});
}
function closeModal(){if($('modalOverlay').classList.contains('hidden'))return;$('modalOverlay').classList.add('hidden');activeModal='';qContext=null;$('gameCanvas').focus({preventScroll:true});}
// Tap-to-play pronunciation uses the device's Web Speech voices, not the IPA glyphs.
// en-GB is requested; if no UK voice is installed, we cannot guarantee the accent.
function speakVocabularyWord(word){
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){
  toast('This browser cannot play pronunciation · Trình duyệt không hỗ trợ âm thanh.',true);return;
 }
 const voiceList=window.speechSynthesis.getVoices();
 const uk=voiceList.find(v=>/^en[-_]GB$/i.test(v.lang))
    ||voiceList.find(v=>/^en/i.test(v.lang)&&/british|english uk|uk english/i.test(v.name));
 const utterance=new SpeechSynthesisUtterance(String(word));
 utterance.lang='en-GB';utterance.rate=.84;utterance.pitch=1;
 if(uk)utterance.voice=uk;
 if(!uk)toast('UK voice not installed; your device may use another English accent.',true);
 try{window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance)}
 catch(e){toast('Pronunciation is unavailable on this device.',true)}
}
function wordCard(w,status='neutral'){
 const marker=status==='correct'?'<span class="mark-good">✓ </span>':status==='incorrect'?'<span class="mark-bad">× </span>':'';
 return `<div class="word-card"><div class="word-line">${marker}<strong>${escapeHTML(w.english)}</strong><button class="speak-word" type="button" data-pronounce="${escapeHTML(w.english)}" aria-label="Play British pronunciation of ${escapeHTML(w.english)}" title="Listen · Nghe phát âm Anh-Anh">🔊</button> <span class="word-ipa">${escapeHTML(w.ipa)} (${escapeHTML(w.pos)})</span>: <strong>${escapeHTML(w.meaning)}</strong></div><div class="example"><strong>Ví dụ:</strong> ${escapeHTML(w.example)}</div></div>`;
}
function showShop(){const content=`<div class="shop-intro">${img('assets/ui/shop/shopkeeper/shopkeeper_portrait_128.png')}<div><div class="shop-gold">${goldIconHTML()} <strong>${state.gold} gold</strong></div></div></div>
 <div class="card-grid">${CROP_DATA.map(c=>`<div class="item-card">${img(cropIcon(c.id,'seed'))}<strong>${escapeHTML(c.name)}</strong><span class="price">${goldIconHTML()} ${c.seed}</span><span class="subtext">${c.mins} min · Sell ${c.sale}</span>${state.level<c.level?`<span class="tag danger">Level ${c.level}</span>`:`<button class="primary-btn" data-do="buy" data-crop="${c.id}" ${state.gold<c.seed?'disabled':''}>Buy</button>`}<small>Owned: ${state.seeds[c.id]||0}</small></div>`).join('')}</div>
 <div class="button-row"><button class="secondary-btn" data-do="inventory">Inventory</button>${canRescue()?'<button class="primary-btn" data-do="rescue">Free carrot seed</button>':''}</div>`;
 openModal('Seed Shop',content,'','shop');}
function canRescue(){const seeds=Object.values(state.seeds).reduce((a,b)=>a+b,0),harvest=Object.values(state.harvest).reduce((a,b)=>a+b,0),growing=state.plots.some(p=>p.crop);return state.gold<CROPS.carrot.seed&&seeds===0&&harvest===0&&!growing;}
function buySeed(id){const c=CROPS[id];if(!c||state.level<c.level||state.gold<c.seed){toast('Not enough gold or level to buy this seed.',true);return;}state.gold-=c.seed;state.seeds[id]=(state.seeds[id]||0)+1;save();updateHUD();toast(`Purchased 1 ${c.name} seed!`);showShop()}
function getRescue(){if(!canRescue()){toast('Emergency seed is only available when you cannot continue farming.');return;}state.seeds.carrot=1;save();toast('One free carrot seed is ready!');showShop()}
function showInventory(){const section=(kind,label,list)=>`<h3 class="section-heading">${label}</h3><div class="inventory-grid">${list.map(c=>`<div class="inventory-cell">${img(cropIcon(c.id,kind==='seed'?'seed':'harvested'))}<span>${escapeHTML(c.name)}</span><small>× ${kind==='seed'?(state.seeds[c.id]||0):(state.harvest[c.id]||0)}</small></div>`).join('')}</div>`;
 openModal('Your Inventory',`<div class="stat-strip"><span class="stat-chip">${goldIconHTML()} ${state.gold} gold</span><span class="stat-chip">🌱 Plots: ${state.plots.filter(p=>p.unlocked).length} / 10</span></div>${section('seed','Seed packets',CROP_DATA)}${section('harvest','Harvested crops',CROP_DATA)}<div class="button-row"><button class="secondary-btn" data-do="shop">🛒 Seed Shop</button><button class="secondary-btn" data-do="harbour">⛵ Sell at Harbour</button></div>`,'INVENTORY • SAVED IN THIS BROWSER','inventory');}
function plotArt(i){const p=state.plots[i];if(!p.unlocked)return 'assets/plots/plot_locked.png';if(!p.crop)return 'assets/plots/plot_tilled.png';const stage=cropStage(p.crop);return `assets/crops/${p.crop.type}/${p.crop.type}_0${stage}_${STAGES[stage]}.png`;}
function showPlot(i){const p=state.plots[i],assetPreview=plotArt(i);if(!p.unlocked){
 const nextLocked=nextLockedPlot(),rule=PLOT_UNLOCKS[i];
 const isNext=i===nextLocked,canBuy=isNext&&canExpand(i);
 const note=`<div class="plot-cost-details">
  <h3>Locked 🔒</h3>
  <p class="plot-cost-main">${goldIconHTML()} ${rule.price} gold</p>
  <p class="plot-cost-note">Level ${rule.level} required</p>
 </div>`;
 return openModal(`Farm Plot ${i+1}`,`<div class="plot-banner plot-banner-locked">${note}</div><div class="button-row">${isNext?`<button class="primary-btn" data-do="unlock" data-index="${i}" ${canBuy?'':'disabled'}>${state.level<rule.level?`Reach Level ${rule.level} · Đạt cấp ${rule.level}`:`Unlock · ${rule.price} gold`}</button>`:''}<button class="secondary-btn" data-do="shop">Buy seeds · Mua hạt</button></div>`, 'FARM EXPANSION','plot');}
 if(!p.crop){return openModal(`Farm Plot ${i+1}`,`<div class="plot-banner">${img('assets/plots/plot_tilled.png')}<div><h3>Choose a seed</h3></div></div><h3 class="section-heading">Your available seeds</h3><div class="card-grid">${CROP_DATA.map(c=>`<div class="item-card">${img(cropIcon(c.id,'seed'))}<strong>${escapeHTML(c.name)}</strong><small>Owned: ${state.seeds[c.id]||0}</small><span class="subtext">${c.mins} min total</span><button class="primary-btn" data-do="plant" data-index="${i}" data-crop="${c.id}" ${!(state.seeds[c.id]>0)?'disabled':''}>Plant seed</button></div>`).join('')}</div><div class="button-row"><button class="secondary-btn" data-do="shop">🛒 Buy more seeds</button></div>`,'PLANTING • VOCABULARY','plot');}
 const crop=p.crop,c=CROPS[crop.type],due=isDue(crop),stage=cropStage(crop),readyName=ACTIONS[crop.stage];let msg;
 if(due){msg=`<div class="timer-block"><strong>🔔 ${readyName} is ready! · ${ACTION_VI[crop.stage]} đã sẵn sàng!</strong>${crop.retryAfter>now()?`<span class="tag danger">Retry available in <span class="retry-live" data-until="${crop.retryAfter}">${formatSeconds(crop.retryAfter-now())}</span></span>`:''}</div>`;}
 else{msg=`<div class="timer-block"><div class="smallcaps">Next: ${readyName} · ${ACTION_VI[crop.stage]}</div><div class="timer-number live-countdown" data-until="${crop.nextDueAt}">${formatSeconds(crop.nextDueAt-now())}</div></div>`;}
 openModal(`Farm Plot ${i+1}`,`<div class="plot-banner">${img(assetPreview)}<div><h3>${escapeHTML(c.name)}</h3><p>Stage ${stage+1}/5</p></div></div>${msg}<div class="button-row">${due?`<button class="primary-btn" data-do="start-question" data-index="${i}" ${crop.retryAfter>now()?'disabled':''}>${readyName} · ${ACTION_VI[crop.stage]}</button>`:''}<button class="secondary-btn" data-do="inventory">🎒 Inventory</button></div>`,'FARM • GROW YOUR VOCABULARY','plot');}
function unlockPlot(i){if(i!==nextLockedPlot())return;
 syncDaily();
 const rule=PLOT_UNLOCKS[i];if(!rule)return;
 if(state.level<rule.level){toast(`Reach Level ${rule.level} to unlock Plot ${i+1}.`,true);showPlot(i);return;}
 if(state.gold<rule.price){toast(`Need ${rule.price} gold to unlock Plot ${i+1}.`,true);showPlot(i);return;}
 state.gold-=rule.price;
 state.plots[i].unlocked=true;
 save();updateHUD();toast(`Plot ${i+1} unlocked for ${rule.price} gold!`);showPlot(i);
}
function cropInterval(c){return Math.round(c.mins*60000/4); }
function plantCrop(i,id){const plot=state.plots[i],c=CROPS[id];if(!plot?.unlocked||plot.crop||!(state.seeds[id]>0)||actionMotion)return;
 if(ONLINE&&!bank.length){toast('Teacher has not added any vocabulary for this student yet.',true);return;}
 const wId=chooseWord();const w=wordById(wId);
 // The 90-second countdown starts when planting starts; the 2-second animation is included in it.
 state.seeds[id]--;plot.crop={type:id,wordId:wId,wordData:w,stage:0,nextDueAt:now()+cropInterval(c),retryAfter:0,wrong:0};save();if(ONLINE)flushOnline();updateHUD();
 beginTimedAction('plant',()=>{openModal('',`${wordCard(w,'correct')}<div class="timer-block compact-timer">💧 <strong>Water in ${formatSeconds(plot.crop.nextDueAt-now())}</strong></div>`,'','plant-exposure');},i);
}

function showHarbour(){initOrders();const expire=formatSeconds(state.ordersExpire-now());const orderHtml=state.orders.map((o,i)=>{
 const enough=o.items.every(x=>(state.harvest[x.id]||0)>=x.qty);const ordinary=o.items.reduce((s,x)=>s+CROPS[x.id].sale*x.qty,0),bonus=Math.round(ordinary*1.2),xp=o.items.reduce((s,x)=>s+CROPS[x.id].xp*x.qty,0);
 return `<div class="order-card"><h3>⛵ Shipment ${i+1}</h3>${o.items.map(x=>`<div class="order-item"><span>${img(cropIcon(x.id))} ${escapeHTML(CROPS[x.id].name)}</span><strong>${state.harvest[x.id]||0} / ${x.qty}</strong></div>`).join('')}<div class="reward-note">Reward: ${bonus} gold (+20%) • ${xp} XP</div><button class="primary-btn" data-do="ship" data-index="${i}" ${enough?'':'disabled'}>${enough?'Complete order':'Need more crops'}</button></div>`;}).join('');
 const sells=CROP_DATA.filter(c=>(state.harvest[c.id]||0)>0).map(c=>`<div class="item-card">${img(cropIcon(c.id))}<strong>${escapeHTML(c.name)}</strong><small>Owned: ${state.harvest[c.id]}</small><span class="price">${goldIconHTML()} ${c.sale} · +${c.xp} XP</span><button class="primary-btn" data-do="sell" data-crop="${c.id}">Sell 1</button></div>`).join('');
 openModal('Harbour Market',`<div class="module-intro">${img('assets/ui/icons/64/icon_harbour_orders.png')}<div><h3>Three active orders</h3><p class="muted">Complete orders for 20% bonus gold.</p><span class="tag gold">Orders refresh in <span id="orderCountdown">${expire}</span></span></div></div><div class="order-grid">${orderHtml}</div><h3 class="section-heading">Sell individual crops</h3>${sells?`<div class="card-grid">${sells}</div>`:`<p class="muted">No crops to sell yet.</p>`}<div class="button-row"><button class="secondary-btn" data-do="inventory">🎒 View inventory</button><button class="secondary-btn" data-do="travel-farm">🌱 Go to Farm</button></div>`,'HARBOUR • SELL CROPS • EARN XP','harbour');}
function sellCrop(id){const c=CROPS[id];if(!c||!(state.harvest[id]>0))return;state.harvest[id]--;state.gold+=c.sale;earnXP(c.xp);state.sales.push({time:now(),type:'individual',crop:id,qty:1,gold:c.sale,xp:c.xp});state.sales=state.sales.slice(-500);save();if(ONLINE)flushOnline();updateHUD();toast(`Sold ${c.name}: +${c.sale} gold, +${c.xp} XP!`);showHarbour()}
function completeOrder(index){const o=state.orders[index];if(!o||!o.items.every(x=>(state.harvest[x.id]||0)>=x.qty))return;let normal=0,xp=0;for(const x of o.items){state.harvest[x.id]-=x.qty;normal+=CROPS[x.id].sale*x.qty;xp+=CROPS[x.id].xp*x.qty;}const gold=Math.round(normal*1.2);state.gold+=gold;earnXP(xp);state.sales.push({time:now(),type:'shipment',items:o.items,gold,xp});state.sales=state.sales.slice(-500);state.orders[index]=makeOrder(index);save();if(ONLINE)flushOnline();updateHUD();
 openModal('Shipment complete! 🎉',`<div class="module-intro">${img('assets/ui/icons/64/icon_harbour_orders.png')}<div><h3>Great work, farmer!</h3><p>Your order is on its way. A new shipment is now available.</p></div></div><div class="stat-strip"><span class="stat-chip">${goldIconHTML()} +${gold} gold</span><span class="stat-chip">⭐ +${xp} XP</span><span class="stat-chip">20% order bonus included</span></div><div class="button-row"><button class="primary-btn" data-do="harbour">View new orders</button><button class="secondary-btn" data-do="close">Back to island</button></div>`,'HARBOUR • REWARDS','feedback');}
function badgeGrid(){const arr=[['daily','Daily challenges'],['weekly','Weekly challenges'],['vocabulary','Vocabulary mastery'],['level','Level milestone']];return `<div class="badge-wall">${arr.map(([id,title])=>`<div class="badge-tile ${state.badges.includes(id)?'':'locked'}">${img(`assets/ui/badges/64/badge_${id}.png`)}<strong>${escapeHTML(title)}</strong><br><small>${state.badges.includes(id)?'Earned!':'Locked'}</small></div>`).join('')}</div>`}
function showHouse(){syncDaily();openModal('Your Farmhouse',`<div class="module-intro">${img('assets/characters/girl/girl_portrait.png')}<div><h3>${escapeHTML(state.name)} • Level ${state.level}</h3><p class="rank-note">${rankForLevel(state.level).name} · ${rankForLevel(state.level).vi}</p></div></div><div class="stat-strip"><span class="stat-chip">${goldIconHTML()} ${state.gold} gold</span><span class="stat-chip">⭐ ${state.xpTotal} lifetime XP</span><span class="stat-chip">📚 ${state.history.length} answers logged</span><span class="stat-chip">🌱 ${state.plots.filter(p=>p.unlocked).length}/10 plots</span></div><h3 class="section-heading">Achievements</h3>${badgeGrid()}<div class="button-row"><button class="primary-btn" data-do="missions">📅 Daily & Weekly</button><button class="secondary-btn" data-do="ranks">🏅 All ranks</button><button class="secondary-btn" data-do="history">📖 Answer history</button><button class="secondary-btn" data-do="log-out">↩ Log out · Đăng xuất</button></div><p class="fine-print">${ONLINE?'Class progress is saved in the teacher’s private Google Sheet.':'Offline demo: progress stays in this browser.'}</p>`,'YOUR FARM • PERSONAL PROGRESS','house');}

// -------------------- Vocabulary questions --------------------
function editDistance(a,b){a=slug(a);b=slug(b);const dp=Array(b.length+1).fill(0).map((_,i)=>i);for(let i=1;i<=a.length;i++){let prev=dp[0];dp[0]=i;for(let j=1;j<=b.length;j++){let temp=dp[j];dp[j]=Math.min(dp[j]+1,dp[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=temp;}}return dp[b.length]}
function distractors(w,field){const extras=SPECIAL_DISTRACTORS[slug(w.english)]||{};let candidates=[];
 if(field==='en'&&extras.en)candidates.push(...extras.en);
 if(field==='meaning'&&extras.meaning)candidates.push(...extras.meaning);
 const sorted=bank.filter(x=>x.id!==w.id).sort((a,b)=>editDistance(a.english,w.english)-editDistance(b.english,w.english));
 candidates.push(...sorted.map(x=>field==='en'?x.english:x.meaning));
 return [...new Set(candidates.map(x=>String(x).trim()).filter(x=>slug(x)!==slug(field==='en'?w.english:w.meaning)))].slice(0,3);
}
function maskWord(s){const parts=[...s];let indices=[];for(let i=0,k=0;i<parts.length;i++)if(/[a-z]/i.test(parts[i])){if(k%2===1)indices.push(i);k++;}if(!indices.length){const fi=parts.findIndex(x=>/[a-z]/i.test(x));if(fi>=0)indices=[fi];}
 const masked=parts.map((ch,i)=>indices.includes(i)?'_':ch).join('');return {masked,indices};}
function makeQuestion(w,stage){
 if(stage===0){const opts=shuffled([{v:'adv',label:'trạng từ (adv)'},{v:'v',label:'động từ (v)'},{v:'n',label:'danh từ (n)'},{v:'adj',label:'tính từ (adj)'}]);
  return {stage,type:'pos',title:`Loại từ của “<strong>${escapeHTML(w.english)}</strong>”:`,options:opts.map(x=>({value:x.v,label:x.label})),correct:w.pos};}
 if(stage===1){const opts=shuffled([w.meaning,...distractors(w,'meaning')]);
  return {stage,type:'meaning',title:`“<strong>${escapeHTML(w.english)}</strong>” nghĩa là:`,options:opts.map(x=>({value:x,label:x})),correct:w.meaning};}
 if(stage===2){const opts=shuffled([w.english,...distractors(w,'en')]);
  return {stage,type:'english',title:`“<strong>${escapeHTML(w.meaning)}</strong>” tiếng Anh gọi là:`,options:opts.map(x=>({value:x,label:x})),correct:w.english};}
 const mask=maskWord(w.english);return {stage,type:'spelling',title:`Điền vào chữ cái còn thiếu: <strong>${escapeHTML(w.meaning)}</strong> (${escapeHTML(w.pos)}).`,mask:mask.masked,indices:mask.indices,correct:w.english};
}
function startFarmQuestion(i){const p=state.plots[i];if(!p?.crop||!isDue(p.crop)){showPlot(i);return;}if(p.crop.retryAfter>now()){showPlot(i);return;}
 const w=p.crop.wordData||wordById(p.crop.wordId);qContext={kind:'farm',plotIndex:i,word:w,stage:p.crop.stage,question:makeQuestion(w,p.crop.stage),selection:null};renderQuestion();}
function getDailyWords(){syncDaily();return deterministicShuffle(bank,DAY_SEED(state.daily.day,state.id)).slice(0,15)}
function getWeeklyWords(){syncDaily();return deterministicShuffle(bank,DAY_SEED(state.weekly.week,state.id+'weekly')).slice(0,10)}
function challengeCards(words,answers,kind){return words.map((w,i)=>{const h=answers[w.id];return `<div class="challenge-card">${img('assets/ui/badges/64/badge_'+kind+'.png')}<div style="flex:1"><strong>Question ${i+1}</strong></div>${h?`<span class="tag ${h.correct?'':'danger'}">${h.correct?'✓ Correct':'× Incorrect'}</span>`:`<button class="primary-btn" data-do="challenge" data-kind="${kind}" data-index="${i}">Answer · Trả lời</button>`}</div>`}).join('');}
function showMissions(){
 syncDaily();const dailyWords=getDailyWords(),weeklyWords=getWeeklyWords();
 const dailyDone=Object.keys(state.daily.answers).length,weeklyDone=Object.keys(state.weekly.answers).length;
 openModal('Challenges · Thử thách',`<div class="mission-timers">
  <div class="challenge-section"><h3>Daily · Hằng ngày</h3><p>${dailyDone}/${dailyWords.length} answered · ${state.daily.correct} correct · ${goldIconHTML()} +3/correct</p><p>Reset · Làm mới: <strong class="reset-live" data-until="${nextDailyReset()}">${countdownLong(nextDailyReset()-now())}</strong></p><small>Every day at 00:00 (Vietnam time)</small></div>
  <div class="challenge-section"><h3>Weekly · Hằng tuần</h3><p>${weeklyDone}/${weeklyWords.length} answered · ${state.weekly.correct} correct · ${goldIconHTML()} +5/correct</p><p>Reset · Làm mới: <strong class="reset-live" data-until="${nextWeeklyReset()}">${countdownLong(nextWeeklyReset()-now())}</strong></p><small>Every Monday at 00:00 (Vietnam time)</small></div></div>
  <h3 class="section-heading">Daily questions · Câu hỏi hằng ngày</h3><div class="missions-grid">${challengeCards(dailyWords,state.daily.answers,'daily')||'<p>No vocabulary yet · Chưa có từ vựng</p>'}</div>
  <h3 class="section-heading">Weekly questions · Câu hỏi hằng tuần</h3><div class="missions-grid">${challengeCards(weeklyWords,state.weekly.answers,'weekly')||'<p>No vocabulary yet · Chưa có từ vựng</p>'}</div>`,'','missions');}
function showChallengeQuestion(kind,i){
 syncDaily();const isWeekly=kind==='weekly',words=isWeekly?getWeeklyWords():getDailyWords(),entry=isWeekly?state.weekly:state.daily;
 const word=words[i];if(!word||entry.answers[word.id]){showMissions();return;}
 qContext={kind,period:isWeekly?entry.week:entry.day,dailyIndex:i,word,stage:1,question:makeQuestion(word,1),selection:null};renderQuestion();
}
function showRanks(){openModal('Farmer Ranks · Danh hiệu',`<div class="rank-list">${RANKS.map(([name,vi],i)=>`<div class="rank-item ${rankForLevel(state.level).index===i?'current':''}"><strong>${i+1}. ${escapeHTML(name)}</strong><span>${escapeHTML(vi)}</span><small>Lv ${i*5+1}–${(i+1)*5}${i===9?' · level 51+ remains Island Legend':''}</small></div>`).join('')}</div><p class="fine-print">Levels never end. After level 50, your rank stays Island Legend while your level keeps increasing.</p>`,'','ranks');}
function renderQuestion(){const q=qContext;if(!q)return;
 let inputHtml='';if(q.question.type==='spelling'){
  // The missing letters are REAL, VISIBLE, one-character text inputs embedded
  // into a continuous word. No invisible input/caret tricks are needed.
  const indices=q.question.indices;
  const blankPositions=new Map(indices.map((pos,i)=>[pos,i]));
  const letters=[...q.question.mask].map((ch,pos)=>{
   const slot=blankPositions.get(pos);
   if(slot===undefined)return `<span class="spell-char" aria-hidden="true">${escapeHTML(ch)}</span>`;
   return `<input class="spell-slot" type="text" maxlength="1" inputmode="text" data-spell-slot="${slot}" aria-label="Chữ cái còn thiếu ${slot+1} / ${indices.length}" placeholder="_" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">`;
  }).join('');
  inputHtml=`<div class="spelling-area"><div class="spelling-display ${q.question.mask.length>13?'spelling-long':''}" id="spellingDisplay" role="group" aria-label="Điền chữ cái còn thiếu trong một từ">${letters}</div><p class="spell-hint">Chạm vào dấu _ để nhập chữ. Tự chuyển sang dấu _ tiếp theo.</p></div>`;
 }else{
  inputHtml=`<div class="choices" role="group" aria-label="Chọn đáp án">${q.question.options.map((o,i)=>`<button type="button" class="choice-btn" data-choice="${i}" aria-pressed="false"><span class="choice-letter">${String.fromCharCode(65+i)}.</span><span>${escapeHTML(o.label)}</span></button>`).join('')}</div>`;
 }
 openModal('',`<h3 class="question-title">${q.question.title}</h3>${inputHtml}<div class="button-row question-actions"><button class="primary-btn" id="submitAnswer" data-do="submit-answer" disabled>✓ Submit answer</button></div>`,'','question');
 if(q.question.type==='spelling')configureSpellingField(q);
}
function configureSpellingField(q){
 const display=$('spellingDisplay');if(!display)return;
 const slots=[...display.querySelectorAll('input.spell-slot')];
 const original=[...q.question.mask],indices=[...q.question.indices];
 const submit=$('submitAnswer');
 const normalize=value=>[...String(value||'').toLowerCase()].filter(ch=>/^[a-z]$/.test(ch)).join('');
 // A keyboard's IME can show the last letter without committing it until the
 // user presses Space. Count that visible English letter immediately instead.
 const slotLetter=el=>normalize(el.value).slice(-1)||normalize(el.dataset.imeDraft).slice(-1);
 const readWord=()=>{const letters=[...original];indices.forEach((pos,i)=>{letters[pos]=slotLetter(slots[i])||'_';});return letters.join('');};
 const update=()=>{
  slots.forEach(el=>el.classList.toggle('spell-filled',!!slotLetter(el)));
  if(submit)submit.disabled=slots.some(el=>!slotLetter(el));
  display.setAttribute('aria-label','Spelling '+readWord().replace(/_/g,' blank '));
 };
 const focusSlot=i=>{const el=slots[i];if(!el)return;el.focus({preventScroll:true});el.select();};
 const fillFrom=(from,text)=>{
  let i=from;
  for(const letter of normalize(text)){
   if(i>=slots.length)break;
   delete slots[i].dataset.imeDraft;
   slots[i].value=letter;i++;
  }
  update();
  if(i<slots.length)focusSlot(i);
  else if(slots.length)focusSlot(slots.length-1);
 };
 q._getSpellingWord=readWord;
 q._clearSpelling=()=>{slots.forEach(el=>{el.value='';delete el.dataset.imeDraft});update();focusSlot(0);};
 slots.forEach((input,i)=>{
  input.addEventListener('keydown',e=>{
   if(e.key==='Enter'){
    e.preventDefault();if(submit&&!submit.disabled)submitAnswer();return;
   }
   if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
    e.preventDefault();focusSlot(Math.max(0,Math.min(slots.length-1,i+(e.key==='ArrowLeft'?-1:1))));return;
   }
   if(e.key==='Backspace'){
    e.preventDefault();
    if(slotLetter(input)){input.value='';delete input.dataset.imeDraft;update();focusSlot(i);}
    else if(i>0){slots[i-1].value='';delete slots[i-1].dataset.imeDraft;update();focusSlot(i-1);}
    return;
   }
   if(e.key==='Delete'){e.preventDefault();input.value='';delete input.dataset.imeDraft;update();focusSlot(i);return;}
   // Letters are processed by input only, never by keydown (no duplicates).
  });
  input.addEventListener('compositionupdate',e=>{
   input.dataset.imeDraft=normalize(e.data).slice(-1);
   update();
  });
  input.addEventListener('compositionend',e=>{
   const letter=normalize(input.value).slice(-1)||normalize(e.data).slice(-1)||normalize(input.dataset.imeDraft).slice(-1);
   delete input.dataset.imeDraft;
   input.value=letter;
   update();
   if(letter&&i<slots.length-1)focusSlot(i+1);
  });
  input.addEventListener('input',e=>{
   const typed=normalize(input.value);
   if(e.isComposing){
    // Do not blur an active IME, but enable Submit as soon as the final
    // letter is visibly present — even before a Space/compositionend event.
    input.dataset.imeDraft=typed.slice(-1)||normalize(e.data).slice(-1);
    update();return;
   }
   delete input.dataset.imeDraft;
   if(typed){
    input.value=typed.slice(-1);update();
    if(i<slots.length-1)focusSlot(i+1);
   }else{input.value='';update();}
  });
  input.addEventListener('paste',e=>{e.preventDefault();fillFrom(i,e.clipboardData?.getData('text')||'');});
  input.addEventListener('focus',()=>{input.select();});
  input.addEventListener('keyup',()=>update());
 });
 display.addEventListener('pointerdown',e=>{
  if(e.target.closest('input.spell-slot'))return;
  const first=slots.findIndex(el=>!slotLetter(el));focusSlot(first<0?slots.length-1:first);
 });
 update();
 if(!matchMedia('(pointer: coarse)').matches)focusSlot(0);
}
function chooseAnswer(i){if(!qContext||qContext.question.type==='spelling')return;qContext.selection=i;document.querySelectorAll('[data-choice]').forEach(el=>{const yes=Number(el.dataset.choice)===i;el.classList.toggle('selected',yes);el.setAttribute('aria-pressed',String(yes));});$('submitAnswer').disabled=false}
function clearAnswer(){if(!qContext)return;if(qContext.question.type==='spelling'){qContext._clearSpelling?.();}
 else{qContext.selection=null;document.querySelectorAll('[data-choice]').forEach(el=>{el.classList.remove('selected');el.setAttribute('aria-pressed','false');});$('submitAnswer').disabled=true}}
function logQuestionAttempt(word,source,stage,answer,correct,attempt,expected){const entry={eventId:makeHistoryId(),time:now(),source,stage,wordId:word.id,word:word.english,answer,expected,correct,attempt};state.history.push(entry);if(state.history.length>3000)state.history=state.history.slice(-3000);if(ONLINE)onlinePendingEvents.push(entry);}
function submitAnswer(){const q=qContext;if(!q||activeModal!=='question')return;const correctValue=q.question.correct;
 let given=q.question.type==='spelling'?(q._getSpellingWord?.()||'').trim():q.question.options[q.selection]?.value;
 if(!given||given.includes('_')){toast('Please complete your answer before submitting.',true);return;}
 const correct=slug(given)===slug(correctValue);
 if(q.kind==='daily'||q.kind==='weekly'){
  syncDaily();const weekly=q.kind==='weekly',entry=weekly?state.weekly:state.daily;
  if(q.period!==(weekly?entry.week:entry.day)){showMissions();toast('Challenges have reset · Đã làm mới thử thách.');return;}
  if(entry.answers[q.word.id])return;
  entry.answers[q.word.id]={time:now(),correct,answer:given};const reward=weekly?5:3;
  if(correct){entry.correct++;state.gold+=reward;}
  logQuestionAttempt(q.word,weekly?'Weekly challenge':'Daily challenge','English → Vietnamese',given,correct,1,correctValue);checkBadges();save();if(ONLINE)flushOnline();updateHUD();
  const status=correct?`<div class="answer-result correct">✓ Correct · +${reward} gold</div>`:'<div class="answer-result incorrect"><span class="wrong-x">×</span> Incorrect · 0 gold</div>';
  openModal('',`${status}${wordCard(q.word,'neutral')}`,'','feedback');return;
 }
 const plot=state.plots[q.plotIndex],crop=plot?.crop;if(!crop)return;
 const attempt=crop.wrong+1;
 logQuestionAttempt(q.word,'Farm',ACTIONS[crop.stage],given,correct,attempt,correctValue);
 if(!correct){crop.wrong++;crop.retryAfter=now()+crop.wrong*10000;save();if(ONLINE)flushOnline();
  openModal('',`<div class="answer-result incorrect"><span class="wrong-x">×</span> Incorrect</div><div class="timer-block compact-timer">Try again in <strong class="retry-live" data-until="${crop.retryAfter}">${formatSeconds(crop.retryAfter-now())}</strong></div><div class="button-row"><button id="retryNow" class="primary-btn" data-do="retry-plot" data-index="${q.plotIndex}" disabled>Try again</button></div>`,'','retry');return;
 }
 crop.wrong=0;crop.retryAfter=0;const isHarvest=crop.stage===3;
 const phase=crop.stage;const cropType=crop.type;let reward='';
 if(isHarvest){const c=CROPS[crop.type];state.harvest[c.id]=(state.harvest[c.id]||0)+1;plot.crop=null;reward=`<div class="timer-block compact-timer">🌾 Harvested 1 ${escapeHTML(c.name)}!</div>`;toast(`Harvested ${c.name}!`);}
 else{crop.stage++;crop.nextDueAt=now()+cropInterval(CROPS[crop.type]);reward=`<div class="timer-block compact-timer">Next: <strong>${ACTIONS[crop.stage]} · ${ACTION_VI[crop.stage]} in ${formatSeconds(cropInterval(CROPS[crop.type]))}</strong></div>`;}
 save();if(ONLINE)flushOnline();updateHUD();
 const feedback=()=>openModal('',`<div class="answer-result correct">✓ Correct</div>${wordCard(q.word,'neutral')}${reward}`,'','feedback');
 beginTimedAction(isHarvest?'harvest':['water','tend','fertilize'][phase],feedback,q.plotIndex);
}
function showHistory(){const hs=state.history;let correct=hs.filter(x=>x.correct).length,accuracy=hs.length?Math.round(correct/hs.length*100):0;const recent=[...hs].reverse().slice(0,80);
 openModal('Learning History',`<div class="stat-strip"><span class="stat-chip">Questions: ${hs.length}</span><span class="stat-chip">Correct: ${correct}</span><span class="stat-chip">Wrong: ${hs.length-correct}</span><span class="stat-chip">Accuracy: ${accuracy}%</span></div><p class="muted">This log includes <strong>every submitted attempt</strong>, including wrong answers and retries. Teachers can view the full history from their private Google Sheets dashboard when online sync is configured.</p><div class="scroll-table"><table class="history-table"><thead><tr><th>Date</th><th>Word</th><th>Task</th><th>Your answer</th><th>Correct answer</th><th>Result</th></tr></thead><tbody>${recent.length?recent.map(h=>`<tr><td>${escapeHTML(new Date(h.time).toLocaleString())}</td><td><strong>${escapeHTML(h.word)}</strong></td><td>${escapeHTML(h.stage)}</td><td>${escapeHTML(h.answer)}</td><td>${escapeHTML(h.expected)}</td><td class="${h.correct?'result-correct':'result-wrong'}">${h.correct?'✓':'✗'}</td></tr>`).join(''):'<tr><td colspan="6">No answers yet. Grow a carrot to begin!</td></tr>'}</tbody></table></div><div class="button-row">${ONLINE?'<button class="primary-btn" data-do="sync-words">↻ Tải từ mới · Reload words</button><button class="secondary-btn" data-do="sync-save">☁ Save progress</button>':''}<button class="secondary-btn" data-do="export-history">⬇ Export history (CSV)</button><button class="secondary-btn" data-do="house">🏠 House</button></div><p class="fine-print">Only the latest 80 attempts appear here. ${ONLINE?'Your teacher can review your answer history in their private Google Sheet.':'Offline mode stores up to 3,000 attempts locally.'}</p>`,'CURRENT STUDENT • LOCAL HISTORY','history');}
function saveDownload(name,content,mime){const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function csvCell(s){return `"${String(s??'').replace(/"/g,'""')}"`}
function exportHistory(){const cols=['timestamp','student_id','student_name','source','stage','word','submitted_answer','correct_answer','correct','attempt'];const lines=state.history.map((h,i)=>[new Date(h.time).toISOString(),state.id,state.name,h.source,h.stage,h.word,h.answer,h.expected,h.correct,h.attempt||''].map(csvCell).join(','));saveDownload(`student_${state.id}_answer_history.csv`,[cols.join(','),...lines].join('\r\n'),'text/csv;charset=utf-8');toast('History CSV exported to your device.')}
function exportSave(){saveDownload(`student_${state.id}_local_save.json`,JSON.stringify({exportedAt:new Date().toISOString(),note:'Local prototype save — not an online account',state},null,2),'application/json')}
function exportTemplate(){const rows=[['English word','UK IPA','Part of speech','Meaning','Example meaning'],['planet','/ˈplæn.ɪt/','n','hành tinh','Earth is a planet. (Trái Đất là một hành tinh.)']];saveDownload('vocab_farm_vocabulary_template.csv','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8')}
function parseCSV(text){text=text.replace(/^\ufeff/,'');const lines=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(q&&text[i+1]==='"'){cell+='"';i++}else q=!q;}else if(ch===','&&!q){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()))lines.push(row);row=[];}else cell+=ch;}row.push(cell);if(row.some(x=>x.trim()))lines.push(row);return lines;}
function importCSVFile(e){const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{
 const rows=parseCSV(String(reader.result||''));if(!rows.length)throw Error('The file is empty.');let start=/english|từ vựng|word/i.test(rows[0][0]||'')?1:0;const current=JSON.parse(localStorage.getItem(BANK_KEY)||'[]');let added=0,skipped=0;
 for(const line of rows.slice(start)){if(line.length<5){skipped++;continue;}const [english,ipa,pos0,meaning,example]=line.map(x=>x.trim());const pos=pos0.replace(/[().]/g,'').trim().toLowerCase();if(!english||!ipa||!meaning||!['n','v','adj','adv'].includes(pos)||!example){skipped++;continue;}const id='custom_'+slug(english).replace(/[^a-z0-9]+/g,'_');if(bank.some(x=>slug(x.english)===slug(english))){skipped++;continue;}const w={id,english,ipa,pos,meaning,example};current.push(w);bank.push(w);added++;}
 localStorage.setItem(BANK_KEY,JSON.stringify(current));toast(`${added} words imported (${skipped} skipped).`);
 }catch(err){toast('Could not import CSV: '+err.message,true)}};reader.readAsText(file,'UTF-8');}

// -------------------- Events, persistence, and frame loop --------------------
function dispatchClick(e){const speaker=e.target.closest('[data-pronounce]');if(speaker){speakVocabularyWord(speaker.dataset.pronounce);return;}const option=e.target.closest('[data-choice]');if(option){chooseAnswer(Number(option.dataset.choice));return;}const btn=e.target.closest('[data-do]');if(!btn||btn.disabled)return;const action=btn.dataset.do,id=btn.dataset.crop,index=Number(btn.dataset.index);
 switch(action){
 case 'close':closeModal();break;
 case 'shop':showShop();break;
 case 'inventory':showInventory();break;
 case 'harbour':showHarbour();break;
 case 'house':showHouse();break;
 case 'missions':showMissions();break;
 case 'ranks':showRanks();break;
 case 'history':showHistory();break;
  case 'buy':buySeed(id);break;
 case 'rescue':getRescue();break;
 case 'plant':plantCrop(index,id);break;
 case 'unlock':unlockPlot(index);break;
 case 'start-question':startFarmQuestion(index);break;
 case 'submit-answer':submitAnswer();break;
 case 'clear-answer':clearAnswer();break;
 case 'retry-plot':startFarmQuestion(index);break;
 case 'ship':completeOrder(index);break;
 case 'sell':sellCrop(id);break;
 case 'travel-farm':routeTo('farm');break;
 case 'challenge':showChallengeQuestion(btn.dataset.kind==='weekly'?'weekly':'daily',index);break;
 case 'export-history':exportHistory();break;
 case 'export-save':exportSave();break;
 case 'export-template':exportTemplate();break;
 case 'sync-words':reloadOnlineWords();break;
 case 'sync-save':{save();flushOnline();toast('Sending progress to Google Sheets…');break;}
 case 'log-out':{save();if(ONLINE)flushOnline();closeModal();playing=false;$('gameShell').classList.add('hidden');$('loginScreen').classList.remove('hidden');$('passcode').value='';toast(ONLINE?'Logged out.':'Logged out of the local demo.');onlineToken=null;break;}
 }
}
function liveCounters(){document.querySelectorAll('.reset-live').forEach(el=>{el.textContent=countdownLong(Number(el.dataset.until)-now());});document.querySelectorAll('.live-countdown,.retry-live').forEach(el=>{let left=Number(el.dataset.until)-now();el.textContent=formatSeconds(left);});
 const retry=$('retryNow');if(retry&&retry.disabled){const ix=Number(retry.dataset.index),crop=state.plots[ix]?.crop;if(crop&&now()>=crop.retryAfter)retry.disabled=false;}
 if(activeModal==='plot'){const b=document.querySelector('[data-do="start-question"]');if(b&&b.disabled){const i=Number(b.dataset.index),c=state.plots[i]?.crop;if(c&&now()>=c.retryAfter)b.disabled=false;}}
 if($('orderCountdown'))$('orderCountdown').textContent=formatSeconds(state.ordersExpire-now());
 if(now()>=state.ordersExpire&&state.orders.length){initOrders();if(activeModal==='harbour')showHarbour();}
}
function frame(t){if(!playing)return;if(actionMotion)advanceFarmAction(t);const dt=Math.min(.055,(t-lastTime)/1000||0);lastTime=t;if($('modalOverlay').classList.contains('hidden'))updateMovement(dt);renderWorld();
 if(t-uiLast>450){const reset=syncDaily();if(reset&&activeModal==='missions')showMissions();updateHUD();liveCounters();uiLast=t;}
 if(t-saveLast>(ONLINE?18000:2500)){save();if(ONLINE)flushOnline();saveLast=t;}
 requestAnimationFrame(frame);}
async function reloadOnlineWords(){if(!ONLINE||!onlineToken)return;
 try{const info=await serverCall('studentWords',onlineToken);bank=info.words||[];if(info.name){state.name=info.name;updateHUD();}toast(`Vocabulary updated: ${bank.length} words.`);showHistory();}
 catch(e){toast('Could not load words: '+e.message,true);}}
function launchPlayer(slot){player={x:state.position?.x||880,y:state.position?.y||495,dir:'down',moving:false,frame:0,animMs:0};
 if(!canStand(player.x,player.y)){const p=nearestValid({x:880,y:495});player.x=p.x;player.y=p.y;}
 initOrders();checkBadges();$('loginScreen').classList.add('hidden');$('gameShell').classList.remove('hidden');syncDaily();resize();camera.x=centeredCamera(player.x-viewW/(2*zoom),MAP.world.width,viewW/zoom);camera.y=centeredCamera(player.y-viewH/(2*zoom),MAP.world.height,viewH/zoom);
 preload();updateHUD();playing=true;lastTime=performance.now();requestAnimationFrame(frame);toast(`Welcome, ${state.name}!`);$('gameCanvas').focus();}
async function beginGame(){const slot=$('studentSelect').value,pin=$('passcode').value;
 if(!/^\d{4}$/.test(pin)){$('loginError').textContent='Enter a 4-digit passcode.';return;}
 $('loginError').textContent='';$('playButton').disabled=true;
 try{
  if(ONLINE){const resp=await serverCall('studentLogin',slot,pin);
   onlineToken=resp.session;onlineRevision=Number(resp.revision)||0;onlineDirty=false;onlinePendingEvents=[];bank=resp.words||[];
   state=resp.profile||newProfile(slot);delete state.landTax;state.id=slot;state.version=2;
   if(!state.plots||state.plots.length!==10)throw Error('Invalid online progress.');
  }else{
   if(pin!==String(Number(slot)).padStart(4,'0'))throw Error('Incorrect demo passcode.');
   loadBank();state=readProfile(slot);
  }
  launchPlayer(slot);if(ONLINE&&bank.length===0)toast('Teacher has not added vocabulary yet. Please ask your teacher.',true);
 }catch(e){$('loginError').textContent=e?.message||'Login failed. Try again.';}
 finally{$('playButton').disabled=false;}
}
function toggleTeacherAccess(){
 const panel=$('teacherAccessPanel');panel.classList.toggle('hidden');
 $('teacherDashboardButton').setAttribute('aria-expanded',String(!panel.classList.contains('hidden')));
}
function openPrivateTeacherSheet(){
 const input=$('teacherSheetUrl');const raw=(input.value||'').trim();
 if(!raw){window.open('https://docs.google.com/spreadsheets/u/0/','_blank','noopener,noreferrer');return;}
 try{const url=new URL(raw);if(url.protocol!=='https:'||url.hostname!=='docs.google.com'||!url.pathname.startsWith('/spreadsheets/d/'))throw Error('Invalid Sheet URL');
  window.open(url.href,'_blank','noopener,noreferrer');
 }catch(_){$('teacherAccessError').textContent='Paste a valid private Google Sheets URL, or leave it blank to open Google Sheets.'}
}
function bindEvents(){resize();window.addEventListener('resize',resize);$('studentSelect').addEventListener('change',e=>{if(!ONLINE)$('demoPin').textContent=String(Number(e.target.value)).padStart(4,'0');$('loginError').textContent='';});
 $('teacherDashboardButton').addEventListener('click',toggleTeacherAccess);$('openTeacherSheetButton').addEventListener('click',openPrivateTeacherSheet);$('playButton').addEventListener('click',beginGame);$('passcode').addEventListener('keydown',e=>{if(e.key==='Enter')beginGame()});$('modalBody').addEventListener('click',dispatchClick);
 $('modalClose').addEventListener('click',closeModal);
 $('modalOverlay').addEventListener('pointerdown',e=>{if(e.target===$('modalOverlay'))closeModal()});
 $('zoomIn').addEventListener('click',()=>setZoom(zoom*1.25));
 $('zoomOut').addEventListener('click',()=>setZoom(zoom/1.25));
 $('zoomFit').addEventListener('click',()=>setZoom(mapFitZoom()));
 canvas.addEventListener('wheel',e=>{if(!playing)return;e.preventDefault();setZoom(zoom*(e.deltaY<0?1.15:1/1.15))},{passive:false});
 $('inventoryButton').addEventListener('click',showInventory);$('missionsButton').addEventListener('click',showMissions);$('historyButton').addEventListener('click',showHistory);
 document.querySelectorAll('[data-travel]').forEach(el=>el.addEventListener('click',()=>routeTo(el.dataset.travel)));
 $('actionButton').addEventListener('click',interact);
 canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch'&&Math.abs(e.clientX-(canvas._downX||e.clientX))>14)return;canvasTap(e)});
 canvas.addEventListener('pointerdown',e=>{canvas._downX=e.clientX;});
 document.querySelectorAll('[data-dir]').forEach(el=>{el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);touchDirs.add(el.dataset.dir);el.classList.add('pressed');});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,()=>{touchDirs.delete(el.dataset.dir);el.classList.remove('pressed')});});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('modalOverlay').classList.contains('hidden')){closeModal();e.preventDefault()}return;}
 const el=document.activeElement,editing=el&&(['INPUT','TEXTAREA','SELECT'].includes(el.tagName)||el.isContentEditable);if(editing||!playing||!$('modalOverlay').classList.contains('hidden'))return;
 const code=e.code;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(code)){e.preventDefault();keys.add(code)}if(code==='KeyE'||code==='Space'){e.preventDefault();interact();}if(code==='KeyI'){e.preventDefault();showInventory();}});
 window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touchDirs.clear();if(playing){save();flushOnline()}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){save();flushOnline()}});window.addEventListener('beforeunload',()=>{if(playing){save();flushOnline()}});}
if(ONLINE){document.querySelector('.demo-code')?.remove();$('passcode').placeholder='Your private 4-digit code';document.querySelector('.safety-note').textContent='Online classroom • Progress saved in private Google Sheets.';}
bindEvents();
// A diagnostic hook for local testing. It cannot change the game's real accounts because no backend exists.
window.VocabFarmDebug={get state(){return state},get player(){return player},get map(){return MAP},get bank(){return bank},routeTo,walkable,pathfind,showShop,showPlot,showHarbour,showMissions};
})();
