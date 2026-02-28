export function createState(allLinks) {
  return {
    allLinks: [...allLinks],
    activeGroup: null,
    searchQuery: "",
  };
}

export function groupCounts(links) {
  const counts = {};
  links.forEach((link) => {
    (link.groups || []).forEach((group) => {
      counts[group] = (counts[group] || 0) + 1;
    });
  });
  return counts;
}
