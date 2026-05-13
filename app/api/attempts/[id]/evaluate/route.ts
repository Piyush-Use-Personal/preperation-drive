import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { Attempt } from "@/models/Attempt";
import { ExamFile } from "@/models/ExamFile";
import { questionById } from "@/lib/access";
import { autoScoreForAnswers } from "@/lib/scoring";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await connectDb();
  const attempt = await Attempt.findById(id);
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const file = await ExamFile.findById(attempt.fileId);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.ownerId.toString() !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (attempt.status !== "submitted") {
    return NextResponse.json({ error: "Attempt not submitted" }, { status: 400 });
  }
  const grades = body.grades as Array<{
    questionId: string;
    marksAwarded: number;
    correct: boolean;
  }>;
  if (!Array.isArray(grades)) {
    return NextResponse.json({ error: "grades array required" }, { status: 400 });
  }
  const textEvaluations = grades
    .map((g) => {
      const q = questionById(file, g.questionId);
      if (!q || q.type !== "text") return null;
      const cap = q.marks || 0;
      const marks = Math.min(Math.max(0, Number(g.marksAwarded) || 0), cap);
      return {
        questionId: new mongoose.Types.ObjectId(g.questionId),
        marksAwarded: marks,
        correct: !!g.correct,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  attempt.textEvaluations = textEvaluations;
  const auto = autoScoreForAnswers(file, attempt.answers);
  const manual = textEvaluations.reduce((s, e) => s + e.marksAwarded, 0);
  attempt.score = auto + manual;
  await attempt.save();

  return NextResponse.json({
    ok: true,
    score: attempt.score,
    maxScore: attempt.maxScore,
  });
}
