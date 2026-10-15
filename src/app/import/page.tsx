"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { ImportForm } from "@/components/ImportForm";
import { ButtonLink, Card, Icons, LoadingState, PageContainer, PageHeader } from "@/components/ui";
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

  if (authLoading) return <LoadingState />;

  return (
    <PageContainer width="max-w-2xl">
      <PageHeader
        title="Import Questions"
        subtitle="Upload a JSON file with your own CISSP practice questions."
      />

      <ImportForm onImport={handleImport} domains={domains} />

      {importedCount !== null && (
        <Card className="mt-6 p-4 flex items-center justify-between gap-4">
          <span className="text-sm text-cissp-text-secondary">
            {importedCount} question{importedCount !== 1 ? "s" : ""} imported
          </span>
          <ButtonLink href="/quiz/custom" variant="primary" size="sm">
            Practice now <Icons.ArrowRight size={15} />
          </ButtonLink>
        </Card>
      )}

      <Card className="mt-8 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-cissp-border flex items-center justify-between">
          <span className="text-xs font-semibold text-cissp-text-secondary">Expected JSON format</span>
          <span className="text-[11px] text-cissp-text-dim font-mono">questions.json</span>
        </div>
        <pre className="p-4 text-xs leading-relaxed text-cissp-text-secondary font-mono overflow-x-auto bg-cissp-dark/40">
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
      </Card>
    </PageContainer>
  );
}
