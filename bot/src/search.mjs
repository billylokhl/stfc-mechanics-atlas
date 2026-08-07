// Shared topic search for the /mechanic bot.
// Ranks: name prefix < name substring < slug < system < tldr.
// Multi-word queries require every word to match somewhere.

export function searchTopics(topics, query) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored = [];
  for (const t of topics) {
    const name = t.name.toLowerCase();
    const hay = {name, slug: t.slug, system: t.system.toLowerCase(), tldr: t.tldr.toLowerCase()};
    let total = 0, ok = true;
    for (const w of words) {
      let s = null;
      if (name.startsWith(w)) s = 0;
      else if (name.includes(w)) s = 1;
      else if (hay.slug.includes(w)) s = 2;
      else if (hay.system.includes(w)) s = 3;
      else if (hay.tldr.includes(w)) s = 4;
      if (s === null) { ok = false; break; }
      total += s;
    }
    if (ok) scored.push([total, t]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name));
  return scored.map(([, t]) => t);
}
