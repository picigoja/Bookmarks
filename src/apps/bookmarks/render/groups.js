import { groupCounts } from "../state.js";

export function renderGroups({
  nav,
  template,
  links,
  activeGroup,
}) {
  const activeGlider = nav.querySelector("#groupNavGlider");
  const hoverGlider = nav.querySelector("#groupNavGliderHover");
  nav.replaceChildren(...[activeGlider, hoverGlider].filter(Boolean));

  const counts = groupCounts(links);

  const makeBtn = (label, count, groupKey) => {
    const frag = template.content.cloneNode(true);
    const button = frag.querySelector(".nav-option");
    const labelSpan = button.querySelector(".group-lbl");
    labelSpan.textContent = `${label} (${count})`;
    button.dataset.group = groupKey || "";
    const isActive = (activeGroup === null && !groupKey) || (activeGroup !== null && String(activeGroup) === String(groupKey));
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    return frag;
  };

  nav.appendChild(makeBtn("All", links.length, null));
  Object.keys(counts).sort((a, b) => a.localeCompare(b)).forEach((group) => {
    nav.appendChild(makeBtn(group, counts[group], group));
  });
}

export function setActiveNavButton(nav, activeGroup) {
  nav.querySelectorAll(".nav-option").forEach((button) => {
    const group = button.dataset.group || null;
    const isActive = (activeGroup === null && (group === null || group === ""))
      || (activeGroup !== null && String(group) === String(activeGroup));
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}
