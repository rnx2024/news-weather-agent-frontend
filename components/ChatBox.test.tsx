import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatBox from "./ChatBox";
import { chatRequest } from "../lib/api";

vi.mock("../lib/api", () => ({
  chatRequest: vi.fn(),
}));

describe("ChatBox", () => {
  it("sends a question and renders the assistant's reply", async () => {
    vi.mocked(chatRequest).mockResolvedValue({
      place: "Vigan",
      final: "Looks fine for travel today.",
      risk_level: "low",
      travel_advice: [],
      sources: [],
    });

    const user = userEvent.setup();
    render(<ChatBox />);

    const input = screen.getByPlaceholderText(
      "Enter a travel question for this destination"
    );
    await user.type(input, "Any disruptions?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("Looks fine for travel today.")
    ).toBeInTheDocument();
    expect(chatRequest).toHaveBeenCalledWith("Vigan", "Any disruptions?");
  });

  it("shows a friendly error message when the request fails", async () => {
    vi.mocked(chatRequest).mockRejectedValue(new Error("Network down"));

    const user = userEvent.setup();
    render(<ChatBox />);

    const input = screen.getByPlaceholderText(
      "Enter a travel question for this destination"
    );
    await user.type(input, "Any disruptions?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("Error contacting backend: Network down")
    ).toBeInTheDocument();
  });
});
