"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Circle, Download, XCircle } from "lucide-react";
import { MarkdownText } from "@/components/design/MarkdownText";
import { SurfaceCard } from "@/components/design/SurfaceCard";
import { QuestionTypeBadge } from "@/components/design/QuestionTypeBadge";
import type { ReviewItem } from "@/lib/review";

type Q = {
  id: string;
  text: string;
  type: string;
  options: string[];
  marks: number;
  correctIndices?: number[];
  referenceAnswer?: string;
};

type AnswerRow = { questionId: string; optionIndices?: number[]; text?: string };

function formatOptionAnswer(q: Q, indices: number[] | undefined): string {
  if (!indices?.length) return "";
  return indices
    .map((idx) => (q.options[idx] ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function formatCorrectForExport(q: Q): string {
  if (q.type === "text") return (q.referenceAnswer ?? "").trim();
  const idx = q.correctIndices;
  if (!idx?.length) return "";
  return formatOptionAnswer(q, idx);
}

function formatGivenForExport(q: Q, ans: AnswerRow | undefined): string {
  if (q.type === "text") return (ans?.text ?? "").trim();
  return formatOptionAnswer(q, ans?.optionIndices);
}

function buildResultExportText(
  fileName: string,
  attemptId: string,
  score: number,
  maxScore: number,
  questions: Q[],
  answers: AnswerRow[],
): string {
  const rows = questions.map((q) => ({
    q: q.text.trim(),
    a: formatGivenForExport(q, answers.find((x) => x.questionId === q.id)),
    c: formatCorrectForExport(q),
  }));
  const nomenclature = [
    "# PrepDrive — result export (plain text file; JSON array below). UTF-8.",
    "# Nomenclature (each record): q = question prompt, a = answer given by learner, c = correct or reference answer (empty if not shown to this export).",
    `# Test: "${fileName.replace(/"/g, '\\"')}" | attemptId: ${attemptId} | score: ${score}/${maxScore}`,
  ].join("\n");
  const analyzeLine =
    "# ANALYZE_THIS_DOCUMENT: Review each item for correctness vs c, learning gaps, and concise feedback the learner could use.";
  const json = JSON.stringify(rows, null, 2);
  return `${nomenclature}\n${analyzeLine}\n\n${json}\n`;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  const [viewerRole, setViewerRole] = useState<"owner" | "participant" | null>(null);
  const [attempt, setAttempt] = useState<{
    fileId: string;
    score: number;
    maxScore: number;
    status: string;
    pendingEvaluation: boolean;
    answers: { questionId: string; optionIndices?: number[]; text?: string }[];
    textEvaluations: { questionId: string; marksAwarded: number; correct: boolean }[];
  } | null>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [file, setFile] = useState<{ id: string; name: string; questions: Q[] } | null>(null);
  const [grades, setGrades] = useState<Record<string, { marks: string; mode: "full" | "partial" | "zero" }>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/attempts/${attemptId}`);
    const j = await res.json();
    if (!res.ok) {
      setAttempt(null);
      return;
    }
    setViewerRole(j.viewerRole);
    setAttempt(j.attempt);
    setFile(j.file);
    setReview((j.review as ReviewItem[]) ?? []);
    const g: Record<string, { marks: string; mode: "full" | "partial" | "zero" }> = {};
    for (const q of j.file.questions as Q[]) {
      if (q.type === "text") {
        g[q.id] = { marks: String(q.marks), mode: "full" };
      }
    }
    for (const ev of j.attempt.textEvaluations ?? []) {
      const q = (j.file.questions as Q[]).find((item) => item.id === ev.questionId);
      const max = q?.marks ?? 0;
      const mode = ev.marksAwarded <= 0 ? "zero" : ev.marksAwarded >= max ? "full" : "partial";
      g[ev.questionId] = {
        marks: String(ev.marksAwarded),
        mode,
      };
    }
    setGrades(g);
  }

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        await load();
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when attempt changes
  }, [attemptId]);

  const reviewById = useMemo(() => Object.fromEntries(review.map((r) => [r.questionId, r])), [review]);

  async function saveEvaluation() {
    if (!file) return;
    const textQs = file.questions.filter((q) => q.type === "text");
    const payload = textQs.map((q) => ({
      questionId: q.id,
      marksAwarded: Number(grades[q.id]?.marks ?? 0),
      correct: Number(grades[q.id]?.marks ?? 0) >= q.marks,
    }));
    await fetch(`/api/attempts/${attemptId}/evaluate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grades: payload }),
    });
    router.replace(`/file/${file.id}`);
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <div className="h-48 animate-pulse rounded-[var(--radius)] bg-gray-200/70" />
      </div>
    );
  }

  if (!attempt || !file) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-red-600">Result not found.</p>
        <Link href="/home" className="mt-4 block text-sm font-medium text-indigo-600">
          Home
        </Link>
      </div>
    );
  }

  const isOwner = viewerRole === "owner";

  function downloadResultExport() {
    if (!file || !attempt) return;
    const text = buildResultExportText(
      file.name,
      attemptId,
      attempt.score,
      attempt.maxScore,
      file.questions,
      attempt.answers,
    );
    const safe = file.name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 48) || "result";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safe}-${attemptId.slice(-8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-4 pt-6 pb-12">
      <Link href={isOwner ? `/file/${file.id}` : "/shared"} className="text-sm font-medium text-indigo-600">
        ← Back
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Results</h1>
          <p className="mt-1 text-sm text-gray-500">{file.name}</p>
        </div>
        <button
          type="button"
          onClick={downloadResultExport}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] sm:self-auto"
        >
          <Download className="h-4 w-4 text-indigo-600" strokeWidth={2} />
          Download result (.txt)
        </button>
      </div>

      <SurfaceCard className="mt-6 overflow-hidden p-0 text-center">
        <div className="bg-gradient-to-b from-indigo-50/90 to-white px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600/90">Score</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-indigo-700">
            {attempt.score}
            <span className="text-2xl font-semibold text-indigo-400">/{attempt.maxScore}</span>
          </p>
          <div className="mt-4 flex justify-center">
            {attempt.pendingEvaluation ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                Pending review
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                Evaluated
              </span>
            )}
          </div>
        </div>
      </SurfaceCard>

      <h2 className="mb-3 mt-10 text-xs font-semibold uppercase tracking-wide text-gray-500">Breakdown</h2>
      <div className="flex flex-col gap-3">
        {file.questions.map((q, i) => {
          const ans = attempt.answers.find((a) => a.questionId === q.id);
          const r = reviewById[q.id];
          let stripe = "border-l-gray-200";
          let icon: ReactNode = <Circle className="h-4 w-4 text-gray-300" strokeWidth={2} />;
          if (r?.mode === "objective") {
            if (r.correct === true) {
              stripe = "border-l-emerald-500";
              icon = <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2} />;
            } else if (r.correct === false) {
              stripe = "border-l-red-500";
              icon = <XCircle className="h-4 w-4 text-red-600" strokeWidth={2} />;
            } else {
              stripe = "border-l-gray-300";
            }
          }
          if (r?.mode === "text") {
            if (r.status === "graded") {
              stripe = "border-l-emerald-500";
              icon = <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2} />;
            } else if (r.status === "pending") {
              stripe = "border-l-amber-500";
              icon = <AlertCircle className="h-4 w-4 text-amber-600" strokeWidth={2} />;
            }
          }

          return (
            <SurfaceCard key={q.id} className={`border-l-4 p-4 ${stripe}`}>
              <div className="flex gap-3">
                <div className="pt-0.5">{icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">Q{i + 1}</span>
                    <QuestionTypeBadge type={q.type} />
                  </div>
                  <MarkdownText content={q.text} className="mt-2 text-sm font-medium leading-relaxed text-gray-900" />
                  {q.type !== "text" && (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium text-gray-600">Your answer</span>
                      <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-gray-900">
                        {ans?.optionIndices?.length ? (
                          <span>
                            {ans.optionIndices.map((idx, j) => (
                              <span key={`${idx}-${j}`}>
                                <MarkdownText content={q.options[idx] ?? String(idx)} inline className="inline" />
                                {j < (ans.optionIndices?.length ?? 0) - 1 ? ", " : ""}
                              </span>
                            ))}
                          </span>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                  )}
                  {q.type !== "text" && q.correctIndices && q.correctIndices.length > 0 && (
                    <div className="mt-3 text-sm text-gray-700">
                      <span className="font-medium text-emerald-800/90">Correct answer</span>
                      <div className="mt-1 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-gray-900">
                        {q.correctIndices.map((idx, j) => (
                          <span key={`${idx}-${j}`}>
                            <MarkdownText content={q.options[idx] ?? String(idx)} inline className="inline" />
                            {j < q.correctIndices!.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {q.type === "text" && (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium text-gray-600">Your answer</span>
                      <div className="mt-1 rounded-lg bg-gray-50 p-3 text-gray-800">
                        {ans?.text?.trim() ? <MarkdownText content={ans.text} className="whitespace-pre-wrap" /> : "—"}
                      </div>
                    </div>
                  )}
                  {q.type === "text" && (q.referenceAnswer ?? "").trim() && (
                    <div className="mt-3 rounded-lg border border-[#d8e3dd] bg-[#f6faf8] p-3 text-sm text-[#3f4d48]">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#5f6b66]">
                        Reference answer
                      </p>
                      <MarkdownText content={q.referenceAnswer ?? ""} />
                    </div>
                  )}
                  {isOwner && q.type === "text" && attempt.status === "submitted" && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Grade</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["full", "partial", "zero"] as const).map((mode) => {
                          const active = (grades[q.id]?.mode ?? "full") === mode;
                          const label = mode === "full" ? "Full marks" : mode === "partial" ? "Partial" : "Zero";
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() =>
                                setGrades((g) => ({
                                  ...g,
                                  [q.id]: {
                                    mode,
                                    marks:
                                      mode === "full" ? String(q.marks) : mode === "zero" ? "0" : g[q.id]?.marks ?? "",
                                  },
                                }))
                              }
                              className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                                active
                                  ? "border-[#8fc5b2] bg-[#dff0e8] text-[var(--primary)]"
                                  : "border-gray-200 bg-white text-[#5f6b66] hover:bg-[#f3f8f6]"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {(grades[q.id]?.mode ?? "full") === "partial" && (
                        <label className="text-xs text-gray-600">
                          Partial marks (max {q.marks})
                          <input
                            type="number"
                            min={0}
                            max={q.marks}
                            value={grades[q.id]?.marks ?? ""}
                            onChange={(e) =>
                              setGrades((g) => ({
                                ...g,
                                [q.id]: { ...(g[q.id] ?? { mode: "partial" as const }), mode: "partial", marks: e.target.value },
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>

      {isOwner && attempt.pendingEvaluation && (
        <button
          type="button"
          onClick={() => saveEvaluation()}
          className="mt-10 min-h-[52px] w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.99]"
        >
          Save text grades
        </button>
      )}

      {!isOwner && (
        <button
          type="button"
          onClick={() => router.push(`/attempt/${attempt.fileId}`)}
          className="mt-10 min-h-[52px] w-full rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.99]"
        >
          Attempt again
        </button>
      )}
    </div>
  );
}
