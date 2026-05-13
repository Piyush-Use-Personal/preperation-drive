import mongoose, { Schema, type Model, type Types } from "mongoose";

export type AnswerEntry = {
  questionId: Types.ObjectId;
  optionIndices?: number[];
  text?: string;
};

export type TextEvaluation = {
  questionId: Types.ObjectId;
  marksAwarded: number;
  correct: boolean;
};

export type AttemptDoc = {
  _id: Types.ObjectId;
  fileId: Types.ObjectId;
  participantId: Types.ObjectId;
  answers: AnswerEntry[];
  status: "in_progress" | "submitted";
  score: number;
  maxScore: number;
  textEvaluations: TextEvaluation[];
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const answerSchema = new Schema<AnswerEntry>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    optionIndices: { type: [Number], default: undefined },
    text: { type: String, default: undefined },
  },
  { _id: false },
);

const textEvalSchema = new Schema<TextEvaluation>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    marksAwarded: { type: Number, required: true },
    correct: { type: Boolean, required: true },
  },
  { _id: false },
);

const attemptSchema = new Schema<AttemptDoc>(
  {
    fileId: { type: Schema.Types.ObjectId, ref: "ExamFile", required: true, index: true },
    participantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
    },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    textEvaluations: { type: [textEvalSchema], default: [] },
    submittedAt: { type: Date },
  },
  { timestamps: true },
);

attemptSchema.index({ fileId: 1, participantId: 1, status: 1 });

export const Attempt: Model<AttemptDoc> =
  mongoose.models.Attempt ?? mongoose.model<AttemptDoc>("Attempt", attemptSchema);
