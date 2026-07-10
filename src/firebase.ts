import { initializeApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { firebaseConfig, isConfigured } from "./firebaseConfig";

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    if (!isConfigured) {
      throw new Error("Firebase が設定されていません");
    }
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
  return db;
}
