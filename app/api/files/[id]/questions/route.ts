import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { ExamFile } from "@/models/ExamFile";
import type { QuestionType } from "@/models/ExamFile";

type Params = { params: Promise<{ id: string }> };

const TYPES: QuestionType[] = ["single", "multiple", "yesno", "text"];

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await connectDb();
  const file = await ExamFile.findById(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.ownerId.toString() !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (file.locked) return NextResponse.json({ error: "File is locked" }, { status: 400 });
  const type = body.type as QuestionType;
  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Question text required" }, { status: 400 });
  const options = Array.isArray(body.options) ? body.options.map(String) : [];
  const correctIndices: number[] = Array.isArray(body.correctIndices)
    ? body.correctIndices.map(Number).filter((n: number) => !Number.isNaN(n))
    : [];
  const referenceAnswer = String(body.referenceAnswer ?? "").trim();
  const marks = Number(body.marks) > 0 ? Number(body.marks) : 1;
  const rawPosition = body.position;
  const position =
    rawPosition === "end" || rawPosition === undefined || rawPosition === null
      ? "end"
      : Number.isInteger(Number(rawPosition))
        ? Number(rawPosition)
        : "end";

  let nextQuestion:
    | {
        text: string;
        type: QuestionType;
        options: string[];
        correctIndices: number[];
        referenceAnswer: string;
        marks: number;
      }
    | undefined;

  if (type === "yesno") {
    const opts = options.length >= 2 ? options : ["No", "Yes"];
    nextQuestion = {
      text,
      type: "yesno",
      options: opts.slice(0, 2),
      correctIndices:
        correctIndices.length > 0
          ? correctIndices
          : body.correctYes === true || body.correctYes === "yes"
            ? [1]
            : [0],
      referenceAnswer: "",
      marks,
    };
  } else if (type === "text") {
    nextQuestion = {
      text,
      type: "text",
      options: [],
      correctIndices: [],
      referenceAnswer,
      marks,
    };
  } else {
    if (options.length < 2) {
      return NextResponse.json({ error: "At least two options required" }, { status: 400 });
    }
    if (type === "single" && correctIndices.length !== 1) {
      return NextResponse.json({ error: "Single select needs one correct index" }, { status: 400 });
    }
    if (type === "multiple" && correctIndices.length < 1) {
      return NextResponse.json({ error: "Multiple select needs correct indices" }, { status: 400 });
    }
    nextQuestion = {
      text,
      type,
      options,
      correctIndices,
      referenceAnswer: "",
      marks,
    };
  }

  if (position === "end") {
    file.questions.push(nextQuestion as never);
  } else {
    const insertAt = Math.max(0, Math.min(Number(position), file.questions.length));
    file.questions.splice(insertAt, 0, nextQuestion as never);
  }
  await file.save();
  const q = file.questions[file.questions.length - 1];
  return NextResponse.json({
    question: {
      id: q._id.toString(),
      text: q.text,
      type: q.type,
      options: q.options,
      correctIndices: q.correctIndices,
      referenceAnswer: q.referenceAnswer ?? "",
      marks: q.marks,
    },
  });
}
