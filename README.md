[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/labibhanafi/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/labibhanafi/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Legend — GTA 6 Trophy Guide & Tracker

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver and 46 bronze. Every trophy is shown with its official name, description and grade, plus a guide written in our own words that cites its sources.

## What it does

- **Checklist tracker** — tick trophies off as you earn them; progress is saved in the browser (localStorage) and can be exported to a JSON file and imported back.
- **Filters** — by kind: story, missable, collectibles, activities and online — plus live search by name.
- **Spoiler-safe mode** — hides the names and descriptions of story trophies until you earn them.
- **Roadmap to the platinum** — four stages in order: story first, then activities and side content, then collectibles and the map, then 100% completion.
- **Missable flags** — 13 trophies that need a specific moment, partner or set-up are flagged and listed up front, so you can do them in time.
- **Cited guides** — each guide names its sources: Exophase for the official list (names, descriptions, grades) and PSNProfiles for PSN's progress counts (250 stunts, 42 Shooting Range challenges, 14 drone-race locations, and the rest). Where a place is not pinned down by the official description, the guide says so instead of inventing one.

## Run it

The app is plain static files under `app/` — no build step, no network requests at run time. Serve `app/` with any static server and open `index.html`:

```sh
cd app && python3 -m http.server 8080
```

Then open <http://localhost:8080> in desktop Chrome. It works with the network off.

## Hand it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Note: the program never removes the output directory itself — on the grader it is a mounted volume — it empties the directory's contents child by child instead, so a dirty output directory is cleaned safely.

## Files

- `app/index.html` — the page: header with progress, roadmap, missable list, checklist, sources.
- `app/style.css` — the dark "night" look, coral accent.
- `app/app.js` — tracker logic: rendering, filters, search, spoiler mode, localStorage save, export/import.
- `app/data/trophies.json` — the 55 official trophies with guides, kinds, missable flags and roadmap stages.
- `screenshots/` — 4 screenshots of the running guide.
- `vendor/makefun-frontend.ts` — make.fun's dossier library, unchanged from the kit.
- `main.ts` — the entry program.

## Sources

- Official trophy list (names, descriptions, grades): Exophase — exophase.com/game/grand-theft-auto-vi-psn/trophies
- PSN progress counts: PSNProfiles — psnprofiles.com/trophies/43531-grand-theft-auto-vi

Unofficial fan guide. Not affiliated with Rockstar Games, Take-Two Interactive or PlayStation. No official artwork or logos are used. Licensed under the MIT License — see `LICENSE`.

<sub>Entered on [make.fun](https://make.fun/?ref=3t7y0djc&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
