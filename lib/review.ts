import type { ExamFileDoc } from "@/models/ExamFile";
import type { AttemptDoc } from "@/models/Attempt";
import { normalizeIndices, setsEqual } from "@/lib/access";

export type ReviewItem =
  | { questionId: string; mode: "objective"; correct: boolean | null }
  | { questionId: string; mode: "text"; status: "empty" | "pending" | "graded" };

export function buildAttemptReview(file: ExamFileDoc, attempt: AttemptDoc): ReviewItem[] {
  return file.questions.map((q) => {
    const qid = q._id.toString();
    const ans = attempt.answers.find((a) => a.questionId.toString() === qid);
    if (q.type === "text") {
      const has = !!(ans?.text?.trim());
      const ev = attempt.textEvaluations.find((e) => e.questionId.toString() === qid);
      let status: "empty" | "pending" | "graded" = "empty";
      if (has && ev) status = "graded";
      else if (has) status = "pending";
      return { questionId: qid, mode: "text", status };
    }
    const selected = normalizeIndices(ans?.optionIndices);
    const correct = normalizeIndices(q.correctIndices);
    if (selected.length === 0) {
      return { questionId: qid, mode: "objective", correct: null };
    }
    return { questionId: qid, mode: "objective", correct: setsEqual(selected, correct) };
  });
}
