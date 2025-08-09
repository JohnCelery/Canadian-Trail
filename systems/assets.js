export const AssetRegistry = { images: {} };

export async function loadAssets(manifestPath = 'data/manifest.json') {
  let manifest;
  try {
    const res = await fetch(manifestPath);
    manifest = await res.json();
  } catch (err) {
    console.error('Failed to load manifest', err);
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  for (const [category, entries] of Object.entries(manifest)) {
    AssetRegistry.images[category] = {};
    for (const [key, meta] of Object.entries(entries)) {
      const copy = { ...meta };
      const src = dpr >= 2 && meta.src2x ? meta.src2x : meta.src;
      try {
        const img = await loadImage(src, copy);
        AssetRegistry.images[category][key] = { img, meta: copy, placeholder: false };
      } catch (e) {
        const placeholder = generatePlaceholder(copy, `${category}.${key}`);
        AssetRegistry.images[category][key] = { img: placeholder, meta: copy, placeholder: true };
      }
    }
  }
}

function loadImage(src, meta) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      img.width = meta.w || meta.frameWidth || img.naturalWidth;
      img.height = meta.h || meta.frameHeight || img.naturalHeight;
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function generatePlaceholder(meta, label) {
  const w = meta.w || meta.frameWidth || 64;
  const h = meta.h || meta.frameHeight || 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const size = 8;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#bbb' : '#ddd';
      ctx.fillRect(x, y, size, size);
    }
  }
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = Math.floor(h / 4) + 'px sans-serif';
  ctx.fillText(label.split('.').pop(), w / 2, h / 2);
  return canvas;
}

export function getImage(path) {
  const [category, key] = path.split('.');
  const asset = AssetRegistry.images[category]?.[key];
  if (!asset) return null;
  if (asset.img instanceof HTMLCanvasElement) {
    const c = document.createElement('canvas');
    c.width = asset.img.width;
    c.height = asset.img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(asset.img, 0, 0);
    return c;
  }
  return asset.img.cloneNode(true);
}

export function getMeta(path) {
  const [category, key] = path.split('.');
  const asset = AssetRegistry.images[category]?.[key];
  if (!asset) return null;
  return { ...asset.meta, placeholder: asset.placeholder };
}
