import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const DEFAULT_CODE = {
  python: '# Read input, compute, print output\n',
  c: '#include <stdio.h>\nint main() {\n    return 0;\n}\n',
  cpp: '#include <iostream>\nint main() {\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n    }\n}\n',
};

const MONACO_LANG = { python: 'python', c: 'c', cpp: 'cpp', java: 'java' };

export default function ExamPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [error, setError] = useState('');
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [submissions, setSubmissions] = useState({});
  const [output, setOutput] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Load exam
  useEffect(() => {
    let cancelled = false;
    api
      .get(`exams/${code}/`)
      .then((res) => {
        if (cancelled) return;
        setExam(res.data);

        const initialDrafts = {};
        res.data.questions.forEach((q) => {
          initialDrafts[q.id] = {
            code: DEFAULT_CODE[q.language] || DEFAULT_CODE.python,
            language: q.language,
            stdin: '',
          };
        });
        setDrafts(initialDrafts);

        const subs = {};
        (res.data.my_submissions || []).forEach((s) => {
          subs[s.question_id] = s;
        });
        setSubmissions(subs);

        if (res.data.questions.length > 0) {
          setActiveQuestionId(res.data.questions[0].id);
        }
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load exam'));
    return () => { cancelled = true; };
  }, [code]);

  // Anti-cheat: log tab switches, fullscreen exits, copy/paste
  useEffect(() => {
    if (!exam) return;

    const logEvent = (type) => {
      api.post(`exams/${exam.code}/log-event/`, { event_type: type }).catch(() => {});
    };
    const onVisibility = () => { if (document.hidden) logEvent('TAB_SWITCH'); };
    const onFullscreenChange = () => { if (!document.fullscreenElement) logEvent('EXIT_FULLSCREEN'); };
    const onCopy = () => logEvent('COPY');
    const onPaste = () => logEvent('PASTE');

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
    };
  }, [exam]);

  const questions = exam?.questions || [];
  const activeIndex = useMemo(
    () => questions.findIndex((q) => q.id === activeQuestionId),
    [questions, activeQuestionId]
  );
  const activeQuestion = activeIndex >= 0 ? questions[activeIndex] : null;
  const nextQuestion =
    activeIndex >= 0 && activeIndex < questions.length - 1
      ? questions[activeIndex + 1]
      : null;
  const answeredCount = Object.keys(submissions).length;
  const totalQuestions = questions.length;
  const draft = activeQuestion ? drafts[activeQuestion.id] : null;
  const existingSubmission = activeQuestion ? submissions[activeQuestion.id] : null;

  const updateDraft = (patch) => {
    setDrafts((prev) => ({
      ...prev,
      [activeQuestionId]: { ...prev[activeQuestionId], ...patch },
    }));
  };

  const goToQuestion = (qid) => {
    setActiveQuestionId(qid);
    setOutput('');
    setLastResult(null);
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput('Running...');
    try {
      const res = await api.post('run/', {
        code: draft.code,
        language: draft.language,
        stdin: draft.stdin,
      });
      const d = res.data;
      const parts = [];

      const codeWantsInput = /\binput\s*\(|scanf\s*\(|cin\s*>>|Scanner\s*\(/.test(draft.code);
      const noInputGiven = !draft.stdin.trim();
      const gotEofError = /EOFError|NZEC|Runtime Error/i.test(d.stderr || d.status || '');

      if (codeWantsInput && noInputGiven && gotEofError) {
        parts.push('ℹ️ Your code reads input, but the "Custom Input" box is empty.');
        parts.push('   Fill the Custom Input box with the input your program expects, then click RUN again.');
        parts.push('');
      }

      if (d.compile_output) parts.push(`--- COMPILE OUTPUT ---\n${d.compile_output}`);
      if (d.stdout) parts.push(`--- STDOUT ---\n${d.stdout}`);
      if (d.stderr) parts.push(`--- STDERR ---\n${d.stderr}`);
      parts.push(`--- ${d.status} | ${d.time}s | ${d.memory}KB ---`);
      setOutput(parts.join('\n'));
    } catch (err) {
      setOutput(`Run failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setConfirmSubmitOpen(false);
    setSubmitting(true);
    setOutput('Grading...');
    setLastResult(null);
    try {
      const res = await api.post('submit/', {
        exam_code: exam.code,
        question_id: activeQuestionId,
        code: draft.code,
        language: draft.language,
      });
      const d = res.data;

      setSubmissions((prev) => ({
        ...prev,
        [activeQuestionId]: {
          question_id: activeQuestionId,
          auto_score: d.auto_score ?? null,
          teacher_score: null,
          submitted_at: new Date().toISOString(),
        },
      }));

      if (d.auto_score != null) {
        setLastResult({
          questionId: activeQuestionId,
          auto_score: d.auto_score,
          total_marks: d.total_marks,
          passed: d.passed,
          total: d.total,
        });
        setOutput(
          `Submitted.\nScore: ${d.auto_score}/${d.total_marks}\nPassed ${d.passed} of ${d.total} test cases.`
        );
      } else {
        setLastResult({
          questionId: activeQuestionId,
          pending: true,
          total_marks: d.total_marks,
        });
        setOutput('Submitted. Your teacher will release scores after the exam ends.');
      }
    } catch (err) {
      setOutput(`Submit failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/student')} className="underline">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exam || !activeQuestion) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        Loading exam...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/student" className="text-sm text-gray-400 hover:text-gray-200">
            ← Dashboard
          </Link>
          <div>
            <h1 className="text-lg font-bold">{exam.title}</h1>
            <p className="text-xs text-gray-400">
              {exam.course_code}
              {exam.section && ` · Section ${exam.section}`}
              {exam.semester && ` · ${exam.semester}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded"
          >
            {document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'}
          </button>
          <div className="text-right text-xs text-gray-400">
            <div>
              Exam code: <span className="font-mono text-gray-200">{exam.code}</span>
            </div>
            <div>
              {answeredCount} of {totalQuestions} submitted · {exam.duration_minutes} min · {exam.total_marks} marks
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-gray-800 p-3 overflow-y-auto">
          {questions.map((q) => {
            const sub = submissions[q.id];
            const isActive = q.id === activeQuestionId;
            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(q.id)}
                className={`w-full text-left px-3 py-2 rounded mb-2 text-sm ${
                  isActive ? 'bg-blue-600' : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>Q{q.order_number}. {q.title}</span>
                  {sub && <span className="text-xs text-green-400">✓</span>}
                </div>
                <div className="text-xs text-gray-400">
                  {q.marks} marks · {q.language}
                  {sub && sub.auto_score != null && ` · scored ${sub.auto_score}`}
                </div>
              </button>
            );
          })}
          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
            Tip: RUN uses your own test input. SUBMIT grades against hidden tests.
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold">
              Q{activeQuestion.order_number}. {activeQuestion.title} — {activeQuestion.marks} marks
            </h2>
            {activeQuestion.description && (
              <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">
                {activeQuestion.description}
              </p>
            )}
          </div>

          {lastResult && lastResult.questionId === activeQuestionId && (
            <div className="border-b border-gray-800 bg-gray-900/60 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm">
                  {lastResult.pending ? (
                    <span className="font-semibold text-yellow-300">
                      Submission saved — score pending
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold">
                        Score: {lastResult.auto_score} / {lastResult.total_marks}
                      </span>
                      <span className="text-gray-400 ml-3">
                        Passed {lastResult.passed} of {lastResult.total} test cases
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {nextQuestion ? (
                    <button
                      onClick={() => goToQuestion(nextQuestion.id)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-semibold"
                    >
                      Next question →
                    </button>
                  ) : (
                    <Link
                      to="/student"
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-semibold"
                    >
                      Back to dashboard
                    </Link>
                  )}
                  <Link
                    to="/student"
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 grid grid-cols-2 overflow-hidden">
            <div className="border-r border-gray-800">
              <Editor
                height="100%"
                language={MONACO_LANG[draft.language] || 'python'}
                theme="vs-dark"
                value={draft.code}
                onChange={(v) => updateDraft({ code: v || '' })}
                options={{ fontSize: 14, minimap: { enabled: false } }}
              />
            </div>

            <div className="flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-800">
                <label className="block text-xs text-gray-400 mb-1">
                  Custom Input — type the input your program reads from{' '}
                  <code>input()</code> / <code>scanf</code>
                </label>
                <textarea
                  value={draft.stdin}
                  onChange={(e) => updateDraft({ stdin: e.target.value })}
                  rows={3}
                  placeholder={'Example:\n5\n10 20 5 40 15'}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs font-mono"
                />
              </div>
              <div className="flex-1 p-3 overflow-auto">
                <label className="block text-xs text-gray-400 mb-1">Output</label>
                <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-xs font-mono whitespace-pre-wrap">
                  {output || 'Click RUN to test, SUBMIT to grade.'}
                </pre>
              </div>
              <div className="p-3 border-t border-gray-800 flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 py-2 rounded font-semibold"
                >
                  {running ? 'Running...' : 'RUN'}
                </button>
                <button
                  onClick={() => setConfirmSubmitOpen(true)}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded font-semibold"
                >
                  {submitting ? 'Submitting...' : existingSubmission ? 'RESUBMIT' : 'SUBMIT'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ConfirmModal
        open={confirmSubmitOpen}
        onCancel={() => setConfirmSubmitOpen(false)}
        onConfirm={handleSubmit}
        title={existingSubmission ? 'Resubmit this question?' : 'Submit this question?'}
        message={
          existingSubmission
            ? 'This will replace your previous submission and score.'
            : 'Your code will be graded against hidden test cases. You can resubmit later.'
        }
        confirmLabel={existingSubmission ? 'Resubmit' : 'Submit'}
      />
    </div>
  );
}