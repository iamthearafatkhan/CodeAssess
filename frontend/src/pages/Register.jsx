import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    student_id: '',
    section: '',
    session: '',
    semester: '',
    teacher_id: '',
    university: '',
    department: '',
  });

  const set = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      navigate(user.role === 'TEACHER' ? '/teacher' : '/student');
    } catch (err) {
      const data = err.response?.data;
      setError(
        data
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ')
          : 'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const input =
    'w-full bg-gray-950 border border-gray-800 focus:border-blue-500 outline-none rounded-lg px-3 py-2 text-sm transition';
  const label = 'block text-xs text-gray-400 mb-1';

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-950 text-gray-100 flex items-center justify-center p-4">
      <div className="orb bg-purple-600 w-96 h-96 -top-20 right-0" />
      <div className="orb bg-cyan-500 w-80 h-80 bottom-0 -left-10" style={{ animationDelay: '5s' }} />
      <div className="absolute inset-0 code-grid pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg py-8">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white">
            C
          </div>
          <span className="font-bold text-xl">CodeExam</span>
        </Link>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-sm text-gray-400 mb-6">Takes less than a minute.</p>

          {/* Role switcher */}
          <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-gray-950 border border-gray-800 rounded-lg">
            {['STUDENT', 'TEACHER'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 rounded-md font-semibold text-sm transition ${
                  role === r
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {r === 'STUDENT' ? 'I am a Student' : 'I am a Teacher'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>First name</label>
                <input
                  value={form.first_name}
                  onChange={(e) => set('first_name', e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Last name</label>
                <input
                  value={form.last_name}
                  onChange={(e) => set('last_name', e.target.value)}
                  className={input}
                />
              </div>
            </div>

            <div>
              <label className={label}>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={input}
              />
            </div>

            <div>
              <label className={label}>Password (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className={input}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>University</label>
                <input
                  value={form.university}
                  onChange={(e) => set('university', e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Department</label>
                <input
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                  className={input}
                />
              </div>
            </div>

            {role === 'STUDENT' ? (
              <>
                <div>
                  <label className={label}>Student ID</label>
                  <input
                    required
                    value={form.student_id}
                    onChange={(e) => set('student_id', e.target.value)}
                    className={input}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={label}>Section</label>
                    <input
                      value={form.section}
                      onChange={(e) => set('section', e.target.value)}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Session</label>
                    <input
                      value={form.session}
                      onChange={(e) => set('session', e.target.value)}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Semester</label>
                    <input
                      value={form.semester}
                      onChange={(e) => set('semester', e.target.value)}
                      className={input}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className={label}>Teacher ID</label>
                <input
                  required
                  value={form.teacher_id}
                  onChange={(e) => set('teacher_id', e.target.value)}
                  className={input}
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/60 rounded px-3 py-2 break-all">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 py-2.5 rounded-lg font-semibold transition"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
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