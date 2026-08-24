import { useEffect, useRef } from 'react';

export function useWorkflowDraftPersistence<T>(
  draft: T,
  writeDraft: (value: T) => unknown,
  delay = 180,
) {
  const latestDraft = useRef(draft);
  latestDraft.current = draft;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { writeDraft(latestDraft.current); } catch { /* Keep the workflow usable in restricted storage contexts. */ }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay, draft, writeDraft]);

  useEffect(() => {
    const flush = () => {
      try { writeDraft(latestDraft.current); } catch { /* Keep the workflow usable in restricted storage contexts. */ }
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, [writeDraft]);

  return latestDraft;
}
