import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="mt-16 border-t border-[#d8e3dd] pt-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-[#2f3d38]">PrepDrive</p>
          <p className="mt-2 text-sm text-[#5f6b66]">Manage your preparation with modern exam workflows.</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#2f3d38]">Explore</p>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-[#5f6b66]">
            <Link href="/" className="hover:text-[var(--primary)]">
              Home
            </Link>
            <Link href="/product" className="hover:text-[var(--primary)]">
              Product
            </Link>
            <Link href="/about" className="hover:text-[var(--primary)]">
              About
            </Link>
            <Link href="/contact" className="hover:text-[var(--primary)]">
              Contact
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#2f3d38]">Start</p>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-[#5f6b66]">
            <Link href="/signup" className="hover:text-[var(--primary)]">
              Create account
            </Link>
            <Link href="/login" className="hover:text-[var(--primary)]">
              Sign in
            </Link>
          </div>
        </div>
      </div>
      <p className="mt-8 pb-8 text-xs text-[#7a8782]">© {new Date().getFullYear()} PrepDrive. All rights reserved.</p>
    </footer>
  );
}
