import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

const NAV = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/join', label: 'Join Exam' },
  { to: '/my-results', label: 'My Results' },
  { to: '/practice', label: 'Practice' },
];

function GradeBadge({ grade }) {
  const color =
    grade === 'F'
      ? 'bg-red-600'
      : grade.startsWith('A')
        ? 'bg-green-600'
        : grade.startsWith('B')
          ? 'bg-blue-600'
          : 'bg-gray-700';
  return (
    <span className={`${color} text-white text-xs font-bold px-2 py-1 rounded`}>
      {grade}
    </span>
  );
}

export default function MyResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('my-results/')
      .then((res) => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout navItems={NAV}>
      <h1 className="text-2xl font-bold mb-2">My Results</h1>
      <p className="text-gray-400 mb-6">Published grades for exams you participated in.</p>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && results.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded p-8 text-center text-gray-400">
          No published results yet. Once your teacher publishes results, they will appear here.
        </div>
      )}

      <div className="space-y-6">
        {results.map((r) => (
          <div key={r.exam_code} className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-start">
              <div>
                <h2 className="font-semibold">{r.exam_title}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {r.course_code} {r.section && `· Sec ${r.section}`} {r.semester && `· ${r.semester}`}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <GradeBadge grade={r.grade} />
                  <span className="text-lg font-bold">
                    {r.obtained_marks}/{r.total_marks}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {r.percentage}% · {r.grade_points.toFixed(2)} GP
                </div>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Question</th>
                  <th className="text-right px-4 py-2">Marks</th>
                </tr>
              </thead>
              <tbody>
                {r.questions.map((q) => (
                  <tr key={q.question_id} className="border-t border-gray-800">
                    <td className="px-4 py-2">
                      Q{q.order_number}. {q.title}
                      {q.is_final && (
                        <span className="ml-2 text-xs text-gray-500">(teacher graded)</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {q.score} / {q.marks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}