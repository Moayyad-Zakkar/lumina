// Browser-only image preparation (canvas). Phone photos are 3-12 MB; the timeline needs
// a ~1600px version for viewing and a ~420px thumbnail for the grid. No dependencies.

const FULL = { maxSide: 1600, quality: 0.82 };
const THUMB = { maxSide: 420, quality: 0.7 };

async function decode(file) {
  // 'from-image' applies the EXIF rotation, so portrait phone photos aren't sideways.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // fall through to <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toJpeg(source, { maxSide, quality }) {
  const w = source.naturalWidth || source.width;
  const h = source.naturalHeight || source.height;
  if (!w || !h) throw new Error('Unreadable image');

  const scale = Math.min(1, maxSide / Math.max(w, h)); // never upscale
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // transparent PNGs would otherwise turn black in a JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image'))),
      'image/jpeg',
      quality,
    );
  });
}

// -> { full: Blob, thumb: Blob }  (both image/jpeg)
export async function prepareImage(file) {
  const source = await decode(file);
  try {
    const [full, thumb] = await Promise.all([toJpeg(source, FULL), toJpeg(source, THUMB)]);
    return { full, thumb };
  } finally {
    if (typeof source.close === 'function') source.close();
  }
}