import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResponseBadges from "./ResponseBadges";

describe("ResponseBadges", () => {
  it("shows the risk level with a readable label", () => {
    render(<ResponseBadges riskLevel="high" />);

    expect(screen.getByLabelText("Risk level: High risk")).toBeInTheDocument();
    expect(screen.getByText("High risk")).toBeInTheDocument();
  });

  it("shows weather and news source badges", () => {
    render(
      <ResponseBadges sources={[{ type: "weather" }, { type: "news" }]} />
    );

    expect(screen.getByLabelText("Source: Weather")).toBeInTheDocument();
    expect(screen.getByLabelText("Source: News")).toBeInTheDocument();
  });

  it("does not render when no response metadata is available", () => {
    const { container } = render(<ResponseBadges />);

    expect(container).toBeEmptyDOMElement();
  });
});
