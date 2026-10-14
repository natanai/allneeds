import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { readAlexithymiaDraft } from '../../persistence/workflowDrafts';
import styles from './AlexithymiaSupportPage.module.css';

// History can restore this visit, but an independent reload still offers fresh/continue.
export const checkInVisit = globalThis.crypto?.randomUUID?.() ?? `visit-${Date.now()}-${Math.random()}`;
export type CheckInLocationState = {
  checkIn?: { visit: string; id: string; stage: number; restoreScroll?: boolean; previousStage?: number };
  returnToCheckIn?: { id: string };
};

type ReturnContext = NonNullable<CheckInLocationState['returnToCheckIn']>;
const CheckInContext = createContext<ReturnContext | null>(null);

// Keep the handoff connected while someone follows further reference links.
// Returning to the check-in ends the excursion; a new app visit starts fresh.
export function CheckInNavigationProvider({ children }: { children: ReactNode }) {
  const { pathname, state } = useLocation();
  const routed = (state as CheckInLocationState | null)?.returnToCheckIn;
  const inCheckIn = pathname === '/alexithymia-support';
  const [context, setContext] = useState<ReturnContext | null>(routed ?? null);
  useEffect(() => {
    if (inCheckIn) setContext(null);
    else if (routed?.id) setContext((current) => current?.id === routed.id ? current : routed);
  }, [inCheckIn, routed?.id]);
  return <CheckInContext.Provider value={inCheckIn ? null : routed ?? context}>{children}</CheckInContext.Provider>;
}

export function useCheckInReturnContext() {
  return useContext(CheckInContext);
}

export function CheckInReturn() {
  const context = useCheckInReturnContext();
  if (!context) return null;
  const draft = readAlexithymiaDraft();
  if (!draft || draft.checkInId !== context.id) return null;
  return <div className={styles.returnNotice}>
    <span>Your check-in is still available.</span>
    <Link to="/alexithymia-support" state={{ checkIn: {
      visit: checkInVisit, id: context.id, stage: draft.stage, restoreScroll: true,
    } } satisfies CheckInLocationState}>Return to check-in</Link>
  </div>;
}
