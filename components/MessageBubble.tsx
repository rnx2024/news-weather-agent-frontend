// components/MessageBubble.tsx
type Props = {
  role: "user" | "assistant";
  text: string;
  riskLevel?: string;
  travelAdvice?: string[];
  sources?: { type: string }[];
};

type LinkMatch = {
  start: number;
  raw: string;
  markdownLabel?: string;
  markdownUrl?: string;
  rawUrl?: string;
};

export default function MessageBubble(
  { role, text, riskLevel, travelAdvice, sources }: Readonly<Props>
) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xl rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? "text-white shadow-sm"
            : "bg-white text-slate-900 shadow-sm border border-slate-200"
        }`}
        style={isUser ? { backgroundColor: "#0066CC" } : undefined}
      >
        <div className="space-y-2">{renderMessageText(text, isUser)}</div>
        {!isUser && riskLevel && (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-sky-700">
            Risk level: {riskLevel}
          </p>
        )}
        {!isUser && travelAdvice && travelAdvice.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {travelAdvice.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        )}
        {!isUser && sources && sources.length > 0 && (
          <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
            Sources: {sources.map((source) => source.type).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function renderMessageText(text: string, isUser: boolean) {
  return text.split("\n").map((line, lineIndex) => (
    <p key={`line-${lineIndex}`}>{renderInlineLinks(line, isUser, lineIndex)}</p>
  ));
}

function renderInlineLinks(text: string, isUser: boolean, lineIndex: number) {
  const nodes: Array<string | React.JSX.Element> = [];
  let lastIndex = 0;

  for (const match of findLinks(text)) {
    const raw = match.raw;
    const start = match.start;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const markdownLabel = match.markdownLabel;
    const markdownUrl = match.markdownUrl;
    const rawUrl = match.rawUrl;

    if (markdownLabel && markdownUrl) {
      nodes.push(
        <a
          key={`link-${lineIndex}-${start}`}
          href={markdownUrl}
          target="_blank"
          rel="noreferrer"
          className={isUser ? "underline underline-offset-2 text-white" : "underline underline-offset-2 text-sky-700"}
        >
          {markdownLabel}
        </a>
      );
    } else if (rawUrl) {
      const trimmedUrl = trimTrailingPunctuation(rawUrl);
      const trailing = rawUrl.slice(trimmedUrl.length);
      nodes.push(
        <a
          key={`link-${lineIndex}-${start}`}
          href={trimmedUrl}
          target="_blank"
          rel="noreferrer"
          className={isUser ? "underline underline-offset-2 text-white" : "underline underline-offset-2 text-sky-700"}
        >
          {trimmedUrl}
        </a>
      );
      if (trailing) {
        nodes.push(trailing);
      }
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function findLinks(text: string): LinkMatch[] {
  const matches: LinkMatch[] = [];
  let index = 0;

  while (index < text.length) {
    const nextBracket = text.indexOf("[", index);
    const nextHttp = findNextHttp(text, index);

    if (nextBracket === -1 && nextHttp === -1) {
      break;
    }

    const useBracket =
      nextBracket !== -1 && (nextHttp === -1 || nextBracket < nextHttp);

    if (useBracket) {
      const labelEnd = text.indexOf("]", nextBracket + 1);
      if (labelEnd !== -1 && text[labelEnd + 1] === "(") {
        const urlStart = labelEnd + 2;
        if (
          text.startsWith("http://", urlStart) ||
          text.startsWith("https://", urlStart)
        ) {
          const urlEnd = text.indexOf(")", urlStart);
          if (urlEnd !== -1) {
            const markdownLabel = text.slice(nextBracket + 1, labelEnd);
            const markdownUrl = text.slice(urlStart, urlEnd);
            if (markdownLabel && markdownUrl) {
              matches.push({
                start: nextBracket,
                raw: text.slice(nextBracket, urlEnd + 1),
                markdownLabel,
                markdownUrl,
              });
              index = urlEnd + 1;
              continue;
            }
          }
        }
      }

      index = nextBracket + 1;
      continue;
    }

    if (nextHttp !== -1) {
      const urlEnd = findUrlEnd(text, nextHttp);
      if (urlEnd > nextHttp) {
        const rawUrl = text.slice(nextHttp, urlEnd);
        matches.push({ start: nextHttp, raw: rawUrl, rawUrl });
        index = urlEnd;
        continue;
      }
    }

    index += 1;
  }

  return matches;
}

function findNextHttp(text: string, fromIndex: number) {
  const httpIndex = text.indexOf("http://", fromIndex);
  const httpsIndex = text.indexOf("https://", fromIndex);

  if (httpIndex === -1) {
    return httpsIndex;
  }

  if (httpsIndex === -1) {
    return httpIndex;
  }

  return Math.min(httpIndex, httpsIndex);
}

function findUrlEnd(text: string, startIndex: number) {
  let index = startIndex;
  while (index < text.length && !isWhitespace(text.charCodeAt(index))) {
    index += 1;
  }
  return index;
}

function isWhitespace(charCode: number) {
  return (
    charCode === 0x20 || // space
    charCode === 0x09 || // tab
    charCode === 0x0a || // line feed
    charCode === 0x0d || // carriage return
    charCode === 0x0b || // vertical tab
    charCode === 0x0c // form feed
  );
}

function trimTrailingPunctuation(url: string) {
  return url.replace(/[),.!?:;]+$/g, "");
}
