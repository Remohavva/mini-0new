"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

interface Profile {
  full_name: string;
  email: string;
  user_type: string;
  college_or_company: string;
  avatar_url?: string;
}

export default function Navbar() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const initials = profile?.full_name
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-green-600 text-lg">
        🏍️ Pillion
      </Link>

      <div className="flex items-center gap-4 text-sm">
        <Link href="/rides" className="text-gray-600 hover:text-green-600">Browse Rides</Link>
        <Link href="/rides/new" className="text-gray-600 hover:text-green-600">Offer Ride</Link>
        <Link href="/dashboard" className="text-gray-600 hover:text-green-600">Dashboard</Link>

        {/* Avatar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="focus:outline-none"
            aria-label="User menu"
          >
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-green-200 hover:ring-green-500 transition"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-green-200 hover:ring-green-500 transition">
                {initials}
              </div>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
              {/* User info header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Avatar"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="px-4 py-2 border-b">
                <p className="text-xs text-gray-500">
                  {profile?.user_type === "student" ? "🎓 Student" : "💼 Corporate"} · {profile?.college_or_company}
                </p>
              </div>

              {/* Actions */}
              <div className="py-1">
                <Link href="/profile" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                  👤 View Profile
                </Link>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition">
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
