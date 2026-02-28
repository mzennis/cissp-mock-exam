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

const sql = readFileSync(
  join(__dirname, "migrations", "001_initial_schema.sql"),
  "utf-8"
);

// Split into individual statements
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

async function migrate() {
  for (const stmt of statements) {
    const { error } = await supabase.rpc("exec_sql", {
      sql_string: stmt + ";",
    });
    if (error) {
      // Try alternative: if exec_sql doesn't exist, we need the SQL editor
      console.error("Statement failed:", stmt.substring(0, 60) + "...");
      console.error("Error:", error.message);
      console.error(
        "\n=> Run the migration SQL manually in Supabase Dashboard > SQL Editor"
      );
      console.error("   File: supabase/migrations/001_initial_schema.sql");
      process.exit(1);
    }
    console.log("OK:", stmt.substring(0, 60) + "...");
  }
  console.log("\nMigration complete!");
}

migrate();
