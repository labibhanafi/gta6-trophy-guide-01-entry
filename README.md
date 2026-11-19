# Leonida Legend — GTA 6 Trophy Guide & Tracker

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze — built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/c/gta6-trophy-guide-01).

## What it is

- **Tracker**: a checklist of every trophy with its official name, description and grade. Tick trophies as you earn them; progress is saved in the browser (localStorage) and can be exported to a JSON file and imported back.
- **Filters**: story, missable, collectibles, activities, combat, exploration and online, plus search and an unearned-only view.
- **Spoiler setting**: hides the names and descriptions of story trophies until they are earned.
- **Roadmap to the platinum**: six stages built from the official descriptions — story first, then strangers, collectibles, activities, and heists and money last.
- **Missable flags**: 2 of 55 trophies are flagged missable, both one-shot moments tied to a single place in the official descriptions.
- **Cited guides**: every trophy carries a guide in our own words that names its sources — the official list on Exophase for names, descriptions and grades, and PSNProfiles for PSN's progress counts.

## Offline

The app is plain static files under `app/` with no build step: `app/index.html` opens in desktop Chrome and works with the network off. Every file it loads lives under `app/`; it makes no network request at run time.

## Try it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Or hand it in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Referral

Built with make.fun — try it yourself: https://make.fun/r/3t7y0djc

## License

MIT — see [LICENSE](LICENSE).
