import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('assets');
const registry=JSON.parse(fs.readFileSync(path.join(root,'companions/registry.json'),'utf8'));
const required=new Set();
const errors=[];
const add=relative=>required.add(relative);
const walk=directory=>fs.existsSync(directory)?fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]):[];
const addDirectory=relative=>{for(const file of walk(path.join(root,relative)))add(path.relative(root,file).replaceAll(path.sep,'/'));};
const pngSize=file=>{const bytes=fs.readFileSync(file);return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?[bytes.readUInt32BE(16),bytes.readUInt32BE(20)]:null;};

if(registry.schemaVersion!==1||!Array.isArray(registry.characters)||registry.characters.length<1||registry.characters.length>100)errors.push('Invalid registry schema or count');
if(!/^[A-Za-z0-9._-]{1,40}$/.test(registry.assetVersion||''))errors.push('Invalid assetVersion');
const seen=new Set();
for(const character of registry.characters||[]){
 const {id,name,enabled,portrait,phrases}=character;
 if(!/^[a-z][a-z0-9_]{1,39}$/.test(id||'')||seen.has(id))errors.push(`Invalid or duplicate ID: ${id}`);
 seen.add(id);
 if(typeof name!=='string'||!name.trim()||name.length>80||typeof enabled!=='boolean'||(portrait!==undefined&&typeof portrait!=='boolean'))errors.push(`Invalid metadata: ${id}`);
 if(!Array.isArray(phrases)||phrases.length<1||phrases.length>5||phrases.some(p=>!p.en?.trim()||!p.vi?.trim()||p.en.length>180||p.vi.length>180))errors.push(`Invalid phrases: ${id}`);
 for(const stage of ['01_newborn','02_baby','03_young','04_final']){
  const relative=`companions/${id}/growth/${stage}.png`;add(relative);
  if(fs.existsSync(path.join(root,relative))){const size=pngSize(path.join(root,relative));if(!size||size[0]!==size[1]||![64,128].includes(size[0]))errors.push(`Expected 64×64 or 128×128 PNG: ${relative}`);}
 }
 for(const direction of ['down','up','left','right']){
  for(const [folder,prefix] of [['idle','idle'],['sheets','walk']]){
   const relative=`companions/${id}/${folder}/${prefix}_${direction}.png`;add(relative);
   if(fs.existsSync(path.join(root,relative))){const size=pngSize(path.join(root,relative));if(!size||![64,128].includes(size[1])||size[0]!==size[1]*(folder==='sheets'?4:1))errors.push(`Invalid sprite dimensions: ${relative}`);}
  }
 }
 if(portrait)for(const kind of ['portrait','silhouette'])add(`companion-ui/portraits/${id}_${kind}_128.png`);
}
if(!(registry.characters||[]).some(c=>c.enabled))errors.push('At least one companion must be enabled');

for(const file of ['index.html','google-apps-script/student-app/StudentGame.html','google-apps-script/student-app/GameCode.html','google-apps-script/student-app/Stylesheet.html','google-apps-script/student-app/MapConfig.html']){
 const source=fs.readFileSync(file,'utf8');for(const match of source.matchAll(/assets\/[-A-Za-z0-9_./]+\.png/g))add(match[0].slice(7));
}
for(const folder of ['characters/girl','decorations','companion-effects'])addDirectory(folder);
for(const crop of ['carrot','lettuce','wheat','tomato','strawberry','corn','pumpkin','watermelon','pineapple']){
 for(const [stage,name] of ['planted','watered','tended','fertilized','mature'].entries())add(`crops/${crop}/${crop}_0${stage}_${name}.png`);
 add(`items/seeds/64/${crop}_seeds.png`);add(`items/harvested/64/${crop}_harvest.png`);
}
for(const badge of ['daily','weekly','vocabulary','level'])add(`ui/badges/64/badge_${badge}.png`);
for(const name of ['plot_tilled','plot_seeded','plot_watered','plot_fertilized','plot_locked'])add(`plots/${name}.png`);
for(const direction of ['horizontal','vertical'])add(`fences/fence_${direction}.png`);
add('environment/props/boat.png');add('items/currency/64/gold_coin.png');
add('companions/registry.json');

for(const relative of required)if(!fs.existsSync(path.join(root,relative)))errors.push(`Missing: assets/${relative}`);
const all=walk(root).map(file=>path.relative(root,file).replaceAll(path.sep,'/'));
const unused=all.filter(relative=>!required.has(relative));
console.log(`Registry: ${registry.characters.length} companions; assets: ${all.length}; required: ${required.size}; unused: ${unused.length}`);
if(process.argv.includes('--list-unused'))for(const relative of unused)console.log(`UNUSED assets/${relative}`);
else if(unused.length)errors.push(`${unused.length} unused assets remain (run with --list-unused)`);
if(errors.length){for(const error of errors)console.error(error);process.exitCode=1;}
