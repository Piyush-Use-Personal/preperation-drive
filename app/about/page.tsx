import { Leaf, ShieldCheck, Users } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1160px] px-4 pb-12 pt-6 md:px-8 md:pt-8">
      <MarketingHeader />
      <section className="mt-12 md:mt-14">
        <h1 className="text-4xl font-bold tracking-tight text-[#1f2937] md:text-5xl">About PrepDrive</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5f6b66]">
          We designed PrepDrive to simplify preparation workflows: content creation, organization, sharing, and
          grading in one clean, focused experience.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { title: "Learner-centered", desc: "Make preparation feel structured and less stressful.", Icon: Users },
          { title: "Reliable", desc: "Clear flows for attempts, evaluation, and feedback.", Icon: ShieldCheck },
          { title: "Sustainable", desc: "Reusable banks and imports reduce repeated effort.", Icon: Leaf },
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
