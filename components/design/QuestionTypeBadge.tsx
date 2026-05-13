const labels: Record<string, string> = {
  single: "MCQ",
  multiple: "Multi",
  yesno: "Y/N",
  text: "Text",
};

export function QuestionTypeBadge({ type }: { type: string }) {
  const label = labels[type] ?? type;
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-[#e8f2ee] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#466059]">
      {label}
    </span>
  );
}
