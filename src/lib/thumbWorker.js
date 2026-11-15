// 一覧用の縮小画像をメインスレッドの外で作る（作っている間も画面の操作が止まらないように）
self.onmessage = async (e) => {
  const { id, blob, max } = e.data;
  try {
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale > 0.8) { bmp.close?.(); self.postMessage({ id, same: true }); return; }
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const out = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.82 });
    self.postMessage({ id, blob: out });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
