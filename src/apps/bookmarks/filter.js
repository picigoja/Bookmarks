export function scopeByGroup(links, activeGroup) {
  if (!activeGroup) return links;
  return links.filter((link) => (link.groups || []).some((group) => String(group) === String(activeGroup)));
}

export function searchLinks(links, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return links;
  return links.filter((link) => {
    const title = String(link.title || "").toLowerCase();
    const url = String(link.url || "").toLowerCase();
    return title.includes(q) || url.includes(q);
  });
}
