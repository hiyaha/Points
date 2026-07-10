export default function SetupScreen() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-xl px-4 py-10 space-y-4">
        <h1 className="text-2xl font-bold">初期設定が必要です</h1>
        <p className="text-slate-300">
          このアプリを動かすには Firebase の設定が必要です。以下の手順で設定してください:
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-slate-300">
          <li>
            <a
              className="text-sky-400 underline"
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              Firebase コンソール
            </a>
            でプロジェクトを作成する
          </li>
          <li>「Realtime Database」を作成する(テストモードでOK)</li>
          <li>プロジェクト設定からウェブアプリを追加し、構成情報を取得する</li>
          <li>
            リポジトリの <code className="rounded bg-slate-800 px-1">src/firebaseConfig.ts</code>{" "}
            に構成情報を貼り付けて再デプロイする
          </li>
        </ol>
        <p className="text-slate-400 text-sm">詳しい手順は README.md を参照してください。</p>
      </div>
    </div>
  );
}
