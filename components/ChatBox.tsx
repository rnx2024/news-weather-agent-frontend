// components/ChatBox.tsx
"use client";

import { chatRequest } from "../lib/api";
import { ApiError } from "../lib/apiError";
import { getErrorMessage } from "../lib/errors";
import {
  ChatRequestSchema,
  MAX_PLACE_LENGTH,
  MAX_QUESTION_LENGTH,
  type ChatSource,
  type RiskLevel,
  type ChatResponse,
} from "../lib/schemas";
import { useState, type KeyboardEvent } from "react";
import MessageBubble from "./MessageBubble";
import LoadingDots from "./LoadingDots";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  riskLevel?: RiskLevel;
  travelAdvice?: string[];
  sources?: ChatSource[];
};

const PRESET_PLACES = ["Vigan", "Laoag", "Manila", "Cebu", "Davao"];
const PRESET_QUESTIONS = [
  "Give me a travel brief for today.",
  "Any major disruptions or closures I should know about?",
  "What weather could affect getting around later?",
  "What practical travel advice should I keep in mind?",
];

export default function ChatBox() {
  const [place, setPlace] = useState("Vigan");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<{
    place: string;
    question: string;
  } | null>(null);

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q) return;

    const parsedRequest = ChatRequestSchema.safeParse({ place, question: q });
    if (!parsedRequest.success) {
      const field = parsedRequest.error.issues[0]?.path[0];
      setInputError(
        field === "place"
          ? `Destination must be between 1 and ${MAX_PLACE_LENGTH} characters.`
          : `Your question is too long. Please keep it under ${MAX_QUESTION_LENGTH.toLocaleString()} characters.`
      );
      return;
    }

    setInputError(null);
    setFailedRequest(null);

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: q };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const res = await chatRequest(
        parsedRequest.data.place,
        parsedRequest.data.question ?? ""
      );
      const assistant = formatAssistantMessage(res);
      const botMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: assistant.text,
        riskLevel: assistant.riskLevel,
        travelAdvice: assistant.travelAdvice,
        sources: assistant.sources,
      };
      setMessages((m) => [...m, botMsg]);
      setFailedRequest(null);
    } catch (error: unknown) {
      if (
        error instanceof ApiError &&
        (error.code === "VALIDATION_ERROR" ||
          error.code === "REQUEST_TOO_LARGE")
      ) {
        const details = error.details as
          { place?: string; question?: string } | undefined;
        setInputError(details?.question ?? details?.place ?? error.message);
        return;
      }
      const errMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: getErrorMessage(
          error,
          "The backend is temporarily unavailable. Please try again."
        ),
      };
      setMessages((m) => [...m, errMsg]);
      setFailedRequest({ place: parsedRequest.data.place, question: q });
    } finally {
      setLoading(false);
      if (!question) {
        setInput("");
      }
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Location selector card */}
      <section className="rounded-2xl border border-slate-200 bg-blue-100 p-5 shadow-md space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <label
              htmlFor="city"
              className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700"
            >
              Destination
            </label>

            <p className="mt-1 text-[0.95rem] leading-6 text-slate-600">
              Select a destination or enter a city manually.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 md:mt-0">
            {PRESET_PLACES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlace(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full border transition ${
                  p === place
                    ? "text-white border-transparent shadow-sm"
                    : "text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
                }`}
                style={
                  p === place ? { backgroundColor: "#457bb0ff" } : undefined
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <input
          id="city"
          className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base font-normal text-slate-800 focus:border-[#3399FF] focus:outline-none focus:ring-1 focus:ring-[#3399FF]"
          maxLength={MAX_PLACE_LENGTH}
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Enter a city or destination"
        />
      </section>

      {/* Chat window card */}
      <section className="rounded-2xl border border-slate-300 bg-blue-50 p-5 shadow-inner ring-1 ring-slate-200 h-80 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-[1rem] leading-7 text-slate-500">
            Request a destination brief, current disruptions, weather impact, or
            practical planning guidance for the selected location.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            text={m.text}
            riskLevel={m.riskLevel}
            travelAdvice={m.travelAdvice}
            sources={m.sources}
          />
        ))}
        {loading && (
          <div className="flex justify-start pt-1">
            <LoadingDots />
          </div>
        )}
        {!loading && failedRequest && (
          <div className="flex items-center justify-start gap-3 pt-1">
            <p className="text-sm text-slate-500">
              You can retry this request.
            </p>
            <button
              type="button"
              onClick={() => void send(failedRequest.question)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        )}
      </section>

      {/* Preset prompts card */}
      <section className="rounded-2xl border border-blue-50 bg-sky-100 p-5 shadow-md space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
          Suggested Questions
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void send(q)}
              disabled={loading}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium leading-6 text-slate-700 shadow-sm hover:bg-slate-100 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* Input bar card */}
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-blue-100 p-4 shadow-md md:flex-row md:items-center">
        <div className="flex-1">
          <label htmlFor="travel-question" className="sr-only">
            Travel question
          </label>
          <input
            id="travel-question"
            className="w-full rounded-xl border border-slate-300 bg-sky-50 px-4 py-3 text-base font-normal text-slate-800 placeholder-slate-400 focus:border-[#3399FF] focus:outline-none focus:ring-2 focus:ring-[#3399FF]/30"
            aria-describedby="question-help"
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="Enter a travel question for this destination"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (inputError) setInputError(null);
            }}
            onKeyDown={onKeyDown}
          />
          <p
            id="question-help"
            className={`mt-1 text-xs ${
              input.length >= MAX_QUESTION_LENGTH
                ? "font-semibold text-amber-700"
                : "text-slate-500"
            }`}
            aria-live={
              input.length >= MAX_QUESTION_LENGTH * 0.8 ? "polite" : "off"
            }
          >
            {input.length.toLocaleString()} /{" "}
            {MAX_QUESTION_LENGTH.toLocaleString()} characters
          </p>
          {inputError && (
            <p className="mt-1 text-xs text-red-700" role="alert">
              {inputError}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          className="mt-1 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:mt-0"
          style={{ backgroundColor: "#2285e8ff" }}
        >
          Send
        </button>
      </section>
    </div>
  );
}

function formatAssistantMessage(response: ChatResponse) {
  return {
    text: response.final || "(no response from backend)",
    riskLevel: response.risk_level,
    travelAdvice: response.travel_advice ?? [],
    sources: response.sources ?? [],
  };
}
