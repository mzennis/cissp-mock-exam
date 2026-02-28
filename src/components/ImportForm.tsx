"use client";

import { useState, useCallback } from "react";
import type { Domain } from "@/lib/types";

interface ImportQuestion {
  domain_id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
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

    const missing = ["domain_id", "question", "options", "answer", "explanation"].filter(
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

    if (!Array.isArray(item.options) || item.options.length !== 4) {
      errors.push({ index: i, message: "options must be an array of exactly 4 strings" });
      continue;
    }

    if (!item.options.every((o: unknown) => typeof o === "string" && o.trim() !== "")) {
      errors.push({ index: i, message: "All options must be non-empty strings" });
      continue;
    }

    if (typeof item.answer !== "number" || !Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3) {
      errors.push({ index: i, message: "answer must be 0, 1, 2, or 3" });
      continue;
    }

    if (typeof item.explanation !== "string" || item.explanation.trim() === "") {
      errors.push({ index: i, message: "explanation must be a non-empty string" });
      continue;
    }

    valid.push({
      domain_id: item.domain_id,
      question: item.question,
      options: item.options,
      answer: item.answer,
      explanation: item.explanation,
    });
  }

  return { valid, errors };
}

export function ImportForm({ onImport, domains }: ImportFormProps) {
  const [parsed, setParsed] = useState<ImportQuestion[] | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setParsed(null);
      setErrors([]);
      setFileError(null);
      setSuccess(false);

      const file = e.target.files?.[0];
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
    },
    []
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
    <div className="space-y-6">
      <div>
        <label htmlFor="import-file" className="block text-sm text-cissp-text-secondary mb-2">
          Upload JSON file
        </label>
        <input
          id="import-file"
          type="file"
          accept=".json"
          onChange={handleFile}
          className="block w-full text-sm text-cissp-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-cissp-border file:text-sm file:bg-cissp-card file:text-cissp-text-secondary file:cursor-pointer hover:file:bg-cissp-card-hover"
        />
      </div>

      {fileError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {fileError}
        </div>
      )}

      {errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 space-y-1">
          <div className="font-semibold">Validation errors:</div>
          {errors.map((err, i) => (
            <div key={i}>
              {err.index >= 0 ? `Item ${err.index}: ` : ""}
              {err.message}
            </div>
          ))}
        </div>
      )}

      {summary && parsed && (
        <div className="p-4 bg-cissp-card border border-cissp-border rounded-lg space-y-3">
          <div className="text-sm font-semibold text-white">
            Preview: {parsed.length} valid question{parsed.length !== 1 ? "s" : ""}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(summary)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([domainId, count]) => (
                <div
                  key={domainId}
                  className="text-xs text-cissp-text-secondary flex justify-between bg-white/5 px-3 py-1.5 rounded"
                >
                  <span>Domain {domainId}: {domainMap[Number(domainId)] || "Unknown"}</span>
                  <span className="text-cissp-text-muted">{count}Q</span>
                </div>
              ))}
          </div>
          <button
            onClick={handleConfirm}
            disabled={importing}
            className="w-full py-2.5 rounded-lg bg-cissp-teal text-white text-sm font-semibold cursor-pointer hover:bg-cissp-teal/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? "Importing..." : `Import ${parsed.length} Questions`}
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400">
          Questions imported successfully!
        </div>
      )}
    </div>
  );
}
