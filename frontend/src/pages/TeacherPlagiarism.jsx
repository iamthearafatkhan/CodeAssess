import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

export default function TeacherPlagiarism() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [threshold, setThreshold] = useState(0.7);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (t = threshold) => {
    setLoading(true);
    api
      .get(`teacher/exams/${code}/plagiarism/?threshold=${t}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [code]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
        <Link to="/teacher" className="text-blue-400 text-sm">← Back</Link>
        <p className="text-red-400 mt-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={`/teacher/exam/${code}`} className="text-blue-400 text-sm">← Back to exam</Link>
        <h1 className="text-2xl font-bold mt-3 mb-2">Plagiarism check</h1>
        <p className="text-sm text-gray-400 mb-6">
          Token n-gram similarity between submissions of the same question. Higher score = more similar.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded p-4 mb-6 flex items-center gap-4">
          <label className="text-sm">Threshold</label>
          <input
            type="range"
            min="0.3"
            max="0.95"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="font-mono text-sm">{threshold.toFixed(2)}</span>
          <button
            onClick={() => load(threshold)}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm"
          >
            Re-run
          </button>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && data && data.report.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded p-6 text-gray-400 text-sm text-center">
            No suspicious pairs found at threshold {data.threshold}.
          </div>
        )}

        {!loading && data && data.report.map((q) => (
          <div key={q.question_id} className="mb-6">
            <h2 className="text-lg font-semibold mb-3">
              Q{q.question_order}. {q.question_title}
              <span className="text-gray-500 text-sm ml-2">
                ({q.submission_count} submissions · {q.pairs.length} flagged pairs)
              </span>
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-2">Student A</th>
                    <th className="text-left px-4 py-2">Student B</th>
                    <th className="text-right px-4 py-2">Similarity</th>
                  </tr>
                </thead>
                <tbody>
                  {q.pairs.map((p, i) => (
                    <tr key={i} className="border-t border-gray-800">
                      <td className="px-4 py-2">{p.student_a}</td>
                      <td className="px-4 py-2">{p.student_b}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-mono ${p.score > 0.85 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {(p.score * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}