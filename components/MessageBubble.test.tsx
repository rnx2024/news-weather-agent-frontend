import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MessageBubble from "./MessageBubble";

describe("MessageBubble", () => {
  it("uses a compact visible label for long source URLs while preserving the destination", () => {
    const link =
      "https://www.facebook.com/singsonrandy/posts/very-long-encoded-source-path";

    render(
      <MessageBubble role="assistant" text={`Source: [${link}](${link})`} />
    );

    const sourceLink = screen.getByRole("link", {
      name: `Open source link: ${link}`,
    });
    expect(sourceLink).toHaveAttribute("href", link);
    expect(sourceLink).toHaveTextContent("facebook.com");
    expect(sourceLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
