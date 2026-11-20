"use strict";

/* Leonida Trophy Guide: checklist + roadmap + missable flags + per-trophy guides.
   Data comes from app/data/trophies.json (official names, descriptions, grades).
   Progress lives in localStorage; export/import move it as a JSON file. */

const STORE_KEY = "leonida-trophy-guide-earned-v1";
const SPOILER_KEY = "leonida-trophy-guide-spoiler-v1";
const STAGES = [
  { n: 1, title: "Stage 1 — Story first", text: "Play Chapters 1–4 and the story missions in order. Do the two missable moments (Catch Me If You Can, Capital Offense) the first time they appear — they never come back." },
  { n: 2, title: "Stage 2 — Partners and strangers", text: "Finish the final mission for Andy, Kenton, Billy, Randy and Tyrone, and complete 8 stranger mission strands across Leonida." },
  { n: 3, title: "Stage 3 — Collectibles and exploration", text: "Sweep the state: meditation spots, card sets, WAiNK photos, vehicles, all 52 areas, garages and Scooter Bros registrations." },
  { n: 4, title: "Stage 4 — Activities and challenges", text: "Races, shooting range, stunts, arcade, fishing, bowling, hunting and the combat and robbery challenges. Most of these can be done any time after the story." },
  { n: 5, title: "Stage 5 — 100% completion", text: "Attain 100% completion. Check the in-game stats page for what is left; this is the last grind before the platinum." },
  { n: 6, title: "Stage 6 — Platinum", text: "Earn the other 54 trophies and Vice Got a Price! unlocks by itself." }
];

let trophies = [];
let earned = new Set();
let spoiler = false;
let kindFilter = "all";
let query = "";

function loadStore() {
  try { earned = new Set(JSON.parse(localStorage.getItem(STORE_KEY) || "[]")); } catch (e) { earned = new Set(); }
  spoiler = localStorage.getItem(SPOILER_KEY) === "1";
}
function saveStore() {
  localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(earned).sort((a, b) => a - b)));
  localStorage.setItem(SPOILER_KEY, spoiler ? "1" : "0");
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function params() { return new URLSearchParams(location.search); }
function viewOf() {
  const v = params().get("view") || "checklist";
  return ["checklist", "roadmap", "missable", "guide"].includes(v) ? v : "checklist";
}
function isStory(t) { return t.kind === "story"; }
function hiddenBySpoiler(t) { return spoiler && isStory(t) && !earned.has(t.id); }

function gradeBadge(t) {
  return '<span class="badge ' + esc(t.grade) + '">' + esc(t.grade) + "</span>";
}
function cardHtml(t) {
  const got = earned.has(t.id);
  const hidden = hiddenBySpoiler(t);
  const name = hidden ? "Hidden story trophy" : t.name;
  const desc = hidden ? "Complete the story to reveal this trophy." : t.description;
  const miss = t.missable ? '<span class="flag">MISSABLE</span>' : "";
  const guide = hidden ? "" : '<p class="guide">' + esc(t.guide) + "</p>";
  const src = hidden ? "" : '<p class="src">Source: ' + esc(t.source) + "</p>";
  return '<article class="card' + (got ? " earned" : "") + '">' +
    '<label class="check"><input type="checkbox" data-id="' + t.id + '"' + (got ? " checked" : "") + ">" +
    "<h3>" + esc(name) + "</h3></label>" +
    "<div>" + gradeBadge(t) + '<span class="kind">' + esc(t.kind) + "</span>" + miss + "</div>" +
    '<p class="desc">' + esc(desc) + "</p>" + guide + src +
    "</article>";
}
function filtered() {
  return trophies.filter((t) => {
    if (kindFilter === "missable" && !t.missable) return false;
    if (kindFilter === "online") return false; // the official list has no online trophies
    if (kindFilter !== "all" && kindFilter !== "missable" && t.kind !== kindFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}
function renderChecklist(view) {
  const list = filtered();
  if (!list.length) {
    view.innerHTML = '<p class="empty">No trophies match this filter. The official list has no online trophies, so that filter is empty by design.</p>';
    return;
  }
  view.innerHTML = '<div class="grid">' + list.map(cardHtml).join("") + "</div>";
}
function renderRoadmap(view) {
  let html = "";
  for (const s of STAGES) {
    const items = trophies.filter((t) => t.stage === s.n);
    const done = items.filter((t) => earned.has(t.id)).length;
    html += '<section class="stage"><h2>' + esc(s.title) + " — " + done + "/" + items.length + "</h2>" +
      "<p>" + esc(s.text) + "</p><ol>" +
      items.map((t) => "<li>" + (earned.has(t.id) ? "✓ " : "") + esc(t.name) + " <span class=\"badge " + esc(t.grade) + "\">" + esc(t.grade) + "</span>" + (t.missable ? '<span class="flag">MISSABLE</span>' : "") + "</li>").join("") +
      "</ol></section>";
  }
  view.innerHTML = html;
}
function renderMissable(view) {
  const list = trophies.filter((t) => t.missable);
  view.innerHTML = '<div class="warn"><h2>2 missable trophies</h2>' +
    "<p>These two are one-time story moments. Miss them and the only way back is a new playthrough (or a save from before the moment). Every other trophy can be earned after the story.</p></div>" +
    '<div class="grid">' + list.map(cardHtml).join("") + "</div>";
}
function renderGuide(view) {
  const id = Number(params().get("id") || "37");
  const t = trophies.find((x) => x.id === id) || trophies[0];
  const idx = trophies.indexOf(t);
  const prev = trophies[(idx - 1 + trophies.length) % trophies.length];
  const next = trophies[(idx + 1) % trophies.length];
  const hidden = hiddenBySpoiler(t);
  view.innerHTML = '<article class="detail">' +
    "<div>" + gradeBadge(t) + '<span class="kind">' + esc(t.kind) + "</span>" + (t.missable ? '<span class="flag">MISSABLE</span>' : "") + "</div>" +
    "<h2>" + esc(hidden ? "Hidden story trophy" : t.name) + "</h2>" +
    '<p class="desc">' + esc(hidden ? "Complete the story to reveal this trophy." : t.description) + "</p>" +
    (hidden ? "" : '<p class="guide">' + esc(t.guide) + "</p><p class=\"src\">Source: " + esc(t.source) + "</p>") +
    '<p class="src">Roadmap stage ' + t.stage + " of 6 — " + esc(STAGES[t.stage - 1].title) + ".</p>" +
    '<div class="nav"><a href="?view=guide&amp;id=' + prev.id + '">← ' + esc(prev.name) + "</a>" +
    '<a href="?view=guide&amp;id=' + next.id + '">' + esc(next.name) + " →</a></div>" +
    "</article>";
}
function renderProgress() {
  const n = earned.size;
  const fill = document.getElementById("progressFill");
  const text = document.getElementById("progressText");
  if (fill) fill.style.width = (n / 55 * 100).toFixed(1) + "%";
  if (text) text.textContent = n + " / 55 earned — " + (55 - n) + " to go";
}
function render() {
  const view = document.getElementById("view");
  const v = viewOf();
  document.querySelectorAll("#tabs a").forEach((a) => a.classList.toggle("active", a.dataset.view === v));
  document.getElementById("controls").style.display = v === "checklist" ? "" : "none";
  if (v === "roadmap") renderRoadmap(view);
  else if (v === "missable") renderMissable(view);
  else if (v === "guide") renderGuide(view);
  else renderChecklist(view);
  renderProgress();
}
function exportProgress() {
  const blob = new Blob([JSON.stringify({ earned: Array.from(earned).sort((a, b) => a - b) }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "leonida-trophy-progress.json";
  a.click();
  URL.revokeObjectURL(a.href);
}
function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const ids = Array.isArray(data) ? data : data.earned;
      earned = new Set(ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55));
      saveStore();
      render();
    } catch (e) { alert("That file is not a progress export."); }
  };
  reader.readAsText(file);
}
async function main() {
  loadStore();
  const res = await fetch("data/trophies.json");
  const data = await res.json();
  trophies = data.trophies;
  document.getElementById("spoiler").checked = spoiler;
  document.getElementById("search").addEventListener("input", (e) => { query = e.target.value; render(); });
  document.getElementById("spoiler").addEventListener("change", (e) => { spoiler = e.target.checked; saveStore(); render(); });
  document.getElementById("kindFilters").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-kind]");
    if (!b) return;
    kindFilter = b.dataset.kind;
    document.querySelectorAll("#kindFilters button").forEach((x) => x.classList.toggle("on", x === b));
    render();
  });
  document.getElementById("view").addEventListener("change", (e) => {
    const box = e.target.closest("input[type=checkbox][data-id]");
    if (!box) return;
    const id = Number(box.dataset.id);
    if (box.checked) earned.add(id); else earned.delete(id);
    saveStore();
    render();
  });
  document.getElementById("exportBtn").addEventListener("click", exportProgress);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); });
  render();
}
main();
