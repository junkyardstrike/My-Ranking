// IndexedDB を直接使う薄いラッパー。
// 以前は全データ（画像込み）を 1 つの値として丸ごと保存していたため、閲覧回数を 1 つ変えるだけでも
// 数 MB の書き込みが走っていた。作品は 1 件ずつ、画像は別の保存場所に分けて、変わった分だけ書く。

const DB_NAME = 'MasterPiece';
const DB_VERSION = 1;
export const STORES = { kv: 'kv', items: 'items', images: 'images', thumbs: 'thumbs' };

let dbPromise = null;
export function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        Object.values(STORES).forEach(name => { if (!db.objectStoreNames.contains(name)) db.createObjectStore(name); });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

const done = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onabort = tx.onerror = () => reject(tx.error);
});
const result = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

export async function get(store, key) {
  const db = await openDb();
  return result(db.transaction(store).objectStore(store).get(key));
}

// ストア内の全件を { key: value } で返す
export async function getAllEntries(store) {
  const db = await openDb();
  const os = db.transaction(store).objectStore(store);
  const [keys, values] = await Promise.all([result(os.getAllKeys()), result(os.getAll())]);
  const out = {};
  keys.forEach((k, i) => { out[k] = values[i]; });
  return out;
}

// ops: [{ store, key, value }]（value が undefined なら削除）を 1 回の書き込みで行う
export async function write(ops) {
  if (!ops.length) return;
  const db = await openDb();
  const names = [...new Set(ops.map(o => o.store))];
  const tx = db.transaction(names, 'readwrite');
  ops.forEach(({ store, key, value }) => {
    const os = tx.objectStore(store);
    if (value === undefined) os.delete(key);
    else os.put(value, key);
  });
  return done(tx);
}

export async function clearAll() {
  const db = await openDb();
  const names = Object.values(STORES);
  const tx = db.transaction(names, 'readwrite');
  names.forEach(n => tx.objectStore(n).clear());
  return done(tx);
}
