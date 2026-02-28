const BG_TEXT_MAX_CHARS = 7;
const BG_WATERMARK_SQUEEZE_X = 0.55;

export function normalizeBgText(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").replace(/[^0-9A-Za-z &+\-_]/g, "").trim();
}

function bgTextFromHostname(url) {
  if (!url) return "";
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return normalizeBgText(host.split(".")[0] || host);
  } catch {
    return normalizeBgText(String(url).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0].split(".")[0]);
  }
}

export function getCardBgText(link) {
  const explicit = normalizeBgText(link?.["bg-text"]);
  if (explicit) return explicit.toUpperCase().slice(0, BG_TEXT_MAX_CHARS);

  const title = normalizeBgText(link?.title || "");
  if (title) return title.toUpperCase().slice(0, BG_TEXT_MAX_CHARS);

  const host = bgTextFromHostname(link?.url || "");
  return host.toUpperCase().slice(0, BG_TEXT_MAX_CHARS);
}

export function createCardBgSvg(text) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.classList.add("card-bg-svg");
  svg.setAttribute("viewBox", "0 0 200 100");
  svg.setAttribute("preserveAspectRatio", "none");

  const t = document.createElementNS(ns, "text");
  t.classList.add("card-bg-text");
  const padX = 12;
  const padY = 12;
  const y = 100 - padY;
  const safeText = String(text || "").slice(0, BG_TEXT_MAX_CHARS);
  const usableWidth = 200 - padX * 2;
  const slot = usableWidth / BG_TEXT_MAX_CHARS;
  const usableHeight = 200 - padY * 2;
  const maxByWidth = (slot / BG_WATERMARK_SQUEEZE_X) * 0.98;

  t.setAttribute("y", String(y));
  t.setAttribute("text-anchor", "start");
  t.setAttribute("dominant-baseline", "text-after-edge");
  t.setAttribute("font-size", String(Math.floor(Math.min(usableHeight, maxByWidth))));

  for (let i = 0; i < safeText.length; i += 1) {
    const span = document.createElementNS(ns, "tspan");
    span.setAttribute("x", String(padX + i * slot));
    span.textContent = safeText[i];
    t.appendChild(span);
  }

  svg.appendChild(t);
  return svg;
}
