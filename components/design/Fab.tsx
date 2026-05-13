"use client";

import { Plus } from "lucide-react";

export function Fab({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg shadow-[#295a4f]/30 transition hover:scale-[1.03] hover:bg-[var(--primary-hover)] active:scale-95 md:bottom-8 md:right-10 ${className}`.trim()}
    >
      <Plus className="h-7 w-7" strokeWidth={2.25} />
    </button>
  );
}
