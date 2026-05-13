import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { ExamFile } from "@/models/ExamFile";
import type { QuestionType } from "@/models/ExamFile";
import { questionById } from "@/lib/access";

type Params = { params: Promise<{ id: string; qId: string }> };

const TYPES: QuestionType[] = ["single", "multiple", "yesno", "text"];

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, qId } = await params;
  const body = await req.json();
  await connectDb();
  const file = await ExamFile.findById(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.ownerId.toString() !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (file.locked) return NextResponse.json({ error: "File is locked" }, { status: 400 });
  const q = questionById(file, qId);
  if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  if (body.text !== undefined) q.text = String(body.text).trim();
  if (body.type !== undefined && TYPES.includes(body.type)) q.type = body.type;
  if (body.options !== undefined) q.options = Array.isArray(body.options) ? body.options.map(String) : [];
  if (body.correctIndices !== undefined) {
    q.correctIndices = Array.isArray(body.correctIndices)
      ? body.correctIndices.map(Number).filter((n: number) => !Number.isNaN(n))
      : [];
  }
  if (body.referenceAnswer !== undefined) q.referenceAnswer = String(body.referenceAnswer ?? "").trim();
  if (body.marks !== undefined) q.marks = Number(body.marks) > 0 ? Number(body.marks) : 1;

  await file.save();
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

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, qId } = await params;
  await connectDb();
  const file = await ExamFile.findById(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.ownerId.toString() !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (file.locked) return NextResponse.json({ error: "File is locked" }, { status: 400 });
  file.questions = file.questions.filter((x) => x._id.toString() !== qId);
  await file.save();
  return NextResponse.json({ ok: true });
}
