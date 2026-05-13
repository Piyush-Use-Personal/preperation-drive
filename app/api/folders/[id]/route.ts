import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { Folder } from "@/models/Folder";
import { ExamFile } from "@/models/ExamFile";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDb();
  const ownerId = new mongoose.Types.ObjectId(session.sub);
  const folder = await Folder.findOne({ _id: id, ownerId }).lean();
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const siblingFilter = folder.parentId ? { ownerId, parentId: folder.parentId } : { ownerId, parentId: null };
  const siblings = await Folder.find(siblingFilter).sort({ name: 1 }).lean();
  const subfolders = await Folder.find({ ownerId, parentId: folder._id }).sort({ name: 1 }).lean();
  const files = await ExamFile.find({ ownerId, folderId: folder._id }).sort({ updatedAt: -1 }).lean();
  const attemptCounts = await Promise.all(
    files.map(async (f) => {
      const { Attempt } = await import("@/models/Attempt");
      const n = await Attempt.countDocuments({ fileId: f._id, status: "submitted" });
      return { fileId: f._id.toString(), count: n };
    }),
  );
  const countMap = Object.fromEntries(attemptCounts.map((x) => [x.fileId, x.count]));

  const breadcrumbDocs: Array<{ id: string; name: string }> = [];
  let current: { _id: mongoose.Types.ObjectId; name: string; parentId?: mongoose.Types.ObjectId | null } | null = {
    _id: folder._id,
    name: folder.name,
    parentId: folder.parentId,
  };
  while (current) {
    breadcrumbDocs.unshift({ id: current._id.toString(), name: current.name });
    if (!current.parentId) break;
    const parent:
      | { _id: mongoose.Types.ObjectId; name: string; parentId?: mongoose.Types.ObjectId | null }
      | null = await Folder.findOne({ _id: current.parentId, ownerId })
      .select("_id name parentId")
      .lean();
    if (!parent) break;
    current = parent;
  }

  return NextResponse.json({
    folder: {
      id: folder._id.toString(),
      name: folder.name,
      parentId: folder.parentId?.toString() ?? null,
    },
    breadcrumbs: breadcrumbDocs,
    siblings: siblings
      .filter((f) => f._id.toString() !== folder._id.toString())
      .map((f) => ({
        id: f._id.toString(),
        name: f.name,
        parentId: f.parentId?.toString() ?? null,
      })),
    folders: subfolders.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      parentId: f.parentId?.toString() ?? null,
    })),
    files: files.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      locked: f.locked,
      attemptsCount: countMap[f._id.toString()] ?? 0,
      updatedAt: f.updatedAt,
    })),
  });
}
