import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { Attempt, type AttemptDoc } from "@/models/Attempt";
import { ExamFile, type ExamFileDoc } from "@/models/ExamFile";
import { canAccessFile } from "@/lib/access";
import { hasPendingText } from "@/lib/scoring";
import { buildAttemptReview } from "@/lib/review";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDb();
  const attempt = await Attempt.findById(id).lean();
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const file = await ExamFile.findById(attempt.fileId).lean();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const user = { id: session.sub, email: session.email };
  const role = canAccessFile(file, user);
  const isParticipant = attempt.participantId.toString() === session.sub;
  if (!isParticipant && role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const viewerRole = role === "owner" ? "owner" : "participant";
  const pendingEvaluation =
    attempt.status === "submitted" && hasPendingText(file, attempt.answers, attempt.textEvaluations);

  const review =
    attempt.status === "submitted"
      ? buildAttemptReview(file as unknown as ExamFileDoc, attempt as unknown as AttemptDoc)
      : [];

  return NextResponse.json({
    viewerRole,
    attempt: {
      id: attempt._id.toString(),
      fileId: attempt.fileId.toString(),
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      pendingEvaluation,
      answers: attempt.answers.map((a) => ({
        questionId: a.questionId.toString(),
        optionIndices: a.optionIndices,
        text: a.text,
      })),
      textEvaluations: attempt.textEvaluations.map((e) => ({
        questionId: e.questionId.toString(),
        marksAwarded: e.marksAwarded,
        correct: e.correct,
      })),
      submittedAt: attempt.submittedAt,
    },
    review,
    file: {
      id: file._id.toString(),
      name: file.name,
      questions: file.questions.map((q) => ({
        id: q._id.toString(),
        text: q.text,
        type: q.type,
        options: q.options,
        marks: q.marks,
        correctIndices: viewerRole === "owner" ? q.correctIndices : undefined,
        referenceAnswer: viewerRole === "owner" ? q.referenceAnswer ?? "" : undefined,
      })),
    },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await connectDb();
  const attempt = await Attempt.findById(id);
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (attempt.participantId.toString() !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }
  const file = await ExamFile.findById(attempt.fileId).lean();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const raw = body.answers as Array<{
    questionId: string;
    optionIndices?: number[];
    text?: string;
  }>;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "answers array required" }, { status: 400 });
  }
  const byQ = new Map<string, { optionIndices?: number[]; text?: string }>();
  for (const a of raw) {
    if (!a?.questionId) continue;
    byQ.set(a.questionId, {
      optionIndices: a.optionIndices,
      text: a.text,
    });
  }
  const answers = file.questions.map((q) => {
    const idStr = q._id.toString();
    const incoming = byQ.get(idStr);
    if (q.type === "text") {
      return {
        questionId: new mongoose.Types.ObjectId(idStr),
        text: incoming?.text ?? "",
      };
    }
    return {
      questionId: new mongoose.Types.ObjectId(idStr),
      optionIndices: incoming?.optionIndices ?? [],
    };
  });
  attempt.answers = answers;
  await attempt.save();
  return NextResponse.json({ ok: true });
}
