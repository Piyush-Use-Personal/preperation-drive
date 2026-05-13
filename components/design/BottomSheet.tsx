"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="animate-sheet-up surface-shell relative mx-auto w-full max-w-[560px] rounded-t-2xl bg-white px-4 pb-8 pt-3 shadow-2xl ring-1 ring-[var(--ring-soft)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d3ddd8]" aria-hidden />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="sheet-title" className="text-base font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
