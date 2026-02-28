export function get(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function getEnum(key, allowed, fallback) {
  const value = get(key, fallback);
  return allowed.includes(value) ? value : fallback;
}

export function getJSON(key, fallback = null) {
  const raw = get(key, null);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setJSON(key, value) {
  return set(key, JSON.stringify(value));
}
