import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { Attempt } from "@/models/Attempt";
import { ExamFile } from "@/models/ExamFile";
import { autoScoreForAnswers, maxScoreForFile } from "@/lib/scoring";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDb();
  const attempt = await Attempt.findById(id);
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (attempt.participantId.toString() !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }
  const file = await ExamFile.findById(attempt.fileId);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const max = maxScoreForFile(file);
  const auto = autoScoreForAnswers(file, attempt.answers);
  attempt.maxScore = max;
  attempt.score = auto;
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  await attempt.save();

  const submittedCount = await Attempt.countDocuments({
    fileId: file._id,
    status: "submitted",
  });
  if (submittedCount >= 1) {
    file.locked = true;
    await file.save();
  }

  return NextResponse.json({
    attemptId: attempt._id.toString(),
    score: attempt.score,
    maxScore: attempt.maxScore,
  });
}
