import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function TeacherCreateExam() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    course_code: '',
    section: '',
    semester: '',
    duration_minutes: 60,
    is_active: true,
    show_score_immediately: true,
    start_time: '',
    end_time: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.start_time) delete payload.start_time;
      if (!payload.end_time) delete payload.end_time;
      const res = await api.post('teacher/exams/', payload);
      navigate(`/teacher/exam/${res.data.code}/edit`);
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' · ') : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/teacher" className="text-sm text-blue-400">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-3 mb-6">Create Exam</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 border border-gray-800 rounded p-5">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="Data Structures Midterm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Course code</label>
              <input
                value={form.course_code}
                onChange={(e) => set('course_code', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="CSE 3201"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Section</label>
              <input
                value={form.section}
                onChange={(e) => set('section', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="B"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Semester</label>
              <input
                value={form.semester}
                onChange={(e) => set('semester', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="Spring 2027"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Duration (minutes) *</label>
            <input
              type="number"
              min={1}
              max={600}
              required
              value={form.duration_minutes}
              onChange={(e) => set('duration_minutes', Number(e.target.value))}
              className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start time (optional)</label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => set('start_time', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">End time (optional)</label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => set('end_time', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
              />
              Active
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.show_score_immediately}
                onChange={(e) => set('show_score_immediately', e.target.checked)}
              />
              Show score immediately
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-semibold"
            >
              {saving ? 'Creating...' : 'Create exam'}
            </button>
            <Link to="/teacher" className="px-4 py-2 rounded text-sm bg-gray-800">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}