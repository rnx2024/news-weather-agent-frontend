// app/page.tsx
import Image from "next/image";
import ChatBox from "../components/ChatBox";
import QuickWeatherCard from "../components/QuickWeatherCard";
import QuickNewsCard from "../components/QuickNewsCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-blue-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center rounded-full bg-blue-100/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm ring-1 ring-slate-200">
            Travel intelligence · Weather · Local developments · Risk signals
          </span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-md ring-1 ring-slate-100 space-y-6">
          
          {/* Header with logo */}
          <header className="mb-4 flex items-center gap-4">
            <Image
              src="/tripbites-logo.svg"
              alt="TripBites Logo"
              width={48}
              height={48}
              className="h-12 w-12"
            />

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                Destination Briefing
              </p>
              <h1
                className="text-4xl font-semibold tracking-[-0.03em] md:text-[2.8rem]"
                style={{ color: "#275685ff" }}
              >
                TripBites
              </h1>
              <p
                className="max-w-2xl text-[1.02rem] font-normal leading-7"
                style={{ color: "#2a4157ff" }}
              >
                Destination briefings grounded in weather, local developments, and practical travel impact.
              </p>
            </div>
          </header>

          {/* Mini cards row */}
          <div className="grid gap-4 md:grid-cols-2">
            <QuickWeatherCard />
            <QuickNewsCard />
          </div>

          {/* Main chat card area */}
          <ChatBox />
        </div>
      </div>
    </main>
  );
}
