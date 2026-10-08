import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

const NAV = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/join', label: 'Join Exam' },
  { to: '/my-results', label: 'My Results' },
  { to: '/practice', label: 'Practice' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  return (
    <DashboardLayout navItems={NAV}>
      <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
      <p className="text-gray-400 mb-6">
        {user.first_name ? `${user.first_name}, ` : ''}ready for your next exam?
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          to="/join"
          className="block bg-blue-600 hover:bg-blue-700 rounded p-5"
        >
          <div className="font-semibold mb-1">Join an exam →</div>
          <div className="text-sm text-blue-100">
            Have a code from your teacher? Enter it here.
          </div>
        </Link>

        <Link
          to="/my-results"
          className="block bg-gray-900 border border-gray-800 hover:border-blue-500 rounded p-5"
        >
          <div className="font-semibold mb-1">My Results</div>
          <div className="text-sm text-gray-400">
            View published grades and scores.
          </div>
        </Link>

        <Link
          to="/practice"
          className="block bg-gray-900 border border-gray-800 hover:border-blue-500 rounded p-5"
        >
          <div className="font-semibold mb-1">Practice coding</div>
          <div className="text-sm text-gray-400">
            Sharpen your skills with the compiler.
          </div>
        </Link>
      </div>
    </DashboardLayout>
  );
}