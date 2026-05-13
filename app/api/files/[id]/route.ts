import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { ExamFile } from "@/models/ExamFile";
import { Attempt } from "@/models/Attempt";
import { User } from "@/models/User";
import { Folder } from "@/models/Folder";
import { canAccessFile } from "@/lib/access";
import { maxScoreForFile, hasPendingText } from "@/lib/scoring";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDb();
  const file = await ExamFile.findById(id).lean();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const user = { id: session.sub, email: session.email };
  const role = canAccessFile(file, user);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempts =
    role === "owner"
      ? await Attempt.find({ fileId: file._id, status: "submitted" })
          .sort({ submittedAt: -1 })
          .populate("participantId", "email")
          .lean()
      : await Attempt.find({
          fileId: file._id,
          participantId: session.sub,
          status: "submitted",
        })
          .sort({ submittedAt: -1 })
          .lean();

  const submitted = await Attempt.countDocuments({ fileId: file._id, status: "submitted" });
  const agg = await Attempt.aggregate([
    { $match: { fileId: file._id, status: "submitted" } },
    { $group: { _id: null, avg: { $avg: "$score" }, pass: { $sum: { $cond: [{ $gte: ["$score", maxScoreForFile(file) * 0.5] }, 1, 0] } } } },
  ]);
  const avgScore = agg[0]?.avg ?? 0;
  const passRate = submitted > 0 ? (agg[0]?.pass ?? 0) / submitted : 0;

  return NextResponse.json({
    role,
    file: {
      id: file._id.toString(),
      name: file.name,
      folderId: file.folderId.toString(),
      ownerId: file.ownerId.toString(),
      locked: file.locked,
      sharedWith: file.sharedWith.map((s) => ({
        email: s.email,
        userId: s.userId?.toString(),
      })),
      questions: file.questions.map((q) => ({
        id: q._id.toString(),
        text: q.text,
        type: q.type,
        options: q.options,
        correctIndices: role === "owner" ? q.correctIndices : undefined,
        referenceAnswer: role === "owner" ? q.referenceAnswer ?? "" : undefined,
        marks: q.marks,
      })),
      analytics: {
        totalAttempts: submitted,
        averageScore: Math.round(avgScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
      },
    },
    attempts: await Promise.all(
      attempts.map(async (a) => {
        const p = a.participantId as unknown as { email?: string };
        let email = role === "owner" ? p?.email : session.email;
        if (!email && a.participantId) {
          const u = await User.findById(a.participantId).lean();
          email = u?.email;
        }
        const max = maxScoreForFile(file);
        const pending = hasPendingText(file, a.answers, a.textEvaluations);
        return {
          id: a._id.toString(),
          participantEmail: role === "owner" ? (email ?? "User") : "You",
          score: a.score,
          maxScore: max,
          status: pending ? "pending" : "evaluated",
          submittedAt: a.submittedAt,
        };
      }),
    ),
  });
}

export async function PATCH(req: Request, { params }: Params) {
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
  if (file.locked) {
    return NextResponse.json({ error: "File is locked" }, { status: 400 });
  }
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name) file.name = name;
  }
  if (body.folderId !== undefined) {
    const folderId = String(body.folderId).trim();
    const targetFolder = await Folder.findOne({ _id: folderId, ownerId: file.ownerId }).lean();
    if (!targetFolder) {
      return NextResponse.json({ error: "Target folder not found" }, { status: 400 });
    }
    file.folderId = targetFolder._id;
  }
  await file.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDb();
  const file = await ExamFile.findById(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.ownerId.toString() !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await Attempt.deleteMany({ fileId: file._id });
  await file.deleteOne();
  return NextResponse.json({ ok: true });
}
