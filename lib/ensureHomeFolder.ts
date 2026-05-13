import type { Types } from "mongoose";
import { Folder } from "@/models/Folder";

export async function ensureHomeFolder(ownerId: Types.ObjectId) {
  const existing = await Folder.findOne({ ownerId, parentId: null, name: "Home" });
  if (existing) return existing;
  return Folder.create({ ownerId, name: "Home", parentId: null });
}
