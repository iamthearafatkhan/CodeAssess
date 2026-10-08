import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function JoinExam() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const clean = code.trim().toUpperCase();
    try {
      await api.get(`exams/${clean}/`);
      navigate(`/exam/${clean}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-950 text-gray-100">
      <div className="orb bg-blue-600 w-96 h-96 -top-20 -left-20" />
      <div className="orb bg-purple-600 w-96 h-96 bottom-0 right-0" style={{ animationDelay: '3s' }} />
      <div className="absolute inset-0 code-grid pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-gray-800/60">
        <Link
          to="/student"
          className="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-2"
        >
          ← Back to dashboard
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white text-sm">
            C
          </div>
          <span className="font-bold">CodeExam</span>
        </Link>
      </header>

      <div className="relative z-10 flex items-center justify-center p-4 pt-20">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-2xl"
        >
          <h1 className="text-2xl font-bold mb-1">Join an exam</h1>
          <p className="text-sm text-gray-400 mb-6">
            Enter the 6-character code your teacher gave you.
          </p>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={12}
            placeholder="7XK92A"
            autoComplete="off"
            autoFocus
            className="w-full bg-gray-950 border-2 border-gray-800 focus:border-blue-500 outline-none rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.4em] mb-4 transition"
          />

          {error && (
            <p className="text-red-400 text-sm mb-3 bg-red-950/40 border border-red-900/60 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 py-3 rounded-xl font-semibold transition"
          >
            {loading ? 'Joining...' : 'JOIN EXAM'}
          </button>

          <Link
            to="/practice"
            className="block text-center text-xs text-gray-500 hover:text-gray-300 mt-4"
          >
            or practice on your own →
          </Link>
        </form>
      </div>
    </div>
  );
}