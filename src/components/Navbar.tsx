"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Icons, buttonClass } from "./ui";

const NAV_LINKS = [
  { href: "/history", label: "History" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/review", label: "Review" },
  { href: "/import", label: "Import" },
];

export function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  };

  const linkClass = (href: string) =>
    `px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
      pathname.startsWith(href)
        ? "text-white bg-white/[0.08]"
        : "text-cissp-text-secondary hover:text-white hover:bg-white/5"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-cissp-border bg-cissp-dark/75 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 h-14">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMenuOpen(false)}>
          <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-cissp-teal to-cissp-accent flex items-center justify-center text-cissp-dark shadow-[0_0_20px_-4px_rgba(95,195,212,0.6)]">
            <Icons.Shield size={17} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">
            CISSP <span className="text-cissp-text-muted font-normal">Prep</span>
          </span>
        </Link>

        {!loading && user && (
          <>
            <div className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                  {l.label}
                </Link>
              ))}
              <span className="w-px h-5 bg-cissp-border mx-2" />
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-cissp-text-muted hover:text-cissp-red hover:bg-cissp-red/10 transition-colors cursor-pointer"
                title="Logout"
                aria-label="Logout"
              >
                <Icons.Logout size={16} />
              </button>
            </div>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="sm:hidden p-2 rounded-md text-cissp-text-secondary hover:bg-white/5 cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <Icons.Menu />
            </button>
          </>
        )}
        {!loading && !user && pathname !== "/login" && (
          <Link href="/login" className={buttonClass("primary", "sm")}>
            Login
          </Link>
        )}
      </div>

      {menuOpen && user && (
        <div className="sm:hidden border-t border-cissp-border px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={linkClass(l.href)}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="text-left px-3 py-1.5 rounded-md text-[13px] font-medium text-cissp-red hover:bg-cissp-red/10 cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
