export async function fileToDownscaledDataUrl(
  file: File,
  maxDim = 1000,
  quality = 0.86,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export async function dataUrlToDownscaled(dataUrl: string, maxDim = 1000): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return fileToDownscaledDataUrl(new File([blob], "portrait.png", { type: blob.type }), maxDim);
}

/**
 * The badge portrait frame is a fixed 372x452 arch. Feeding it an arbitrary
 * photo means the browser crops wherever it likes, so we pre-crop the image
 * ourselves: same aspect ratio, centred horizontally and biased towards the top
 * third so heads stay in frame, rendered at 2x for a crisp print-quality badge.
 */
const FRAME_RATIO = 372 / 452;

export async function fileToPortraitDataUrl(
  file: Blob,
  outW = 744,
  quality = 0.92,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const outH = Math.round(outW / FRAME_RATIO);

  // Largest FRAME_RATIO rectangle that fits inside the source image.
  let sw = bitmap.width;
  let sh = Math.round(sw / FRAME_RATIO);
  if (sh > bitmap.height) {
    sh = bitmap.height;
    sw = Math.round(sh * FRAME_RATIO);
  }
  const sx = Math.round((bitmap.width - sw) / 2);
  // Bias upwards: keep the face/head rather than centring on the torso.
  const sy = Math.round((bitmap.height - sh) * 0.25);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export async function dataUrlToPortrait(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl);
  return fileToPortraitDataUrl(await res.blob());
}
