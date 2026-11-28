const allocationMethods = {
 none: 'No allocation / subdivision',
 energy: 'Energy (LHV)',
 mass: 'Mass allocation',
 economic: 'Economic allocation',
 displacement: 'System expansion / displacement'
};
const allocationContexts = {
 iso: 'ISO 14044 / exploratory LCA',
 red: 'EU RED III / ISCC EU',
 lcfs: 'CA LCFS / CA-GREET',
 rfs: 'US RFS / GREET',
 z45: 'US 45ZCF-GREET',
 corsia: 'CORSIA'
};
const sharedStages = ['Upstream', 'Transport', 'Process heat', 'Electricity', 'Chemicals and fugitives'];
const inventoryDetails = [
 ['upstream', 'Upstream emissions', 'g CO₂e/MJ fuel · enter a negative value only for a documented upstream credit'],
 ['chemicals', 'Chemicals and fugitive emissions', 'g CO₂e/MJ fuel'],
 ['distribution', 'Fuel distribution emissions', 'g CO₂e/MJ fuel'],
 ['endUse', 'End-use emissions', 'g CO₂e/MJ fuel']
];
const newAllocation = () => ({method:'none', context:'', classification:'unreviewed',
 confirmed:false, scope:[], products:Array.from({length:4}, () => ({}))});

function allocateCivanta(a, annualMj, gross) {
 const result = {method:a.method, factor:1, shared:0, adjustment:0, shares:{}, scope:[]};
 if (a.method === 'none') return result;
 const fail = (message, field) => { throw Object.assign(new Error(message), {field}); };
 if (!Object.hasOwn(allocationMethods, a.method)) fail('Select an allocation method.', 'allocMethod');
 if (a.context === 'red' && a.method !== 'energy') fail('Choose Energy (LHV) for this screening context.', 'allocMethod');
 if (!a.confirmed) fail('Confirm that your inventory has no prior allocation or co-product credits.', 'allocConfirmed');
 if (a.classification !== 'product') fail('Confirm documented co-product classification.', 'allocClass');
 if (a.method === 'displacement') {
  if (!Number.isFinite(a.avoided) || a.avoided <= 0) fail('Enter a positive avoided emissions credit.', 'allocAvoided');
  if (!a.evidence?.trim()) fail('Enter the displaced product and supporting source.', 'allocEvidence');
  return {...result, adjustment:-a.avoided};
 }
 if (!Number.isFinite(annualMj) || annualMj <= 0) fail('Enter positive annual fuel energy.', 'volume');
 let mass = 0, energy = 0, revenue = 0, completeLhv = true, completePrice = true, count = 0;
 a.products.forEach((product, i) => {
  if (!Object.values(product).some(value => value !== undefined && value !== null && value !== '')) return;
  count++;
  const key = name => 'alloc' + i + name;
  if (!product.name?.trim()) fail('Enter a co-product name.', key('name'));
  if (!Number.isFinite(product.mass) || product.mass <= 0) fail('Enter a positive annual dry mass.', key('mass'));
  const lhv = Number.isFinite(product.lhv) && product.lhv > 0;
  const price = Number.isFinite(product.price) && product.price >= 0;
  if ((a.method === 'energy' || product.lhv != null) && !lhv) fail('Enter a positive heating value.', key('lhv'));
  if ((a.method === 'economic' || product.price != null) && !price) fail('Enter a nonnegative price. Enter zero only when documented.', key('price'));
  completeLhv &&= lhv;
  completePrice &&= price;
  mass += product.mass;
  if (lhv) energy += product.mass * product.lhv;
  if (price) revenue += product.mass * product.price;
 });
 if (!count) fail('Enter at least one co-product.', 'alloc0name');
 const validMass = Number.isFinite(a.fuelMass) && a.fuelMass > 0;
 const validPrice = Number.isFinite(a.fuelPrice) && a.fuelPrice > 0;
 if ((a.method !== 'energy' || a.fuelMass != null) && !validMass) fail('Enter a positive main fuel mass.', 'allocFuelMass');
 if ((a.method === 'economic' || a.fuelPrice != null) && !validPrice) fail('Enter a positive main fuel price.', 'allocFuelPrice');
 const sales = a.fuelMass * a.fuelPrice;
 result.shares = {
  energy: completeLhv ? annualMj / (annualMj + energy) : null,
  mass: validMass ? a.fuelMass / (a.fuelMass + mass) : null,
  economic: validMass && validPrice && completePrice ? sales / (sales + revenue) : null
 };
 result.factor = result.shares[a.method];
 if (!Number.isFinite(result.factor) || result.factor <= 0 || result.factor > 1) fail('Review the co-product quantities and units.', 'allocMethod');
 result.scope = sharedStages.filter(stage => a.scope.includes(stage));
 if (!result.scope.length) fail('Select at least one shared stage.', 'allocScope0');
 for (const stage of result.scope) {
  const field = 'allocScope' + sharedStages.indexOf(stage);
  if (gross[stage] == null || !Number.isFinite(gross[stage]) || gross[stage] < 0) {
   fail('A shared stage needs a documented, nonnegative gross value.', field);
  }
  result.shared += gross[stage];
 }
 if (result.shared <= 0) fail('Shared emissions must total more than zero.', 'allocScope0');
 result.adjustment = -result.shared * (1 - result.factor);
 return result;
}

function applyCivantaAllocation(gross, allocation) {
 const parts = Object.fromEntries(Object.entries(gross).filter(([, value]) => value != null));
 if (allocation.method === 'displacement') parts['Co-product displacement credit'] = allocation.adjustment;
 else if (allocation.method !== 'none') {
  const shared = allocation.scope.reduce((sum, key) => sum + (parts[key] ?? 0), 0);
  parts['Co-product allocation adjustment'] = -shared * (1 - allocation.factor);
 }
 return parts;
}

function renderAllocationFields() {
 const a = allocation;
 const select = (id, label, options, value) => `<label class="field"><span class="label">${label}</span><select data-key="${id}">${Object.entries(options).map(([key,text]) => `<option value="${key}" ${key===value?'selected':''}>${text}</option>`).join('')}</select></label>`;
 const textField = (key, label, value, placeholder = '') => `<label class="field"><span class="label">${label}</span><input data-key="${key}" value="${esc(value)}" placeholder="${placeholder}"></label>`;
 const check = (key, label, checked) => `<label class="allocation-check"><input type="checkbox" data-key="${key}" ${checked?'checked':''}><span>${label}</span></label>`;
 $('allocationFields').innerHTML = `<div class="grid three">
 ${select('allocMethod','Allocation method',{...allocationMethods,none:'Select a method (optional)'},a.method)}
 ${select('allocContext','Study or regulatory context',{'':'Select a context',...allocationContexts},a.context)}
 ${select('allocClass','Co-product classification',{unreviewed:'Not reviewed',product:'Documented saleable co-product',waste:'Waste / residue'},a.classification)}
 </div>
 <div id="allocationData">
 <div class="grid three">
  ${fieldHtml('allocFuelMass','Main fuel dry mass','kg/year',{allocFuelMass:a.fuelMass})}
  ${fieldHtml('allocFuelPrice','Main fuel net price','USD/kg',{allocFuelPrice:a.fuelPrice})}
  <div class="field"><span class="label">Fuel energy output</span><output id="allocationEnergy"></output><small>MJ/year · linked to Production</small></div>
 </div>
 <div id="allocationProducts" class="allocation-products">${a.products.map((product,i) => `<fieldset class="grid">
  <legend>Co-product ${i+1}</legend>
  ${textField('alloc'+i+'name','Name',product.name,'Enter name')}
  ${fieldHtml('alloc'+i+'mass','Annual dry mass','kg/year',{['alloc'+i+'mass']:product.mass})}
  ${fieldHtml('alloc'+i+'lhv','Lower heating value','MJ/kg',{['alloc'+i+'lhv']:product.lhv})}
  ${fieldHtml('alloc'+i+'price','Net price','USD/kg',{['alloc'+i+'price']:product.price})}
 </fieldset>`).join('')}</div>
 <fieldset id="allocationShared"><legend>Shared emissions stages</legend><div class="grid">
  ${sharedStages.map((stage,i) => check('allocScope'+i,esc(stage),a.scope.includes(stage))).join('')}
 </div></fieldset>
 <div class="grid" id="allocationDisplacement">
  ${fieldHtml('allocAvoided','Documented avoided emissions','g CO₂e/MJ fuel',{allocAvoided:a.avoided})}
  ${textField('allocEvidence','Displaced product and source',a.evidence,'Product and supporting reference')}
 </div>
 ${check('allocConfirmed','I confirm the inventory is gross and contains no prior allocation or co-product credit.',a.confirmed)}
 </div>
 <p id="allocationPreview" class="note" role="status"></p>`;
}

function editAllocation(control) {
 const key = control.dataset.key;
 const value = control.type === 'number' ? control.value === '' ? undefined : control.valueAsNumber :
  control.type === 'checkbox' ? control.checked : control.value;
 const fields = {allocMethod:'method',allocContext:'context',allocClass:'classification',
  allocFuelMass:'fuelMass',allocFuelPrice:'fuelPrice',allocConfirmed:'confirmed',
  allocAvoided:'avoided',allocEvidence:'evidence'};
 const product = /^alloc(\d)(name|mass|lhv|price)$/.exec(key);
 if (product) allocation.products[Number(product[1])][product[2]] = value;
 else if (key.startsWith('allocScope')) {
  const stage = sharedStages[Number(key.slice(10))];
  allocation.scope = [...allocation.scope.filter(item => item !== stage), ...(value ? [stage] : [])];
 } else if (fields[key]) allocation[fields[key]] = value;
}

function updateAllocationPreview() {
 if (!$('allocationPreview')) return;
 const method = allocation.method;
 const legacy = generic._mode === 'legacy';
 for (const select of $('allocationFields').querySelectorAll('select')) select.disabled = legacy;
 const displacement = method === 'displacement';
 $('allocationData').hidden = legacy || method === 'none';
 $('allocationProducts').hidden = displacement;
 $('allocationShared').hidden = displacement;
 $('allocationDisplacement').hidden = !displacement;
 const basis = productionBasis(CATALOG.find(item => item.id === sel.id));
 const energy = generic.volume * basis.energy;
 $('allocationEnergy').textContent = fmt(energy,0);
 const out = $('allocationPreview');
 if (legacy) {
  out.textContent = 'Co-product allocation is unavailable for a legacy combined inventory.';
  return;
 }
 if (method === 'none') { out.textContent = 'No allocation applied.'; return; }
 try {
  const result = allocateCivanta(allocation, energy, genericGrossParts(generic));
  const comparison = Object.entries(result.shares).filter(([,value])=>Number.isFinite(value));
  out.textContent = displacement
   ? `Documented displacement · CI adjustment ${fmt(result.adjustment,2)} g CO₂e/MJ`
   : `Fuel share ${fmt(result.factor*100,2)}% · shared emissions ${fmt(result.shared,2)} · CI adjustment ${fmt(result.adjustment,2)} g CO₂e/MJ.` + (comparison.length > 1 ? ' Other methods: ' + comparison.filter(([key])=>key!==method)
     .map(([key,value])=>allocationMethods[key]+' '+fmt(value*100,2)+'%').join(' · ') : '');
 } catch (error) { out.textContent = error.message; }
}
