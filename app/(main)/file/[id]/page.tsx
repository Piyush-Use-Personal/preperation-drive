"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Copy, Lock, Plus, Share2, Trash2, Users } from "lucide-react";
import { BottomSheet } from "@/components/design/BottomSheet";
import { Fab } from "@/components/design/Fab";
import { MarkdownText } from "@/components/design/MarkdownText";
import { QuestionTypeBadge } from "@/components/design/QuestionTypeBadge";
import { SurfaceCard } from "@/components/design/SurfaceCard";

type Q = {
  id: string;
  text: string;
  type: string;
  options: string[];
  correctIndices?: number[];
  referenceAnswer?: string;
  marks: number;
};

type ImportQuestion = {
  text: string;
  type: "single" | "multiple" | "yesno" | "text";
  options: string[];
  correctIndices: number[];
  correctYes?: boolean;
  referenceAnswer?: string;
  marks: number;
};

function parseImportQuestions(input: string): { questions: ImportQuestion[]; errors: string[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(input);
  } catch {
    return { questions: [], errors: ["Invalid JSON format. Please paste valid JSON."] };
  }

  const payload = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { questions?: unknown[] }).questions)
      ? (raw as { questions: unknown[] }).questions
      : null;

  if (!payload) {
    return {
      questions: [],
      errors: ['JSON must be an array of questions or an object like {"questions": [...]}'],
    };
  }

  const errors: string[] = [];
  const questions: ImportQuestion[] = [];

  payload.forEach((item, index) => {
    const row = item as Record<string, unknown>;
    const text = String(row?.text ?? "").trim();
    const type = String(row?.type ?? "").trim() as ImportQuestion["type"];
    const marks = Number(row?.marks ?? 1);

    if (!text) errors.push(`Q${index + 1}: text is required.`);
    if (!["single", "multiple", "yesno", "text"].includes(type)) {
      errors.push(`Q${index + 1}: type must be single | multiple | yesno | text.`);
    }
    if (!(marks > 0)) errors.push(`Q${index + 1}: marks must be a positive number.`);

    const options = Array.isArray(row?.options) ? row.options.map((x) => String(x).trim()).filter(Boolean) : [];
    const correctIndices = Array.isArray(row?.correctIndices)
      ? row.correctIndices.map((n) => Number(n)).filter((n) => !Number.isNaN(n))
      : [];
    const correctYes = row?.correctYes === true;
    const referenceAnswer = String(row?.referenceAnswer ?? "").trim();

    if (type === "single") {
      if (options.length < 2) errors.push(`Q${index + 1}: single requires at least 2 options.`);
      if (correctIndices.length !== 1) errors.push(`Q${index + 1}: single requires exactly 1 correctIndices value.`);
    }
    if (type === "multiple") {
      if (options.length < 2) errors.push(`Q${index + 1}: multiple requires at least 2 options.`);
      if (correctIndices.length < 1) errors.push(`Q${index + 1}: multiple requires at least 1 correct index.`);
    }
    if (type === "yesno" && !Array.isArray(row?.correctIndices) && row?.correctYes === undefined) {
      errors.push(`Q${index + 1}: yesno requires correctYes or correctIndices.`);
    }

    questions.push({
      text,
      type: ["single", "multiple", "yesno", "text"].includes(type) ? type : "text",
      options,
      correctIndices,
      correctYes,
      referenceAnswer,
      marks: marks > 0 ? marks : 1,
    });
  });

  return { questions, errors };
}

export default function FilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [role, setRole] = useState<"owner" | "participant" | null>(null);
  const [file, setFile] = useState<{
    name: string;
    locked: boolean;
    folderId: string;
    questions: Q[];
    sharedWith: { email: string }[];
    analytics?: { totalAttempts: number; averageScore: number; passRate: number };
  } | null>(null);
  const [attempts, setAttempts] = useState<
    { id: string; participantEmail: string; score: number; maxScore: number; status: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<null | "share" | "question" | "aiImport">(null);
  const [shareEmail, setShareEmail] = useState("");
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<"single" | "multiple" | "yesno" | "text">("single");
  const [qOptions, setQOptions] = useState<string[]>(["Option 1", "Option 2"]);
  const [qCorrectSingle, setQCorrectSingle] = useState("0");
  const [qCorrectMultiple, setQCorrectMultiple] = useState<number[]>([]);
  const [qCorrectYesNo, setQCorrectYesNo] = useState<"0" | "1">("0");
  const [qReferenceAnswer, setQReferenceAnswer] = useState("");
  const [qMarks, setQMarks] = useState("1");
  const [qInsertAt, setQInsertAt] = useState("end");
  const [questionTab, setQuestionTab] = useState<"content" | "scoring">("content");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [importJson, setImportJson] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "attempts">("questions");

  async function load() {
    const res = await fetch(`/api/files/${id}`);
    const j = await res.json();
    if (!res.ok) {
      setFile(null);
      setRole(null);
      return;
    }
    setRole(j.role);
    setFile(j.file);
    setAttempts(j.attempts ?? []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when file id changes
  }, [id]);

  function resetQuestionForm() {
    setQText("");
    setQType("single");
    setQOptions(["Option 1", "Option 2"]);
    setQCorrectSingle("0");
    setQCorrectMultiple([]);
    setQCorrectYesNo("0");
    setQReferenceAnswer("");
    setQMarks("1");
    setQInsertAt("end");
    setQuestionTab("content");
    setEditingQuestionId(null);
  }

  function addOptionField() {
    setQOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  }

  function updateOptionField(index: number, value: string) {
    setQOptions((prev) => prev.map((opt, idx) => (idx === index ? value : opt)));
  }

  function removeOptionField(index: number) {
    setQOptions((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
    setQCorrectMultiple((prev) => prev.filter((n) => n !== index).map((n) => (n > index ? n - 1 : n)));
    setQCorrectSingle((prev) => {
      const value = Number(prev);
      if (Number.isNaN(value)) return "0";
      if (value === index) return "0";
      if (value > index) return String(value - 1);
      return prev;
    });
  }

  function toggleMultipleCorrect(index: number) {
    setQCorrectMultiple((prev) => (prev.includes(index) ? prev.filter((n) => n !== index) : [...prev, index]));
  }

  function openQuestionEditorForCreate() {
    resetQuestionForm();
    setSheet("question");
  }

  function openQuestionEditorForEdit(question: Q) {
    const nextType = ["single", "multiple", "yesno", "text"].includes(question.type)
      ? (question.type as "single" | "multiple" | "yesno" | "text")
      : "single";
    setEditingQuestionId(question.id);
    setQText(question.text);
    setQType(nextType);
    setQMarks(String(question.marks || 1));
    setQReferenceAnswer(question.referenceAnswer ?? "");
    setQInsertAt("end");
    setQuestionTab("content");

    if (nextType === "single") {
      const opts = question.options.length >= 2 ? question.options : ["Option 1", "Option 2"];
      setQOptions(opts);
      setQCorrectSingle(String(question.correctIndices?.[0] ?? 0));
      setQCorrectMultiple([]);
      setQCorrectYesNo("0");
    } else if (nextType === "multiple") {
      const opts = question.options.length >= 2 ? question.options : ["Option 1", "Option 2"];
      setQOptions(opts);
      setQCorrectMultiple(question.correctIndices ?? []);
      setQCorrectSingle("0");
      setQCorrectYesNo("0");
    } else if (nextType === "yesno") {
      setQOptions(["No", "Yes"]);
      setQCorrectYesNo(question.correctIndices?.includes(1) ? "1" : "0");
      setQCorrectSingle("0");
      setQCorrectMultiple([]);
    } else {
      setQOptions(["Option 1", "Option 2"]);
      setQCorrectSingle("0");
      setQCorrectMultiple([]);
      setQCorrectYesNo("0");
    }
    setSheet("question");
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!file?.locked) {
      const options = qType === "text" || qType === "yesno" ? [] : qOptions.map((s) => s.trim()).filter(Boolean);
      let correctIndices: number[] = [];
      if (qType === "single") {
        correctIndices = [parseInt(qCorrectSingle, 10)].filter((n) => !Number.isNaN(n));
      } else if (qType === "multiple") {
        correctIndices = qCorrectMultiple.filter((n) => !Number.isNaN(n));
      }
      const body: Record<string, unknown> = {
        text: qText,
        type: qType,
        options,
        referenceAnswer: qType === "text" ? qReferenceAnswer : "",
        marks: Number(qMarks) || 1,
        position: qInsertAt === "end" ? "end" : Number(qInsertAt),
      };
      if (qType === "yesno") {
        body.correctYes = qCorrectYesNo === "1";
      } else {
        body.correctIndices = correctIndices;
      }
      if (editingQuestionId) {
        await fetch(`/api/files/${id}/questions/${editingQuestionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch(`/api/files/${id}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      resetQuestionForm();
      setSheet(null);
      await load();
    }
  }

  async function removeQuestion(qid: string) {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/files/${id}/questions/${qid}`, { method: "DELETE" });
    await load();
  }

  async function share(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/files/${id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: shareEmail }),
    });
    setShareEmail("");
    setSheet(null);
    await load();
  }

  const aiPrompt = `Follow-up request for an existing AI chat thread:
Use prior context from this thread and convert exam questions in following pattern.
Return JSON only (no markdown wrappers, no explanations).

Output format:
{
  "questions": [
    {
      "text": "Question text",
      "type": "single | multiple | yesno | text",
      "options": ["A", "B", "C", "D"],
      "correctIndices": [0],
      "correctYes": false,
      "referenceAnswer": "Model answer in markdown (for text type)",
      "marks": 1
    }
  ]
}

Field definitions:
- text: string (Markdown supported; app renders markdown)
- type: enum("single","multiple","yesno","text")
- options: string[] (Markdown supported; required for single/multiple, optional otherwise)
- correctIndices: number[] (0-based index positions in options)
- correctYes: boolean (only for yesno; true => Yes, false => No)
- referenceAnswer: string (optional; mainly for text type, Markdown supported)
- marks: number (positive)

Validation rules:
- single: at least 2 options and exactly 1 correctIndices value.
- multiple: at least 2 options and at least 1 correctIndices value.
- yesno: provide either correctYes OR correctIndices ([0] for No, [1] for Yes).
- text: do not provide options/correctIndices.
- For text questions, include referenceAnswer when possible.
- Keep response compact and valid JSON.

`;
  async function copyPromptToClipboard() {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 1400);
    } catch {
      setPromptCopied(false);
    }
  }

  async function handleImportJson() {
    setImportSuccess(null);
    setImportErrors([]);
    const parsed = parseImportQuestions(importJson);
    if (parsed.errors.length > 0) {
      setImportErrors(parsed.errors);
      return;
    }
    setImporting(true);
    try {
      let saved = 0;
      for (let i = 0; i < parsed.questions.length; i += 10) {
        const chunk = parsed.questions.slice(i, i + 10).map((q) => ({
          text: q.text,
          type: q.type,
          options: q.type === "text" || q.type === "yesno" ? [] : q.options,
          correctIndices: q.correctIndices,
          correctYes: q.type === "yesno" ? (q.correctYes ?? q.correctIndices.includes(1)) : undefined,
          referenceAnswer: q.type === "text" ? q.referenceAnswer : "",
          marks: q.marks,
        }));
        const res = await fetch(`/api/files/${id}/questions/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: chunk }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setImportErrors([`Failed at batch starting question ${i + 1}: ${j.error ?? "Unknown error"}`]);
          return;
        }
        saved += chunk.length;
      }
      setImportSuccess(`Imported ${saved} question${saved === 1 ? "" : "s"} successfully.`);
      setImportJson("");
      setSheet(null);
      await load();
    } finally {
      setImporting(false);
    }
  }

  async function handleUploadJsonFile(fileInput: File | null) {
    if (!fileInput) return;
    const text = await fileInput.text();
    setImportJson(text);
    setImportErrors([]);
    setImportSuccess(null);
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[var(--radius)] bg-gray-200/70" />
          ))}
        </div>
      </div>
    );
  }

  if (!file || !role) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-red-600">File not found or no access.</p>
        <Link href="/drive" className="mt-4 block text-sm font-medium text-indigo-600">
          Drive
        </Link>
      </div>
    );
  }

  const isOwner = role === "owner";
  const showQuestionFab = isOwner && !file.locked;
  const hasAttemptsTab = attempts.length > 0;
  const totalMarks = file.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  return (
    <div className="relative pb-10 pt-3 md:pt-1">
      <div className="mb-7">
        <Link
          href={`/folder/${file.folderId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
        >
          <ChevronRight className="h-4 w-4 rotate-180" strokeWidth={2} />
          Folder
        </Link>
        <div className="mt-4 rounded-2xl border border-[#d8e3dd] bg-white/88 p-4 shadow-[0_10px_28px_rgba(17,24,39,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-gray-900">{file.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#edf3f0] px-2.5 py-1 text-[11px] font-semibold text-[#4f615b]">
                  {file.questions.length} question{file.questions.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center rounded-full bg-[#dff0e8] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                  {totalMarks} mark{totalMarks === 1 ? "" : "s"}
                </span>
                {isOwner && file.analytics && (
                  <span className="inline-flex items-center rounded-full bg-[#f1f6f4] px-2.5 py-1 text-[11px] font-medium text-[#5f6b66]">
                    {file.analytics.totalAttempts} attempts · avg {file.analytics.averageScore}
                  </span>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => setSheet("aiImport")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#c7dad2] bg-[#eef7f3] px-3.5 py-2 text-xs font-semibold text-[var(--primary)] transition hover:bg-[#e4f3ec] active:scale-[0.98]"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
                  AI import
                </button>
                <button
                  type="button"
                  onClick={() => setSheet("share")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] active:scale-[0.98]"
                >
                  <Share2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Share
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(`/api/files/${id}/clone`, { method: "POST" });
                    const j = await res.json();
                    if (res.ok && j.file?.id) router.push(`/file/${j.file.id}`);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-[#d8e3dd] bg-white px-3 py-1.5 text-xs font-semibold text-[#46534f] transition hover:bg-[#f3f8f6]"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                  Clone & edit
                </button>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {file.locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                <Lock className="h-3 w-3" strokeWidth={2.5} />
                Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {!isOwner && (
        <div className="mb-8 flex gap-3">
          <Link
            href={`/attempt/${id}`}
            className="flex flex-1 items-center justify-center rounded-xl bg-[var(--primary)] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] active:scale-[0.99]"
          >
            Attempt test
          </Link>
          <button
            type="button"
            onClick={async () => {
              const res = await fetch(`/api/files/${id}/clone`, { method: "POST" });
              const j = await res.json();
              if (res.ok && j.file?.id) router.push(`/file/${j.file.id}`);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-[0.99]"
          >
            <Copy className="h-4 w-4" strokeWidth={2} />
            Clone
          </button>
        </div>
      )}

      <BottomSheet open={sheet === "share"} title="Share file" onClose={() => setSheet(null)}>
        <form onSubmit={share} className="flex flex-col gap-4">
          <label className="text-sm text-gray-700">
            <span className="font-medium">Email</span>
            <input
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none ring-indigo-500/30 transition focus:ring-2"
              type="email"
              placeholder="friend@example.com"
              required
            />
          </label>
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.99]"
          >
            Add to shared list
          </button>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Users className="h-3.5 w-3.5" strokeWidth={2} />
              Shared with
            </p>
            <ul className="space-y-1 text-sm text-gray-700">
              {file.sharedWith.length === 0 && <li className="text-gray-500">No one yet</li>}
              {file.sharedWith.map((s) => (
                <li key={s.email}>{s.email}</li>
              ))}
            </ul>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet open={sheet === "aiImport"} title="AI question import" onClose={() => setSheet(null)}>
        <div className="flex max-h-[min(74vh,560px)] flex-col gap-3 overflow-y-auto pb-1 pr-0.5">
          <p className="text-xs text-[#5f6b66]">
            Copy prompt, run it in your AI chat, then paste or upload the returned JSON.
          </p>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={copyPromptToClipboard}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d8e3dd] bg-white px-3 py-1.5 text-xs font-semibold text-[#4c5b56] transition hover:bg-[#f2f7f5]"
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={2} />
              {promptCopied ? "Copied" : "Copy prompt"}
            </button>
          </div>
          <textarea
            readOnly
            value={aiPrompt}
            className="h-36 w-full rounded-xl border border-[#d8e3dd] bg-[#f7faf9] p-3 text-xs leading-relaxed text-[#485651]"
          />
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="h-40 w-full rounded-xl border border-[#d8e3dd] bg-white p-3 text-sm outline-none ring-[#9ac9ba]/30 focus:ring-2"
              placeholder='Paste AI JSON here, e.g. {"questions":[...]}'
            />
            <label className="inline-flex h-fit cursor-pointer items-center justify-center rounded-xl border border-[#d8e3dd] bg-white px-3 py-2 text-xs font-semibold text-[#4e5d58] transition hover:bg-[#f3f8f6]">
              Upload JSON
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => handleUploadJsonFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {importErrors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700">Import validation failed:</p>
              <ul className="mt-1 list-disc pl-4 text-xs text-red-700">
                {importErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {importSuccess && <p className="text-xs font-semibold text-[var(--primary)]">{importSuccess}</p>}
          <button
            type="button"
            onClick={handleImportJson}
            disabled={!importJson.trim() || importing}
            className="min-h-11 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {importing ? "Importing..." : "Validate and import JSON"}
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet === "question"}
        title={editingQuestionId ? "Edit question" : "New question"}
        onClose={() => {
          setSheet(null);
          resetQuestionForm();
        }}
      >
        <form onSubmit={addQuestion} className="flex max-h-[min(74vh,560px)] flex-col gap-4 overflow-y-auto pb-1 pr-0.5">
          <div className="rounded-xl border border-[#d8e3dd] bg-white/85 p-1.5">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setQuestionTab("content")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  questionTab === "content"
                    ? "bg-[#dff0e8] text-[var(--primary)]"
                    : "text-[#5f6b66] hover:bg-[#f1f7f4]"
                }`}
              >
                Content & options
              </button>
              <button
                type="button"
                onClick={() => setQuestionTab("scoring")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  questionTab === "scoring"
                    ? "bg-[#dff0e8] text-[var(--primary)]"
                    : "text-[#5f6b66] hover:bg-[#f1f7f4]"
                }`}
              >
                Order & marks
              </button>
            </div>
          </div>

          {questionTab === "content" && (
            <div className="space-y-4">
              <label className="text-xs font-medium text-gray-600">
                Question text
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8e3dd] p-3 text-sm outline-none ring-[#9ac9ba]/30 focus:ring-2"
                  rows={4}
                  placeholder="Write your question clearly..."
                  required
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Type
                <select
                  value={qType}
                  onChange={(e) => {
                    const nextType = e.target.value as typeof qType;
                    setQType(nextType);
                    if (nextType === "single") {
                      setQCorrectSingle("0");
                    }
                    if (nextType === "multiple") {
                      setQCorrectMultiple([0]);
                    }
                    if (nextType === "yesno") {
                      setQCorrectYesNo("0");
                    }
                  }}
                  className="mt-1.5 w-full rounded-xl border border-[#d8e3dd] p-3 text-sm"
                >
                  <option value="single">Single choice (MCQ)</option>
                  <option value="multiple">Multiple choice</option>
                  <option value="yesno">Yes / No</option>
                  <option value="text">Text (manual grading)</option>
                </select>
              </label>

              {(qType === "single" || qType === "multiple") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#5f6b66]">Options</p>
                    <button
                      type="button"
                      onClick={addOptionField}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#d8e3dd] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#3f514b] transition hover:bg-[#f1f7f4]"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                      Add option
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {qOptions.map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 rounded-xl border border-[#d8e3dd] bg-white px-3 py-2.5"
                      >
                        <button
                          type="button"
                          aria-label={qType === "single" ? `Select option ${idx + 1} as correct` : `Toggle option ${idx + 1} as correct`}
                          onClick={() =>
                            qType === "single" ? setQCorrectSingle(String(idx)) : toggleMultipleCorrect(idx)
                          }
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                            qType === "single"
                              ? qCorrectSingle === String(idx)
                                ? "border-[#7cb8a4] bg-[#dff0e8] text-[var(--primary)]"
                                : "border-[#d5dfda] bg-[#f6f8f7] text-[#5f6b66]"
                              : qCorrectMultiple.includes(idx)
                                ? "border-[#7cb8a4] bg-[#dff0e8] text-[var(--primary)]"
                                : "border-[#d5dfda] bg-[#f6f8f7] text-[#5f6b66]"
                          }`}
                        >
                          {qType === "multiple" && qCorrectMultiple.includes(idx) ? (
                            <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
                        </button>
                        <input
                          value={option}
                          onChange={(e) => updateOptionField(idx, e.target.value)}
                          className="h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-[#f9fbfa] px-3.5 text-sm outline-none transition focus:border-[#d8e3dd] focus:bg-white"
                          placeholder={`Option ${idx + 1}`}
                          required
                        />
                        <button
                          type="button"
                          disabled={qOptions.length <= 2}
                          onClick={() => removeOptionField(idx)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7a8a84] transition hover:bg-[#f6f8f7] hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Remove option"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#5f6b66]">
                    {qType === "single"
                      ? "Tap one option bubble to mark the correct answer."
                      : "Tap bubbles to mark one or more correct answers."}
                  </p>
                </div>
              )}

              {qType === "yesno" && (
                <label className="text-xs font-medium text-gray-600">
                  Correct answer
                  <select
                    value={qCorrectYesNo}
                    onChange={(e) => setQCorrectYesNo(e.target.value as "0" | "1")}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e3dd] p-3 text-sm"
                  >
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </label>
              )}

              {qType === "text" && (
                <label className="text-xs font-medium text-gray-600">
                  Reference answer (markdown supported)
                  <textarea
                    value={qReferenceAnswer}
                    onChange={(e) => setQReferenceAnswer(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#d8e3dd] p-3 text-sm outline-none ring-[#9ac9ba]/30 focus:ring-2"
                    rows={5}
                    placeholder="Write model answer for quick grading..."
                  />
                </label>
              )}
            </div>
          )}

          {questionTab === "scoring" && (
            <div className="space-y-4">
              <label className="text-xs font-medium text-gray-600">
                Marks
                <input
                  value={qMarks}
                  onChange={(e) => setQMarks(e.target.value)}
                  type="number"
                  min={1}
                  className="mt-1.5 w-full rounded-xl border border-[#d8e3dd] p-3 text-sm"
                />
              </label>
              {!editingQuestionId && (
                <>
                  <label className="text-xs font-medium text-gray-600">
                    Insert position
                    <select
                      value={qInsertAt}
                      onChange={(e) => setQInsertAt(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#d8e3dd] p-3 text-sm"
                    >
                      <option value="end">At end (Q{file.questions.length + 1})</option>
                      {file.questions.map((_, idx) => (
                        <option key={idx} value={idx}>
                          Before Q{idx + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="rounded-xl border border-[#d8e3dd] bg-[#f5faf8] p-3 text-xs text-[#4e5d58]">
                    Final question will be inserted{" "}
                    {qInsertAt === "end"
                      ? "at the end of the list."
                      : `before question ${Number(qInsertAt) + 1}.`}
                  </div>
                </>
              )}
            </div>
          )}
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-[var(--primary)] text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] active:scale-[0.99]"
          >
            {editingQuestionId ? "Update question" : "Save question"}
          </button>
        </form>
      </BottomSheet>

      {hasAttemptsTab && (
        <div className="mb-4 rounded-xl border border-[#d8e3dd] bg-white/85 p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                activeTab === "questions" ? "bg-[#dff0e8] text-[var(--primary)]" : "text-[#5f6b66] hover:bg-[#f1f7f4]"
              }`}
            >
              Questions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("attempts")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                activeTab === "attempts" ? "bg-[#dff0e8] text-[var(--primary)]" : "text-[#5f6b66] hover:bg-[#f1f7f4]"
              }`}
            >
              {isOwner ? `Attempts (${attempts.length})` : `Answers (${attempts.length})`}
            </button>
          </div>
        </div>
      )}

      {(!hasAttemptsTab || activeTab === "questions") && (
        <>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Questions</h2>
          {file.questions.length === 0 && (
            <SurfaceCard className="mb-4 p-6 text-center text-sm text-gray-600">
              No questions yet. {showQuestionFab ? "Tap + to add one." : ""}
            </SurfaceCard>
          )}
          <div className="flex flex-col gap-3.5">
            {file.questions.map((q, i) => (
              <SurfaceCard key={q.id} className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-[#edf3f0] px-2 py-0.5 text-xs font-semibold text-[#51625c]">
                        Q{i + 1}
                      </span>
                      <QuestionTypeBadge type={q.type} />
                      <span className="text-[11px] text-[#5f6b66]">
                        {q.marks} pt{q.marks === 1 ? "" : "s"}
                      </span>
                    </div>
                    <MarkdownText content={q.text} className="mt-2.5 text-sm font-medium leading-relaxed text-gray-900" />
                    {q.options.length > 0 && (
                      <ul className="mt-3.5 space-y-2 text-sm text-gray-600">
                        {q.options.map((o, idx) => (
                          <li key={idx} className="flex items-start gap-2 rounded-lg bg-[#f7faf9] px-2.5 py-2">
                            <span
                              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                isOwner && q.correctIndices?.includes(idx)
                                  ? "bg-[#dff0e8] text-[var(--primary)]"
                                  : "bg-[#e8efec] text-[#5f6b66]"
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <MarkdownText content={o} inline className="min-w-0 flex-1 text-[#45524d]" />
                            {isOwner && q.correctIndices?.includes(idx) && (
                              <span className="text-[11px] font-semibold text-[var(--primary)]">Correct</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {isOwner && q.type === "text" && (q.referenceAnswer ?? "").trim() && (
                      <div className="mt-3.5 rounded-lg border border-[#d8e3dd] bg-[#f6faf8] p-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#5f6b66]">
                          Reference answer
                        </p>
                        <MarkdownText content={q.referenceAnswer ?? ""} className="text-sm text-[#3f4d48]" />
                      </div>
                    )}
                  </div>
                  {isOwner && !file.locked && (
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openQuestionEditorForEdit(q)}
                        className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </SurfaceCard>
            ))}
          </div>
        </>
      )}

      {hasAttemptsTab && activeTab === "attempts" && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {isOwner ? "Attempts" : "My answers"}
          </h2>
          <div className="flex flex-col gap-2.5">
            {attempts.map((a) => (
              <Link key={a.id} href={`/result/${a.id}`}>
                <SurfaceCard className="flex items-center justify-between gap-3 p-4 transition active:scale-[0.99]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{a.participantEmail}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {a.score} / {a.maxScore} · {a.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-indigo-600">View</span>
                </SurfaceCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showQuestionFab && (!hasAttemptsTab || activeTab === "questions") && (
        <Fab
          label="Add question"
          onClick={() => {
            openQuestionEditorForCreate();
          }}
        />
      )}
    </div>
  );
}
