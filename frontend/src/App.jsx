import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RunCode from './pages/RunCode';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import JoinExam from './pages/JoinExam';
import ExamPage from './pages/ExamPage';
import TeacherExam from './pages/TeacherExam';
import TeacherSubmission from './pages/TeacherSubmission';
import TeacherCreateExam from './pages/TeacherCreateExam';
import TeacherExamEdit from './pages/TeacherExamEdit';
import MyResults from './pages/MyResults';
import TeacherPlagiarism from './pages/TeacherPlagiarism';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-400 flex items-center justify-center">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/practice" element={<RunCode />} />

          <Route path="/join" element={<PrivateRoute role="STUDENT"><JoinExam /></PrivateRoute>} />
          <Route path="/exam/:code" element={<PrivateRoute role="STUDENT"><ExamPage /></PrivateRoute>} />
          <Route path="/student" element={<PrivateRoute role="STUDENT"><StudentDashboard /></PrivateRoute>} />
          <Route path="/my-results" element={<PrivateRoute role="STUDENT"><MyResults /></PrivateRoute>} />

          <Route path="/teacher" element={<PrivateRoute role="TEACHER"><TeacherDashboard /></PrivateRoute>} />
          <Route path="/teacher/create" element={<PrivateRoute role="TEACHER"><TeacherCreateExam /></PrivateRoute>} />
          <Route path="/teacher/exam/:code" element={<PrivateRoute role="TEACHER"><TeacherExam /></PrivateRoute>} />
          <Route path="/teacher/exam/:code/edit" element={<PrivateRoute role="TEACHER"><TeacherExamEdit /></PrivateRoute>} />
          <Route path="/teacher/exam/:code/plagiarism" element={<PrivateRoute role="TEACHER"><TeacherPlagiarism /></PrivateRoute>} />
          <Route path="/teacher/submission/:id" element={<PrivateRoute role="TEACHER"><TeacherSubmission /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}