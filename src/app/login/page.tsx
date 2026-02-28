"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {isSignUp ? "Create Account" : "Login"}
        </h1>
        <p className="text-cissp-text-muted text-sm text-center mb-8">
          {isSignUp
            ? "Track your exam history and bookmarks"
            : "Welcome back"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-cissp-card border border-cissp-border rounded-lg text-cissp-text text-sm placeholder:text-cissp-text-muted focus:outline-none focus:border-cissp-teal/50"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-cissp-card border border-cissp-border rounded-lg text-cissp-text text-sm placeholder:text-cissp-text-muted focus:outline-none focus:border-cissp-teal/50"
          />

          {error && (
            <div className="text-cissp-red text-sm bg-cissp-red/10 border border-cissp-red/30 rounded-lg px-4 py-2">
              {error}
            </div>
          )}
          {message && (
            <div className="text-cissp-green text-sm bg-cissp-green/10 border border-cissp-green/30 rounded-lg px-4 py-2">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cissp-accent text-white rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading
              ? "..."
              : isSignUp
              ? "Sign Up"
              : "Login"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setMessage("");
          }}
          className="w-full mt-4 text-cissp-text-muted text-sm text-center cursor-pointer hover:text-cissp-text-secondary transition-colors"
        >
          {isSignUp
            ? "Already have an account? Login"
            : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
