"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Icons, PageContainer } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  };

  const switchMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setError("");
    setMessage("");
  };

  const inputClass =
    "w-full px-4 py-3 bg-cissp-dark/60 border border-cissp-border rounded-xl text-cissp-text text-sm placeholder:text-cissp-text-dim focus:outline-none focus:border-cissp-teal/60 focus:ring-4 focus:ring-cissp-teal/10 transition";

  return (
    <PageContainer width="max-w-md">
      <div className="pt-6 sm:pt-12">
        <div className="flex flex-col items-center text-center mb-8">
          <span className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cissp-teal to-cissp-accent flex items-center justify-center text-cissp-dark shadow-[0_0_32px_-6px_rgba(95,195,212,0.7)] mb-5">
            <Icons.Shield size={24} />
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-cissp-text-muted text-sm mt-1.5">
            {isSignUp
              ? "Track your exam history, bookmarks and weak spots."
              : "Log in to continue your CISSP prep."}
          </p>
        </div>

        <Card className="p-6 sm:p-7">
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-cissp-dark/60 border border-cissp-border" role="tablist">
            {[
              { label: "Login", signUp: false },
              { label: "Sign up", signUp: true },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={isSignUp === t.signUp}
                onClick={() => switchMode(t.signUp)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isSignUp === t.signUp
                    ? "bg-white/[0.08] text-white"
                    : "text-cissp-text-muted hover:text-cissp-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-cissp-text-secondary mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-cissp-text-secondary mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "At least 6 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </div>

            {error && (
              <div role="alert" className="text-cissp-red text-sm bg-cissp-red/10 border border-cissp-red/30 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}
            {message && (
              <div role="status" className="text-cissp-green text-sm bg-cissp-green/10 border border-cissp-green/30 rounded-xl px-4 py-2.5">
                {message}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full mt-1">
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-cissp-dark/30 border-t-cissp-dark animate-spin" />
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-cissp-text-dim mt-6">
          You can practice without an account — logging in saves your progress.
        </p>
      </div>
    </PageContainer>
  );
}
