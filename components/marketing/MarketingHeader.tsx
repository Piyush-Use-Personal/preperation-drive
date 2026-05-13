import Link from "next/link";
import { Brand } from "@/components/Brand";

export function MarketingHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Brand compact />
      <nav className="hidden items-center gap-5 md:flex">
        <Link href="/" className="text-sm font-medium text-[#4e5d58] hover:text-[var(--primary)]">
          Home
        </Link>
        <Link href="/product" className="text-sm font-medium text-[#4e5d58] hover:text-[var(--primary)]">
          Product
        </Link>
        <Link href="/about" className="text-sm font-medium text-[#4e5d58] hover:text-[var(--primary)]">
          About
        </Link>
        <Link href="/contact" className="text-sm font-medium text-[#4e5d58] hover:text-[var(--primary)]">
          Contact
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-full border border-[#d8e3dd] bg-white px-4 py-2 text-sm font-semibold text-[#44534e] transition hover:bg-[#f2f7f5]"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}
