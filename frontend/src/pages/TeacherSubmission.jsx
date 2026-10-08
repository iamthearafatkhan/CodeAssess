import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../services/api';

const MONACO_LANG = { python: 'python', c: 'c', cpp: 'cpp', java: 'java' };

export default function TeacherSubmission() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    api
      .get(`teacher/submissions/${id}/`)
      .then((res) => {
        setData(res.data);
        setScore(res.data.teacher_score ?? '');
        setFeedback(res.data.feedback || '');
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const payload = {
        teacher_score: score === '' ? null : Number(score),
        feedback,
      };
      await api.patch(`teacher/submissions/${id}/`, payload);
      setSavedMsg('Saved.');
    } catch (err) {
      setSavedMsg(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
        <Link to="/teacher" className="text-blue-400 text-sm">← Back</Link>
        <p className="text-red-400 mt-4">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-screen bg-gray-950 text-gray-100 p-6">Loading...</div>;
  }

  const allPassed = data.test_results.every((tr) => tr.passed);
  const passCount = data.test_results.filter((tr) => tr.passed).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <Link to={`/teacher/exam/${data.exam_code}`} className="text-blue-400 text-sm">
          ← Back to exam
        </Link>

        <div className="mt-3 flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">
              Q{data.question_id}. {data.question_title}
            </h1>
            <p className="text-sm text-gray-400">
              {data.student_name} · {data.student_email} · {data.language}
            </p>
          </div>
          <div className="text-right text-sm">
            <div>
              Auto score:{' '}
              <span className="font-mono text-lg">{data.auto_score}</span> / {data.question_marks}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {passCount} of {data.test_results.length} tests passed
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Submitted {new Date(data.submitted_at).toLocaleString()}
            </div>
          </div>
        </div>

        {data.events && data.events.length > 0 && (
          <div className="mt-4 bg-yellow-950/40 border border-yellow-900/60 rounded p-3">
            <div className="text-xs font-semibold text-yellow-300 mb-2">
              ⚠ Exam events ({data.events.length})
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {['TAB_SWITCH', 'EXIT_FULLSCREEN', 'COPY', 'PASTE'].map((t) => {
                const count = data.events.filter((e) => e.event_type === t).length;
                return (
                  <div key={t} className="bg-gray-900 border border-gray-800 rounded px-2 py-1.5">
                    <div className="text-gray-500">{t.replace('_', ' ')}</div>
                    <div className="font-mono text-gray-200">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {/* Left: source code */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Submitted code</label>
            <div className="border border-gray-700 rounded overflow-hidden">
              <Editor
                height="500px"
                language={MONACO_LANG[data.language] || 'python'}
                theme="vs-dark"
                value={data.source_code}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
              />
            </div>
          </div>

          {/* Right: test results + grading */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Test results ({passCount} / {data.test_results.length} passed)
              </label>
              <div className="bg-gray-900 border border-gray-700 rounded overflow-hidden">
                {data.test_results.length === 0 && (
                  <p className="p-3 text-sm text-gray-500">No test results.</p>
                )}
                {data.test_results.map((tr, i) => (
                  <div
                    key={tr.test_case_id}
                    className={`border-b border-gray-800 last:border-0 p-3 text-xs ${
                      tr.passed ? 'bg-green-950/20' : 'bg-red-950/20'
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className={tr.passed ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                        Test #{i + 1} — {tr.passed ? 'PASS' : 'FAIL'}
                      </span>
                      <span className="text-gray-500">
                        {tr.is_hidden ? 'hidden' : 'visible'}
                        {tr.runtime_ms != null && ` · ${tr.runtime_ms}ms`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono mb-2">
                      <div>
                        <div className="text-gray-500 mb-0.5">Input</div>
                        <pre className="whitespace-pre-wrap bg-gray-950/60 border border-gray-800 rounded px-2 py-1 text-gray-300">
                          {tr.input_data || '(empty)'}
                        </pre>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-0.5">Expected output</div>
                        <pre className="whitespace-pre-wrap bg-gray-950/60 border border-gray-800 rounded px-2 py-1 text-gray-300">
                          {tr.expected_output || '(empty)'}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500 mb-0.5">Actual output</div>
                      <pre
                        className={`whitespace-pre-wrap bg-gray-950/60 border rounded px-2 py-1 ${
                          tr.passed ? 'border-green-900/50 text-green-300' : 'border-red-900/50 text-red-300'
                        }`}
                      >
                        {tr.actual_output || '(empty)'}
                      </pre>
                    </div>

                    {tr.stderr && (
                      <div className="mt-2">
                        <div className="text-gray-500 mb-0.5">stderr</div>
                        <pre className="whitespace-pre-wrap bg-gray-950/60 border border-red-900/50 rounded px-2 py-1 text-red-300">
                          {tr.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded p-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Teacher score (0–{data.question_marks}, blank to use auto)
                </label>
                <input
                  type="number"
                  min={0}
                  max={data.question_marks}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-semibold"
                >
                  {saving ? 'Saving...' : 'SAVE'}
                </button>
                {savedMsg && <span className="text-sm text-gray-400">{savedMsg}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}