import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { Folder } from "@/models/Folder";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  await connectDb();
  const ownerId = new mongoose.Types.ObjectId(session.sub);
  const filter: Record<string, unknown> = { ownerId };
  if (parentId === null || parentId === "null" || parentId === "") {
    filter.parentId = null;
  } else if (parentId) {
    filter.parentId = new mongoose.Types.ObjectId(parentId);
  }
  const folders = await Folder.find(filter).sort({ name: 1 }).lean();
  return NextResponse.json({
    folders: folders.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      parentId: f.parentId?.toString() ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const parentIdRaw = body.parentId as string | null | undefined;
  await connectDb();
  const ownerId = new mongoose.Types.ObjectId(session.sub);
  let parentId: mongoose.Types.ObjectId | null = null;
  if (parentIdRaw) {
    const parent = await Folder.findOne({ _id: parentIdRaw, ownerId });
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    parentId = parent._id;
  }
  const folder = await Folder.create({ ownerId, name, parentId });
  return NextResponse.json({
    folder: {
      id: folder._id.toString(),
      name: folder.name,
      parentId: folder.parentId?.toString() ?? null,
    },
  });
}
