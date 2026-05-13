import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { ExamFile } from "@/models/ExamFile";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDb();
  const email = session.email.toLowerCase();
  const userId = new mongoose.Types.ObjectId(session.sub);
  const files = await ExamFile.find({
    $or: [{ "sharedWith.email": email }, { "sharedWith.userId": userId }],
  })
    .sort({ updatedAt: -1 })
    .lean();
  return NextResponse.json({
    files: files.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      ownerId: f.ownerId.toString(),
      locked: f.locked,
      updatedAt: f.updatedAt,
    })),
  });
}
