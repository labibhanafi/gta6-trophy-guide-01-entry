# gta6-trophy-guide-01-entry

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/labibhanafi/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/labibhanafi/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** — an offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies: the official names, descriptions and grades, a checklist saved in your browser, export and import, filters by grade, kind and status, a spoiler setting that hides story trophies until earned, a five-step roadmap to the platinum, missable flags, and a guide to each trophy in our own words that cites its sources.

## Run it

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080 in a desktop browser. No network needed — every file the guide loads lives under `app/`, and your checklist is stored only in your browser's localStorage.

To build the entry the way the grader does:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` there with the kit's `vendor/makefun-frontend.ts` library.

## What's inside

- `app/index.html` — the guide page: progress bar, roadmap, filters and trophy cards
- `app/app.js` — checklist, localStorage save, export/import, filters and the spoiler rule
- `app/style.css` — the dark sunset theme
- `app/data/trophies.json` — all 55 official trophies with their grade, kind, missable flag, target count, roadmap stage and a cited guide each
- `screenshots/` — four renders of the guide running
- `main.ts` — the entrypoint: copies the app and screenshots, writes the dossier

## Sources

Trophy names, descriptions and grades are the official PlayStation list, as listed by Exophase and PSNProfiles. Guide text is written in our own words from those official descriptions; the game has just launched, so the steps are our own advice from the official list, not yet verified in play. This is an unofficial fan guide, not affiliated with Rockstar Games or PlayStation, and it uses no Rockstar logo or official artwork.

---

<sub>Entered on [make.fun](https://make.fun/?ref=3t7y0djc&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
