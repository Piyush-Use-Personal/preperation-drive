import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { Attempt } from "@/models/Attempt";
import { ExamFile } from "@/models/ExamFile";
import { hasPendingText } from "@/lib/scoring";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDb();
  const attempts = await Attempt.find({
    participantId: session.sub,
    status: "submitted",
  })
    .sort({ submittedAt: -1, updatedAt: -1 })
    .limit(20)
    .lean();

  const fileIds = [...new Set(attempts.map((a) => a.fileId.toString()))];
  const files = await ExamFile.find({ _id: { $in: fileIds } }).lean();
  const filesById = new Map(files.map((f) => [f._id.toString(), f]));

  const rows = attempts.map((a) => {
    const file = filesById.get(a.fileId.toString());
    const pending = file ? hasPendingText(file, a.answers, a.textEvaluations) : false;
    return {
      id: a._id.toString(),
      fileId: a.fileId.toString(),
      fileName: file?.name ?? "Untitled file",
      score: a.score,
      maxScore: a.maxScore,
      status: pending ? "pending" : "evaluated",
      submittedAt: a.submittedAt ?? a.updatedAt,
    };
  });

  return NextResponse.json({
    latestAttempts: rows.slice(0, 6),
    latestReviewed: rows.filter((r) => r.status === "evaluated").slice(0, 6),
  });
}
