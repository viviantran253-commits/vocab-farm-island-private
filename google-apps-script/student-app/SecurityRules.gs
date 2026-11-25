/** Server-owned action rules. Browser totals and rewards are never authoritative. */
const SEC_CROPS={carrot:[8,18,4,1,2],lettuce:[12,24,5,1,2.5],wheat:[16,31,6,2,3],tomato:[24,43,7,3,3.5],strawberry:[34,56,8,4,4],corn:[43,68,9,5,4.5],pumpkin:[60,90,10,7,5],watermelon:[74,109,11,9,5.5],pineapple:[90,130,12,12,6]};
const SEC_PLOTS=[[1,0],[1,0],[2,100],[4,200],[6,300],[8,400],[10,500],[12,600],[15,700],[20,800]];
const SEC_DECOR={daisy_bush:['garden',55],flower_planter:['garden',75],sunflowers:['garden',65],stone_birdbath:['garden',95],park_bench:['park',85],lantern_post:['park',100],picnic_table:['park',120],stepping_stones:['park',40],water_well:['rustic',100],wooden_signpost:['rustic',40],harvest_basket:['rustic',35],quest_board:['rustic',90],torii_gate:['japanese',125],stone_lantern:['japanese',100],sakura_tree:['japanese',150],koi_pond:['japanese',135],beach_umbrella_table:['beach',110],palm_tree:['beach',145],beach_lounger:['beach',105],sandcastle:['beach',70],lantern_string:['festival',105],festival_stall:['festival',135],flower_arch:['festival',145],festival_drum:['festival',75]};
const SEC_PACKS={garden:250,rustic:225,japanese:410,beach:335,festival:350},SEC_PET_REWARDS={1:[450,12],2:[900,24],3:[2100,42]};
const SEC_RETIRED=['park_bench','lantern_post','picnic_table','stepping_stones'];
const secCopy_=x=>JSON.parse(JSON.stringify(x));
const secOwn_=(object,key)=>Object.prototype.hasOwnProperty.call(object,key)?object[key]:undefined;
function secCheck_(x,msg){if(!x)throw Error(msg||'Game action rejected.');}
function secInt_(x){const n=Number(x);return Number.isSafeInteger(n)?n:NaN;}
function secCount_(o,k){const n=Number(o?.[k]||0);secCheck_(Number.isSafeInteger(n)&&n>=0,'Invalid inventory.');return n;}
function secPay_(p,n){secCheck_(p.gold>=n,'Not enough gold.');p.gold-=n;}
function secXP_(p,n){p.xpTotal=(Number(p.xpTotal)||0)+n;p.xp=(Number(p.xp)||0)+n;for(let i=0;p.xp>=50+25*(p.level-1)&&i<10000;i++){p.xp-=50+25*(p.level-1);p.level++;}}
function secPeriods_(p,at){const day=Utilities.formatDate(new Date(at),'Asia/Ho_Chi_Minh','yyyy-MM-dd');const local=new Date(at+7*3600000);local.setUTCHours(0,0,0,0);local.setUTCDate(local.getUTCDate()-(local.getUTCDay()+6)%7);const week=Utilities.formatDate(new Date(local.getTime()-7*3600000),'Asia/Ho_Chi_Minh','yyyy-MM-dd');if(p.daily?.day!==day)p.daily={day,answers:{},correct:0};if(p.weekly?.week!==week)p.weekly={week,answers:{},correct:0};}
function secOrder_(p,id,at,index,nonce){const available=Object.keys(SEC_CROPS).filter(k=>SEC_CROPS[k][3]<=p.level),seed=(Number(id)||1)*31+Math.floor(at/(45*60000))*17+index*13+nonce*19,items=[];for(let j=0;j<1+index%3;j++){const crop=available[(seed+j*5)%available.length];if(!items.some(x=>x.id===crop))items.push({id:crop,qty:1+(seed+j)%3});}return {id:'ord_'+at+'_'+index+'_'+nonce,items,fulfilled:false};}
function secAnswer_(word,stage,answer){const pos=value=>value==='phrasal'?'v.phr':value;
 const expected=stage==='Water'?pos(word.pos):stage==='Tend'||stage==='English → Vietnamese'?word.meaning:word.english;
 const given=stage==='Water'?pos(String(answer||'').trim().toLowerCase()):String(answer||'').trim().toLowerCase();
 return {expected,correct:given===String(expected).trim().toLowerCase()};}
function secChallengeWords_(words,period,slot,limit){
 let h=2166136261;for(const c of `${period}-${slot}`)h=Math.imul(h^c.charCodeAt(0),16777619);
 let x=h>>>0;const copy=[...words];for(let i=copy.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;const j=(x>>>0)%(i+1);[copy[i],copy[j]]=[copy[j],copy[i]];}
 return new Set(copy.slice(0,limit).map(w=>w.id));
}
function secureReplay_(old,proposed,actions,words,id,seen,at){
 const p=secCopy_(old),known=new Set(seen||[]),logs=[],dict=Object.fromEntries((words||[]).map(w=>[w.id,w]));
 secCheck_(Array.isArray(actions)&&actions.length<=50,'Too many pending actions.');secPeriods_(p,at);if(!Array.isArray(p.orders))p.orders=[];
 for(const a of actions){
  secCheck_(a&&/^act_[A-Za-z0-9_-]{12,80}$/.test(String(a.id||'')),'Invalid action ID.');if(known.has(a.id))continue;known.add(a.id);
  const d=a.data||{},crop=secOwn_(SEC_CROPS,d.crop),item=secOwn_(SEC_DECOR,d.item);
  switch(String(a.type||'')){
   case 'refresh-orders':secCheck_(!p.orders.length||at>=Number(p.ordersExpire||0),'Orders are still active.');p.orders=[0,1,2].map(i=>secOrder_(p,id,at,i,0));p.ordersExpire=at+45*60000;break;
   case 'buy-seed':secCheck_(crop&&p.level>=crop[3],'Seed is locked.');secPay_(p,crop[0]);p.seeds[d.crop]=secCount_(p.seeds,d.crop)+1;break;
   case 'buy-fence':secPay_(p,20);p.fenceStock=secInt_(p.fenceStock||0)+1;break;
   case 'buy-decor':secCheck_(item&&!SEC_RETIRED.includes(d.item),'Decoration unavailable.');secPay_(p,item[1]);p.decorStock[d.item]=secCount_(p.decorStock,d.item)+1;break;
   case 'buy-pack':{const price=secOwn_(SEC_PACKS,d.pack);secCheck_(Number.isSafeInteger(price),'Unknown pack.');secPay_(p,price);for(const k in SEC_DECOR)if(SEC_DECOR[k][0]===d.pack)p.decorStock[k]=secCount_(p.decorStock,k)+1;break;}
   case 'sell-decor':secCheck_(item&&secCount_(p.decorStock,d.item)>0,'Decoration not owned.');p.decorStock[d.item]--;p.gold+=Math.floor(item[1]*.75);break;
   case 'sell-fence':secCheck_(secInt_(p.fenceStock)>0,'Fence not owned.');p.fenceStock--;p.gold+=15;break;
   case 'place-decor':secCheck_(item&&secCount_(p.decorStock,d.item)>0,'Decoration not owned.');p.decorStock[d.item]--;p.decorations.push({id:d.item});break;
   case 'remove-decor':{const ix=p.decorations.findIndex(x=>x.id===d.item);secCheck_(ix>=0,'Decoration not placed.');p.decorations.splice(ix,1);p.decorStock[d.item]=secCount_(p.decorStock,d.item)+1;break;}
   case 'place-fence':secCheck_(secInt_(p.fenceStock)>0,'Fence not owned.');p.fenceStock--;p.fences.push({});break;
   case 'remove-fence':secCheck_(p.fences.length>0,'Fence not placed.');p.fences.pop();p.fenceStock++;break;
   case 'rescue':secCheck_(p.gold<8&&Object.values(p.seeds).every(x=>Number(x)===0)&&Object.values(p.harvest).every(x=>Number(x)===0)&&p.plots.every(x=>!x.crop),'Rescue unavailable.');p.seeds.carrot=1;break;
   case 'unlock':{const ix=secInt_(d.plot);secCheck_(ix>=2&&ix<10&&p.plots.findIndex(x=>!x.unlocked)===ix&&p.level>=SEC_PLOTS[ix][0],'Plot locked.');secPay_(p,SEC_PLOTS[ix][1]);p.plots[ix].unlocked=true;break;}
   case 'plant':{const ix=secInt_(d.plot),slot=p.plots[ix],word=secOwn_(dict,d.wordId),special=d.crop==='special';secCheck_(slot?.unlocked&&!slot.crop&&word&&(special||crop)&&secCount_(p.seeds,d.crop)>0,'Cannot plant this seed.');p.seeds[d.crop]--;const fast=id===TEACHER_TEST_ID?Number(p.settings?.testGrowthSeconds)||0:0,ms=fast>=1&&fast<=120?fast*1000:Math.round((special?4:crop[4])*15000);slot.crop={type:d.crop,wordId:word.id,wordData:word,stage:0,nextDueAt:at+ms,retryAfter:0,wrong:0};break;}
   case 'answer':{const ix=secInt_(d.plot),slot=p.plots[ix],g=slot?.crop,word=g&&(secOwn_(dict,g.wordId)||g.wordData);secCheck_(g&&word?.id===g.wordId&&at>=Number(g.nextDueAt||0)&&at>=Number(g.retryAfter||0)&&g.stage<4,'Crop is not ready.');const stage=g.type==='special'?['Water','Tend','Give Milk','Feed Meal'][g.stage]:['Water','Tend','Fertilize','Harvest'][g.stage],result=secAnswer_(word,stage,d.answer),attempt=(Number(g.wrong)||0)+1;logs.push({id:a.id,word,source:'Farm',stage,answer:String(d.answer||''),expected:result.expected,correct:result.correct,attempt});if(!result.correct){g.wrong=attempt;g.retryAfter=at+10000;break;}g.wrong=0;g.retryAfter=0;if(g.type==='special'&&g.stage===0){g.pendingReveal=true;break;}if(g.type!=='special'&&g.stage===3){p.harvest[g.type]=secCount_(p.harvest,g.type)+1;slot.crop=null;break;}g.stage++;const fast=id===TEACHER_TEST_ID?Number(p.settings?.testGrowthSeconds)||0:0,minutes=g.type==='special'?4:secOwn_(SEC_CROPS,g.type)?.[4];secCheck_(minutes,'Unknown crop.');g.nextDueAt=g.type==='special'&&g.stage===4?at:at+(fast>=1&&fast<=120?fast*1000:Math.round(minutes*15000));break;}
   case 'challenge':{secCheck_(d.kind==='daily'||d.kind==='weekly','Unknown challenge.');const daily=d.kind==='daily',entry=daily?p.daily:p.weekly,word=secOwn_(dict,d.wordId),limit=daily?15:10,allowed=secChallengeWords_(words,daily?entry.day:entry.week,daily?id:id+'weekly',limit);secCheck_(word&&allowed.has(word.id)&&!entry.answers[word.id]&&Object.keys(entry.answers).length<limit,'Challenge unavailable.');const result=secAnswer_(word,'English → Vietnamese',d.answer);entry.answers[word.id]={time:at,correct:result.correct,answer:String(d.answer||'')};if(result.correct){entry.correct++;p.gold+=daily?3:5;}logs.push({id:a.id,word,source:daily?'Daily challenge':'Weekly challenge',stage:'English → Vietnamese',answer:String(d.answer||''),expected:result.expected,correct:result.correct,attempt:1});break;}
   case 'sell-crop':secCheck_(crop&&secCount_(p.harvest,d.crop)>0,'Harvest not owned.');p.harvest[d.crop]--;p.gold+=crop[1];secXP_(p,crop[2]);p.sales.push({time:at,type:'individual',crop:d.crop,qty:1,gold:crop[1],xp:crop[2]});break;
   case 'sell-pet':{const ix=p.companions.findIndex(x=>String(x.id)===String(d.petId)),pet=p.companions[ix],reward=pet&&secOwn_(SEC_PET_REWARDS,pet.rarity);secCheck_(ix>=0&&reward,'Companion not owned.');p.companions.splice(ix,1);p.gold+=reward[0];secXP_(p,reward[1]);p.sales.push({time:at,type:'companion-exchange',characterId:pet.characterId,rarity:pet.rarity,gold:reward[0],xp:reward[1]});break;}
   case 'ship':{const ix=secInt_(d.order),order=p.orders[ix];secCheck_(order&&order.id===d.orderId,'Shipment changed.');let gold=0,xp=0;for(const x of order.items){const c=secOwn_(SEC_CROPS,x.id);secCheck_(c&&secCount_(p.harvest,x.id)>=x.qty,'Crops not owned.');p.harvest[x.id]-=x.qty;gold+=c[1]*x.qty;xp+=c[2]*x.qty;}gold=Math.round(gold*1.2);p.gold+=gold;secXP_(p,xp);p.sales.push({time:at,type:'shipment',items:secCopy_(order.items),gold,xp});p.orders[ix]=secOrder_(p,id,at,ix,a.id.length);break;}
   case 'harvest-special':{const ix=secInt_(d.plot),slot=p.plots[ix],g=slot?.crop,pet=proposed.companions?.find(x=>String(x.id)===String(d.petId));secCheck_(g?.type==='special'&&g.stage===4&&at>=g.nextDueAt&&pet&&pet.characterId===g.characterId&&Number(pet.rarity)===Number(g.rarity)&&!p.companions.some(x=>String(x.id)===String(pet.id)),'Companion not ready.');p.companions.push(secCopy_(pet));if(!p.discovered.includes(pet.characterId))p.discovered.push(pet.characterId);slot.crop=null;break;}
   default:throw Error('Unknown game action.');
  }
 }
 secCheck_(Array.isArray(proposed.decorations)&&Array.isArray(proposed.fences)&&proposed.decorations.length<=200&&proposed.fences.length<=200,'Invalid placement.');
 const counts=(list,key)=>list.reduce((n,x)=>(n[x[key]]=(n[x[key]]||0)+1,n),{}),from=counts(p.decorations,'id'),to=counts(proposed.decorations,'id');
 for(const k of new Set([...Object.keys(p.decorStock||{}),...Object.keys(proposed.decorStock||{}),...Object.keys(from),...Object.keys(to)]))secCheck_(secCount_(p.decorStock,k)+Number(from[k]||0)===secCount_(proposed.decorStock,k)+Number(to[k]||0),'Decoration inventory mismatch.');
 secCheck_(secInt_(p.fenceStock||0)+p.fences.length===secInt_(proposed.fenceStock||0)+proposed.fences.length,'Fence inventory mismatch.');
 p.decorStock=secCopy_(proposed.decorStock);p.decorations=secCopy_(proposed.decorations);p.fenceStock=secInt_(proposed.fenceStock||0);p.fences=secCopy_(proposed.fences);p.position=secCopy_(proposed.position||p.position);p.lastWords=secCopy_((proposed.lastWords||[]).slice(-20));p.sales=(p.sales||[]).slice(-35);p.savedAt=at;
 for(const pet of p.companions){const moved=proposed.companions?.find(x=>String(x.id)===String(pet.id));if(moved&&Number.isFinite(moved.x)&&Number.isFinite(moved.y)){pet.x=moved.x;pet.y=moved.y;}}
 for(const log of logs){p.history.push({eventId:log.id,time:at,source:log.source,stage:log.stage,wordId:log.word.id,word:log.word.english,answer:log.answer,expected:log.expected,correct:log.correct,attempt:log.attempt});if(log.source==='Farm'&&log.correct)p.farmCorrectTotal=(Number(p.farmCorrectTotal)||0)+1;}p.history=p.history.slice(-40);
 const farmCorrect=Number(p.farmCorrectTotal)||0;
 p.badges=Array.isArray(p.badges)?p.badges:[];
 for(const [badge,earned] of [['daily',p.daily.correct>=5],['weekly',p.weekly.correct>=7],['vocabulary',farmCorrect>=50],['level',p.level>=5]])if(earned&&!p.badges.includes(badge))p.badges.push(badge);
 return {profile:p,logs,seen:Array.from(known).slice(-300)};
}
