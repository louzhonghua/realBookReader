const DB_NAME = 'realBookReaderDB';
const DB_VERSION = 1;
const STORE_NAME = 'books';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('打开本地书架数据库失败'));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('importedAt', 'importedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });

  return dbPromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('数据库请求失败'));
  });
}

export function createBookId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function saveBook({
  id,
  name,
  pdfBlob,
  coverDataUrl,
  pageCount = 0,
  recentPage = 0,
}) {
  if (!pdfBlob) {
    throw new Error('保存书籍失败：缺少 PDF 数据');
  }

  const now = Date.now();
  const bookRecord = {
    id: id || createBookId(),
    name: name || '未命名书籍',
    importedAt: now,
    updatedAt: now,
    coverDataUrl: coverDataUrl || '',
    pageCount,
    recentPage,
    pdfBlob,
  };

  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await requestToPromise(store.put(bookRecord));

  return sanitizeBook(bookRecord);
}

export async function listBooks() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const result = await requestToPromise(store.getAll());
  return result
    .map(sanitizeBook)
    .sort((a, b) => b.importedAt - a.importedAt);
}

export async function getBookBlob(bookId) {
  if (!bookId) return null;
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const record = await requestToPromise(store.get(bookId));
  return record?.pdfBlob || null;
}

export async function updateBookProgress(bookId, recentPage) {
  if (!bookId) return null;
  const normalizedPage = Number.isFinite(recentPage)
    ? Math.max(0, Math.floor(recentPage))
    : 0;

  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const record = await requestToPromise(store.get(bookId));
  if (!record) return null;

  const updated = {
    ...record,
    recentPage: normalizedPage,
    updatedAt: Date.now(),
  };

  await requestToPromise(store.put(updated));
  return sanitizeBook(updated);
}

function sanitizeBook(record) {
  return {
    id: record.id,
    name: record.name,
    importedAt: record.importedAt,
    updatedAt: record.updatedAt,
    coverDataUrl: record.coverDataUrl,
    pageCount: record.pageCount || 0,
    recentPage: record.recentPage || 0,
  };
}
