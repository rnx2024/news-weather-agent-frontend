import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatBox from "./ChatBox";
import { chatRequest } from "../lib/api";
import { MAX_QUESTION_LENGTH, type ChatResponse } from "../lib/schemas";

vi.mock("../lib/api", () => ({
  chatRequest: vi.fn(),
}));

describe("ChatBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the question character counter and preserves overlong input", async () => {
    const user = userEvent.setup();
    render(<ChatBox />);

    const input = screen.getByRole("textbox", { name: "Travel question" });
    expect(screen.getByText("0 / 2,000 characters")).toBeInTheDocument();

    fireEvent.change(input, {
      target: { value: "x".repeat(MAX_QUESTION_LENGTH + 1) },
    });
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      screen.getByText(
        "Your question is too long. Please keep it under 2,000 characters."
      )
    ).toBeInTheDocument();
    expect(input).toHaveValue("x".repeat(MAX_QUESTION_LENGTH + 1));
    expect(chatRequest).not.toHaveBeenCalled();
  });

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

  it("shows a research status while the chat request is pending", async () => {
    let resolveRequest!: (value: ChatResponse) => void;
    vi.mocked(chatRequest).mockReturnValue(
      new Promise<ChatResponse>((resolve) => {
        resolveRequest = resolve;
      })
    );

    const user = userEvent.setup();
    render(<ChatBox />);
    const input = screen.getByPlaceholderText(
      "Enter a travel question for this destination"
    );
    await user.type(input, "Any disruptions?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Researching current travel information"
    );

    resolveRequest({
      place: "Vigan",
      final: "No confirmed disruptions.",
      risk_level: "low",
      travel_advice: [],
      sources: [],
    });
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
      await screen.findByText(
        "The backend is temporarily unavailable. Please try again."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
