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
  const lines = text.split("\n");
  let offset = 0;
  return lines.map((line) => {
    const key = buildLineKey(line, offset);
    offset += line.length + 1;
    return <p key={key}>{renderInlineLinks(line, isUser)}</p>;
  });
}

function renderInlineLinks(text: string, isUser: boolean) {
  const nodes: Array<string | React.JSX.Element> = [];
  let lastIndex = 0;

  for (const match of findLinks(text)) {
    appendTextSegment(nodes, text, lastIndex, match.start);
    nodes.push(...buildLinkNodes(match, isUser));
    lastIndex = match.start + match.raw.length;
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
      const parsed = parseMarkdownLink(text, nextBracket);
      if (parsed) {
        matches.push(parsed.match);
        index = parsed.nextIndex;
      } else {
        index = nextBracket + 1;
      }
      continue;
    }

    if (nextHttp !== -1) {
      const parsed = parseRawUrl(text, nextHttp);
      if (parsed) {
        matches.push(parsed.match);
        index = parsed.nextIndex;
        continue;
      }
    }

    index = Math.max(nextHttp, nextBracket) + 1;
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
  while (index < text.length) {
    const codePoint = text.codePointAt(index) ?? 0;
    if (isWhitespace(codePoint)) {
      break;
    }
    index += codePoint > 0xffff ? 2 : 1;
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
  let end = url.length;
  while (end > 0) {
    const charCode = url.codePointAt(end - 1) ?? 0;
    const isPunctuation = isTrailingPunctuation(charCode);
    if (!isPunctuation) {
      break;
    }
    end -= charCode > 0xffff ? 2 : 1;
  }

  return end === url.length ? url : url.slice(0, end);
}

function buildLineKey(line: string, offset: number) {
  const trimmed = line.trim();
  if (!trimmed) {
    return `line-${offset}-empty`;
  }
  return `line-${offset}-${trimmed}`;
}

function appendTextSegment(
  nodes: Array<string | React.JSX.Element>,
  text: string,
  start: number,
  end: number
) {
  if (end > start) {
    nodes.push(text.slice(start, end));
  }
}

function buildLinkNodes(match: LinkMatch, isUser: boolean) {
  if (match.markdownLabel && match.markdownUrl) {
    return [
      buildAnchor(match.markdownUrl, match.markdownLabel, isUser, match.start),
    ];
  }

  if (match.rawUrl) {
    const trimmedUrl = trimTrailingPunctuation(match.rawUrl);
    const trailing = match.rawUrl.slice(trimmedUrl.length);
    const nodes: Array<string | React.JSX.Element> = [
      buildAnchor(trimmedUrl, trimmedUrl, isUser, match.start),
    ];
    if (trailing) {
      nodes.push(trailing);
    }
    return nodes;
  }

  return [];
}

function buildAnchor(href: string, label: string, isUser: boolean, start: number) {
  return (
    <a
      key={`link-${start}-${href}`}
      href={href}
      target="_blank"
      rel="noreferrer"
      className={linkClassName(isUser)}
    >
      {label}
    </a>
  );
}

function linkClassName(isUser: boolean) {
  return isUser
    ? "underline underline-offset-2 text-white"
    : "underline underline-offset-2 text-sky-700";
}

function parseMarkdownLink(text: string, start: number) {
  const labelEnd = text.indexOf("]", start + 1);
  if (labelEnd === -1 || text[labelEnd + 1] !== "(") {
    return null;
  }

  const urlStart = labelEnd + 2;
  if (!startsWithHttp(text, urlStart)) {
    return null;
  }

  const urlEnd = text.indexOf(")", urlStart);
  if (urlEnd === -1) {
    return null;
  }

  const markdownLabel = text.slice(start + 1, labelEnd);
  const markdownUrl = text.slice(urlStart, urlEnd);
  if (!markdownLabel || !markdownUrl) {
    return null;
  }

  return {
    match: {
      start,
      raw: text.slice(start, urlEnd + 1),
      markdownLabel,
      markdownUrl,
    },
    nextIndex: urlEnd + 1,
  };
}

function parseRawUrl(text: string, start: number) {
  const urlEnd = findUrlEnd(text, start);
  if (urlEnd <= start) {
    return null;
  }
  const rawUrl = text.slice(start, urlEnd);
  return {
    match: { start, raw: rawUrl, rawUrl },
    nextIndex: urlEnd,
  };
}

function startsWithHttp(text: string, index: number) {
  return text.startsWith("http://", index) || text.startsWith("https://", index);
}

function isTrailingPunctuation(charCode: number) {
  return (
    charCode === 0x29 ||
    charCode === 0x2c ||
    charCode === 0x2e ||
    charCode === 0x21 ||
    charCode === 0x3f ||
    charCode === 0x3a ||
    charCode === 0x3b
  );
}
