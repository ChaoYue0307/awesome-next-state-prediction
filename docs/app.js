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
        onClick: (e, els, chart) => {
          if (!els.length) return;
          const el0 = els[0];
          const pt = chart.data.datasets[el0.datasetIndex].data[el0.index];
          if (pt && pt.w) focusCard(pt.w.id);
        },
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

  /* ---------- per-card "next-state" thumbnail ----------
     A schematic glyph of the state representation (left, muted) being predicted
     into its next state (right, group-colored). The arrow is coral when the
     prediction is action-conditioned. This encodes the one thing the repo is about. */
  function glyph(space, cx, hi, col) {
    const m = "#3a434f", cy = 40;
    if (space === "text") {
      let s = ""; for (let i = 0; i < 4; i++) { const x = cx - 26 + i * 13, f = (hi && i === 3) ? col : m; s += `<rect x="${x}" y="${cy - 6}" width="10" height="12" rx="2" fill="${f}"/>`; } return s;
    }
    if (space === "token") {
      let s = ""; for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) { const x = cx - 15 + k * 11, y = cy - 10 + r * 11, f = (hi && r === 0 && k === 1) ? col : m; s += `<rect x="${x}" y="${y}" width="8.5" height="8.5" rx="1.5" fill="${f}"/>`; } return s;
    }
    if (space === "pixel") {
      const x = cx - 25, y = cy - 17, c = hi ? col : m;
      let s = `<rect x="${x}" y="${y}" width="50" height="34" rx="4" fill="#0d121a" stroke="${c}" stroke-width="1.5"/>`;
      s += `<line x1="${x + 6}" y1="${cy + 5}" x2="${x + 44}" y2="${cy + 5}" stroke="${c}" stroke-width="1.1" opacity="0.7"/>`;
      s += `<circle cx="${x + 13}" cy="${cy - 4}" r="3.5" fill="${hi ? col : m}"/>`;
      if (hi) s += `<path d="M${x + 26} ${cy + 5} L${x + 34} ${cy - 4} L${x + 42} ${cy + 5} Z" fill="${col}" opacity="0.85"/>`;
      return s;
    }
    if (space === "latent") {
      return `<circle cx="${cx}" cy="${cy}" r="17" fill="none" stroke="${m}" stroke-width="1.3"/>`
        + `<circle cx="${cx}" cy="${cy}" r="10.5" fill="none" stroke="${hi ? col : m}" stroke-width="1.3"/>`
        + `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${hi ? col : m}"/>`;
    }
    const n = [[cx - 16, cy - 6], [cx + 1, cy - 14], [cx + 15, cy + 2], [cx - 5, cy + 13]];
    const L = (a, b) => `<line x1="${n[a][0]}" y1="${n[a][1]}" x2="${n[b][0]}" y2="${n[b][1]}" stroke="${m}" stroke-width="1" opacity="0.6"/>`;
    let s = L(0, 1) + L(1, 2) + L(0, 2) + L(2, 3);
    n.forEach(p => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${hi ? col : m}"/>`; });
    return s;
  }
  function thumb(w) {
    const col = GROUPS[w.group].color, act = w.cond === "act";
    const arrowCol = act ? "#D85A30" : "#5a6473";
    const tag = act
      ? `<rect x="129" y="13" width="42" height="18" rx="9" fill="#1d1410" stroke="#993C1D"/><text x="150" y="26" text-anchor="middle" font-size="11" font-weight="600" fill="#F0997B" font-family="ui-monospace,Menlo,monospace">aₜ</text>`
      : `<text x="150" y="26" text-anchor="middle" font-size="10" letter-spacing="0.5" fill="#5a6473">passive</text>`;
    return `<svg viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="0" y="0" width="300" height="80" rx="10" fill="${col}" opacity="0.06"/>
      ${glyph(w.space, 60, false, col)}
      <line x1="106" y1="40" x2="188" y2="40" stroke="${arrowCol}" stroke-width="1.6"/>
      <path d="M183 35 L191 40 L183 45 Z" fill="${arrowCol}"/>
      ${tag}
      ${glyph(w.space, 240, true, col)}
      <text x="60" y="73" text-anchor="middle" font-size="9.5" fill="#6E7681">sₜ</text>
      <text x="240" y="73" text-anchor="middle" font-size="9.5" font-weight="600" fill="${col}">sₜ₊₁</text>
    </svg>`;
  }

  /* ---------- collection: filters + cards ---------- */
  const state = { groups: new Set(), spaces: new Set(), cond: new Set(), q: "", sort: "year-desc" };
  const SPACES = ["text", "token", "pixel", "latent", "abstract"];

  function chip(text, active, color, on) {
    const c = el("button", "chip" + (active ? " active" : ""), text);
    if (active && color) c.style.background = color;
    c.addEventListener("click", on);
    return c;
  }
  function restoreFromURL() {
    const p = new URLSearchParams(location.search);
    (p.get("group") || "").split(",").filter(Boolean).forEach(g => state.groups.add(g));
    (p.get("space") || "").split(",").filter(Boolean).forEach(s => state.spaces.add(s));
    (p.get("cond") || "").split(",").filter(Boolean).forEach(c => state.cond.add(c));
    if (p.get("q")) state.q = p.get("q").toLowerCase();
    if (p.get("sort")) state.sort = p.get("sort");
  }
  function syncURL() {
    const p = new URLSearchParams();
    if (state.groups.size) p.set("group", [...state.groups].join(","));
    if (state.spaces.size) p.set("space", [...state.spaces].join(","));
    if (state.cond.size) p.set("cond", [...state.cond].join(","));
    if (state.q) p.set("q", state.q);
    if (state.sort !== "year-desc") p.set("sort", state.sort);
    const qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }
  function buildFilters() {
    const gc = $("#group-chips");
    Object.entries(GROUPS).forEach(([k, g]) => {
      const c = chip(g.label.replace(/ \(.*\)/, ""), state.groups.has(k), g.color, () => toggle(state.groups, k, c, g.color));
      gc.append(c);
    });
    const sc = $("#space-chips");
    SPACES.forEach(s => {
      const c = chip(s, state.spaces.has(s), "var(--blue)", () => toggle(state.spaces, s, c, "var(--blue)"));
      sc.append(c);
    });
    const cc = $("#cond-chips");
    [["act", "interventional"], ["obs", "observational"]].forEach(([k, lbl]) => {
      const col = k === "act" ? "var(--teal)" : "var(--blue)";
      const c = chip(lbl, state.cond.has(k), col, () => toggle(state.cond, k, c, col));
      cc.append(c);
    });
    const search = $("#search"); search.value = state.q;
    search.addEventListener("input", e => { state.q = e.target.value.toLowerCase(); render(); });
    const sort = $("#sort"); sort.value = state.sort;
    sort.addEventListener("change", e => { state.sort = e.target.value; render(); });
  }
  function toggle(set, key, chipEl, color) {
    if (set.has(key)) { set.delete(key); chipEl.classList.remove("active"); chipEl.style.background = ""; }
    else { set.add(key); chipEl.classList.add("active"); chipEl.style.background = color; }
    render();
  }
  function clearFilters() {
    state.groups.clear(); state.spaces.clear(); state.cond.clear(); state.q = "";
    document.querySelectorAll("#filters .chip.active").forEach(c => { c.classList.remove("active"); c.style.background = ""; });
    $("#search").value = "";
  }
  function focusCard(id) {
    if (!document.getElementById("w-" + id)) { clearFilters(); render(); }
    const card = document.getElementById("w-" + id);
    if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); card.classList.add("flash"); setTimeout(() => card.classList.remove("flash"), 1600); }
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
      card.id = "w-" + w.id;
      const thumbInner = w.img
        ? `<img src="${w.img}" alt="${w.name} — figure © its authors" loading="lazy">`
        : thumb(w);
      card.innerHTML =
        `<div class="thumb${w.img ? " has-img" : ""}">${thumbInner}</div>
         <div class="top">
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
    syncURL();
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

  restoreFromURL();
  buildFilters();
  render();
  buildTable();
  document.addEventListener("keydown", e => {
    if (e.key === "/" && !/^(input|textarea|select)$/i.test(document.activeElement.tagName)) {
      e.preventDefault(); $("#search").focus();
    }
  });
})();
