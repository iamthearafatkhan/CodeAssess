import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const LANGUAGES = ['python', 'c', 'cpp', 'java'];

export default function TeacherExamEdit() {
  const { code } = useParams();
  const [exam, setExam] = useState(null);
  const [error, setError] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaMsg, setMetaMsg] = useState('');
  const [meta, setMeta] = useState(null);

  const [showNewQ, setShowNewQ] = useState(false);
  const [newQ, setNewQ] = useState({
    order_number: 1,
    title: '',
    description: '',
    marks: 10,
    language: 'python',
  });

  // Which question is currently open for editing
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionDraft, setQuestionDraft] = useState(null);

  // Which test case is open for editing
  const [editingTestCaseId, setEditingTestCaseId] = useState(null);
  const [testCaseDraft, setTestCaseDraft] = useState(null);

  // New-test-case drafts per question
  const [tcDrafts, setTcDrafts] = useState({});

  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    api
      .get(`teacher/exams/${code}/`)
      .then((res) => {
        setExam(res.data);
        setMeta({
          title: res.data.title,
          course_code: res.data.course_code,
          section: res.data.section,
          semester: res.data.semester,
          duration_minutes: res.data.duration_minutes,
          is_active: res.data.is_active,
          show_score_immediately: res.data.show_score_immediately,
          start_time: res.data.start_time ? res.data.start_time.slice(0, 16) : '',
          end_time: res.data.end_time ? res.data.end_time.slice(0, 16) : '',
        });
        setNewQ((p) => ({ ...p, order_number: res.data.questions.length + 1 }));
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'));
  };

  useEffect(load, [code]);

  // --- Meta ---
  const saveMeta = async (e) => {
    e.preventDefault();
    setSavingMeta(true);
    setMetaMsg('');
    try {
      const payload = { ...meta };
      if (!payload.start_time) payload.start_time = null;
      if (!payload.end_time) payload.end_time = null;
      await api.patch(`teacher/exams/${code}/`, payload);
      setMetaMsg('Saved.');
    } catch (err) {
      setMetaMsg(err.response?.data ? JSON.stringify(err.response.data) : 'Save failed');
    } finally {
      setSavingMeta(false);
    }
  };

  // --- Questions ---
  const addQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.post(`teacher/exams/${code}/questions/`, newQ);
      setShowNewQ(false);
      setNewQ({
        order_number: newQ.order_number + 1,
        title: '',
        description: '',
        marks: 10,
        language: 'python',
      });
      load();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Add failed');
    }
  };

  const startEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setQuestionDraft({
      order_number: q.order_number,
      title: q.title,
      description: q.description,
      marks: q.marks,
      language: q.language,
    });
  };

  const cancelEditQuestion = () => {
    setEditingQuestionId(null);
    setQuestionDraft(null);
  };

  const saveQuestionEdit = async () => {
    try {
      await api.patch(`teacher/questions/${editingQuestionId}/`, questionDraft);
      cancelEditQuestion();
      load();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Save failed');
    }
  };

  // --- Test cases ---
  const startEditTestCase = (tc) => {
    setEditingTestCaseId(tc.id);
    setTestCaseDraft({
      input_data: tc.input_data,
      expected_output: tc.expected_output,
      is_hidden: tc.is_hidden,
    });
  };

  const cancelEditTestCase = () => {
    setEditingTestCaseId(null);
    setTestCaseDraft(null);
  };

  const saveTestCaseEdit = async () => {
    try {
      await api.patch(`teacher/test-cases/${editingTestCaseId}/`, testCaseDraft);
      cancelEditTestCase();
      load();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Save failed');
    }
  };

  const addTestCase = async (questionId) => {
    const draft = tcDrafts[questionId];
    if (!draft || !draft.expected_output) {
      alert('Expected output is required.');
      return;
    }
    try {
      await api.post(`teacher/questions/${questionId}/test-cases/`, {
        input_data: draft.input_data || '',
        expected_output: draft.expected_output,
        is_hidden: draft.is_hidden ?? true,
      });
      setTcDrafts((p) => ({
        ...p,
        [questionId]: { input_data: '', expected_output: '', is_hidden: true },
      }));
      load();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Add failed');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { kind, id } = confirmDelete;
    try {
      if (kind === 'question') {
        await api.delete(`teacher/questions/${id}/`);
      } else if (kind === 'testcase') {
        await api.delete(`teacher/test-cases/${id}/`);
      }
      setConfirmDelete(null);
      load();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Delete failed');
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

  if (!exam || !meta) {
    return <div className="min-h-screen bg-gray-950 text-gray-100 p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/teacher" className="text-sm text-blue-400">← Dashboard</Link>
            <h1 className="text-2xl font-bold mt-2">{exam.title}</h1>
            <p className="text-sm text-gray-400">
              Exam code: <span className="font-mono text-gray-200">{exam.code}</span> · {exam.total_marks} marks
            </p>
          </div>
          <Link
            to={`/teacher/exam/${exam.code}`}
            className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-2 rounded"
          >
            View submissions
          </Link>
        </div>

        {/* Exam meta */}
        <form onSubmit={saveMeta} className="bg-gray-900 border border-gray-800 rounded p-4 mb-8 space-y-3">
          <h2 className="font-semibold">Exam settings</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              placeholder="Title"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              value={meta.course_code}
              onChange={(e) => setMeta({ ...meta, course_code: e.target.value })}
              placeholder="Course code"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              value={meta.section}
              onChange={(e) => setMeta({ ...meta, section: e.target.value })}
              placeholder="Section"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              value={meta.semester}
              onChange={(e) => setMeta({ ...meta, semester: e.target.value })}
              placeholder="Semester"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={meta.duration_minutes}
              onChange={(e) => setMeta({ ...meta, duration_minutes: Number(e.target.value) })}
              placeholder="Duration (min)"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={meta.is_active}
                onChange={(e) => setMeta({ ...meta, is_active: e.target.checked })}
              />
              Active
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={meta.show_score_immediately}
                onChange={(e) => setMeta({ ...meta, show_score_immediately: e.target.checked })}
              />
              Show score immediately
            </label>
          </div>
          <div className="flex gap-3 items-center">
            <button
              type="submit"
              disabled={savingMeta}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-semibold"
            >
              {savingMeta ? 'Saving...' : 'Save settings'}
            </button>
            {metaMsg && <span className="text-sm text-gray-400">{metaMsg}</span>}
          </div>
        </form>

        {/* Questions */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Questions</h2>
          <button
            onClick={() => setShowNewQ(!showNewQ)}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm"
          >
            {showNewQ ? 'Cancel' : '+ Add question'}
          </button>
        </div>

        {showNewQ && (
          <form onSubmit={addQuestion} className="bg-gray-900 border border-gray-800 rounded p-4 mb-6 space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <input
                type="number"
                value={newQ.order_number}
                onChange={(e) => setNewQ({ ...newQ, order_number: Number(e.target.value) })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="#"
              />
              <input
                value={newQ.title}
                onChange={(e) => setNewQ({ ...newQ, title: e.target.value })}
                className="col-span-2 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="Question title"
                required
              />
              <input
                type="number"
                value={newQ.marks}
                onChange={(e) => setNewQ({ ...newQ, marks: Number(e.target.value) })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="Marks"
              />
            </div>
            <textarea
              value={newQ.description}
              onChange={(e) => setNewQ({ ...newQ, description: e.target.value })}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="Problem description (what the student should solve)"
            />
            <select
              value={newQ.language}
              onChange={(e) => setNewQ({ ...newQ, language: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold"
              >
                Add question
              </button>
            </div>
          </form>
        )}

        {exam.questions.length === 0 && (
          <p className="text-gray-500 text-sm">No questions yet.</p>
        )}

        {exam.questions.map((q) => {
          const isEditingThisQuestion = editingQuestionId === q.id;

          return (
            <div key={q.id} className="bg-gray-900 border border-gray-800 rounded p-4 mb-4">
              {isEditingThisQuestion ? (
                // ---------- Edit question form ----------
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <input
                      type="number"
                      value={questionDraft.order_number}
                      onChange={(e) =>
                        setQuestionDraft({ ...questionDraft, order_number: Number(e.target.value) })
                      }
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                      placeholder="#"
                    />
                    <input
                      value={questionDraft.title}
                      onChange={(e) =>
                        setQuestionDraft({ ...questionDraft, title: e.target.value })
                      }
                      className="col-span-2 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                      placeholder="Title"
                    />
                    <input
                      type="number"
                      value={questionDraft.marks}
                      onChange={(e) =>
                        setQuestionDraft({ ...questionDraft, marks: Number(e.target.value) })
                      }
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                      placeholder="Marks"
                    />
                  </div>
                  <textarea
                    value={questionDraft.description}
                    onChange={(e) =>
                      setQuestionDraft({ ...questionDraft, description: e.target.value })
                    }
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={questionDraft.language}
                    onChange={(e) =>
                      setQuestionDraft({ ...questionDraft, language: e.target.value })
                    }
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  >
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={saveQuestionEdit}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-semibold"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditQuestion}
                      className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // ---------- Question display ----------
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      Q{q.order_number}. {q.title}{' '}
                      <span className="text-gray-500 text-sm">
                        ({q.marks} marks · {q.language})
                      </span>
                    </h3>
                    {q.description && (
                      <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">
                        {q.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs">
                    <button
                      onClick={() => startEditQuestion(q)}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ kind: 'question', id: q.id, title: q.title })}
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Test cases */}
              <div className="mt-4">
                <div className="text-xs text-gray-400 mb-2">
                  Test cases ({q.test_cases.length})
                </div>

                {q.test_cases.map((tc) => {
                  const isEditingThisTC = editingTestCaseId === tc.id;
                  return (
                    <div key={tc.id} className="border border-gray-800 rounded p-2 mb-2 text-xs">
                      {isEditingThisTC ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <textarea
                              value={testCaseDraft.input_data}
                              onChange={(e) =>
                                setTestCaseDraft({ ...testCaseDraft, input_data: e.target.value })
                              }
                              rows={2}
                              placeholder="Input"
                              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 font-mono"
                            />
                            <textarea
                              value={testCaseDraft.expected_output}
                              onChange={(e) =>
                                setTestCaseDraft({ ...testCaseDraft, expected_output: e.target.value })
                              }
                              rows={2}
                              placeholder="Expected output"
                              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 font-mono"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={testCaseDraft.is_hidden}
                                onChange={(e) =>
                                  setTestCaseDraft({ ...testCaseDraft, is_hidden: e.target.checked })
                                }
                              />
                              Hidden
                            </label>
                            <button
                              onClick={saveTestCaseEdit}
                              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditTestCase}
                              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <div className="font-mono">
                            <div>IN: <span className="text-gray-300">{tc.input_data || '(empty)'}</span></div>
                            <div>OUT: <span className="text-gray-300">{tc.expected_output}</span></div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={tc.is_hidden ? 'text-yellow-400' : 'text-green-400'}>
                              {tc.is_hidden ? 'hidden' : 'visible'}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditTestCase(tc)}
                                className="text-blue-400 hover:text-blue-300 underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ kind: 'testcase', id: tc.id })}
                                className="text-red-400 hover:text-red-300 underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add new test case */}
                <div className="border border-dashed border-gray-700 rounded p-3 mt-2">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <textarea
                      value={tcDrafts[q.id]?.input_data ?? ''}
                      onChange={(e) =>
                        setTcDrafts((p) => ({
                          ...p,
                          [q.id]: { ...p[q.id], input_data: e.target.value },
                        }))
                      }
                      rows={2}
                      placeholder="Input"
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono"
                    />
                    <textarea
                      value={tcDrafts[q.id]?.expected_output ?? ''}
                      onChange={(e) =>
                        setTcDrafts((p) => ({
                          ...p,
                          [q.id]: { ...p[q.id], expected_output: e.target.value },
                        }))
                      }
                      rows={2}
                      placeholder="Expected output"
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={tcDrafts[q.id]?.is_hidden ?? true}
                        onChange={(e) =>
                          setTcDrafts((p) => ({
                            ...p,
                            [q.id]: { ...p[q.id], is_hidden: e.target.checked },
                          }))
                        }
                      />
                      Hidden
                    </label>
                    <button
                      onClick={() => addTestCase(q.id)}
                      className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs"
                    >
                      + Add test case
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        title={
          confirmDelete?.kind === 'question'
            ? 'Delete this question?'
            : 'Delete this test case?'
        }
        message={
          confirmDelete?.kind === 'question'
            ? `Deleting "${confirmDelete?.title}" will remove all its test cases and submissions. This cannot be undone.`
            : 'This cannot be undone.'
        }
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}