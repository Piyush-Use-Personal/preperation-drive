import { CheckCircle2, Rocket, Workflow } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export default function ProductPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1160px] px-4 pb-12 pt-6 md:px-8 md:pt-8">
      <MarketingHeader />
      <section className="mt-12 md:mt-14">
        <h1 className="text-4xl font-bold tracking-tight text-[#1f2937] md:text-5xl">Product experience</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5f6b66]">
          PrepDrive combines Drive-like organization with exam authoring and evaluation, so teachers and learners
          can move from question creation to scoring without friction.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { title: "Create fast", desc: "Question editor, markdown support, and AI JSON import.", Icon: Rocket },
          { title: "Organize smart", desc: "Folder hierarchy, breadcrumbs, and drag-drop movement.", Icon: Workflow },
          { title: "Grade clearly", desc: "Auto + manual scoring with reference answers and attempt insights.", Icon: CheckCircle2 },
        ].map(({ title, desc, Icon }) => (
          <article key={title} className="rounded-2xl border border-[#d8e3dd] bg-white/85 p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff0e8] text-[var(--primary)]">
              <Icon className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-[#25312e]">{title}</h2>
            <p className="mt-2 text-sm text-[#5f6b66]">{desc}</p>
          </article>
        ))}
      </section>
      <MarketingFooter />
    </main>
  );
}
