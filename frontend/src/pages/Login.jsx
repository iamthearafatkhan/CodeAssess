import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'TEACHER' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const input =
    'w-full bg-gray-950 border border-gray-800 focus:border-blue-500 outline-none rounded-lg px-3 py-2.5 text-sm transition';

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-950 text-gray-100 flex items-center justify-center p-4">
      <div className="orb bg-blue-600 w-96 h-96 -top-20 -left-20" />
      <div className="orb bg-purple-600 w-96 h-96 bottom-0 right-0" style={{ animationDelay: '4s' }} />
      <div className="absolute inset-0 code-grid pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="flex justify-center items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white">
            C
          </div>
          <span className="font-bold text-xl">CodeExam</span>
        </Link>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/60 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 py-2.5 rounded-lg font-semibold transition"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-6 text-center">
            No account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          <Link to="/" className="hover:text-gray-300">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}