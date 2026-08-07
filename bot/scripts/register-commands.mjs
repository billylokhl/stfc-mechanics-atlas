#!/usr/bin/env node
// One-time (and after any command change) registration of the /mechanic
// command with Discord. Run locally:
//
//   DISCORD_APP_ID=<application id> DISCORD_TOKEN=<bot token> \
//     node scripts/register-commands.mjs
//
// The token is only used here, from your machine — the worker never needs it.

const appId = process.env.DISCORD_APP_ID;
const token = process.env.DISCORD_TOKEN;
if (!appId || !token) {
  console.error('Set DISCORD_APP_ID and DISCORD_TOKEN environment variables.');
  process.exit(1);
}

const commands = [{
  name: 'mechanic',
  description: 'Look up a game mechanic in the STFC Mechanics Atlas',
  options: [{
    type: 3, // string
    name: 'query',
    description: 'Mechanic name or keyword — e.g. armada, crit, mitigation',
    required: true,
    autocomplete: true,
  }],
}];

const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bot ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error(`Registration failed: ${res.status}`, await res.text());
  process.exit(1);
}
console.log('Registered commands:', (await res.json()).map(c => '/' + c.name).join(', '));
