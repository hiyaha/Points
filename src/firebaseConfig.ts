// Firebase コンソール (https://console.firebase.google.com/) で
// プロジェクトを作成し、ウェブアプリの構成情報をここに貼り付けてください。
// 手順は README.md を参照。
export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN",
  databaseURL: "PASTE_YOUR_DATABASE_URL",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
};

export const isConfigured = !Object.values(firebaseConfig).some((v) =>
  v.startsWith("PASTE_"),
);
