import { BookOpenText } from "lucide-react";

export function Brand({
  compact = false,
  center = false,
}: {
  compact?: boolean;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      <div className={`inline-flex items-center gap-2.5 ${compact ? "" : "md:gap-3"}`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d9f1ea] text-[#0ea5a7] shadow-[0_8px_20px_rgba(14,165,167,0.18)]">
          <BookOpenText className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <div className="leading-none">
          <p className={`${compact ? "text-xl" : "text-2xl"} font-bold tracking-tight text-[#2f3543]`}>
            PrepDrive
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#13a6a8]">
            Manage your preparation
          </p>
        </div>
      </div>
    </div>
  );
}
