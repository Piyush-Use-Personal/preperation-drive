import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { Folder } from "@/models/Folder";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null, homeFolderId: null });
  }
  await connectDb();
  const user = await User.findById(session.sub).lean();
  if (!user) {
    return NextResponse.json({ user: null, homeFolderId: null });
  }
  const ownerId = new mongoose.Types.ObjectId(session.sub);
  const home =
    (await Folder.findOne({ ownerId, parentId: null, name: "Home" })) ??
    (await Folder.create({ ownerId, parentId: null, name: "Home" }));
  return NextResponse.json({
    user: { id: user._id.toString(), email: user.email },
    homeFolderId: home._id.toString(),
  });
}
