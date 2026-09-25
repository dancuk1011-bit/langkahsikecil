export interface ChildProfile {
  id: string;
  name: string;
  birthDate: string;
  gestationalWeeks?: number | null;
  useCorrectedAge: boolean;
}
export interface ActivityLog {
  id: string;
  activityId: string;
  completedDate: string;
  response: "enjoyed" | "tried" | "not_interested" | "tired";
}
export interface SkillLog {
  id: string;
  skillId: string;
  date: string;
  status: "seen" | "lost";
}
export interface ConcernLog {
  id: string;
  category: string;
  createdDate: string;
  note: string;
}
const DB_NAME = "langkah-si-kecil-local-v1";
const STORES = ["profile", "activity_logs", "skill_logs", "concerns"] as const;
type StoreName = typeof STORES[number];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach((name) => { if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" }); });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  } finally { db.close(); }
}
export async function put<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(item);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function clearAll(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES, "readwrite");
      STORES.forEach((name) => tx.objectStore(name).clear());
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function exportUserData() {
  const [profile, activity_logs, skill_logs, concerns] = await Promise.all([
    getAll<ChildProfile>("profile"), getAll<ActivityLog>("activity_logs"),
    getAll<SkillLog>("skill_logs"), getAll<ConcernLog>("concerns"),
  ]);
  return { format: "lsk-user-data-v1", exportedAt: new Date().toISOString(), profile, activity_logs, skill_logs, concerns };
}
