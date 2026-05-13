import mongoose, { Schema, type Model, type Types } from "mongoose";

export type QuestionType = "single" | "multiple" | "yesno" | "text";

export type QuestionSub = {
  _id: Types.ObjectId;
  text: string;
  type: QuestionType;
  options: string[];
  /** For single/multiple/yesno: indices into `options` (yesno uses options ["No","Yes"]) */
  correctIndices: number[];
  referenceAnswer?: string;
  marks: number;
};

export type SharedEntry = {
  email: string;
  userId?: Types.ObjectId;
};

export type ExamFileDoc = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  folderId: Types.ObjectId;
  name: string;
  locked: boolean;
  questions: QuestionSub[];
  sharedWith: SharedEntry[];
  updatedAt: Date;
  createdAt: Date;
};

const questionSchema = new Schema<QuestionSub>(
  {
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["single", "multiple", "yesno", "text"],
      required: true,
    },
    options: { type: [String], default: [] },
    correctIndices: { type: [Number], default: [] },
    referenceAnswer: { type: String, default: "" },
    marks: { type: Number, default: 1 },
  },
  { _id: true },
);

const sharedSchema = new Schema<SharedEntry>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { _id: false },
);

const examFileSchema = new Schema<ExamFileDoc>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    folderId: { type: Schema.Types.ObjectId, ref: "Folder", required: true, index: true },
    name: { type: String, required: true, trim: true },
    locked: { type: Boolean, default: false },
    questions: { type: [questionSchema], default: [] },
    sharedWith: { type: [sharedSchema], default: [] },
  },
  { timestamps: true },
);

examFileSchema.index({ ownerId: 1, updatedAt: -1 });

export const ExamFile: Model<ExamFileDoc> =
  mongoose.models.ExamFile ?? mongoose.model<ExamFileDoc>("ExamFile", examFileSchema);
