import { createContext, useContext } from 'react';

const STORAGE_KEY = 'fedha.officer.session';

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function storeSession(session) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** { session, signIn(session), signOut() } — provided by App. */
export const SessionContext = createContext({
  session: null,
  signIn: () => {},
  signOut: () => {},
});

export const useSession = () => useContext(SessionContext);
