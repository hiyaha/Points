export default function SetupScreen() {
  return (
    <div className="bg-app min-h-screen text-stone-100">
      <div className="mx-auto max-w-xl space-y-5 px-4 py-10">
        <header className="text-center">
          <p className="mb-2 text-3xl tracking-[0.5em]">
            <span className="drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]">♠</span>
            <span className="text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.3)]">♥</span>
            <span className="text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.3)]">♦</span>
            <span className="drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]">♣</span>
          </p>
          <h1 className="text-gold text-2xl font-black">初期設定が必要です</h1>
          <div className="divider-gold mx-auto mt-3 w-32" />
        </header>

        <div className="panel rounded-2xl p-5">
          <p className="mb-4 text-stone-300">
            このアプリを動かすには Firebase の設定が必要です。以下の手順で設定してください:
          </p>
          <ol className="list-decimal space-y-2.5 pl-6 text-stone-300">
            <li>
              <a
                className="text-amber-400 underline decoration-amber-400/30 underline-offset-2"
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
              リポジトリの{" "}
              <code className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-300">
                src/firebaseConfig.ts
              </code>{" "}
              に構成情報を貼り付けて再デプロイする
            </li>
          </ol>
          <p className="mt-4 text-sm text-stone-500">
            詳しい手順は README.md を参照してください。
          </p>
        </div>
      </div>
    </div>
  );
}
