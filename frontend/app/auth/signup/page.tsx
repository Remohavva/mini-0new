"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", user_type: "student",
    college_or_company: "", phone: "", bike_model: "", bike_number: "", has_bike: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          user_type: form.user_type,
          college_or_company: form.college_or_company,
          phone: form.phone,
          bike_model: form.bike_model,
          bike_number: form.bike_number,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
    } else if (data.user) {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <div className="text-center mb-6">
          <div className="text-4xl">🏍️</div>
          <h1 className="text-2xl font-bold mt-2">Join Pillion</h1>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input name="full_name" required value={form.full_name} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">I am a</label>
            <select name="user_type" value={form.user_type} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="student">Student</option>
              <option value="corporate">Corporate Employee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {form.user_type === "student" ? "College Name" : "Company Name"}
            </label>
            <input name="college_or_company" required value={form.college_or_company} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone (optional)</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {/* Bike details */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={form.has_bike}
                  onChange={(e) => setForm({ ...form, has_bike: e.target.checked, bike_model: "", bike_number: "" })} />
                <div className={`w-10 h-6 rounded-full transition ${form.has_bike ? "bg-green-500" : "bg-gray-200"}`} />
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.has_bike ? "translate-x-4" : ""}`} />
              </div>
              <span className="text-sm font-semibold text-gray-700">🏍️ I own a bike</span>
            </label>

            {form.has_bike && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Bike Model</label>
                  <input name="bike_model" value={form.bike_model} onChange={handleChange}
                    placeholder="e.g. Royal Enfield Classic 350"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Number Plate</label>
                  <input name="bike_number" value={form.bike_number} onChange={handleChange}
                    placeholder="e.g. KA 01 AB 1234"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ textTransform: "uppercase" }} />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
