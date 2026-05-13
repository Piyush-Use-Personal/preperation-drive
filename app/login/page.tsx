"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.replace("/home");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1120px] items-center justify-center px-4 py-8">
      <div className="w-full max-w-[460px] rounded-[28px] border border-[#d8e3dd] bg-white/88 p-6 shadow-[0_20px_45px_rgba(17,24,39,0.08)] md:p-8">
        <Brand center />
        <h1 className="mb-6 mt-6 text-center text-xl font-semibold text-gray-900">Sign in</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-[12px] border border-[#d8e3dd] bg-white px-3 outline-none ring-[#9ac9ba] focus:ring-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-[12px] border border-[#d8e3dd] bg-white px-3 outline-none ring-[#9ac9ba] focus:ring-2"
            required
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-[12px] bg-[var(--primary)] font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          No account?{" "}
          <Link href="/signup" className="font-medium text-[var(--primary)]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
