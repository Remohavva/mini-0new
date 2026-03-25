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
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-blue-600">🏍️ Pillion</span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"
              className="text-sm text-slate-600 hover:text-slate-900 transition px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/auth/signup"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6 text-center">
        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-full mb-6">
            For students & corporates
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6 text-slate-900">
            Commute smarter,<br />
            <span className="text-blue-600">ride together.</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Pillion connects people heading the same way. Share rides, cut costs, and build community — one commute at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup"
              className="px-8 py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700 transition shadow-lg">
              Start pooling free
            </Link>
            <Link href="/rides"
              className="px-8 py-3.5 border border-slate-300 text-slate-700 rounded-lg font-semibold text-base hover:border-blue-400 hover:text-blue-600 transition">
              Browse rides →
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative mt-20 max-w-5xl mx-auto">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "Active riders", value: "2,400+", icon: "👥" },
                { label: "Rides posted", value: "8,100+", icon: "🛣️" },
                { label: "Cities covered", value: "12", icon: "🏙️" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-6 text-center border border-slate-100">
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-600 mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-slate-50" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-slate-900">Everything you need to pool</h2>
            <p className="text-slate-600 text-lg max-w-xl mx-auto">Simple, fast, and built around how real commuters think.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-slate-900">How it works</h2>
            <p className="text-slate-600 text-lg">Three steps and you&apos;re on the road.</p>
          </div>
          <div className="space-y-8">
            {steps.map((s, i) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="shrink-0 w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {s.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-xl text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute left-7 mt-14 w-0.5 h-6 bg-slate-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center bg-slate-900 rounded-2xl p-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to ride together?
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-md mx-auto">
            Join thousands of students and professionals already sharing their commute — and splitting costs fairly.
          </p>
          <Link href="/auth/signup"
            className="inline-block px-10 py-4 bg-blue-600 text-white rounded-lg font-bold text-base hover:bg-blue-700 transition shadow-lg">
            Create free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <span className="font-semibold text-blue-600">🏍️ Pillion</span>
          <span>© {new Date().getFullYear()} Pillion. Ride smart, pay fair.</span>
          <div className="flex gap-6">
            <Link href="/auth/login" className="hover:text-slate-900 transition">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-slate-900 transition">Sign up</Link>
            <Link href="/rides" className="hover:text-slate-900 transition">Browse rides</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
