// src/lib/translateClient.js

// Lightweight in-memory cache to avoid duplicate requests during a session.
// Keyed by src|tgt|texts
const memCache = new Map();

// Helper to combine timeout with an optional external AbortSignal
function withTimeout(signal, ms = 10000) {
  // Prefer modern AbortSignal.timeout if available
  if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
    return signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);
  }
  // Fallback: manual controller with setTimeout
  const ctrl = new AbortController();
  const handler = setTimeout(() => ctrl.abort(new Error("TimeoutError")), ms);
  if (signal) {
    // Abort when either external signal or timeout fires
    signal.addEventListener("abort", () => ctrl.abort(signal.reason), { once: true });
  }
  // Clean up once aborted/resolved is handled by fetch consumer
  return ctrl.signal;
}

function cacheKey(src, tgt, texts) {
  // Use a delimiter unlikely to appear in labels
  return `${src}|${tgt}|${texts.join("\u0001")}`;
}

// Translate an array of texts from src -> tgt; returns array of translated strings in the same order
export async function translateBatch({ src = "en", tgt, texts = [], signal }) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  // In-memory cache lookup
  const key = cacheKey(src, tgt, texts);
  if (memCache.has(key)) {
    return memCache.get(key).slice(); // return a copy
  }

  // Send request to your backend proxy
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Combine caller signal with a timeout to prevent hanging
    signal: withTimeout(signal, 10000),
    body: JSON.stringify({ src, tgt, texts }),
  });

  // fetch resolves on HTTP errors; explicitly guard with res.ok
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Translate failed: ${res.status} ${res.statusText} ${txt}`);
  }

  const data = await res.json();
  const translations = data?.translations;
  if (!Array.isArray(translations)) {
    throw new Error("Translate response missing translations array");
  }

  // Cache successful result in-memory for this session
  memCache.set(key, translations.slice());
  return translations.map((t) => t || "");
}
