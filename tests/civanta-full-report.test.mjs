import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const allocationSource=readFileSync(new URL('../public/civanta-workspace/allocation.js',import.meta.url),'utf8').split('function renderAllocationFields')[0];
const reportSource=readFileSync(new URL('../public/civanta-workspace/full-report.js',import.meta.url),'utf8').split('let getSavedCreditInputs')[0];
const build=runInNewContext(allocationSource+'\n'+reportSource+'\nbuildFullCivantaReport',{
 cvFormula:(f,v)=>({f,v}),hasScreeningLcfs:f=>['rd','bd','ethanol','rng'].includes(f),documentedLcfs:{}
});
function fixture({farm=false,method='none'}={}) {
 const inputs={volume:1000,upstream:10,km:100,kg:.04,ng:.1,kwh:.01,gasfactor:63,grid:400,truckfactor:100,chemicals:null,distribution:null,endUse:null,
  months:5,injected:100,methane:60,raw:1000,leak:2,biogasToUpgrading:900,upgrading:1,vent:0,flare:0,
  cows:10,dry:1,heifers:1,vs:7,dryvs:4,heifervs:3,bo:.24,storage:80,mcf:.75,digester:'Enclosed Vessel',
  electricity:100,naturalGas:10,diesel:0,pipe:100};
 const gross=farm?{'Avoided baseline methane':-40,'Methane leakage / slip':5,'Grid electricity':4,'Process natural gas':3,'Diesel use':0,'Pipeline delivery':1}:
  {Upstream:10,Transport:.4,'Process heat':6.3,Electricity:4,'Chemicals and fugitives':null,'Fuel distribution':null,'End use':null};
 const controls=farm?['leak','power','gas','demand']:['power','rail','heat','tuning'];
 const settings={power:35,rail:65,heat:45,tuning:25,leak:35,gas:45,demand:25};
 const allocation={method,context:'iso',classification:'product',confirmed:true,fuelMass:1000,fuelPrice:1,products:[{name:'Co-product',mass:500,lhv:10,price:.5}],scope:['Process heat','Electricity']};
 const factor=method==='mass'?2/3:1;
 const evaluated=levels=>{
  const parts=Object.fromEntries(Object.entries(gross).filter(([,v])=>v!==null));
  for(const [stage,k] of [['Electricity','power'],['Grid electricity','power'],['Methane leakage / slip','leak'],['Process natural gas','gas'],['Pipeline delivery','demand']])if(stage in parts)parts[stage]*=1-levels[k]/100;
  if(!farm){parts.Transport*=1-levels.rail/100*.78;parts['Process heat']*=(1-levels.heat/100)*(1-levels.tuning/100);}
  if(method==='mass')parts['Co-product allocation adjustment']=-(parts['Process heat']+parts.Electricity)*(1-factor);
  return {parts,ci:Object.values(parts).reduce((a,b)=>a+b,0)};
 };
 const zero=Object.fromEntries(controls.map(k=>[k,0]));const before=evaluated(zero);
 return {plant:'Report regression',baseline:{kind:farm?'dairy':'generic',path:{id:'fixture',fuel:farm?'rng':'rd',feedstock:'Test feedstock',group:'Test fuel',name:'Test pathway',technology:'Test',energy:80.53},parts:before.parts,gross,ci:before.ci,energyMj:80530,volume:1000,unit:'US gallons',allocation:{factor,adjustment:method==='mass'?-(6.3+4)/3:0,shared:method==='mass'?10.3:0,shares:method==='mass'?{mass:factor}:{}}},inputs,allocation,controls,settings,
  labels:Object.fromEntries(controls.map(k=>[k,'Optimizer '+k])),target:null,finance:{confirmed:false,ready:false,cost:{}},
  fieldLabels:Object.fromEntries(Object.keys(inputs).map(k=>[k,['Inventory '+k,'unit']])),dairySections:[['Farm inventory',Object.keys(inputs)]],
  credit:{lcfs:{benchmark:80.17,share:50,price:75,eer:1,confirmed:false},rin:{year:2026,share:50,price:1,ev:1,confirmed:false},z45:{qty:123.45,base:40,opt:25,pwa:'no'}},referenceGroups:[],evaluate:evaluated};
}
const sheet=(book,name)=>book.find(s=>s.name===name);
const row=(book,name,label)=>sheet(book,name).rows.find(r=>r.cells[0]===label).cells;

test('dairy farm leakage and optimizer leakage have distinct input references',()=>{
 const book=build(fixture({farm:true}));const inputs=sheet(book,'Inputs').rows;
 const raw=inputs.findIndex(r=>r.cells[0]==='Inventory leak')+1;
 const setting=inputs.findIndex(r=>r.cells[0]==='Optimizer leak')+1;
 assert.notEqual(raw,setting);
 const leakage=row(book,'Calculation','Methane leakage / slip');
 assert(leakage[1].f.includes("'Inputs'!B"+raw));
 assert(!leakage[1].f.includes("'Inputs'!B"+setting));
 assert(leakage[4].f.includes("'Inputs'!B"+setting));
});
test('allocated stage and chart caches use the same fuel share exactly once',()=>{
 const run=fixture({method:'mass'});const book=build(run);const before=4*2/3,after=before*.65;
 assert.equal(row(book,'Calculation','Electricity')[3].v,before);
 assert.equal(row(book,'Calculation','Electricity')[4].v,after);
 const chart=sheet(book,'Calculation').chart;const idx=chart.labels.indexOf('Electricity');
 assert.equal(chart.series[0].values[idx],before);assert.equal(chart.series[1].values[idx],after);
});
test('complete sample credits export as conditional estimates without eligibility attestations',()=>{
 const book=build(fixture());
 for(const label of ['LCFS status','RIN status','45Z status'])assert.equal(row(book,'Regulatory credits',label)[1].v,'Conditional');
 assert.equal(row(book,'Regulatory credits','Annual RINs · baseline and scenario')[1].v,500);
 assert.equal(row(book,'Regulatory credits','Baseline tax credit')[1].v,5.43);
 assert.equal(row(book,'Regulatory credits','Scenario tax credit')[1].v,13.58);
 assert.match(row(book,'Regulatory credits','Baseline tax credit')[1].f,/,2\)/);
});
test('unsupported RIN year is not exported as a usable estimate',()=>{
 const run=fixture();run.credit.rin.year=2030;const book=build(run);
 assert.equal(row(book,'Regulatory credits','RIN status')[1].v,'Needs inputs');
 assert.equal(row(book,'Regulatory credits','Annual RINs · baseline and scenario')[1].v,'');
});

test('Free CI exports contain baseline data without paid worksheets or dangling references',()=>{
 const run=fixture({farm:true});run.pro=false;
 run.settings=Object.fromEntries(Object.keys(run.settings).map(key=>[key,0]));
 const book=build(run);
 assert.equal(book.length,7);
 for(const name of ['Optimization scenarios','Sensitivity analysis','Economic analysis','Regulatory credits'])assert(!book.some(s=>s.name===name));
 assert(!sheet(book,'Inputs').rows.some(r=>String(r.cells[0]).startsWith('Optimizer ')));
 assert.equal(sheet(book,'Calculation').chart.series.length,1);
 for(const s of book)for(const r of s.rows)for(const c of r.cells){
  if(!c?.f)continue;
  for(const [,name] of c.f.matchAll(/'([^']+)'!/g))assert(book.some(s=>s.name===name),c.f);
  for(const [,address] of c.f.matchAll(/'Inputs'!([A-Z]+\d+)/g)){
   const number=Number(address.match(/\d+/)[0]);
   assert(number<=sheet(book,'Inputs').rows.length,c.f);
  }
 }
});
