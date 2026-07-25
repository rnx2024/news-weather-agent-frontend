// components/ChatBox.tsx
"use client";

import { chatRequest, type ChatResponse } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { useState, type KeyboardEvent } from "react";
import MessageBubble from "./MessageBubble";
import LoadingDots from "./LoadingDots";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  riskLevel?: string;
  travelAdvice?: string[];
  sources?: { type: string }[];
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

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: q };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const res = await chatRequest(place, q);
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
    } catch (error: unknown) {
      const errMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `Error contacting backend: ${getErrorMessage(error, "Chat request failed")}`,
      };
      setMessages((m) => [...m, errMsg]);
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
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium leading-6 text-slate-700 shadow-sm hover:bg-slate-100 hover:border-slate-400"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* Input bar card */}
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-blue-100 p-4 shadow-md md:flex-row md:items-center">
        <input
          className="flex-1 rounded-xl border border-slate-300 bg-sky-50 px-4 py-3 text-base font-normal text-slate-800 placeholder-slate-400 focus:border-[#3399FF] focus:outline-none focus:ring-2 focus:ring-[#3399FF]/30"
          placeholder="Enter a travel question for this destination"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
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
