import type { ExamFileDoc } from "@/models/ExamFile";

export function canAccessFile(
  file: ExamFileDoc,
  user: { id: string; email: string },
): "owner" | "participant" | null {
  if (file.ownerId.toString() === user.id) return "owner";
  const e = user.email.toLowerCase();
  const shared = file.sharedWith.some(
    (s) => s.email.toLowerCase() === e || s.userId?.toString() === user.id,
  );
  return shared ? "participant" : null;
}

export function questionById(file: ExamFileDoc, qid: string) {
  return file.questions.find((q) => q._id.toString() === qid);
}

export function normalizeIndices(arr: number[] | undefined) {
  return [...(arr ?? [])].sort((a, b) => a - b);
}

export function setsEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
