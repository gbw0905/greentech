(() => {
  const svg = window.civantaIcons;
  const motion = window.Motion;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const glyphs = {
    "🌽": "Wheat", "🛢️": "Fuel", "🌱": "Leaf", "✈️": "Plane", "♻️": "Recycle",
    "💧": "Droplet", "⚗️": "FlaskConical", "🌲": "Trees", "🌼": "Leaf",
    "🫒": "Droplet", "🐄": "Milk", "⚙️": "Settings", "🧪": "FlaskConical",
    "🏭": "Factory", "⚡": "Zap", "🔧": "Wrench", "🚚": "Truck", "✓": "Check",
    "▦": "FlaskConical", "▥": "ChartNoAxesCombined", "◎": "Coins", "◉": "ChartNoAxesCombined",
    "◈": "Coins"
  };
  const renderIcons = () => {
    for (const element of document.querySelectorAll("[data-icon]:empty,.fuel-illustration,.option-icon,.selected-check,.preview-icon,.footer-note-icon")) {
      if (element.querySelector("svg")) continue;
      const name = element.dataset.icon || glyphs[element.textContent.trim()] || "Leaf";
      element.innerHTML = svg[name];
      element.setAttribute("aria-hidden", "true");
    }
  };

  function reveal(element, delay = 0) {
    if (!reducedMotion.matches && motion?.animate && element) {
      motion.animate(element, { opacity: [0, 1], transform: ["translateY(8px)", "translateY(0)"] }, {
        duration: 0.32, delay, ease: [0.22, 1, 0.36, 1]
      });
    }
  }

  const views = [...document.querySelectorAll('main > section[id^="view"]')];
  const navigation = [...document.querySelectorAll(".nav button")];
  let currentView = "";
  function syncView() {
    const view = views.find(element => !element.classList.contains("hide"));
    if (!view || view.id === currentView) return;
    currentView = view.id;
    document.body.dataset.view = view.id;
    for (const button of navigation) {
      if (button.classList.contains("active")) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    }
    if (view.id !== "view0") reveal(view.querySelector(".section-head, .step-banner"));
  }

  function clearFieldError() {
    document.querySelector('#view1 [aria-invalid="true"]')?.removeAttribute("aria-invalid");
    document.querySelector("#inputFieldError")?.remove();
    document.querySelector('[aria-errormessage="inputFieldError"]')?.removeAttribute("aria-errormessage");
  }

  function focusCalculationError(error) {
    const missing = error.message.match(/^Missing required input\(s\): ([^,]+)/);
    const key = error.field || missing?.[1];
    const alert = document.getElementById("validation");
    const form = document.querySelector("#view1 :is(#genericForm,#dairyForm):not(.hide)");
    if (form?.id === "dairyForm" && key) {
      const tab = DSEC.findIndex(section => section.fields.some(([name]) => name === key));
      if (tab >= 0 && tab !== dairyTab) form.querySelector('[data-dairy-tab="'+tab+'"]').click();
    }
    const field = key && form?.querySelector('[data-key="'+CSS.escape(key)+'"]');
    if (!field) {
      alert.textContent = error.message;
      alert.focus({preventScroll:true});
      alert.scrollIntoView({block:"center"});
      return;
    }
    alert.textContent = "";
    const details = field.closest("details");
    if (details) details.open = true;
    field.setAttribute("aria-invalid", "true");
    const hint = document.createElement("small");
    hint.id = "inputFieldError";
    hint.textContent = missing ? "Required" : error.message;
    field.closest("label").append(hint);
    field.setAttribute("aria-errormessage", hint.id);
    field.focus({preventScroll:true});
    field.scrollIntoView({block:"center"});
  }

  renderIcons();
  syncView();
  const viewObserver = new MutationObserver(syncView);
  for (const view of views) viewObserver.observe(view, { attributes: true, attributeFilter: ["class"] });

  let runningFromQuickActions = false;
  document.getElementById("runButton").addEventListener("click", () => {
    clearFieldError();
    if (calculationError) {
      focusCalculationError(calculationError);
    } else {
      const result = document.getElementById("runResult");
      reveal(result);
      if (!runningFromQuickActions) {
        result.focus({preventScroll:true});
        result.scrollIntoView({block:"start"});
      }
    }
  });
  document.getElementById("view1").addEventListener("input", clearFieldError);
  document.querySelector(".tabbar").addEventListener("click", event => {
    if (!event.target.closest("[data-pane]")) return;
    requestAnimationFrame(() => {
      if (reducedMotion.matches) return;
      const pane = document.querySelector(".tabpane:not([hidden])");
      pane?.classList.remove("animate-enter");
      requestAnimationFrame(() => pane?.classList.add("animate-enter"));
    });
  });

  // Standalone and embedded workspaces each have one owner for page scrolling.
  const embedded = window.parent !== window && document.referrer.startsWith(location.origin + "/");
  if (embedded) {
    document.documentElement.classList.add("embedded-workspace");
    document.body.classList.add("embedded");
    const parentTheme = window.parent.document.documentElement;
    const syncTheme = () => {
      document.documentElement.dataset.theme = parentTheme.classList.contains("dark") ? "dark" : "light";
    };
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(parentTheme, {attributes: true, attributeFilter: ["class"]});
    syncTheme();
    window.addEventListener("pagehide", event => {
      if (!event.persisted) themeObserver.disconnect();
    });
  } else {
    const darkTheme = matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      document.documentElement.dataset.theme = darkTheme.matches ? "dark" : "light";
    };
    darkTheme.addEventListener("change", syncTheme);
    syncTheme();
  }
  const quickActions = document.getElementById("civantaQuickActions");
  // The embedded workspace scrolls with the parent. Mount the same toolbar there for fixed positioning.
  const mount = embedded
    ? window.frameElement.parentElement.querySelector("[data-civanta-actions-host]")
    : null;

  const scrollOwner = embedded ? window.parent : window;
  const header = scrollOwner.document.querySelector(embedded ? ".site-chrome" : "body > header");
  const inputView = document.getElementById("view1");
  const optimizerView = document.getElementById("view2");
  const inputActions = document.getElementById("ciActions");
  const optActions = document.getElementById("optActions");
  const optSummary = optimizerView.querySelector(".resultbar");
  const exportStatus = document.getElementById("excelDownloadStatus");
  const change = document.getElementById("rbDelta");
  const quickBaseline = quickActions.querySelector("[data-quick-baseline]");
  const quickScenarioRow = quickActions.querySelector("[data-quick-scenario-row]");
  const quickScenario = quickActions.querySelector("[data-quick-scenario]");
  const quickDelta = quickActions.querySelector("[data-quick-delta]");
  const quickStatus = quickActions.querySelector("[role=status]");
  const controls = quickActions.querySelector(".civanta-quick-buttons");

  const buttons = [...inputActions.querySelectorAll("button"), ...optActions.querySelectorAll("button")].map(source => {
    const button = controls.ownerDocument.createElement("button");
    button.type = "button";
    button.textContent = source.dataset.quickLabel || source.textContent.trim();
    button.toggleAttribute("data-primary", source.classList.contains("primary"));
    button.onclick = () => {
      const isRun = source.id === "runButton";
      const hadFocus = button.ownerDocument.activeElement === button;
      runningFromQuickActions = isRun;
      try {
        source.click();
      } finally {
        runningFromQuickActions = false;
      }
      if (isRun && hadFocus && source.hidden) {
        syncQuickActions();
        buttons.find(entry => entry.source.id === "goOptimize")?.button.focus({preventScroll: true});
      }
    };
    controls.append(button);
    return {button, source};
  });

  const setText = (element, value) => {
    if (element.textContent !== value) element.textContent = value;
  };
  let frameRequest = 0;
  let barHeight = 56;
  function syncQuickActions() {
    const isInput = !inputView.classList.contains("hide");
    const view = isInput ? inputView : optimizerView;
    const anchor = isInput ? inputActions : optSummary;
    const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
    const frameTop = embedded ? window.frameElement.getBoundingClientRect().top : 0;
    const top = headerBottom + 8 - frameTop;
    const visible = (!mount || mount.contains(quickActions)) &&
      !document.body.classList.contains("plant-list-open") &&
      !view.classList.contains("hide") && anchor.getBoundingClientRect().bottom <= top &&
      view.getBoundingClientRect().bottom > top + barHeight;
    quickActions.hidden = !visible;
    if (!visible) return;

    if (embedded && !mount) quickActions.style.position = "absolute";
    quickActions.style.top = (embedded && !mount ? top : headerBottom + 8) + "px";
    quickActions.setAttribute("aria-label", isInput ? "CI quick action" : "Optimizer summary");
    setText(quickBaseline, baseline ? fmt(baseline.ci,2) : "—");
    quickScenarioRow.hidden = quickDelta.hidden = isInput;
    if (!isInput && baseline) {
      setText(quickScenario, fmt(scenario(optim).ci,2));
      setText(quickDelta, change.textContent);
      quickDelta.classList.toggle("has-reduction", change.classList.contains("has-reduction"));
      quickDelta.classList.toggle("has-increase", change.classList.contains("has-increase"));
    }
    setText(quickStatus, isInput ? exportStatus.textContent : "");

    const actions = isInput ? inputActions : optActions;
    for (const {source, button} of buttons) {
      button.hidden = source.parentElement !== actions || source.hidden;
      button.disabled = source.disabled;
      button.title = source.title;
    }
    barHeight = quickActions.offsetHeight;
  }

  function scheduleQuickActions() {
    if (frameRequest) return;
    frameRequest = requestAnimationFrame(() => {
      frameRequest = 0;
      syncQuickActions();
    });
  }
  const actionObserver = new MutationObserver(scheduleQuickActions);
  for (const node of [inputView,optimizerView,document.body]) {
    actionObserver.observe(node,{attributes:true,attributeFilter:["class"]});
  }
  actionObserver.observe(inputActions,{subtree:true,attributes:true,attributeFilter:["hidden","disabled","title"]});
  for (const node of [exportStatus,change,document.getElementById("rbOpt")]) {
    actionObserver.observe(node,{childList:true,subtree:true,characterData:true});
  }
  const actionSize = new ResizeObserver(scheduleQuickActions);
  for (const node of [inputView,optimizerView,inputActions,optSummary,header]) {
    if (node) actionSize.observe(node);
  }
  scrollOwner.addEventListener("scroll",scheduleQuickActions,{passive:true});
  scrollOwner.addEventListener("resize",scheduleQuickActions);
  window.addEventListener("pagehide",event=>{
    if (event.persisted) return;
    scrollOwner.removeEventListener("scroll",scheduleQuickActions);
    scrollOwner.removeEventListener("resize",scheduleQuickActions);
    actionObserver.disconnect();
    actionSize.disconnect();
    cancelAnimationFrame(frameRequest);
    quickActions.remove();
  });
  function mountQuickActions() {
    if (mount?.dataset.ready === "true" && !mount.contains(quickActions)) {
      mount.replaceChildren(quickActions);
    }
    scheduleQuickActions();
  }
  if (mount) window.addEventListener("message",event=>{
    if (event.source===window.parent && event.origin===location.origin && event.data?.type==="civanta-mount-actions") {
      mountQuickActions();
    }
  });
  window.addEventListener("pageshow",mountQuickActions);
  mountQuickActions();

  window.addEventListener("civanta-scroll-request", event => {
    event.preventDefault();
    if (embedded) window.parent.postMessage({type:"civanta-scroll"},location.origin);
    else window.scrollTo({top:0,behavior:reducedMotion.matches ? "instant" : "smooth"});
  });
})();
