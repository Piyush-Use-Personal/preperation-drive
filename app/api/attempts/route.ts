import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { ExamFile } from "@/models/ExamFile";
import { Attempt } from "@/models/Attempt";
import { canAccessFile } from "@/lib/access";
import { maxScoreForFile } from "@/lib/scoring";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const fileId = String(body.fileId ?? "");
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });
  await connectDb();
  const file = await ExamFile.findById(fileId).lean();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const user = { id: session.sub, email: session.email };
  const role = canAccessFile(file, user);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const participantId = new mongoose.Types.ObjectId(session.sub);
  const existing = await Attempt.findOne({
    fileId: file._id,
    participantId,
    status: "in_progress",
  }).sort({ createdAt: -1 });
  if (existing) {
    return NextResponse.json({
      attempt: {
        id: existing._id.toString(),
        fileId: file._id.toString(),
        status: existing.status,
        answers: existing.answers.map((a) => ({
          questionId: a.questionId.toString(),
          optionIndices: a.optionIndices,
          text: a.text,
        })),
      },
    });
  }

  const attempt = await Attempt.create({
    fileId: file._id,
    participantId,
    answers: [],
    status: "in_progress",
    score: 0,
    maxScore: maxScoreForFile(file),
    textEvaluations: [],
  });
  return NextResponse.json({
    attempt: {
      id: attempt._id.toString(),
      fileId: file._id.toString(),
      status: attempt.status,
      answers: [],
    },
  });
}
