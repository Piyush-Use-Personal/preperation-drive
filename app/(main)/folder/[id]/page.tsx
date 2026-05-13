"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, FileText, Folder, FolderPlus } from "lucide-react";
import { SurfaceCard } from "@/components/design/SurfaceCard";
import { withPromptDialog, type WithPromptDialogProps } from "@/components/design/withPromptDialog";

type Folder = { id: string; name: string; parentId: string | null };
type FileRow = { id: string; name: string; locked: boolean; attemptsCount: number };

function FolderPage({ promptText }: WithPromptDialogProps) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<{
    folder: Folder;
    breadcrumbs: Folder[];
    siblings: Folder[];
    folders: Folder[];
    files: FileRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/folders/${id}`);
        const j = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setData(null);
          return;
        }
        setData(j);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-[var(--radius)] bg-gray-200/70" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-red-600">Folder not found.</p>
        <Link href="/drive" className="mt-4 block text-sm font-medium text-indigo-600">
          Back to Drive
        </Link>
      </div>
    );
  }

  const { folder, folders, files, siblings, breadcrumbs } = data;

  async function moveFileToFolder(fileId: string, targetFolderId: string) {
    if (!fileId || !targetFolderId || targetFolderId === folder.id) return;
    await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: targetFolderId }),
    });
    const res = await fetch(`/api/folders/${id}`);
    const next = await res.json();
    setData(next);
    setDraggingFileId(null);
    setDropTargetFolderId(null);
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => {
            if (folder.parentId) router.push(`/folder/${folder.parentId}`);
            else router.push("/drive");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back
        </button>
      </div>
      <header className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">{folder.name}</h1>
        <p className="mt-0.5 text-sm text-gray-500">Folders first, then files</p>
      </header>

      <section className="mb-5 rounded-xl border border-[#d8e3dd] bg-white/85 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#5f6b66]">Path</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {breadcrumbs.map((b, idx) => (
            <div key={b.id} className="inline-flex items-center gap-1.5">
              <Link
                href={`/folder/${b.id}`}
                onDragOver={(e) => {
                  if (!draggingFileId) return;
                  e.preventDefault();
                  setDropTargetFolderId(b.id);
                }}
                onDragLeave={() => {
                  if (dropTargetFolderId === b.id) setDropTargetFolderId(null);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  if (!draggingFileId) return;
                  await moveFileToFolder(draggingFileId, b.id);
                }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  dropTargetFolderId === b.id
                    ? "bg-[#dff0e8] text-[var(--primary)]"
                    : "bg-[#edf3f0] text-[#4f605b]"
                }`}
              >
                {b.name}
              </Link>
              {idx < breadcrumbs.length - 1 && <span className="text-xs text-[#6b7a74]">&gt;</span>}
            </div>
          ))}
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Sibling folders</h2>
          <div className="flex flex-col gap-2">
            {siblings.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => router.push(`/folder/${s.id}`)}
                onDragOver={(e) => {
                  if (!draggingFileId) return;
                  e.preventDefault();
                  setDropTargetFolderId(s.id);
                }}
                onDragLeave={() => {
                  if (dropTargetFolderId === s.id) setDropTargetFolderId(null);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  if (!draggingFileId) return;
                  await moveFileToFolder(draggingFileId, s.id);
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                  dropTargetFolderId === s.id
                    ? "border-[#99c7b6] bg-[#ecf7f2] text-[var(--primary)]"
                    : "border-[#d8e3dd] bg-white text-[#495652] hover:bg-[#f4f8f6]"
                }`}
              >
                <Folder className="h-4 w-4" strokeWidth={2} />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={async () => {
            const name = await promptText({
              title: "Create subfolder",
              label: "Subfolder name",
              placeholder: "Week 1",
              confirmText: "Create folder",
            });
            if (!name) return;
            await fetch("/api/folders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, parentId: folder.id }),
            });
            const res = await fetch(`/api/folders/${id}`);
            setData(await res.json());
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 active:scale-[0.99]"
        >
          <FolderPlus className="h-4 w-4" strokeWidth={2} />
          Subfolder
        </button>
        <button
          type="button"
          onClick={async () => {
            const name = await promptText({
              title: "Create exam file",
              label: "File name",
              placeholder: "Mock test 3",
              confirmText: "Create file",
            });
            if (!name) return;
            const res = await fetch("/api/files", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, folderId: folder.id }),
            });
            const j = await res.json();
            if (res.ok && j.file?.id) router.push(`/file/${j.file.id}`);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99]"
        >
          <FileText className="h-4 w-4" strokeWidth={2} />
          New file
        </button>
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Folders</h2>
      {folders.length === 0 && <p className="mb-4 text-sm text-gray-500">No subfolders</p>}
      <div className="mb-6 flex flex-col gap-2.5">
        {folders.map((f) => (
          <Link key={f.id} href={`/folder/${f.id}`}>
            <SurfaceCard className="flex items-center gap-3 p-4 transition active:scale-[0.99]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <Folder className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{f.name}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
            </SurfaceCard>
          </Link>
        ))}
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Files</h2>
      {files.length === 0 && (
        <SurfaceCard className="border border-dashed border-gray-200/80 p-8 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" strokeWidth={1.5} />
          <p className="text-sm text-gray-600">No files here yet</p>
          <p className="mt-1 text-xs text-gray-500">Create an exam file above.</p>
        </SurfaceCard>
      )}
      <div className="flex flex-col gap-2.5">
        {files.map((f) => (
          <SurfaceCard
            key={f.id}
            className="p-4 transition active:scale-[0.99]"
            as="article"
          >
            <div
              draggable
              onDragStart={() => setDraggingFileId(f.id)}
              onDragEnd={() => {
                setDraggingFileId(null);
                setDropTargetFolderId(null);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FileText className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <Link href={`/file/${f.id}`} className="font-medium leading-snug text-gray-900 hover:text-[var(--primary)]">
                      {f.name}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">{f.attemptsCount} attempts</p>
                  </div>
                </div>
                {f.locked && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    Locked
                  </span>
                )}
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}

export default withPromptDialog(FolderPage);
