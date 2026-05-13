"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Send } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(json.error ?? "Could not send message");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Could not send message");
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1160px] px-4 pb-12 pt-6 md:px-8 md:pt-8">
      <MarketingHeader />
      <section className="mt-12 md:mt-14">
        <h1 className="text-4xl font-bold tracking-tight text-[#1f2937] md:text-5xl">Contact</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5f6b66]">
          Need help with onboarding, product feedback, or classroom workflows? Reach out and we will get back quickly.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[#d8e3dd] bg-white/85 p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-[#25312e]">Contact us</h2>
          <p className="mt-1 text-sm text-[#5f6b66]">Your message is saved and sent to our Discord notifications.</p>
          <form onSubmit={submitContact} className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="h-11 rounded-xl border border-[#d8e3dd] bg-white px-3 text-sm outline-none ring-[#9ac9ba]/30 focus:ring-2"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              placeholder="Your email"
              className="h-11 rounded-xl border border-[#d8e3dd] bg-white px-3 text-sm outline-none ring-[#9ac9ba]/30 focus:ring-2"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
              className="h-11 rounded-xl border border-[#d8e3dd] bg-white px-3 text-sm outline-none ring-[#9ac9ba]/30 focus:ring-2 md:col-span-2"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              placeholder="How can we help?"
              className="rounded-xl border border-[#d8e3dd] bg-white p-3 text-sm outline-none ring-[#9ac9ba]/30 focus:ring-2 md:col-span-2"
            />
            {status === "success" && (
              <p className="text-sm font-medium text-[var(--primary)] md:col-span-2">Message sent successfully.</p>
            )}
            {status === "error" && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2 md:w-fit"
            >
              <Send className="h-4 w-4" strokeWidth={2.2} />
              {status === "loading" ? "Sending..." : "Send message"}
            </button>
          </form>
        </article>
        <article className="rounded-2xl border border-[#d8e3dd] bg-white/85 p-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff0e8] text-[var(--primary)]">
            <Mail className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-[#25312e]">Email us</h2>
          <p className="mt-2 text-sm text-[#5f6b66]">support@prepdrive.app</p>
        </article>
        <article className="rounded-2xl border border-[#d8e3dd] bg-white/85 p-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff0e8] text-[var(--primary)]">
            <MessageSquare className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-[#25312e]">Start now</h2>
          <p className="mt-2 text-sm text-[#5f6b66]">Create your workspace and try the full exam flow.</p>
          <Link href="/signup" className="mt-4 inline-flex text-sm font-semibold text-[var(--primary)]">
            Create account
          </Link>
        </article>
      </section>
      <MarketingFooter />
    </main>
  );
}
