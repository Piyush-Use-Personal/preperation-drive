import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, FolderTree, Sparkles } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

function secret() {
  const s = process.env.JWT_SECRET ?? process.env.AUTH_SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
}

export default async function Page() {
  const jar = await cookies();
  const token = jar.get("pd_session")?.value;
  const key = secret();
  if (token && key) {
    try {
      await jwtVerify(token, key);
      redirect("/home");
    } catch {
      // Invalid session falls through to public landing page.
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1160px] px-4 pb-12 pt-6 md:px-8 md:pt-8">
      <MarketingHeader />

      <section className="mt-10 grid gap-6 md:mt-14 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dff0e8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
            Smarter exam prep workflow
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2937] md:text-5xl">
            Build, organize, and evaluate your preparation in one place.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5f6b66]">
            PrepDrive helps you create question banks, share tests, collect attempts, and grade responses quickly with
            markdown support and AI-assisted JSON imports.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Start for free
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-[#d8e3dd] bg-white px-5 py-3 text-sm font-semibold text-[#4b5b56] transition hover:bg-[#f2f7f5]"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-[#d8e3dd] bg-white/90 p-5 shadow-[0_20px_50px_rgba(17,24,39,0.08)]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#e2ebe7] bg-[#f6faf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5f6b66]">Question flow</p>
              <p className="mt-1 text-sm font-medium text-[#34443f]">Markdown questions + reference answers</p>
            </div>
            <div className="rounded-2xl border border-[#e2ebe7] bg-[#f6faf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5f6b66]">Organization</p>
              <p className="mt-1 text-sm font-medium text-[#34443f]">Drive-like folders with drag-and-drop movement</p>
            </div>
            <div className="rounded-2xl border border-[#e2ebe7] bg-[#f6faf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5f6b66]">Evaluation</p>
              <p className="mt-1 text-sm font-medium text-[#34443f]">Full, partial, and zero grading for text answers</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-3 md:mt-16 md:grid-cols-3">
        {[
          { title: "Create fast", desc: "Use editor or import AI-generated JSON in validated batches.", Icon: FileText },
          { title: "Stay organized", desc: "Manage exam files by folders and quick breadcrumb navigation.", Icon: FolderTree },
          { title: "Review clearly", desc: "Track attempts and evaluate text answers with confidence.", Icon: CheckCircle2 },
        ].map(({ title, desc, Icon }) => (
          <article key={title} className="rounded-2xl border border-[#d8e3dd] bg-white/85 p-4">
            <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dff0e8] text-[var(--primary)]">
              <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
            </span>
            <h2 className="text-base font-semibold text-[#25312e]">{title}</h2>
            <p className="mt-1 text-sm text-[#5f6b66]">{desc}</p>
          </article>
        ))}
      </section>
      <MarketingFooter />
    </main>
  );
}
