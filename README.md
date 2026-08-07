# STFC Mechanics Atlas — Concept Demo

A proof-of-concept for organizing Star Trek Fleet Command game-mechanics
knowledge as a navigable **galaxy map** instead of Discord channels.

Every mechanic is a star. Related mechanics are joined by warp lanes —
amber dashed lanes cross between systems (e.g. Mitigation ↔ Apex Barrier).
Clicking a star opens a layered "dossier": TL;DR → How it works → The math,
with related-topic chips to hop along the graph.

**Live demo:** https://billylokhl.github.io/stfc-mechanics-atlas/

## What to try

- **Hover** a star to light up its warp lanes
- **Click** a star to open its dossier
- Open **Mitigation & Penetration → The Math** and drag the piercing slider
  (the "explorable explanation" idea)
- **Search** for a mechanic and press Enter to jump to it
- Use the **Systems** legend to fly to a cluster; scroll to zoom, drag to pan

## Discord integration

- **Deep links** — every topic has a URL. Share
  `…/t/<slug>/` (e.g. [`t/mitigation-and-penetration/`](https://billylokhl.github.io/stfc-mechanics-atlas/t/mitigation-and-penetration/))
  in Discord and it unfurls as a rich card with the topic's TL;DR and system
  color, then opens the atlas flown to that star. The 🔗 button in any dossier
  copies the right link.
- **`data/topics.json`** — machine-readable topic list (name, system, color,
  TL;DR, links, related topics) for bots and webhooks.
- **`/mechanic` search bot** — [`bot/`](bot/) contains a ready-to-deploy
  Cloudflare Worker: type `/mechanic armada` in Discord and pick from a live
  dropdown of matching topics; the bot posts the topic card with an
  "Open in Atlas" button. Setup steps in [bot/README.md](bot/README.md).
- **Mechanic of the Week** — `.github/workflows/mechanic-of-the-week.yml`
  posts one topic every Monday to a Discord channel. To enable it, add a
  repo secret `DISCORD_WEBHOOK_URL` (channel settings → Integrations →
  Webhooks). It skips silently until the secret exists; test with the
  "Run workflow" button in the Actions tab.

### Rebuilding after content edits

Topic data lives in `index.html`. After editing it, regenerate the stub
pages, `topics.json`, and (if branding changed) the embed card:

```bash
node scripts/build_discord.mjs
python3 scripts/make_og_card.py
```

## Caveats

- All topic copy is **illustrative sample text**, not verified game math
- Single self-contained HTML file — no frameworks, no build step
- Inspired by [Map of GitHub](https://anvaka.org/map-of-github/),
  the [ARK Starmap](https://starcitizen.tools/Starmap), and
  [KQM's Theorycrafting Library](https://library.keqingmains.com/) layered-content model
