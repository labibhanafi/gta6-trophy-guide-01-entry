/* Leonida Legend — trophy tracker logic.
   Loads app/data/trophies.json, renders the checklist, roadmap counts and
   missable list, and keeps earned progress in localStorage. No network
   requests beyond the app's own files. */

(function () {
  'use strict';

  var STORAGE_KEY = 'gta6-trophy-guide-01-progress-v1';
  var DATA_URL = 'data/trophies.json';

  var trophies = [];
  var earned = {};
  var activeFilter = 'all';
  var spoilerSafe = false;
  var searchText = '';

  var listEl = document.getElementById('trophyList');
  var metaEl = document.getElementById('listMeta');
  var emptyEl = document.getElementById('emptyNote');
  var earnedEl = document.getElementById('earnedCount');
  var fillEl = document.getElementById('progressFill');
  var barEl = document.getElementById('progressBar');
  var noteEl = document.getElementById('progressNote');
  var searchEl = document.getElementById('searchInput');
  var spoilerEl = document.getElementById('spoilerToggle');
  var missableEl = document.getElementById('missableList');
  var saveNoteEl = document.getElementById('saveNote');

  function loadEarned() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      var out = {};
      Object.keys(parsed).forEach(function (key) {
        if (parsed[key] === true) out[key] = true;
      });
      return out;
    } catch (err) {
      return {};
    }
  }

  function saveEarned() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));
    } catch (err) {
      saveNoteEl.textContent = 'Could not save progress in this browser (localStorage unavailable). Use Export to keep a backup.';
    }
  }

  function earnedCount() {
    return trophies.filter(function (t) { return earned[String(t.id)]; }).length;
  }

  function isStoryTrophy(t) {
    return t.kind === 'story';
  }

  function trophyMatches(t) {
    if (activeFilter === 'story' && t.kind !== 'story') return false;
    if (activeFilter === 'missable' && !t.missable) return false;
    if (activeFilter === 'collectibles' && t.kind !== 'collectibles') return false;
    if (activeFilter === 'activities' && t.kind !== 'activities') return false;
    if (activeFilter === 'online' && t.kind !== 'online') return false;
    if (searchText) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (hay.indexOf(searchText) === -1) return false;
    }
    return true;
  }

  function displayName(t) {
    if (spoilerSafe && isStoryTrophy(t) && !earned[String(t.id)]) {
      return 'Hidden story trophy — earn it to reveal its name';
    }
    return t.name;
  }

  function displayDescription(t) {
    if (spoilerSafe && isStoryTrophy(t) && !earned[String(t.id)]) {
      return 'Hidden until earned (spoiler-safe mode is on).';
    }
    return t.description;
  }

  function renderCounts() {
    var counts = { all: trophies.length, story: 0, missable: 0, collectibles: 0, activities: 0, online: 0 };
    trophies.forEach(function (t) {
      if (t.kind === 'story') counts.story++;
      if (t.kind === 'collectibles') counts.collectibles++;
      if (t.kind === 'activities') counts.activities++;
      if (t.kind === 'online') counts.online++;
      if (t.missable) counts.missable++;
    });
    document.querySelectorAll('[data-count-for]').forEach(function (el) {
      var key = el.getAttribute('data-count-for');
      el.textContent = '(' + (counts[key] || 0) + ')';
    });
    [1, 2, 3, 4].forEach(function (stage) {
      var n = trophies.filter(function (t) { return t.stage === stage; }).length;
      var e = trophies.filter(function (t) { return t.stage === stage && earned[String(t.id)]; }).length;
      var slot = document.getElementById('stageCount' + stage);
      if (slot) slot.textContent = '— ' + e + ' of ' + n + ' earned.';
    });
  }

  function renderProgress() {
    var total = trophies.length;
    var done = earnedCount();
    earnedEl.textContent = String(done);
    fillEl.style.width = total ? Math.round((done / total) * 100) + '%' : '0%';
    barEl.setAttribute('aria-valuenow', String(done));
    noteEl.textContent = done === total && total > 0
      ? 'Platinum complete — you are a Leonida Legend.'
      : 'Tick a trophy off when you earn it. Progress is saved in this browser.';
  }

  function renderMissable() {
    missableEl.innerHTML = '';
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      var li = document.createElement('li');
      var tag = document.createElement('span');
      tag.className = 'missable-tag';
      tag.textContent = 'Missable';
      var name = document.createElement('span');
      name.className = 'trophy-name';
      name.textContent = t.name;
      var desc = document.createElement('span');
      desc.className = 'trophy-desc';
      desc.textContent = ' — ' + t.description;
      li.appendChild(tag);
      li.appendChild(name);
      li.appendChild(desc);
      missableEl.appendChild(li);
    });
  }

  function renderList() {
    listEl.innerHTML = '';
    var shown = trophies.filter(trophyMatches);
    shown.forEach(function (t) {
      var li = document.createElement('li');
      var isEarned = !!earned[String(t.id)];
      li.className = 'trophy' + (isEarned ? ' is-earned' : '') +
        ((spoilerSafe && isStoryTrophy(t) && !isEarned) ? ' is-hidden-story' : '');

      var check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'trophy-check';
      check.checked = isEarned;
      check.setAttribute('aria-label', 'Earned: ' + t.name);
      check.addEventListener('change', function () {
        if (check.checked) earned[String(t.id)] = true;
        else delete earned[String(t.id)];
        saveEarned();
        renderProgress();
        renderCounts();
        renderList();
      });
      li.appendChild(check);

      var head = document.createElement('div');
      head.className = 'trophy-head';
      var name = document.createElement('span');
      name.className = 'trophy-name';
      name.textContent = displayName(t);
      head.appendChild(name);
      var grade = document.createElement('span');
      grade.className = 'trophy-grade ' + t.grade;
      grade.textContent = t.grade;
      head.appendChild(grade);
      var kind = document.createElement('span');
      kind.className = 'trophy-kind';
      kind.textContent = t.kind;
      head.appendChild(kind);
      if (t.missable) {
        var flag = document.createElement('span');
        flag.className = 'trophy-missable';
        flag.textContent = 'Missable';
        head.appendChild(flag);
      }
      if (t.targetLabel) {
        var target = document.createElement('span');
        target.className = 'trophy-target';
        target.textContent = t.targetLabel;
        head.appendChild(target);
      }
      li.appendChild(head);

      var desc = document.createElement('p');
      desc.className = 'trophy-desc';
      desc.textContent = displayDescription(t);
      li.appendChild(desc);

      var guide = document.createElement('p');
      guide.className = 'trophy-guide';
      var guideLabel = document.createElement('span');
      guideLabel.className = 'guide-label';
      guideLabel.textContent = 'Guide: ';
      guide.appendChild(guideLabel);
      guide.appendChild(document.createTextNode(t.guide));
      li.appendChild(guide);

      var sources = document.createElement('p');
      sources.className = 'trophy-sources';
      var sourceLabel = document.createElement('span');
      sourceLabel.className = 'source-label';
      sourceLabel.textContent = 'Sources: ';
      sources.appendChild(sourceLabel);
      sources.appendChild(document.createTextNode(t.sources || 'Exophase (official trophy list)'));
      li.appendChild(sources);

      var stage = document.createElement('p');
      stage.className = 'trophy-stage';
      stage.textContent = 'Roadmap: Stage ' + t.stage + (isEarned ? ' — earned' : '');
      li.appendChild(stage);

      listEl.appendChild(li);
    });
    emptyEl.hidden = shown.length !== 0;
    metaEl.textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies' +
      (activeFilter !== 'all' ? ' — filter: ' + activeFilter : '') +
      (searchText ? ' — search: "' + searchText + '"' : '') + '.';
  }

  function renderAll() {
    renderCounts();
    renderProgress();
    renderMissable();
    renderList();
  }

  function exportProgress() {
    var payload = {
      app: 'gta6-trophy-guide-01',
      exportedAt: new Date().toISOString(),
      earned: Object.keys(earned).map(Number).sort(function (a, b) { return a - b; })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    saveNoteEl.textContent = 'Exported ' + payload.earned.length + ' earned trophies to gta6-trophy-progress.json.';
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        var ids = parsed.earned || parsed;
        if (!Array.isArray(ids)) throw new Error('bad file');
        var next = {};
        ids.forEach(function (id) {
          var found = trophies.some(function (t) { return t.id === Number(id); });
          if (found) next[String(Number(id))] = true;
        });
        earned = next;
        saveEarned();
        renderAll();
        saveNoteEl.textContent = 'Imported ' + Object.keys(earned).length + ' earned trophies.';
      } catch (err) {
        saveNoteEl.textContent = 'That file could not be imported. Export a progress file from this guide and try again.';
      }
    };
    reader.readAsText(file);
  }

  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeFilter = btn.getAttribute('data-filter') || 'all';
      document.querySelectorAll('.filter-btn').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      renderList();
    });
  });

  searchEl.addEventListener('input', function () {
    searchText = searchEl.value.trim().toLowerCase();
    renderList();
  });

  spoilerEl.addEventListener('change', function () {
    spoilerSafe = spoilerEl.checked;
    renderList();
  });

  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', function () {
    if (window.confirm('Clear all earned trophies? Export a backup first if you want to keep your progress.')) {
      earned = {};
      saveEarned();
      renderAll();
      saveNoteEl.textContent = 'Progress reset. All trophies are unchecked.';
    }
  });

  earned = loadEarned();

  fetch(DATA_URL)
    .then(function (response) {
      if (!response.ok) throw new Error('Could not load ' + DATA_URL);
      return response.json();
    })
    .then(function (data) {
      trophies = Array.isArray(data) ? data : data.trophies;
      trophies.sort(function (a, b) { return a.id - b.id; });
      renderAll();
    })
    .catch(function (err) {
      listEl.innerHTML = '';
      emptyEl.hidden = false;
      emptyEl.textContent = 'Could not load the trophy list. Serve the app/ folder with a static server and reload.';
      metaEl.textContent = '';
    });
})();
