// Leonida Platinum — offline GTA VI trophy tracker.
// Loads only data/trophies.json from its own folder, saves progress in localStorage,
// and renders four views (checklist, roadmap, missable, trophy detail) by URL hash.

const STORE_KEY = 'leonida-platinum-v1';
const DATA_URL = 'data/trophies.json';

const ROADMAP_STAGES = [
  {
    title: 'Stage 1 — Play the story',
    note: 'Chapters 1 to 4, the named missions and the finale. The two missable trophies live in story moments, so make a manual save before VCIA Takedown and before any showroom mission.',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 37, 45],
  },
  {
    title: 'Stage 2 — Character finales and strangers',
    note: 'Finish every character strand and the stranger missions. These are side content — check the mission list between story chapters if a strand goes quiet.',
    ids: [22, 23, 24, 26, 27, 25],
  },
  {
    title: 'Stage 3 — Activities and skills',
    note: 'Races, the shooting range, fishing, bowling, heists, wanted-level tricks and the money counters. The 42 gold shooting-range medals are the longest grind here — spread them out.',
    ids: [15, 16, 17, 18, 19, 20, 21, 28, 29, 32, 33, 34, 36, 38, 39, 40, 41, 43, 47, 48, 49, 50, 51, 52, 53],
  },
  {
    title: 'Stage 4 — Collectibles and clean-up',
    note: 'Cards, WAiNK spots, vehicles, areas and garages, then 100% completion and the platinum itself. Check the in-game 100% checklist for whatever is still short.',
    ids: [30, 31, 35, 42, 44, 46, 54, 55, 14, 1],
  },
];

const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  platinum: 'Platinum',
};

const state = {
  trophies: [],
  sources: {},
  sourceNote: '',
  earned: new Set(),
  spoiler: false,
  search: '',
  kind: 'all',
  grade: 'all',
  earnedFilter: 'all',
};

const $ = (id) => document.getElementById(id);

function loadStoredProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) {
      state.earned = new Set(saved.earned.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55));
    }
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  } catch {
    state.earned = new Set();
  }
}

function saveStoredProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...state.earned].sort((a, b) => a - b), spoiler: state.spoiler }));
}

function trophyById(id) {
  return state.trophies.find((t) => t.id === id);
}

function isHidden(t) {
  return state.spoiler && t.kind === 'story' && !state.earned.has(t.id);
}

function gradeBadge(t) {
  const span = document.createElement('span');
  span.className = 'tag ' + t.grade;
  span.textContent = t.grade;
  return span;
}

function kindTag(t) {
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = KIND_LABELS[t.kind] || t.kind;
  return span;
}

function missableTag() {
  const span = document.createElement('span');
  span.className = 'tag missable';
  span.textContent = 'MISSABLE';
  return span;
}

function countTag(t) {
  if (!t.count) return null;
  const span = document.createElement('span');
  span.className = 'tag count';
  span.textContent = 'PSN count: ' + t.count.toLocaleString('en-US') + ' ' + (t.countUnit || '');
  return span;
}

function updateProgress() {
  const earned = state.earned.size;
  const total = state.trophies.length || 55;
  $('earnedCount').textContent = String(earned);
  $('progressFill').style.width = Math.round((earned / total) * 100) + '%';
  $('progressPct').textContent = Math.round((earned / total) * 100) + '% to platinum';
  const byGrade = {};
  for (const t of state.trophies) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  $('gradeCounts').textContent =
    total + ' trophies · ' + (byGrade.platinum || 0) + ' platinum · ' + (byGrade.gold || 0) + ' gold · ' +
    (byGrade.silver || 0) + ' silver · ' + (byGrade.bronze || 0) + ' bronze · 2 missable';
}

function trophyMatchesFilters(t) {
  if (state.kind === 'missable') {
    if (!t.missable) return false;
  } else if (state.kind !== 'all' && t.kind !== state.kind) {
    return false;
  }
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.earnedFilter === 'todo' && state.earned.has(t.id)) return false;
  if (state.earnedFilter === 'earned' && !state.earned.has(t.id)) return false;
  if (state.search) {
    const q = state.search.toLowerCase();
    const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderChecklist() {
  const list = $('trophyList');
  list.replaceChildren();
  const shown = state.trophies.filter(trophyMatchesFilters);
  $('resultLine').textContent = shown.length + ' of ' + state.trophies.length + ' trophies shown · ' +
    state.earned.size + ' earned';
  if (shown.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No trophies match these filters. Clear the search or widen the filters.';
    list.append(p);
    return;
  }
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy' + (state.earned.has(t.id) ? ' earned' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', () => {
      if (box.checked) state.earned.add(t.id);
      else state.earned.delete(t.id);
      saveStoredProgress();
      renderAll();
    });
    const body = document.createElement('div');
    body.className = 'body';
    const name = document.createElement('div');
    name.className = 'name';
    if (isHidden(t)) {
      name.textContent = '??? — Hidden story trophy';
      name.classList.add('hiddenName');
    } else {
      name.textContent = t.name;
      name.addEventListener('click', () => { location.hash = '#/trophy/' + t.id; });
    }
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = isHidden(t) ? 'Earn this trophy to reveal its name and description.' : t.description;
    const peek = document.createElement('p');
    peek.className = 'guidepeek';
    peek.textContent = isHidden(t) ? '' : t.guide;
    const tags = document.createElement('div');
    tags.className = 'tags';
    tags.append(gradeBadge(t), kindTag(t));
    if (t.missable) tags.append(missableTag());
    const ct = countTag(t);
    if (ct) tags.append(ct);
    body.append(name, desc, peek, tags);
    li.append(box, body);
    list.append(li);
  }
}

function renderRoadmap() {
  const wrap = $('roadmapStages');
  wrap.replaceChildren();
  for (const [i, stage] of ROADMAP_STAGES.entries()) {
    const card = document.createElement('div');
    card.className = 'stage';
    const h = document.createElement('h3');
    const no = document.createElement('span');
    no.className = 'stageno';
    no.textContent = 'Stage ' + (i + 1);
    h.append(no, document.createTextNode(stage.title.replace(/^Stage \d+ — /, '')));
    const p = document.createElement('p');
    p.textContent = stage.note;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const id of stage.ids) {
      const t = trophyById(id);
      if (!t) continue;
      const a = document.createElement('a');
      a.className = 'chip' + (state.earned.has(id) ? ' done' : '');
      a.href = '#/trophy/' + id;
      const dot = document.createElement('span');
      dot.className = 'dot ' + t.grade;
      a.append(dot, document.createTextNode((state.earned.has(id) ? '✓ ' : '') + t.name + (t.missable ? ' ⚠' : '')));
      chips.append(a);
    }
    card.append(h, p, chips);
    wrap.append(card);
  }
}

function renderMissable() {
  const grid = $('missableGrid');
  grid.replaceChildren();
  for (const t of state.trophies.filter((x) => x.missable)) {
    const card = document.createElement('article');
    card.className = 'misscard';
    const h = document.createElement('h3');
    h.textContent = t.name;
    const d = document.createElement('p');
    d.className = 'desc';
    d.textContent = t.description;
    const warn = document.createElement('p');
    warn.className = 'warn';
    warn.textContent = 'MISSABLE — do this when its story moment comes. Make a manual save first.';
    const g = document.createElement('p');
    g.textContent = t.guide;
    const link = document.createElement('p');
    const a = document.createElement('a');
    a.href = '#/trophy/' + t.id;
    a.textContent = 'Open the full guide →';
    link.append(a);
    const box = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = state.earned.has(t.id);
    cb.addEventListener('change', () => {
      if (cb.checked) state.earned.add(t.id);
      else state.earned.delete(t.id);
      saveStoredProgress();
      renderAll();
    });
    box.append(cb, document.createTextNode(' Earned'));
    card.append(h, d, warn, g, link, box);
    grid.append(card);
  }
}

function sourceLink(key) {
  const s = state.sources[key];
  if (!s) return null;
  const a = document.createElement('a');
  a.href = s.url;
  a.textContent = s.name;
  a.rel = 'noopener';
  return a;
}

function renderDetail(id) {
  const card = $('detailCard');
  card.replaceChildren();
  const t = trophyById(id);
  if (!t) {
    const p = document.createElement('p');
    p.textContent = 'No trophy with that number. Back to the checklist to pick one.';
    card.append(p);
    return;
  }
  const h = document.createElement('h2');
  h.textContent = isHidden(t) ? '??? — Hidden story trophy' : t.name;
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = isHidden(t) ? 'Earn this trophy to reveal its name and description.' : t.description;
  const tags = document.createElement('div');
  tags.className = 'tags';
  tags.append(gradeBadge(t), kindTag(t));
  if (t.missable) tags.append(missableTag());
  const ct = countTag(t);
  if (ct) tags.append(ct);
  card.append(h, desc, tags);
  if (t.missable) {
    const warn = document.createElement('p');
    warn.className = 'warn';
    warn.textContent = 'MISSABLE — do this when its story moment comes. Make a manual save first.';
    card.append(warn);
  }
  if (isHidden(t)) {
    const p = document.createElement('p');
    p.className = 'guide';
    p.textContent = 'This is a story trophy and the spoiler setting is on. Earn it in the game and tick it off here to reveal its guide.';
    card.append(p);
  } else {
    const gh = document.createElement('h4');
    gh.textContent = 'Guide';
    const g = document.createElement('p');
    g.className = 'guide';
    g.textContent = t.guide;
    const sh = document.createElement('h4');
    sh.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const key of t.sources || []) {
      const li = document.createElement('li');
      const link = sourceLink(key);
      if (link) li.append(link);
      else li.textContent = key;
      ul.append(li);
    }
    const note = document.createElement('li');
    note.textContent = state.sourceNote || 'Guide steps are this guide\u2019s own reading of the official description; where the description does not pin down a place or a trigger, the guide says so instead of inventing one.';
    ul.append(note);
    card.append(gh, g, sh, ul);
  }
  const toggle = document.createElement('p');
  const label = document.createElement('label');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = state.earned.has(t.id);
  cb.addEventListener('change', () => {
    if (cb.checked) state.earned.add(t.id);
    else state.earned.delete(t.id);
    saveStoredProgress();
    renderAll();
  });
  label.append(cb, document.createTextNode(' Earned'));
  toggle.append(label);
  card.append(toggle);
}

function showView(name) {
  for (const v of ['checklist', 'roadmap', 'missable', 'detail', 'sources']) {
    $('view-' + v).hidden = v !== name;
  }
  for (const v of ['checklist', 'roadmap', 'missable', 'sources']) {
    const tab = $('tab-' + v);
    if (tab) tab.classList.toggle('active', v === name || (name === 'detail' && v === 'checklist'));
  }
}

function route() {
  const hash = location.hash || '#/checklist';
  const parts = hash.replace(/^#\//, '').split('/');
  if (parts[0] === 'roadmap') {
    renderRoadmap();
    showView('roadmap');
  } else if (parts[0] === 'missable') {
    renderMissable();
    showView('missable');
  } else if (parts[0] === 'sources') {
    showView('sources');
  } else if (parts[0] === 'trophy' && parts[1]) {
    renderDetail(Number(parts[1]));
    showView('detail');
  } else {
    renderChecklist();
    showView('checklist');
  }
  window.scrollTo(0, 0);
}

function renderAll() {
  updateProgress();
  route();
}

function exportProgress() {
  const data = { game: 'Grand Theft Auto VI', guide: 'Leonida Platinum', exportedAt: new Date().toISOString(), earned: [...state.earned].sort((a, b) => a - b) };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('not a progress file');
    const valid = ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
    state.earned = new Set(valid);
    saveStoredProgress();
    renderAll();
  } catch {
    alert('That file is not a Leonida Platinum progress export.');
  }
}

async function boot() {
  loadStoredProgress();
  const res = await fetch(DATA_URL);
  const doc = await res.json();
  state.trophies = doc.trophies || [];
  state.sources = doc.sources || {};
  state.sourceNote = (doc.sources && doc.sources.note) || '';
  $('spoilerToggle').checked = state.spoiler;
  $('search').addEventListener('input', (e) => { state.search = e.target.value; renderChecklist(); });
  $('kindFilter').addEventListener('change', (e) => { state.kind = e.target.value; renderChecklist(); });
  $('gradeFilter').addEventListener('change', (e) => { state.grade = e.target.value; renderChecklist(); });
  $('earnedFilter').addEventListener('change', (e) => { state.earnedFilter = e.target.value; renderChecklist(); });
  $('spoilerToggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveStoredProgress();
    renderAll();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  window.addEventListener('hashchange', route);
  renderAll();
  window.__leonidaReady = true;
}

boot();
