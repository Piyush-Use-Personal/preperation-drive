export function SurfaceCard({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "button" | "a";
}) {
  const base =
    "surface-shell rounded-[var(--radius)] bg-[var(--card)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--ring-soft)] transition-shadow duration-200";
  return <Tag className={`${base} ${className}`.trim()}>{children}</Tag>;
}
