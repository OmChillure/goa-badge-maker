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
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export async function dataUrlToDownscaled(dataUrl: string, maxDim = 1000): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return fileToDownscaledDataUrl(new File([blob], "portrait.png", { type: blob.type }), maxDim);
}
