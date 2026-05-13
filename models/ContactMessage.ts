import mongoose, { Schema, type Model, type Types } from "mongoose";

export type ContactMessageDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
};

const contactMessageSchema = new Schema<ContactMessageDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

contactMessageSchema.index({ createdAt: -1 });

export const ContactMessage: Model<ContactMessageDoc> =
  mongoose.models.ContactMessage ?? mongoose.model<ContactMessageDoc>("ContactMessage", contactMessageSchema);
