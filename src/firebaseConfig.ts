// Firebase コンソール (https://console.firebase.google.com/) で
// プロジェクトを作成し、ウェブアプリの構成情報をここに貼り付けてください。
// 手順は README.md を参照。
export const firebaseConfig = {
  apiKey: "AIzaSyDcwONK9F93k4FSBLz1gVW_7YikccmeWzQ",
  authDomain: "poker-b7235.firebaseapp.com",
  databaseURL: "https://poker-b7235-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "poker-b7235",
  storageBucket: "poker-b7235.firebasestorage.app",
  messagingSenderId: "560474708602",
  appId: "1:560474708602:web:6c3eec9ef7a47f883179c3",
};

export const isConfigured = !Object.values(firebaseConfig).some((v) =>
  v.startsWith("PASTE_"),
);
