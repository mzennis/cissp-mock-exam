"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { ImportForm } from "@/components/ImportForm";
import type { Domain } from "@/lib/types";

export default function ImportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const supabase = createClient();
    supabase
      .from("domains")
      .select("*")
      .order("id")
      .then(({ data }) => {
        if (data) setDomains(data);
      });
  }, [user, authLoading, router]);

  const handleImport = async (
    questions: {
      domain_id: number;
      question: string;
      options: string[];
      answer?: number | null;
      explanation?: string | null;
    }[]
  ) => {
    if (!user) return;
    const supabase = createClient();

    const rows = questions.map((q) => ({
      user_id: user.id,
      domain_id: q.domain_id,
      question: q.question,
      options: q.options,
      answer: q.answer ?? null,
      explanation: q.explanation ?? null,
    }));

    const { error } = await supabase.from("user_questions").insert(rows);
    if (error) throw error;

    setImportedCount(questions.length);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-cissp-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Import Questions</h1>
        <p className="text-sm text-cissp-text-secondary mb-6">
          Upload a JSON file with your own CISSP practice questions.
        </p>

        <ImportForm onImport={handleImport} domains={domains} />

        {importedCount !== null && (
          <div className="mt-6 p-4 bg-cissp-card border border-cissp-border rounded-lg flex items-center justify-between">
            <span className="text-sm text-cissp-text-secondary">
              {importedCount} question{importedCount !== 1 ? "s" : ""} imported
            </span>
            <Link
              href="/quiz/custom"
              className="text-sm text-cissp-teal hover:text-white transition-colors"
            >
              Practice now &rarr;
            </Link>
          </div>
        )}

        <div className="mt-8 p-4 bg-white/[0.03] rounded-lg border border-cissp-border">
          <div className="text-xs font-semibold text-cissp-text-secondary mb-2">
            Expected JSON format
          </div>
          <pre className="text-xs text-cissp-text-muted overflow-x-auto">
{`[
  {
    "domain_id": 1,
    "question": "What is the primary purpose of...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,            // optional (0-based index)
    "explanation": "..."    // optional
  }
]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
