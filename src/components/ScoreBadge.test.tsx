import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScoreBadge } from "./ScoreBadge";

describe("ScoreBadge", () => {
  it("renders the score as a percentage", () => {
    render(<ScoreBadge score={72} passed={true} />);
    expect(screen.getByText("72%")).toBeInTheDocument();
  });

  it("applies green styling when passed", () => {
    const { container } = render(<ScoreBadge score={80} passed={true} />);
    const badge = container.querySelector("span")!;
    expect(badge.className).toContain("text-emerald-400");
    expect(badge.className).toContain("bg-emerald-500/15");
  });

  it("applies red styling when not passed", () => {
    const { container } = render(<ScoreBadge score={58} passed={false} />);
    const badge = container.querySelector("span")!;
    expect(badge.className).toContain("text-red-400");
    expect(badge.className).toContain("bg-red-500/15");
  });

  it("renders 0% score", () => {
    render(<ScoreBadge score={0} passed={false} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders 100% score", () => {
    render(<ScoreBadge score={100} passed={true} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
