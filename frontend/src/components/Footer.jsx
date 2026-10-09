import { Link } from 'react-router-dom';

const YEAR = new Date().getFullYear();

function Icon({ path, label }) {
  return (
    <a
      href={path}
      target="_blank"
      rel="noreferrer"
      className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition"
      title={label}
      aria-label={label}
    >
      {label === 'GitHub' && (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5z" />
        </svg>
      )}
      {label === 'LinkedIn' && (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.13 1.44-2.13 2.94v5.66H9.37V9h3.4v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.58 0 4.24 2.36 4.24 5.42v6.32zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
      )}
      {label === 'Website' && (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-800/60 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg viewBox="0 0 640 640" className="w-4 h-4 fill-white">
                    <path d="M392.8 65.2C375.8 60.3 358.1 70.2 353.2 87.2L225.2 535.2C220.3 552.2 230.2 569.9 247.2 574.8C264.2 579.7 281.9 569.8 286.8 552.8L414.8 104.8C419.7 87.8 409.8 70.1 392.8 65.2zM457.4 201.3C444.9 213.8 444.9 234.1 457.4 246.6L530.8 320L457.4 393.4C444.9 405.9 444.9 426.2 457.4 438.7C469.9 451.2 490.2 451.2 502.7 438.7L598.7 342.7C611.2 330.2 611.2 309.9 598.7 297.4L502.7 201.4C490.2 188.9 469.9 188.9 457.4 201.4zM182.7 201.3C170.2 188.8 149.9 188.8 137.4 201.3L41.4 297.3C28.9 309.8 28.9 330.1 41.4 342.6L137.4 438.6C149.9 451.1 170.2 451.1 182.7 438.6C195.2 426.1 195.2 405.8 182.7 393.3L109.3 320L182.6 246.6C195.1 234.1 195.1 213.8 182.6 201.3z"/>
                  </svg>
              </div>
              <span className="font-bold gradient-text">CodeAssess</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Online programming examination platform. Built as a final year project.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Project
            </h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/practice" className="hover:text-gray-300">Practice compiler</Link></li>
              <li><Link to="/login" className="hover:text-gray-300">Sign in</Link></li>
              <li><Link to="/register" className="hover:text-gray-300">Register</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Connect
            </h4>
            <div className="flex gap-2">
              <Icon path="https://github.com/iamthearafatkhan" label="GitHub" />
              <Icon path="https://linkedin.com/in/iamthearafatkhan" label="LinkedIn" />
              <Icon path="https://arafatkhan.vercel.app" label="Website" />
            </div>
            <p className="text-xs text-gray-600 mt-4">
              © {YEAR} Arafat Khan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}