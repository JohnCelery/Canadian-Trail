// systems/jsonLoader.js
// Tiny helper so JSON loads work everywhere (Replit preview, GitHub Pages, Safari, etc.)
export async function loadJSON(path, base = import.meta.url) {
  const url = new URL(path, base);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load JSON: ${url} (${res.status})`);
  }
  return await res.json();
}

// Optional: simple on-screen error (so preview shows something helpful)
export function showInitError(err) {
  console.error(err);
  const div = document.createElement('div');
  div.style.cssText =
    "position:fixed;inset:8px;z-index:9999;padding:12px;background:#2b2b2bcc;color:#fff;font:14px/1.4 system-ui;border:1px solid #000;border-radius:6px";
  div.textContent = `Init failed: ${err.message}`;
  document.body.appendChild(div);
}
