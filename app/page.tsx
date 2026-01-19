// app/page.tsx
import ChatBox from "../components/ChatBox";
import QuickWeatherCard from "../components/QuickWeatherCard";
import QuickNewsCard from "../components/QuickNewsCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-blue-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center rounded-full bg-blue-100/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
            City insights · Weather · News · Risk signals
          </span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-md ring-1 ring-slate-100 space-y-6">
          
          {/* Header with logo */}
          <header className="mb-4 flex items-center gap-4">
            <img
              src="/smart-news-logo.svg"
              alt="NewsTrips Logo"
              className="h-12 w-12"
            />

            <div className="space-y-1">
              <h1
                className="text-4xl font-extrabold tracking-tight"
                style={{ color: "#275685ff" }}
              >
                NewsTrips
              </h1>
              <p
                className="text-base font-medium leading-relaxed"
                style={{ color: "#2a4157ff" }}
              >
                Ask about any city. Smart News, Smart Insights.
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
