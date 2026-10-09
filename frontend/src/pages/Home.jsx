import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const FEATURES = [
  {
    title: 'Live code execution',
    body: 'C, C++, Python, Java — run and grade in a sandboxed environment.',
    accent: 'from-blue-500 to-cyan-400',
  },
  {
    title: 'Exam codes',
    body: 'Teachers share a 6-character code. Students join instantly.',
    accent: 'from-purple-500 to-pink-400',
  },
  {
    title: 'Auto grading',
    body: 'Every submission runs against hidden test cases and scores itself.',
    accent: 'from-emerald-500 to-green-400',
  },
  {
    title: 'Publish results',
    body: 'Grades, feedback, and percentages appear the moment you publish.',
    accent: 'from-amber-500 to-orange-400',
  },
];

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden flex flex-col">
      {/* Background orbs */}
      <div className="orb bg-blue-600 w-96 h-96 -top-20 -left-20" />
      <div className="orb bg-purple-600 w-96 h-96 top-40 right-0" style={{ animationDelay: '3s' }} />
      <div className="orb bg-cyan-500 w-80 h-80 bottom-0 left-1/3" style={{ animationDelay: '6s' }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 code-grid pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              <svg viewBox="0 0 640 640" className="w-5 h-5 fill-white">
                <path d="M392.8 65.2C375.8 60.3 358.1 70.2 353.2 87.2L225.2 535.2C220.3 552.2 230.2 569.9 247.2 574.8C264.2 579.7 281.9 569.8 286.8 552.8L414.8 104.8C419.7 87.8 409.8 70.1 392.8 65.2zM457.4 201.3C444.9 213.8 444.9 234.1 457.4 246.6L530.8 320L457.4 393.4C444.9 405.9 444.9 426.2 457.4 438.7C469.9 451.2 490.2 451.2 502.7 438.7L598.7 342.7C611.2 330.2 611.2 309.9 598.7 297.4L502.7 201.4C490.2 188.9 469.9 188.9 457.4 201.4zM182.7 201.3C170.2 188.8 149.9 188.8 137.4 201.3L41.4 297.3C28.9 309.8 28.9 330.1 41.4 342.6L137.4 438.6C149.9 451.1 170.2 451.1 182.7 438.6C195.2 426.1 195.2 405.8 182.7 393.3L109.3 320L182.6 246.6C195.1 234.1 195.1 213.8 182.6 201.3z"/>
              </svg>
            </div>
          <span className="font-bold text-lg">CodeAssess</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link
                to={user.role === 'TEACHER' ? '/teacher' : '/student'}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-gray-200 px-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white px-2">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs bg-gray-900/80 border border-gray-800 rounded-full px-3 py-1 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-300">Live code execution</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight">
            Online <span className="gradient-text">programming</span>
            <br />
            exam platform.
          </h1>

          <p className="mt-6 text-lg text-gray-400 max-w-xl">
            Practice code. Take exams. Grade automatically. Publish results —
            all in one place. Built for teachers and students, powered by
            sandboxed execution.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link
                to={user.role === 'TEACHER' ? '/teacher' : '/student'}
                className="glow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition"
              >
                Go to dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="glow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition"
                >
                  Create free account →
                </Link>
                <Link
                  to="/login"
                  className="border border-gray-700 hover:border-gray-500 px-6 py-3 rounded-xl font-semibold transition"
                >
                  Sign in
                </Link>
              </>
            )}
            <Link
              to="/practice"
              className="text-gray-400 hover:text-white px-4 py-3 underline-offset-4 hover:underline"
            >
              or try the compiler
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 text-xs text-gray-500">
            <div>
              <span className="text-gray-200 font-semibold">4</span> languages
            </div>
            <div>
              <span className="text-gray-200 font-semibold">60s</span> max runtime
            </div>
            <div>
              <span className="text-gray-200 font-semibold">∞</span> exams
            </div>
          </div>
        </div>

        {/* Terminal preview */}
        <div className="relative float-slow">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl rounded-full" />
          <div className="relative bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-950/50">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-gray-500 font-mono">main.py</span>
            </div>
            <pre className="p-5 text-xs font-mono leading-relaxed text-gray-300">
{`def find_largest(arr):
    return max(arr)

# exam test case
nums = [10, 20, 5, 40, 15]
print(find_largest(nums))`}
            </pre>
            <div className="border-t border-gray-800 px-5 py-4 bg-gray-950/50">
              <div className="text-xs text-gray-500 mb-1">STDOUT</div>
              <div className="font-mono text-sm text-green-400 cursor-blink">40</div>
            </div>
            <div className="border-t border-gray-800 px-5 py-3 flex justify-between text-xs">
              <span className="text-green-400">✓ Accepted</span>
              <span className="text-gray-500">0.02s · 3.4 MB</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-24">
        <h2 className="text-3xl font-bold mb-3 text-center">
          Everything you need for coding exams
        </h2>
        <p className="text-center text-gray-400 mb-12">
          No printing. No manual grading. No waiting for results.
        </p>

        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.accent} mb-4 float-med`}
              />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}