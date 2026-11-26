(() => {
 const storageKey = 'civanta-plants-v1';
 const activeKey = 'civanta-active-plant-v1';
 const params = new URLSearchParams(location.search);
 // The admin audit page runs this engine in a hidden frame; it must never touch saved plants.
 const auditing = params.get('audit') === '1';
 const exporting = params.get('profileExport') === '1' || auditing;
 let profileExportStarted = false;

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
  if (!active || exporting) return;
  const credits = active.model?.sel?.id === sel.id ? active.model.credits : {};
  const model = copy({sel, generic, dairy, allocation, dairyTab, stage, calculated: !!baseline,
   ci: baseline?.ci, optim, confirmEconomics:$('confirmEconomics').checked, target: optimizationTarget, econ, optTab, creditTab, credits: credits || {}});
  if (JSON.stringify(model) !== JSON.stringify(active.model)) {
   active.model = model;
   markChanged(active);
  }
  persist();
 }

 // Account sync. Signed-in members keep plants on the server so they follow them
 // across devices and appear in the profile; this browser keeps a cached copy.
 // A plant is `dirty` until the server has its latest name and model, and
 // `syncedAt` records that it has reached the server at least once.
 const ownerKey = 'civanta-plants-owner-v1';
 const deletesKey = 'civanta-plant-deletes-v1';
 let remoteUser = null;
 let pushTimer = 0;
 let pushing = Promise.resolve();
 async function api(path, options = {}) {
  try {
   return await fetch(path, {credentials:'same-origin', cache:'no-store',
    headers: options.body ? {'Content-Type':'application/json'} : undefined, ...options});
  } catch {
   return null;
  }
 }
 function readList(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
 }
 function writeValue(key, value) {
  try {
   if (value === null) localStorage.removeItem(key);
   else localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
   // The server copy stays authoritative; the browser cache is best-effort.
  }
 }
 function plantBody(plant) {
  return JSON.stringify({id: plant.id, name: plant.name, model: plant.model ?? null,
   pathwayId: plant.model?.sel?.id || '',
   pathwayLabel: CATALOG.find(item => item.id === plant.model?.sel?.id)?.name || ''});
 }
 function markChanged(plant) {
  plant.dirty = true;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushChanges, 1500);
 }
 function queueDelete(plant) {
  if (!plant.syncedAt && !remoteUser) return;
  writeValue(deletesKey, [...new Set([...readList(deletesKey), plant.id])]);
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushChanges, 0);
 }
 function pushChanges() {
  clearTimeout(pushTimer);
  pushing = pushing.then(sendChanges, sendChanges);
  return pushing;
 }
 async function sendChanges() {
  if (!remoteUser || exporting) return;
  for (const id of readList(deletesKey)) {
   const response = await api('/api/civanta-plants?id=' + encodeURIComponent(id), {method:'DELETE'});
   if (response?.ok) writeValue(deletesKey, readList(deletesKey).filter(item => item !== id));
  }
  let changed = false;
  for (const plant of plants.filter(item => item.dirty && item.id)) {
   const body = plantBody(plant);
   const response = await api('/api/civanta-plants', {method:'PUT', body});
   if (!response?.ok) continue;
   const saved = await response.json();
   plant.syncedAt = saved.updated_at;
   // Edits made while the request was in flight stay queued for the next push.
   if (plantBody(plant) === body) plant.dirty = false;
   changed = true;
  }
  if (changed) persist();
 }
 async function pullPlants() {
  const response = await api('/api/civanta-plants', {signal: AbortSignal.timeout(10000)});
  if (!response?.ok) {
   if (response?.status === 401) remoteUser = null;
   return;
  }
  const {userId, plants: rows} = await response.json();
  let owner = null;
  try { owner = localStorage.getItem(ownerKey); } catch {}
  // Another member's cached plants are never uploaded into this account.
  const local = owner && owner !== userId ? plants.filter(plant => plant === active) : plants;
  const server = new Map(rows.map(row => [row.id, row]));
  const merged = [];
  for (const plant of local) {
   plant.id ||= globalThis.crypto.randomUUID();
   const row = server.get(plant.id);
   if (row && !plant.dirty && plant !== active) {
    merged.push({id: row.id, name: row.name, model: row.model, syncedAt: row.updated_at});
   } else if (row || plant.dirty || !plant.syncedAt || plant === active) {
    // Unsynced local plants are uploaded; synced ones missing on the server were removed elsewhere.
    if (!row) plant.dirty = true;
    merged.push(plant);
   }
   server.delete(plant.id);
  }
  for (const row of [...server.values()].sort((a, b) => a.created_at.localeCompare(b.created_at)))
   merged.push({id: row.id, name: row.name, model: row.model, syncedAt: row.updated_at});
  remoteUser = userId;
  plants = merged;
  writeValue(ownerKey, userId);
  persist();
  if (!active) renderList();
  await pushChanges();
 }
 async function recordCalculation() {
  if (!remoteUser || !active || !baseline || exporting) return;
  const plant = active;
  const body = JSON.stringify({
   plantId: plant.id,
   pathwayId: sel.id,
   pathwayLabel: baseline.path?.name || '',
   ci: baseline.ci,
   parts: Object.fromEntries(Object.entries(baseline.parts).filter(([, value]) => Number.isFinite(value))),
   inputs: copy({sel, generic, dairy, allocation}),
   engineVersion: CIVANTA_ENGINE_VERSION
  });
  await pushChanges();
  if (plant.dirty) return; // The plant must reach the server before its history can.
  const response = await api('/api/civanta-calculations', {method:'POST', body});
  if (!response?.ok) console.warn('CIVanta calculation history could not be saved.');
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
  queueDelete(plant);
  pendingRemoval = null;
  removeDialog.close();
  renderList();
  $('openPlantForm').focus({preventScroll:true});
 };
 function renderList() {
  list.replaceChildren();
  $('plantEmpty').hidden = plants.length > 0;
  $('plantCount').textContent = plants.length;
  for (const plant of [...plants].reverse()) {
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
  if (!exporting) rememberOpenPlant(plant.id);
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
  setExcelDownloadStatus('');
  $('activePlantName').textContent = plant.name;
  $('plantToolbar').hidden = false;
  $('plantPortfolio').hidden = true;
  document.body.classList.remove('plant-list-open');
  renderSetup();
  const savedStage = model.stage;
  const hasScenario = Object.values(optim).some(value => value > 0);
  const resumeStage = !sel.id ? 0 : !baseline ? 1 :
   [1, 2, 3].includes(savedStage) ? savedStage : hasScenario ? 2 : 1;
  show(exporting ? 1 : restoring && savedStage === 0 ? 0 : resumeStage);
  restoreCreditInputs();
  if (!restoring) $('activePlantName').focus({preventScroll: true});
 }
 window.addEventListener('civanta-stage-changed', () => {
  restoreCreditInputs();
  saveActive();
 });
 function restoreCreditInputs() {
  if (stage !== 3) return;
  for (const [id, value] of Object.entries(active?.model?.credits || {})) {
   const control = $(id);
   if (!control) continue;
   if (control.type === 'checkbox') control.checked = value;
   else control.value = value;
  }
  updateRinEconomics();
  syncCreditRunButtons();
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
  markChanged(plant);
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
 window.addEventListener('pagehide', () => {
  saveActive();
  if (!remoteUser) return;
  // keepalive requests are capped at 64 KB, so larger plants wait for the next visit.
  for (const plant of plants.filter(item => item.dirty && item.id)) {
   const body = plantBody(plant);
   if (body.length < 60000) fetch('/api/civanta-plants', {method:'PUT', body, keepalive:true,
    credentials:'same-origin', headers:{'Content-Type':'application/json'}}).catch(() => {});
  }
 });
 const runCalculation = $('runButton').onclick;
 $('runButton').onclick = event => {
  runCalculation(event);
  if (!baseline) return;
  saveActive();
  void recordCalculation();
 };
 window.addEventListener('message', event => {
  if (event.source === window.parent && event.origin === location.origin && event.data?.type === 'civanta-auth-changed') void pullPlants();
 });
 renderList();
 // Open the plant from the last visit (or picked in the profile) once account plants are loaded.
 const plantsReady = (auditing ? Promise.resolve() : pullPlants().catch(() => {})).then(() => {
  let openId;
  try { openId = sessionStorage.getItem(activeKey); } catch {}
  const previous = openId && plants.find(plant => plant.id === openId);
  if (previous && !active && !exporting) openPlant(previous,true);
 });
 window.addEventListener('message', async event => {
  if (!exporting || profileExportStarted || window.parent === window || event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'civanta-profile-export') return;
  profileExportStarted = true;
  const id = event.data.id;
  let ok = false;
  let error = '';
  try {
   if (!(await civantaPro.refresh())) throw new Error('CIVanta Pro is required to download Excel.');
   await plantsReady;
   const plant = plants.find(plant => plant.id === id);
   if (!plant?.model?.calculated) throw new Error('Open this plant and run CI before downloading Excel.');
   openPlant(plant,true);
   if (!baseline) throw new Error('The saved inputs need review. Open this plant and run CI again.');
   ok = await downloadCivantaExcel({silent:true}) === true;
   if (!ok) error = 'Excel could not be prepared. Check your Pro access and try again.';
  } catch (failure) { error = failure.message; }
  window.parent.postMessage({type:'civanta-profile-export-result',id,ok,error},location.origin);
 });
 document.addEventListener('DOMContentLoaded', () => {
  document.body.dataset.workspaceReady = '';
  if (window.parent !== window) {
   window.parent.postMessage({type: 'civanta-workspace-ready'}, location.origin);
  }
 }, {once: true});
})();
