"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Home, Share2, User } from "lucide-react";

const tabs = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/drive", label: "Drive", Icon: FolderOpen },
  { href: "/shared", label: "Shared", Icon: Share2 },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-[#d8e3dd]/90 bg-[#f7fbf9]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:sticky md:top-6 md:z-20 md:h-fit md:rounded-[26px] md:border md:border-[#d8e3dd] md:bg-white/80 md:p-2 md:pb-2 md:shadow-[0_10px_30px_rgba(17,24,39,0.06)] ${className}`.trim()}
    >
      <div className="mx-auto flex w-full max-w-[560px] justify-around gap-1 px-2 py-2 md:max-w-none md:flex-col md:px-1 md:py-1">
        {tabs.map((t) => {
          const active =
            t.href === "/drive"
              ? pathname === "/drive" || pathname.startsWith("/folder/")
              : t.href === "/home"
                ? pathname === "/home"
                : pathname === t.href || pathname.startsWith(t.href + "/");
          const Icon = t.Icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex min-h-11 min-w-[72px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition-colors md:min-h-[52px] md:flex-row md:justify-start md:gap-2.5 md:px-3 md:text-sm ${
                active
                  ? "bg-[#dff0e8] text-[var(--primary)]"
                  : "text-[#6d7873] hover:bg-white/70 hover:text-[#40514b]"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.35 : 2} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
