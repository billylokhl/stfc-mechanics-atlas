// /mechanic — Discord slash command for the STFC Mechanics Atlas.
// Runs on Cloudflare Workers as an HTTP interactions endpoint: Discord POSTs
// interactions here; no gateway connection, no server to keep alive.
//
//   /mechanic query:<text>  → autocomplete dropdown of matching topics
//   pick one                → public topic card with an "Open in Atlas" button
//   free text, no pick      → ephemeral select menu of all matches

import {searchTopics} from './search.mjs';

const TOPICS_URL = 'https://billylokhl.github.io/stfc-mechanics-atlas/data/topics.json';

// interaction types / response types from the Discord API
const PING = 1, COMMAND = 2, COMPONENT = 3, AUTOCOMPLETE = 4;
const R_PONG = 1, R_MESSAGE = 4, R_AUTOCOMPLETE = 8;
const EPHEMERAL = 64;

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('ok');
    const body = await request.text();
    if (!(await verifySignature(request, body, env.DISCORD_PUBLIC_KEY))) {
      return new Response('bad signature', {status: 401});
    }
    const ix = JSON.parse(body);
    if (ix.type === PING) return json({type: R_PONG});

    const topics = await loadTopics();

    if (ix.type === AUTOCOMPLETE) {
      const q = optionValue(ix) ?? '';
      const choices = searchTopics(topics, q).slice(0, 25).map(t => ({
        name: trim(`${t.name} — ${t.system}`, 100),
        value: t.slug,
      }));
      return json({type: R_AUTOCOMPLETE, data: {choices}});
    }

    if (ix.type === COMMAND) {
      const q = optionValue(ix) ?? '';
      const exact = topics.find(t => t.slug === q);
      if (exact) return json(topicCard(exact));
      const hits = searchTopics(topics, q);
      if (hits.length === 1) return json(topicCard(hits[0]));
      if (hits.length === 0) {
        return json({type: R_MESSAGE, data: {
          flags: EPHEMERAL,
          content: `No mechanic matches **${q}**. Try a keyword like \`armada\`, \`crit\`, or \`warp\`.`,
        }});
      }
      return json({type: R_MESSAGE, data: {
        flags: EPHEMERAL,
        content: `**${hits.length} mechanics** match \`${q}\` — pick one to post:`,
        components: [{type: 1, components: [{
          type: 3, // string select
          custom_id: 'topic-select',
          placeholder: 'Choose a mechanic…',
          options: hits.slice(0, 25).map(t => ({
            label: trim(t.name, 100),
            value: t.slug,
            description: trim(t.system, 100),
          })),
        }]}],
      }});
    }

    if (ix.type === COMPONENT && ix.data?.custom_id === 'topic-select') {
      const t = topics.find(x => x.slug === ix.data.values?.[0]);
      if (t) return json(topicCard(t));
    }

    return json({type: R_MESSAGE, data: {flags: EPHEMERAL, content: 'Unsupported interaction.'}});
  },
};

function topicCard(t) {
  return {type: R_MESSAGE, data: {
    embeds: [{
      title: t.name,
      url: t.url,
      description: t.tldr,
      color: parseInt(t.color.slice(1), 16),
      footer: {text: `${t.system} · STFC Mechanics Atlas`},
      fields: t.related.length ? [{
        name: 'Warp lanes',
        value: t.related.map(r => r.name).join(' · '),
      }] : [],
    }],
    components: [{type: 1, components: [
      {type: 2, style: 5, label: 'Open in Atlas', url: t.url},
    ]}],
  }};
}

function optionValue(ix) {
  return ix.data?.options?.find(o => o.name === 'query')?.value;
}

async function loadTopics() {
  const res = await fetch(TOPICS_URL, {cf: {cacheTtl: 300, cacheEverything: true}});
  if (!res.ok) throw new Error(`topics.json fetch failed: ${res.status}`);
  return (await res.json()).topics;
}

async function verifySignature(request, body, publicKeyHex) {
  const sig = request.headers.get('x-signature-ed25519');
  const ts = request.headers.get('x-signature-timestamp');
  if (!sig || !ts || !publicKeyHex) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw', fromHex(publicKeyHex), {name: 'Ed25519'}, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', key, fromHex(sig),
      new TextEncoder().encode(ts + body));
  } catch {
    return false;
  }
}

const fromHex = h => new Uint8Array((h.match(/../g) || []).map(b => parseInt(b, 16)));
const trim = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const json = o => new Response(JSON.stringify(o), {headers: {'content-type': 'application/json'}});
