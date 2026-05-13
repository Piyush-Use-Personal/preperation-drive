"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Folder, FolderPlus, Home } from "lucide-react";
import { SurfaceCard } from "@/components/design/SurfaceCard";
import { withPromptDialog, type WithPromptDialogProps } from "@/components/design/withPromptDialog";

type Folder = { id: string; name: string; parentId: string | null };

function DrivePage({ promptText }: WithPromptDialogProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [homeFolderId, setHomeFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        if (cancelled) return;
        setHomeFolderId(me.homeFolderId ?? null);
        const res = await fetch("/api/folders");
        const data = await res.json();
        if (cancelled) return;
        setFolders(data.folders ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const home =
    folders.find((f) => f.name === "Home") ??
    (homeFolderId ? { id: homeFolderId, name: "Home", parentId: null } : null);

  async function refreshFolders() {
    const res = await fetch("/api/folders");
    const data = await res.json();
    setFolders(data.folders ?? []);
  }

  return (
    <div className="pt-4">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Drive</h1>
          <p className="mt-1 text-sm text-[#5f6b66]">Clean folders, quick navigation.</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            const name = await promptText({
              title: "Create folder",
              label: "Folder name",
              placeholder: "2026 preparation",
              confirmText: "Create folder",
            });
            if (!name) return;
            await fetch("/api/folders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, parentId: null }),
            });
            await refreshFolders();
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] active:scale-[0.98]"
        >
          <FolderPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
          New
        </button>
      </header>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[60px] animate-pulse rounded-[var(--radius)] bg-[#dce6e1]" />
          ))}
        </div>
      )}

      {!loading && !home && <p className="text-sm text-[#5f6b66]">Could not load Home folder.</p>}

      <div className="flex flex-col gap-2.5">
        {home && (
          <Link href={`/folder/${home.id}`}>
            <SurfaceCard className="flex items-center gap-3 p-4 transition active:scale-[0.99]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#dff0e8] text-[var(--primary)]">
                <Home className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">Home</p>
                <p className="text-xs text-[#5f6b66]">Default space for files</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
            </SurfaceCard>
          </Link>
        )}

        {folders
          .filter((f) => f.name !== "Home")
          .map((f) => (
            <Link key={f.id} href={`/folder/${f.id}`}>
              <SurfaceCard className="flex items-center gap-3 p-4 transition active:scale-[0.99]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf3f0] text-[#55645f]">
                  <Folder className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{f.name}</p>
                  <p className="text-xs text-[#5f6b66]">Folder</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
              </SurfaceCard>
            </Link>
          ))}
      </div>

      {folders.filter((f) => f.name !== "Home").length === 0 && home && !loading && (
        <p className="mt-6 text-center text-sm text-[#5f6b66]">Only Home at root. Open Home to add files.</p>
      )}
    </div>
  );
}

export default withPromptDialog(DrivePage);
