export async function loadJSON(path, base = import.meta.url) {
  const url = new URL(path, base);
  if (url.protocol === 'file:') {
    const fs = await import('fs/promises');
    const text = await fs.readFile(url, 'utf-8');
    return JSON.parse(text);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load JSON: ${url} (${res.status})`);
  return await res.json();
}
