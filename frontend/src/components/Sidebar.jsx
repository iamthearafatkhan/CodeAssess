import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');
}

function Avatar({ user, size = 48 }) {
  const { refreshUser } = useAuth();
  const displayName =
    `${user.first_name} ${user.last_name}`.trim() || user.email;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2 MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:8000/api/'
        : 'https://codeassess-backend-i1ec.onrender.com/api/';

      await fetch(`${apiUrl}me/avatar/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access')}`,
        },
        body: formData,
      }).then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Upload failed');
        }
        return r.json();
      });
      await refreshUser();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <label className="cursor-pointer group relative">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={displayName}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full bg-blue-600 flex items-center justify-center font-bold"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {initials(displayName)}
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs">
        Change
      </div>
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </label>
  );
}

export default function Sidebar({ navItems = [] }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const profile = user.profile || {};
  const displayName =
    `${user.first_name} ${user.last_name}`.trim() || user.email;

  const primaryId =
    user.role === 'STUDENT' ? profile.student_id : profile.teacher_id;
  const idLabel = user.role === 'STUDENT' ? 'Student ID' : 'Teacher ID';

  return (
    <aside className="w-64 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="font-semibold truncate">{displayName}</div>
            <div className="text-xs text-gray-400">
              {user.role === 'STUDENT' ? 'Student' : 'Teacher'}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-400 space-y-1">
          {primaryId && (
            <div>
              <span className="text-gray-500">{idLabel}:</span>{' '}
              <span className="font-mono">{primaryId}</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block px-3 py-2 rounded mb-1 text-sm ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-800"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}