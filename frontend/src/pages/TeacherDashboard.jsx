import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const NAV = [
  { to: '/teacher', label: 'Dashboard', end: true },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('teacher/exams/')
      .then((res) => setExams(res.data))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout navItems={NAV}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Exams</h1>
        <Link
          to="/teacher/create"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-semibold"
        >
          + Create exam
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && exams.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded p-6 text-gray-400 text-sm text-center">
          No exams yet. Click <span className="text-gray-200">"+ Create exam"</span> above to make your first one.
        </div>
      )}

      <div className="grid gap-3">
        {exams.map((e) => (
          <div key={e.code} className="bg-gray-900 border border-gray-800 rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{e.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {e.course_code} {e.section && `· Sec ${e.section}`} {e.semester && `· ${e.semester}`}
                </p>
              </div>
              <div className="text-right text-xs">
                <div className="font-mono text-gray-200">{e.code}</div>
                <div className="text-gray-500 mt-1">
                  {e.question_count} questions · {e.submission_count} submissions
                </div>
                <div className="mt-1 space-x-2">
                  <span className={e.is_active ? 'text-green-400' : 'text-red-400'}>
                    {e.is_active ? 'active' : 'inactive'}
                  </span>
                  {e.results_published && (
                    <span className="text-blue-400">· published</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Link
                to={`/teacher/exam/${e.code}`}
                className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1.5 rounded"
              >
                Submissions
              </Link>
              <Link
                to={`/teacher/exam/${e.code}/edit`}
                className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1.5 rounded"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}