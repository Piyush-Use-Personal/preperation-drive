import mongoose, { Schema, type Model, type Types } from "mongoose";

export type FolderDoc = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  parentId: Types.ObjectId | null;
  createdAt: Date;
};

const folderSchema = new Schema<FolderDoc>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Folder", default: null, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

folderSchema.index({ ownerId: 1, parentId: 1, name: 1 });

export const Folder: Model<FolderDoc> =
  mongoose.models.Folder ?? mongoose.model<FolderDoc>("Folder", folderSchema);
