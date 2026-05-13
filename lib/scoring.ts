import type { ExamFileDoc, QuestionSub } from "@/models/ExamFile";
import type { AnswerEntry, TextEvaluation } from "@/models/Attempt";
import { normalizeIndices, setsEqual } from "@/lib/access";

function objectiveCorrect(q: QuestionSub, answer?: AnswerEntry): boolean {
  if (!answer) return false;
  if (q.type === "text") return false;
  const selected = normalizeIndices(answer.optionIndices);
  const correct = normalizeIndices(q.correctIndices);
  return setsEqual(selected, correct);
}

export function maxScoreForFile(file: ExamFileDoc): number {
  return file.questions.reduce((s, q) => s + (q.marks || 0), 0);
}

export function autoScoreForAnswers(file: ExamFileDoc, answers: AnswerEntry[]): number {
  let score = 0;
  for (const q of file.questions) {
    if (q.type === "text") continue;
    const a = answers.find((x) => x.questionId.toString() === q._id.toString());
    if (objectiveCorrect(q, a)) score += q.marks || 0;
  }
  return score;
}

export function manualScoreSum(evals: TextEvaluation[]): number {
  return evals.reduce((s, e) => s + e.marksAwarded, 0);
}

export function hasPendingText(
  file: ExamFileDoc,
  answers: AnswerEntry[],
  textEvals: TextEvaluation[],
): boolean {
  const evalIds = new Set(textEvals.map((e) => e.questionId.toString()));
  for (const q of file.questions) {
    if (q.type !== "text") continue;
    const a = answers.find((x) => x.questionId.toString() === q._id.toString());
    const hasAnswer = !!(a?.text && a.text.trim().length > 0);
    if (hasAnswer && !evalIds.has(q._id.toString())) return true;
  }
  return false;
}
