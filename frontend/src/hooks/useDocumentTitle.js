import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · CodeExam` : 'CodeExam';
    return () => { document.title = previous; };
  }, [title]);
}