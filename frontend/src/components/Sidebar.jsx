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

const NAV_ICONS = {
  Dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  'Join Exam': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  'My Results': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  ),
  Practice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Submissions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

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
          className="rounded-full object-cover ring-2 ring-blue-500/30 group-hover:ring-blue-500/60 transition"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white ring-2 ring-blue-500/30 group-hover:ring-blue-500/60 transition"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {initials(displayName)}
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-semibold text-white transition">
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
    <aside className="w-64 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col h-screen sticky top-0 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-blue-500/30">
            <svg viewBox="0 0 640 640" className="w-5 h-5 fill-white">
              <path d="M392.8 65.2C375.8 60.3 358.1 70.2 353.2 87.2L225.2 535.2C220.3 552.2 230.2 569.9 247.2 574.8C264.2 579.7 281.9 569.8 286.8 552.8L414.8 104.8C419.7 87.8 409.8 70.1 392.8 65.2zM457.4 201.3C444.9 213.8 444.9 234.1 457.4 246.6L530.8 320L457.4 393.4C444.9 405.9 444.9 426.2 457.4 438.7C469.9 451.2 490.2 451.2 502.7 438.7L598.7 342.7C611.2 330.2 611.2 309.9 598.7 297.4L502.7 201.4C490.2 188.9 469.9 188.9 457.4 201.4zM182.7 201.3C170.2 188.8 149.9 188.8 137.4 201.3L41.4 297.3C28.9 309.8 28.9 330.1 41.4 342.6L137.4 438.6C149.9 451.1 170.2 451.1 182.7 438.6C195.2 426.1 195.2 405.8 182.7 393.3L109.3 320L182.6 246.6C195.1 234.1 195.1 213.8 182.6 201.3z" />
            </svg>
          </div>
          <span className="font-bold gradient-text text-lg">CodeAssess</span>
        </div>
      </div>

      {/* Profile card */}
      <div className="relative p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="font-semibold truncate">{displayName}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${user.role === 'STUDENT' ? 'bg-green-400' : 'bg-purple-400'} animate-pulse`} />
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

      {/* Nav */}
      <nav className="relative flex-1 p-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all duration-200 overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-300 hover:bg-gray-800/60 hover:translate-x-0.5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
                  {NAV_ICONS[item.label] || (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="relative p-3 border-t border-gray-800">
        <button
          onClick={logout}
          className="group w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:text-white border border-gray-800 hover:border-red-500/60 hover:bg-red-500/10 transition-all duration-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform group-hover:translate-x-0.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}