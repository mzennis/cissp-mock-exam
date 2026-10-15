"use client";

import { useState, useCallback } from "react";
import type { Domain } from "@/lib/types";
import { domainColor } from "@/lib/constants";
import { Button, Icons } from "./ui";

interface ImportQuestion {
  domain_id: number;
  question: string;
  options: string[];
  answer?: number | null;
  explanation?: string | null;
}

interface ImportFormProps {
  onImport: (questions: ImportQuestion[]) => Promise<void>;
  domains: Domain[];
}

interface ValidationError {
  index: number;
  message: string;
}

export function validateQuestions(
  data: unknown
): { valid: ImportQuestion[]; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!Array.isArray(data)) {
    return { valid: [], errors: [{ index: -1, message: "JSON must be an array" }] };
  }

  if (data.length === 0) {
    return { valid: [], errors: [{ index: -1, message: "Array is empty" }] };
  }

  const valid: ImportQuestion[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    if (!item || typeof item !== "object") {
      errors.push({ index: i, message: "Item is not an object" });
      continue;
    }

    const missing = ["domain_id", "question", "options"].filter(
      (f) => !(f in item)
    );
    if (missing.length > 0) {
      errors.push({ index: i, message: `Missing fields: ${missing.join(", ")}` });
      continue;
    }

    if (typeof item.domain_id !== "number" || item.domain_id < 1 || item.domain_id > 8) {
      errors.push({ index: i, message: "domain_id must be 1-8" });
      continue;
    }

    if (typeof item.question !== "string" || item.question.trim() === "") {
      errors.push({ index: i, message: "question must be a non-empty string" });
      continue;
    }

    if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 6) {
      errors.push({ index: i, message: "options must be an array of 2-6 strings" });
      continue;
    }

    if (!item.options.every((o: unknown) => typeof o === "string" && o.trim() !== "")) {
      errors.push({ index: i, message: "All options must be non-empty strings" });
      continue;
    }

    if ("answer" in item && item.answer != null) {
      if (typeof item.answer !== "number" || !Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.options.length) {
        errors.push({ index: i, message: `answer must be 0-${item.options.length - 1}` });
        continue;
      }
    }

    if ("explanation" in item && item.explanation != null) {
      if (typeof item.explanation !== "string" || item.explanation.trim() === "") {
        errors.push({ index: i, message: "explanation must be a non-empty string if provided" });
        continue;
      }
    }

    valid.push({
      domain_id: item.domain_id,
      question: item.question,
      options: item.options,
      answer: item.answer ?? null,
      explanation: item.explanation ?? null,
    });
  }

  return { valid, errors };
}

export function ImportForm({ onImport, domains }: ImportFormProps) {
  const [parsed, setParsed] = useState<ImportQuestion[] | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const processFile = useCallback(async (file: File | undefined) => {
    setParsed(null);
    setErrors([]);
    setFileError(null);
    setSuccess(false);
    setFileName(file?.name ?? null);

    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setFileError("File must be a .json file");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { valid, errors: validationErrors } = validateQuestions(data);
      setErrors(validationErrors);
      if (valid.length > 0) setParsed(valid);
    } catch {
      setFileError("Invalid JSON file");
    }
  }, []);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => processFile(e.target.files?.[0]),
    [processFile]
  );

  const handleConfirm = useCallback(async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      await onImport(parsed);
      setSuccess(true);
      setParsed(null);
    } finally {
      setImporting(false);
    }
  }, [parsed, onImport]);

  const domainMap = Object.fromEntries(domains.map((d) => [d.id, d.name]));

  const summary = parsed
    ? parsed.reduce<Record<number, number>>((acc, q) => {
        acc[q.domain_id] = (acc[q.domain_id] || 0) + 1;
        return acc;
      }, {})
    : null;

  return (
    <div className="space-y-5">
      <label
        htmlFor="import-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          processFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center text-center gap-3 px-6 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
          dragging
            ? "border-cissp-teal bg-cissp-teal/[0.08]"
            : "border-cissp-border bg-cissp-card hover:border-cissp-teal/50 hover:bg-cissp-card-hover"
        }`}
      >
        <span className="h-12 w-12 rounded-xl bg-cissp-teal/10 border border-cissp-teal/20 text-cissp-teal flex items-center justify-center">
          <Icons.Upload size={20} />
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">Upload JSON file</span>
          <span className="block text-xs text-cissp-text-muted mt-1">
            {fileName ? fileName : "Drag and drop, or click to browse"}
          </span>
        </span>
        <input
          id="import-file"
          type="file"
          accept=".json"
          onChange={handleFile}
          className="sr-only"
        />
      </label>

      {fileError && (
        <div role="alert" className="p-3.5 bg-cissp-red/10 border border-cissp-red/30 rounded-xl text-sm text-cissp-red">
          {fileError}
        </div>
      )}

      {errors.length > 0 && (
        <div role="alert" className="p-3.5 bg-cissp-red/10 border border-cissp-red/30 rounded-xl text-sm text-cissp-red space-y-1">
          <div className="font-semibold">Validation errors:</div>
          <ul className="space-y-0.5 max-h-48 overflow-y-auto text-cissp-red-light">
            {errors.map((err, i) => (
              <li key={i}>
                {err.index >= 0 ? `Item ${err.index}: ` : ""}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary && parsed && (
        <div className="p-5 bg-cissp-card border border-cissp-border rounded-2xl space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="text-cissp-green">
              <Icons.Check size={16} />
            </span>
            Preview: {parsed.length} valid question{parsed.length !== 1 ? "s" : ""}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(summary)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([domainId, count]) => (
                <div
                  key={domainId}
                  className="text-xs text-cissp-text-secondary flex items-center justify-between gap-3 bg-white/[0.04] px-3 py-2 rounded-lg"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: domainColor(Number(domainId)) }}
                    />
                    <span className="truncate">
                      Domain {domainId}: {domainMap[Number(domainId)] || "Unknown"}
                    </span>
                  </span>
                  <span className="text-cissp-text-muted tabular-nums">{count}Q</span>
                </div>
              ))}
          </div>
          <Button variant="primary" className="w-full" onClick={handleConfirm} disabled={importing}>
            {importing ? "Importing..." : `Import ${parsed.length} Questions`}
          </Button>
        </div>
      )}

      {success && (
        <div role="status" className="flex items-center gap-2 p-3.5 bg-cissp-green/10 border border-cissp-green/30 rounded-xl text-sm text-cissp-green">
          <Icons.Check size={16} />
          Questions imported successfully!
        </div>
      )}
    </div>
  );
}
