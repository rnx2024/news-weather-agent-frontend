// components/LoadingDots.tsx
export default function LoadingDots() {
  return (
    <div className="flex items-center space-x-1">
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.1s]" />
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
    </div>
  );
}
