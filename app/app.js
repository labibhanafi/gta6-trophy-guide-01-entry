/* Leonida Legend — tracker logic.
   Plain classic script, no imports, no network at run time beyond loading
   this guide's own data file (app/data/trophies.json) from the same server.
   Progress lives in localStorage and can be exported to / imported from a
   JSON file. */

(function () {
  'use strict';

  var STORAGE_KEY = 'gta6-trophy-guide-v1';
  var DATA_URL = 'data/trophies.json';
  var TOTAL = 55;

  var ROADMAP_STAGES = [
    { n: 1, title: 'Story — Chapters 1–4', text: 'Play the story straight through. Every chapter trophy and every named story mission in this stage unlocks by finishing its mission — nothing to hunt, nothing to miss.', ids: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13] },
    { n: 2, title: 'Finale & 100%', text: 'Finish the final mission for the gold, then keep making choices — PSN tracks 500 of them across the whole game. 100% Completion is the long grind that the platinum waits on.', ids: [7, 14, 48] },
    { n: 3, title: 'Strangers & side missions', text: 'Pick up the stranger strands around Leonida and play each one to its final mission — Andy, Kenton, Billy, Randy, Tyrone, plus Bret’s hunt. Eight finished stranger strands pop the silver.', ids: [22, 23, 24, 25, 26, 27, 29] },
    { n: 4, title: 'Collectibles & exploration', text: 'Mop up the map: 18 meditation spots, 3 card sets, 100 WAiNK photo spots, 100 vehicles, all 52 areas, the 8 garages, the Ocean Beach cocktail and whatever strange thing is out there.', ids: [28, 30, 31, 35, 42, 44, 50, 54] },
    { n: 5, title: 'Activities, races & challenges', text: 'The grind stage: 250 stunts, 42 gold shooting-range challenges, 14 drone-race wins, 20 different race wins, 50 challenges, plus fishing, arcade, bowling, Combat Focus and the Scooter Bros app.', ids: [15, 16, 17, 18, 19, 20, 21, 32, 36, 38, 46, 49, 51, 55] },
    { n: 6, title: 'Heists, robberies & money', text: 'Last: partner jobs, vaults, armored trucks, gang operations, the two missable moments (VCIA and the showroom) and the money trophies — $250,000 laundered, $100,000 spent. The platinum pops with the last one of these.', ids: [33, 34, 37, 39, 40, 41, 43, 45, 47, 52, 53] }
  ];

  var KIND_LABELS = {
    story: 'Story',
    collectibles: 'Collectibles',
    activities: 'Activities',
    combat: 'Combat',
    exploration: 'Exploration',
    online: 'Online',
    platinum: 'Platinum'
  };

  var state = loadState();
  var trophies = [];
  var byId = {};

  var els = {};
  ['trophyList', 'missableList', 'roadmapStages', 'earnedCount', 'progressPct',
   'progressFill', 'progressBar', 'gradeCounts', 'searchInput', 'filterBar',
   'spoilerToggle', 'earnedOnlyToggle', 'exportBtn', 'importBtn', 'importFile',
   'resetBtn', 'emptyState', 'listHint', 'missablePill'].forEach(function (id) {
    els[id] = document.getElementById(id);
  });

  function loadState() {
    var fresh = { earned: {}, counts: {}, spoiler: false, earnedOnly: false, filter: 'all', tab: 'tracker' };
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fresh;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.earned && typeof parsed.earned === 'object') fresh.earned = parsed.earned;
        if (parsed.counts && typeof parsed.counts === 'object') fresh.counts = parsed.counts;
        if (typeof parsed.spoiler === 'boolean') fresh.spoiler = parsed.spoiler;
        if (typeof parsed.earnedOnly === 'boolean') fresh.earnedOnly = parsed.earnedOnly;
        if (typeof parsed.filter === 'string') fresh.filter = parsed.filter;
        if (typeof parsed.tab === 'string') fresh.tab = parsed.tab;
      }
    } catch (err) {
      /* A corrupt save is ignored: the guide still loads, empty. */
    }
    return fresh;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* Storage full or blocked: the page still works for this visit. */
    }
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function isEarned(t) { return !!state.earned[t.id]; }

  function earnedTotal() {
    return trophies.reduce(function (sum, t) { return sum + (isEarned(t) ? 1 : 0); }, 0);
  }

  function gradeEarned(grade) {
    return trophies.reduce(function (sum, t) {
      return sum + ((t.grade === grade && isEarned(t)) ? 1 : 0);
    }, 0);
  }

  function gradeTotal(grade) {
    return trophies.reduce(function (sum, t) { return sum + (t.grade === grade ? 1 : 0); }, 0);
  }

  function spoilerHides(t) {
    return state.spoiler && t.kind === 'story' && !isEarned(t);
  }

  /* ---------- rendering ---------- */

  function trophyCard(t) {
    var li = el('li', 'trophy' + (isEarned(t) ? ' earned' : ''));
    li.dataset.trophyId = String(t.id);

    var head = el('div', 'trophy-head');
    var box = el('input', 'earn-box');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', function () {
      state.earned[t.id] = box.checked;
      if (!box.checked) delete state.earned[t.id];
      saveState();
      renderAll();
    });
    head.appendChild(box);

    var main = el('div', 'trophy-main');
    var name = el('h3', 'trophy-name');
    if (spoilerHides(t)) {
      name.textContent = 'Hidden story trophy — earn it to reveal';
      name.classList.add('spoiler-hidden');
    } else {
      name.appendChild(document.createTextNode(t.name + ' '));
      var badge = el('span', 'grade-badge grade-' + t.grade, t.grade);
      name.appendChild(badge);
      var kind = el('span', 'kind-tag', KIND_LABELS[t.kind] || t.kind);
      name.appendChild(kind);
      if (t.missable) name.appendChild(el('span', 'missable-tag', 'Missable'));
    }
    main.appendChild(name);

    var desc = el('p', 'trophy-desc');
    if (spoilerHides(t)) {
      desc.textContent = 'Spoilers hidden. Tick the box once you have earned this trophy to see its name and description.';
      desc.classList.add('spoiler-hidden');
    } else {
      desc.textContent = t.description;
    }
    main.appendChild(desc);

    var toggle = el('button', 'guide-toggle', 'Show guide & sources');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    var guideBox = el('div', 'guide');
    guideBox.hidden = true;
    var guideText = el('p', null, t.guide);
    guideBox.appendChild(guideText);
    if (t.sources && t.sources.length) {
      guideBox.appendChild(el('p', 'sources', 'Sources: ' + t.sources.join(' · ')));
    }
    toggle.addEventListener('click', function () {
      guideBox.hidden = !guideBox.hidden;
      toggle.textContent = guideBox.hidden ? 'Show guide & sources' : 'Hide guide & sources';
      toggle.setAttribute('aria-expanded', String(!guideBox.hidden));
    });
    main.appendChild(toggle);
    main.appendChild(guideBox);

    if (typeof t.count === 'number' && t.count > 0) {
      main.appendChild(countRow(t));
    }

    head.appendChild(main);
    li.appendChild(head);
    return li;
  }

  function countRow(t) {
    var row = el('div', 'count-row');
    row.appendChild(el('span', null, 'Progress:'));
    var minus = el('button', null, '−');
    minus.type = 'button';
    minus.setAttribute('aria-label', 'Decrease count for ' + t.name);
    var input = el('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(t.count);
    input.value = String(state.counts[t.id] || 0);
    input.setAttribute('aria-label', 'Count progress for ' + t.name);
    var plus = el('button', null, '+');
    plus.type = 'button';
    plus.setAttribute('aria-label', 'Increase count for ' + t.name);

    function setCount(v) {
      v = Math.max(0, Math.min(t.count, Math.round(v) || 0));
      state.counts[t.id] = v;
      if (v === 0) delete state.counts[t.id];
      if (v >= t.count && !isEarned(t)) {
        state.earned[t.id] = true;
      }
      saveState();
      renderAll();
    }
    minus.addEventListener('click', function () { setCount((state.counts[t.id] || 0) - 1); });
    plus.addEventListener('click', function () { setCount((state.counts[t.id] || 0) + 1); });
    input.addEventListener('change', function () { setCount(Number(input.value)); });

    row.appendChild(minus);
    row.appendChild(input);
    row.appendChild(plus);
    row.appendChild(el('span', null, ' / ' + t.count.toLocaleString('en-US')));
    return row;
  }

  function currentFilter() { return state.filter; }

  function trophyMatches(t) {
    var q = els.searchInput.value.trim().toLowerCase();
    if (q) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    if (state.earnedOnly && isEarned(t)) return false;
    var f = currentFilter();
    if (f === 'all') return true;
    if (f === 'missable') return !!t.missable;
    if (f === 'online') return t.kind === 'online';
    return t.kind === f;
  }

  function renderList() {
    els.trophyList.innerHTML = '';
    var shown = 0;
    trophies.forEach(function (t) {
      if (!trophyMatches(t)) return;
      els.trophyList.appendChild(trophyCard(t));
      shown++;
    });
    els.emptyState.hidden = shown !== 0;
    els.listHint.textContent = shown === TOTAL
      ? 'Tick a trophy when you earn it — progress is saved in this browser. Click a trophy to open its guide and sources.'
      : 'Showing ' + shown + ' of ' + TOTAL + ' trophies.';
  }

  function renderMissable() {
    els.missableList.innerHTML = '';
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      els.missableList.appendChild(trophyCard(t));
    });
    els.missablePill.textContent = String(trophies.filter(function (t) { return t.missable; }).length);
  }

  function renderRoadmap() {
    els.roadmapStages.innerHTML = '';
    ROADMAP_STAGES.forEach(function (stage) {
      var box = el('div', 'stage');
      var done = stage.ids.filter(function (id) { return state.earned[id]; }).length;
      var h = el('h3');
      h.appendChild(document.createTextNode('Stage ' + stage.n + ': ' + stage.title + ' '));
      h.appendChild(el('span', 'stage-count', '(' + done + '/' + stage.ids.length + ' earned)'));
      box.appendChild(h);
      box.appendChild(el('p', null, stage.text));
      var list = el('ul', 'stage-trophies');
      stage.ids.forEach(function (id) {
        var t = byId[id];
        if (!t) return;
        var item = el('li', isEarned(t) ? 'done' : null);
        item.appendChild(document.createTextNode((isEarned(t) ? '✓ ' : '') + t.name + ' '));
        item.appendChild(el('span', 'mini-grade', t.grade));
        list.appendChild(item);
      });
      box.appendChild(list);
      els.roadmapStages.appendChild(box);
    });
    var plat = el('div', 'stage');
    var ph = el('h3');
    ph.textContent = 'Platinum: Vice Got a Price!';
    plat.appendChild(ph);
    plat.appendChild(el('p', null, 'Earn the other 54 trophies and the platinum unlocks itself. It is the last trophy by definition — there is nothing extra to do for it.'));
    els.roadmapStages.appendChild(plat);
  }

  function renderProgress() {
    var earned = earnedTotal();
    var pct = Math.round((earned / TOTAL) * 100);
    els.earnedCount.textContent = String(earned);
    els.progressPct.textContent = ' · ' + pct + '%';
    els.progressFill.style.width = pct + '%';
    els.progressBar.setAttribute('aria-valuenow', String(earned));
    els.gradeCounts.innerHTML = '';
    ['platinum', 'gold', 'silver', 'bronze'].forEach(function (g) {
      els.gradeCounts.appendChild(el('span', null,
        g.charAt(0).toUpperCase() + g.slice(1) + ' ' + gradeEarned(g) + '/' + gradeTotal(g)));
    });
  }

  function renderAll() {
    renderProgress();
    renderList();
    renderMissable();
    renderRoadmap();
  }

  /* ---------- tabs ---------- */

  function showTab(name) {
    state.tab = name;
    saveState();
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === name);
    });
    document.querySelectorAll('.view').forEach(function (view) {
      view.classList.toggle('active', view.id === 'view-' + name);
    });
  }

  document.querySelectorAll('.tab').forEach(function (btn) {
    btn.addEventListener('click', function () { showTab(btn.dataset.tab); });
  });

  /* ---------- filters & toggles ---------- */

  els.filterBar.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.filter');
    if (!btn) return;
    state.filter = btn.dataset.filter;
    saveState();
    els.filterBar.querySelectorAll('.filter').forEach(function (b) {
      b.classList.toggle('active', b === btn);
    });
    renderList();
  });

  els.searchInput.addEventListener('input', renderList);

  els.spoilerToggle.checked = !!state.spoiler;
  els.spoilerToggle.addEventListener('change', function () {
    state.spoiler = els.spoilerToggle.checked;
    saveState();
    renderAll();
  });

  els.earnedOnlyToggle.checked = !!state.earnedOnly;
  els.earnedOnlyToggle.addEventListener('change', function () {
    state.earnedOnly = els.earnedOnlyToggle.checked;
    saveState();
    renderList();
  });

  /* ---------- export / import / reset ---------- */

  function download(filename, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  els.exportBtn.addEventListener('click', function () {
    var payload = {
      app: 'leonida-legend-gta6-trophy-guide',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: state.earned,
      counts: state.counts
    };
    download('gta6-trophy-progress.json', JSON.stringify(payload, null, 2));
  });

  els.importBtn.addEventListener('click', function () { els.importFile.click(); });

  els.importFile.addEventListener('change', function () {
    var file = els.importFile.files && els.importFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var next = loadState();
        if (data && typeof data === 'object') {
          if (data.earned && typeof data.earned === 'object') next.earned = data.earned;
          if (data.counts && typeof data.counts === 'object') next.counts = data.counts;
        }
        state = next;
        saveState();
        els.spoilerToggle.checked = !!state.spoiler;
        els.earnedOnlyToggle.checked = !!state.earnedOnly;
        renderAll();
      } catch (err) {
        window.alert('That file is not a valid Leonida Legend progress export.');
      }
      els.importFile.value = '';
    };
    reader.readAsText(file);
  });

  els.resetBtn.addEventListener('click', function () {
    if (!window.confirm('Reset all progress? This clears every ticked trophy and counter.')) return;
    state.earned = {};
    state.counts = {};
    saveState();
    renderAll();
  });

  /* ---------- boot ---------- */

  fetch(DATA_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('Could not load ' + DATA_URL + ' (' + res.status + ')');
      return res.json();
    })
    .then(function (data) {
      trophies = Array.isArray(data) ? data : data.trophies;
      trophies.forEach(function (t) { byId[t.id] = t; });
      if (trophies.length !== TOTAL) {
        throw new Error('Expected ' + TOTAL + ' trophies, found ' + trophies.length);
      }
      els.filterBar.querySelectorAll('.filter').forEach(function (b) {
        b.classList.toggle('active', b.dataset.filter === state.filter);
      });
      showTab(state.tab || 'tracker');
      renderAll();
    })
    .catch(function (err) {
      els.trophyList.innerHTML = '';
      var msg = el('p', 'empty', 'The trophy list could not be loaded: ' + err.message);
      msg.hidden = false;
      els.trophyList.appendChild(msg);
    });
})();
