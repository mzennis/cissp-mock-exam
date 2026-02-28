import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const seedDir = __dirname;

async function seed() {
  // Seed domains
  const domains = JSON.parse(readFileSync(join(seedDir, "domains.json"), "utf-8"));
  const { error: domainError } = await supabase
    .from("domains")
    .upsert(domains, { onConflict: "id" });
  if (domainError) {
    console.error("Domain seed error:", domainError);
    process.exit(1);
  }
  console.log(`Seeded ${domains.length} domains`);

  // Seed questions per domain
  let totalQuestions = 0;
  for (let i = 1; i <= 8; i++) {
    const filePath = join(seedDir, `domain${i}_questions.json`);
    try {
      const questions = JSON.parse(readFileSync(filePath, "utf-8"));
      const { error } = await supabase.from("questions").insert(questions);
      if (error) {
        console.error(`Domain ${i} seed error:`, error);
        continue;
      }
      totalQuestions += questions.length;
      console.log(`Domain ${i}: ${questions.length} questions`);
    } catch {
      console.log(`No file for domain ${i}, skipping`);
    }
  }
  console.log(`\nTotal: ${totalQuestions} questions seeded`);
}

seed();
