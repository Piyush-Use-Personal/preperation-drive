import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { Folder } from "@/models/Folder";
import { ExamFile } from "@/models/ExamFile";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const folderId = String(body.folderId ?? "");
  if (!name || !folderId) {
    return NextResponse.json({ error: "name and folderId required" }, { status: 400 });
  }
  await connectDb();
  const ownerId = new mongoose.Types.ObjectId(session.sub);
  const folder = await Folder.findOne({ _id: folderId, ownerId });
  if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  const file = await ExamFile.create({
    ownerId,
    folderId: folder._id,
    name,
    locked: false,
    questions: [],
    sharedWith: [],
  });
  return NextResponse.json({
    file: {
      id: file._id.toString(),
      name: file.name,
      folderId: file.folderId.toString(),
      locked: file.locked,
    },
  });
}
