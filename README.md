# Leonida Trophy Guide

[![GTA 6 Trophy Guide bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Entry rank](https://make.fun/badge/gta6-trophy-guide-01/labibhanafi/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Entry reward](https://make.fun/badge/gta6-trophy-guide-01/labibhanafi/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline web guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. It lists every trophy with its official name, description and grade, gives each one a guide in plain words with its source, lays out a roadmap to the platinum, flags the two missable trophies, and tracks progress in the browser with export and import.

## What is inside

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself: checklist, roadmap, missable and per-trophy guide views. No build step, no network requests; it runs from its own files.
- `app/data/trophies.json` — the official 55 trophies (names, descriptions and grades as PlayStation publishes them, as listed by Exophase and PSNProfiles) plus a guide, a kind, a roadmap stage and a missable flag for each.
- `screenshots/` — four real renders of the app in a browser: the checklist, the roadmap, the missable list and one trophy guide.
- `main.ts` — hands the guide in: it copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.

## Run it locally

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That writes `out/app/`, `out/screenshots/` and `out/dossier.json`. Then serve the app from any static server with `out/app/` at its root and open `index.html`, for example:

```sh
python3 -m http.server 8080 --directory out/app
```

Node 22.18 or later is required. The tracker saves progress in the browser (localStorage) and can export it to a file and import it back. The spoiler setting hides the names and descriptions of story trophies until they are earned.

## Sources

The trophy names, descriptions and grades are the official list, as listed by Exophase and PSNProfiles. Every guide cites its source beside it. This is an unofficial fan guide, not affiliated with Rockstar Games, and it uses no Rockstar artwork or logos.

## License

MIT — see `LICENSE`.

---

Optional: earn referral rewards, a second way to make money — https://make.fun/r/3t7y0djc
