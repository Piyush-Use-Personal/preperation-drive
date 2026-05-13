import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { ExamFile } from "@/models/ExamFile";
import type { QuestionType } from "@/models/ExamFile";

type Params = { params: Promise<{ id: string }> };

const TYPES: QuestionType[] = ["single", "multiple", "yesno", "text"];

function normalizeQuestion(input: Record<string, unknown>) {
  const type = input.type as QuestionType;
  if (!TYPES.includes(type)) return { error: "Invalid type" as const };
  const text = String(input.text ?? "").trim();
  if (!text) return { error: "Question text required" as const };
  const options = Array.isArray(input.options) ? input.options.map(String) : [];
  const correctIndices: number[] = Array.isArray(input.correctIndices)
    ? input.correctIndices.map(Number).filter((n: number) => !Number.isNaN(n))
    : [];
  const referenceAnswer = String(input.referenceAnswer ?? "").trim();
  const marks = Number(input.marks) > 0 ? Number(input.marks) : 1;

  if (type === "yesno") {
    const opts = options.length >= 2 ? options : ["No", "Yes"];
    return {
      question: {
        text,
        type: "yesno" as const,
        options: opts.slice(0, 2),
        correctIndices:
          correctIndices.length > 0 ? correctIndices : input.correctYes === true || input.correctYes === "yes" ? [1] : [0],
        referenceAnswer: "",
        marks,
      },
    };
  }

  if (type === "text") {
    return {
      question: {
        text,
        type: "text" as const,
        options: [],
        correctIndices: [],
        referenceAnswer,
        marks,
      },
    };
  }

  if (options.length < 2) return { error: "At least two options required" as const };
  if (type === "single" && correctIndices.length !== 1) return { error: "Single select needs one correct index" as const };
  if (type === "multiple" && correctIndices.length < 1) return { error: "Multiple select needs correct indices" as const };

  return {
    question: {
      text,
      type,
      options,
      correctIndices,
      referenceAnswer: "",
      marks,
    },
  };
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const questions = Array.isArray(body.questions) ? body.questions : [];
  if (questions.length === 0) return NextResponse.json({ error: "No questions provided" }, { status: 400 });
  if (questions.length > 10) return NextResponse.json({ error: "Maximum 10 questions per batch" }, { status: 400 });

  await connectDb();
  const file = await ExamFile.findById(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.ownerId.toString() !== session.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (file.locked) return NextResponse.json({ error: "File is locked" }, { status: 400 });

  for (let i = 0; i < questions.length; i += 1) {
    const normalized = normalizeQuestion((questions[i] ?? {}) as Record<string, unknown>);
    if ("error" in normalized) {
      return NextResponse.json({ error: `Question ${i + 1}: ${normalized.error}` }, { status: 400 });
    }
    file.questions.push(normalized.question as never);
  }

  await file.save();
  return NextResponse.json({ ok: true, inserted: questions.length });
}
