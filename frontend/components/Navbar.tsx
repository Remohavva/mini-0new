"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";

interface Profile {
  full_name: string;
  email: string;
  user_type: string;
  college_or_company: string;
  avatar_url?: string;
}

const navLinks = [
  { href: "/rides", label: "Browse", icon: "🔍" },
  { href: "/rides/new", label: "Offer", icon: "➕" },
  { href: "/history", label: "History", icon: "🕐" },
  { href: "/dashboard", label: "Home", icon: "🏠" },
];

function UserMenu({ profile, handleLogout }: { profile: Profile | null, handleLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = profile?.full_name?.split(" ")?.map((n) => n[0])?.join("")?.toUpperCase()?.slice(0, 2) || "?";

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="focus:outline-none" aria-label="User menu">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="Avatar" width={36} height={36}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 hover:ring-blue-500 transition" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-slate-200">
            {initials}
          </div>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">{initials}</div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate text-slate-900">{profile?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
            </div>
          </div>
          <div className="px-4 py-2 border-b border-slate-200">
            <p className="text-xs text-slate-500">
              {profile?.user_type === "student" ? "🎓 Student" : "💼 Corporate"}
              {profile?.college_or_company ? ` · ${profile.college_or_company}` : ""}
            </p>
          </div>
          <div className="py-1">
            <Link href="/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition">
              👤 View Profile
            </Link>
            <Link href="/leaderboard" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-500 transition">
              🏆 Leaderboard
            </Link>
            <Link href="/admin" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition">
              📊 Admin Dashboard
            </Link>
            <button onClick={() => { setOpen(false); handleLogout(); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition">
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      apiFetch<Profile>("/users/me").then(setProfile).catch(() => {
        const meta = data.user!.user_metadata;
        setProfile({
          full_name: meta?.full_name ?? "User",
          email: data.user!.email ?? "",
          user_type: meta?.user_type ?? "student",
          college_or_company: meta?.college_or_company ?? "",
          avatar_url: meta?.avatar_url ?? "",
        });
      });
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      {/* Desktop navbar */}
      <nav className="hidden sm:flex bg-white border-b border-slate-200 px-6 py-3 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-blue-600">🏍️ Pillion</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg transition ${pathname === l.href ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"}`}>
              {l.label}
            </Link>
          ))}
          <NotificationBell />
          <UserMenu profile={profile} handleLogout={handleLogout} />
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="sm:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-blue-600 text-lg">🏍️ Pillion</Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu profile={profile} handleLogout={handleLogout} />
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex">
        {navLinks.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link key={l.href} href={l.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition ${active ? "text-blue-600" : "text-slate-400"}`}>
              <span className="text-xl">{l.icon}</span>
              <span className="text-xs font-medium">{l.label}</span>
            </Link>
          );
        })}
        <Link href="/profile"
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition ${pathname === "/profile" ? "text-blue-600" : "text-slate-400"}`}>
          <span className="text-xl">👤</span>
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>

      {/* Bottom padding so content isn't hidden behind tab bar on mobile */}
      <div className="sm:hidden h-16" />
    </>
  );
}
