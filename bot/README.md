# /mechanic — Discord search bot for the Mechanics Atlas

Type `/mechanic armada` in Discord → a live dropdown of every matching topic →
pick one → the bot posts the topic card (TL;DR, system color, warp lanes, and
an **Open in Atlas** button) to the channel.

It's a Cloudflare Worker (free tier is plenty) speaking Discord's HTTP
interactions protocol — serverless, nothing to keep running. Topic data comes
from the atlas's published [`topics.json`](https://billylokhl.github.io/stfc-mechanics-atlas/data/topics.json),
so editing the atlas automatically updates the bot (within its 5-minute cache).

## Setup (~15 minutes, one time)

1. **Create the Discord app** at <https://discord.com/developers/applications>
   → *New Application* (name it e.g. "Mechanics Atlas").
   From **General Information**, note the **Application ID** and **Public Key**.
   From **Bot**, note the **Token** (used once, in step 4).

2. **Deploy the worker** (needs a free Cloudflare account):

   ```bash
   cd bot
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put DISCORD_PUBLIC_KEY   # paste the Public Key
   ```

   Note the deployed URL, e.g. `https://stfc-mechanic-bot.<you>.workers.dev`.

3. **Point Discord at it**: App settings → General Information →
   **Interactions Endpoint URL** → paste the worker URL and save.
   (Discord validates the endpoint with a signed ping; the save only
   succeeds if the worker and public key are correct.)

4. **Register the command** (from this directory, on your machine):

   ```bash
   DISCORD_APP_ID=<application id> DISCORD_TOKEN=<bot token> node scripts/register-commands.mjs
   ```

5. **Invite it to your server**: App settings → OAuth2 → URL Generator →
   check the `applications.commands` scope → open the generated URL and
   pick your server. `/mechanic` appears immediately.

## How the search behaves

- **Autocomplete** (as you type): matches topic name, slug, system, and TL;DR
  text; multi-word queries must match every word. Top 25 shown.
- **Picked from the dropdown** → public topic card.
- **Free text with one match** → public topic card.
- **Free text with several matches** → private select menu ("7 mechanics match
  `armada` — pick one to post"); the pick posts publicly.
- **No match** → private hint, nothing posted to the channel.

## Maintenance

None in steady state. If you change the command definition, re-run step 4.
If you change topic content in the atlas, run the repo's
`node scripts/build_discord.mjs` and push — the bot follows `topics.json`.
