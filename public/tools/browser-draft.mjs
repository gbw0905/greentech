// Preserve unfinished numeric inputs (including blanks) without changing calculator math.
const NUMBER_TAG = "__civantaNumber";
export function encodeDraft(value) {
  return JSON.stringify(value, (_key, item) =>
    typeof item === "number" && !Number.isFinite(item) ? { [NUMBER_TAG]: String(item) } : item,
  );
}
export function decodeDraft(value) {
  return JSON.parse(value, (_key, item) => {
    if (item && typeof item === "object" && Object.keys(item).length === 1) {
      if (item[NUMBER_TAG] === "NaN") return NaN;
      if (item[NUMBER_TAG] === "Infinity") return Infinity;
      if (item[NUMBER_TAG] === "-Infinity") return -Infinity;
    }
    return item;
  });
}
export function readDraft(storage, key, accepts) {
  try {
    const draft = decodeDraft(storage.getItem(key));
    return accepts(draft) ? draft : null;
  } catch {
    return null;
  }
}
export function writeDraft(storage, key, draft) {
  try {
    storage.setItem(key, encodeDraft(draft));
    return true;
  } catch {
    return false;
  }
}
// Raw text is saved on input, before blur commits the calculator's state.
// Other events save after their existing handlers; no rerender interrupts typing.
export function attachAutosave({ key, snapshot, pending, restored = false }) {
  const label = document.getElementById("autosave-status");
  let raw = pending ?? null;
  const status = (ok, initial = false) => {
    label.textContent = ok
      ? initial && restored
        ? "Previous inputs restored · Changes save in this browser."
        : "Changes saved in this browser."
      : "Browser storage unavailable · Keep this page open to retain your inputs.";
  };
  const persist = () => {
    let ok = false;
    try {
      ok = writeDraft(localStorage, key, { ...snapshot(), pending: raw, draftVersion: 2 });
    } catch {
      /* Browser privacy settings may block storage access itself. */
    }
    status(ok);
    return ok;
  };
  document.addEventListener("input", (event) => {
    const field = event.target;
    if (!field.matches?.("input,select,textarea")) return;
    raw = {
      id: field.id,
      override: field.dataset.ov,
      overrideField: field.dataset.ovf,
      value: field.value,
      checked: field.checked,
    };
    persist();
  });
  document.addEventListener("change", () => {
    raw = null;
    persist();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("button")) return;
    queueMicrotask(persist);
  });
  window.addEventListener("pagehide", persist);
  window.addEventListener("message", (event) => {
    if (
      event.source === window.parent &&
      event.origin === location.origin &&
      event.data?.type === "civanta-history-restore"
    ) {
      raw = null;
      queueMicrotask(persist);
    }
  });
  if (raw) {
    const field = raw.id
      ? document.getElementById(raw.id)
      : [...document.querySelectorAll("[data-ov]")].find(
          (el) => el.dataset.ov === raw.override && el.dataset.ovf === raw.overrideField,
        );
    if (field) {
      field.value = raw.value;
      if (field.type === "checkbox") field.checked = raw.checked;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  status(persist(), true);
  return persist;
}
