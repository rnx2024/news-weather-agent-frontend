import type { ChatSource, RiskLevel } from "../lib/schemas";

type Props = {
  riskLevel?: RiskLevel;
  sources?: ChatSource[];
};

const RISK_STYLES: Record<
  RiskLevel,
  { label: string; icon: string; className: string }
> = {
  low: {
    label: "Low risk",
    icon: "🟢",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  medium: {
    label: "Medium risk",
    icon: "🟡",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  high: {
    label: "High risk",
    icon: "🔴",
    className: "border-red-200 bg-red-50 text-red-800",
  },
};

const SOURCE_DETAILS: Record<
  ChatSource["type"],
  { label: string; icon: string }
> = {
  weather: { label: "Weather", icon: "☁️" },
  news: { label: "News", icon: "📰" },
};

export default function ResponseBadges({
  riskLevel,
  sources,
}: Readonly<Props>) {
  const hasSources = Boolean(sources && sources.length > 0);

  if (!riskLevel && !hasSources) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Response details">
      {riskLevel && <RiskBadge riskLevel={riskLevel} />}
      {sources?.map((source) => (
        <SourceBadge key={source.type} sourceType={source.type} />
      ))}
    </div>
  );
}

function RiskBadge({ riskLevel }: Readonly<{ riskLevel: RiskLevel }>) {
  const details = RISK_STYLES[riskLevel];

  return (
    <span
      aria-label={`Risk level: ${details.label}`}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${details.className}`}
    >
      <span aria-hidden="true">{details.icon}</span>
      {details.label}
    </span>
  );
}

function SourceBadge({
  sourceType,
}: Readonly<{ sourceType: ChatSource["type"] }>) {
  const details = SOURCE_DETAILS[sourceType];

  return (
    <span
      aria-label={`Source: ${details.label}`}
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700"
    >
      <span aria-hidden="true">{details.icon}</span>
      {details.label}
    </span>
  );
}
