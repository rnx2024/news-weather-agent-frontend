import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { newsRequest, weatherRequest } from "../lib/api";
import type { NewsResponse, WeatherResponse } from "../lib/schemas";
import QuickNewsCard from "./QuickNewsCard";
import QuickWeatherCard from "./QuickWeatherCard";

vi.mock("../lib/api", () => ({
  newsRequest: vi.fn(),
  weatherRequest: vi.fn(),
}));

describe("quick request cards", () => {
  it("shows a news search status while Fetch is pending", async () => {
    let resolveRequest!: (value: NewsResponse) => void;
    vi.mocked(newsRequest).mockReturnValue(
      new Promise<NewsResponse>((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<QuickNewsCard />);
    await screen.getByRole("button", { name: "Fetch" }).click();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Searching recent news for Vigan"
    );
    expect(screen.getByRole("button", { name: "Searching…" })).toBeDisabled();

    resolveRequest({
      place: "Vigan",
      recent_count: 0,
      items: [],
      travel_relevance: "",
      note: "",
    });
  });

  it("shows a weather check status while Check is pending", async () => {
    let resolveRequest!: (value: WeatherResponse) => void;
    vi.mocked(weatherRequest).mockReturnValue(
      new Promise<WeatherResponse>((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<QuickWeatherCard />);
    await screen.getByRole("button", { name: "Check" }).click();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking current weather for Vigan"
    );
    expect(screen.getByRole("button", { name: "Checking…" })).toBeDisabled();

    resolveRequest({
      place: "Vigan",
      summary: "Clear",
      travel_relevance: "",
      travel_advice: [],
    });
  });
});
