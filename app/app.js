/* Leonida Legend — GTA 6 trophy guide & tracker. Offline, vanilla JS, no libraries. */
(function () {
  "use strict";

  var STORAGE_KEY = "gta6-trophy-progress-v1";
  var DEMO_EARNED = [1, 2, 3, 4, 5, 8, 15, 16, 21, 35, 42, 52, 53];

  var KIND_LABELS = {
    platinum: "Platinum", story: "Story", side: "Side missions",
    collectible: "Collectible", activity: "Activity", combat: "Combat",
    completion: "100% completion", misc: "Misc / world"
  };

  var ROADMAP_STAGES = [
    { stage: 1, title: "Story first — and the one missable step", time: "60–80 hours",
      points: [
        "Play Chapters 1–5 in order. All 13 story trophies (chapters, named missions, finale) are unmissable.",
        "CHAPTER 1, FIRST PRIORITY: meditate at Jason's house the moment it is offered. This is the only missable trophy in the game (Positive Mental Attitude, 18 spots in 10 locations).",
        "Keep cheats off the whole run — cheats disable trophies and saving.",
        "While travelling between missions, scan vehicles and study animals through binoculars — the 100% checklist needs 200 of 277 vehicles and 100 of 255 animals." ] },
    { stage: 2, title: "Side strands & strangers", time: "After the story, or alongside it",
      points: [
        "Finish the five named character strands to their final missions: Andy, Kenton, Billy, Randy, Tyrone.",
        "Complete 8 stranger mission strands across Leonida (Strangers & Freaks, silver).",
        "Hunt the unique animal for Bret (Fair Game); study animals as you go.",
        "Partner moments with Jason and Lucia together feed Hot Together, Retail Therapy and Personal Best." ] },
    { stage: 3, title: "Collectibles, exploration & money", time: "Free roam",
      points: [
        "WAiNK It at 100 locations (You WAiNKer!, silver) — fold it into normal travel from the start.",
        "Complete 3 collectible card sets; discover 100 vehicles; explore all 52 areas of Leonida.",
        "Rob 5 bank vaults, an armored truck, one illegal operation per gang (9 gangs), and a jewelry store undetected.",
        "Launder $250,000 of marked bills, spend $100,000 in shops, buy all 8 garages, register 10 vehicles in Scooter Bros.",
        "Catch the one-off world moments: Ocean Beach cocktail, showroom smash, bowling at Kolt & Associates, the strange event, the melee drive-by." ] },
    { stage: 4, title: "Activities & challenges", time: "Focused sessions",
      points: [
        "Gold all 42 Shooting Range challenges (The Shootist, silver).",
        "Win a Top Fun drone race at all 14 locations; win 20 different races.",
        "Try all 9 activity types once (Master of None); complete an arcade game; beat Cal at fishing.",
        "Complete 50 challenges — then push to 70 of 80 for the 100% checklist. Pull off 250 stunts while driving everywhere." ] },
    { stage: 5, title: "100% completion & the platinum", time: "The final push",
      points: [
        "Open Progress → Stats → 100% Completion (appears after the story; earlier progress counts).",
        "The checklist is lenient — about 60% true completion: any 70 of 80 challenges, 200 of 277 vehicles scanned, 100 of 255 animals studied.",
        "Attain 100% completion (A Long Road, gold) — the hardest trophy in the set.",
        "Vice Got a Price! (platinum) pops automatically once the other 54 are earned." ] }
  ];

  var trophies = [];
  var earned = {};
  var selectedId = null;
  var currentView = "checklist";

  var $ = function (id) { return document.getElementById(id); };

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) earned = JSON.parse(raw) || {};
    } catch (e) { earned = {}; }
    var params = new URLSearchParams(location.search);
    if (params.get("demo") === "1") {
      DEMO_EARNED.forEach(function (id) { earned[id] = true; });
    }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(earned)); } catch (e) { /* storage full or blocked */ }
  }

  function earnedCount() {
    return trophies.filter(function (t) { return earned[t.id]; }).length;
  }

  function spoilerHidden(t) {
    return $("spoiler-toggle").checked && t.hidden && !earned[t.id] && (t.kind === "story" || t.kind === "side");
  }

  function gradeClass(grade) { return "grade-chip grade-" + grade; }

  function trophyTags(t) {
    var html = '<span class="' + gradeClass(t.grade) + '">' + escapeHtml(t.grade) + '</span>' +
      '<span class="kind-chip">' + escapeHtml(KIND_LABELS[t.kind] || t.kind) + '</span>';
    if (t.missable) html += '<span class="missable-flag">⚠ Missable</span>';
    if (t.hidden) html += '<span class="kind-chip">Hidden</span>';
    return html;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function filteredTrophies() {
    var q = $("search").value.trim().toLowerCase();
    var grade = $("grade-filter").value;
    var kind = $("kind-filter").value;
    var missableOnly = $("missable-only").checked;
    var unearnedOnly = $("unearned-only").checked;
    return trophies.filter(function (t) {
      if (grade && t.grade !== grade) return false;
      if (kind && t.kind !== kind) return false;
      if (missableOnly && !t.missable) return false;
      if (unearnedOnly && earned[t.id]) return false;
      if (q && (t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1)) return false;
      return true;
    });
  }

  function renderChecklist() {
    var list = $("trophy-list");
    var rows = filteredTrophies();
    $("list-meta").textContent = rows.length + " of 55 trophies shown · " +
      earnedCount() + " earned · click a trophy for its guide and sources";
    list.innerHTML = "";
    rows.forEach(function (t) {
      var li = document.createElement("li");
      li.className = "trophy-row" + (earned[t.id] ? " earned" : "") + (selectedId === t.id ? " selected" : "");
      li.dataset.id = t.id;
      var hidden = spoilerHidden(t);
      var nameHtml = hidden ? '<span class="hidden-note">Hidden trophy — earn it to reveal</span>' : escapeHtml(t.name);
      var descHtml = hidden ? "" : escapeHtml(t.description);
      li.innerHTML =
        '<input type="checkbox" aria-label="Mark ' + escapeHtml(t.name) + ' as earned"' + (earned[t.id] ? " checked" : "") + '>' +
        '<div><div class="trophy-name">' + nameHtml + '</div>' +
        '<div class="trophy-desc">' + descHtml + '</div>' +
        '<div class="trophy-tags">' + trophyTags(t) + '</div></div>' +
        '<span></span>';
      li.querySelector("input").addEventListener("change", function (ev) {
        ev.stopPropagation();
        earned[t.id] = ev.target.checked;
        if (!ev.target.checked) delete earned[t.id];
        saveProgress();
        renderAll();
      });
      li.addEventListener("click", function () { selectTrophy(t.id); });
      list.appendChild(li);
    });
  }

  function renderRoadmap() {
    var ol = $("roadmap");
    ol.innerHTML = "";
    ROADMAP_STAGES.forEach(function (s) {
      var li = document.createElement("li");
      var done = trophies.filter(function (t) { return t.stage === s.stage && earned[t.id]; }).length;
      var total = trophies.filter(function (t) { return t.stage === s.stage; }).length;
      li.innerHTML = "<h3>" + escapeHtml(s.title) + "</h3>" +
        '<p class="stage-meta">' + escapeHtml(s.time) + " · " + done + " / " + total + " trophies in this stage</p>" +
        "<ul>" + s.points.map(function (p) { return "<li>" + escapeHtml(p) + "</li>"; }).join("") + "</ul>";
      ol.appendChild(li);
    });
  }

  function renderMissable() {
    var box = $("missable-list");
    box.innerHTML = "";
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      var card = document.createElement("div");
      card.className = "trophy-row" + (earned[t.id] ? " earned" : "");
      card.innerHTML =
        '<input type="checkbox" aria-label="Mark as earned"' + (earned[t.id] ? " checked" : "") + '>' +
        '<div><div class="trophy-name">' + escapeHtml(t.name) + '</div>' +
        '<div class="trophy-desc">' + escapeHtml(t.description) + '</div>' +
        '<div class="trophy-tags">' + trophyTags(t) + '</div>' +
        '<p>' + escapeHtml(t.guide) + '</p></div><span></span>';
      card.querySelector("input").addEventListener("change", function (ev) {
        earned[t.id] = ev.target.checked;
        if (!ev.target.checked) delete earned[t.id];
        saveProgress();
        renderAll();
      });
      box.appendChild(card);
    });
  }

  function selectTrophy(id) {
    selectedId = id;
    var t = trophies.find(function (x) { return x.id === id; });
    if (!t) return;
    $("detail-empty").hidden = true;
    $("detail").hidden = false;
    $("detail-grade").className = gradeClass(t.grade);
    $("detail-grade").textContent = t.grade;
    $("detail-kind").textContent = KIND_LABELS[t.kind] || t.kind;
    $("detail-missable").hidden = !t.missable;
    $("detail-name").textContent = spoilerHidden(t) ? "Hidden Trophy" : t.name;
    $("detail-desc").textContent = spoilerHidden(t) ? "Hidden until earned — turn Spoiler-safe off or earn it to see the official description." : t.description;
    $("detail-estimate").textContent = "Estimate: " + t.estimate + (t.hidden ? " · Hidden on PlayStation until earned" : "");
    var cb = $("detail-earned");
    cb.checked = !!earned[t.id];
    cb.onchange = function () {
      earned[t.id] = cb.checked;
      if (!cb.checked) delete earned[t.id];
      saveProgress();
      renderAll();
    };
    $("detail-guide").textContent = t.guide;
    var steps = $("detail-steps");
    steps.innerHTML = "";
    (t.steps || []).forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s;
      steps.appendChild(li);
    });
    var src = $("detail-sources");
    src.innerHTML = "";
    (t.sources || []).forEach(function (s) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = s.url;
      a.textContent = s.name;
      a.target = "_blank";
      a.rel = "noopener";
      li.appendChild(a);
      src.appendChild(li);
    });
    renderChecklist();
    if (window.innerWidth <= 900) $("detail-pane").scrollIntoView({ behavior: "smooth" });
  }

  function updateProgress() {
    var n = earnedCount();
    var pct = Math.round((n / 55) * 100);
    $("earned-count").textContent = n;
    $("progress-fill").style.width = pct + "%";
    $("progress-pct").textContent = pct + "% to platinum";
    var counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    trophies.forEach(function (t) { if (earned[t.id]) counts[t.grade]++; });
    $("footer-counts").textContent =
      "Earned: " + counts.platinum + " platinum · " + counts.gold + " gold · " + counts.silver + " silver · " + counts.bronze + " bronze";
  }

  function setView(view) {
    currentView = view;
    document.querySelectorAll(".tab").forEach(function (b) {
      var on = b.dataset.view === view;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.toggle("active", v.id === "view-" + view);
    });
    $("toolbar").style.display = view === "checklist" ? "" : "none";
  }

  function exportProgress() {
    var data = { game: "Grand Theft Auto VI", exportedAt: new Date().toISOString(), earned: Object.keys(earned).map(Number) };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gta6-trophy-progress.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var ids = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(ids)) throw new Error("bad file");
        earned = {};
        ids.forEach(function (id) {
          if (trophies.some(function (t) { return t.id === Number(id); })) earned[Number(id)] = true;
        });
        saveProgress();
        renderAll();
      } catch (e) {
        alert("That file is not a valid Leonida Legend progress export.");
      }
    };
    reader.readAsText(file);
  }

  function renderAll() {
    updateProgress();
    renderChecklist();
    renderRoadmap();
    renderMissable();
    if (selectedId) {
      var t = trophies.find(function (x) { return x.id === selectedId; });
      if (t) selectTrophy(selectedId);
    }
  }

  function init(data) {
    trophies = data.trophies || data;
    $("missable-badge").textContent = trophies.filter(function (t) { return t.missable; }).length;
    loadProgress();
    document.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () { setView(b.dataset.view); });
    });
    ["search", "grade-filter", "kind-filter", "missable-only", "unearned-only"].forEach(function (id) {
      $(id).addEventListener("input", renderChecklist);
      $(id).addEventListener("change", renderChecklist);
    });
    $("spoiler-toggle").addEventListener("change", renderAll);
    $("export-btn").addEventListener("click", exportProgress);
    $("import-btn").addEventListener("click", function () { $("import-file").click(); });
    $("import-file").addEventListener("change", function () {
      if (this.files[0]) importProgress(this.files[0]);
      this.value = "";
    });
    $("reset-btn").addEventListener("click", function () {
      if (confirm("Clear all earned trophies?")) {
        earned = {};
        saveProgress();
        renderAll();
      }
    });
    var params = new URLSearchParams(location.search);
    var view = params.get("view");
    if (view && ["checklist", "roadmap", "missable", "about"].indexOf(view) !== -1) setView(view);
    if (params.get("spoilers") === "on") $("spoiler-toggle").checked = true;
    if (params.get("trophy")) selectTrophy(Number(params.get("trophy")));
    renderAll();
  }

  fetch("data/trophies.json")
    .then(function (r) { return r.json(); })
    .then(init)
    .catch(function () {
      $("trophy-list").innerHTML = "<li>Could not load data/trophies.json — are you serving app/ over HTTP?</li>";
    });
})();
