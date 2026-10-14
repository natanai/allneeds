import { useEffect, useRef } from 'react';

export function useWorkflowDraftPersistence<T>(
  draft: T,
  writeDraft: (value: T) => unknown,
  delay = 180,
  onPersistence?: (error: unknown | null) => void,
) {
  const feedback = useRef(onPersistence);
  feedback.current = onPersistence;
  const latestDraft = useRef(draft);
  latestDraft.current = draft;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { writeDraft(latestDraft.current); feedback.current?.(null); } catch (error) { feedback.current?.(error); }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay, draft, writeDraft]);

  useEffect(() => {
    const flush = () => {
      try { writeDraft(latestDraft.current); feedback.current?.(null); } catch (error) { feedback.current?.(error); }
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
