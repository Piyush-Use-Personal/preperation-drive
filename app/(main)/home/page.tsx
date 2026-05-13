"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileCheck2, FileText, FolderPlus, History } from "lucide-react";
import { BottomSheet } from "@/components/design/BottomSheet";
import { Fab } from "@/components/design/Fab";
import { SurfaceCard } from "@/components/design/SurfaceCard";
import { withPromptDialog, type WithPromptDialogProps } from "@/components/design/withPromptDialog";

type FileItem = {
  id: string;
  name: string;
  locked: boolean;
  folderId: string;
  attemptsCount: number;
};

type AttemptRow = {
  id: string;
  fileId: string;
  fileName: string;
  score: number;
  maxScore: number;
  status: "pending" | "evaluated";
  submittedAt: string;
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function HomePage({ promptText }: WithPromptDialogProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [homeFolderId, setHomeFolderId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [latestAttempts, setLatestAttempts] = useState<AttemptRow[]>([]);
  const [latestReviewed, setLatestReviewed] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, recent, dashboard] = await Promise.all([
          fetch("/api/auth/me").then((r) => r.json()),
          fetch("/api/files/recent").then((r) => r.json()),
          fetch("/api/dashboard/records").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setHomeFolderId(me.homeFolderId ?? null);
        setUserEmail(me.user?.email ?? null);
        setFiles(recent.files ?? []);
        setLatestAttempts(dashboard.latestAttempts ?? []);
        setLatestReviewed(dashboard.latestReviewed ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = userEmail?.split("@")[0] ?? "there";

  async function createFile() {
    if (!homeFolderId) return;
    const name = await promptText({
      title: "Create exam file",
      label: "File name",
      placeholder: "Midterm Physics",
      confirmText: "Create file",
    });
    if (!name) return;
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, folderId: homeFolderId }),
    });
    const data = await res.json();
    if (res.ok && data.file?.id) {
      setCreateOpen(false);
      router.push(`/file/${data.file.id}`);
    }
  }

  async function createFolder() {
    if (!homeFolderId) return;
    const name = await promptText({
      title: "Create folder",
      label: "Folder name",
      placeholder: "Chemistry notes",
      confirmText: "Create folder",
    });
    if (!name) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: null }),
    });
    if (res.ok) {
      setCreateOpen(false);
      router.push("/drive");
    }
  }

  return (
    <div className="relative pt-4">
      <header className="mb-6">
        <p className="text-sm text-[#5f6b66]">{greeting()},</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-gray-900">
          {displayName.charAt(0).toUpperCase()}
          {displayName.slice(1)}
        </h1>
        <p className="mt-1 text-sm text-[#5f6b66]">Recent exams and quick create</p>
      </header>

      <section className="mb-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Recent files</h2>
          <Link href="/drive" className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--primary)]">
            Drive
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
        {loading && (
          <div className="space-y-2">
            <div className="h-24 animate-pulse rounded-[var(--radius)] bg-gray-200/80" />
            <div className="h-24 animate-pulse rounded-[var(--radius)] bg-[#dce6e1]" />
          </div>
        )}
        {!loading && files.length === 0 && (
          <SurfaceCard className="p-8 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-[#a8bab3]" strokeWidth={1.5} />
            <p className="text-sm text-[#47534f]">No files yet</p>
            <p className="mt-1 text-xs text-[#5f6b66]">Tap + to create your first exam.</p>
          </SurfaceCard>
        )}
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pl-1 pr-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pr-0 lg:grid-cols-3">
          {files.map((f) => (
            <Link key={f.id} href={`/file/${f.id}`} className="snap-start scroll-ml-1 first:scroll-ml-0 md:min-w-0">
              <SurfaceCard as="article" className="flex h-[118px] w-[168px] shrink-0 flex-col p-4 active:scale-[0.99] md:h-[128px] md:w-full">
                <FileText className="mb-2 h-5 w-5 text-[var(--primary)]" strokeWidth={2} />
                <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">{f.name}</p>
                <p className="mt-auto text-[11px] text-[#5f6b66]">
                  {f.attemptsCount} attempt{f.attemptsCount === 1 ? "" : "s"}
                  {f.locked ? " · Locked" : ""}
                </p>
              </SurfaceCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--primary)]" strokeWidth={2.2} />
          <h2 className="text-sm font-semibold text-gray-800">Latest attempt records</h2>
        </div>
        {latestAttempts.length === 0 ? (
          <SurfaceCard className="p-4 text-sm text-[#5f6b66]">No attempts yet.</SurfaceCard>
        ) : (
          <div className="flex flex-col gap-2.5">
            {latestAttempts.map((a) => (
              <Link key={a.id} href={`/result/${a.id}`}>
                <SurfaceCard className="flex items-center justify-between gap-3 p-4 transition active:scale-[0.99]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{a.fileName}</p>
                    <p className="mt-0.5 text-xs text-[#5f6b66]">
                      {a.score} / {a.maxScore} · {a.status}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--primary)]">Open</span>
                </SurfaceCard>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-[var(--primary)]" strokeWidth={2.2} />
          <h2 className="text-sm font-semibold text-gray-800">Latest reviewed records</h2>
        </div>
        {latestReviewed.length === 0 ? (
          <SurfaceCard className="p-4 text-sm text-[#5f6b66]">No reviewed attempts yet.</SurfaceCard>
        ) : (
          <div className="flex flex-col gap-2.5">
            {latestReviewed.map((a) => (
              <Link key={a.id} href={`/result/${a.id}`}>
                <SurfaceCard className="flex items-center justify-between gap-3 p-4 transition active:scale-[0.99]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{a.fileName}</p>
                    <p className="mt-0.5 text-xs text-[#5f6b66]">
                      {a.score} / {a.maxScore} · evaluated
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--primary)]">Open</span>
                </SurfaceCard>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BottomSheet open={createOpen} title="Create" onClose={() => setCreateOpen(false)}>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => createFile()}
            className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#d8e3dd] bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 transition hover:border-[#a7cabb] hover:bg-[#f0f7f4]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dff0e8] text-[var(--primary)]">
              <FileText className="h-5 w-5" strokeWidth={2} />
            </span>
            <span>
              New exam file
              <span className="mt-0.5 block text-xs font-normal text-[#5f6b66]">Build questions and share</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => createFolder()}
            className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#d8e3dd] bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 transition hover:border-[#a7cabb] hover:bg-[#f0f7f4]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf3f0] text-[#4d5b56]">
              <FolderPlus className="h-5 w-5" strokeWidth={2} />
            </span>
            <span>
              New folder
              <span className="mt-0.5 block text-xs font-normal text-[#5f6b66]">Organize in Drive</span>
            </span>
          </button>
        </div>
      </BottomSheet>

      <Fab label="Create" onClick={() => setCreateOpen(true)} />
    </div>
  );
}

export default withPromptDialog(HomePage);
