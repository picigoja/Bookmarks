import { createCardBgSvg, getCardBgText } from "./watermark.js";

export function renderCards({ linkGrid, cardTemplate, links }) {
  linkGrid.innerHTML = "";
  if (!links.length) {
    const empty = document.createElement("div");
    empty.className = "card-grid-empty";
    empty.textContent = "No links found matching your criteria.";
    linkGrid.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  links.forEach((link) => {
    const clone = cardTemplate.content.cloneNode(true);
    const card = clone.querySelector(".card");
    const titleEl = clone.querySelector(".card-title");
    const bodyEl = clone.querySelector(".card-body");

    const href = link.url || "#";
    const isExternal = /^https?:\/\//i.test(href);
    const anchor = document.createElement("a");
    anchor.className = "card-link";
    anchor.href = href;
    anchor.textContent = link.title || link.url || "Untitled";

    if (isExternal) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }

    if (titleEl) {
      titleEl.innerHTML = "";
      titleEl.appendChild(anchor);
    }
    if (bodyEl) bodyEl.textContent = link.url || "";

    if (card) {
      const bgText = getCardBgText(link);
      if (bgText) card.prepend(createCardBgSvg(bgText));
    }

    fragment.appendChild(clone);
  });

  linkGrid.appendChild(fragment);
}
