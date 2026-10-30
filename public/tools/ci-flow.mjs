/** CI accounting visualization. All widths use positive gCO2e/MJ ledger values. */
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export function buildCiFlow(result) {
  const rows = result.lineItems.map((row, index) => ({ ...row, id: `line-${index}` }));
  if (rows.some((row) => !Number.isFinite(row.gPerMj)))
    throw new Error("Non-finite CI contribution");
  const positive = rows.filter((row) => row.gPerMj > 0);
  const negative = rows.filter((row) => row.gPerMj < 0);
  const groups = [];
  for (const row of positive) {
    const label = row.category || "Other inventory";
    let group = groups.find((item) => item.label === label);
    if (!group) {
      group = { id: `group-${groups.length}`, label, value: 0, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
    group.value += row.gPerMj;
  }
  const gross = positive.reduce((sum, row) => sum + row.gPerMj, 0);
  const adjustments = negative.reduce((sum, row) => sum + row.gPerMj, 0);
  const tolerance = 1e-8 * Math.max(1, gross, Math.abs(adjustments));
  const reconciled = [
    [gross, result.grossCi],
    [adjustments, result.creditsCi],
    [gross + adjustments, result.ciTotal],
  ].every(([a, b]) => Number.isFinite(b) && Math.abs(a - b) <= tolerance);
  // Bound visual density while retaining every row in the source details/table.
  const sources = groups.flatMap((group) => {
    const sorted = [...group.rows].sort((a, b) => b.gPerMj - a.gPerMj);
    const visible = sorted.slice(0, 3);
    const rest = sorted.slice(3);
    return [
      ...visible.map((row) => ({ ...row, value: row.gPerMj, group: group.id, rows: [row] })),
      ...(rest.length
        ? [
            {
              id: `${group.id}-other`,
              label: `Other ${group.label.toLowerCase()} (${rest.length})`,
              value: rest.reduce((sum, row) => sum + row.gPerMj, 0),
              group: group.id,
              rows: rest,
            },
          ]
        : []),
    ];
  });
  return { groups, sources, negative, gross, adjustments, net: result.ciTotal, reconciled };
}

export function renderCiFlow(
  result,
  { convert = (v) => v, format = (v) => v.toFixed(3), unit = "gCO₂e/MJ", baseline = null } = {},
) {
  const model = buildCiFlow(result);
  const number = (v) => escape(format(convert(v)));
  const value = (v) => `${number(v)} ${escape(unit)}`;
  const colors = ["#286ba8", "#487ec2", "#177d87", "#6c74ad", "#6584a5", "#397a9c", "#917345"];
  const color = (id) => colors[model.groups.findIndex((g) => g.id === id) % colors.length];
  const stageNodes = model.groups.map((g) => ({ ...g, group: g.id, rows: g.rows }));
  const graph = (detailed) => {
    const left = detailed ? model.sources : stageNodes;
    const height = Math.max(360, left.length * 54 + 80);
    const gap = 32;
    const scale = model.gross
      ? (height - 100 - Math.max(0, left.length - 1) * gap) / model.gross
      : 0;
    const layout = (nodes, x) => {
      const used = model.gross * scale + Math.max(0, nodes.length - 1) * gap;
      let y = 55 + (height - 100 - used) / 2;
      return nodes.map((node) => {
        const item = { ...node, x, y, h: node.value * scale };
        y += item.h + gap;
        return item;
      });
    };
    const sources = layout(left, 300);
    const stages = detailed ? layout(stageNodes, 650) : [];
    const grossY = 55 + (height - 100 - model.gross * scale) / 2;
    const grossX = detailed ? 900 : 820;
    const offsets = new Map();
    let out = grossY;
    const links = sources.map((source) => {
      const target = detailed
        ? stages.find((g) => g.id === source.group)
        : { x: grossX, y: grossY };
      const offset = offsets.get(source.group) || 0;
      const ty = detailed ? target.y + offset : out;
      offsets.set(source.group, offset + source.h);
      out += source.h;
      return `<path class="ci-flow-link" data-flow-ref="${source.group}" d="M${source.x + 10},${source.y + source.h / 2} C${(source.x + target.x) / 2},${source.y + source.h / 2} ${(source.x + target.x) / 2},${ty + source.h / 2} ${target.x},${ty + source.h / 2}" fill="none" stroke="${color(source.group)}" stroke-width="${source.h}"/>`;
    });
    if (detailed) {
      let y = grossY;
      for (const stage of stages) {
        links.push(
          `<path class="ci-flow-link" data-flow-ref="${stage.id}" d="M660,${stage.y + stage.h / 2} C780,${stage.y + stage.h / 2} 780,${y + stage.h / 2} 900,${y + stage.h / 2}" fill="none" stroke="${color(stage.id)}" stroke-width="${stage.h}"/>`,
        );
        y += stage.h;
      }
    }
    const node = (item, isStage) =>
      `<g class="ci-flow-node" tabindex="0" role="button" data-ci-flow-node="${escape(item.id)}" data-flow-ref="${item.group}" aria-label="${escape(item.label)}: ${value(item.value)}. Show contribution details."><title>${escape(item.label)} · ${value(item.value)}</title><rect x="${item.x - 8}" y="${item.y - 7}" width="26" height="${Math.max(item.h, 1) + 14}" fill="transparent"/><rect x="${item.x}" y="${item.y}" width="10" height="${Math.max(item.h, 0.1)}" rx="2" fill="${color(item.group)}"/><text x="${item.x - 12}" y="${item.y + item.h / 2 - 3}" text-anchor="end" class="ci-flow-label">${escape(item.label.length > (isStage ? 25 : 34) ? item.label.slice(0, isStage ? 23 : 32) + "…" : item.label)}</text><text x="${item.x - 12}" y="${item.y + item.h / 2 + 15}" text-anchor="end" class="ci-flow-number">${number(item.value)}</text></g>`;
    return `<svg class="ci-flow-svg" viewBox="0 0 1100 ${height}" role="group" aria-label="${detailed ? "Sources to inventory groups to gross emissions" : "Inventory groups to gross emissions"}; widths represent positive CI contributions"><text x="30" y="24" class="ci-flow-column">${detailed ? "EMISSION SOURCES" : "INVENTORY GROUPS"}</text>${detailed ? '<text x="465" y="24" class="ci-flow-column">INVENTORY GROUPS</text>' : ""}<text x="${grossX}" y="24" class="ci-flow-column">TOTAL</text>${links.join("")}${sources.map((n) => node(n, false)).join("")}${stages.map((n) => node(n, true)).join("")}<rect x="${grossX}" y="${grossY}" width="14" height="${model.gross * scale}" rx="3" fill="#12354d"/><text x="${grossX + 25}" y="${height / 2 - 7}" class="ci-flow-label">Gross emissions</text><text x="${grossX + 25}" y="${height / 2 + 17}" class="ci-flow-number">${number(model.gross)}</text></svg>`;
  };
  const detail = (item) =>
    `<article data-ci-flow-detail="${escape(item.id)}" hidden><h4>${escape(item.label)} <strong>${value(item.value)}</strong></h4><p>${escape(((item.value / model.gross) * 100).toFixed(1))}% of positive emissions</p>${item.rows.map((row) => `<p><b>${escape(row.label)}</b> · ${value(row.gPerMj)}<br><span>${Number.isFinite(row.activity) ? `${escape(format(row.activity))} ${escape(row.activityUnit)} × ${escape(format(row.factor))} ${escape(row.factorUnit)}` : escape(row.detail || "Direct CI contribution")}${row.divisor ? ` ÷ ${escape(format(row.divisor))} MJ` : ""}${Number.isFinite(row.allocation) && row.allocation !== 1 ? ` × ${escape(format(row.allocation))} allocation` : ""}</span></p>`).join("")}<p class="note">Source verification is not established by this diagram. Review the calculation ledger and input evidence.</p><a href="#ci-ledger" data-open-ledger>View calculation ledger ↗</a></article>`;
  const largest = [...model.groups].sort((a, b) => b.value - a.value)[0];
  const sameBaseline = baseline?.pathway?.id === result.pathway.id;
  return `<section class="panel ci-flow-card" aria-labelledby="ci-flow-title"><div class="chart-heading"><div><h2 id="ci-flow-title">Carbon intensity flow</h2><p>${escape(result.pathway.label)} · ${escape(unit)} of finished fuel</p></div><span class="badge">${model.reconciled ? "Reconciled" : "Review totals"}</span></div><p class="ci-flow-stale" role="status" hidden>Previous result · Run to update</p>${model.gross > 0 ? `<div class="ci-flow-switch" role="group" aria-label="Flow detail"><button type="button" data-ci-flow-view="overview" aria-pressed="true">Overview</button><button type="button" data-ci-flow-view="sources" aria-pressed="false">Source detail</button></div><p class="note">Select a node to inspect its inputs. Flow widths show positive CI contributions.</p><div class="ci-flow-scroll" data-ci-flow-view-panel="overview">${graph(false)}</div><div class="ci-flow-scroll" data-ci-flow-view-panel="sources" hidden>${graph(true)}</div><div class="ci-flow-details"><p data-ci-flow-hint>Select a source or inventory group for calculation details.</p>${[...model.sources, ...stageNodes].map(detail).join("")}</div>` : "<p>No positive emissions are recorded. Review the signed adjustments below.</p>"}<div class="ci-flow-equation"><div><span>Gross emissions</span><strong>${number(model.gross)}</strong></div><b>+</b><div><span>Signed adjustments</span><strong>${number(model.adjustments)}</strong></div><b>=</b><div><span>Net CI · ${escape(unit)}</span><strong>${number(model.net)}</strong></div></div><details><summary>Signed adjustments (${model.negative.length})</summary>${model.negative.length ? model.negative.map((row) => `<p class="ci-flow-adjustment"><span>${escape(row.label)}</span><strong>${value(row.gPerMj)}</strong></p>`).join("") : "<p>No negative ledger contributions.</p>"}<p class="note">Accounting adjustments may include avoided emissions or co-product treatment; they do not establish physical carbon removal or issued regulatory credits.</p></details><div class="ci-flow-summary">${largest ? `<p><b>Largest inventory group:</b> ${escape(largest.label)} · ${escape(((largest.value / model.gross) * 100).toFixed(1))}% of positive emissions.</p>` : ""}<p><b>Adjustment effect:</b> ${value(model.adjustments)} applied to gross emissions.</p>${sameBaseline ? `<p><b>Change vs baseline:</b> ${value(model.net - baseline.ciTotal)} (current − baseline).</p>` : ""}</div><details><summary>Accessible data table · all contributions</summary><div class="table-wrap"><table><thead><tr><th>Contribution</th><th>Inventory group</th><th>${escape(unit)}</th></tr></thead><tbody>${result.lineItems.map((row) => `<tr><td>${escape(row.label)}</td><td>${escape(row.category || "Other inventory")}</td><td>${number(row.gPerMj)}</td></tr>`).join("")}</tbody></table></div></details></section>`;
}

export function bindCiFlow(container) {
  let selectedGroup = null;
  const highlight = (group) => {
    for (const item of container.querySelectorAll("[data-flow-ref]"))
      item.classList.toggle("is-muted", group !== null && item.dataset.flowRef !== group);
  };
  container.addEventListener("pointerover", (event) => {
    const node = event.target.closest("[data-ci-flow-node]");
    if (node) highlight(node.dataset.flowRef);
  });
  container.addEventListener("pointerout", (event) => {
    if (event.target.closest("[data-ci-flow-node]")) highlight(selectedGroup);
  });
  const select = (node) => {
    selectedGroup = node.dataset.flowRef;
    for (const detail of container.querySelectorAll("[data-ci-flow-detail]"))
      detail.hidden = detail.dataset.ciFlowDetail !== node.dataset.ciFlowNode;
    const hint = container.querySelector("[data-ci-flow-hint]");
    if (hint) hint.hidden = true;
    for (const item of container.querySelectorAll("[data-flow-ref]"))
      item.classList.toggle("is-muted", item.dataset.flowRef !== node.dataset.flowRef);
  };
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ci-flow-view]");
    if (button) {
      for (const control of container.querySelectorAll("[data-ci-flow-view]"))
        control.setAttribute("aria-pressed", String(control === button));
      for (const panel of container.querySelectorAll("[data-ci-flow-view-panel]"))
        panel.hidden = panel.dataset.ciFlowViewPanel !== button.dataset.ciFlowView;
    }
    const node = event.target.closest("[data-ci-flow-node]");
    if (node) select(node);
  });
  container.addEventListener("focusin", (event) => {
    const node = event.target.closest("[data-ci-flow-node]");
    if (node) select(node);
  });
  container.addEventListener("keydown", (event) => {
    const node = event.target.closest("[data-ci-flow-node]");
    if (node && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      select(node);
    }
  });
}
