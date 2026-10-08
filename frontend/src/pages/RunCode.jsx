import { useState } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CODE = {
  python: `name = input()\nprint(f"Hello, {name}!")`,
  c: `#include <stdio.h>\nint main() {\n    char name[50];\n    scanf("%s", name);\n    printf("Hello, %s!\\n", name);\n    return 0;\n}`,
  cpp: `#include <iostream>\n#include <string>\nint main() {\n    std::string name;\n    std::cin >> name;\n    std::cout << "Hello, " << name << "!" << std::endl;\n    return 0;\n}`,
  java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.next();\n        System.out.println("Hello, " + name + "!");\n    }\n}`,
};

const MONACO_LANG = { python: 'python', c: 'c', cpp: 'cpp', java: 'java' };

export default function RunCode() {
  const { user } = useAuth();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [stdin, setStdin] = useState('Alice');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setOutput('');
  };

  const handleRun = async () => {
    setLoading(true);
    setOutput('Running...');
    try {
      const res = await api.post('run/', { code, language, stdin });
      const d = res.data;
      const parts = [];
      if (d.compile_output) parts.push(`--- COMPILE OUTPUT ---\n${d.compile_output}`);
      if (d.stdout) parts.push(`--- STDOUT ---\n${d.stdout}`);
      if (d.stderr) parts.push(`--- STDERR ---\n${d.stderr}`);
      if (d.message) parts.push(`--- MESSAGE ---\n${d.message}`);
      parts.push(`--- STATUS: ${d.status || 'unknown'} | TIME: ${d.time}s | MEM: ${d.memory}KB ---`);
      setOutput(parts.join('\n'));
    } catch (err) {
      setOutput(`Request failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const dashboardLink = user
    ? user.role === 'TEACHER' ? '/teacher' : '/student'
    : '/';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
        <Link
          to={dashboardLink}
          className="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-2"
        >
          ← {user ? 'Back to dashboard' : 'Back to home'}
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white text-sm">
            C
          </div>
          <span className="font-bold">CodeExam</span>
        </Link>
      </header>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Practice compiler</h1>
          <div className="flex gap-2">
            {['python', 'c', 'cpp', 'java'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  language === lang
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Code</label>
            <div className="border border-gray-800 rounded-xl overflow-hidden">
              <Editor
                height="500px"
                language={MONACO_LANG[language]}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{ fontSize: 14, minimap: { enabled: false } }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Standard Input</label>
              <textarea
                className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none rounded-xl p-3 text-sm font-mono transition"
                rows={3}
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Optional input for your program..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Output</label>
              <pre className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm font-mono whitespace-pre-wrap h-64 overflow-auto">
                {output || 'Click RUN to execute your code.'}
              </pre>
            </div>

            <button
              onClick={handleRun}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-lg transition"
            >
              {loading ? 'Running...' : '▶ RUN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}