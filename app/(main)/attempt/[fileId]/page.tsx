"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
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

function isQuestionComplete(q: Q, a: Answer | undefined): boolean {
  if (!a) return false;
  if (q.type === "text") return (a.text ?? "").trim().length > 0;
  return (a.optionIndices?.length ?? 0) > 0;
}

function answeredCount(questions: Q[], answers: Record<string, Answer>) {
  let n = 0;
  for (const q of questions) {
    if (isQuestionComplete(q, answers[q.id])) n++;
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
  const [jumpOpen, setJumpOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionAnchors = useRef<Record<string, HTMLDivElement | null>>({});

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
  const incompleteQuestions = useMemo(
    () => questions.filter((q) => !isQuestionComplete(q, answers[q.id])),
    [questions, answers],
  );

  function scrollToQuestion(questionId: string) {
    const el = questionAnchors.current[questionId];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setJumpOpen(false);
  }

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
          className="sticky top-0 z-20 -mx-4 mt-4 overflow-hidden rounded-xl border border-gray-200/90 bg-gray-50/95 shadow-md backdrop-blur-sm supports-[backdrop-filter]:bg-gray-50/88"
        >
          <div
            className="px-4 py-2.5"
            role="status"
            aria-label={`${done} of ${total} questions completed`}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs font-medium text-gray-600">
              <span className="min-w-0">Questions completed</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-gray-900">
                  {done} <span className="text-gray-400">/</span> {total}
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmSubmitOpen(true)}
                  disabled={saveState === "saving"}
                  title="Submit your answers and go to results"
                  aria-label="Submit attempt and view results"
                  className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveState === "saving" ? "Saving…" : "Submit"}
                </button>
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200/90">
              <div
                className="h-full rounded-full bg-indigo-500 transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="border-t border-gray-200/80 bg-white/75 px-3 py-1.5 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => setJumpOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-2 text-left text-xs font-semibold text-gray-700 transition hover:bg-gray-100/80"
              aria-expanded={jumpOpen}
            >
              <span>
                Unanswered
                {incompleteQuestions.length > 0 ? (
                  <span className="ml-1.5 font-normal text-gray-500">({incompleteQuestions.length})</span>
                ) : null}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${jumpOpen ? "rotate-180" : ""}`}
                strokeWidth={2}
                aria-hidden
              />
            </button>
            {jumpOpen && (
              <div className="border-t border-gray-100/90 px-1 pb-2.5 pt-2">
                {incompleteQuestions.length === 0 ? (
                  <p className="text-xs text-gray-500">All questions have an answer. You can still scroll to review.</p>
                ) : (
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {questions
                      .map((q, idx) => ({ q, num: idx + 1 }))
                      .filter(({ q }) => !isQuestionComplete(q, answers[q.id]))
                      .map(({ q, num }) => (
                        <li key={q.id} className="list-none">
                          <button
                            type="button"
                            onClick={() => scrollToQuestion(q.id)}
                            title={`Go to question ${num}`}
                            className="flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-dashed border-amber-400/90 bg-amber-50/80 px-2 text-xs font-bold text-amber-950 shadow-sm transition hover:border-amber-500 hover:bg-amber-100 active:scale-95"
                          >
                            {num}
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-5">
        {questions.map((q, i) => {
          const a = answers[q.id] ?? { questionId: q.id };
          return (
            <div
              key={q.id}
              ref={(el) => {
                questionAnchors.current[q.id] = el;
              }}
              className={jumpOpen ? "scroll-mt-52" : "scroll-mt-36"}
            >
              <SurfaceCard className="p-5">
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
            </div>
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
