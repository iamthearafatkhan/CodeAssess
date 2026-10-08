import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

export default function TeacherExam() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api
      .get(`teacher/exams/${code}/submissions/`)
      .then((res) => {
        setData(res.data);
        setPublished(res.data.exam.results_published);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'));
  }, [code]);

  const togglePublish = async () => {
    setPublishing(true);
    try {
      const res = await api.post(`teacher/exams/${code}/publish-results/`, {
        published: !published,
      });
      setPublished(res.data.results_published);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get(`teacher/exams/${code}/export.csv`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${code}-results.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || 'Export failed');
    } finally {
      setExporting(false);
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

  const byQuestion = {};
  data.submissions.forEach((s) => {
    if (!byQuestion[s.question_id]) {
      byQuestion[s.question_id] = {
        order: s.question_order,
        title: s.question_title,
        marks: s.question_marks,
        rows: [],
      };
    }
    byQuestion[s.question_id].rows.push(s);
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/teacher" className="text-blue-400 text-sm">← All exams</Link>

        <div className="flex justify-between items-start mt-3 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{data.exam.title}</h1>
            <p className="text-sm text-gray-400">
              {data.exam.course_code} · Code{' '}
              <span className="font-mono text-gray-200">{data.exam.code}</span> ·{' '}
              {data.exam.total_marks} marks
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link
              to={`/teacher/exam/${data.exam.code}/edit`}
              className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-2 rounded"
            >
              Edit exam
            </Link>
            <Link
              to={`/teacher/exam/${data.exam.code}/plagiarism`}
              className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-2 rounded"
            >
              Plagiarism check
            </Link>
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-2 rounded disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={togglePublish}
              disabled={publishing}
              className={`text-sm px-3 py-2 rounded font-semibold disabled:opacity-50 ${
                published
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {publishing
                ? 'Working...'
                : published
                  ? 'Unpublish results'
                  : 'Publish results'}
            </button>
          </div>
        </div>

        {published && (
          <div className="mt-4 bg-blue-900/30 border border-blue-700 rounded p-3 text-sm text-blue-200">
            Results are published. Students can see their scores in <strong>My Results</strong>.
          </div>
        )}

        {Object.keys(byQuestion).length === 0 && (
          <p className="text-gray-500 mt-6">No questions in this exam.</p>
        )}

        <div className="mt-6">
          {Object.entries(byQuestion).map(([qid, q]) => (
            <div key={qid} className="mb-8">
              <h2 className="text-lg font-semibold mb-2">
                Q{q.order}. {q.title}{' '}
                <span className="text-gray-500 text-sm">({q.marks} marks)</span>
              </h2>
              <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Student</th>
                      <th className="text-left px-3 py-2">Language</th>
                      <th className="text-right px-3 py-2">Auto</th>
                      <th className="text-right px-3 py-2">Teacher</th>
                      <th className="text-right px-3 py-2">Final</th>
                      <th className="text-left px-3 py-2">Submitted</th>
                      <th className="text-right px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.rows.map((s) => (
                      <tr key={s.id} className="border-t border-gray-800">
                        <td className="px-3 py-2">
                          <div>{s.student_name}</div>
                          <div className="text-xs text-gray-500">{s.student_email}</div>
                        </td>
                        <td className="px-3 py-2">{s.language}</td>
                        <td className="px-3 py-2 text-right">{s.auto_score}</td>
                        <td className="px-3 py-2 text-right">
                          {s.teacher_score == null ? (
                            <span className="text-gray-500">—</span>
                          ) : (
                            s.teacher_score
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {s.final_score}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {new Date(s.submitted_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Link
                            to={`/teacher/submission/${s.id}`}
                            className="text-blue-400 text-xs underline"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {q.rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                          No submissions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}