// components/LoadingDots.tsx
type Props = {
  label?: string;
};

export default function LoadingDots({ label = "Working…" }: Readonly<Props>) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center space-x-1" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
        <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.1s]" />
        <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
      </span>
      <span>{label}</span>
    </div>
  );
}
