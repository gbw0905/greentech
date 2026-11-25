(() => {
 const storageKey = 'civanta-plants-v1';
 const activeKey = 'civanta-active-plant-v1';

 function rememberOpenPlant(id) {
  try {
   if (id) sessionStorage.setItem(activeKey,id);
   else sessionStorage.removeItem(activeKey);
  } catch {
   // The plant can still be opened manually if tab storage is unavailable.
  }
 }
 const copy = value => JSON.parse(JSON.stringify(value));
 const initialSelection = copy(sel);
 const form = $('plantForm');
 const name = $('plantName');
 const status = $('plantStatus');
 const list = $('plantList');
 const search = $('plantSearchInput');
 const formDialog = $('plantFormDialog');
 const removeDialog = $('removePlantDialog');
 let pendingRemoval = null;
 let plants = [];
 let active = null;
 let duplicate = null;
 getSavedCreditInputs = () => active?.model?.credits ?? {};
 try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) plants = saved;
 } catch {
  status.textContent = 'Saved plants could not be opened in this browser.';
 }

 function persist(nextPlants = plants, feedback = status) {
  try {
   localStorage.setItem(storageKey, JSON.stringify(nextPlants));
   return true;
  } catch {
   feedback.textContent = 'Browser storage is unavailable. This change could not be saved.';
   return false;
  }
 }
 function saveActive() {
  if (!active) return;
  const credits = active.model?.sel?.id === sel.id ? active.model.credits : {};
  active.model = copy({sel, generic, dairy, allocation, dairyTab, stage, calculated: !!baseline,
   ci: baseline?.ci, optim, confirmEconomics:$('confirmEconomics').checked, target: optimizationTarget, econ, optTab, creditTab, credits: credits || {}});
  persist();
 }
 function filterPlants() {
  const query = search.value.trim().toLowerCase();
  let visibleCount = 0;
  for (const row of list.children) {
   row.hidden = !row.firstElementChild.textContent.toLowerCase().includes(query);
   if (!row.hidden) visibleCount++;
  }
  $('plantSearchEmpty').hidden = plants.length === 0 || visibleCount > 0;
  list.scrollTop = 0;
 }
 search.oninput = filterPlants;
 function openPlantForm(source = null) {
  duplicate = source;
  const title = source ? 'Duplicate plant' : 'Add plant';
  $('plantFormTitle').textContent = title;
  form.querySelector('[type="submit"]').textContent = title;
  name.setCustomValidity('');
  $('plantFormError').textContent = '';
  name.value = source ? source.name.slice(0, name.maxLength - 5) + ' copy' : '';
  openWorkspaceDialog(formDialog);
  if (source) name.select();
 }
 $('openPlantForm').onclick = () => openPlantForm();
 $('cancelPlantForm').onclick = () => formDialog.close();
 name.oninput = () => name.setCustomValidity('');
 $('cancelPlantRemoval').onclick = () => removeDialog.close();
 $('confirmPlantRemoval').onclick = () => {
  if (!removeDialog.open || !pendingRemoval) return;
  const plant = pendingRemoval;
  const remaining = plants.filter(item => item !== plant);
  if (!persist(remaining,$('removePlantError'))) return;
  plants = remaining;
  pendingRemoval = null;
  removeDialog.close();
  renderList();
  $('openPlantForm').focus({preventScroll:true});
 };
 function renderList() {
  list.replaceChildren();
  $('plantEmpty').hidden = plants.length > 0;
  $('plantCount').textContent = plants.length;
  for (const plant of plants) {
   const row = document.createElement('li');
   const details = document.createElement('div');
   const open = document.createElement('button');
   open.className = 'portfolio-plant-link';
   open.type = 'button';
   open.setAttribute('aria-label', plant.name);
   const label = document.createElement('strong');
   label.textContent = plant.name;
   open.append(label);
   open.onclick = () => openPlant(plant);
   const summary = document.createElement('small');
   const path = CATALOG.find(item => item.id === plant.model?.sel?.id);
   summary.textContent = [path?.name, plant.model?.calculated ? fmt(plant.model.ci, 2) + ' g CO₂e/MJ' : 'Draft'].filter(Boolean).join(' · ');
   open.append(summary);
   details.append(open);
   const button = document.createElement('button');
   button.className = 'secondary';
   button.textContent = 'Duplicate';
   button.setAttribute('aria-label', 'Duplicate ' + plant.name);
   button.type = 'button';
   button.setAttribute('aria-haspopup','dialog');
   button.onclick = () => openPlantForm(plant);
   const remove = document.createElement('button');
   remove.type = 'button';
   remove.className = 'secondary plant-remove';
   remove.textContent = 'Remove';
   remove.setAttribute('aria-label','Remove ' + plant.name);
   remove.setAttribute('aria-haspopup','dialog');
   remove.onclick = () => {
    pendingRemoval = plant;
    $('removePlantName').textContent = plant.name;
    $('removePlantError').textContent = '';
    openWorkspaceDialog(removeDialog);
   };
   const actions = document.createElement('div');
   actions.className = 'plant-row-actions';
   actions.append(button,remove);
   row.append(details,actions);
   list.append(row);
  }
  filterPlants();
 }
 function openPlant(plant, restoring = false) {
  active = plant;
  if (!plant.id) {
   plant.id = globalThis.crypto.randomUUID();
   persist();
  }
  rememberOpenPlant(plant.id);
  const model = plant.model ? copy(plant.model) : {};
  sel = model.sel || copy(initialSelection);
  generic = model.generic || {};
  if (!generic._mode && Number.isFinite(generic.fixed) && !Number.isFinite(generic.upstream)) generic._mode = 'legacy';
  allocation = model.allocation || newAllocation();
  dairy = model.dairy || {};
  dairyTab = model.dairyTab || 0;
  baseline = null;
  if (model.calculated && sel.id) {
   try {
    validateRouteInventory();
    baseline = sel.id === 'rng-dairy' ? computeDairy() : computeGeneric();
   } catch {
    baseline = null;
   }
  }
  optim = {...ZERO, ...model.optim};
  optimizationTarget = model.target ?? NaN;
  Object.assign(econ, emptyEconomics(), model.econ);
  $('confirmEconomics').checked = model.confirmEconomics === true;
  optTab = model.optTab || 'impact';
  creditTab = model.creditTab || 'creditPanel';
  curveFocus = 'all';
  heatX = '';
  heatY = '';
  rinLastPath = '';
  responseKey = '';
  $('validation').textContent = '';
  $('excelDownloadStatus').textContent = '';
  $('activePlantName').textContent = plant.name;
  $('plantToolbar').hidden = false;
  $('plantPortfolio').hidden = true;
  document.body.classList.remove('plant-list-open');
  renderSetup();
  const savedStage = model.stage;
  const hasScenario = Object.values(optim).some(value => value > 0);
  const resumeStage = !sel.id ? 0 : !baseline ? 1 :
   [1, 2, 3].includes(savedStage) ? savedStage : hasScenario ? 2 : 1;
  show(restoring && savedStage === 0 ? 0 : resumeStage);
  restoreCreditInputs();
  if (!restoring) $('activePlantName').focus({preventScroll: true});
 }
 function restoreCreditInputs() {
  if (stage !== 3) return;
  for (const [id, value] of Object.entries(active?.model?.credits || {})) {
   const control = $(id);
   if (!control) continue;
   if (control.type === 'checkbox') control.checked = value;
   else control.value = value;
  }
  updateRinEconomics();
 }
 form.onsubmit = event => {
  event.preventDefault();
  const plantName = name.value.trim();
  if (!plantName) {
   name.setCustomValidity('Enter a plant name.');
   name.reportValidity();
   return;
  }
  const plant = {id: crypto.randomUUID(),name: plantName,model: duplicate?.model ? copy(duplicate.model) : null};
  const next = [...plants,plant];
  if (!persist(next,$('plantFormError'))) return;
  plants = next;
  status.textContent = '';
  formDialog.close();
  openPlant(plant);
 };
 $('backToPlants').onclick = () => {
  saveActive();
  active = null;
  rememberOpenPlant(null);
  document.body.classList.add('plant-list-open');
  $('plantPortfolio').hidden = false;
  $('plantToolbar').hidden = true;
  renderList();
  requestWorkspaceScroll();
  $('openPlantForm').focus({preventScroll: true});
 };
 for (const type of ['input', 'change', 'click']) document.addEventListener(type, event => {
  if (!active) return;
  const control = event.target;
  if (type !== 'click' && stage === 3 && control.id && control.closest('#view3')) {
   active.model ||= {};
   active.model.credits ||= {};
   const panel = control.closest('[role="tabpanel"]');
   if (panel) for (const field of panel.querySelectorAll('input[id],select[id]')) {
    active.model.credits[field.id] = field.type === 'checkbox' ? field.checked : field.value;
   }
  }
  if (type === 'click' && control.closest('[data-go]')) restoreCreditInputs();
  saveActive();
 });
 window.addEventListener('pagehide', saveActive);
 renderList();
 let openId;
 try { openId = sessionStorage.getItem(activeKey); } catch {}
 const previous = openId && plants.find(plant => plant.id === openId);
 if (previous) openPlant(previous,true);
 document.addEventListener('DOMContentLoaded', () => {
  document.body.dataset.workspaceReady = '';
  if (window.parent !== window) {
   window.parent.postMessage({type: 'civanta-workspace-ready'}, location.origin);
  }
 }, {once: true});
})();
