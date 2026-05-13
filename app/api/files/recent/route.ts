import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { ExamFile } from "@/models/ExamFile";
import { Attempt } from "@/models/Attempt";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDb();
  const ownerId = new mongoose.Types.ObjectId(session.sub);
  const files = await ExamFile.find({ ownerId }).sort({ updatedAt: -1 }).limit(12).lean();
  const withCounts = await Promise.all(
    files.map(async (f) => {
      const n = await Attempt.countDocuments({ fileId: f._id, status: "submitted" });
      return {
        id: f._id.toString(),
        name: f.name,
        locked: f.locked,
        folderId: f.folderId.toString(),
        attemptsCount: n,
        updatedAt: f.updatedAt,
      };
    }),
  );
  return NextResponse.json({ files: withCounts });
}
