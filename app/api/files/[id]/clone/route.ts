import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { ExamFile } from "@/models/ExamFile";
import { Folder } from "@/models/Folder";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDb();
  const source = await ExamFile.findById(id).lean();
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const user = { id: session.sub, email: session.email };
  const isOwner = source.ownerId.toString() === user.id;
  const shared = source.sharedWith.some(
    (s) => s.email === user.email.toLowerCase() || s.userId?.toString() === user.id,
  );
  if (!isOwner && !shared) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ownerId = new mongoose.Types.ObjectId(session.sub);
  const home =
    (await Folder.findOne({ ownerId, parentId: null, name: "Home" })) ??
    (await Folder.create({ ownerId, parentId: null, name: "Home" }));
  const questions = source.questions.map((q) => ({
    text: q.text,
    type: q.type,
    options: [...q.options],
    correctIndices: [...q.correctIndices],
    marks: q.marks,
  }));
  const clone = await ExamFile.create({
    ownerId,
    folderId: home._id,
    name: `${source.name} (copy)`,
    locked: false,
    questions,
    sharedWith: [],
  });
  return NextResponse.json({
    file: {
      id: clone._id.toString(),
      name: clone.name,
      folderId: clone.folderId.toString(),
    },
  });
}
