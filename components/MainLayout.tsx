"use client";

import { BottomNav } from "@/components/BottomNav";
import { Brand } from "@/components/Brand";
import { usePathname } from "next/navigation";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFocusMode = pathname.startsWith("/attempt/") || pathname.startsWith("/result/");

  if (isFocusMode) {
    return (
      <div className="min-h-dvh w-full px-4 pb-10 pt-4 md:px-8 lg:px-12">
        <main className="mx-auto w-full max-w-[1100px]">{children}</main>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[1180px] px-3 pb-24 pt-[max(env(safe-area-inset-top),0.5rem)] sm:px-4 md:pb-8 md:pt-6">
      <div className="mb-3 px-1 md:hidden">
        <Brand compact />
      </div>
      <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <div className="hidden space-y-4 md:block">
          <div className="rounded-[26px] border border-[#d8e3dd] bg-white/80 p-4 shadow-[0_10px_30px_rgba(17,24,39,0.06)]">
            <Brand compact />
          </div>
          <BottomNav className="!relative !inset-auto !translate-y-0 !pb-0" />
        </div>
        <BottomNav className="md:hidden" />
        <main className="md:min-h-[calc(100dvh-3rem)] md:rounded-[28px] md:border md:border-[#d8e3dd] md:bg-white/55 md:p-6 md:shadow-[0_18px_40px_rgba(17,24,39,0.07)] lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
