import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportForm, validateQuestions } from "./ImportForm";
import type { Domain } from "@/lib/types";

const domains: Domain[] = [
  { id: 1, name: "Security and Risk Management", weight: "16%", color: "#4FD1C5" },
  { id: 2, name: "Asset Security", weight: "10%", color: "#63B3ED" },
];

function makeQuestion(overrides: Record<string, unknown> = {}) {
  return {
    domain_id: 1,
    question: "What is the primary purpose of risk assessment?",
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: 0,
    explanation: "The correct answer is A because...",
    ...overrides,
  };
}

describe("validateQuestions", () => {
  it("accepts valid questions", () => {
    const result = validateQuestions([makeQuestion(), makeQuestion({ domain_id: 2 })]);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects non-array input", () => {
    const result = validateQuestions({ foo: "bar" });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0].message).toBe("JSON must be an array");
  });

  it("rejects empty array", () => {
    const result = validateQuestions([]);
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0].message).toBe("Array is empty");
  });

  it("rejects missing fields", () => {
    const result = validateQuestions([{ domain_id: 1 }]);
    expect(result.errors[0].message).toContain("Missing fields");
    expect(result.errors[0].index).toBe(0);
  });

  it("rejects invalid domain_id", () => {
    expect(validateQuestions([makeQuestion({ domain_id: 0 })]).errors[0].message).toBe("domain_id must be 1-8");
    expect(validateQuestions([makeQuestion({ domain_id: 9 })]).errors[0].message).toBe("domain_id must be 1-8");
    expect(validateQuestions([makeQuestion({ domain_id: "one" })]).errors[0].message).toBe("domain_id must be 1-8");
  });

  it("rejects wrong option count", () => {
    const result = validateQuestions([makeQuestion({ options: ["A", "B", "C"] })]);
    expect(result.errors[0].message).toContain("exactly 4");
  });

  it("rejects empty option strings", () => {
    const result = validateQuestions([makeQuestion({ options: ["A", "", "C", "D"] })]);
    expect(result.errors[0].message).toContain("non-empty strings");
  });

  it("rejects answer out of range", () => {
    expect(validateQuestions([makeQuestion({ answer: -1 })]).errors[0].message).toContain("0, 1, 2, or 3");
    expect(validateQuestions([makeQuestion({ answer: 4 })]).errors[0].message).toContain("0, 1, 2, or 3");
    expect(validateQuestions([makeQuestion({ answer: 1.5 })]).errors[0].message).toContain("0, 1, 2, or 3");
  });

  it("rejects empty question text", () => {
    const result = validateQuestions([makeQuestion({ question: "" })]);
    expect(result.errors[0].message).toContain("non-empty string");
  });

  it("rejects empty explanation", () => {
    const result = validateQuestions([makeQuestion({ explanation: "" })]);
    expect(result.errors[0].message).toContain("non-empty string");
  });

  it("returns both valid and invalid items", () => {
    const result = validateQuestions([
      makeQuestion(),
      makeQuestion({ domain_id: 99 }),
      makeQuestion({ domain_id: 3 }),
    ]);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].index).toBe(1);
  });
});

afterEach(() => cleanup());

describe("ImportForm", () => {
  function createJsonFile(data: unknown, name = "questions.json") {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    return new File([blob], name, { type: "application/json" });
  }

  it("shows preview after valid file upload", async () => {
    const user = userEvent.setup();
    render(<ImportForm onImport={vi.fn()} domains={domains} />);

    const input = screen.getByLabelText(/upload json/i);
    const file = createJsonFile([makeQuestion(), makeQuestion({ domain_id: 2 })]);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2 valid questions/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Domain 1/)).toBeInTheDocument();
    expect(screen.getByText(/Domain 2/)).toBeInTheDocument();
  });

  it("shows validation errors for invalid data", async () => {
    const user = userEvent.setup();
    render(<ImportForm onImport={vi.fn()} domains={domains} />);

    const input = screen.getByLabelText(/upload json/i);
    const file = createJsonFile([{ domain_id: 99 }]);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Validation errors/)).toBeInTheDocument();
    });
  });

  it("shows error for non-JSON file content", async () => {
    const user = userEvent.setup();
    render(<ImportForm onImport={vi.fn()} domains={domains} />);

    const input = screen.getByLabelText(/upload json/i);
    const blob = new Blob(["not json"], { type: "application/json" });
    const file = new File([blob], "bad.json", { type: "application/json" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("Invalid JSON file")).toBeInTheDocument();
    });
  });

  it("calls onImport with valid questions on confirm", async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ImportForm onImport={onImport} domains={domains} />);

    const input = screen.getByLabelText(/upload json/i);
    await user.upload(input, createJsonFile([makeQuestion()]));

    await waitFor(() => {
      expect(screen.getByText(/Import 1 Question/)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Import 1 Question/));

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith([makeQuestion()]);
      expect(screen.getByText(/successfully/)).toBeInTheDocument();
    });
  });
});
