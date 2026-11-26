/* Entitlements come from the authenticated server, never from saved plant data. */
const civantaPro = (() => {
 let premium = false;
 let signedIn = false;
 let accessKnown = false;
 let pending = null;
 const dialog = document.getElementById('civantaProDialog');
 const title = document.getElementById('civantaProTitle');
 const detail = document.getElementById('civantaProDetail');
 function decorate(button) {
  button.dataset.proFeature = 'true';
  button.classList.toggle('requires-pro', accessKnown && !premium);
  if (!accessKnown || premium) {
   button.querySelector('.civanta-pro-badge')?.remove();
   return;
  }
  if (button.querySelector('.civanta-pro-badge')) return;
  const badge = document.createElement('span');
  badge.className = 'civanta-pro-badge';
  badge.textContent = 'Pro';
  button.append(badge);
 }
 function sync() {
  for (const button of document.querySelectorAll('[data-go="2"], [data-go="3"], #goOptimize, [data-download-excel]')) {
   decorate(button);
   button.title = accessKnown && !premium ? 'Available with CIVanta Pro' : '';
  }
  const hostDocument = window.frameElement?.ownerDocument;
  for (const button of hostDocument?.querySelectorAll('[data-civanta-actions-host] [data-pro-feature]') || []) decorate(button);
  if (!premium && typeof stage !== 'undefined' && stage >= 2) show(1);
 }
 async function refresh() {
  if (pending) return pending;
  accessKnown = false;
  sync();
  pending = (async () => {
   try {
    const response = await fetch('/api/civanta-access', {credentials:'same-origin',cache:'no-store'});
    const access = response.ok ? await response.json() : null;
    accessKnown = typeof access?.signedIn === 'boolean' && typeof access?.premium === 'boolean';
    signedIn = access?.signedIn === true;
    premium = signedIn && access?.premium === true;
   } catch {
    signedIn = false;
    premium = false;
   }
   sync();
   return premium;
  })();
  try { return await pending; } finally { pending = null; }
 }
 async function enter(index, onAllowed) {
  const allowed = await refresh();
  const upgrade = dialog.querySelector('.civanta-pro-upgrade');
  upgrade.hidden = allowed;
  upgrade.href = signedIn ? '/pricing' : '/auth?next=%2Fcivanta';
  upgrade.textContent = signedIn ? 'Go for Pro →' : 'Sign in →';
  if (!signedIn) {
   title.textContent = 'Sign in to continue';
   detail.textContent = 'Sign in first to access CIVanta Pro features, including Optimize CI, Credit Potential and Excel downloads.';
   if (!dialog.open) openWorkspaceDialog(dialog);
   return;
  }
  if (allowed && baseline) { onAllowed(); return; }
  if (allowed) {
   title.textContent = 'Run CI first';
   detail.textContent = 'Choose a pathway, enter your inputs and run CI before opening optimization or credit potential.';
   if (!dialog.open) openWorkspaceDialog(dialog);
   return;
  }
  title.textContent = index === 'download' ? 'Excel downloads are a Pro feature' : index === 3 ? 'Credit Potential is a Pro feature' : 'Optimize CI is a Pro feature';
  detail.textContent = 'Upgrade to CIVanta Pro to optimize your CI and explore credit potential. You can keep building pathways and calculating baseline CI.';
  if (!dialog.open) openWorkspaceDialog(dialog);
 }
 document.getElementById('closeCivantaPro').onclick = () => dialog.close();
 document.addEventListener('DOMContentLoaded', () => { sync(); void refresh(); });
 window.addEventListener('civanta-stage-changed', sync);
 window.addEventListener('pageshow', event => { if (event.persisted) void refresh(); });
 window.addEventListener('message', event => {
  if (event.source === window.parent && event.origin === location.origin && event.data?.type === 'civanta-auth-changed') void refresh();
 });
 document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh(); });
 return {refresh,enter,decorate,get premium(){return premium;}};
})();
