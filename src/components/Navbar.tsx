"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav className="border-b border-cissp-border">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-widest uppercase text-cissp-teal hover:text-white transition-colors"
        >
          CISSP Prep
        </Link>

        <div className="flex items-center gap-4">
          {!loading && user && (
            <>
              <Link
                href="/history"
                className="text-xs text-cissp-text-secondary hover:text-white transition-colors"
              >
                History
              </Link>
              <Link
                href="/bookmarks"
                className="text-xs text-cissp-text-secondary hover:text-white transition-colors"
              >
                Bookmarks
              </Link>
              <Link
                href="/review"
                className="text-xs text-cissp-text-secondary hover:text-white transition-colors"
              >
                Review
              </Link>
              <Link
                href="/import"
                className="text-xs text-cissp-text-secondary hover:text-white transition-colors"
              >
                Import
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-cissp-text-muted hover:text-cissp-red transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          )}
          {!loading && !user && (
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-md bg-cissp-accent text-cissp-text-secondary hover:text-white border border-cissp-border transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
