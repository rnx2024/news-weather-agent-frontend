// components/ChatBox.tsx
"use client";

import { chatRequest } from "../lib/api";
import { useState, type KeyboardEvent } from "react";
import MessageBubble from "./MessageBubble";
import LoadingDots from "./LoadingDots";

type Msg = { id: string; role: "user" | "assistant"; text: string };

const PRESET_PLACES = ["Vigan", "Laoag", "Manila", "Cebu", "Davao"];
const PRESET_QUESTIONS = [
  "What should I expect for the rest of today?",
  "Is it safe to go out this evening?",
  "Give me a short summary of weather and news.",
  "Any major risks or disruptions I should know?",
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
      // updated: no debug arg, matches backend { place, question }
      const res = await chatRequest(place, q);
      const botMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: res.final || "(no response from agent)",
      };
      setMessages((m) => [...m, botMsg]);
    } catch (e: any) {
      const errMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `Error contacting backend: ${e.message}`,
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
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              City
            </label>

            <p className="text-xs text-slate-500">
              Choose a city or type your own.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 md:mt-0">
            {PRESET_PLACES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlace(p)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
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
          className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#3399FF] focus:outline-none focus:ring-1 focus:ring-[#3399FF]"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Custom city or place"
        />
      </section>

      {/* Chat window card */}
      <section className="rounded-2xl border border-slate-300 bg-blue-50 p-5 shadow-inner ring-1 ring-slate-200 h-80 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Ask about weather, safety, or recent news for the selected location.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} text={m.text} />
        ))}
        {loading && (
          <div className="flex justify-start pt-1">
            <LoadingDots />
          </div>
        )}
      </section>

      {/* Preset prompts card */}
      <section className="rounded-2xl border border-blue-50 bg-sky-100 p-5 shadow-md space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Quick questions
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void send(q)}
              className="text-xs px-4 py-1.5 rounded-full text-sm font-medium shadow-sm border border-slate-300 bg-white hover:bg-slate-100 hover:border-slate-400"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* Input bar card */}
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-blue-100 p-4 shadow-md md:flex-row md:items-center">
        <input
          className="flex-1 rounded-xl border border-slate-300 bg-sky-50 px-4 py-3 text-sm placeholder-slate-400 focus:border-[#3399FF] focus:outline-none focus:ring-2 focus:ring-[#3399FF]/30"
          placeholder="Type your own question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          className="mt-1 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:mt-0"
          style={{ backgroundColor: "#2285e8ff" }}
        >
          Send
        </button>
      </section>
    </div>
  );
}
