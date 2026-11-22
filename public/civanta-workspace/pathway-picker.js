/** Keep all open levels in view. The review dialog owns the confirmed plant selection. */
function createPathwayPicker(picker, fuels, openReview) {
  const levelTitles = ["Fuel options", "Feedstock options", "Technology options"];
  const branch = picker.querySelector(".pathway-branch");
  const root = picker.querySelector(".pathway-parent");
  const laneTemplate = branch.querySelector("template");
  const connectors = picker.querySelector(".pathway-connectors");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 730px)");
  const svgNamespace = "http://www.w3.org/2000/svg";
  let selected = [];
  let openLevels = 0;
  let lanes = [];
  let exits = [];
  let stageVisible = false;

  function optionsFor(index) {
    return index === 0 ? fuels : selected[index - 1]?.children || [];
  }

  function reveal(element, keyboard) {
    if (keyboard) element.focus({preventScroll: true});
    const frame = window.frameElement;
    const host = frame?.ownerDocument.defaultView || window;
    const frameTop = frame?.getBoundingClientRect().top || 0;
    const stickyBottom = frame?.ownerDocument.querySelector(".site-chrome")?.getBoundingClientRect().bottom || 0;
    const position = element.getBoundingClientRect();
    const top = frameTop + position.top;
    if (top < stickyBottom || frameTop + position.bottom > host.innerHeight) {
      host.scrollBy({top: top - stickyBottom - 18, behavior: "instant"});
    }
  }

  function cancelExits() {
    for (const {element, animation} of exits) {
      animation.cancel();
      if (element instanceof HTMLElement) element.inert = false;
    }
    exits = [];
  }

  function fadeDescendants(levels, finish) {
    cancelExits();
    if (motion.matches) {
      finish();
      return;
    }
    const outgoing = [
      ...lanes.slice(levels).map(({element}) => element),
      ...[...connectors.children].filter(line => Number(line.dataset.depth) >= levels)
    ];
    const fading = outgoing.map(element => {
      if (element instanceof HTMLElement) element.inert = true;
      const animation = element.animate([{opacity: 1}, {opacity: 0}], {duration: 115, fill: "forwards"});
      return {element, animation};
    });
    exits = fading;
    Promise.all(fading.map(({animation}) => animation.finished)).then(() => {
      if (exits !== fading) return;
      cancelExits();
      finish();
    }, () => {});
  }

  function collapse(levels, trigger) {
    fadeDescendants(levels, () => {
      openLevels = levels;
      render();
      const button = trigger ? lanes[levels - 1]?.buttons.find(item => item.option === trigger)?.element : root;
      if (button) reveal(button, true);
    });
  }

  function choose(option, depth, button, keyboard) {
    cancelExits();
    if (!option.children) {
      openReview(option, confirmed => {
        if (!confirmed) {
          button.focus({preventScroll: true});
          return;
        }
        selected[depth] = option;
        render();
      });
      return;
    }
    if (selected[depth] === option && openLevels > depth + 1) {
      collapse(depth + 1, option);
      return;
    }
    const expand = () => {
      if (selected[depth] !== option) {
        selected = [...selected.slice(0, depth), option];
      }
      openLevels = depth + 2;
      render(depth + 1);
      if (!keyboard) lanes[depth].buttons.find(item => item.option === option).element.focus({preventScroll: true});
      reveal(lanes[depth + 1].heading, keyboard);
    };
    if (openLevels > depth + 1) fadeDescendants(depth + 1, expand);
    else expand();
  }

  function renderOption(option, depth) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pathway-option";
    const isSelected = selected[depth] === option;
    const isOpen = !!option.children && isSelected && openLevels > depth + 1;
    button.dataset.selected = String(isOpen || (!option.children && isSelected));
    if (option.children) {
      button.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) button.setAttribute("aria-controls", `pathwayLevel${depth + 1}`);
    } else {
      button.setAttribute("aria-haspopup", "dialog");
      if (isSelected) button.setAttribute("aria-current", "true");
    }
    button.onclick = event => choose(option, depth, button, event.detail === 0);
    const copy = document.createElement("span");
    copy.className = "pathway-option-copy";
    const name = document.createElement("strong");
    name.textContent = option.label;
    copy.append(name);
    if (depth === 0) {
      const count = document.createElement("small");
      count.textContent = `${option.count} ${option.count === 1 ? "route" : "routes"}`;
      copy.append(count);
    }
    const indicator = document.createElement("span");
    indicator.className = "pathway-option-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.textContent = option.children ? (isOpen ? "−" : "+") : "↗";
    button.append(copy, indicator);
    const row = document.createElement("li");
    row.append(button);
    return {option, element: button, row};
  }

  function renderLane(depth) {
    const lane = laneTemplate.content.firstElementChild.cloneNode(true);
    lane.id = `pathwayLevel${depth}`;
    const heading = lane.querySelector(".pathway-stage-title");
    heading.id = `pathwayTitle${depth}`;
    heading.textContent = levelTitles[depth];
    lane.setAttribute("aria-labelledby", heading.id);
    const results = lane.querySelector(".pathway-results");
    const buttons = optionsFor(depth).map(option => renderOption(option, depth));
    results.append(...buttons.map(({row}) => row));
    return {element: lane, heading, buttons};
  }

  function drawConnectors() {
    if (!branch.offsetWidth) return;
    const stacked = mobile.matches;
    const firstLane = lanes[0]?.element;
    root.style.marginTop = !stacked && firstLane
      ? `${Math.max(0, (firstLane.offsetHeight - root.offsetHeight) / 2)}px` : "";
    let pathIndex = 0;
    function addPath(d, depth, spine = false) {
      let path = connectors.children[pathIndex++];
      if (!path) {
        path = document.createElementNS(svgNamespace, "path");
        path.setAttribute("pathLength", "1");
        connectors.append(path);
      }
      path.setAttribute("d", d);
      path.dataset.depth = depth;
      path.classList.toggle("pathway-spine", spine);
    }
    const canvas = branch.getBoundingClientRect();
    for (const [depth, lane] of lanes.entries()) {
      const sourceButton = depth === 0 ? root : lanes[depth - 1].buttons.find(({option}) => option === selected[depth - 1])?.element;
      const targets = lane.buttons;
      if (!sourceButton || !targets.length) continue;

      const source = sourceButton.getBoundingClientRect();
      const sourceX = (stacked ? source.left : source.right) - canvas.left;
      const sourceY = source.top + source.height / 2 - canvas.top;
      const targetX = targets[0].row.getBoundingClientRect().left - canvas.left;
      const spineX = stacked ? 6 + depth * 7 : (sourceX + targetX) / 2;
      const curves = targets.map(({row}) => {
        const box = row.getBoundingClientRect();
        const y = box.top + box.height / 2 - canvas.top;
        return {y, bend: y - Math.sign(y - sourceY) * Math.min(9, Math.abs(y - sourceY))};
      });
      const start = Math.min(sourceY, ...curves.map(({bend}) => bend));
      const end = Math.max(sourceY, ...curves.map(({bend}) => bend));
      addPath(`M ${sourceX} ${sourceY} H ${spineX} M ${spineX} ${start} V ${end}`, depth, true);
      const control = spineX + Math.min(9, targetX - spineX);
      for (const {y, bend} of curves) addPath(`M ${spineX} ${bend} Q ${spineX} ${y} ${control} ${y} H ${targetX}`, depth);
    }
    while (connectors.children.length > pathIndex) connectors.lastElementChild.remove();
  }

  function animateLevel(depth) {
    if (motion.matches) return;
    for (const [index, line] of [...connectors.querySelectorAll(`[data-depth="${depth}"]`)].entries()) {
      for (const animation of line.getAnimations()) animation.cancel();
      line.animate([{strokeDashoffset: 1}, {strokeDashoffset: 0}], {
        duration: 260, delay: Math.min(index, 6) * 12, easing: "ease-out", fill: "backwards"
      });
    }
    lanes[depth].buttons.forEach(({element}, index) => {
      window.Motion?.animate(element, {opacity: [0, 1], transform: ["translateX(-12px)", "translateX(0)"]}, {
        duration: .26, delay: Math.min(index, 6) * .014, ease: "easeOut"
      });
    });
  }

  const entryObserver = new IntersectionObserver(([entry]) => {
    if (!stageVisible || entry.intersectionRatio < .35 || entry.target !== lanes[0]?.buttons[0]?.element) return;
    entryObserver.disconnect();
    drawConnectors();
    animateLevel(0);
  }, {threshold: .35});

  function setStageVisible(visible) {
    if (visible === stageVisible) return;
    stageVisible = visible;
    entryObserver.disconnect();
    const firstFuel = lanes[0]?.buttons[0]?.element;
    if (visible && firstFuel && !motion.matches) entryObserver.observe(firstFuel);
  }

  const observer = new ResizeObserver(drawConnectors);
  observer.observe(branch);

  function render(enteredDepth = openLevels) {
    entryObserver.disconnect();
    for (const {element} of lanes) {
      observer.unobserve(element);
      element.remove();
    }
    root.setAttribute("aria-expanded", String(openLevels > 0));
    if (openLevels) root.setAttribute("aria-controls", "pathwayLevel0");
    else root.removeAttribute("aria-controls");
    root.querySelector(".pathway-option-indicator").textContent = openLevels ? "−" : "+";
    lanes = Array.from({length: openLevels}, (_, depth) => renderLane(depth));
    for (const {element} of lanes) {
      branch.append(element);
      observer.observe(element);
    }
    drawConnectors();
    for (let depth = enteredDepth; depth < openLevels; depth++) animateLevel(depth);
  }

  root.onclick = event => {
    if (openLevels) {
      collapse(0);
      return;
    }
    openLevels = 1;
    render(0);
    reveal(lanes[0].heading, event.detail === 0);
  };

  function setSelection(ids) {
    setStageVisible(false);
    cancelExits();
    selected = [];
    for (const [depth, id] of ids.entries()) {
      const option = optionsFor(depth).find(item => item.id === id);
      if (!option) break;
      selected.push(option);
    }
    openLevels = Math.min(selected.length + 1, levelTitles.length);
    render();
  }

  setSelection([]);
  return {setSelection, setStageVisible};
}
