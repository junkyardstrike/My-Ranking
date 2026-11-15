import { useSyncExternalStore } from 'react';
import { get, write, STORES } from './db';

// 画像の保存と表示。
// 以前は画像を base64 の文字列のままデータに埋め込んでいたため、データの更新・保存のたびに巨大な文字列を
// 扱っていた。今は画像を Blob として別に保存し、作品データには画像のキー（名前）だけを持たせる。
// 一覧には縮小画像（サムネイル）を表示し、大きな画像を毎回デコードしないようにする。

const THUMB_MAX = 480;

const fullUrls = new Map();   // key -> object URL（元画像）
const thumbUrls = new Map();  // key -> object URL（縮小画像。元画像で十分なら元画像の URL）
const loading = new Set();
const listeners = new Map();  // key -> Set<fn>
let version = 0;

const notify = (key) => { version++; listeners.get(key)?.forEach(fn => fn()); };

const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  const mime = /data:([^;]+)/.exec(header)?.[1] || 'image/jpeg';
  if (!/;base64/.test(header)) return new Blob([decodeURIComponent(body)], { type: mime });
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});

// 画像を保存してキーを返す（保存は裏で行い、表示はすぐできる）
export function saveImage(source) {
  if (!source) return null;
  const blob = typeof source === 'string' ? dataUrlToBlob(source) : source;
  const key = newKey();
  fullUrls.set(key, URL.createObjectURL(blob));
  write([{ store: STORES.images, key, value: blob }]).catch(err => console.error('画像の保存に失敗', err));
  queueThumb(key, blob);
  return key;
}

// 取り込み・移行用：まとめて保存する書き込み操作を返す（表示用 URL は必要になった時に作る）
export function prepareImage(source) {
  if (!source) return null;
  const blob = typeof source === 'string' ? dataUrlToBlob(source) : source;
  const key = newKey();
  return { key, op: { store: STORES.images, key, value: blob }, blob };
}

export function deleteImages(keys) {
  const list = keys.filter(Boolean);
  if (!list.length) return;
  list.forEach(k => {
    [fullUrls, thumbUrls].forEach(m => { const u = m.get(k); if (u) { m.delete(k); if (![...fullUrls.values(), ...thumbUrls.values()].includes(u)) URL.revokeObjectURL(u); } });
  });
  write(list.flatMap(key => [{ store: STORES.images, key }, { store: STORES.thumbs, key }])).catch(() => {});
}

export const getImageBlob = (key) => get(STORES.images, key);

async function loadFull(key) {
  if (fullUrls.has(key) || loading.has(`f:${key}`)) return;
  loading.add(`f:${key}`);
  try {
    const blob = await get(STORES.images, key);
    if (blob) fullUrls.set(key, URL.createObjectURL(blob));
  } finally {
    loading.delete(`f:${key}`);
    notify(key);
  }
}

async function loadThumb(key) {
  if (thumbUrls.has(key) || loading.has(`t:${key}`)) return;
  loading.add(`t:${key}`);
  try {
    const thumb = await get(STORES.thumbs, key);
    if (thumb instanceof Blob) {
      thumbUrls.set(key, URL.createObjectURL(thumb));
    } else {
      // 縮小画像がまだ無い（または不要）→ 元画像を表示しつつ、必要なら裏で作る
      await loadFull(key);
      if (fullUrls.has(key)) thumbUrls.set(key, fullUrls.get(key));
      if (thumb !== 'same') {
        const blob = await get(STORES.images, key);
        if (blob) queueThumb(key, blob);
      }
    }
  } finally {
    loading.delete(`t:${key}`);
    notify(key);
  }
}

// ---- 縮小画像の作成（1 枚ずつ順番に。対応端末では Worker で行う） ----
const queue = [];
let busy = false;
let worker = null;
let workerOk = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && 'convertToBlob' in OffscreenCanvas.prototype;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./thumbWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => { const cb = pending.get(e.data.id); pending.delete(e.data.id); cb?.(e.data); };
    worker.onerror = () => { workerOk = false; pending.forEach(cb => cb({ error: 'worker' })); pending.clear(); };
  }
  return worker;
}

const viaWorker = (key, blob) => new Promise(resolve => {
  pending.set(key, resolve);
  getWorker().postMessage({ id: key, blob, max: THUMB_MAX });
});

const viaMainThread = (blob) => new Promise(resolve => {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, THUMB_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale > 0.8) { URL.revokeObjectURL(url); resolve({ same: true }); return; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob(out => resolve(out ? { blob: out } : { error: 'toBlob' }), 'image/jpeg', 0.82);
  };
  img.onerror = () => { URL.revokeObjectURL(url); resolve({ error: 'decode' }); };
  img.src = url;
});

export function queueThumb(key, blob) {
  if (queue.some(q => q.key === key)) return;
  queue.push({ key, blob });
  pump();
}

async function pump() {
  if (busy) return;
  busy = true;
  while (queue.length) {
    const { key, blob } = queue.shift();
    let res = workerOk ? await viaWorker(key, blob) : null;
    if (!res || res.error) {
      // メインスレッドで作る場合は、操作の合間に少しずつ行う
      await new Promise(r => setTimeout(r, 120));
      res = await viaMainThread(blob);
    }
    if (res.blob) {
      await write([{ store: STORES.thumbs, key, value: res.blob }]).catch(() => {});
      const old = thumbUrls.get(key);
      thumbUrls.set(key, URL.createObjectURL(res.blob));
      if (old && old !== fullUrls.get(key)) URL.revokeObjectURL(old);
      notify(key);
    } else if (res.same) {
      await write([{ store: STORES.thumbs, key, value: 'same' }]).catch(() => {});
    }
  }
  busy = false;
}

// ---- 表示用フック ----
const subscribe = (key) => (fn) => {
  if (!key) return () => {};
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key)?.delete(fn);
};
const subscribers = new Map();
const subscribeFor = (key) => {
  if (!subscribers.has(key)) subscribers.set(key, subscribe(key));
  return subscribers.get(key);
};

// 画像キーから表示用の URL を返す。thumb=true なら縮小画像（一覧用）
export function useImage(key, { thumb = true } = {}) {
  const url = useSyncExternalStore(subscribeFor(key), () => (key ? (thumb ? thumbUrls.get(key) : fullUrls.get(key)) : undefined));
  if (key && !url) {
    if (thumb) loadThumb(key); else loadFull(key);
  }
  return url;
}

export const imageVersion = () => version;
