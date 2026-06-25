/* awesome-next-state — site logic */
(function () {
  "use strict";
  const WORKS = window.WORKS || [];
  const GROUPS = window.GROUPS || {};
  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const condLabel = c => (c === "act" ? "interventional" : "observational");

  /* ---------- stats ---------- */
  (function stats() {
    const years = WORKS.map(w => w.year);
    const data = [
      [WORKS.length, "works"],
      [Object.keys(GROUPS).length, "lineages"],
      [Math.min(...years) + "–" + Math.max(...years), "years"],
      ["L0–L5", "ladder levels"]
    ];
    const host = $("#stats");
    data.forEach(([n, l]) => {
      const s = el("div", "stat");
      s.append(el("div", "n", n), el("div", "l", l));
      host.append(s);
    });
  })();

  /* ---------- five axes ---------- */
  (function axes() {
    const accents = ["var(--purple)", "var(--teal)", "var(--coral)", "var(--blue)", "var(--amber)"];
    const ax = [
      ["1", "State", "What <em>is</em> the state?", "discrete token", "abstract state"],
      ["2", "Conditioning", "Is the next state conditioned on an <strong>action</strong>?", "observational", "interventional"],
      ["3", "Prediction space", "<em>Where</em> do you predict?", "raw observation", "representation"],
      ["4", "Uncertainty", "How is a distribution over next states held?", "point estimate", "diffusion / energy"],
      ["5", "Objective", "What is the model <em>for</em>?", "reconstruction", "planning utility"]
    ];
    const host = $("#axes-grid");
    ax.forEach((a, i) => {
      const c = el("div", "axis-card");
      c.style.borderTopColor = accents[i];
      c.innerHTML =
        `<span class="ax-n" style="background:var(--surface-3);color:${accents[i]}">AXIS ${a[0]}</span>` +
        `<h3>${a[1]}</h3><p>${a[2]}</p>` +
        `<div class="scale" style="color:${accents[i]}"><span>${a[3]}</span><span class="bar"></span><span>${a[4]}</span></div>`;
      host.append(c);
    });
  })();

  /* ---------- landscape map (scatter) ---------- */
  function quadrantPlugin() {
    return {
      id: "quadrants",
      beforeDatasetsDraw(chart) {
        const { ctx, chartArea: a, scales } = chart;
        const xm = scales.x.getPixelForValue(0.55), ym = scales.y.getPixelForValue(0.5);
        const tints = [
          [a.left, a.top, xm - a.left, ym - a.top, "rgba(216,90,48,0.07)"],     // TL pixel+act
          [xm, a.top, a.right - xm, ym - a.top, "rgba(29,158,117,0.08)"],        // TR abstract+act
          [a.left, ym, xm - a.left, a.bottom - ym, "rgba(239,159,39,0.05)"],     // BL pixel+obs
          [xm, ym, a.right - xm, a.bottom - ym, "rgba(127,119,221,0.07)"]        // BR latent+obs
        ];
        ctx.save();
        tints.forEach(t => { ctx.fillStyle = t[4]; ctx.fillRect(t[0], t[1], t[2], t[3]); });
        ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.moveTo(xm, a.top); ctx.lineTo(xm, a.bottom);
        ctx.moveTo(a.left, ym); ctx.lineTo(a.right, ym); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = "600 12px -apple-system, Segoe UI, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.34)";
        ctx.textAlign = "left"; ctx.fillText("generative game / video worlds", a.left + 10, a.top + 18);
        ctx.textAlign = "right"; ctx.fillText("planning-first models", a.right - 10, a.top + 18);
        ctx.textAlign = "left"; ctx.fillText("video as simulator", a.left + 10, a.bottom - 12);
        ctx.textAlign = "right"; ctx.fillText("representation learners · LLMs", a.right - 10, a.bottom - 12);
        ctx.restore();
      }
    };
  }
  (function map() {
    const datasets = Object.entries(GROUPS).map(([k, g]) => ({
      label: g.label,
      data: WORKS.filter(w => w.group === k).map(w => ({ x: w.x, y: w.y, w })),
      backgroundColor: g.color + "cc",
      borderColor: g.color,
      borderWidth: 1.5,
      pointRadius: 7, pointHoverRadius: 10
    }));
    new Chart($("#mapChart"), {
      type: "scatter",
      data: { datasets },
      options: {
        maintainAspectRatio: false,
        layout: { padding: 6 },
        scales: {
          x: { min: 0, max: 1, grid: { color: "rgba(255,255,255,0.04)" }, ticks: { display: false },
               title: { display: true, text: "PREDICTION SPACE   raw pixels  →  abstract / latent", color: "#6E7681", font: { size: 12 } } },
          y: { min: 0, max: 1, grid: { color: "rgba(255,255,255,0.04)" }, ticks: { display: false },
               title: { display: true, text: "CONDITIONING   observational  →  action-conditioned", color: "#6E7681", font: { size: 12 } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#161B22", borderColor: "#313c4d", borderWidth: 1, padding: 12,
            titleColor: "#E8EEF5", bodyColor: "#9DA7B3", titleFont: { size: 14 },
            callbacks: {
              title: items => items[0].raw.w.name + "  ·  " + items[0].raw.w.year,
              label: () => "",
              afterBody: items => {
                const w = items[0].raw.w;
                return ["next state: " + w.state, "", w.space + " · " + condLabel(w.cond) + " · L" + w.ladder];
              }
            }
          }
        }
      },
      plugins: [quadrantPlugin()]
    });
    const lg = $("#mapLegend");
    Object.values(GROUPS).forEach(g => {
      lg.append(el("span", null, `<i style="background:${g.color}"></i>${g.label}`));
    });
  })();

  /* ---------- collection: filters + cards ---------- */
  const state = { groups: new Set(), spaces: new Set(), cond: new Set(), q: "", sort: "year-desc" };
  const SPACES = ["text", "token", "pixel", "latent", "abstract"];

  function chip(text, active, on) {
    const c = el("button", "chip" + (active ? " active" : ""), text);
    c.addEventListener("click", on);
    return c;
  }
  function buildFilters() {
    const gc = $("#group-chips");
    Object.entries(GROUPS).forEach(([k, g]) => {
      const c = chip(g.label.replace(/ \(.*\)/, ""), false, () => toggle(state.groups, k, c, g.color));
      gc.append(c);
    });
    const sc = $("#space-chips");
    SPACES.forEach(s => {
      const c = chip(s, false, () => toggle(state.spaces, s, c, "var(--blue)"));
      sc.append(c);
    });
    const cc = $("#cond-chips");
    [["act", "interventional"], ["obs", "observational"]].forEach(([k, lbl]) => {
      const c = chip(lbl, false, () => toggle(state.cond, k, c, k === "act" ? "var(--teal)" : "var(--blue)"));
      cc.append(c);
    });
    $("#search").addEventListener("input", e => { state.q = e.target.value.toLowerCase(); render(); });
    $("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
  }
  function toggle(set, key, chipEl, color) {
    if (set.has(key)) { set.delete(key); chipEl.classList.remove("active"); chipEl.style.background = ""; }
    else { set.add(key); chipEl.classList.add("active"); chipEl.style.background = color; }
    render();
  }
  function filtered() {
    let r = WORKS.filter(w => {
      if (state.groups.size && !state.groups.has(w.group)) return false;
      if (state.spaces.size && !state.spaces.has(w.space)) return false;
      if (state.cond.size && !state.cond.has(w.cond)) return false;
      if (state.q) {
        const hay = (w.name + " " + w.org + " " + w.state + " " + w.note + " " + w.venue).toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    });
    const s = state.sort;
    r.sort((a, b) =>
      s === "year-asc" ? a.year - b.year :
      s === "year-desc" ? b.year - a.year :
      s === "ladder-desc" ? b.ladder - a.ladder || b.year - a.year :
      a.name.localeCompare(b.name));
    return r;
  }
  function render() {
    const r = filtered();
    const grid = $("#grid");
    grid.innerHTML = "";
    r.forEach(w => {
      const g = GROUPS[w.group];
      const card = el("div", "card");
      card.innerHTML =
        `<div class="top">
           <span class="gdot" style="background:${g.color}"></span>
           <h3><a href="${w.url}" target="_blank" rel="noopener">${w.name}</a></h3>
           <span class="lvl">L${w.ladder}</span>
         </div>
         <div class="meta">${w.org} · ${w.year} · ${w.venue}</div>
         <p class="note">${w.note}</p>
         <div class="nextstate"><div class="k">Next state</div><div class="v">${w.state}</div></div>
         <div class="tags">
           <span class="tag">${w.space}</span>
           <span class="tag cond-${w.cond}">${condLabel(w.cond)}</span>
           <span class="tag">${w.unc}</span>
           <span class="tag">${w.obj}</span>
         </div>`;
      grid.append(card);
    });
    $("#count").textContent = r.length + " / " + WORKS.length + " works";
  }

  /* ---------- comparison table ---------- */
  const COLS = [
    ["name", "Work"], ["year", "Year"], ["group", "Lineage"], ["state", "Next-state representation"],
    ["space", "Space"], ["cond", "Cond."], ["unc", "Uncertainty"], ["obj", "Objective"], ["ladder", "Ladder"]
  ];
  let tableSort = { key: "year", dir: -1 };
  function buildTable() {
    const thead = $("#cmp thead");
    const tr = el("tr");
    COLS.forEach(([k, lbl]) => {
      const th = el("th", null, lbl + ' <span class="ar"></span>');
      th.addEventListener("click", () => {
        tableSort.dir = tableSort.key === k ? -tableSort.dir : 1;
        tableSort.key = k; renderTable();
      });
      tr.append(th);
    });
    thead.append(tr);
    renderTable();
  }
  function renderTable() {
    const tb = $("#cmp tbody");
    const rows = WORKS.slice().sort((a, b) => {
      const x = a[tableSort.key], y = b[tableSort.key];
      return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * tableSort.dir;
    });
    tb.innerHTML = "";
    rows.forEach(w => {
      const g = GROUPS[w.group];
      const tr = el("tr");
      tr.innerHTML =
        `<td><a href="${w.url}" target="_blank" rel="noopener">${w.name}</a></td>
         <td class="mono">${w.year}</td>
         <td><span class="gdot" style="background:${g.color}"></span>${g.label.replace(/ \(.*\)/, "")}</td>
         <td>${w.state}</td>
         <td class="mono">${w.space}</td>
         <td class="mono">${condLabel(w.cond)}</td>
         <td class="mono">${w.unc}</td>
         <td class="mono">${w.obj}</td>
         <td class="mono">L${w.ladder}</td>`;
      tb.append(tr);
    });
    $("#cmp thead").querySelectorAll("th .ar").forEach((s, i) => {
      s.textContent = COLS[i][0] === tableSort.key ? (tableSort.dir > 0 ? "▲" : "▼") : "";
    });
  }

  /* ---------- timeline (scatter by lineage lane) ---------- */
  (function timeline() {
    const order = Object.keys(GROUPS);
    const datasets = order.map((k, i) => ({
      label: GROUPS[k].label,
      data: WORKS.filter(w => w.group === k).map((w, j, arr) => ({
        x: w.year, y: i + (((j % 3) - 1) * 0.16), w
      })),
      backgroundColor: GROUPS[k].color + "dd",
      borderColor: GROUPS[k].color, borderWidth: 1,
      pointRadius: 6, pointHoverRadius: 9
    }));
    new Chart($("#timeChart"), {
      type: "scatter",
      data: { datasets },
      options: {
        maintainAspectRatio: false,
        layout: { padding: 6 },
        scales: {
          x: { min: 1940, max: 2027, grid: { color: "rgba(255,255,255,0.04)" },
               ticks: { color: "#6E7681", stepSize: 10, callback: v => v } },
          y: { min: -0.6, max: order.length - 0.4, grid: { color: "rgba(255,255,255,0.04)" },
               ticks: { color: "#9DA7B3", stepSize: 1, callback: v => (GROUPS[order[v]] ? GROUPS[order[v]].label.replace(/ \(.*\)/, "") : "") } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#161B22", borderColor: "#313c4d", borderWidth: 1, padding: 10,
            titleColor: "#E8EEF5", bodyColor: "#9DA7B3",
            callbacks: { title: it => it[0].raw.w.name + " · " + it[0].raw.w.year, label: it => it.raw.w.state }
          }
        }
      }
    });
  })();

  buildFilters();
  render();
  buildTable();
})();
