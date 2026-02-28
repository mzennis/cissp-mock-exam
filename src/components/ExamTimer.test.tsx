import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExamTimer } from "./ExamTimer";

const defaultProps = {
  onTick: vi.fn(),
  onTimeUp: vi.fn(),
  active: true,
};

describe("ExamTimer", () => {
  it("formats time as hh:mm:ss", () => {
    render(<ExamTimer {...defaultProps} timeLeft={3661} />);
    expect(screen.getByText("01:01:01")).toBeInTheDocument();
  });

  it("pads single digits with zeros", () => {
    render(<ExamTimer {...defaultProps} timeLeft={5} />);
    expect(screen.getByText("00:00:05")).toBeInTheDocument();
  });

  it("handles exact hour boundary", () => {
    render(<ExamTimer {...defaultProps} timeLeft={7200} />);
    expect(screen.getByText("02:00:00")).toBeInTheDocument();
  });

  it("shows 00:00:00 when time is zero", () => {
    render(<ExamTimer {...defaultProps} timeLeft={0} />);
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
  });

  it("applies warning style when below threshold", () => {
    const { container } = render(<ExamTimer {...defaultProps} timeLeft={60} />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("text-cissp-red");
  });

  it("applies normal style when above threshold", () => {
    const { container } = render(<ExamTimer {...defaultProps} timeLeft={600} />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("text-cissp-teal");
  });
});
