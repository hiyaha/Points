import { HelpTerms } from "./HelpSection";

interface Props {
  onClose: () => void;
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-fade-up max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t border-amber-500/20 bg-gradient-to-b from-stone-900 to-stone-950 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-stone-100">
            📖 ポーカー用語ガイド
          </h2>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-sm text-stone-400 transition active:scale-90"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="divider-gold mb-4" />
        <HelpTerms />
      </div>
    </div>
  );
}
