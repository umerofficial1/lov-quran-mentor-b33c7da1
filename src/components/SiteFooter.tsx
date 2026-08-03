import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-[#0A1230]/60">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-4 text-sm text-white/60">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 border border-[#E0B15A]/60 rotate-45 flex items-center justify-center bg-[#0B2420]">
              <span className="-rotate-45 font-display font-semibold text-[#E0B15A] text-sm">V</span>
            </span>
            <span className="font-display text-base tracking-[0.15em] uppercase text-[#E9F5F0]">
              Verse Wise
            </span>
          </div>
          <p className="mt-4 leading-relaxed text-white/50">
            AI-guided Quran learning in Arabic, English and Urdu — refined by technology,
            guided by tradition.
          </p>
        </div>

        <FooterColumn title="Learn">
          <FooterLink to="/quran">Read the Quran</FooterLink>
          <FooterLink to="/chat">AI Mentor</FooterLink>
          <FooterLink to="/hifz">Hifz Tracker</FooterLink>
        </FooterColumn>

        <FooterColumn title="Practice">
          <FooterLink to="/tools">Prayer Times</FooterLink>
          <FooterLink to="/tools">Qibla</FooterLink>
          <FooterLink to="/tools">Tasbeeh</FooterLink>
        </FooterColumn>

        <FooterColumn title="Account">
          <FooterLink to="/auth">Sign in</FooterLink>
          <FooterLink to="/dashboard">Dashboard</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Verse Wise Mentor. All rights reserved.</p>
          <p className="font-arabic text-sm text-[#E0B15A]/70" dir="rtl">
            وَقُل رَّبِّ زِدْنِي عِلْمًا
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-widest text-[#E0B15A] font-semibold mb-4">
        {title}
      </h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="hover:text-[#E9F5F0] transition-colors">
        {children}
      </Link>
    </li>
  );
}
