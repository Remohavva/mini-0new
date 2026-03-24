"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    user_type: "student",
    college_or_company: "",
    phone: "",
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
