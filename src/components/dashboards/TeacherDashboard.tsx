import { GraduationCap, Users, BookOpen, MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-teal-500/10 to-amber-400/5 border border-teal-400/20 p-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="size-6 text-teal-300" />
          <h2 className="text-lg font-bold text-white">Teacher workspace</h2>
        </div>
        <p className="text-slate-300 text-sm mt-2">
          Assign readings, review student hifz, and prepare lessons. Class management goes live in the next release.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card icon={<Users className="size-5 text-teal-300" />} title="My students" value="—" hint="Roster coming soon" />
        <Card icon={<BookOpen className="size-5 text-amber-300" />} title="Active assignments" value="—" hint="Assign a surah" />
        <Card icon={<MessageSquare className="size-5 text-emerald-300" />} title="Messages" value="—" hint="Discussion threads" />
      </div>

      <section className="rounded-3xl bg-white/5 border border-white/10 p-6">
        <h3 className="text-white font-bold mb-3">Quick actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/quran" className="rounded-xl bg-teal-500/20 border border-teal-400/40 px-4 py-2 text-teal-100 text-sm font-bold hover:bg-teal-500/30">Open Quran</Link>
          <Link to="/chat" className="rounded-xl bg-amber-400/15 border border-amber-400/40 px-4 py-2 text-amber-200 text-sm font-bold hover:bg-amber-400/25">AI tafsir helper</Link>
        </div>
      </section>
    </div>
  );
}

function Card({ icon, title, value, hint }: { icon: React.ReactNode; title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="flex items-center gap-2 text-slate-400 text-xs">{icon} {title}</div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      <p className="text-slate-500 text-xs mt-1">{hint}</p>
    </div>
  );
}
