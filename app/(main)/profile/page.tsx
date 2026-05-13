"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail } from "lucide-react";
import { SurfaceCard } from "@/components/design/SurfaceCard";

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setEmail(j.user?.email ?? null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="pt-4">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Profile</h1>
      <p className="mt-1 text-sm text-[#5f6b66]">Account</p>

      <SurfaceCard className="mt-6 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5f6b66]">Signed in as</p>
        <div className="mt-2 flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-[#7a8a84]" strokeWidth={2} />
          <p className="truncate text-sm font-medium text-gray-900">{email ?? "…"}</p>
        </div>
      </SurfaceCard>

      <button
        type="button"
        onClick={() => logout()}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#f4c8bf] bg-white text-sm font-semibold text-[#b8493a] transition hover:bg-[#fff3f1] active:scale-[0.99]"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        Sign out
      </button>
    </div>
  );
}
