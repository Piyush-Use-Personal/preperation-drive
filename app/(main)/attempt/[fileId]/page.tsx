"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { BottomSheet } from "@/components/design/BottomSheet";
import { MarkdownText } from "@/components/design/MarkdownText";
import { SurfaceCard } from "@/components/design/SurfaceCard";
import { QuestionTypeBadge } from "@/components/design/QuestionTypeBadge";

type Q = {
  id: string;
  text: string;
  type: string;
  options: string[];
  marks: number;
};

type Answer = { questionId: string; optionIndices?: number[]; text?: string };

function answeredCount(questions: Q[], answers: Record<string, Answer>) {
  let n = 0;
  for (const q of questions) {
    const a = answers[q.id];
    if (!a) continue;
    if (q.type === "text") {
      if ((a.text ?? "").trim().length > 0) n++;
    } else if ((a.optionIndices?.length ?? 0) > 0) n++;
  }
  return n;
}

export default function AttemptPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.fileId as string;
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [loading, setLoading] = useState(true);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(
    async (next: Record<string, Answer>) => {
      if (!attemptId) return;
      setSaveState("saving");
      const payload = Object.values(next);
      await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    },
    [attemptId],
  );

  const scheduleSave = useCallback(
    (next: Record<string, Answer>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => flushSave(next), 500);
    },
    [flushSave],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const start = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId }),
        });
        const sj = await start.json();
        if (!start.ok || !sj.attempt?.id) return;
        if (cancelled) return;
        setAttemptId(sj.attempt.id);
        const detail = await fetch(`/api/attempts/${sj.attempt.id}`).then((r) => r.json());
        if (cancelled) return;
        setFileName(detail.file?.name ?? "");
        setQuestions(detail.file?.questions ?? []);
        const map: Record<string, Answer> = {};
        for (const a of detail.attempt?.answers ?? []) {
          map[a.questionId] = {
            questionId: a.questionId,
            optionIndices: a.optionIndices,
            text: a.text,
          };
        }
        setAnswers(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const done = useMemo(() => answeredCount(questions, answers), [questions, answers]);
  const total = questions.length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  function setAnswer(q: Q, patch: Partial<Answer>) {
    setAnswers((prev) => {
      const base = prev[q.id] ?? { questionId: q.id };
      const next = { ...base, ...patch, questionId: q.id };
      const copy = { ...prev, [q.id]: next };
      scheduleSave(copy);
      return copy;
    });
  }

  async function submit() {
    if (!attemptId) return;
    if (timer.current) clearTimeout(timer.current);
    await flushSave(answers);
    const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
    if (res.ok) {
      router.replace(`/result/${attemptId}`);
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-[var(--radius)] bg-gray-200/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-28">
      <div className="mb-5 flex items-start justify-between gap-3">
        <Link
          href={`/file/${fileId}`}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-indigo-600"
        >
          ← Back
        </Link>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
            saveState === "saving"
              ? "bg-amber-50 text-amber-800"
              : saveState === "saved"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-gray-100 text-gray-500"
          }`}
          aria-live="polite"
        >
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Saved
            </>
          )}
          {saveState === "idle" && "Auto-save on"}
        </span>
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-gray-900">{fileName}</h1>
      <p className="mt-1 text-sm text-gray-500">Scroll through all questions, then submit.</p>

      {total > 0 && (
        <div
          className="sticky top-0 z-20 -mx-4 mt-4 border-y border-gray-200/90 bg-gray-50/95 px-4 py-2.5 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-gray-50/85"
          role="status"
          aria-label={`${done} of ${total} questions completed`}
        >
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-gray-600">
            <span>Questions completed</span>
            <span className="shrink-0 tabular-nums text-gray-900">
              {done} <span className="text-gray-400">/</span> {total}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200/90">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-5">
        {questions.map((q, i) => {
          const a = answers[q.id] ?? { questionId: q.id };
          return (
            <SurfaceCard key={q.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">Q{i + 1}</span>
                <QuestionTypeBadge type={q.type} />
                <span className="text-[11px] text-gray-500">
                  {q.marks} pt{q.marks === 1 ? "" : "s"}
                </span>
              </div>
              <MarkdownText content={q.text} className="mt-3 text-base font-medium leading-relaxed text-gray-900" />

              {q.type === "text" && (
                <textarea
                  value={a.text ?? ""}
                  onChange={(e) => setAnswer(q, { text: e.target.value })}
                  className="mt-4 w-full rounded-xl border-2 border-gray-200 bg-white p-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  rows={5}
                  placeholder="Your answer…"
                />
              )}

              {q.type === "single" && (
                <div className="mt-4 flex flex-col gap-2">
                  {q.options.map((opt, idx) => {
                    const selected = (a.optionIndices?.[0] ?? -1) === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAnswer(q, { optionIndices: [idx] })}
                        className={`flex min-h-[48px] w-full items-center rounded-xl border-2 px-4 text-left text-sm font-medium transition active:scale-[0.99] ${
                          selected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-950 shadow-sm"
                            : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                        }`}
                      >
                        <span
                          className={`mr-3 flex h-5 w-5 shrink-0 rounded-full border-2 ${
                            selected ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                          }`}
                          aria-hidden
                        />
                        <MarkdownText content={opt} inline className="min-w-0 flex-1" />
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "multiple" && (
                <div className="mt-4 flex flex-col gap-2">
                  {q.options.map((opt, idx) => {
                    const set = new Set(a.optionIndices ?? []);
                    const selected = set.has(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const next = new Set(a.optionIndices ?? []);
                          if (next.has(idx)) next.delete(idx);
                          else next.add(idx);
                          setAnswer(q, { optionIndices: [...next].sort((x, y) => x - y) });
                        }}
                        className={`flex min-h-[48px] w-full items-center rounded-xl border-2 px-4 text-left text-sm font-medium transition active:scale-[0.99] ${
                          selected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-950 shadow-sm"
                            : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                        }`}
                      >
                        <span
                          className={`mr-3 flex h-5 w-5 shrink-0 rounded-md border-2 ${
                            selected ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                          }`}
                          aria-hidden
                        />
                        <MarkdownText content={opt} inline className="min-w-0 flex-1" />
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "yesno" && (
                <div className="mt-4 flex flex-col gap-2">
                  {(q.options.length >= 2 ? q.options : ["No", "Yes"]).map((opt, idx) => {
                    const selected = (a.optionIndices?.[0] ?? -1) === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAnswer(q, { optionIndices: [idx] })}
                        className={`flex min-h-[48px] w-full items-center rounded-xl border-2 px-4 text-left text-sm font-medium transition active:scale-[0.99] ${
                          selected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-950 shadow-sm"
                            : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                        }`}
                      >
                        <span
                          className={`mr-3 flex h-5 w-5 shrink-0 rounded-full border-2 ${
                            selected ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                          }`}
                          aria-hidden
                        />
                        <MarkdownText content={opt} inline className="min-w-0 flex-1" />
                      </button>
                    );
                  })}
                </div>
              )}
            </SurfaceCard>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setConfirmSubmitOpen(true)}
        className="mt-10 min-h-[52px] w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.99]"
      >
        Submit attempt
      </button>

      <BottomSheet open={confirmSubmitOpen} title="Submit attempt?" onClose={() => setConfirmSubmitOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-[#5f6b66]">
            Once submitted, you cannot change answers. Are you sure you want to continue?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirmSubmitOpen(false)}
              className="min-h-11 rounded-xl border border-[#d8e3dd] bg-white px-4 text-sm font-semibold text-[#4a5954] transition hover:bg-[#f2f7f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                setConfirmSubmitOpen(false);
                await submit();
              }}
              className="min-h-11 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Yes, submit
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
