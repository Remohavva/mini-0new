"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import RatingStars from "@/components/RatingStars";
import SOSButton from "@/components/SOSButton";
import VerificationBadge from "@/components/VerificationBadge";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  college_or_company: string;
  phone?: string;
  avatar_url?: string;
  bike_model?: string;
  bike_number?: string;
  bike_image_url?: string;
  referral_code?: string;
  credits?: number;
}

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  status: string;
  bike_model?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [avgRating, setAvgRating] = useState<{ avg_rating: number; total: number } | null>(null);
  const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "" });
  const [savingContact, setSavingContact] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>("unverified");
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const licenseRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", college_or_company: "", bike_model: "", bike_number: "" });
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }

      // Build profile from Supabase user metadata as fallback
      const meta = data.user.user_metadata;
      const fallback: Profile = {
        id: data.user.id,
        email: data.user.email ?? "",
        full_name: meta?.full_name ?? "User",
        user_type: meta?.user_type ?? "student",
        college_or_company: meta?.college_or_company ?? "",
        phone: meta?.phone ?? "",
        avatar_url: meta?.avatar_url ?? "",
      };

      try {
        const p = await apiFetch<Profile>("/users/me");
        setProfile(p);
        setForm({ full_name: p.full_name, phone: p.phone ?? "", college_or_company: p.college_or_company, bike_model: p.bike_model ?? "", bike_number: p.bike_number ?? "" });
        apiFetch<Ride[]>("/rides/my").then(setMyRides).catch(() => {});
        apiFetch<{ avg_rating: number; total: number }>(`/ratings/user/${data.user.id}`).then(setAvgRating).catch(() => {});
        apiFetch<{ name: string; phone: string } | null>("/emergency/contact").then((c) => { if (c) setEmergencyContact(c); }).catch(() => {});
        apiFetch<{ verification_status: string }>("/verification/status").then((v) => setVerificationStatus(v.verification_status)).catch(() => {});
        // Auto-fetch bike image if model set but no image yet
        if (p.bike_model && !p.bike_image_url) {
          apiFetch<{ image_url: string | null }>(`/bikes/save-image?model=${encodeURIComponent(p.bike_model)}`, { method: "POST" })
            .then((r) => { if (r.image_url) setProfile((prev) => prev ? { ...prev, bike_image_url: r.image_url! } : prev); })
            .catch(() => {});
        }
      } catch {
        setProfile(fallback);
        setForm({ full_name: fallback.full_name, phone: fallback.phone ?? "", college_or_company: fallback.college_or_company, bike_model: fallback.bike_model ?? "", bike_number: fallback.bike_number ?? "" });
        setError("Could not reach backend — showing local profile data.");
      }
    });
  }, [router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { setMsg("Upload failed: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await apiFetch("/users/me", { method: "PUT", body: JSON.stringify({ avatar_url: data.publicUrl }) });
    setProfile({ ...profile, avatar_url: data.publicUrl });
    setMsg("Avatar updated.");
    setUploading(false);
  }

  async function handleLicenseUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingLicense(true);
    const path = `${profile.id}/license.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("licenses").upload(path, file, { upsert: true });
    if (error) { setMsg("Upload failed: " + error.message); setUploadingLicense(false); return; }
    const { data } = supabase.storage.from("licenses").getPublicUrl(path);
    await apiFetch("/verification/submit", { method: "POST", body: JSON.stringify({ license_url: data.publicUrl }) });
    setVerificationStatus("pending");
    setMsg("License uploaded. Verification pending review.");
    setUploadingLicense(false);
  }
  async function handleSave() {
    setSaving(true);
    setMsg("");
    try {
      const updated = await apiFetch<Profile>("/users/me", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setProfile(updated);
      setEditing(false);
      setMsg("Profile updated.");
      // Re-fetch bike image if model changed
      if (form.bike_model && form.bike_model !== profile?.bike_model) {
        apiFetch<{ image_url: string | null }>(`/bikes/save-image?model=${encodeURIComponent(form.bike_model)}`, { method: "POST" })
          .then((r) => { if (r.image_url) setProfile((prev) => prev ? { ...prev, bike_image_url: r.image_url! } : prev); })
          .catch(() => {});
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    }
    setSaving(false);
  }

  if (!profile) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const initials = profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow p-8">

          {/* Avatar with bike cover */}
          <div className="flex flex-col items-center mb-8">
            {/* Bike cover photo */}
            {profile.bike_image_url && (
              <div className="w-full h-32 rounded-xl overflow-hidden mb-[-40px] relative">
                <Image src={profile.bike_image_url} alt={profile.bike_model ?? "Bike"} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {profile.bike_model && (
                  <span className="absolute bottom-2 right-3 text-white text-xs font-medium bg-black/30 px-2 py-0.5 rounded-full">
                    🏍️ {profile.bike_model}
                  </span>
                )}
              </div>
            )}
            <div className="relative group cursor-pointer z-10" onClick={() => fileRef.current?.click()}>
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="Avatar" width={96} height={96}
                  className={`w-24 h-24 rounded-full object-cover ring-4 ${profile.bike_image_url ? "ring-white" : "ring-green-100"}`} />
              ) : (
                <div className={`w-24 h-24 rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ${profile.bike_image_url ? "ring-white" : "ring-green-100"}`}>
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-xs font-medium">{uploading ? "Uploading..." : "Change"}</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <p className="text-xs text-gray-400 mt-2">Click avatar to upload a new photo</p>
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{profile.full_name}</h2>
              <div className="flex items-center gap-2">
                {avgRating && avgRating.total > 0 && (
                  <div className="flex items-center gap-1">
                    <RatingStars value={Math.round(avgRating.avg_rating)} readonly size="sm" />
                    <span className="text-sm text-gray-500">{avgRating.avg_rating} ({avgRating.total})</span>
                  </div>
                )}
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  profile.user_type === "student" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                }`}>
                  {profile.user_type === "student" ? "🎓 Student" : "💼 Corporate"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="text-lg">✉️</span>
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <span className="text-lg">{profile.user_type === "student" ? "🏫" : "🏢"}</span>
                {editing ? (
                  <input value={form.college_or_company} onChange={(e) => setForm({ ...form, college_or_company: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                ) : (
                  <span>{profile.college_or_company}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <span className="text-lg">📞</span>
                {editing ? (
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Add phone number"
                    className="flex-1 border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                ) : (
                  <span>{profile.phone || <span className="text-gray-400 italic">No phone added</span>}</span>
                )}
              </div>
              {editing && (
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-lg">👤</span>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              )}
              {/* Bike details */}
              <div className="flex items-center gap-3 text-gray-600">
                <span className="text-lg">🏍️</span>
                {editing ? (
                  <input value={form.bike_model} onChange={(e) => setForm({ ...form, bike_model: e.target.value })}
                    placeholder="Bike model (e.g. Royal Enfield Classic 350)"
                    className="flex-1 border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                ) : (
                  <span>{profile.bike_model || <span className="text-gray-400 italic">No bike added</span>}</span>
                )}
              </div>
              {(editing || profile.bike_number) && (
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-lg">🔢</span>
                  {editing ? (
                    <input value={form.bike_number} onChange={(e) => setForm({ ...form, bike_number: e.target.value.toUpperCase() })}
                      placeholder="Number plate (e.g. KA 01 AB 1234)"
                      className="flex-1 border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase" />
                  ) : (
                    <span className="font-mono">{profile.bike_number}</span>
                  )}
                </div>
              )}
            </div>

            {msg && <p className="text-sm text-green-600">{msg}</p>}
            {error && <p className="text-sm text-yellow-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={() => { setEditing(false); setMsg(""); }}
                    className="flex-1 border py-2 rounded-lg font-medium hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="flex-1 border border-green-600 text-green-600 py-2 rounded-lg font-medium hover:bg-green-50 transition">
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* My Rides */}
        <div className="bg-white rounded-2xl shadow p-8 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">My Rides</h2>
            <Link href="/rides/new" className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
              + Offer Ride
            </Link>
          </div>
          {myRides.length === 0 ? (
            <p className="text-gray-400 text-sm">You haven&apos;t offered any rides yet.</p>
          ) : (
            <div className="space-y-3">
              {myRides.map((ride) => (
                <Link key={ride.id} href={`/rides/${ride.id}`}
                  className="flex justify-between items-start border rounded-xl p-4 hover:border-green-400 transition">
                  <div>
                    <p className="font-medium text-sm">{ride.origin} → {ride.destination}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      🕐 {new Date(ride.departure_time).toLocaleString()} · 💺 {ride.available_seats} seats
                    </p>
                    {ride.bike_model && <p className="text-xs text-gray-400 mt-0.5">🏍️ {ride.bike_model}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-3 ${
                    ride.status === "open" ? "bg-green-100 text-green-700" :
                    ride.status === "full" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {ride.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Referrals & Credits */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow p-6 mt-6 border border-indigo-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-indigo-900 mb-1">🎁 Invite & Earn</h2>
              <p className="text-sm text-indigo-700">Invite friends and you both get ₹50 ride credits!</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-indigo-100 text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Your Credits</p>
              <p className="text-2xl font-black text-indigo-600">₹{profile.credits || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-indigo-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full">
              <p className="text-xs text-gray-500 mb-1 font-medium">Your Invite Code</p>
              <div className="bg-gray-100 flex items-center justify-between rounded-lg px-3 py-2 font-mono text-lg font-bold tracking-widest text-indigo-800">
                {profile.referral_code || "Pillion" + profile.id.substring(0, 4).toUpperCase()}
                <button 
                  onClick={() => navigator.clipboard.writeText(profile.referral_code || "Pillion" + profile.id.substring(0, 4).toUpperCase())}
                  className="text-sm bg-white border border-gray-200 px-3 py-1 rounded shadow-sm text-gray-600 hover:text-indigo-600 transition"
                >
                  Copy
                </button>
              </div>
            </div>
            <button className="w-full sm:w-auto shrink-0 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition shadow-md">
              Share Link
            </button>
          </div>
        </div>

        {/* Rider Verification */}
        <div className="bg-white rounded-2xl shadow p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Rider Verification</h2>
            <VerificationBadge status={verificationStatus} />
          </div>
          {verificationStatus === "unverified" || verificationStatus === "rejected" ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Upload your driving license to get a verified badge on your profile and rides.
              </p>
              <input ref={licenseRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleLicenseUpload} />
              <button onClick={() => licenseRef.current?.click()} disabled={uploadingLicense}
                className="w-full border-2 border-dashed border-blue-300 text-blue-600 py-3 rounded-xl text-sm font-medium hover:bg-blue-50 transition disabled:opacity-50">
                {uploadingLicense ? "Uploading..." : "📄 Upload Driving License"}
              </button>
            </div>
          ) : verificationStatus === "pending" ? (
            <p className="text-sm text-yellow-600">Your license is under review. We'll notify you once verified.</p>
          ) : (
            <p className="text-sm text-green-600">Your identity is verified. Passengers can trust you!</p>
          )}
        </div>

        {/* Emergency Contact + SOS */}
        <div className="bg-white rounded-2xl shadow p-6 mt-6 border border-red-100">
          <h2 className="text-lg font-bold mb-4 text-red-600">🆘 Emergency Contact</h2>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Name</label>
              <input value={emergencyContact.name} onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                placeholder="e.g. Mom, Dad, Friend"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone (with country code)</label>
              <input value={emergencyContact.phone} onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                placeholder="e.g. +919876543210"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <button disabled={savingContact} onClick={async () => {
              setSavingContact(true);
              await apiFetch("/emergency/contact", { method: "POST", body: JSON.stringify(emergencyContact) }).catch(() => {});
              setSavingContact(false);
              setMsg("Emergency contact saved.");
            }} className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition">
              {savingContact ? "Saving..." : "Save Emergency Contact"}
            </button>
          </div>
          <SOSButton />
        </div>
      </main>
    </div>
  );
}
