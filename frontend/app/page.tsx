import Link from "next/link";

const features = [
  {
    icon: "🛣️",
    title: "Find rides instantly",
    desc: "Search by origin and destination. See live routes on a map before you commit.",
  },
  {
    icon: "🏍️",
    title: "Offer your seat",
    desc: "Heading somewhere? Post your ride in seconds and split the commute.",
  },
  {
    icon: "🎓",
    title: "Built for campuses & offices",
    desc: "Designed for college students and corporate employees who share the same route daily.",
  },
  {
    icon: "🗺️",
    title: "Live map & routing",
    desc: "Powered by OpenStreetMap. See distance, duration, and the exact route — no guessing.",
  },
  {
    icon: "🔒",
    title: "Verified community",
    desc: "Sign up with your college or company email. Ride with people you already trust.",
  },
  {
    icon: "�",
    title: "Fair fare system",
    desc: "Ride cost is auto-calculated by distance. Riders and passengers can negotiate the final amount before confirming.",
  },
];

const steps = [
  { step: "01", title: "Create your account", desc: "Sign up as a student or corporate employee in under a minute." },
  { step: "02", title: "Post or find a ride", desc: "Offer your bike seat or browse rides going your way." },
  { step: "03", title: "Ride together", desc: "Connect, confirm, and commute — it's that simple." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-green-600">🏍️ Pillion</span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/auth/signup"
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-full font-medium hover:bg-green-700 transition">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-green-600 bg-green-50 px-4 py-1.5 rounded-full mb-6">
            For students &amp; corporates
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6 text-gray-900">
            Commute smarter,<br />
            <span className="text-green-600">ride together.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Pillion connects people heading the same way. Share rides, cut costs, and build community — one commute at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup"
              className="px-8 py-3.5 bg-green-600 text-white rounded-full font-semibold text-base hover:bg-green-700 transition shadow-lg shadow-green-200">
              Start pooling free
            </Link>
            <Link href="/rides"
              className="px-8 py-3.5 border border-gray-200 text-gray-700 rounded-full font-semibold text-base hover:border-green-400 hover:text-green-600 transition">
              Browse rides →
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative mt-20 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border border-green-100 p-8 shadow-xl shadow-green-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Active riders", value: "2,400+", icon: "👥" },
                { label: "Rides posted", value: "8,100+", icon: "🛣️" },
                { label: "Cities covered", value: "12", icon: "🏙️" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-50">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-gray-50" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Everything you need to pool</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Simple, fast, and built around how real commuters think.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-md transition group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">How it works</h2>
            <p className="text-gray-500 text-lg">Three steps and you&apos;re on the road.</p>
          </div>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-green-200">
                  {s.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute left-7 mt-14 w-0.5 h-6 bg-green-100" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl p-14 shadow-2xl shadow-green-200">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to ride together?
          </h2>
          <p className="text-green-100 text-lg mb-8 max-w-md mx-auto">
            Join thousands of students and professionals already sharing their commute — and splitting costs fairly.
          </p>
          <Link href="/auth/signup"
            className="inline-block px-10 py-4 bg-white text-green-700 rounded-full font-bold text-base hover:bg-green-50 transition shadow-lg">
            Create free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-semibold text-green-600">🏍️ Pillion</span>
          <span>© {new Date().getFullYear()} Pillion. Ride smart, pay fair.</span>
          <div className="flex gap-6">
            <Link href="/auth/login" className="hover:text-gray-600 transition">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-gray-600 transition">Sign up</Link>
            <Link href="/rides" className="hover:text-gray-600 transition">Browse rides</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
