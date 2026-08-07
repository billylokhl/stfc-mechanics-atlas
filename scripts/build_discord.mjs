#!/usr/bin/env node
// Extracts topic data from index.html (the single source of truth) and generates:
//   data/topics.json      — machine-readable topic list (for bots / webhooks)
//   t/<slug>/index.html   — per-topic stub pages with Discord/OG embed tags
//     that instantly redirect into the atlas at #<slug>
// Run after editing topic data in index.html:  node scripts/build_discord.mjs

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://billylokhl.github.io/stfc-mechanics-atlas/';

const html = readFileSync(join(root, 'index.html'), 'utf8');
const start = html.indexOf('/* ---------------- data');
const end = html.indexOf('/* ---------------- layout');
if (start < 0 || end < 0) throw new Error('data section markers not found in index.html');
const {CLUSTERS, NODES, LINKS, CONTENT, TLDR} =
  new Function(html.slice(start, end) + '; return {CLUSTERS, NODES, LINKS, CONTENT, TLDR};')();

const slugOf = name => name.toLowerCase().replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const byId = Object.fromEntries(NODES.map(n => [n.id, n]));
const related = id => LINKS
  .filter(([a, b]) => a === id || b === id)
  .map(([a, b]) => byId[a === id ? b : a])
  .filter(Boolean);

const topics = NODES.map(n => {
  const slug = slugOf(n.n);
  return {
    id: n.id,
    slug,
    name: n.n,
    system: CLUSTERS[n.c].name,
    color: CLUSTERS[n.c].color,
    tldr: (CONTENT[n.id]?.tldr || TLDR[n.id] || '').trim(),
    url: `${SITE}t/${slug}/`,
    atlasUrl: `${SITE}#${slug}`,
    related: related(n.id).map(r => ({name: r.n, slug: slugOf(r.n)})),
  };
});

mkdirSync(join(root, 'data'), {recursive: true});
writeFileSync(join(root, 'data', 'topics.json'),
  JSON.stringify({site: SITE, generated_from: 'index.html', topics}, null, 2) + '\n');

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
for (const t of topics) {
  const target = `${SITE}#${t.slug}`;
  const stub = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(t.name)} — STFC Mechanics Atlas</title>
<meta name="description" content="${esc(t.tldr)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="STFC Mechanics Atlas">
<meta property="og:title" content="${esc(t.name)} — ${esc(t.system)}">
<meta property="og:description" content="${esc(t.tldr)}">
<meta property="og:image" content="${SITE}assets/og-card.png">
<meta property="og:url" content="${t.url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${t.color}">
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
</head>
<body>
<p>Opening the atlas… <a href="${target}">tap here if nothing happens</a>.</p>
<script>location.replace(${JSON.stringify(target)})</script>
</body>
</html>
`;
  const dir = join(root, 't', t.slug);
  mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, 'index.html'), stub);
}

console.log(`wrote data/topics.json and ${topics.length} stub pages under t/`);
