"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, FileText, Share2 } from "lucide-react";
import { SurfaceCard } from "@/components/design/SurfaceCard";

type Row = { id: string; name: string; locked: boolean };

export default function SharedPage() {
  const [files, setFiles] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shared");
        const j = await res.json();
        if (cancelled) return;
        setFiles(j.files ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pt-4">
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Shared with me</h1>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#dff0e8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--primary)]"
            title="Items shared by email"
          >
            <Share2 className="h-3 w-3" strokeWidth={2.5} />
            Shared
          </span>
        </div>
        <p className="mt-1 text-sm text-[#5f6b66]">Same layout as Drive, filtered to shared files.</p>
      </header>
      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-[var(--radius)] bg-[#dce6e1]" />
          ))}
        </div>
      )}
      {!loading && files.length === 0 && (
        <SurfaceCard className="p-10 text-center">
          <Share2 className="mx-auto mb-3 h-9 w-9 text-[#a8bab3]" strokeWidth={1.5} />
          <p className="text-sm text-[#47534f]">Nothing shared yet</p>
          <p className="mt-1 text-xs text-[#5f6b66]">When someone shares an exam, it appears here.</p>
        </SurfaceCard>
      )}
      <div className="flex flex-col gap-2.5">
        {files.map((f) => (
          <SurfaceCard key={f.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dff0e8] text-[var(--primary)]">
                  <FileText className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="font-medium leading-snug text-gray-900">{f.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                      <Share2 className="h-3 w-3" strokeWidth={2.5} />
                      Shared
                    </span>
                    {f.locked && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link
                  href={`/file/${f.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d8e3dd] bg-white px-3 text-xs font-semibold text-[#46534f] transition hover:bg-[#f0f7f4] active:scale-[0.98]"
                >
                  View details
                </Link>
                <Link
                  href={`/attempt/${f.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--primary)] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] active:scale-[0.98]"
                >
                  Attempt
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(`/api/files/${f.id}/clone`, { method: "POST" });
                    const j = await res.json();
                    if (res.ok && j.file?.id) {
                      window.location.href = `/file/${j.file.id}`;
                    }
                  }}
                  className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-[#d8e3dd] bg-white px-3 text-xs font-semibold text-gray-800 transition hover:bg-[#f0f7f4] active:scale-[0.98]"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                  Clone
                </button>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
