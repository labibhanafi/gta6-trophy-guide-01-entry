// Leonida Legend — trophy tracker logic. No libraries, no network beyond
// this folder: it fetches data/trophies.json and keeps progress in
// localStorage under one key.

const DATA_URL = "data/trophies.json";
const STORE_KEY = "leonida-legend-progress-v1";

const state = {
  trophies: [],
  earned: new Set(),
  hideSpoilers: true,
};

const $ = (id) => document.getElementById(id);

const els = {
  cards: $("cards"),
  empty: $("empty"),
  earnedCount: $("earned-count"),
  totalCount: $("total-count"),
  progressPct: $("progress-pct"),
  progressFill: $("progress-fill"),
  progressWrap: $("progress-bar-wrap"),
  platinumLine: $("platinum-line"),
  search: $("search"),
  grade: $("filter-grade"),
  status: $("filter-status"),
  kind: $("filter-kind"),
  missableOnly: $("missable-only"),
  spoiler: $("spoiler-toggle"),
  filterCount: $("filter-count"),
  panel: $("guide-panel"),
  guideGrade: $("guide-grade"),
  guideName: $("guide-name"),
  guideDesc: $("guide-desc"),
  guideText: $("guide-text"),
  guideMissable: $("guide-missable"),
  guideSources: $("guide-sources"),
};

/** Load saved progress from localStorage; ignore anything malformed. */
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) {
      for (const id of saved.earned) state.earned.add(Number(id));
    }
    if (typeof saved.hideSpoilers === "boolean") {
      state.hideSpoilers = saved.hideSpoilers;
    }
  } catch (err) {
    console.warn("Saved progress could not be read, starting fresh.", err);
  }
}

/** Persist progress (and the spoiler choice) to localStorage. */
function save() {
  const payload = {
    earned: [...state.earned].sort((a, b) => a - b),
    hideSpoilers: state.hideSpoilers,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
}

/** A trophy's name as shown: hidden while it is an unearned story trophy and spoilers are on. */
function displayName(trophy) {
  const hiddenStory =
    state.hideSpoilers && trophy.kind === "story" && !state.earned.has(trophy.id);
  return hiddenStory ? "Hidden story trophy" : trophy.name;
}

function displayDescription(trophy) {
  const hiddenStory =
    state.hideSpoilers && trophy.kind === "story" && !state.earned.has(trophy.id);
  return hiddenStory ? "Complete the story to reveal this trophy." : trophy.description;
}

/** Does a trophy pass every active filter? */
function visible(trophy) {
  const gradeOk = els.grade.value === "all" || trophy.grade === els.grade.value;
  const earned = state.earned.has(trophy.id);
  const statusOk =
    els.status.value === "all" ||
    (els.status.value === "earned" && earned) ||
    (els.status.value === "unearned" && !earned);
  const kindValue = els.kind.value;
  const kindOk =
    kindValue === "all" ||
    (kindValue === "missable" ? trophy.missable : trophy.kind === kindValue);
  const missableOk = !els.missableOnly.checked || trophy.missable;
  const query = els.search.value.trim().toLowerCase();
  const searchOk =
    query === "" ||
    trophy.name.toLowerCase().includes(query) ||
    trophy.description.toLowerCase().includes(query);
  return gradeOk && statusOk && kindOk && missableOk && searchOk;
}

function gradeBadge(trophy) {
  const label = trophy.grade.charAt(0).toUpperCase() + trophy.grade.slice(1);
  return `<span class="badge badge-${trophy.grade}">${label}</span>`;
}

function kindLabel(trophy) {
  if (trophy.kind === "platinum") return "Platinum";
  return trophy.kind.charAt(0).toUpperCase() + trophy.kind.slice(1);
}

/** Build one trophy card. */
function cardFor(trophy) {
  const earned = state.earned.has(trophy.id);
  const card = document.createElement("article");
  card.className = "card" + (earned ? " earned" : "");
  card.dataset.id = String(trophy.id);

  const top = document.createElement("div");
  top.className = "card-top";
  const name = document.createElement("h3");
  name.className = "card-name";
  name.textContent = displayName(trophy);
  top.append(name);
  const badge = document.createElement("span");
  badge.innerHTML = gradeBadge(trophy);
  top.append(badge.firstChild);
  card.append(top);

  const desc = document.createElement("p");
  desc.className = "card-desc";
  desc.textContent = displayDescription(trophy);
  card.append(desc);

  const meta = document.createElement("div");
  meta.className = "card-meta";
  if (trophy.missable) {
    const flag = document.createElement("span");
    flag.className = "badge badge-missable";
    flag.textContent = "Missable";
    meta.append(flag);
  }
  if (trophy.hidden) {
    const hidden = document.createElement("span");
    hidden.className = "badge badge-hidden";
    hidden.textContent = "Hidden on PSN";
    meta.append(hidden);
  }
  const kind = document.createElement("span");
  kind.className = "badge badge-kind";
  kind.textContent = kindLabel(trophy);
  meta.append(kind);
  if (trophy.target) {
    const target = document.createElement("span");
    target.className = "badge badge-kind";
    target.textContent = "Target: " + trophy.target;
    meta.append(target);
  }
  card.append(meta);

  const row = document.createElement("div");
  row.className = "card-check";
  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = earned;
  check.setAttribute("aria-label", "Mark " + trophy.name + " as earned");
  check.addEventListener("change", () => {
    if (check.checked) state.earned.add(trophy.id);
    else state.earned.delete(trophy.id);
    save();
    render();
  });
  const checkLabel = document.createElement("span");
  checkLabel.textContent = earned ? "Earned" : "Mark earned";
  row.append(check, checkLabel);

  const guideBtn = document.createElement("button");
  guideBtn.type = "button";
  guideBtn.className = "quiet";
  guideBtn.textContent = "Read guide";
  guideBtn.addEventListener("click", () => openGuide(trophy));
  row.append(guideBtn);
  card.append(row);

  return card;
}

/** Re-render the list, the counts and the progress bar. */
function render() {
  els.cards.textContent = "";
  let shown = 0;
  for (const trophy of state.trophies) {
    if (!visible(trophy)) continue;
    els.cards.append(cardFor(trophy));
    shown++;
  }
  els.empty.hidden = shown !== 0;
  els.filterCount.textContent =
    shown === state.trophies.length
      ? `Showing all ${shown} trophies.`
      : `Showing ${shown} of ${state.trophies.length} trophies.`;

  const earnedTotal = state.earned.size;
  const total = state.trophies.length;
  const pct = total === 0 ? 0 : Math.round((earnedTotal / total) * 100);
  els.earnedCount.textContent = String(earnedTotal);
  els.totalCount.textContent = String(total);
  els.progressPct.textContent = pct + "%";
  els.progressFill.style.width = pct + "%";
  els.progressWrap.setAttribute("aria-valuenow", String(pct));
  const others = state.trophies.filter((t) => t.grade !== "platinum").length;
  const othersEarned = [...state.earned].filter((id) => {
    const found = state.trophies.find((t) => t.id === id);
    return found && found.grade !== "platinum";
  }).length;
  els.platinumLine.textContent =
    othersEarned === others
      ? "Platinum earned — congratulations, Leonida Legend!"
      : `Platinum “Vice Got a Price!” unlocks when the other ${others} are earned (${othersEarned}/${others} so far).`;

  for (const span of document.querySelectorAll("[data-roadmap]")) {
    const stage = Number(span.dataset.roadmap);
    const stageTotal = state.trophies.filter((t) => t.roadmap === stage).length;
    const stageEarned = state.trophies.filter(
      (t) => t.roadmap === stage && state.earned.has(t.id),
    ).length;
    span.textContent = `(${stageEarned}/${stageTotal} earned)`;
  }
}

/** Fill and reveal the guide panel for one trophy. */
function openGuide(trophy) {
  els.guideGrade.innerHTML = gradeBadge(trophy);
  els.guideName.textContent = trophy.name;
  els.guideDesc.textContent = trophy.description;
  els.guideText.textContent = trophy.guide;
  if (trophy.missable && trophy.missable_note) {
    els.guideMissable.hidden = false;
    els.guideMissable.textContent = "Missable — " + trophy.missable_note;
  } else {
    els.guideMissable.hidden = true;
    els.guideMissable.textContent = "";
  }
  els.guideSources.textContent = "";
  for (const source of trophy.sources || []) {
    const item = document.createElement("li");
    item.textContent = source;
    els.guideSources.append(item);
  }
  els.panel.hidden = false;
  els.panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Download the saved progress as a JSON file. */
function exportProgress() {
  const payload = {
    app: "leonida-legend",
    earned: [...state.earned].sort((a, b) => a - b),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leonida-legend-progress.json";
  link.click();
  URL.revokeObjectURL(url);
}

/** Read a progress file and apply the earned ids it holds. */
function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error("no earned list in file");
      const known = new Set(state.trophies.map((t) => t.id));
      const next = new Set();
      for (const id of ids) {
        if (known.has(Number(id))) next.add(Number(id));
      }
      state.earned = next;
      save();
      render();
    } catch (err) {
      window.alert("That file is not a Leonida Legend progress export.");
      console.warn("Import failed.", err);
    }
  };
  reader.readAsText(file);
}

async function boot() {
  loadSaved();
  els.spoiler.checked = state.hideSpoilers;
  const response = await fetch(DATA_URL);
  const data = await response.json();
  state.trophies = Array.isArray(data) ? data : data.trophies;
  state.trophies.sort((a, b) => a.id - b.id);

  for (const control of [els.search, els.grade, els.status, els.kind, els.missableOnly]) {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  }
  els.spoiler.addEventListener("change", () => {
    state.hideSpoilers = els.spoiler.checked;
    save();
    render();
  });
  $("export-btn").addEventListener("click", exportProgress);
  $("import-btn").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = "";
  });
  $("reset-btn").addEventListener("click", () => {
    if (window.confirm("Clear all earned trophies?")) {
      state.earned.clear();
      save();
      render();
    }
  });
  $("close-guide").addEventListener("click", () => {
    els.panel.hidden = true;
  });

  render();
}

boot();
