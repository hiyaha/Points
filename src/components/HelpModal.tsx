import { HelpTerms } from "./HelpSection";

interface Props {
  onClose: () => void;
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-fade-up max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-900 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">📖 ポーカー用語ガイド</h2>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm text-slate-400 transition active:scale-90"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <HelpTerms />
      </div>
    </div>
  );
}
