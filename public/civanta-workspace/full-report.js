/* Formula model for the full CIVanta workbook. Cell references are assigned by row key. */
function buildFullCivantaReport(run) {
 const {plant, baseline:b, settings, inputs, allocation:a, controls, labels, target, finance, credit} = run;
 const farm = b.kind === 'dairy';
 const screeningLcfs = hasScreeningLcfs(b.path.fuel);
 const legacy = !farm && inputs._mode === 'legacy';
 const mode = farm || legacy ? 'none' : a.method;
 const ciUnit = 'g CO₂e/MJ';
 const empty = 'Needs inputs';
 const sheets = {};
 const refs = {};
 const col = index => String.fromCharCode(65 + index);
 const ref = (sheet,key,index=1) => "'" + sheet + "'!" + col(index) + refs[sheet][key];
 const formula = (expression, result) => cvFormula(expression, result);
 const cache = (value, fallback='') => Number.isFinite(value) ? value : fallback;
 const status = value => value == null ? 'Not provided' : 'Provided';
 const add = (name, key, values, styles={}) => {
  const sheet = sheets[name];
  const number = sheet.rows.push({cells:values,styles});
  if (key) refs[name][key] = number;
  return number;
 };
 const widths = {
  'Calculation':[49,24,18,31,23,24,26,63],
  'Inputs':[52,25,29,65],
  'Emission factors':[44,24,26,68],
  'Global factor library':[53,23,25,65],
  'Keys':[38,95],
  'Optimization scenarios':[42,22,19,19,19,18,18,18,20,22,22],
  'Sensitivity analysis':[32,20,20,20,20,20],
  'Economic analysis':[38,24,18,19,19,19,19,21,21,21,22,22],
  'Regulatory credits':[38,25,24,57],
  'Sources & methods':[32,66,55],
  'Co-product allocation':[39,31,25,25,26,22,22,61]
 };
 const dated = new Date().toISOString().slice(0,10);
 const title = (name, heading, headers) => {
  sheets[name] = {name, rows:[], widths:widths[name]};
  refs[name] = {};
  const bannerSpan = Math.min(6,widths[name].length);
  const banner = (text, style, height) => {
   const row = add(name,null,[text],{0:style});
   Object.assign(sheets[name].rows[row-1],{span:bannerSpan,height});
  };
  banner(null,73,76);
  banner(plant,74,26);
  banner(name+' / '+b.path.name,75,27);
  banner('Exported '+dated+' · globalbioenergywatch.org',76,21);
  banner(heading,77,34);
  banner('CIVanta scenario workspace · Indicative screening result',72,24);
  add(name,null,[]);
  section(name,name === 'Calculation' ? 'Results · fuel CI after selected allocation' : '01   '+heading);
  add(name,null,headers,Object.fromEntries(headers.map((_,i)=>[i,1])));
 };
 const section = (name,heading) => {
  const row = add(name,null,[heading],{0:71});
  Object.assign(sheets[name].rows[row-1],{span:widths[name].length,height:25});
  return row;
 };
 const input = (name,key,label,value,unit,note) => add(name,key,[label,value??null,unit,note??status(value)],{1:2});
 const linked = (name,key,label,expr,value,unit,note) =>
  add(name,key,[label,formula(expr,value),unit,note],{1:4});

 const I = 'Inputs', F = 'Emission factors', C = 'Calculation', A = 'Co-product allocation';
 const O = 'Optimization scenarios', S = 'Sensitivity analysis', E = 'Economic analysis', R = 'Regulatory credits';
 const G = 'Global factor library', K = 'Keys', M = 'Sources & methods';
 const i = key => ref(I,key), f = key => ref(F,key), c = (key,index) => ref(C,key,index);
 const al = (key,index) => ref(A,key,index), opt = (key,index) => ref(O,key,index), e = key => ref(E,key), r = key => ref(R,key);
 const simple = ['Item','Value','Unit','Source / status'];

 title(I,'Facility inventory and run settings',simple);
 add(I,null,['Pathway',b.path.id,'',b.kind === 'dairy' ? 'Dairy RNG farm model' : legacy ? 'Legacy combined' : 'Detailed stage inventory']);
 add(I,null,['Input origin',inputs._example ? 'Includes illustrative data loaded in the form' : 'Facility entries or documented values']);
 const groups = farm ? run.dairySections : [
  ['Production',['volume','lhv']],
  ['Upstream & feedstock transport',[legacy?'fixed':'upstream','km','kg']],
  ['Process energy',['ng','kwh']],
  ['Chemicals & fugitives',['chemicals']],
  ['Fuel distribution',['distribution']],
  ['End use',['endUse']]
 ];
 for (const [heading,keys] of groups) {
  section(I,heading);
  for (const key of keys) {
   if (key === 'lhv' && !run.measuredLhv) continue;
   const value = legacy && ['chemicals','distribution','endUse'].includes(key) ? null : inputs[key];
   const [label,unit] = run.fieldLabels[key];
   input(I,key,label,value,key==='volume'?b.unit+'/year':unit);
  }
 }
 section(I,'Scenario settings');
 controls.forEach(key => input(I,key,labels[key],settings[key],'%'));
 input(I,'target','CI target',target,ciUnit);

 title(F,'Applied factors used in live calculation formulas',simple);
 if (farm) {
  for (const [key,label,value,unit] of [
   ['year','Days in reporting-year basis',365,'days/year'],
   ['mmbtu','Energy conversion',1055.05585,'MJ/MMBtu'],
   ['delivered','Delivered gas LHV/HHV',930/1030,'ratio'],
   ['ngBasis','Process natural gas LHV/HHV',.903,'ratio'],
   ['gasfactor','Process natural gas factor',63,'g CO₂e/MJ'],
   ['ch4Gwp','Methane warming potential',25,'g CO₂e/g CH₄'],
   ['ch4Mass','Methane mass from volatile solids',.716,'kg/m³'],
   ['ch4Scf','Methane mass at standard conditions',.0192,'kg/scf'],
   ['flareSlip','Flare slip',.02,'fraction'],
   ['dieselFactor','Diesel factor',12308,'g CO₂e/US gal'],
   ['pipeFactor','Pipeline delivery factor',.0038875,'g CO₂e/MJ-mile']
  ]) input(F,key,label,value,unit,'CIVanta dairy screening model constant');
  linked(F,'grid','Grid factor',i('grid'),inputs.grid,'g CO₂e/kWh','Farm input');
 } else {
  if (run.measuredLhv) linked(F,'energy','Fuel energy per unit',i('lhv'),b.path.energy,'MJ/'+b.unit,run.energySource);
  else input(F,'energy','Fuel energy per unit',b.path.energy,'MJ/'+b.unit,run.energySource);
  for (const [key,label,unit,active] of [
   ['gasfactor','Natural gas emission factor','g CO₂e/MJ gas',inputs.ng>0],
   ['grid','Grid emissions factor','g CO₂e/kWh',inputs.kwh>0],
   ['truckfactor','Truck freight emissions factor','g CO₂e/t-km',inputs.km>0&&inputs.kg>0]
  ]) input(F,key,label,inputs[key],unit,active?'Applied facility factor':inputs[key]==null?'Not required for this run':'Entered; activity is zero');
  input(F,'railReduction','Screening rail reduction at 100%',.78,'fraction','CIVanta optimizer coefficient');
 }

 title(C,'Lifecycle inventory · gross, allocated and scenario contributions',
  ['Result','Value','Unit','Method / status']);
 const annual = farm ? b.energyMj*12/inputs.months : b.energyMj;
 const energyRefs = farm ? [i('injected'),f('mmbtu'),f('delivered'),i('months')] : [i('volume'),f('energy')];
 linked(C,'energy','Annual fuel energy',farm
  ? 'IF(AND('+energyRefs[0]+'>0,'+energyRefs[3]+'>=1,'+energyRefs[3]+'<=12),'+energyRefs.slice(0,3).join('*')+'*12/'+energyRefs[3]+',"")'
  : 'IF(AND('+energyRefs[0]+'>0,'+energyRefs[1]+'>0),'+energyRefs.join('*')+',"")',annual,'MJ/year',farm?'Annualized from reporting months':'Volume × fuel energy per unit');
 // Reserve summary addresses before creating worksheet references.
 for (const [key,label] of [['baseline','Total baseline CI'],['scenario','Selected scenario CI'],['reduction','CI reduction'],
  ['gross','Gross positive attributed emissions'],['credits','Signed credits and negative contributions']]) add(C,key,[label],{0:6});

 title(A,'Shared stage allocation and reconciliation', ['Item','Value / treatment','Dry mass / gross CI','LHV / applied share','Net price / attributed CI','Energy / delta','Sales','Notes']);
 input(A,'method','Selected method',allocationMethods[mode],null,farm?'Dairy RNG uses its own methane baseline':legacy?'Legacy combined inventory':'Select one method');
 input(A,'context','Study context',!farm&&!legacy?allocationContexts[a.context]:null);
 input(A,'class','Co-product classification',!farm&&!legacy?a.classification:null);
 input(A,'confirmed','Gross inventory confirmed',!farm&&!legacy?a.confirmed:null);
 input(A,'mass','Main fuel dry mass',!farm&&!legacy?a.fuelMass:null,'kg/year');
 input(A,'price','Main fuel net price',!farm&&!legacy?a.fuelPrice:null,'USD/kg');
 input(A,'avoided','Documented displacement credit',!farm&&!legacy?a.avoided:null,ciUnit);
 input(A,'evidence','Displaced product and source',!farm&&!legacy?a.evidence:null);
 for (const [key,label] of [['energyShare','Fuel energy share'],['massShare','Fuel mass share'],['economicShare','Fuel economic share'],
  ['factor','Applied fuel share'],['qa','Method and data QA'],['shared','Shared gross emissions'],['adjustment','Baseline CI adjustment'],
  ['reconcile','Calculation reconciliation']]) add(A,key,[label],{0:6});
 section(A,'Product outputs and market data');
 add(A,null,['Co-product','Included','Dry mass (kg/year)','LHV (MJ/kg)','Net price (USD/kg)','Energy (MJ/year)','Net sales (USD/year)'],{0:1,1:1,2:1,3:1,4:1,5:1,6:1});
 const products = Array.from({length:4},(_,j) => !farm&&!legacy ? a.products[j]||{} : {});
 for (const [j,p] of products.entries()) {
  const used = ['name','mass','lhv','price'].some(key => p[key]!=null && p[key]!=='');
  const row = add(A,'product'+j,[p.name||null,used,p.mass??null,p.lhv??null,p.price??null],{0:2,1:2,2:2,3:2,4:2,5:4,6:4});
  sheets[A].rows[row-1].cells.push(
   formula('IF(AND(B'+row+',COUNT(C'+row+':D'+row+')=2,C'+row+'>0,D'+row+'>0),C'+row+'*D'+row+',"")',used&&p.mass>0&&p.lhv>0?p.mass*p.lhv:''),
   formula('IF(AND(B'+row+',ISNUMBER(C'+row+'),ISNUMBER(E'+row+'),C'+row+'>0,E'+row+'>=0),C'+row+'*E'+row+',"")',used&&p.mass>0&&p.price>=0?p.mass*p.price:'')
  );
 }
 section(A,'Stage-specific burdens');
 add(A,null,['Stage','Treatment','Gross CI','Fuel share','Attributed CI','Adjustment','', 'Notes'],{0:1,1:1,2:1,3:1,4:1,5:1,6:1,7:1});
 const sharedKeys = farm || legacy ? [] : sharedStages;
 for (const key of [...(farm?Object.keys(b.parts):[...sharedStages,'Fuel distribution','End use'])]) {
  const shared = sharedKeys.includes(key) && a.scope.includes(key);
  add(A,key,[key,shared?'Shared':'Fuel-only',null,null,null,null,null,sharedKeys.includes(key)?'Choose Shared only with a documented gross inventory.':'Fuel-specific or separate pathway accounting.'],{1:sharedKeys.includes(key)?2:0,2:4,3:69,4:4,5:4});
 }

 // Contribution formulas use applied factors and original activity once.
 const t = key => 'ISNUMBER('+i(key)+')';
 const optional = key => 'IF(AND('+t(key)+(legacy?'':','+i(key)+'>=0')+'),'+i(key)+',"")';
 const usedFactor = (key, factor) => 'IF(AND('+t(key)+','+i(key)+'=0),0,IF(AND('+t(key)+',ISNUMBER('+f(factor)+'),'+i(key)+'>=0,'+f(factor)+'>=0),'+i(key)+'*'+f(factor)+',""))';
 const transport = 'IF(AND('+t('kg')+','+t('km')+','+i('kg')+'>=0,'+i('km')+'>=0),IF(OR('+i('kg')+'=0,'+i('km')+'=0),0,IF(AND(ISNUMBER('+f('truckfactor')+'),'+f('truckfactor')+'>=0),'+i('kg')+'*'+i('km')+'*'+f('truckfactor')+'/1000,"")),"")';
 const stageCells = farm ? dairyWorkbookStages() : [
  ['Upstream','Upstream supply','IF('+t(legacy?'fixed':'upstream')+','+i(legacy?'fixed':'upstream')+',"")','Scope not assigned'],
  ['Transport','Feedstock transport',transport,'Scope 3'],
  ['Process heat','Process energy',usedFactor('ng','gasfactor'),'Scope 1'],
  ['Electricity','Process energy',usedFactor('kwh','grid'),'Scope 2'],
  ['Chemicals and fugitives','Chemicals & fugitives',legacy?'""':optional('chemicals'),'Scope not assigned'],
  ['Fuel distribution','Fuel distribution',legacy?'""':optional('distribution'),'Scope 3'],
  ['End use','Tailpipe & end use',legacy?'""':optional('endUse'),'Scope 3']
 ];
 function dairyWorkbookStages() {
  const energy = '('+i('injected')+'*'+f('mmbtu')+'*'+f('delivered')+')';
  const methane = '('+i('methane')+'/100*'+f('ch4Scf')+'/1000)';
  const captured = '('+i('raw')+'*'+methane+')';
  const losses = '('+captured+'*'+i('leak')+'/100+('+i('biogasToUpgrading')+'*'+i('upgrading')+'/100+'+i('vent')+'+'+i('flare')+'*'+f('flareSlip')+')*'+methane+')';
  const counterfactual = '('+['cows','dry','heifers'].map((key,j)=>i(key)+'*'+i(['vs','dryvs','heifervs'][j])).join('+')+')*'+i('months')+'/12*'+f('year')+'*'+i('bo')+'*'+i('storage')+'/100*'+i('mcf')+'*'+f('ch4Mass')+'/1000';
  return [
   ['Avoided baseline methane','Manure baseline','-MAX(0,MIN('+counterfactual+','+captured+'-'+losses+'))*1000000*'+f('ch4Gwp')+'/'+energy,'Lifecycle adjustment'],
   ['Methane leakage / slip','Digester and upgrading',losses+'*1000000*'+f('ch4Gwp')+'/'+energy,'Scope 1'],
   ['Grid electricity','Process energy',i('electricity')+'*'+f('grid')+'/'+energy,'Scope 2'],
   ['Process natural gas','Process energy',i('naturalGas')+'*'+f('mmbtu')+'*'+f('ngBasis')+'*'+f('gasfactor')+'/'+energy,'Scope 1'],
   ['Diesel use','Process energy',i('diesel')+'*'+f('dieselFactor')+'/'+energy,'Scope 1'],
   ['Pipeline delivery','Fuel distribution',i('pipe')+'*'+f('pipeFactor'),'Scope not assigned']
  ];
 }
 const ledgerHeaders = ['Emission source','Gross CI','Fuel share','Baseline CI','Scenario CI','Annual t CO₂e','Scope','Method / status'];
 function ledgerSection(heading) {
  section(C,heading);
  add(C,null,ledgerHeaders,Object.fromEntries(ledgerHeaders.map((_,i)=>[i,1])));
 }
 const isProp = !farm && !legacy && ['energy','mass','economic'].includes(mode);
 const baseScenario = run.evaluate(settings);
 const scenarioFactor = (key, pct) => ({
  Electricity:'(1-'+pct('power')+'/100)',Transport:'(1-'+pct('rail')+'/100*'+(farm?'0':f('railReduction'))+')',
  'Process heat':'(1-'+pct('heat')+'/100)*(1-'+pct('tuning')+'/100)',
  'Grid electricity':'(1-'+pct('power')+'/100)','Process natural gas':'(1-'+pct('gas')+'/100)',
  'Methane leakage / slip':'(1-'+pct('leak')+'/100)','Pipeline delivery':'(1-'+pct('demand')+'/100)'
 })[key] || '1';
 const scope = key => sharedKeys.includes(key) ? al(key,1)+'="Shared"' : 'FALSE';
 const validFarmInput = farm ? 'AND(ISNUMBER('+c('energy')+'),'+run.dairySections.flatMap(([,keys])=>keys)
  .filter(key=>!['digester','temp'].includes(key)).map(key=>t(key)+','+i(key)+'>=0').join(',')+
  ',LEN(TRIM('+i('digester')+'))>0,'+['storage','methane','leak','upgrading'].map(key=>i(key)+'<=100').join(',')+
  ','+i('mcf')+'<=1,'+i('biogasToUpgrading')+'<='+i('raw')+','+i('vent')+'+'+i('flare')+'<='+i('raw')+')' : null;
 const stageFirst = sheets[C].rows.length + 1;
 const gross = b.gross || b.parts;
 let previousSection;
 for (const [key,heading,expr,scopeLabel] of stageCells) {
  if (heading !== previousSection) {
   ledgerSection(heading);
   previousSection = heading;
  }
  const n = sheets[C].rows.length+1;
  const value = gross[key];
  const share = isProp&&a.scope.includes(key)?b.allocation.factor:1;
  const net = value==null?'':value*share;
  const scenarioValue = value==null?'':baseScenario.parts[key]*share;
  add(C,key,[key,formula(farm?'IF('+validFarmInput+','+expr+',"")':expr,value??''),formula('IF('+scope(key)+','+al('factor')+',1)',share),
   formula('IF(AND(ISNUMBER(B'+n+'),ISNUMBER(C'+n+')),B'+n+'*C'+n+',"")',net),
   formula('IF(ISNUMBER(D'+n+'),D'+n+'*'+scenarioFactor(key,i)+',"")',scenarioValue),
   formula('IF(AND(ISNUMBER(D'+n+'),ISNUMBER('+c('energy')+')),D'+n+'*'+c('energy')+'/1000000,"")',net===''?'':net*annual/1e6),
   scopeLabel,heading+' · '+status(value)],{1:4,2:69,3:4,4:4,5:4});
 }
 const disp = mode === 'displacement' ? b.allocation.adjustment : 0;
 const signedCredit = 'IF('+al('method')+'="'+allocationMethods.displacement+'",IF('+al('qa')+'="Ready",-'+al('avoided')+',"") ,0)';
 ledgerSection('Co-products and avoided emissions');
 const adj = add(C,'displacement',['Co-product displacement',null,null,formula(signedCredit,disp),formula(signedCredit,disp),
  formula('IF(ISNUMBER(D'+(sheets[C].rows.length+1)+'),D'+(sheets[C].rows.length+1)+'*'+c('energy')+'/1000000,"")',disp*annual/1e6),
  'Lifecycle adjustment','Applies only to documented displacement'],{3:4,4:4,5:4});
 const optionalFields = legacy || farm ? [] : ['chemicals','distribution','endUse'];
 const optionalChecks=optionalFields.map(key=>',OR('+i(key)+'="",AND('+t(key)+','+i(key)+'>=0))').join('');
 const ready = 'AND(ISNUMBER('+c('energy')+'),'+al('qa')+'="Ready"'+
  (farm?','+validFarmInput:',COUNT('+stageCells.slice(0,4).map(([key])=>c(key,1)).join(',')+')=4'+optionalChecks)+')';
 const setValue = (sheet,key,expr,value,unit,note='') => {
  const row = sheets[sheet].rows[refs[sheet][key]-1];
  row.cells.splice(1,Infinity,formula(expr,value),unit,note);
  row.styles[1]=unit==='fraction'?69:
   sheet===C&&['baseline','scenario','reduction'].includes(key)?10:4;
 };
 const positives = stageCells.reduce((sum,[key])=>sum+Math.max(0,gross[key]*(isProp&&a.scope.includes(key)?b.allocation.factor:1)||0),0);
 setValue(C,'baseline','IF('+ready+',SUM(D'+stageFirst+':D'+adj+'),"")',b.ci,ciUnit,'Attributed emissions plus signed credit');
 setValue(C,'scenario','IF('+ready+',SUM(E'+stageFirst+':E'+adj+'),"")',baseScenario.ci,ciUnit,'Uses the selected optimizer settings');
 setValue(C,'reduction','IF(ISNUMBER('+c('baseline')+'),'+c('baseline')+'-'+c('scenario')+',"")',b.ci-baseScenario.ci,ciUnit);
 setValue(C,'gross','SUMIF(D'+stageFirst+':D'+adj+',">0")',positives,ciUnit);
 setValue(C,'credits','SUMIF(D'+stageFirst+':D'+adj+',"<0")',b.ci-positives,ciUnit);
 section(C,'Scope reconciliation');
 add(C,null,['Classification',null,null,'Baseline CI',null,'Annual t CO₂e'],{0:1,1:1,2:1,3:1,4:1,5:1});
 for (const label of ['Scope 1','Scope 2','Scope 3','Scope not assigned','Lifecycle adjustment']) {
  const total=stageCells.filter(([, , ,scopeLabel])=>scopeLabel===label).reduce((sum,[key])=>sum+(gross[key]||0)*(isProp&&a.scope.includes(key)?b.allocation.factor:1),label==='Lifecycle adjustment'?disp:0);
  add(C,null,[label,null,null,formula('SUMIF(G'+stageFirst+':G'+adj+',"'+label+'",D'+stageFirst+':D'+adj+')',total),null,
   formula('IF(ISNUMBER('+c('energy')+'),D'+(sheets[C].rows.length+1)+'*'+c('energy')+'/1000000,"")',total*annual/1e6)]);
 }
 writeAllocationAudit();

 function writeAllocationAudit() {
  const productRows = products.map((_,j)=>refs[A]['product'+j]);
  const included = col => productRows.map(n=>'B'+n+'=TRUE').map((enabled,j)=>'IF('+enabled+','+col(productRows[j])+',TRUE)');
  const count = 'COUNTIF(B'+productRows[0]+':B'+productRows.at(-1)+',TRUE)';
  const validProduct = 'AND('+count+'>0,'+included(n=>
   'AND(LEN(TRIM(A'+n+'))>0,ISNUMBER(C'+n+'),C'+n+'>0,'+
    'OR(D'+n+'="",AND(ISNUMBER(D'+n+'),D'+n+'>0)),OR(E'+n+'="",AND(ISNUMBER(E'+n+'),E'+n+'>=0)))'
  ).join(',')+')';
  const total = column => 'SUMIF(B'+productRows[0]+':B'+productRows.at(-1)+',TRUE,'+column+productRows[0]+':'+column+productRows.at(-1)+')';
  const withLhv = 'AND('+validProduct+','+included(n=>'ISNUMBER(F'+n+')').join(',')+')';
  const withPrice = 'AND('+validProduct+','+included(n=>'ISNUMBER(G'+n+')').join(',')+')';
  const validFuelMass = 'AND(ISNUMBER('+al('mass')+'),'+al('mass')+'>0)';
  const validFuelPrice = 'AND(ISNUMBER('+al('price')+'),'+al('price')+'>0)';
  const before = al('mass')+'*'+al('price');
  const shares = b.allocation?.shares || {};
  setValue(A,'energyShare','IF(AND('+withLhv+',ISNUMBER('+c('energy')+')),'+c('energy')+'/('+c('energy')+'+'+total('F')+'),"")',shares.energy??'','fraction');
  setValue(A,'massShare','IF(AND('+validProduct+','+validFuelMass+'),'+al('mass')+'/('+al('mass')+'+'+total('C')+'),"")',shares.mass??'','fraction');
  setValue(A,'economicShare','IF(AND('+withPrice+','+validFuelMass+','+validFuelPrice+'),'+before+'/('+before+'+'+total('G')+'),"")',shares.economic??'','fraction');
  const method = al('method');
  const eq = key => method+'="'+allocationMethods[key]+'"';
  const inactive = 'OR('+eq('none')+','+eq('displacement')+')';
  const selected = 'IF('+eq('energy')+','+al('energyShare')+',IF('+eq('mass')+','+al('massShare')+','+al('economicShare')+'))';
  const share = key => 'IF('+scope(key)+',N('+c(key,1)+'),0)';
  const sharedTotal = sharedKeys.map(share).join('+') || '0';
  const validShared = sharedKeys.map(key=>'IF('+scope(key)+',AND(ISNUMBER('+c(key,1)+'),'+c(key,1)+'>=0),TRUE)').join(',');
  const red = al('context')+'="'+allocationContexts.red+'"';
  const baseChecks = 'AND('+al('confirmed')+'=TRUE,'+al('class')+'="product",OR(NOT('+red+'),'+eq('energy')+'))';
  const propChecks = 'AND(OR('+['energy','mass','economic'].map(eq).join(',')+'),ISNUMBER('+selected+'),'+sharedTotal+'>0'+(validShared?','+validShared:'')+')';
  const dispChecks = 'AND(ISNUMBER('+al('avoided')+'),'+al('avoided')+'>0,LEN(TRIM('+al('evidence')+'))>0)';
  const qa = farm||legacy ? 'IF('+eq('none')+',"Ready","Use no allocation for this inventory")' :
   'IF('+eq('none')+',"Ready",IF(AND('+baseChecks+',IF('+eq('displacement')+','+dispChecks+','+propChecks+')),"Ready","Review allocation inputs"))';
  setValue(A,'qa',qa,'Ready','',farm?'Separate farm methane model':'Input readiness, not approval');
  setValue(A,'factor','IF('+al('qa')+'<>"Ready","",IF('+inactive+',1,'+selected+'))',b.allocation?.factor??1,'fraction');
  setValue(A,'shared','IF('+al('qa')+'<>"Ready","",IF('+inactive+',0,'+sharedTotal+'))',b.allocation?.shared??0,ciUnit);
  setValue(A,'adjustment','IF('+al('qa')+'<>"Ready","",IF('+eq('displacement')+',-'+al('avoided')+',-'+al('shared')+'*(1-'+al('factor')+')))',b.allocation?.adjustment??0,ciUnit);
  setValue(A,'reconcile','IF(ISNUMBER('+c('baseline')+'),IF(ABS(SUM(C'+refs[A][stageCells[0][0]]+':C'+refs[A][stageCells.at(-1)[0]]+')+'+al('adjustment')+'-'+c('baseline')+')<0.0000001,"PASS","REVIEW"),"Needs inputs")','PASS');
  for (const [key] of stageCells) {
   const row = sheets[A].rows[refs[A][key]-1];
   const value = gross[key];
   const shareValue = isProp&&a.scope.includes(key)?b.allocation.factor:1;
   row.cells[2] = formula('IF(ISNUMBER('+c(key,1)+'),'+c(key,1)+',"")',value??'');
   row.cells[3] = formula(c(key,2),shareValue);
   row.cells[4] = formula('IF(ISNUMBER('+c(key,3)+'),'+c(key,3)+',"")',value==null?'':value*shareValue);
   row.cells[5] = formula('IF(ISNUMBER('+al(key,4)+'),'+al(key,4)+'-'+al(key,2)+',"")',value==null?'':value*(shareValue-1));
  }
  sheets[A].validation = [
   [al('method').split('!').at(-1),farm||legacy?[allocationMethods.none]:Object.values(allocationMethods)],
   [al('context').split('!').at(-1),Object.values(allocationContexts)],
   [al('class').split('!').at(-1),['unreviewed','product','waste']],
   ...sharedKeys.map(key=>[al(key).split('!').at(-1),['Shared','Fuel-only']])
  ];
 }

 title(O,'Selected scenario and all sixteen combinations',
  ['Scenario',...controls.map(key=>labels[key]+' (%)'),'Baseline CI','Scenario CI','CI reduction','Target','Annual costs','Net benefit']);
 const variants = [{key:'selected',title:'Selected scenario',levels:settings,inputs:true},
  ...Array.from({length:16},(_,mask) => {
   const levels = Object.fromEntries(controls.map((key,j)=>[key,mask&(1<<j)?100:0]));
   return {key:'case'+mask,title:controls.filter(key=>levels[key]).map(key=>labels[key]).join(' + ')||'Unchanged baseline',levels};
  })];
 function variantExpression(pct) {
  const parts = stageCells.map(([key])=>'N('+c(key,3)+')*'+scenarioFactor(key,pct));
  return 'IF(ISNUMBER('+c('baseline')+'),'+parts.join('+')+'+N('+c('displacement',3)+'),"")';
 }
 for (const variant of variants) {
  const {key,levels} = variant;
  const n = sheets[O].rows.length+1;
  const use = name => controls.includes(name) ? col(controls.indexOf(name)+1)+n : '0';
  const scenario = run.evaluate(levels).ci;
  add(O,key,[variant.title,...controls.map(k=>variant.inputs?formula(i(k),levels[k]):levels[k]),
   formula('IF(ISNUMBER('+c('baseline')+'),'+c('baseline')+',"")',b.ci),
   formula(variantExpression(use),scenario),
   formula('IF(ISNUMBER(G'+n+'),F'+n+'-G'+n+',"")',b.ci-scenario),
   formula('IF(AND(ISNUMBER(G'+n+'),ISNUMBER('+i('target')+')),IF(G'+n+'<='+i('target')+',"Meets","Above"),"No target")',
    target==null?'No target':scenario<=target?'Meets':'Above')]);
 }

 title(S,'Response, lever ranking and two-variable sensitivity',
  ['Measure / point','0%','25%','50%','75%','100%']);
 for (const key of controls) {
  const vals = [0,25,50,75,100].map(level=>formula(
   variantExpression(name=>name===key?String(level):'0'),
   run.evaluate(Object.fromEntries(controls.map(name=>[name,name===key?level:0]))).ci));
  add(S,key,[labels[key],...vals]);
 }
 section(S,'Tornado ranking · full setting reduction');
 add(S,null,['Measure','Potential reduction (g CO₂e/MJ)'],{0:1,1:1});
 const ranked = controls.map(key=>({key,value:b.ci-run.evaluate(Object.fromEntries(controls.map(name=>[name,name===key?100:0]))).ci})).sort((x,y)=>y.value-x.value);
 const tornadoFirst = sheets[S].rows.length+1;
 for (const {key,value} of ranked)
  add(S,null,[labels[key],formula('IF(ISNUMBER('+c('baseline')+'),'+ref(S,key,1)+'-'+ref(S,key,5)+',"")',value)]);
 sheets[S].chart = {label:'Full lever reduction (g CO₂e/MJ)',first:tornadoFirst,last:tornadoFirst+ranked.length-1,
  category:'A',value:'B',labels:ranked.map(item=>labels[item.key]),values:ranked.map(item=>item.value),horizontal:true};
 const [x,y] = controls;
 section(S,labels[x]+' × '+labels[y]+' · scenario CI');
 const levels = [0,25,50,75,100];
 const heatHeader = add(S,null,[labels[y]+' ↓ / '+labels[x]+' →',...levels],{0:1,1:1,2:1,3:1,4:1,5:1});
 for (const yLevel of levels) {
  const n = sheets[S].rows.length+1;
  add(S,null,[yLevel,...levels.map((xLevel,j)=>formula(
   variantExpression(key=>key===x?col(j+1)+'$'+heatHeader:key===y?'$A'+n:'0'),
   run.evaluate(Object.fromEntries(controls.map(key=>[key,key===x?xLevel:key===y?yLevel:0]))).ci))]);
 }
 sheets[S].heatmap = 'B'+(heatHeader+1)+':F'+(heatHeader+levels.length);

 title(E,'Documented CAPEX, cash flow, conditional credit value and abatement costs',
  ['Scenario / assumption','Scenario CI / value','Reduction','CAPEX','Fixed O&M','Power cost','Gas savings','Annualized capital','O&M change','Conditional LCFS','Net benefit','Cost per tonne']);
 input(E,'used','Use displayed assumptions',finance.confirmed === true);
 const lcfsEconomics = [
  ['price','LCFS price','USD/t'],['share','LCFS eligible share','%'],['eer','Energy economy ratio','ratio']
 ];
 for (const [key,label,unit] of lcfsEconomics)
  input(E,key,label,screeningLcfs&&finance.confirmed?cache(finance[key],null):null,unit,screeningLcfs?'User assumption':'Excluded for this pathway');
 for (const [key,label,unit] of [
  ['life','Project life','years'],['rate','Discount rate','%'],['ppa','Renewable electricity premium','USD/kWh'],
  ['gasPrice','Process natural gas price','USD/MJ'],['railCost','Rail transport cost change','USD/t-km'],
  ['pipeCost','Pipe delivery cost change','USD/MJ-mile']
 ]) input(E,key,label,finance.confirmed?cache(finance[key],null):null,unit,'User assumption');
 section(E,'Implementation costs by measure');
 add(E,null,['Measure','Capital cost (USD)','O&M change (USD/year)'],{0:1,1:1,2:1});
 for (const key of controls)
  add(E,key,[labels[key],finance.confirmed?cache(finance.cost[key]?.capex,null):null,finance.confirmed?cache(finance.cost[key]?.opex,null):null],{1:2,2:2});
 const econChecks = [
  e('used')+'=TRUE','ISNUMBER('+c('baseline')+')',
  ...['life','rate','ppa','gasPrice',farm?'pipeCost':'railCost'].map(key=>'ISNUMBER('+e(key)+')'),
  ...(screeningLcfs?['price','share','eer'].map(key=>'ISNUMBER('+e(key)+')'):[]),
  ...['rate','ppa','gasPrice'].map(key=>e(key)+'>=0'),e('life')+'>0',
  ...(screeningLcfs?[e('price')+'>=0',e('share')+'>=0',e('share')+'<=100',e('eer')+'>0']:[]),
  ...controls.flatMap(key=>['ISNUMBER('+e(key)+')',e(key)+'>=0','ISNUMBER('+ref(E,key,2)+')'])
 ];
 const econOK = 'AND('+econChecks.join(',')+')';
 linked(E,'ready','Data readiness','IF('+econOK+',"Ready","Needs inputs")',finance.ready?'Ready':empty);
 const allowed = expression => 'IF('+e('ready')+'="Ready",'+expression+',"")';
 const econStart = sheets[E].rows.length+2;
 section(E,'Annualized economics by scenario');
 const econValues=[];
 for (const {key,title:label,levels} of variants) {
  const n=sheets[E].rows.length+1;
  const value=finance.ready?run.economics(levels):null;
  const pct=k=>controls.includes(k)?opt(key,controls.indexOf(k)+1)+'/100':'0';
  const capital=controls.map(k=>e(k)+'*'+pct(k)).join('+');
  const fixed=controls.map(k=>ref(E,k,2)+'*'+pct(k)).join('+');
  const power=(farm?i('electricity')+'*12/'+i('months'):i('kwh')+'*'+c('energy'))+'*'+pct('power')+'*'+e('ppa');
  const gas=(farm?i('naturalGas')+'*'+f('mmbtu')+'*12/'+i('months')+'*'+pct('gas'):
   i('ng')+'*'+c('energy')+'*(1-(1-'+pct('heat')+')*(1-'+pct('tuning')+'))')+'*'+e('gasPrice');
  const transport=farm?i('pipe')+'*'+c('energy')+'*'+pct('demand')+'*'+e('pipeCost'):
   i('kg')+'/1000*'+i('km')+'*'+c('energy')+'*'+pct('rail')+'*'+e('railCost');
  const capRecovery='IF('+e('rate')+'=0,1/'+e('life')+',('+e('rate')+'/100)/(1-(1+'+e('rate')+'/100)^(-'+e('life')+')))';
  const noCredit=e('share')+'=0';
  add(E,key,[label,
   formula('IF(ISNUMBER('+opt(key,6)+'),'+opt(key,6)+',"")',run.evaluate(levels).ci),
   formula('IF(ISNUMBER('+opt(key,7)+'),'+opt(key,7)+',"")',b.ci-run.evaluate(levels).ci),
   formula(allowed(capital),cache(value?.capex)),formula(allowed(fixed),cache(value?.fixed)),
   formula(allowed(power),cache(value?.electricityCost)),formula(allowed(gas),cache(value?.gasSavings)),
   formula(allowed('D'+n+'*'+capRecovery),cache(value?.annualCapex)),
   formula(allowed('E'+n+'+F'+n+'-G'+n+'+'+transport),cache(value?.opex)),
   formula(allowed(screeningLcfs?'IF('+noCredit+',0,C'+n+'*'+c('energy')+'*'+e('share')+'/100/1000000*'+e('price')+')':'0'),cache(value?.credit)),
   formula(allowed('J'+n+'-H'+n+'-I'+n),cache(value?.net)),
   formula(allowed('IF(C'+n+'>0,(H'+n+'+I'+n+')/(C'+n+'*'+c('energy')+'/1000000),"")'),cache(value?.mac))
  ]);
  econValues.push(cache(value?.net,null));
  sheets[O].rows[refs[O][key]-1].cells.push(
   formula('IF(ISNUMBER('+ref(E,key,7)+'),'+ref(E,key,7)+'+'+ref(E,key,8)+',"")',value?value.annualCapex+value.opex:''),
   formula('IF(ISNUMBER('+ref(E,key,10)+'),'+ref(E,key,10)+',"")',cache(value?.net))
  );
 }
 sheets[E].chart={label:'Net annual benefit (USD/year)',first:econStart,last:econStart+variants.length-1,
  category:'A',value:'K',labels:variants.map(item=>item.title),values:econValues};
 writeCreditReport();

 function writeCreditReport() {
  title(R,'Program-separated screening estimates',simple);
  linked(R,'baseline','Baseline CI',c('baseline'),b.ci,ciUnit);
  linked(R,'scenario','Selected scenario CI',c('scenario'),baseScenario.ci,ciUnit);
  const band = (label,key,statusExpr,readyStatus) => {
   linked(R,key,label,statusExpr,readyStatus,'','Conditional planning only');
  };
  const screenSupported = ['rd','bd','ethanol','rng'].includes(b.path.fuel);
  const rng = b.path.fuel === 'rng';
  const lcfs = credit.lcfs;
  const rin = credit.rin;
  const z45 = credit.z45;
  const present = (...keys) => keys.map(key=>'ISNUMBER('+r(key)+')').join(',');
  const only = (flag, expr) => 'IF('+r(flag)+'="Ready",'+expr+',"")';
  section(R,'California LCFS');
  const lcfsConfig = documentedLcfs[b.path.fuel];
  if (lcfsConfig) {
   const use = lcfsConfig.uses[lcfs.use];
   const validInputs = use && lcfs.pathCode && lcfs.confirmed &&
    [lcfs.approvedCi,lcfs.quantity,lcfs.price].every(Number.isFinite) && lcfs.quantity>=0 && lcfs.price>=0;
   input(R,'lcUse','2026 fuel use',use?.[0]);
   input(R,'lcCode','CARB fuel pathway code',lcfs.pathCode);
   input(R,'lcConfirm','Reporting conditions reviewed',lcfs.confirmed);
   input(R,'lcApprovedCi','Approved pathway CI before EER adjustment',lcfs.approvedCi,ciUnit);
   input(R,'lcQuantity','Qualifying 2026 fuel quantity',lcfs.quantity,lcfsConfig.unit);
   input(R,'lcPrice','Credit price',lcfs.price,'USD/t');
   const useFactor = index => lcfsConfig.uses.reduceRight((otherwise, item) =>
    'IF('+r('lcUse')+'="'+item[0]+'",'+item[index]+','+otherwise+')','""');
   linked(R,'lcBenchmark','2026 benchmark CI',useFactor(1),use?.[1]??'',ciUnit,'17 CCR §95484');
   linked(R,'lcEer','Energy economy ratio',useFactor(2),use?.[2]??'','ratio','17 CCR §95486.1, Table 5');
   input(R,'lcEnergy','CARB fuel energy density',lcfsConfig.energy,'MJ/'+lcfsConfig.unit,'17 CCR §95486, Table 4');
   band('LCFS status','lcReady','IF(AND(LEN(TRIM('+r('lcCode')+'))>0,'+r('lcConfirm')+'=TRUE,'+
    present('lcBenchmark','lcEer','lcApprovedCi','lcQuantity','lcPrice')+','+r('lcQuantity')+'>=0,'+r('lcPrice')+'>=0),"Ready","Needs inputs")',
    validInputs?'Ready':empty);
   const raw = '('+r('lcBenchmark')+'*'+r('lcEer')+'-'+r('lcApprovedCi')+')*'+r('lcQuantity')+'*'+r('lcEnergy')+'/1000000';
   const balance = validInputs ? documentedLcfsBalance(b.path.fuel,use,lcfs.approvedCi,lcfs.quantity) : null;
   linked(R,'lcBalance','Estimated LCFS balance',only('lcReady',b.path.fuel==='saf'?'MAX(0,'+raw+')':raw),cache(balance),'t CO₂e','Positive = credits. Negative = deficits.');
   linked(R,'lcValue','Estimated LCFS value',only('lcReady',r('lcBalance')+'*'+r('lcPrice')),
    cache(balance===null?null:balance*lcfs.price),'USD','Negative value represents estimated deficit cost.');
  } else {
   for (const [key,label,value,unit] of [
    ['lcConfirm','Eligibility reviewed by user',lcfs.confirmed],['lcBenchmark','Benchmark CI',lcfs.benchmark,ciUnit],
    ['lcShare','Eligible production share',lcfs.share,'%'],['lcPrice','Credit price',lcfs.price,'USD/t'],['lcEer','Energy economy ratio',lcfs.eer,'ratio']
   ]) input(R,key,label,value,unit);
   const lcReady = screenSupported && lcfs.confirmed && [lcfs.benchmark,lcfs.share,lcfs.price,lcfs.eer].every(Number.isFinite) &&
    lcfs.benchmark>=0 && lcfs.share>=0 && lcfs.share<=100 && lcfs.price>=0 && lcfs.eer>0;
   const lcState = !screenSupported?'Not modeled':lcReady?'Ready':empty;
   band('LCFS status','lcReady',screenSupported?'IF(AND(ISNUMBER('+c('baseline')+'),'+r('lcConfirm')+'=TRUE,'+
    present('lcBenchmark','lcShare','lcPrice','lcEer')+','+r('lcShare')+'>=0,'+r('lcShare')+'<=100,'+
    r('lcBenchmark')+'>=0,'+r('lcPrice')+'>=0,'+r('lcEer')+'>0),"Ready","Needs inputs")':'"Not modeled"',lcState);
   const baseLc = lcReady?(lcfs.benchmark*lcfs.eer-b.ci)*annual*lcfs.share/100/1e6:null;
   const optLc = lcReady?(lcfs.benchmark*lcfs.eer-baseScenario.ci)*annual*lcfs.share/100/1e6:null;
   for (const [key,label,ci,result] of [['lcBase','Baseline volume','baseline',baseLc],['lcOpt','Scenario volume','scenario',optLc]])
    linked(R,key,label,only('lcReady','('+r('lcBenchmark')+'*'+r('lcEer')+'-'+c(ci)+')*'+c('energy')+'*'+r('lcShare')+'/100000000'),cache(result),'t CO₂e/year');
   linked(R,'lcDelta','Incremental conditional value',only('lcReady','('+r('lcOpt')+'-'+r('lcBase')+')*'+r('lcPrice')),
    lcReady?(optLc-baseLc)*lcfs.price:'','USD/year');
  }

  section(R,'Renewable Fuel Standard · RINs');
  for (const [key,label,value,unit] of [
   ['rinConfirm','Eligibility reviewed by user',rin.confirmed],['rinCode','Approved D-code',rin.code],['rinYear','Compliance year',rin.year,'year'],
   ['rinShare','Eligible production share',rin.share,'%'],['rinPrice','RIN price',rin.price,'USD/RIN'],['rinEv','Equivalence value',rng?null:rin.ev,'RIN/gal']
  ]) input(R,key,label,value,unit);
  const rinEnergyUnit = 77000*.00105505585262;
  const rinLhv = b.path.fuel==='rd' ? ',OR('+r('rinYear')+'<>2026,ABS('+r('rinEv')+'-1.7)>=0.001,'+f('energy')+'/0.00105505585262>=123500)' : '';
  const rinCheck = screenSupported && rin.confirmed && !!rin.code && [rin.year,rin.share,rin.price].every(Number.isFinite) && rin.share>=0 && rin.share<=100 &&
   rin.price>=0 && (rng || (Number.isFinite(rin.ev)&&rin.ev>0&&rin.ev<=5)) &&
   (b.path.fuel!=='rd'||rin.year!==2026||Math.abs(rin.ev-1.7)>=.001||b.path.energy/.00105505585262>=123500);
  band('RIN status','rinReady',screenSupported?'IF(AND(ISNUMBER('+c('baseline')+'),'+r('rinConfirm')+'=TRUE,LEN(TRIM('+r('rinCode')+'))>0,'+
   present('rinShare','rinPrice','rinYear')+','+r('rinShare')+'>=0,'+r('rinShare')+'<=100,'+r('rinPrice')+'>=0'+
   (rng?'':','+present('rinEv')+','+r('rinEv')+'>0,'+r('rinEv')+'<=5')+rinLhv+'),"Ready","Needs inputs")':'"Not modeled"',
   !screenSupported?'Not modeled':rinCheck?'Ready':empty);
  const modeledRins=rinCheck?(rng?annual/rinEnergyUnit:b.volume*rin.ev)*rin.share/100:null;
  linked(R,'rinCount','Annual RINs · baseline and scenario',only('rinReady',(rng?c('energy')+'/'+rinEnergyUnit:i('volume')+'*'+r('rinEv'))+'*'+r('rinShare')+'/100'),cache(modeledRins),'RIN/year');
  linked(R,'rinValue','Conditional gross value',only('rinReady',r('rinCount')+'*'+r('rinPrice')),rinCheck?modeledRins*rin.price:'','USD/year');
  linked(R,'rinDelta','Incremental RIN value from CI only',only('rinReady','0'),rinCheck?0:'','USD/year');

  section(R,'45Z · separately documented rates');
  for (const [key,label,value,unit] of [
   ['zQty','Qualifying volume sold',z45.qty,'qualifying gal / GGE'],['zBase','Baseline 45Z emissions rate',z45.base,'kg CO₂e/MMBtu'],
   ['zOpt','Scenario 45Z emissions rate',z45.opt,'kg CO₂e/MMBtu'],['zPwa','PWA applies',z45.pwa],['zConfirm','Eligibility conditions reviewed',z45.confirmed]
  ]) input(R,key,label,value,unit);
  const zSupported = ['bd','rd','ethanol','saf','rng','h2'].includes(b.path.fuel);
  const animal = ['Dairy manure','Swine manure','Beef cattle manure'].includes(b.path.feedstock);
  const zReady = zSupported&&z45.confirmed && ['yes','no'].includes(z45.pwa)&&[z45.qty,z45.base,z45.opt].every(Number.isFinite)&&
   z45.qty>0&&z45.base<=50&&z45.opt<=50&&(animal||z45.base>=0&&z45.opt>=0);
  band('45Z status','zReady',zSupported?'IF(AND('+r('zConfirm')+'=TRUE,'+present('zQty','zBase','zOpt')+
   ','+r('zQty')+'>0,'+r('zBase')+'<=50,'+r('zOpt')+'<=50,OR('+r('zPwa')+'="yes",'+r('zPwa')+'="no")'+
   (animal?'':','+r('zBase')+'>=0,'+r('zOpt')+'>=0')+'),"Ready","Needs inputs")':'"Not modeled"',!zSupported?'Not modeled':zReady?'Ready':empty);
  const amount=z45.pwa==='yes'?1.09:.22;
  const estimate=rate=>z45.qty*amount*Math.round((50-rate)/5)/10;
  for (const [key,label,rate,value] of [['zBaseValue','Baseline tax credit','zBase',z45.base],['zOptValue','Scenario tax credit','zOpt',z45.opt]])
   linked(R,key,label,only('zReady',r('zQty')+'*IF('+r('zPwa')+'="yes",1.09,0.22)*ROUND((50-'+r(rate)+')/50,1)'),zReady?estimate(value):'','USD/year');
  linked(R,'zDelta','Incremental tax credit',only('zReady',r('zOptValue')+'-'+r('zBaseValue')),zReady?estimate(z45.opt)-estimate(z45.base):'','USD/year');
  add(R,null,['Program results are separate and conditional. Use the approved pathway, methodology and documented eligibility.']);
 }

 title(G,'Reference catalog · separate from facility factors',simple);
 for (const [heading,entries] of run.referenceGroups) {
  section(G,heading);
  for (const [label,value,unit,source] of entries) add(G,null,[label,value,unit,source]);
 }
 if (farm) {
  for (const key of Object.keys(refs[F]).filter(key=>key!=='grid')) {
   const row = sheets[F].rows[refs[F][key]-1].cells;
   linked(G,key,row[0],f(key),row[1],row[2],'Dairy screening model constant');
  }
 }
 add(G,null,['Model scope','Facility factors applied to this run are on Emission factors.']);

 title(K,'How to read and edit this workbook',['Key','Meaning']);
 for (const row of [
  ['Amber cells','Editable source inputs. Enter values in the displayed units.'],
  ['Green cells','Linked calculations. Excel recalculates on open or edit.'],
  ['Blank / Not provided','No documented value was entered. Optional gaps are excluded from the total.'],
  ['Zero','Explicit zero or a calculation with zero activity.'],
  ['Needs inputs','The defined prerequisites have not been met for this output.'],
  ['No allocation','Each stage remains fully attributed to the fuel.'],
  ['Screening output','Results are model estimates and do not establish program approval.']
 ]) add(K,null,row);

 title(M,'Calculation methods, factor provenance and reference links',['Topic','Method or source','Application']);
 for (const row of [
  ['CIVanta workflow','https://www.globalbioenergywatch.org/civanta-new','Active plant snapshot and scenario settings'],
  ['Fuel energy basis',run.energySource,'Applied value and units are on Emission factors'],
  ['Lifecycle emissions','Activity × applicable factor, normalized to MJ of fuel','Direct entries are normalized in the form'],
  ['Allocation','Allocate only selected shared gross stages; fuel-specific emissions stay with fuel','Displacement is a separate documented signed credit'],
  ['Optimizer','Apply the selected measures to the relevant gross activities before reallocation','Heat and tuning apply sequentially to the same process heat'],
  ['Conditional LCFS','https://ww2.arb.ca.gov/our-work/programs/low-carbon-fuel-standard','Separate program inputs'],
  ['Conditional RINs','https://www.epa.gov/renewable-fuel-standard-program','Eligible quantity and approved equivalence value'],
  ['Conditional 45Z','https://www.irs.gov/irb/2026-41_irb','Requires independently supplied emissions rates'],
  ['Reference factors','See Global factor library and Emission factors','Facility overrides are recorded on the applied sheet']
 ]) add(M,null,row);
 return [C,I,F,G,K,O,S,E,R,M,A].map(name=>sheets[name]);
}

let getSavedCreditInputs = () => ({});

function fullCivantaSnapshot(b) {
 const saved = getSavedCreditInputs();
 const value = id => saved[id] === '' ? null : saved[id] ?? null;
 const number = id => value(id) === null || !Number.isFinite(Number(value(id))) ? null : Number(value(id));
 const checked = id => saved[id] === true;
 const confirmed = $('confirmEconomics').checked;
 const settings = {...optim};
 const finance = structuredClone(econ);
 return {
  plant:$('activePlantName').textContent, baseline:b,
  inputs:{...(b.kind==='dairy'?b.inputs:generic)}, allocation:structuredClone(allocation),
  settings, labels:OPT_LABELS, controls:optControls(), target:Number.isFinite(optimizationTarget)?optimizationTarget:null,
  measuredLhv:b.kind==='generic' && usesMeasuredLhv(b.path),
  energySource:b.kind==='dairy'?'CIVanta dairy screening model':productionBasis(CATALOG.find(path=>path.id===b.path.id)).source,
  fieldLabels:Object.fromEntries([...gfields,...gadvance,...inventoryDetails,energyField,...DSEC.flatMap(group=>group.fields)]
   .map(([key,label,unit])=>[key,[label,key==='digester'?'':unit]])),
  dairySections:DSEC.filter(group=>group.fields.length).map(group=>[group.title,group.fields.map(([key])=>key)]),
  finance:{...finance,confirmed,ready:confirmed&&!economicInputError()},
  credit:{
   lcfs:{confirmed:checked('lconfirm'),benchmark:number('bench'),share:number('share'),price:number('lcfsprice'),eer:number('eer'),
    use:number('lcfsUse'),pathCode:value('lcfsPathCode')?.trim(),approvedCi:number('lcfsApprovedCi'),quantity:number('lcfsQuantity')},
   rin:{confirmed:checked('rinConfirmed'),code:value('rinDcode'),year:number('rinYear'),share:number('rinShare'),
    price:number('rinPrice'),ev:number('rinEv')},
   z45:{confirmed:['z45Domestic','z45Origin','z45Reg','z45Sale'].every(checked),qty:number('z45Qty'),base:number('z45BaseRate'),
    opt:number('z45OptRate'),pwa:value('z45Pwa')}
  },
  referenceGroups:[['CIVanta coefficients and pathway energy references',[
   ['Truck-to-rail screening reduction',.78,'fraction','CIVanta optimizer coefficient'],
   ['Energy conversion',.00105505585262,'MJ/Btu','CIVanta unit conversion'],
   ['Renewable gas RIN energy basis',77000,'Btu LHV/RIN','CIVanta RIN screening method'],
   ...CATALOG.filter(path=>path.energy>0).map(path=>[path.name,path.energy,'MJ/'+(path.fuel==='rng'?'MMBtu':path.fuel==='h2'?'kg':'US gal'),'Catalog energy reference'])
  ]]],
  evaluate:levels=>scenarioFor(b,levels),
  economics:levels=>economicScenarioFor(b,levels,finance)
 };
}

$('downloadExcel').onclick = async () => {
 if (!baseline) return;
 const run = fullCivantaSnapshot(baseline);
 const button = $('downloadExcel');
 const status = $('excelDownloadStatus');
 button.disabled = true;
 status.textContent = 'Preparing workbook…';
 try {
  const asset = async name => {
   const response = await fetch(new URL(name, location.href));
   if (!response.ok) throw new Error('The workbook formatting assets could not be loaded.');
   return response;
  };
  const [{SOURCES, ELECTRICITY_REGIONS, DAIRY, MODEL_VERSION},styles,logo] = await Promise.all([
   import('/tools/workspace-engine.mjs'),
   asset('assets/client-workbook-styles.xml').then(response=>response.text()),
   asset('assets/client-workbook-logo.png').then(async response=>new Uint8Array(await response.arrayBuffer()))
  ]);
  const note = 'GBW reference library · ' + MODEL_VERSION;
  run.referenceGroups.push(
   ['Electricity grid regions', ELECTRICITY_REGIONS.map(x=>[x.label,x.gPerKwh,'g CO₂e/kWh',note])],
   ['Process energy and fuels', SOURCES.map(x=>[x.label,x.factor,'g CO₂e/'+x.unit,note])],
   ['Dairy model grid references', Object.entries(DAIRY.LCFS_EF.grid).map(([region,value])=>[region,value,'g CO₂e/kWh','GBW dairy model reference'])]
  );
  const url = URL.createObjectURL(cvWorkbookZip(buildFullCivantaReport(run),styles,logo));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'CIVanta-'+run.baseline.path.id+'.xlsx';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  status.textContent = '';
 } catch (error) {
  status.textContent = 'Excel download could not start. ' + error.message;
 } finally {
  button.disabled = !baseline;
 }
};

function civantaChartAnchor(sheet) {
 const height = sheet.chart.horizontal ? 3100000 : 4350000;
 return '<xdr:oneCellAnchor><xdr:from><xdr:col>'+sheet.widths.length+'</xdr:col><xdr:colOff>140000</xdr:colOff><xdr:row>10</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>'+
  '<xdr:ext cx="6900000" cy="'+height+'"/><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="CIVanta analysis chart"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>'+
  '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId2"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:oneCellAnchor>';
}

function civantaChartXml(sheet) {
 const chart = sheet.chart;
 const direction = chart.horizontal ? 'bar' : 'col';
 const axisPositions = chart.horizontal ? ['l','b'] : ['b','l'];
 const range = col => encXml("'"+sheet.name+"'!$"+col+"$"+chart.first+":$"+col+"$"+chart.last);
 const points = (values,numeric) => values.map((value,i)=>value==null?'':'<c:pt idx="'+i+'"><c:v>'+encXml(numeric?Number(value):value)+'</c:v></c:pt>').join('');
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'+
  '<c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>'+encXml(chart.label)+'</a:t></a:r></a:p></c:rich></c:tx></c:title>'+
  '<c:plotArea><c:layout/><c:barChart><c:barDir val="'+direction+'"/><c:grouping val="clustered"/><c:ser><c:idx val="0"/><c:order val="0"/>'+
  '<c:spPr><a:solidFill><a:srgbClr val="08765A"/></a:solidFill></c:spPr>'+
  '<c:cat><c:strRef><c:f>'+range(chart.category)+'</c:f><c:strCache><c:ptCount val="'+chart.labels.length+'"/>'+points(chart.labels,false)+'</c:strCache></c:strRef></c:cat>'+
  '<c:val><c:numRef><c:f>'+range(chart.value)+'</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="'+chart.values.length+'"/>'+points(chart.values,true)+'</c:numCache></c:numRef></c:val>'+
  '</c:ser><c:gapWidth val="65"/><c:axId val="101"/><c:axId val="102"/></c:barChart>'+
  '<c:catAx><c:axId val="101"/><c:scaling><c:orientation val="'+(chart.horizontal?'maxMin':'minMax')+'"/></c:scaling><c:axPos val="'+axisPositions[0]+'"/><c:tickLblPos val="low"/><c:crossAx val="102"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/></c:catAx>'+
  '<c:valAx><c:axId val="102"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="'+axisPositions[1]+'"/><c:majorGridlines/><c:crossAx val="101"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>'+
  '</c:plotArea><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>';
}
