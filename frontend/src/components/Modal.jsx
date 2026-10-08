import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, actions }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        <div className="text-sm text-gray-300 mb-5">{children}</div>
        {actions && <div className="flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}