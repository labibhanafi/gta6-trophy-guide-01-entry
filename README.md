# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/labibhanafi/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/labibhanafi/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze — built for the [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) bounty on [make.fun](https://make.fun/r/3t7y0djc).

## What it does

- **Checklist tracker** — tick trophies off as you earn them; progress saves in the browser (localStorage) and can be exported to a JSON file and imported back.
- **Filters** — by kind (story, missable, collectibles, activities, platinum), by grade, by earned/not-earned, plus full-text search.
- **Spoiler setting** — hide the names and descriptions of story trophies until you have earned them.
- **Roadmap to platinum** — four stages in the order to earn them, built from the official descriptions: story, character finales and stranger strands, activities and skills, then collectibles and clean-up.
- **Missables flagged** — the only 2 missable trophies (`Catch Me If You Can`, `Capital Offense`) are called out everywhere, with a manual-save warning.
- **A guide for every trophy** — written for this guide, in its own words, with its sources named beside it. Where the official description does not pin down a place or a trigger, the guide says so plainly instead of inventing one.

## Sources

Every name, description and grade is the official list as published on [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi) on 2026-11-18; the counts (250 stunts, 42 Shooting Range challenges, 14 drone-race locations, and the rest) are PSN's progress counts from PSNProfiles. No other guide's text is copied.

## Run it

The app is static files under `app/` with no build step — serve it with any static server and open `index.html`:

```sh
python3 -m http.server 8080 --directory app
```

It works with the network off: it loads only its own files and makes no network request at run time.

## Hand it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
