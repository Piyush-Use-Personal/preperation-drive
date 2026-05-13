import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { ExamFile } from "@/models/ExamFile";
import { User } from "@/models/User";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  await connectDb();
  const file = await ExamFile.findById(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.ownerId.toString() !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const exists = file.sharedWith.some((s) => s.email === email);
  if (!exists) {
    const user = await User.findOne({ email }).lean();
    file.sharedWith.push({
      email,
      userId: user?._id ? new mongoose.Types.ObjectId(user._id) : undefined,
    });
    await file.save();
  }
  return NextResponse.json({
    sharedWith: file.sharedWith.map((s) => ({
      email: s.email,
      userId: s.userId?.toString(),
    })),
  });
}
